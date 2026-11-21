\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
reset role;
select set_config('test.tok', (select anfrage_token from public.betriebe b join public.mitglieder m on m.betrieb_id = b.id where m.user_id = '11111111-1111-1111-1111-111111111111' limit 1), false);
select pg_temp.pruef(length(current_setting('test.tok')) >= 24, 'Jeder Betrieb hat einen Anfrage-Link');
-- Ohne Anmeldung (anon): Betrieb lesen und Anfrage stellen
select pg_temp.als('');
select pg_temp.pruef((public.portal_betrieb(current_setting('test.tok')) ->> 'name') is not null, 'Link zeigt den Namen des Betriebs');
select pg_temp.pruef(public.portal_betrieb('falsch') is null and public.portal_betrieb(substr(current_setting('test.tok'), 1, 10)) is null, 'Falscher oder kurzer Link zeigt nichts');
select public.anfrage_einreichen(current_setting('test.tok'), 'Hausverwaltung Nord', 'hv@example.org', '', 'Ringstraße 10, Nürnberg', 'Heizungsprüfung § 60b', '8 Einheiten, Gaskessel 2005', 'hausverwaltung');
select public.anfrage_einreichen(current_setting('test.tok'), 'Hausverwaltung Nord', 'HV@example.org', '', '', 'Zweites Objekt', '', 'hausverwaltung');
do $$ declare ok boolean := false; begin
  begin perform public.anfrage_einreichen(current_setting('test.tok'), 'X', '', '', '', 'Betreff', '', 'privat'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Ohne E-Mail und Telefon abgelehnt');
end $$;
do $$ declare ok boolean := false; begin
  begin perform public.anfrage_einreichen('falsch-falsch-falsch-falsch-falsch', 'X', 'a@b.de', '', '', 'Betreff', '', 'privat'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Ungültiger Link abgelehnt');
end $$;
do $$ declare ok boolean := false; begin
  begin perform count(*) from public.anfragen; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Ohne Anmeldung keine Anfragen lesbar');
end $$;
-- Betrieb A sieht die Anfragen, Kunde nur einmal angelegt
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select pg_temp.pruef((select count(*) from anfragen where kanal = 'formular') = 2, 'Betrieb sieht beide Anfragen');
select pg_temp.pruef((select count(*) from kunden where quelle = 'Anfrage-Link') = 1 and (select art from kunden where quelle = 'Anfrage-Link') = 'hausverwaltung', 'Kunde über E-Mail wiedererkannt, Art Hausverwaltung');
-- Betrieb B sieht nichts davon
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select pg_temp.pruef((select count(*) from anfragen where kanal = 'formular') = 0, 'Fremder Betrieb sieht die Anfragen nicht');
-- Grenze: höchstens 20 Anfragen je Stunde über den Link
reset role;
insert into public.anfragen(betrieb_id, kanal, betreff) select b.id, 'formular', 'Last ' || g from public.betriebe b, generate_series(1, 18) g where b.anfrage_token = current_setting('test.tok');
select pg_temp.als('');
do $$ declare ok boolean := false; begin
  begin perform public.anfrage_einreichen(current_setting('test.tok'), 'Spam', 'spam@example.org', '', '', 'Spam', '', 'privat'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Mehr als 20 Anfragen je Stunde werden gebremst');
end $$;
reset role;
