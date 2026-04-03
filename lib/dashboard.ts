import { createClient } from "@/lib/supabase/server";

export interface DashboardSummary {
  leadCount: number;
  openConversations: number;
  autoRepliesToday: number;
  manualQueue: number;
}

function startOfTodayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  const today = startOfTodayIso();

  const [leadsResult, conversationsResult, manualResult, messagesResult] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("manual_mode", true),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("direction", "outbound")
      .gte("created_at", today)
  ]);

  return {
    leadCount: leadsResult.count ?? 0,
    openConversations: conversationsResult.count ?? 0,
    autoRepliesToday: messagesResult.count ?? 0,
    manualQueue: manualResult.count ?? 0
  };
}
