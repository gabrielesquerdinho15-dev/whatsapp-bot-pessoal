import { createClient } from "@/lib/supabase/server";
import { Lead } from "@/types/app";

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

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, phone, status, updated_at")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((lead) => ({
    id: String(lead.id),
    name: lead.name ? String(lead.name) : "Sem nome",
    phone: String(lead.phone),
    status: lead.status as Lead["status"],
    updatedAt: formatUpdatedAt(String(lead.updated_at))
  }));
}
