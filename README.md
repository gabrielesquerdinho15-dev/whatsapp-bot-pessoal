# WhatsApp Bot Pessoal

Projeto simplificado para voce usar no seu proprio numero de WhatsApp sem subir uma estrutura pesada.

## Stack

- Next.js
- Supabase
- TypeScript

## Escopo desta versao

- 1 usuario
- 1 WhatsApp principal
- login simples
- conversas
- leads
- automacao curta
- assumir manualmente
- modelos prontos

## Como rodar com pouca instalacao

Voce precisa basicamente de:

- Node.js

Depois:

1. Entre na pasta `simple-bot-mvp`.
2. Copie `.env.example` para `.env.local`.
3. Rode:

```bash
npm install
npm run dev
```

## Como testar o login

1. Crie um projeto no Supabase.
2. Em `Authentication > Users`, crie um usuario com email e senha.
3. Em `SQL Editor`, rode `supabase/schema.sql`.
4. Crie seu profile:

```sql
insert into profiles (id, full_name, whatsapp_label)
values (
  'COLE_O_UUID_DO_USUARIO_AQUI',
  'Gabriel',
  'Meu WhatsApp Principal'
);
```

5. Configure `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

6. Rode `npm run dev`.
7. Entre pela tela `/login`.

## Ordem mais rapida para deixar util

1. login funcionando
2. leads e conversas reais no Supabase
3. automacao curta salva no banco
4. webhook do WhatsApp
5. assumir manualmente

## Ideia do fluxo inicial

1. cliente manda mensagem
2. bot responde boas-vindas
3. pergunta nome
4. pergunta interesse
5. salva o lead
6. entrega para voce

## Inserir lead de teste

No `SQL Editor` do Supabase, rode:

```sql
insert into leads (name, phone, status)
values ('Lead Teste', '+5511999999999', 'novo');
```

Depois atualize a tela `/leads`.

## Inserir conversa de teste

Se voce ja tiver um lead criado, rode no `SQL Editor`:

```sql
insert into conversations (lead_id, stage, manual_mode, owner, last_message)
select id, 'entrada', false, 'bot', 'Ola. Vou te fazer duas perguntas rapidas.'
from leads
where phone = '+5511999999999'
limit 1;
```

Depois atualize a tela `/conversations`.

## Inserir mensagem automatica de teste

Se voce ja tiver uma conversa criada, rode:

```sql
insert into messages (conversation_id, direction, content)
select id, 'outbound', 'Ola. Vou te ajudar por aqui.'
from conversations
order by created_at desc
limit 1;
```

Depois atualize a tela `/dashboard`.

## Inserir automacao de teste

Primeiro crie a configuracao principal:

```sql
insert into automation_settings (profile_id, name, welcome_message, is_active)
values (
  '821c20a3-37da-4189-8a7c-4e6a0452bc20',
  'Automacao principal',
  'Ola. Obrigado por entrar em contato.',
  true
);
```

Depois crie os passos:

```sql
insert into automation_steps (automation_id, step_order, step_type, title, content)
select id, 1, 'message', 'Mensagem inicial', 'Ola. Obrigado por entrar em contato.'
from automation_settings
where profile_id = '821c20a3-37da-4189-8a7c-4e6a0452bc20'
order by created_at desc
limit 1;

insert into automation_steps (automation_id, step_order, step_type, title, content)
select id, 2, 'question', 'Coletar nome', 'Qual e o seu nome?'
from automation_settings
where profile_id = '821c20a3-37da-4189-8a7c-4e6a0452bc20'
order by created_at desc
limit 1;

insert into automation_steps (automation_id, step_order, step_type, title, content)
select id, 3, 'question', 'Entender interesse', 'O que voce procura hoje?'
from automation_settings
where profile_id = '821c20a3-37da-4189-8a7c-4e6a0452bc20'
order by created_at desc
limit 1;

insert into automation_steps (automation_id, step_order, step_type, title, content)
select id, 4, 'assign_status', 'Atualizar lead', 'Marcar como qualificado'
from automation_settings
where profile_id = '821c20a3-37da-4189-8a7c-4e6a0452bc20'
order by created_at desc
limit 1;

insert into automation_steps (automation_id, step_order, step_type, title, content)
select id, 5, 'handoff', 'Transferir para voce', 'Parar o bot e te avisar para assumir'
from automation_settings
where profile_id = '821c20a3-37da-4189-8a7c-4e6a0452bc20'
order by created_at desc
limit 1;
```

Depois atualize a tela `/flows`.

## Habilitar salvamento da automacao pela tela

Se o banco foi criado antes desta etapa, rode este bloco no `SQL Editor` para liberar escrita da automacao:

```sql
create policy "insert own automations"
on automation_settings for insert
with check (profile_id = auth.uid());

create policy "update own automations"
on automation_settings for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "delete own automations"
on automation_settings for delete
using (profile_id = auth.uid());

create policy "insert own automation steps"
on automation_steps for insert
with check (
  exists (
    select 1
    from automation_settings
    where automation_settings.id = automation_steps.automation_id
      and automation_settings.profile_id = auth.uid()
  )
);

create policy "delete own automation steps"
on automation_steps for delete
using (
  exists (
    select 1
    from automation_settings
    where automation_settings.id = automation_steps.automation_id
      and automation_settings.profile_id = auth.uid()
  )
);
```

Depois e so abrir `/flows`, editar os campos e clicar em `Salvar automacao`.

## Habilitar assumir conversa pela tela

Se o banco foi criado antes desta etapa, rode:

```sql
create policy "update own conversations"
on conversations for update
using (auth.uid() is not null)
with check (auth.uid() is not null);
```

Depois abra `/conversations` e teste os botoes `Assumir agora` e `Voltar para o bot`.

## Testar o webhook localmente

Adicione tambem no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=...
ZAPI_INSTANCE_ID=...
ZAPI_INSTANCE_TOKEN=...
ZAPI_CLIENT_TOKEN=...
```

Use a chave secreta do Supabase, nao a publishable. O `ZAPI_CLIENT_TOKEN` so e necessario se voce ativou o token de seguranca da conta.

Depois, com `npm run dev` aberto, rode no PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/webhooks/whatsapp -Method POST -ContentType "application/json" -Body '{"phone":"+5511999999999","message":"Oi, quero saber mais"}'
```

O endpoint vai:

- criar ou localizar o lead pelo telefone
- criar ou localizar a conversa
- salvar a mensagem inbound
- salvar as mensagens outbound da sua automacao
- mover a conversa de etapa conforme o fluxo

## Configurar recebimento real pela Z-API

Quando voce tiver uma URL publica do seu projeto, configure na Z-API o webhook:

- rota: `PUT /update-webhook-received`
- URL de destino: `https://SUA-URL/api/webhooks/whatsapp`

Se preferir testar local, exponha o `localhost:3000` com uma URL publica usando tunnel.
