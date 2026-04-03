"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleConversationModeAction(formData: FormData) {
  const conversationId = String(formData.get("conversationId") ?? "");
  const manualMode = String(formData.get("manualMode") ?? "") === "true";

  if (!conversationId) {
    throw new Error("Conversa invalida");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessao invalida");
  }

  const nextManualMode = !manualMode;
  const nextOwner = nextManualMode ? "voce" : "bot";
  const nextStage = nextManualMode ? "Aguardando voce" : "Fluxo automatico";

  const { error } = await supabase
    .from("conversations")
    .update({
      manual_mode: nextManualMode,
      owner: nextOwner,
      stage: nextStage,
      updated_at: new Date().toISOString()
    })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/conversations");
  revalidatePath("/dashboard");
}
