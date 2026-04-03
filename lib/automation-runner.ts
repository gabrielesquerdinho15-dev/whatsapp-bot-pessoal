import { sendZApiText } from "./zapi";
import { AutomationConfig } from "../types/app";

interface SupabaseLike {
  from: (table: string) => any;
}

function getStep(automation: AutomationConfig, order: number) {
  return automation.steps.find((step) => step.order === order);
}

export async function sendInitialAutomationForConversation(params: {
  supabase: SupabaseLike;
  automation: AutomationConfig;
  conversationId: string;
  phone: string;
}) {
  const { supabase, automation, conversationId, phone } = params;
  const welcomeStep = getStep(automation, 1);
  const nameStep = getStep(automation, 2);
  const outboundMessages = [welcomeStep?.content, nameStep?.content].filter(
    (value): value is string => Boolean(value && value.trim())
  );

  if (outboundMessages.length > 0) {
    await supabase.from("messages").insert(
      outboundMessages.map((content) => ({
        conversation_id: conversationId,
        direction: "outbound",
        content
      }))
    );

    for (const content of outboundMessages) {
      await sendZApiText({ phone, message: content });
    }
  }

  const nextStage = nameStep?.title ?? "Aguardando resposta";

  await supabase
    .from("conversations")
    .update({
      stage: nextStage,
      initial_response_sent: true,
      last_message: outboundMessages.at(-1) ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", conversationId);

  return {
    outboundMessages,
    stage: nextStage
  };
}
