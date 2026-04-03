create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  whatsapp_label text not null default 'Meu WhatsApp Principal',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text not null unique,
  status text not null default 'novo',
  source text not null default 'whatsapp',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  stage text not null default 'entrada',
  manual_mode boolean not null default false,
  initial_response_sent boolean not null default false,
  owner text not null default 'bot' check (owner in ('bot', 'voce')),
  last_message text,
  scheduled_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists automation_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists automation_settings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  template_id uuid references automation_templates(id) on delete set null,
  name text not null default 'Automacao principal',
  welcome_message text,
  initial_delay_minutes int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table if exists conversations add column if not exists initial_response_sent boolean not null default false;
alter table if exists conversations add column if not exists scheduled_reply_at timestamptz;
alter table if exists automation_settings add column if not exists initial_delay_minutes int not null default 0;

create table if not exists automation_steps (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automation_settings(id) on delete cascade,
  step_order int not null,
  step_type text not null check (step_type in ('message', 'question', 'save_field', 'assign_status', 'handoff', 'end')),
  title text not null,
  content text,
  field_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists automation_steps_order_idx on automation_steps(automation_id, step_order);

alter table profiles enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table automation_settings enable row level security;
alter table automation_steps enable row level security;

create policy "read own profile"
on profiles for select
using (auth.uid() = id);

create policy "read own leads"
on leads for select
using (auth.uid() is not null);

create policy "read own conversations"
on conversations for select
using (auth.uid() is not null);

create policy "update own conversations"
on conversations for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "read own messages"
on messages for select
using (auth.uid() is not null);

create policy "read own automations"
on automation_settings for select
using (profile_id = auth.uid());

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

create policy "read own automation steps"
on automation_steps for select
using (
  exists (
    select 1
    from automation_settings
    where automation_settings.id = automation_steps.automation_id
      and automation_settings.profile_id = auth.uid()
  )
);

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
