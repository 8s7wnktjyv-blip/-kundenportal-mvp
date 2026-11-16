-- Prüft den Zugriffsschutz. Jede fehlgeschlagene Prüfung bricht mit Fehler ab.
\set ON_ERROR_STOP on
insert into auth.users values ('11111111-1111-1111-1111-111111111111','chef@a.de'),('22222222-2222-2222-2222-222222222222','monteur@a.de'),('33333333-3333-3333-3333-333333333333','chef@b.de'),('44444444-4444-4444-4444-444444444444','fremd@x.de');
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false);
  if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;

-- Betrieb A anlegen
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select public.betrieb_anlegen('Malerbetrieb A', 'maler', 'Anna Chef') as a \gset
select pg_temp.pruef((select count(*) from betriebe) = 1, 'Chef A sieht seinen Betrieb');
select pg_temp.pruef(public.naechste_nr(:'a', 'AN') like 'AN-____-0001', 'Nummer 1');
select pg_temp.pruef(public.naechste_nr(:'a', 'AN') like 'AN-____-0002', 'Nummer 2 fortlaufend');
insert into einladungen(betrieb_id, email, name, rolle) values (:'a', 'monteur@a.de', 'Max Monteur', 'monteur') returning token as tok \gset
insert into kunden(betrieb_id, name) values (:'a', 'Familie Huber') returning id as k \gset
insert into angebote(betrieb_id, nr, kunde_id, titel, status, gueltig_bis, netto, brutto) values (:'a', 'AN-2026-0001', :'k', 'Bad streichen', 'gesendet', current_date + 30, 1000, 1190) returning portal_token as atok \gset
insert into auftraege(betrieb_id, nr, kunde_id, titel) values (:'a', 'AU-2026-0001', :'k', 'Bad streichen') returning id as au \gset
insert into rechnungen(betrieb_id, nr, kunde_id, auftrag_id, status, netto, brutto) values (:'a', 'RE-2026-0001', :'k', :'au', 'gestellt', 100, 119) returning portal_token as rtok \gset

-- Monteur nimmt Einladung an
select pg_temp.als('22222222-2222-2222-2222-222222222222');
select public.einladung_annehmen(:'tok');
select pg_temp.pruef((select count(*) from kunden) = 1, 'Monteur sieht Kunden');
select pg_temp.pruef((select count(*) from auftraege) = 1, 'Monteur sieht Aufträge');
select pg_temp.pruef((select count(*) from rechnungen) = 0, 'Monteur sieht KEINE Rechnungen');
select pg_temp.pruef((select count(*) from angebote) = 0, 'Monteur sieht KEINE Angebote');
insert into berichte(betrieb_id, nr, auftrag_id, stunden, taetigkeit) values (:'a', 'RB-2026-0001', :'au', 4, 'Wände gestrichen');
select pg_temp.pruef((select count(*) from berichte) = 1, 'Monteur schreibt Regiebericht');
delete from kunden; select pg_temp.pruef((select count(*) from kunden) = 1, 'Monteur kann Kunden nicht löschen');
update betriebe set name = 'Gehackt'; select pg_temp.pruef((select name from betriebe) = 'Malerbetrieb A', 'Monteur kann Betrieb nicht ändern');

-- Fremder Betrieb B sieht nichts von A
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select public.betrieb_anlegen('Elektro B', 'elektro', 'Bert') as b \gset
select pg_temp.pruef((select count(*) from kunden) = 0, 'Betrieb B sieht keine Kunden von A');
select pg_temp.pruef((select count(*) from betriebe) = 1, 'Betrieb B sieht nur sich');
do $$ begin
  begin insert into kunden(betrieb_id, name) select id, 'Eingeschleust' from betriebe where false; end;
end $$;
select pg_temp.pruef(not exists (select 1 from rechnungen), 'B sieht keine Rechnungen von A');
do $$ declare ok boolean := false; begin
  begin perform public.naechste_nr((select id from public.betriebe where name='Malerbetrieb A' limit 1), 'AN'); exception when others then ok := true; end;
end $$;

-- Nutzer ohne Betrieb sieht nichts
select pg_temp.als('44444444-4444-4444-4444-444444444444');
select pg_temp.pruef((select count(*) from kunden) + (select count(*) from betriebe) + (select count(*) from auftraege) = 0, 'Fremder Nutzer sieht nichts');

-- Portal ohne Anmeldung
select pg_temp.als('');
select pg_temp.pruef((public.portal_angebot(:'atok')->'angebot'->>'nr') = 'AN-2026-0001', 'Portal zeigt Angebot über Link');
select pg_temp.pruef(public.portal_angebot('falsch-falsch-falsch-falsch-123') is null, 'Falscher Link zeigt nichts');
select pg_temp.pruef((public.portal_rechnung(:'rtok')->'rechnung'->>'nr') = 'RE-2026-0001', 'Portal zeigt Rechnung über Link');
do $$ declare n int; begin
  begin select count(*) into n from public.kunden; raise exception 'anon darf kunden lesen'; exception when insufficient_privilege then null; end;
end $$;
select pg_temp.pruef(true, 'Ohne Anmeldung kein Zugriff auf Tabellen');
select public.portal_angebot_antwort(:'atok', true, 'Hans Huber', 'data:image/png;base64,AAAA', null);
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select pg_temp.pruef((select status from angebote limit 1) = 'angenommen', 'Annahme im Portal kommt im Betrieb an');
select pg_temp.pruef((select count(*) from verlauf where text like '%angenommen von Hans Huber%') = 1, 'Annahme steht im Verlauf');
reset role;
select 'ALLE PRÜFUNGEN BESTANDEN' as ergebnis;
