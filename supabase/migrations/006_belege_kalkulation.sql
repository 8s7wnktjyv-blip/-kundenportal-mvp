-- Kundario – Ausbau 3: Eingangsrechnungen, Kalkulation, Großhandelsdaten. Kann mehrfach ausgeführt werden.
alter table public.artikel add column if not exists minuten numeric(8,2);
alter table public.artikel add column if not exists material_ek numeric(12,2);
alter table public.artikel add column if not exists material_zuschlag numeric(6,2);
alter table public.artikel add column if not exists lieferant text;
alter table public.artikel add column if not exists listenpreis numeric(12,2);
alter table public.artikel add column if not exists rabattgruppe text;
alter table public.artikel add column if not exists warengruppe text;
alter table public.artikel add column if not exists ean text;
create unique index if not exists artikel_lieferant_nr on public.artikel(betrieb_id, lieferant, nr);
alter table public.betriebe add column if not exists rabatte jsonb not null default '{}'::jsonb;
create table if not exists public.belege (
id uuid primary key default gen_random_uuid(),
betrieb_id uuid not null references public.betriebe(id) on delete cascade,
lieferant text not null, nr text, datum date not null default current_date, faellig date,
netto numeric(12,2) not null default 0, ust numeric(12,2) not null default 0, brutto numeric(12,2) not null default 0,
kategorie text, auftrag_id uuid references public.auftraege(id) on delete set null,
status text not null default 'offen' check (status in ('offen','bezahlt')), bezahlt_am date,
datei text, quelle text, notiz text, daten jsonb,
created_at timestamptz not null default now());
create index if not exists belege_betrieb on public.belege(betrieb_id, datum);
alter table public.belege enable row level security;
drop policy if exists belege_lesen on public.belege; drop policy if exists belege_neu on public.belege; drop policy if exists belege_aendern on public.belege; drop policy if exists belege_loeschen on public.belege;
create policy belege_lesen on public.belege for select to authenticated using (public.darf_finanzen(betrieb_id));
create policy belege_neu on public.belege for insert to authenticated with check (public.ist_mitglied(betrieb_id));
create policy belege_aendern on public.belege for update to authenticated using (public.darf_finanzen(betrieb_id)) with check (public.darf_finanzen(betrieb_id));
create policy belege_loeschen on public.belege for delete to authenticated using (public.darf_finanzen(betrieb_id));
grant select, insert, update, delete on public.belege to authenticated;
