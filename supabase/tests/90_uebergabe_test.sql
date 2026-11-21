\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
reset role;
select set_config('test.a', (select betrieb_id::text from public.mitglieder where user_id = '11111111-1111-1111-1111-111111111111' and rolle = 'gf' limit 1), false);
-- Chef (1111) verbindet Lexware, sieht nur die letzten 4 Zeichen
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select public.schnittstelle_setzen(current_setting('test.a')::uuid, 'lexware', 'geheimer-schluessel-1234567890-ABCD');
select pg_temp.pruef((public.schnittstellen_status(current_setting('test.a')::uuid) -> 0 ->> 'ende') = 'ABCD', 'Status zeigt nur die letzten 4 Zeichen');
do $$ declare ok boolean := false; begin
  begin perform api_key from public.schnittstellen; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Schlüssel ist für Nutzer nicht lesbar');
end $$;
do $$ declare ok boolean := false; begin
  begin perform public.schnittstelle_setzen(current_setting('test.a')::uuid, 'lexware', 'kurz'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Zu kurzer Schlüssel abgelehnt');
end $$;
insert into uebergaben(betrieb_id, rechnung_id, anbieter, extern_id) select betrieb_id, id, 'lexware', 'lx-1' from rechnungen where betrieb_id = current_setting('test.a')::uuid limit 1;
select pg_temp.pruef((select count(*) from uebergaben) = 1, 'Übergabe wird vermerkt');
-- Montagekraft (2222) darf weder verbinden noch Übergaben sehen
select pg_temp.als('22222222-2222-2222-2222-222222222222');
do $$ declare ok boolean := false; begin
  begin perform public.schnittstelle_setzen(current_setting('test.a')::uuid, 'sevdesk', 'geheimer-schluessel-1234567890-WXYZ'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Montagekraft kann kein Rechnungsprogramm verbinden');
end $$;
select pg_temp.pruef((select count(*) from uebergaben) = 0 and public.schnittstellen_status(current_setting('test.a')::uuid) = '[]'::jsonb, 'Montagekraft sieht weder Übergaben noch Verbindungsstatus');
-- Fremder Betrieb (3333): nichts sichtbar, kein Vermerk für fremde Rechnungen
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select pg_temp.pruef((select count(*) from uebergaben) = 0 and public.schnittstellen_status(current_setting('test.a')::uuid) = '[]'::jsonb, 'Fremder Betrieb sieht nichts');
do $$ declare ok boolean := false; begin
  begin perform public.schnittstelle_setzen(current_setting('test.a')::uuid, 'lexware', 'boeser-schluessel-1234567890-EVIL'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Fremder Betrieb kann den Schlüssel nicht überschreiben');
end $$;
-- Leerer Schlüssel trennt die Verbindung
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select public.schnittstelle_setzen(current_setting('test.a')::uuid, 'lexware', '');
select pg_temp.pruef(public.schnittstellen_status(current_setting('test.a')::uuid) = '[]'::jsonb, 'Verbindung getrennt');
reset role;
