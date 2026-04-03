import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getAutomation } from "@/lib/automation";
import { saveAutomationAction } from "@/app/flows/actions";

function getStep(
  steps: Array<{ order: number; type: string; title: string; content: string }>,
  order: number,
  fallbackTitle: string,
  fallbackContent: string
) {
  const step = steps.find((item) => item.order === order);

  return {
    title: step?.title ?? fallbackTitle,
    content: step?.content ?? fallbackContent
  };
}

export default async function FlowsPage() {
  const user = await requireUser();
  const automation = await getAutomation(user.id);

  const steps = automation?.steps ?? [];
  const automationName = automation?.name ?? "Automacao principal";
  const initialDelayMinutes = automation?.initialDelayMinutes ?? 0;
  const welcomeStep = getStep(
    steps,
    1,
    "Mensagem inicial",
    automation?.welcomeMessage || "Ola. Obrigado por entrar em contato. Vou te fazer duas perguntas rapidas."
  );
  const questionNameStep = getStep(steps, 2, "Coletar nome", "Qual e o seu nome?");
  const questionInterestStep = getStep(steps, 3, "Entender interesse", "O que voce procura hoje?");
  const qualifyStep = getStep(steps, 4, "Atualizar lead", "Marcar como qualificado");
  const handoffStep = getStep(steps, 5, "Transferir para voce", "Parar o bot e te avisar para assumir");

  return (
    <AppShell
      title="Sua automacao"
      description="Edite aqui a sequencia curta do seu atendimento sem precisar abrir o SQL Editor."
      user={user}
    >
      <section className="grid-2">
        <article className="panel section-card">
          <div className="section-header">
            <div>
              <h2>{automation ? "Automacao ativa" : "Criar automacao"}</h2>
              <p className="subtle">
                {automation ? "A tela ja esta lendo e salvando no Supabase." : "Salve sua primeira automacao pessoal por aqui."}
              </p>
            </div>
            <span className="pill">{automation?.isActive ? "Ativa" : "Pronta para criar"}</span>
          </div>

          <form action={saveAutomationAction} className="form-grid">
            <label className="field">
              <span>Nome da automacao</span>
              <input defaultValue={automationName} name="name" />
            </label>

            <label className="field">
              <span>Esperar quantos minutos antes da primeira mensagem</span>
              <input defaultValue={initialDelayMinutes} min={0} name="initialDelayMinutes" type="number" />
            </label>

            <label className="field">
              <span>Titulo da mensagem inicial</span>
              <input defaultValue={welcomeStep.title} name="welcomeTitle" />
            </label>

            <label className="field">
              <span>Mensagem inicial</span>
              <textarea defaultValue={welcomeStep.content} name="welcomeMessage" rows={4} />
            </label>

            <label className="field">
              <span>Titulo da pergunta de nome</span>
              <input defaultValue={questionNameStep.title} name="questionNameTitle" />
            </label>

            <label className="field">
              <span>Pergunta de nome</span>
              <textarea defaultValue={questionNameStep.content} name="questionName" rows={3} />
            </label>

            <label className="field">
              <span>Titulo da pergunta de interesse</span>
              <input defaultValue={questionInterestStep.title} name="questionInterestTitle" />
            </label>

            <label className="field">
              <span>Pergunta de interesse</span>
              <textarea defaultValue={questionInterestStep.content} name="questionInterest" rows={3} />
            </label>

            <label className="field">
              <span>Titulo da qualificacao</span>
              <input defaultValue={qualifyStep.title} name="qualifyTitle" />
            </label>

            <label className="field">
              <span>Texto de qualificacao</span>
              <input defaultValue={qualifyStep.content} name="qualifyLabel" />
            </label>

            <label className="field">
              <span>Titulo da entrega para voce</span>
              <input defaultValue={handoffStep.title} name="handoffTitle" />
            </label>

            <label className="field">
              <span>Mensagem de entrega para voce</span>
              <textarea defaultValue={handoffStep.content} name="handoffMessage" rows={3} />
            </label>

            <button className="btn" type="submit">
              Salvar automacao
            </button>
          </form>
        </article>

        <article className="panel section-card">
          <div className="section-header">
            <h2>Resumo do fluxo</h2>
          </div>
          <p className="subtle" style={{ marginTop: 0 }}>
            Primeira mensagem enviada {initialDelayMinutes === 0 ? "imediatamente" : `${initialDelayMinutes} minuto(s) depois`}.
          </p>
          <div className="steps">
            {[
              { order: 1, title: welcomeStep.title, content: welcomeStep.content, type: "message" },
              { order: 2, title: questionNameStep.title, content: questionNameStep.content, type: "question" },
              { order: 3, title: questionInterestStep.title, content: questionInterestStep.content, type: "question" },
              { order: 4, title: qualifyStep.title, content: qualifyStep.content, type: "assign_status" },
              { order: 5, title: handoffStep.title, content: handoffStep.content, type: "handoff" }
            ].map((step) => (
              <div className="step-card" key={step.order}>
                <div>
                  <span className="step-index">{step.order}</span>
                  <strong>{step.title}</strong>
                </div>
                <p className="subtle" style={{ marginBottom: 0 }}>
                  {step.type} | {step.content}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
