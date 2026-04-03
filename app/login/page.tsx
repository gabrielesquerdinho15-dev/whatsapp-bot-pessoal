import { loginAction } from "@/app/login/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="login-shell">
      <section className="panel login-card">
        <div className="login-side">
          <span className="badge" style={{ background: "rgba(255,255,255,0.14)", color: "white", borderColor: "rgba(255,255,255,0.24)" }}>
            Projeto pessoal
          </span>
          <h1 style={{ fontSize: "3rem", lineHeight: 1, marginBottom: 12 }}>Bot simples para o seu WhatsApp</h1>
          <p>
            Uma versao leve para voce organizar leads, responder mais rapido e assumir manualmente quando precisar.
          </p>
        </div>

        <div className="login-form">
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 6 }}>Entrar</h2>
            <p className="subtle">Login real por email e senha usando Supabase Auth.</p>
          </div>

          <form action={loginAction} className="form-grid">
            <label className="field">
              <span>Email</span>
              <input defaultValue="seller@local.test" name="email" placeholder="voce@empresa.com" type="email" />
            </label>

            <label className="field">
              <span>Senha</span>
              <input defaultValue="12345678" name="password" type="password" />
            </label>

            {error ? <p style={{ color: "#9b2c2c", margin: 0 }}>{error}</p> : null}

            <button className="btn" type="submit">
              Entrar no painel
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
