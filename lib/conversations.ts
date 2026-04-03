import { createClient } from "@/lib/supabase/server";
import { Conversation } from "@/types/app";

function formatUpdatedAt(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, stage, owner, last_message, updated_at, manual_mode, leads(name)")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((conversation) => {
    const leadName =
      conversation.leads && typeof conversation.leads === "object" && "name" in conversation.leads
        ? String(conversation.leads.name ?? "Lead sem nome")
        : "Lead sem nome";

    return {
      id: String(conversation.id),
      leadName,
      stage: String(conversation.stage),
      owner: conversation.owner === "voce" ? "voce" : "bot",
      lastMessage: conversation.last_message ? String(conversation.last_message) : "Sem mensagem recente",
      updatedAt: formatUpdatedAt(String(conversation.updated_at)),
      manualMode: Boolean(conversation.manual_mode)
    };
  });
}
