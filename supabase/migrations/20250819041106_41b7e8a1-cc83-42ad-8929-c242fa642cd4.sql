
-- 1) New templates table
create table public.email_sender_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audience_type text not null check (audience_type in ('leads','partners')),
  subject text not null,
  header_logo_url text,
  body_blocks jsonb not null default '[]'::jsonb, -- ordered array of blocks, e.g. [{type:'html', html:'...'}]
  footer_html text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_sender_templates enable row level security;

-- Superadmins only (all ops)
create policy "Superadmin can manage email sender templates"
on public.email_sender_templates
for all
using (is_superadmin(auth.uid()))
with check (is_superadmin(auth.uid()));

-- Auto-update updated_at
create trigger trg_email_sender_templates_updated_at
before update on public.email_sender_templates
for each row
execute function public.update_updated_at_column();

-- 2) Sends (batch executions)
create table public.email_sender_sends (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.email_sender_templates(id) on delete set null,
  audience_type text not null check (audience_type in ('leads','partners')),
  subject text not null,
  html_content text not null,
  filter jsonb, -- optional future filters/segments
  total_recipients integer not null default 0,
  status text not null default 'queued', -- queued | sending | sent | failed | partial
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_sender_sends enable row level security;

create policy "Superadmin can manage email sender sends"
on public.email_sender_sends
for all
using (is_superadmin(auth.uid()))
with check (is_superadmin(auth.uid()));

create trigger trg_email_sender_sends_updated_at
before update on public.email_sender_sends
for each row
execute function public.update_updated_at_column();

-- 3) Recipients (per-recipient delivery status for each send)
create table public.email_sender_recipients (
  id uuid primary key default gen_random_uuid(),
  send_id uuid not null references public.email_sender_sends(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  lead_id uuid references public.quiz_responses(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  resend_email_id text,
  delivery_status text not null default 'pending', -- pending | sent | delivered | bounced | failed
  error_message text,
  sent_at timestamptz default now()
);

alter table public.email_sender_recipients enable row level security;

create policy "Superadmin can manage email sender recipients"
on public.email_sender_recipients
for all
using (is_superadmin(auth.uid()))
with check (is_superadmin(auth.uid()));

-- Helpful indexes
create index idx_email_sender_templates_audience on public.email_sender_templates(audience_type);
create index idx_email_sender_sends_created_at on public.email_sender_sends(created_at);
create index idx_email_sender_recipients_send_id on public.email_sender_recipients(send_id);
