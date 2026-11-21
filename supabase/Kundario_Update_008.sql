-- Kundario – Update 008: Fristen-Service für Hausverwaltungen (Objekte, Anlagen, Fristen). Kann mehrfach ausgeführt werden.
-- Eine Hausverwaltung ist ein Eintrag in „betriebe“ mit gewerk = 'Hausverwaltung'; Zugriffsschutz wie bei allen Betriebsdaten.
create table if not exists public.objekte (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  name text not null,
  strasse text, plz text, ort text,
  einheiten int not null default 1 check (einheiten between 1 and 10000),
  eigentuemer text,
  notiz text,
  created_at timestamptz not null default now()
);
create table if not exists public.anlagen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  objekt_id uuid not null references public.objekte(id) on delete cascade,
  art text not null check (art in ('heizkessel','waermepumpe','fernwaerme','sonstige')),
  bezeichnung text,
  einbau_jahr int check (einbau_jahr between 1900 and 2100),
  einbau_monat int check (einbau_monat between 1 and 12),
  hersteller text,
  notiz text,
  created_at timestamptz not null default now()
);
create table if not exists public.fristen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  objekt_id uuid not null references public.objekte(id) on delete cascade,
  anlage_id uuid references public.anlagen(id) on delete cascade,
  titel text not null,
  grundlage text not null default 'eigen' check (grundlage in ('60b','eigen')),
  faellig date not null,
  intervall_monate int check (intervall_monate between 1 and 240),
  status text not null default 'offen' check (status in ('offen','beauftragt','erledigt')),
  fachbetrieb text,
  erledigt_am date,
  nachweis text,
  notiz text,
  created_at timestamptz not null default now()
);
create index if not exists objekte_betrieb on public.objekte(betrieb_id);
create index if not exists anlagen_objekt on public.anlagen(objekt_id);
create index if not exists fristen_betrieb_faellig on public.fristen(betrieb_id, faellig);

-- Anlage und Frist müssen zum selben Betrieb gehören wie ihr Objekt (kein Verweis auf fremde Objekte)
create or replace function public.fristen_gleicher_betrieb() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.objekte o where o.id = new.objekt_id and o.betrieb_id = new.betrieb_id) then
    raise exception 'Objekt gehört nicht zu diesem Betrieb';
  end if;
  if tg_table_name = 'fristen' then
    if new.anlage_id is not null and not exists (select 1 from public.anlagen a where a.id = new.anlage_id and a.objekt_id = new.objekt_id) then
      raise exception 'Anlage gehört nicht zu diesem Objekt';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists anlagen_betrieb on public.anlagen;
create trigger anlagen_betrieb before insert or update on public.anlagen for each row execute function public.fristen_gleicher_betrieb();
drop trigger if exists fristen_betrieb on public.fristen;
create trigger fristen_betrieb before insert or update on public.fristen for each row execute function public.fristen_gleicher_betrieb();

do $$
declare t text;
begin
  foreach t in array array['objekte','anlagen','fristen'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists mitglied_lesen on public.%I', t);
    execute format('drop policy if exists mitglied_neu on public.%I', t);
    execute format('drop policy if exists mitglied_aendern on public.%I', t);
    execute format('drop policy if exists buero_loeschen on public.%I', t);
    execute format('create policy mitglied_lesen on public.%I for select to authenticated using (public.ist_mitglied(betrieb_id))', t);
    execute format('create policy mitglied_neu on public.%I for insert to authenticated with check (public.ist_mitglied(betrieb_id))', t);
    execute format('create policy mitglied_aendern on public.%I for update to authenticated using (public.ist_mitglied(betrieb_id)) with check (public.ist_mitglied(betrieb_id))', t);
    execute format('create policy buero_loeschen on public.%I for delete to authenticated using (public.darf_finanzen(betrieb_id))', t);
  end loop;
end $$;
grant select, insert, update, delete on public.objekte, public.anlagen, public.fristen to authenticated;
