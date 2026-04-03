import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  whatsappLabel: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, whatsapp_label")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? user.email ?? "Usuario",
    whatsappLabel: profile?.whatsapp_label ?? "Meu WhatsApp"
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
