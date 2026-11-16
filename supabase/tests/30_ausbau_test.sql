\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
-- Monteur (2222) erfasst Zeit, sieht nur eigene; Chef (1111) sieht alle
select pg_temp.als('22222222-2222-2222-2222-222222222222');
insert into zeiten(betrieb_id, user_id, beginn, ende) select betrieb_id, auth.uid(), now() - interval '8 hours', now() from mitglieder where user_id = auth.uid();
select pg_temp.pruef((select count(*) from zeiten) = 1, 'Monteur erfasst eigene Zeit');
do $$ declare ok boolean := false; begin
  begin insert into public.zeiten(betrieb_id, user_id, beginn) select betrieb_id, '11111111-1111-1111-1111-111111111111', now() from public.mitglieder where user_id = auth.uid(); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Monteur kann keine Zeit für andere buchen');
end $$;
select pg_temp.als('11111111-1111-1111-1111-111111111111');
insert into zeiten(betrieb_id, user_id, beginn, ende) select betrieb_id, auth.uid(), now() - interval '2 hours', now() from mitglieder where user_id = auth.uid() and rolle='gf';
select pg_temp.pruef((select count(*) from zeiten) = 2, 'Chef sieht alle Zeiten');
select pg_temp.als('22222222-2222-2222-2222-222222222222');
select pg_temp.pruef((select count(*) from zeiten) = 1, 'Monteur sieht nur eigene Zeiten');
select pg_temp.pruef((select count(*) from fehlerlog) = 0, 'Monteur liest kein Fehlerprotokoll');
insert into fehlerlog(betrieb_id, text) select betrieb_id, 'Test' from mitglieder where user_id = auth.uid();
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select pg_temp.pruef((select count(*) from fehlerlog) = 1, 'Chef sieht Fehlerprotokoll');
insert into artikel(betrieb_id, text, preis) select betrieb_id, 'Wandfarbe', 12 from mitglieder where user_id = auth.uid() and rolle='gf';
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select pg_temp.pruef((select count(*) from artikel) = 0, 'Fremder Betrieb sieht keinen Katalog');
-- Portal-Link sperren
select pg_temp.als('11111111-1111-1111-1111-111111111111');
update rechnungen set portal_aktiv = false where nr = 'RE-2026-0001' returning portal_token as rt \gset
select pg_temp.als('');
select pg_temp.pruef(public.portal_rechnung(:'rt') is null, 'Gesperrter Rechnungslink zeigt nichts');
reset role;
do $$ declare ok boolean := false; begin
  begin update public.rechnungen set steuerfall = '13b' where nr = 'RE-2026-0001'; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Steuerfall gestellter Rechnung festgeschrieben');
end $$;
select 'AUSBAU BESTANDEN' as ergebnis;
