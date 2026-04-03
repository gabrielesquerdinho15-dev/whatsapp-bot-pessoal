import { createAdminClient } from "./supabase/admin";
import { AutomationConfig } from "../types/app";

export async function getAutomationAdmin(profileId: string): Promise<AutomationConfig | null> {
  const supabase = createAdminClient();

  const { data: automation, error } = await supabase
    .from("automation_settings")
    .select("id, name, welcome_message, initial_delay_minutes, is_active")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !automation) {
    return null;
  }

  const { data: steps, error: stepsError } = await supabase
    .from("automation_steps")
    .select("id, step_order, step_type, title, content")
    .eq("automation_id", automation.id)
    .order("step_order", { ascending: true });

  if (stepsError) {
    return null;
  }

  return {
    id: String(automation.id),
    name: String(automation.name),
    welcomeMessage: automation.welcome_message ? String(automation.welcome_message) : "",
    initialDelayMinutes: Number(automation.initial_delay_minutes ?? 0),
    isActive: Boolean(automation.is_active),
    steps: (steps ?? []).map((step) => ({
      id: String(step.id),
      order: Number(step.step_order),
      type: step.step_type as AutomationConfig["steps"][number]["type"],
      title: String(step.title),
      content: step.content ? String(step.content) : ""
    }))
  };
}
