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
    'betrieb', jsonb_build_object('name', b.name, 'telefon', b.telefon, 'email', b.email, 'strasse', b.strasse, 'plz', b.plz, 'ort', b.ort, 'logo', b.logo))
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
