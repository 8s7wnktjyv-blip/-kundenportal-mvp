-- Kundario – Ausbau 7: Rechnungen an Lexware Office / sevDesk übergeben. Kann mehrfach ausgeführt werden.
-- API-Schlüssel liegen nur in „schnittstellen“: für Nutzer weder lesbar noch direkt schreibbar.
-- Setzen nur über schnittstelle_setzen (Geschäftsführung), lesen nur die Server-Funktion rechnung-uebergeben (Dienstschlüssel).
create table if not exists public.schnittstellen (
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  anbieter text not null check (anbieter in ('lexware','sevdesk')),
  api_key text not null,
  geaendert_at timestamptz not null default now(),
  primary key (betrieb_id, anbieter)
);
alter table public.schnittstellen enable row level security;   -- keine Richtlinie: kein Zugriff für Nutzer
revoke all on public.schnittstellen from anon, authenticated;

create table if not exists public.uebergaben (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  rechnung_id uuid not null references public.rechnungen(id) on delete cascade,
  anbieter text not null check (anbieter in ('lexware','sevdesk','datei')),
  extern_id text,
  erstellt_von uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists uebergaben_rechnung on public.uebergaben(rechnung_id);
alter table public.uebergaben enable row level security;
drop policy if exists finanzen_lesen on public.uebergaben;
drop policy if exists finanzen_neu on public.uebergaben;
create policy finanzen_lesen on public.uebergaben for select to authenticated using (public.darf_finanzen(betrieb_id));
create policy finanzen_neu on public.uebergaben for insert to authenticated with check (public.darf_finanzen(betrieb_id) and exists (select 1 from public.rechnungen r where r.id = rechnung_id and r.betrieb_id = uebergaben.betrieb_id));
grant select, insert on public.uebergaben to authenticated;

create or replace function public.schnittstelle_setzen(p_betrieb uuid, p_anbieter text, p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.rolle_in(p_betrieb) is distinct from 'gf' then raise exception 'Nur die Geschäftsführung verbindet das Rechnungsprogramm'; end if;
  if p_anbieter not in ('lexware','sevdesk') then raise exception 'Unbekanntes Rechnungsprogramm'; end if;
  if coalesce(trim(p_key), '') = '' then delete from public.schnittstellen where betrieb_id = p_betrieb and anbieter = p_anbieter; return; end if;
  if length(trim(p_key)) < 20 or length(p_key) > 500 then raise exception 'Der Schlüssel sieht nicht vollständig aus'; end if;
  insert into public.schnittstellen(betrieb_id, anbieter, api_key) values (p_betrieb, p_anbieter, trim(p_key))
  on conflict (betrieb_id, anbieter) do update set api_key = excluded.api_key, geaendert_at = now();
end $$;
-- Nur ob verbunden und die letzten 4 Zeichen – nie der Schlüssel selbst
create or replace function public.schnittstellen_status(p_betrieb uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('anbieter', anbieter, 'ende', right(api_key, 4), 'geaendert_at', geaendert_at)), '[]'::jsonb)
  from public.schnittstellen where betrieb_id = p_betrieb and public.darf_finanzen(p_betrieb);
$$;
revoke all on function public.schnittstelle_setzen(uuid, text, text), public.schnittstellen_status(uuid) from public, anon;
grant execute on function public.schnittstelle_setzen(uuid, text, text), public.schnittstellen_status(uuid) to authenticated;
