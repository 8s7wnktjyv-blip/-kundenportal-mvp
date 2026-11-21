-- Kundario – Ausbau 8: Partnerbereich (Vertriebspartner, Meldungen, Verträge, Provision). Kann mehrfach ausgeführt werden.
-- Betreiber (Kundario selbst) sieht alles. Partner sehen nur ihre eigenen Meldungen – nie Kundendaten der Betriebe. Betriebe sehen davon nichts.
-- Betreiber eintragen (einmalig, im SQL Editor): insert into public.betreiber(user_id) select id from auth.users where email = 'ihre@adresse.de';
create table if not exists public.betreiber (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.betreiber enable row level security;
revoke all on public.betreiber from anon, authenticated;
create or replace function public.ist_betreiber() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.betreiber where user_id = auth.uid());
$$;

create table if not exists public.partner (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  email text not null,
  code text not null unique check (code ~ '^[A-Z0-9]{4,12}$'),
  art text not null default 'vertrieb' check (art in ('vertrieb','tippgeber','influencer')),
  user_id uuid references auth.users(id) on delete set null,
  aktiv boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.partner_meldungen (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner(id) on delete cascade,
  betrieb_name text not null check (length(trim(betrieb_name)) > 0),
  ort text, notiz text,
  quelle text not null default 'meldung' check (quelle in ('link','meldung')),
  am timestamptz not null default now(),
  status text not null default 'offen' check (status in ('offen','angenommen','abgelehnt')),
  grund text,
  betrieb_id uuid references public.betriebe(id) on delete set null
);
create table if not exists public.vertraege (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null unique references public.betriebe(id) on delete cascade,
  tarif text not null default 'Grundpreis',
  einrichtung numeric(10,2) not null default 750,
  monatsbeitrag numeric(10,2) not null default 249,
  beginn date not null,
  gekuendigt_am date,
  bezahlt date[] not null default '{}',
  in_bearbeitung_seit date,
  provision_bezahlt_am date,
  notiz text,
  created_at timestamptz not null default now()
);
alter table public.betriebe add column if not exists partner_code text;

-- Zugriff: Betreiber alles; Partner nur lesen, was ihm gehört (Meldungen auch anlegen)
alter table public.partner enable row level security;
alter table public.partner_meldungen enable row level security;
alter table public.vertraege enable row level security;
drop policy if exists betreiber_alles on public.partner; drop policy if exists partner_selbst on public.partner;
create policy betreiber_alles on public.partner for all to authenticated using (public.ist_betreiber()) with check (public.ist_betreiber());
create policy partner_selbst on public.partner for select to authenticated using (user_id = auth.uid());
drop policy if exists betreiber_alles on public.partner_meldungen; drop policy if exists partner_lesen on public.partner_meldungen; drop policy if exists partner_melden on public.partner_meldungen;
create policy betreiber_alles on public.partner_meldungen for all to authenticated using (public.ist_betreiber()) with check (public.ist_betreiber());
create policy partner_lesen on public.partner_meldungen for select to authenticated using (exists (select 1 from public.partner p where p.id = partner_id and p.user_id = auth.uid()));
create policy partner_melden on public.partner_meldungen for insert to authenticated with check (quelle = 'meldung' and status = 'offen' and betrieb_id is null and exists (select 1 from public.partner p where p.id = partner_id and p.user_id = auth.uid() and p.aktiv));
drop policy if exists betreiber_alles on public.vertraege;
create policy betreiber_alles on public.vertraege for all to authenticated using (public.ist_betreiber()) with check (public.ist_betreiber());
grant select, insert, update, delete on public.partner, public.partner_meldungen, public.vertraege to authenticated;

-- Partner verknüpft sich beim ersten Anmelden über seine E-Mail-Adresse
create or replace function public.ich_partner() returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.partner; mail text;
begin
  select email into mail from auth.users where id = auth.uid(); if mail is null then return null; end if;
  update public.partner set user_id = auth.uid() where user_id is null and lower(email) = lower(mail) and aktiv;
  select * into p from public.partner where user_id = auth.uid() and aktiv limit 1;
  if p.id is null then return null; end if;
  return jsonb_build_object('id', p.id, 'name', p.name, 'code', p.code, 'art', p.art);
end $$;

-- Betrieb meldet seinen Partner-Code (bei der Registrierung, nur Geschäftsführung, nur einmal, nur bis 7 Tage nach Anlage)
create or replace function public.partner_code_setzen(p_betrieb uuid, p_code text) returns boolean language plpgsql security definer set search_path = public as $$
declare pa public.partner; b public.betriebe;
begin
  if public.rolle_in(p_betrieb) is distinct from 'gf' then raise exception 'Nur die Geschäftsführung'; end if;
  select * into b from public.betriebe where id = p_betrieb;
  if b.partner_code is not null or b.created_at < now() - interval '7 days' then return false; end if;
  select * into pa from public.partner where code = upper(trim(p_code)) and aktiv; if pa.id is null then return false; end if;
  update public.betriebe set partner_code = pa.code where id = p_betrieb;
  insert into public.partner_meldungen(partner_id, betrieb_name, ort, quelle, status, betrieb_id) values (pa.id, b.name, b.ort, 'link', 'offen', b.id);
  return true;
end $$;

-- Übersicht für den Partner: nur Name/Ort/Status seiner Meldungen und die Zahlen für die Provision – keine Kundendaten
create or replace function public.partner_uebersicht() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'betrieb_name', m.betrieb_name, 'ort', m.ort, 'quelle', m.quelle, 'am', m.am, 'status', m.status, 'grund', m.grund,
    'vertrag', case when m.status = 'angenommen' and v.id is not null then jsonb_build_object('beginn', v.beginn, 'einrichtung', v.einrichtung, 'monatsbeitrag', v.monatsbeitrag, 'gekuendigt_am', v.gekuendigt_am, 'bezahlt', to_jsonb(v.bezahlt[1:2]), 'provision_bezahlt_am', v.provision_bezahlt_am) end) order by m.am desc), '[]'::jsonb)
  from public.partner_meldungen m join public.partner p on p.id = m.partner_id left join public.vertraege v on v.betrieb_id = m.betrieb_id
  where p.user_id = auth.uid();
$$;

-- Betreiber: alle Betriebe mit Vertrag und Partner (für die Verwaltung der Verträge)
create or replace function public.betreiber_betriebe() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ist_betreiber() then raise exception 'Nur für den Betreiber'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'gewerk', b.gewerk, 'ort', b.ort, 'created_at', b.created_at, 'partner_code', b.partner_code) order by b.created_at desc), '[]'::jsonb) from public.betriebe b);
end $$;

revoke all on function public.ist_betreiber(), public.ich_partner(), public.partner_code_setzen(uuid, text), public.partner_uebersicht(), public.betreiber_betriebe() from public, anon;
grant execute on function public.ist_betreiber(), public.ich_partner(), public.partner_code_setzen(uuid, text), public.partner_uebersicht(), public.betreiber_betriebe() to authenticated;
