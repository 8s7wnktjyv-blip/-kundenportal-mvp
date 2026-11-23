-- =====================================================================
-- Kundario – SAMMEL-UPDATE 004 bis 011 (Stand 23.11.2026)
-- Enthält alle Datenbank-Updates seit November 2026 in der richtigen Reihenfolge.
-- Kann gefahrlos mehrfach ausgeführt werden; schon vorhandene Teile werden übersprungen, Daten bleiben erhalten.
-- Läuft als EIN Block: Bei einem Fehler wird nichts geändert.
-- Supabase → SQL Editor → New query → diesen ganzen Inhalt einfügen → Run.
-- =====================================================================
begin;

-- ---------------------------------------------------------------- Update 004
-- =====================================================================
-- Kundario – Ausbau 1: Rechnungsangaben, Katalog, Vorlagen, Zeiterfassung,
-- Wartungsverträge, Protokolle, Portal-Links sperren, Fehlerprotokoll
-- Kann mehrfach ausgeführt werden.
-- =====================================================================

-- Betrieb: Kleinunternehmer, Logo (als kleines Bild), Skonto-Standard
alter table public.betriebe add column if not exists kleinunternehmer boolean not null default false;
alter table public.betriebe add column if not exists logo text;
alter table public.betriebe add column if not exists skonto_prozent numeric(5,2);
alter table public.betriebe add column if not exists skonto_tage int;

-- Kunden: Ansprechpartner (mehrere), abweichende Rechnungsadresse, Leitweg-ID (öffentliche Auftraggeber)
alter table public.kunden add column if not exists ansprechpartner_liste jsonb not null default '[]'::jsonb;
alter table public.kunden add column if not exists rechnungsadresse text;
alter table public.kunden add column if not exists leitweg_id text;
alter table public.kunden add column if not exists ust_id text;

-- Rechnungen: Steuerfall, Lohnanteil (§ 35a), Skonto, festes Dokument beim Stellen
alter table public.rechnungen add column if not exists steuerfall text not null default 'normal';
do $$ begin
  alter table public.rechnungen add constraint rechnungen_steuerfall check (steuerfall in ('normal','13b','kleinunternehmer'));
exception when duplicate_object then null; end $$;
alter table public.rechnungen add column if not exists lohn_netto numeric(12,2);
alter table public.rechnungen add column if not exists skonto_prozent numeric(5,2);
alter table public.rechnungen add column if not exists skonto_tage int;
alter table public.rechnungen add column if not exists dokument jsonb;           -- Absender, Empfänger, Texte: beim Stellen eingefroren
alter table public.rechnungen add column if not exists gestellt_at timestamptz;

alter table public.angebote add column if not exists steuerfall text not null default 'normal';

-- Kundenportal: Links lassen sich sperren
alter table public.angebote add column if not exists portal_aktiv boolean not null default true;
alter table public.auftraege add column if not exists portal_aktiv boolean not null default true;
alter table public.rechnungen add column if not exists portal_aktiv boolean not null default true;

-- Festschreiben erweitern: auch Steuerfall, Lohnanteil, Skonto und das eingefrorene Dokument
create or replace function public.rechnung_festschreiben() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'entwurf' then raise exception 'Gestellte Rechnungen können nicht gelöscht werden. Bitte stornieren.'; end if;
    return old;
  end if;
  if old.status <> 'entwurf' then
    if new.nr is distinct from old.nr or new.positionen is distinct from old.positionen or new.netto is distinct from old.netto or new.brutto is distinct from old.brutto
       or new.mwst is distinct from old.mwst or new.datum is distinct from old.datum or new.kunde_id is distinct from old.kunde_id or new.art is distinct from old.art
       or new.leistungszeitraum is distinct from old.leistungszeitraum or new.betrieb_id is distinct from old.betrieb_id
       or new.steuerfall is distinct from old.steuerfall or new.lohn_netto is distinct from old.lohn_netto or new.skonto_prozent is distinct from old.skonto_prozent
       or new.skonto_tage is distinct from old.skonto_tage or new.faellig is distinct from old.faellig
       or (old.dokument is not null and new.dokument is distinct from old.dokument) then
      raise exception 'Gestellte Rechnungen sind festgeschrieben. Änderungen nur per Storno und neuer Rechnung.';
    end if;
    if new.status = 'entwurf' then raise exception 'Eine gestellte Rechnung kann nicht zurück in den Entwurf.'; end if;
  end if;
  return new;
end $$;

-- Artikel und Leistungen (Katalog), Textbausteine
create table if not exists public.artikel (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  typ text not null default 'leistung' check (typ in ('leistung','material','lohn','text')),
  nr text,
  text text not null,
  langtext text,
  einheit text not null default 'Stk.',
  ek numeric(12,2),
  zuschlag numeric(6,2),
  preis numeric(12,2) not null default 0,
  kategorie text,
  aktiv boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists artikel_betrieb on public.artikel(betrieb_id, typ);

-- Angebotsvorlagen
create table if not exists public.vorlagen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  titel text not null,
  einleitung text,
  positionen jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Zeiterfassung (Arbeitszeit je Mitarbeiter)
create table if not exists public.zeiten (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  user_id uuid not null,
  auftrag_id uuid references public.auftraege(id) on delete set null,
  beginn timestamptz not null,
  ende timestamptz,
  pause_min int not null default 0 check (pause_min >= 0 and pause_min <= 600),
  notiz text,
  created_at timestamptz not null default now(),
  check (ende is null or ende > beginn)
);
create index if not exists zeiten_user on public.zeiten(betrieb_id, user_id, beginn);

-- Wartungsverträge
create table if not exists public.wartungen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  kunde_id uuid not null references public.kunden(id) on delete cascade,
  titel text not null,
  anlage text,
  ort text,
  intervall_monate int not null default 12 check (intervall_monate between 1 and 120),
  naechste date not null,
  preis numeric(12,2),
  aktiv boolean not null default true,
  notiz text,
  created_at timestamptz not null default now()
);

-- Protokolle je Gewerk (Prüfprotokoll Elektro, Wartungsprotokoll SHK, Abnahme …)
create table if not exists public.protokolle (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  vorlage text not null,
  titel text not null,
  auftrag_id uuid references public.auftraege(id) on delete set null,
  kunde_id uuid references public.kunden(id) on delete set null,
  wartung_id uuid references public.wartungen(id) on delete set null,
  werte jsonb not null default '{}'::jsonb,
  ergebnis text check (ergebnis in ('ok','maengel','nicht_ok')),
  unterschrift text, unterschrift_name text, unterschrieben_at timestamptz,
  erstellt_von uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- Fehlerprotokoll der App (damit Sie Probleme bei Kunden sehen)
create table if not exists public.fehlerlog (
  id bigint generated always as identity primary key,
  betrieb_id uuid references public.betriebe(id) on delete cascade,
  user_id uuid default auth.uid(),
  text text not null,
  ort text,
  geraet text,
  created_at timestamptz not null default now()
);

-- Zugriffsschutz für die neuen Tabellen
do $$
declare t text;
begin
  foreach t in array array['artikel','vorlagen','wartungen','protokolle'] loop
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

-- Zeiten: jeder sieht und bearbeitet seine eigenen; Geschäftsführung und Büro sehen alle
alter table public.zeiten enable row level security;
drop policy if exists zeiten_lesen on public.zeiten;
drop policy if exists zeiten_neu on public.zeiten;
drop policy if exists zeiten_aendern on public.zeiten;
drop policy if exists zeiten_loeschen on public.zeiten;
create policy zeiten_lesen on public.zeiten for select to authenticated using (public.ist_mitglied(betrieb_id) and (user_id = auth.uid() or public.darf_finanzen(betrieb_id)));
create policy zeiten_neu on public.zeiten for insert to authenticated with check (public.ist_mitglied(betrieb_id) and (user_id = auth.uid() or public.darf_finanzen(betrieb_id)));
create policy zeiten_aendern on public.zeiten for update to authenticated using (public.ist_mitglied(betrieb_id) and (user_id = auth.uid() or public.darf_finanzen(betrieb_id))) with check (public.ist_mitglied(betrieb_id));
create policy zeiten_loeschen on public.zeiten for delete to authenticated using (public.darf_finanzen(betrieb_id));

-- Fehlerprotokoll: jeder darf schreiben, nur Geschäftsführung lesen
alter table public.fehlerlog enable row level security;
drop policy if exists fehler_neu on public.fehlerlog;
drop policy if exists fehler_lesen on public.fehlerlog;
create policy fehler_neu on public.fehlerlog for insert to authenticated with check (betrieb_id is null or public.ist_mitglied(betrieb_id));
create policy fehler_lesen on public.fehlerlog for select to authenticated using (public.rolle_in(betrieb_id) = 'gf');

grant select, insert, update, delete on public.artikel, public.vorlagen, public.zeiten, public.wartungen, public.protokolle to authenticated;
grant select, insert on public.fehlerlog to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Portal-Funktionen: gesperrte Links zeigen nichts mehr
create or replace function public.portal_angebot(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'angebot', jsonb_build_object('nr', a.nr, 'titel', a.titel, 'einleitung', a.einleitung, 'positionen', a.positionen, 'mwst', a.mwst, 'netto', a.netto, 'brutto', a.brutto,
      'status', a.status, 'gueltig_bis', a.gueltig_bis, 'gesendet_at', a.gesendet_at, 'angenommen_at', a.angenommen_at, 'angenommen_name', a.angenommen_name, 'steuerfall', a.steuerfall),
    'kunde', jsonb_build_object('name', k.name),
    'betrieb', jsonb_build_object('name', b.name, 'telefon', b.telefon, 'email', b.email, 'strasse', b.strasse, 'plz', b.plz, 'ort', b.ort, 'logo', b.logo, 'kleinunternehmer', b.kleinunternehmer))
  from public.angebote a join public.betriebe b on b.id = a.betrieb_id left join public.kunden k on k.id = a.kunde_id
  where a.portal_token = p_token and a.portal_aktiv and a.status in ('gesendet','angenommen','abgelehnt') and length(p_token) >= 24;
$$;

create or replace function public.portal_angebot_antwort(p_token text, p_annehmen boolean, p_name text, p_unterschrift text, p_grund text)
returns text language plpgsql security definer set search_path = public as $$
declare a public.angebote;
begin
  select * into a from public.angebote where portal_token = p_token and portal_aktiv and length(p_token) >= 24;
  if a.id is null then raise exception 'Link ungültig'; end if;
  if a.status <> 'gesendet' then raise exception 'Dieses Angebot wurde bereits beantwortet'; end if;
  if a.gueltig_bis is not null and a.gueltig_bis < current_date then raise exception 'Das Angebot ist abgelaufen. Bitte melden Sie sich beim Betrieb.'; end if;
  if p_annehmen then
    if coalesce(trim(p_name), '') = '' or coalesce(p_unterschrift, '') = '' then raise exception 'Bitte Name und Unterschrift angeben'; end if;
    if length(p_unterschrift) > 300000 or p_unterschrift not like 'data:image/png;base64,%' then raise exception 'Unterschrift ungültig'; end if;
    update public.angebote set status = 'angenommen', angenommen_at = now(), angenommen_name = left(trim(p_name), 200), unterschrift = p_unterschrift where id = a.id;
    insert into public.verlauf(betrieb_id, bezug_typ, bezug_id, text, user_id) values (a.betrieb_id, 'angebot', a.id, 'Angebot ' || a.nr || ' im Kundenportal angenommen von ' || left(trim(p_name), 200), null);
    if a.anfrage_id is not null then update public.anfragen set status = 'gewonnen' where id = a.anfrage_id; end if;
    return 'angenommen';
  else
    update public.angebote set status = 'abgelehnt', ablehngrund = left(p_grund, 500) where id = a.id;
    insert into public.verlauf(betrieb_id, bezug_typ, bezug_id, text, user_id) values (a.betrieb_id, 'angebot', a.id, 'Angebot ' || a.nr || ' im Kundenportal abgelehnt' || coalesce(': ' || left(p_grund, 200), ''), null);
    return 'abgelehnt';
  end if;
end $$;

create or replace function public.portal_auftrag(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'auftrag', jsonb_build_object('nr', au.nr, 'titel', au.titel, 'status', au.status, 'start', au.start, 'ende', au.ende),
    'kunde', jsonb_build_object('name', k.name),
    'betrieb', jsonb_build_object('name', b.name, 'telefon', b.telefon, 'email', b.email, 'logo', b.logo),
    'termine', coalesce((select jsonb_agg(jsonb_build_object('titel', t.titel, 'art', t.art, 'beginn', t.beginn, 'ende', t.ende) order by t.beginn) from public.termine t where t.auftrag_id = au.id and t.kunde_sichtbar), '[]'::jsonb),
    'rechnungen', coalesce((select jsonb_agg(jsonb_build_object('nr', r.nr, 'datum', r.datum, 'faellig', r.faellig, 'brutto', r.brutto, 'status', r.status, 'token', r.portal_token) order by r.datum) from public.rechnungen r where r.auftrag_id = au.id and r.status <> 'entwurf' and r.portal_aktiv), '[]'::jsonb),
    'berichte', coalesce((select jsonb_agg(jsonb_build_object('nr', x.nr, 'datum', x.datum, 'stunden', x.stunden, 'taetigkeit', x.taetigkeit, 'status', x.status) order by x.datum) from public.berichte x where x.auftrag_id = au.id and x.status <> 'entwurf'), '[]'::jsonb))
  from public.auftraege au join public.betriebe b on b.id = au.betrieb_id left join public.kunden k on k.id = au.kunde_id
  where au.portal_token = p_token and au.portal_aktiv and length(p_token) >= 24;
$$;

create or replace function public.portal_rechnung(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'rechnung', jsonb_build_object('nr', r.nr, 'art', r.art, 'datum', r.datum, 'faellig', r.faellig, 'positionen', r.positionen, 'mwst', r.mwst, 'netto', r.netto, 'brutto', r.brutto, 'status', r.status, 'leistungszeitraum', r.leistungszeitraum,
      'steuerfall', r.steuerfall, 'lohn_netto', r.lohn_netto, 'skonto_prozent', r.skonto_prozent, 'skonto_tage', r.skonto_tage, 'dokument', r.dokument,
      'bezahlt', coalesce((select sum(z.betrag) from public.zahlungen z where z.rechnung_id = r.id), 0)),
    'kunde', jsonb_build_object('name', k.name, 'strasse', k.strasse, 'plz', k.plz, 'ort', k.ort),
    'betrieb', jsonb_build_object('name', b.name, 'strasse', b.strasse, 'plz', b.plz, 'ort', b.ort, 'telefon', b.telefon, 'email', b.email, 'ust_id', b.ust_id, 'steuernummer', b.steuernummer, 'bank', b.bank, 'iban', b.iban, 'bic', b.bic, 'logo', b.logo))
  from public.rechnungen r join public.betriebe b on b.id = r.betrieb_id left join public.kunden k on k.id = r.kunde_id
  where r.portal_token = p_token and r.portal_aktiv and r.status <> 'entwurf' and length(p_token) >= 24;
$$;

revoke all on function public.portal_angebot(text), public.portal_angebot_antwort(text, boolean, text, text, text), public.portal_auftrag(text), public.portal_rechnung(text) from public;
grant execute on function public.portal_angebot(text), public.portal_angebot_antwort(text, boolean, text, text, text), public.portal_auftrag(text), public.portal_rechnung(text) to anon, authenticated;

-- ---------------------------------------------------------------- Update 005
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

-- ---------------------------------------------------------------- Update 006
-- Kundario – Update 006: Eingangsrechnungen, Katalog-Kalkulation, Datanorm. Kann mehrfach ausgeführt werden.
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

-- ---------------------------------------------------------------- Update 007
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

-- ---------------------------------------------------------------- Update 008
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

-- ---------------------------------------------------------------- Update 009
-- Kundario – Update 009: Anfrage-Link je Betrieb (eigene Website, Beauftragung durch Hausverwaltungen). Kann mehrfach ausgeführt werden.
alter table public.betriebe add column if not exists anfrage_token text unique default encode(gen_random_bytes(18), 'hex');
update public.betriebe set anfrage_token = encode(gen_random_bytes(18), 'hex') where anfrage_token is null;

-- Öffentlich lesbar über den Link: nur Name, Gewerk und Kontakt des Betriebs
create or replace function public.portal_betrieb(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', b.name, 'gewerk', b.gewerk, 'ort', b.ort, 'telefon', b.telefon, 'email', b.email)
  from public.betriebe b where b.anfrage_token = p_token and length(p_token) >= 24 and coalesce(b.gewerk, '') <> 'Hausverwaltung';
$$;

-- Anfrage über den Link einreichen: legt Kunde (oder findet ihn über die E-Mail) und Anfrage an
create or replace function public.anfrage_einreichen(p_token text, p_name text, p_email text, p_telefon text, p_ort text, p_betreff text, p_text text, p_art text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.betriebe; k uuid; n int;
begin
  select * into b from public.betriebe where anfrage_token = p_token and length(p_token) >= 24 and coalesce(gewerk, '') <> 'Hausverwaltung';
  if b.id is null then raise exception 'Anfrage-Link ungültig'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 or length(p_name) > 120 then raise exception 'Bitte einen Namen angeben'; end if;
  if length(trim(coalesce(p_email, ''))) = 0 and length(trim(coalesce(p_telefon, ''))) = 0 then raise exception 'Bitte E-Mail oder Telefon angeben'; end if;
  if coalesce(p_email, '') <> '' and (length(p_email) > 200 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'E-Mail-Adresse prüfen'; end if;
  if length(trim(coalesce(p_betreff, ''))) = 0 or length(p_betreff) > 200 or length(coalesce(p_text, '')) > 5000 or length(coalesce(p_ort, '')) > 300 or length(coalesce(p_telefon, '')) > 50 then raise exception 'Angaben zu lang oder Betreff fehlt'; end if;
  select count(*) into n from public.anfragen where betrieb_id = b.id and kanal = 'formular' and created_at > now() - interval '1 hour';
  if n >= 20 then raise exception 'Gerade sind sehr viele Anfragen eingegangen. Bitte später erneut versuchen oder anrufen.'; end if;
  if coalesce(p_email, '') <> '' then select id into k from public.kunden where betrieb_id = b.id and lower(email) = lower(trim(p_email)) limit 1; end if;
  if k is null then
    -- „Straße, PLZ Ort“ in die Felder zerlegen (für eine gültige Rechnung), sonst alles als Ort
    insert into public.kunden(betrieb_id, art, name, email, telefon, strasse, plz, ort, quelle)
    values (b.id, case when p_art in ('privat','firma','hausverwaltung') then p_art else 'privat' end, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_telefon), ''),
      case when trim(coalesce(p_ort, '')) ~ '^.+?,\s*\d{5}\s+.+$' then trim(substring(trim(p_ort) from '^(.+?),\s*\d{5}\s+.+$')) end,
      case when trim(coalesce(p_ort, '')) ~ '^.+?,\s*\d{5}\s+.+$' then substring(trim(p_ort) from '^.+?,\s*(\d{5})\s+.+$') end,
      case when trim(coalesce(p_ort, '')) ~ '^.+?,\s*\d{5}\s+.+$' then trim(substring(trim(p_ort) from '^.+?,\s*\d{5}\s+(.+)$')) else nullif(trim(p_ort), '') end, 'Anfrage-Link')
    returning id into k;
  end if;
  insert into public.anfragen(betrieb_id, kunde_id, kanal, betreff, beschreibung, ort, status) values (b.id, k, 'formular', trim(p_betreff), nullif(trim(p_text), ''), nullif(trim(p_ort), ''), 'neu');
  return jsonb_build_object('betrieb', b.name);
end $$;

revoke all on function public.portal_betrieb(text), public.anfrage_einreichen(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.portal_betrieb(text), public.anfrage_einreichen(text, text, text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- Update 010
-- Kundario – Update 010: Rechnungen an Lexware Office / sevDesk übergeben (Schlüssel sicher gespeichert). Kann mehrfach ausgeführt werden.
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

-- ---------------------------------------------------------------- Update 011
-- Kundario – Update 011: Partnerbereich (Vertriebspartner, Meldungen, Verträge, Provision). Kann mehrfach ausgeführt werden.
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

commit;

-- Danach EINMAL (eigene E-Mail-Adresse einsetzen), damit Sie den Partnerbereich sehen:
-- insert into public.betreiber(user_id) select id from auth.users where email = 'ihre@adresse.de' on conflict do nothing;
