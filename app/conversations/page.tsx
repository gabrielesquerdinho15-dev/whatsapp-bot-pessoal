import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getConversations } from "@/lib/conversations";
import { toggleConversationModeAction } from "@/app/conversations/actions";

export default async function ConversationsPage() {
  const user = await requireUser();
  const conversations = await getConversations();

  return (
    <AppShell
      title="Conversas"
      description="Aqui voce acompanha o que o bot esta fazendo no seu WhatsApp e decide quando entrar manualmente."
      user={user}
    >
      <section className="panel table-card">
        <div className="section-header">
          <h2>Caixa de entrada</h2>
          <button className="btn">Nova conversa teste</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Etapa</th>
              <th>Quem responde</th>
              <th>Ultima mensagem</th>
              <th>Atualizado</th>
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{conversation.leadName}</td>
                  <td>{conversation.stage}</td>
                  <td>{conversation.owner === "bot" ? "Bot" : "Voce"}</td>
                <td>{conversation.lastMessage}</td>
                <td>{conversation.updatedAt}</td>
                <td>
                  <form action={toggleConversationModeAction}>
                    <input name="conversationId" type="hidden" value={conversation.id} />
                    <input name="manualMode" type="hidden" value={String(conversation.manualMode)} />
                    <button className="btn-secondary" type="submit">
                      {conversation.manualMode ? "Voltar para o bot" : "Assumir agora"}
                    </button>
                  </form>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <span className="subtle">Nenhuma conversa ainda. O proximo passo e inserir uma conversa de teste no Supabase.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
