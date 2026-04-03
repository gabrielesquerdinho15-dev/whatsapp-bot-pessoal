import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";
import { getConversations } from "@/lib/conversations";
import { getAutomation } from "@/lib/automation";

export default async function DashboardPage() {
  const user = await requireUser();
  const [summary, conversations, automation] = await Promise.all([
    getDashboardSummary(),
    getConversations(),
    getAutomation(user.id)
  ]);

  const waitingConversations = conversations.slice(0, 5);

  return (
    <AppShell
      title="Seu painel do dia"
      description="Uma visao simples do que entrou no seu WhatsApp, do que o bot respondeu e do que precisa da sua atencao."
      user={user}
    >
      <section className="metrics">
        <article className="panel section-card">
          <p className="card-title">Leads no CRM</p>
          <span className="metric-value">{summary.leadCount}</span>
        </article>
        <article className="panel section-card">
          <p className="card-title">Conversas abertas</p>
          <span className="metric-value">{summary.openConversations}</span>
        </article>
        <article className="panel section-card">
          <p className="card-title">Respostas automaticas hoje</p>
          <span className="metric-value">{summary.autoRepliesToday}</span>
        </article>
        <article className="panel section-card">
          <p className="card-title">Fila manual</p>
          <span className="metric-value">{summary.manualQueue}</span>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel section-card">
          <div className="section-header">
            <h2>Conversas esperando voce</h2>
            <a className="btn-secondary" href="/conversations">
              Ver conversas
            </a>
          </div>
          <div className="timeline">
            {waitingConversations.length > 0 ? (
              waitingConversations.map((conversation) => (
                <div className="timeline-item" key={conversation.id}>
                  <strong>{conversation.leadName}</strong>
                  <p className="subtle">{conversation.lastMessage}</p>
                  <span className="pill">{conversation.manualMode ? "Voce assume daqui" : "Bot conduzindo"}</span>
                </div>
              ))
            ) : (
              <div className="timeline-item">
                <strong>Nenhuma conversa ainda</strong>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  Assim que chegar mensagem pelo webhook, ela aparece aqui.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="panel section-card">
          <div className="section-header">
            <h2>Automacoes prontas</h2>
            <a className="btn-secondary" href="/flows">
              Abrir automacao
            </a>
          </div>
          <div className="list">
            {automation ? (
              <div className="list-item">
                <strong>{automation.name}</strong>
                <p className="subtle">
                  {automation.steps.length} etapas ativas. Mensagem inicial: {automation.welcomeMessage || "Sem mensagem definida"}.
                </p>
              </div>
            ) : (
              <div className="list-item">
                <strong>Nenhuma automacao ativa</strong>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  Abra a tela de fluxos para criar sua automacao principal.
                </p>
              </div>
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
