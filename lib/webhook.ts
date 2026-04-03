import { createAdminClient } from "@/lib/supabase/admin";
import { getAutomationAdmin } from "@/lib/automation";
import { sendZApiText } from "@/lib/zapi";

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
    .select("id, stage, manual_mode, owner")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = existingConversation?.id as string | undefined;
  let stage = existingConversation?.stage ? String(existingConversation.stage) : "entrada";
  let manualMode = Boolean(existingConversation?.manual_mode);

  if (!conversationId) {
    const { data: newConversation, error } = await supabase
      .from("conversations")
      .insert({
        lead_id: leadId,
        stage: "entrada",
        manual_mode: false,
        owner: "bot",
        last_message: message
      })
      .select("id, stage, manual_mode")
      .single();

    if (error || !newConversation) {
      throw new Error(error?.message ?? "Could not create conversation");
    }

    conversationId = String(newConversation.id);
    stage = String(newConversation.stage);
    manualMode = Boolean(newConversation.manual_mode);
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "inbound",
    content: message
  });

  const outboundMessages: string[] = [];

  if (!manualMode && automation && automation.steps.length > 0) {
    const welcomeStep = automation.steps.find((step) => step.order === 1);
    const nameStep = automation.steps.find((step) => step.order === 2);
    const interestStep = automation.steps.find((step) => step.order === 3);
    const qualifyStep = automation.steps.find((step) => step.order === 4);
    const handoffStep = automation.steps.find((step) => step.order === 5);

    if (stage === "entrada") {
      if (welcomeStep?.content) {
        outboundMessages.push(welcomeStep.content);
      }
      if (nameStep?.content) {
        outboundMessages.push(nameStep.content);
        stage = nameStep.title;
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

  await supabase
    .from("conversations")
    .update({
      stage,
      manual_mode: manualMode,
      owner: manualMode ? "voce" : "bot",
      last_message: outboundMessages.at(-1) ?? message,
      updated_at: new Date().toISOString()
    })
    .eq("id", conversationId);

  return {
    ok: true,
    leadId,
    conversationId,
    leadName,
    outboundMessages
  };
}
