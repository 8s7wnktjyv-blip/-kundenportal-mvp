-- Kundario – Ausbau 2: Lager, Ausgaben, Kontostand, Steuerberater-Export. Kann mehrfach ausgeführt werden.
alter table public.betriebe add column if not exists datev jsonb not null default '{}'::jsonb;
alter table public.betriebe add column if not exists ruecklage_prozent numeric(5,2);
alter table public.material add column if not exists bestellt_at timestamptz;
alter table public.material add column if not exists lager_id uuid;
create table if not exists public.lager (
id uuid primary key default gen_random_uuid(),
betrieb_id uuid not null references public.betriebe(id) on delete cascade,
text text not null, einheit text not null default 'Stk.',
bestand numeric(12,2) not null default 0, mindest numeric(12,2),
ort text not null default 'Lager', lieferant text, preis numeric(12,2),
created_at timestamptz not null default now());
create table if not exists public.ausgaben (
id uuid primary key default gen_random_uuid(),
betrieb_id uuid not null references public.betriebe(id) on delete cascade,
text text not null, betrag numeric(12,2) not null check (betrag > 0), datum date not null,
wiederholung text not null default 'einmalig' check (wiederholung in ('einmalig','monatlich','quartal','jahr')),
kategorie text, created_at timestamptz not null default now());
create table if not exists public.kontostaende (
id uuid primary key default gen_random_uuid(),
betrieb_id uuid not null references public.betriebe(id) on delete cascade,
datum date not null default current_date, betrag numeric(12,2) not null, notiz text,
created_at timestamptz not null default now());
alter table public.lager enable row level security;
alter table public.ausgaben enable row level security;
alter table public.kontostaende enable row level security;
drop policy if exists lager_lesen on public.lager; drop policy if exists lager_neu on public.lager; drop policy if exists lager_aendern on public.lager; drop policy if exists lager_loeschen on public.lager;
create policy lager_lesen on public.lager for select to authenticated using (public.ist_mitglied(betrieb_id));
create policy lager_neu on public.lager for insert to authenticated with check (public.ist_mitglied(betrieb_id));
create policy lager_aendern on public.lager for update to authenticated using (public.ist_mitglied(betrieb_id)) with check (public.ist_mitglied(betrieb_id));
create policy lager_loeschen on public.lager for delete to authenticated using (public.darf_finanzen(betrieb_id));
drop policy if exists finanzen_alles on public.ausgaben; drop policy if exists finanzen_alles on public.kontostaende;
create policy finanzen_alles on public.ausgaben for all to authenticated using (public.darf_finanzen(betrieb_id)) with check (public.darf_finanzen(betrieb_id));
create policy finanzen_alles on public.kontostaende for all to authenticated using (public.darf_finanzen(betrieb_id)) with check (public.darf_finanzen(betrieb_id));
grant select, insert, update, delete on public.lager, public.ausgaben, public.kontostaende to authenticated;
