import { createAdminClient } from "@/lib/supabase/admin";
import { getAutomationAdmin } from "@/lib/automation-admin";
import { sendZApiText } from "@/lib/zapi";
import { sendInitialAutomationForConversation } from "@/lib/automation-runner";

interface WebhookPayload {
  phone: string;
  message: string;
  name?: string;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function processIncomingWhatsapp(payload: WebhookPayload) {
  const supabase = createAdminClient();
  const phone = normalizePhone(payload.phone);
  const message = String(payload.message ?? "").trim();

  if (!phone || !message) {
    throw new Error("Phone and message are required");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile) {
    throw new Error("No profile configured");
  }

  const automation = await getAutomationAdmin(String(profile.id));

  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, name, status")
    .eq("phone", phone)
    .maybeSingle();

  let leadId = existingLead?.id as string | undefined;
  let leadName = existingLead?.name ? String(existingLead.name) : "";

  if (!leadId) {
    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        phone,
        name: payload.name?.trim() || null,
        status: "novo",
        source: "whatsapp"
      })
      .select("id, name")
      .single();

    if (error || !newLead) {
      throw new Error(error?.message ?? "Could not create lead");
    }

    leadId = String(newLead.id);
    leadName = newLead.name ? String(newLead.name) : "";
  }

  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id, stage, manual_mode, owner, scheduled_reply_at, initial_response_sent")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = existingConversation?.id as string | undefined;
  let stage = existingConversation?.stage ? String(existingConversation.stage) : "entrada";
  let manualMode = Boolean(existingConversation?.manual_mode);
  let scheduledReplyAt = existingConversation?.scheduled_reply_at ? String(existingConversation.scheduled_reply_at) : null;
  let initialResponseSent = Boolean(existingConversation?.initial_response_sent);

  if (!conversationId) {
    const initialDelayMinutes = Math.max(0, Number(automation?.initialDelayMinutes ?? 0));
    const replyAt = initialDelayMinutes > 0 ? new Date(Date.now() + initialDelayMinutes * 60_000).toISOString() : null;

    const { data: newConversation, error } = await supabase
      .from("conversations")
      .insert({
        lead_id: leadId,
        stage: "entrada",
        manual_mode: false,
        initial_response_sent: false,
        owner: "bot",
        last_message: message,
        scheduled_reply_at: replyAt
      })
      .select("id, stage, manual_mode, scheduled_reply_at, initial_response_sent")
      .single();

    if (error || !newConversation) {
      throw new Error(error?.message ?? "Could not create conversation");
    }

    conversationId = String(newConversation.id);
    stage = String(newConversation.stage);
    manualMode = Boolean(newConversation.manual_mode);
    scheduledReplyAt = newConversation.scheduled_reply_at ? String(newConversation.scheduled_reply_at) : null;
    initialResponseSent = Boolean(newConversation.initial_response_sent);
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "inbound",
    content: message
  });

  const outboundMessages: string[] = [];
  const welcomeStep = automation?.steps.find((step) => step.order === 1);
  const nameStep = automation?.steps.find((step) => step.order === 2);

  if (!manualMode && automation && automation.steps.length > 0) {
    const interestStep = automation.steps.find((step) => step.order === 3);
    const handoffStep = automation.steps.find((step) => step.order === 5);

    if (!initialResponseSent) {
      const delayReached = !scheduledReplyAt || new Date(scheduledReplyAt).getTime() <= Date.now();

      if (delayReached) {
        const initialRun = await sendInitialAutomationForConversation({
          supabase,
          automation,
          conversationId,
          phone
        });

        outboundMessages.push(...initialRun.outboundMessages);
        stage = initialRun.stage;
        initialResponseSent = true;
      }
    } else if (nameStep && stage === nameStep.title) {
      leadName = message;
      await supabase.from("leads").update({ name: leadName, updated_at: new Date().toISOString() }).eq("id", leadId);

      if (interestStep?.content) {
        outboundMessages.push(interestStep.content);
        stage = interestStep.title;
      }
    } else if (interestStep && stage === interestStep.title) {
      await supabase.from("leads").update({ status: "qualificado", updated_at: new Date().toISOString() }).eq("id", leadId);

      if (handoffStep?.content) {
        outboundMessages.push(handoffStep.content);
      }

      stage = handoffStep?.title ?? "Aguardando voce";
      manualMode = true;
    }
  }

  if (outboundMessages.length > 0) {
    const hasInitialMessages = Boolean(welcomeStep?.content || nameStep?.content);
    const alreadySentInitialNow =
      initialResponseSent && hasInitialMessages && outboundMessages.every((content) => [welcomeStep?.content, nameStep?.content].includes(content));

    if (!alreadySentInitialNow) {
      await supabase.from("messages").insert(
        outboundMessages.map((content) => ({
          conversation_id: conversationId,
          direction: "outbound",
          content
        }))
      );

      for (const content of outboundMessages) {
        await sendZApiText({
          phone,
          message: content
        });
      }
    }
  }

  const conversationPayload: Record<string, unknown> = {
    stage,
    manual_mode: manualMode,
    owner: manualMode ? "voce" : "bot",
    last_message: outboundMessages.at(-1) ?? message,
    updated_at: new Date().toISOString()
  };

  if (initialResponseSent) {
    conversationPayload.initial_response_sent = true;
    conversationPayload.scheduled_reply_at = null;
  }

  await supabase.from("conversations").update(conversationPayload).eq("id", conversationId);

  return {
    ok: true,
    leadId,
    conversationId,
    leadName,
    outboundMessages
  };
}
