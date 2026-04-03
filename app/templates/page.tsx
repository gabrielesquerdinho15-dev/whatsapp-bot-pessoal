import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { templates } from "@/lib/mock-data";

export default async function TemplatesPage() {
  const user = await requireUser();

  return (
    <AppShell
      title="Modelos prontos"
      description="Voce pode escolher um modelo curto, ajustar o texto e usar no seu proprio atendimento."
      user={user}
    >
      <section className="grid-2">
        {templates.map((template) => (
          <article className="panel section-card" key={template.id}>
            <span className="badge">Modelo</span>
            <h2 style={{ marginTop: 16, fontSize: "2rem" }}>{template.name}</h2>
            <p className="subtle">{template.summary}</p>
            <div className="list" style={{ margin: "18px 0" }}>
              {template.steps.map((step) => (
                <div className="list-item" key={`${template.id}-${step.label}`}>
                  <strong>{step.label}</strong>
                  <p className="subtle" style={{ marginBottom: 0 }}>
                    {step.type}
                  </p>
                </div>
              ))}
            </div>
            <button className="btn">Usar modelo</button>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
