-- Kundario – Update 007: Kassenbuch, Umsatzsteuer, Stundensatz, Nachkalkulation, Wiedervorlage. Kann mehrfach ausgeführt werden.
alter table public.betriebe add column if not exists versteuerung text not null default 'ist';
do $$ begin alter table public.betriebe add constraint betriebe_versteuerung check (versteuerung in ('ist','soll')); exception when duplicate_object then null; end $$;
alter table public.betriebe add column if not exists kalkulation jsonb not null default '{}'::jsonb;
alter table public.berichte add column if not exists position_id text;
alter table public.zeiten add column if not exists position_id text;
alter table public.anfragen add column if not exists wiedervorlage date;
alter table public.belege add column if not exists steuer13b boolean not null default false;
create table if not exists public.kasse (
id uuid primary key default gen_random_uuid(),
betrieb_id uuid not null references public.betriebe(id) on delete cascade,
nr int not null, datum date not null default current_date,
art text not null check (art in ('einnahme','ausgabe','einlage','entnahme','zur_bank','von_bank')),
text text not null, betrag numeric(12,2) not null check (betrag > 0),
ust_satz numeric(5,2) not null default 0, kategorie text,
rechnung_id uuid references public.rechnungen(id) on delete set null,
beleg text, storno_von uuid references public.kasse(id),
erstellt_von uuid default auth.uid(), created_at timestamptz not null default now(),
unique (betrieb_id, nr));
create unique index if not exists kasse_storno_einmal on public.kasse(storno_von) where storno_von is not null;
create or replace function public.kasse_vor_neu() returns trigger language plpgsql security definer set search_path = public as $$
declare bestand numeric; wirkung numeric; o public.kasse;
begin
  perform pg_advisory_xact_lock(hashtext('kasse' || new.betrieb_id::text));
  if new.datum > current_date then raise exception 'Kassenbuchungen dürfen nicht in der Zukunft liegen.'; end if;
  if new.storno_von is not null then
    select * into o from public.kasse where id = new.storno_von and betrieb_id = new.betrieb_id;
    if not found then raise exception 'Zu stornierende Buchung nicht gefunden.'; end if;
    if o.storno_von is not null then raise exception 'Eine Storno-Buchung kann nicht storniert werden.'; end if;
    new.art := o.art; new.betrag := o.betrag; new.ust_satz := o.ust_satz; new.kategorie := o.kategorie; new.rechnung_id := o.rechnung_id;
  end if;
  select coalesce(max(nr), 0) + 1 into new.nr from public.kasse where betrieb_id = new.betrieb_id;
  select coalesce(sum(case when storno_von is null then 1 else -1 end * case when art in ('einnahme','einlage','von_bank') then betrag else -betrag end), 0)
    into bestand from public.kasse where betrieb_id = new.betrieb_id;
  wirkung := case when new.storno_von is null then 1 else -1 end * case when new.art in ('einnahme','einlage','von_bank') then new.betrag else -new.betrag end;
  if bestand + wirkung < 0 then raise exception 'Der Kassenbestand darf nicht negativ werden (Bestand %).', bestand; end if;
  new.erstellt_von := auth.uid(); new.created_at := now();
  return new;
end $$;
drop trigger if exists kasse_vor_neu on public.kasse;
create trigger kasse_vor_neu before insert on public.kasse for each row execute function public.kasse_vor_neu();
alter table public.kasse enable row level security;
drop policy if exists kasse_lesen on public.kasse; drop policy if exists kasse_neu on public.kasse;
create policy kasse_lesen on public.kasse for select to authenticated using (public.darf_finanzen(betrieb_id));
create policy kasse_neu on public.kasse for insert to authenticated with check (public.darf_finanzen(betrieb_id));
revoke update, delete on public.kasse from authenticated, anon;
grant select, insert on public.kasse to authenticated;
