\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
select pg_temp.als('22222222-2222-2222-2222-222222222222');
insert into lager(betrieb_id, text, bestand) select betrieb_id, 'Kabel', 50 from mitglieder where user_id = auth.uid();
select pg_temp.pruef((select count(*) from lager) = 1, 'Monteur legt Lagerartikel an');
do $$ declare ok boolean := false; begin
  begin insert into public.ausgaben(betrieb_id, text, betrag, datum) select betrieb_id, 'Miete', 900, current_date from public.mitglieder where user_id = auth.uid(); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Monteur kann keine Ausgaben anlegen');
end $$;
select pg_temp.pruef((select count(*) from kontostaende) = 0, 'Monteur sieht keinen Kontostand');
select pg_temp.als('11111111-1111-1111-1111-111111111111');
insert into ausgaben(betrieb_id, text, betrag, datum, wiederholung) select betrieb_id, 'Miete', 900, current_date, 'monatlich' from mitglieder where user_id = auth.uid() and rolle = 'gf';
insert into kontostaende(betrieb_id, betrag) select betrieb_id, 12000 from mitglieder where user_id = auth.uid() and rolle = 'gf';
select pg_temp.pruef((select count(*) from ausgaben) = 1 and (select count(*) from kontostaende) = 1, 'Chef pflegt Ausgaben und Kontostand');
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select pg_temp.pruef((select count(*) from lager) + (select count(*) from ausgaben) = 0, 'Fremder Betrieb sieht nichts');
reset role;
select 'EINKAUF BESTANDEN' as ergebnis;
