-- Kundario: Datenbank einrichten (alles in einem). In Supabase: SQL Editor → New query → einfügen → Run.
-- Kann gefahrlos mehrfach ausgeführt werden.

-- ===== 001_kundario_schema.sql =====
-- =====================================================================
-- Kundario – Datenbank (Supabase / Postgres 15+)
-- Jeder Datensatz gehört zu genau einem Betrieb. Zugriff nur für
-- Mitglieder dieses Betriebs (Row Level Security). Finanzdaten nur für
-- Geschäftsführung und Büro. Endkunden sehen nur, was über einen
-- geheimen Portal-Link freigegeben ist (Funktionen portal_*).
-- Ausführen: Supabase → SQL Editor → diesen Inhalt einfügen → Run.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Betriebe und Mitglieder ----------
create table if not exists public.betriebe (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 1),
  gewerk text,
  inhaber text,
  strasse text, plz text, ort text,
  telefon text, email text, website text,
  ust_id text, steuernummer text,
  bank text, iban text, bic text,
  stundensatz numeric(10,2) not null default 64,
  mwst numeric(5,2) not null default 19,
  zahlungsziel_tage int not null default 14,
  angebot_gueltig_tage int not null default 30,
  nachfass_tage int[] not null default '{3,7,14}',
  nachfassen_automatisch boolean not null default false,
  zaehler jsonb not null default '{}'::jsonb,
  logo_pfad text,
  created_at timestamptz not null default now()
);

create table if not exists public.mitglieder (
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  user_id uuid not null,
  rolle text not null check (rolle in ('gf','buero','aussen','monteur')),
  name text not null,
  email text,
  aktiv boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (betrieb_id, user_id)
);
create index if not exists mitglieder_user on public.mitglieder(user_id);

create table if not exists public.einladungen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  email text not null,
  name text not null,
  rolle text not null check (rolle in ('gf','buero','aussen','monteur')),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  angenommen_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Hilfsfunktionen für den Zugriffsschutz ----------
create or replace function public.ist_mitglied(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mitglieder m where m.betrieb_id = b and m.user_id = auth.uid() and m.aktiv);
$$;

create or replace function public.rolle_in(b uuid) returns text
language sql stable security definer set search_path = public as $$
  select m.rolle from public.mitglieder m where m.betrieb_id = b and m.user_id = auth.uid() and m.aktiv;
$$;

create or replace function public.darf_finanzen(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.rolle_in(b) in ('gf','buero'), false);
$$;

create or replace function public.darf_vertrieb(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.rolle_in(b) in ('gf','buero','aussen'), false);
$$;

-- ---------- Fachdaten ----------
create table if not exists public.kunden (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  art text not null default 'privat' check (art in ('privat','firma','hausverwaltung','oeffentlich')),
  name text not null check (length(trim(name)) > 0),
  ansprechpartner text,
  strasse text, plz text, ort text,
  telefon text, email text,
  notiz text,
  quelle text,
  bewertung_ok boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists kunden_betrieb on public.kunden(betrieb_id);

create table if not exists public.anfragen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  kunde_id uuid references public.kunden(id) on delete set null,
  kanal text not null default 'telefon' check (kanal in ('telefon','email','whatsapp','formular','empfehlung','portal','sonstiges')),
  betreff text not null,
  beschreibung text,
  ort text,
  wert_geschaetzt numeric(12,2),
  status text not null default 'neu' check (status in ('neu','in_pruefung','besichtigung','angebot','gewonnen','verloren','spam')),
  verlustgrund text,
  zugewiesen_an uuid,
  created_at timestamptz not null default now()
);
create index if not exists anfragen_betrieb on public.anfragen(betrieb_id, status);

create table if not exists public.angebote (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  nr text not null,
  kunde_id uuid references public.kunden(id) on delete set null,
  anfrage_id uuid references public.anfragen(id) on delete set null,
  titel text not null,
  einleitung text,
  positionen jsonb not null default '[]'::jsonb,
  mwst numeric(5,2) not null default 19,
  netto numeric(12,2) not null default 0,
  brutto numeric(12,2) not null default 0,
  status text not null default 'entwurf' check (status in ('entwurf','gesendet','angenommen','abgelehnt','abgelaufen')),
  gueltig_bis date,
  gesendet_at timestamptz,
  erinnert int not null default 0,
  letzte_erinnerung_at timestamptz,
  angenommen_at timestamptz,
  angenommen_name text,
  unterschrift text,
  ablehngrund text,
  portal_token text unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  unique (betrieb_id, nr)
);

create table if not exists public.auftraege (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  nr text not null,
  kunde_id uuid references public.kunden(id) on delete set null,
  angebot_id uuid references public.angebote(id) on delete set null,
  titel text not null,
  ort text,
  status text not null default 'geplant' check (status in ('geplant','in_arbeit','pausiert','abgeschlossen','storniert')),
  wert_netto numeric(12,2) not null default 0,
  start date, ende date,
  verantwortlich uuid,
  kalk jsonb not null default '{}'::jsonb,
  portal_token text unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  unique (betrieb_id, nr)
);

create table if not exists public.termine (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  auftrag_id uuid references public.auftraege(id) on delete cascade,
  kunde_id uuid references public.kunden(id) on delete set null,
  anfrage_id uuid references public.anfragen(id) on delete set null,
  art text not null default 'ausfuehrung' check (art in ('besichtigung','ausfuehrung','wartung','abnahme','intern','sonstiges')),
  titel text not null,
  beginn timestamptz not null,
  ende timestamptz,
  ort text,
  mitarbeiter uuid[] not null default '{}',
  notiz text,
  kunde_sichtbar boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists termine_zeit on public.termine(betrieb_id, beginn);

create table if not exists public.aufgaben (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  auftrag_id uuid references public.auftraege(id) on delete cascade,
  titel text not null,
  faellig date,
  zugewiesen_an uuid,
  erledigt boolean not null default false,
  erledigt_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.berichte (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  nr text not null,
  auftrag_id uuid references public.auftraege(id) on delete set null,
  datum date not null default current_date,
  mitarbeiter uuid,
  mitarbeiter_name text,
  stunden numeric(6,2) not null default 0 check (stunden >= 0 and stunden <= 24),
  taetigkeit text not null,
  material jsonb not null default '[]'::jsonb,
  material_euro numeric(12,2) not null default 0,
  zusatzleistung boolean not null default false,
  fotos text[] not null default '{}',
  unterschrift text,
  unterschrift_name text,
  unterschrieben_at timestamptz,
  status text not null default 'entwurf' check (status in ('entwurf','unterschrieben','abgerechnet')),
  created_at timestamptz not null default now(),
  unique (betrieb_id, nr)
);

create table if not exists public.rechnungen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  nr text not null,
  art text not null default 'rechnung' check (art in ('rechnung','abschlag','schluss','gutschrift')),
  kunde_id uuid references public.kunden(id) on delete set null,
  auftrag_id uuid references public.auftraege(id) on delete set null,
  positionen jsonb not null default '[]'::jsonb,
  mwst numeric(5,2) not null default 19,
  netto numeric(12,2) not null default 0,
  brutto numeric(12,2) not null default 0,
  leistungszeitraum text,
  datum date not null default current_date,
  faellig date,
  status text not null default 'entwurf' check (status in ('entwurf','gestellt','teilbezahlt','bezahlt','storniert')),
  mahnstufe int not null default 0,
  portal_token text unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  unique (betrieb_id, nr)
);

create table if not exists public.zahlungen (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  rechnung_id uuid not null references public.rechnungen(id) on delete cascade,
  betrag numeric(12,2) not null check (betrag <> 0),
  datum date not null default current_date,
  art text not null default 'ueberweisung',
  notiz text,
  created_at timestamptz not null default now()
);

create table if not exists public.material (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  auftrag_id uuid references public.auftraege(id) on delete set null,
  artikel text not null,
  menge numeric(12,2) not null default 1 check (menge > 0),
  einheit text not null default 'Stk.',
  preis numeric(12,2),
  lieferant text,
  status text not null default 'warenkorb' check (status in ('warenkorb','freigabe','bestellt','geliefert')),
  erstellt_von uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.aufmasse (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  anfrage_id uuid references public.anfragen(id) on delete set null,
  auftrag_id uuid references public.auftraege(id) on delete set null,
  titel text not null,
  daten jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.dokumente (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  kunde_id uuid references public.kunden(id) on delete set null,
  auftrag_id uuid references public.auftraege(id) on delete set null,
  name text not null,
  pfad text not null,
  typ text, groesse bigint,
  kunde_sichtbar boolean not null default false,
  created_at timestamptz not null default now()
);

-- Postausgang: Nachrichten werden erst nach Freigabe versendet (Versand über Edge Function)
create table if not exists public.nachrichten (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  kanal text not null default 'email' check (kanal in ('email','sms','whatsapp')),
  an text not null,
  betreff text,
  text text not null,
  bezug_typ text, bezug_id uuid,
  status text not null default 'freigabe' check (status in ('entwurf','freigabe','warteschlange','gesendet','fehler')),
  fehler text,
  gesendet_at timestamptz,
  created_at timestamptz not null default now()
);

-- Abläufe: jede automatische Ausführung mit Status und Protokoll
create table if not exists public.ablauf_laeufe (
  id uuid primary key default gen_random_uuid(),
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  ablauf text not null,
  titel text not null,
  status text not null default 'freigabe' check (status in ('ok','freigabe','fehler','manuell','aus')),
  grund text,
  versuche int not null default 1,
  protokoll jsonb not null default '[]'::jsonb,
  bezug_typ text, bezug_id uuid,
  created_at timestamptz not null default now()
);

-- Verlauf: wer hat wann was getan (für Kundenakte, Auftrag, Protokoll)
create table if not exists public.verlauf (
  id bigint generated always as identity primary key,
  betrieb_id uuid not null references public.betriebe(id) on delete cascade,
  bezug_typ text not null,
  bezug_id uuid,
  text text not null,
  user_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists verlauf_bezug on public.verlauf(betrieb_id, bezug_typ, bezug_id);

-- ---------- Zugriffsschutz (RLS) ----------
do $$
declare t text;
begin
  -- Tabellen, die alle Mitglieder des Betriebs lesen und schreiben dürfen
  foreach t in array array['kunden','anfragen','auftraege','termine','aufgaben','berichte','material','aufmasse','dokumente','verlauf'] loop
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
  -- Vertrieb: Angebote (nicht für Montagekräfte)
  foreach t in array array['angebote'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists vertrieb_alles on public.%I', t);
    execute format('create policy vertrieb_alles on public.%I for all to authenticated using (public.darf_vertrieb(betrieb_id)) with check (public.darf_vertrieb(betrieb_id))', t);
  end loop;
  -- Finanzen: nur Geschäftsführung und Büro
  foreach t in array array['rechnungen','zahlungen','nachrichten','ablauf_laeufe'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists finanzen_alles on public.%I', t);
    execute format('create policy finanzen_alles on public.%I for all to authenticated using (public.darf_finanzen(betrieb_id)) with check (public.darf_finanzen(betrieb_id))', t);
  end loop;
end $$;

alter table public.betriebe enable row level security;
drop policy if exists betrieb_lesen on public.betriebe;
drop policy if exists betrieb_aendern on public.betriebe;
create policy betrieb_lesen on public.betriebe for select to authenticated using (public.ist_mitglied(id));
create policy betrieb_aendern on public.betriebe for update to authenticated using (public.rolle_in(id) = 'gf') with check (public.rolle_in(id) = 'gf');

alter table public.mitglieder enable row level security;
drop policy if exists mitglieder_lesen on public.mitglieder;
drop policy if exists mitglieder_gf on public.mitglieder;
create policy mitglieder_lesen on public.mitglieder for select to authenticated using (public.ist_mitglied(betrieb_id));
create policy mitglieder_gf on public.mitglieder for update to authenticated using (public.rolle_in(betrieb_id) = 'gf') with check (public.rolle_in(betrieb_id) = 'gf');

alter table public.einladungen enable row level security;
drop policy if exists einladungen_gf on public.einladungen;
create policy einladungen_gf on public.einladungen for all to authenticated using (public.rolle_in(betrieb_id) = 'gf') with check (public.rolle_in(betrieb_id) = 'gf');

-- Montagekräfte: Kunden nur lesen, Termine/Aufträge nicht löschen (über buero_loeschen bereits geregelt)

-- ---------- Funktionen (RPC) ----------
-- Neuen Betrieb anlegen: der angemeldete Nutzer wird Geschäftsführung
create or replace function public.betrieb_anlegen(p_name text, p_gewerk text, p_inhaber text)
returns uuid language plpgsql security definer set search_path = public as $$
declare b uuid; e text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if exists (select 1 from public.mitglieder where user_id = auth.uid()) then raise exception 'Sie gehören bereits zu einem Betrieb'; end if;
  select email into e from auth.users where id = auth.uid();
  insert into public.betriebe(name, gewerk, inhaber, email) values (trim(p_name), p_gewerk, p_inhaber, e) returning id into b;
  insert into public.mitglieder(betrieb_id, user_id, rolle, name, email) values (b, auth.uid(), 'gf', coalesce(nullif(trim(p_inhaber),''), e), e);
  return b;
end $$;

-- Einladung annehmen (Mitarbeiter hat sich mit der eingeladenen E-Mail registriert)
create or replace function public.einladung_annehmen(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare i public.einladungen; e text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into i from public.einladungen where token = p_token and angenommen_at is null;
  if i.id is null then raise exception 'Einladung ungültig oder schon verwendet'; end if;
  select email into e from auth.users where id = auth.uid();
  if lower(e) <> lower(i.email) then raise exception 'Die Einladung gilt für eine andere E-Mail-Adresse'; end if;
  insert into public.mitglieder(betrieb_id, user_id, rolle, name, email) values (i.betrieb_id, auth.uid(), i.rolle, i.name, e)
    on conflict (betrieb_id, user_id) do update set rolle = excluded.rolle, aktiv = true;
  update public.einladungen set angenommen_at = now() where id = i.id;
  return i.betrieb_id;
end $$;

-- Fortlaufende Nummern je Betrieb, Art und Jahr: AN-2027-0001, AU-…, RB-…, RE-…
create or replace function public.naechste_nr(p_betrieb uuid, p_art text)
returns text language plpgsql security definer set search_path = public as $$
declare jahr text := to_char(now(), 'YYYY'); schluessel text; n int;
begin
  if not public.ist_mitglied(p_betrieb) then raise exception 'Kein Zugriff'; end if;
  if p_art not in ('AN','AU','RB','RE') then raise exception 'Unbekannte Nummernart'; end if;
  schluessel := p_art || '-' || jahr;
  update public.betriebe set zaehler = jsonb_set(zaehler, array[schluessel], to_jsonb(coalesce((zaehler->>schluessel)::int, 0) + 1))
    where id = p_betrieb returning (zaehler->>schluessel)::int into n;
  return p_art || '-' || jahr || '-' || lpad(n::text, 4, '0');
end $$;

-- Kundenportal: Angebot über geheimen Link ansehen (ohne Anmeldung)
create or replace function public.portal_angebot(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'angebot', jsonb_build_object('nr', a.nr, 'titel', a.titel, 'einleitung', a.einleitung, 'positionen', a.positionen, 'mwst', a.mwst, 'netto', a.netto, 'brutto', a.brutto,
      'status', a.status, 'gueltig_bis', a.gueltig_bis, 'gesendet_at', a.gesendet_at, 'angenommen_at', a.angenommen_at, 'angenommen_name', a.angenommen_name),
    'kunde', jsonb_build_object('name', k.name),
    'betrieb', jsonb_build_object('name', b.name, 'telefon', b.telefon, 'email', b.email, 'strasse', b.strasse, 'plz', b.plz, 'ort', b.ort))
  from public.angebote a join public.betriebe b on b.id = a.betrieb_id left join public.kunden k on k.id = a.kunde_id
  where a.portal_token = p_token and a.status in ('gesendet','angenommen','abgelehnt') and length(p_token) >= 24;
$$;

create or replace function public.portal_angebot_antwort(p_token text, p_annehmen boolean, p_name text, p_unterschrift text, p_grund text)
returns text language plpgsql security definer set search_path = public as $$
declare a public.angebote;
begin
  select * into a from public.angebote where portal_token = p_token and length(p_token) >= 24;
  if a.id is null then raise exception 'Link ungültig'; end if;
  if a.status <> 'gesendet' then raise exception 'Dieses Angebot wurde bereits beantwortet'; end if;
  if a.gueltig_bis is not null and a.gueltig_bis < current_date then raise exception 'Das Angebot ist abgelaufen. Bitte melden Sie sich beim Betrieb.'; end if;
  if p_annehmen then
    if coalesce(trim(p_name), '') = '' or coalesce(p_unterschrift, '') = '' then raise exception 'Bitte Name und Unterschrift angeben'; end if;
    if length(p_unterschrift) > 300000 then raise exception 'Unterschrift zu groß'; end if;
    update public.angebote set status = 'angenommen', angenommen_at = now(), angenommen_name = trim(p_name), unterschrift = p_unterschrift where id = a.id;
    insert into public.verlauf(betrieb_id, bezug_typ, bezug_id, text, user_id) values (a.betrieb_id, 'angebot', a.id, 'Angebot ' || a.nr || ' im Kundenportal angenommen von ' || trim(p_name), null);
    if a.anfrage_id is not null then update public.anfragen set status = 'gewonnen' where id = a.anfrage_id; end if;
    return 'angenommen';
  else
    update public.angebote set status = 'abgelehnt', ablehngrund = left(p_grund, 500) where id = a.id;
    insert into public.verlauf(betrieb_id, bezug_typ, bezug_id, text, user_id) values (a.betrieb_id, 'angebot', a.id, 'Angebot ' || a.nr || ' im Kundenportal abgelehnt' || coalesce(': ' || left(p_grund, 200), ''), null);
    return 'abgelehnt';
  end if;
end $$;

-- Kundenportal: Auftrag mit Terminen, Rechnungen und freigegebenen Dokumenten
create or replace function public.portal_auftrag(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'auftrag', jsonb_build_object('nr', au.nr, 'titel', au.titel, 'status', au.status, 'start', au.start, 'ende', au.ende),
    'kunde', jsonb_build_object('name', k.name),
    'betrieb', jsonb_build_object('name', b.name, 'telefon', b.telefon, 'email', b.email),
    'termine', coalesce((select jsonb_agg(jsonb_build_object('titel', t.titel, 'art', t.art, 'beginn', t.beginn, 'ende', t.ende) order by t.beginn) from public.termine t where t.auftrag_id = au.id and t.kunde_sichtbar), '[]'::jsonb),
    'rechnungen', coalesce((select jsonb_agg(jsonb_build_object('nr', r.nr, 'datum', r.datum, 'faellig', r.faellig, 'brutto', r.brutto, 'status', r.status, 'token', r.portal_token) order by r.datum) from public.rechnungen r where r.auftrag_id = au.id and r.status <> 'entwurf'), '[]'::jsonb),
    'berichte', coalesce((select jsonb_agg(jsonb_build_object('nr', x.nr, 'datum', x.datum, 'stunden', x.stunden, 'taetigkeit', x.taetigkeit, 'status', x.status) order by x.datum) from public.berichte x where x.auftrag_id = au.id and x.status <> 'entwurf'), '[]'::jsonb))
  from public.auftraege au join public.betriebe b on b.id = au.betrieb_id left join public.kunden k on k.id = au.kunde_id
  where au.portal_token = p_token and length(p_token) >= 24;
$$;

create or replace function public.portal_rechnung(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'rechnung', jsonb_build_object('nr', r.nr, 'art', r.art, 'datum', r.datum, 'faellig', r.faellig, 'positionen', r.positionen, 'mwst', r.mwst, 'netto', r.netto, 'brutto', r.brutto, 'status', r.status, 'leistungszeitraum', r.leistungszeitraum,
      'bezahlt', coalesce((select sum(z.betrag) from public.zahlungen z where z.rechnung_id = r.id), 0)),
    'kunde', jsonb_build_object('name', k.name, 'strasse', k.strasse, 'plz', k.plz, 'ort', k.ort),
    'betrieb', jsonb_build_object('name', b.name, 'strasse', b.strasse, 'plz', b.plz, 'ort', b.ort, 'telefon', b.telefon, 'email', b.email, 'ust_id', b.ust_id, 'steuernummer', b.steuernummer, 'bank', b.bank, 'iban', b.iban, 'bic', b.bic))
  from public.rechnungen r join public.betriebe b on b.id = r.betrieb_id left join public.kunden k on k.id = r.kunde_id
  where r.portal_token = p_token and r.status <> 'entwurf' and length(p_token) >= 24;
$$;

-- ---------- Rechte ----------
revoke all on all tables in schema public from anon;
revoke all on function public.ist_mitglied(uuid), public.rolle_in(uuid), public.darf_finanzen(uuid), public.darf_vertrieb(uuid),
  public.betrieb_anlegen(text, text, text), public.einladung_annehmen(text), public.naechste_nr(uuid, text),
  public.portal_angebot(text), public.portal_angebot_antwort(text, boolean, text, text, text), public.portal_auftrag(text), public.portal_rechnung(text) from public, anon;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.ist_mitglied(uuid), public.rolle_in(uuid), public.darf_finanzen(uuid), public.darf_vertrieb(uuid),
  public.betrieb_anlegen(text, text, text), public.einladung_annehmen(text), public.naechste_nr(uuid, text) to authenticated;
grant execute on function public.portal_angebot(text), public.portal_angebot_antwort(text, boolean, text, text, text), public.portal_auftrag(text), public.portal_rechnung(text) to anon, authenticated;

-- ===== 002_dateiablage.sql =====
-- Dateiablage für Dokumente und Baustellenfotos (privat).
-- Pfad immer: <betrieb_id>/<datei>. Nur Mitglieder des Betriebs dürfen lesen und hochladen.
insert into storage.buckets (id, name, public, file_size_limit)
values ('dokumente', 'dokumente', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "kundario_lesen" on storage.objects;
drop policy if exists "kundario_hochladen" on storage.objects;
drop policy if exists "kundario_loeschen" on storage.objects;
create policy "kundario_lesen" on storage.objects for select to authenticated
  using (bucket_id = 'dokumente' and public.ist_mitglied(((storage.foldername(name))[1])::uuid));
create policy "kundario_hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'dokumente' and public.ist_mitglied(((storage.foldername(name))[1])::uuid));
create policy "kundario_loeschen" on storage.objects for delete to authenticated
  using (bucket_id = 'dokumente' and public.darf_finanzen(((storage.foldername(name))[1])::uuid));

-- ===== 003_rechnungen_festschreiben.sql =====
-- GoBD: Gestellte Rechnungen sind festgeschrieben. Nur Status, Mahnstufe und Zahlungsstand dürfen sich noch ändern.
create or replace function public.rechnung_festschreiben() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'entwurf' then raise exception 'Gestellte Rechnungen können nicht gelöscht werden. Bitte stornieren.'; end if;
    return old;
  end if;
  if old.status <> 'entwurf' then
    if new.nr is distinct from old.nr or new.positionen is distinct from old.positionen or new.netto is distinct from old.netto or new.brutto is distinct from old.brutto
       or new.mwst is distinct from old.mwst or new.datum is distinct from old.datum or new.kunde_id is distinct from old.kunde_id or new.art is distinct from old.art
       or new.leistungszeitraum is distinct from old.leistungszeitraum or new.betrieb_id is distinct from old.betrieb_id then
      raise exception 'Gestellte Rechnungen sind festgeschrieben. Änderungen nur per Storno und neuer Rechnung.';
    end if;
    if new.status = 'entwurf' then raise exception 'Eine gestellte Rechnung kann nicht zurück in den Entwurf.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists rechnung_festschreiben on public.rechnungen;
create trigger rechnung_festschreiben before update or delete on public.rechnungen for each row execute function public.rechnung_festschreiben();

-- Unterschriebene Regieberichte: Inhalt bleibt, nur der Status darf weiter (abgerechnet)
create or replace function public.bericht_festschreiben() returns trigger language plpgsql as $$
begin
  if old.status <> 'entwurf' and (new.stunden is distinct from old.stunden or new.taetigkeit is distinct from old.taetigkeit or new.material is distinct from old.material
     or new.unterschrift is distinct from old.unterschrift or new.datum is distinct from old.datum) then
    raise exception 'Unterschriebene Berichte können nicht mehr geändert werden.';
  end if;
  return new;
end $$;
drop trigger if exists bericht_festschreiben on public.berichte;
create trigger bericht_festschreiben before update on public.berichte for each row execute function public.bericht_festschreiben();

-- ===== 004_ausbau.sql =====
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
