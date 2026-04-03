"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const defaultSteps = [
  { order: 1, type: "message", titleField: "welcomeTitle", contentField: "welcomeMessage", fallbackTitle: "Mensagem inicial" },
  { order: 2, type: "question", titleField: "questionNameTitle", contentField: "questionName", fallbackTitle: "Coletar nome" },
  { order: 3, type: "question", titleField: "questionInterestTitle", contentField: "questionInterest", fallbackTitle: "Entender interesse" },
  { order: 4, type: "assign_status", titleField: "qualifyTitle", contentField: "qualifyLabel", fallbackTitle: "Atualizar lead" },
  { order: 5, type: "handoff", titleField: "handoffTitle", contentField: "handoffMessage", fallbackTitle: "Transferir para voce" }
] as const;

export async function saveAutomationAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessao invalida");
  }

  const name = String(formData.get("name") ?? "Automacao principal").trim() || "Automacao principal";
  const welcomeMessage = String(formData.get("welcomeMessage") ?? "").trim();
  const questionName = String(formData.get("questionName") ?? "").trim();
  const questionInterest = String(formData.get("questionInterest") ?? "").trim();
  const qualifyLabel = String(formData.get("qualifyLabel") ?? "").trim();
  const handoffMessage = String(formData.get("handoffMessage") ?? "").trim();
  const welcomeTitle = String(formData.get("welcomeTitle") ?? "").trim() || "Mensagem inicial";
  const questionNameTitle = String(formData.get("questionNameTitle") ?? "").trim() || "Coletar nome";
  const questionInterestTitle = String(formData.get("questionInterestTitle") ?? "").trim() || "Entender interesse";
  const qualifyTitle = String(formData.get("qualifyTitle") ?? "").trim() || "Atualizar lead";
  const handoffTitle = String(formData.get("handoffTitle") ?? "").trim() || "Transferir para voce";

  const stepValues = {
    welcomeMessage: { title: welcomeTitle, content: welcomeMessage },
    questionName: { title: questionNameTitle, content: questionName },
    questionInterest: { title: questionInterestTitle, content: questionInterest },
    qualifyLabel: { title: qualifyTitle, content: qualifyLabel },
    handoffMessage: { title: handoffTitle, content: handoffMessage }
  };

  const { data: existing } = await supabase
    .from("automation_settings")
    .select("id")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let automationId = existing?.id as string | undefined;

  if (automationId) {
    const { error } = await supabase
      .from("automation_settings")
      .update({
        name,
        welcome_message: welcomeMessage,
        is_active: true
      })
      .eq("id", automationId)
      .eq("profile_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    await supabase.from("automation_steps").delete().eq("automation_id", automationId);
  } else {
    const { data, error } = await supabase
      .from("automation_settings")
      .insert({
        profile_id: user.id,
        name,
        welcome_message: welcomeMessage,
        is_active: true
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Nao foi possivel criar a automacao");
    }

    automationId = String(data.id);
  }

  const stepsToInsert = defaultSteps.map((step) => ({
    automation_id: automationId,
    step_order: step.order,
    step_type: step.type,
    title: stepValues[step.contentField].title || step.fallbackTitle,
    content: stepValues[step.contentField].content
  }));

  const { error: stepsError } = await supabase.from("automation_steps").insert(stepsToInsert);

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  revalidatePath("/flows");
}
