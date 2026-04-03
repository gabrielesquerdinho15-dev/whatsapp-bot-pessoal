"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { AuthUser } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/conversations", label: "Conversas" },
  { href: "/leads", label: "Leads" },
  { href: "/flows", label: "Fluxos" },
  { href: "/templates", label: "Templates" }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export function AppShell({
  title,
  description,
  user,
  children
}: {
  title: string;
  description: string;
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="shell">
      <div className="app-grid">
        <aside className="panel sidebar">
          <span className="badge">MEU BOT</span>
          <h2 style={{ marginBottom: 8 }}>WhatsApp Bot Pessoal</h2>
          <p className="subtle" style={{ marginTop: 0 }}>
            {user.fullName} | {user.whatsappLabel}
          </p>

          <nav className="nav">
            {links.map((link) => (
              <Link key={link.href} href={link.href} data-active={pathname === link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="list-item">
            <strong>{user.email}</strong>
            <p className="subtle" style={{ marginBottom: 0 }}>
              Sessao ativa com Supabase Auth.
            </p>
          </div>

          <form action={logoutAction} style={{ marginTop: 16 }}>
            <button className="btn-secondary" style={{ width: "100%" }} type="submit">
              Sair
            </button>
          </form>
        </aside>

        <section className="content">
          <header className="panel hero">
            <span className="badge">MVP enxuto</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
