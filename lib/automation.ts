import { createClient } from "@/lib/supabase/server";
import { AutomationConfig } from "@/types/app";
import { createAdminClient } from "@/lib/supabase/admin";

async function loadAutomation(
  supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>,
  profileId: string
): Promise<AutomationConfig | null> {
  const typedClient = supabase;

  const { data: automation, error } = await typedClient
    .from("automation_settings")
    .select("id, name, welcome_message, is_active")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !automation) {
    return null;
  }

  const { data: steps, error: stepsError } = await typedClient
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

export async function getAutomation(profileId: string): Promise<AutomationConfig | null> {
  const supabase = await createClient();
  return loadAutomation(supabase, profileId);
}

export async function getAutomationAdmin(profileId: string): Promise<AutomationConfig | null> {
  const supabase = createAdminClient();
  return loadAutomation(supabase, profileId);
}
