import { createAdminClient } from "../../lib/supabase/admin";
import { getAutomationAdmin } from "../../lib/automation-admin";
import { sendInitialAutomationForConversation } from "../../lib/automation-runner";

export const config = {
  schedule: "*/1 * * * *"
};

export default async function processQueuedAutomation() {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile) {
    return new Response(null, { status: 200 });
  }

  const automation = await getAutomationAdmin(String(profile.id));

  if (!automation) {
    return new Response(null, { status: 200 });
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, lead_id, manual_mode, scheduled_reply_at, initial_response_sent")
    .eq("manual_mode", false)
    .eq("initial_response_sent", false)
    .not("scheduled_reply_at", "is", null)
    .lte("scheduled_reply_at", new Date().toISOString())
    .order("scheduled_reply_at", { ascending: true })
    .limit(20);

  if (error) {
    throw error;
  }

  let processed = 0;

  for (const conversation of conversations ?? []) {
    if (!conversation.lead_id) {
      continue;
    }

    const { data: lead } = await supabase
      .from("leads")
      .select("phone")
      .eq("id", conversation.lead_id)
      .maybeSingle();

    if (!lead?.phone) {
      continue;
    }

    await sendInitialAutomationForConversation({
      supabase,
      automation,
      conversationId: String(conversation.id),
      phone: String(lead.phone)
    });

    processed += 1;
  }

  return new Response(JSON.stringify({ ok: true, processed }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
