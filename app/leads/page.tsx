import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getLeads } from "@/lib/leads";

export default async function LeadsPage() {
  const user = await requireUser();
  const leads = await getLeads();

  return (
    <AppShell
      title="Leads"
      description="Seu CRM leve para acompanhar contatos vindos do WhatsApp sem virar um sistema pesado."
      user={user}
    >
      <section className="panel table-card">
        <div className="section-header">
          <h2>Base de leads</h2>
          <button className="btn">Cadastrar manualmente</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>
                    <span className="pill">{lead.status}</span>
                  </td>
                  <td>{lead.updatedAt}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <span className="subtle">Nenhum lead ainda. O proximo passo e inserir um lead de teste no Supabase.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
