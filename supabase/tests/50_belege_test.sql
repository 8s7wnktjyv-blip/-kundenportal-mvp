\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
select pg_temp.als('22222222-2222-2222-2222-222222222222');
insert into belege(betrieb_id, lieferant, brutto) select betrieb_id, 'Tankstelle', 80 from mitglieder where user_id = auth.uid();
select pg_temp.pruef((select count(*) from belege) = 0, 'Monteur reicht Beleg ein, sieht aber keine Belege');
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select pg_temp.pruef((select count(*) from belege where lieferant = 'Tankstelle') = 1, 'Chef sieht den eingereichten Beleg');
update belege set status = 'bezahlt', bezahlt_am = current_date;
select pg_temp.pruef((select count(*) from belege where status = 'bezahlt') = 1, 'Chef markiert bezahlt');
update artikel set minuten = 30, material_ek = 4.5 where false;
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select pg_temp.pruef((select count(*) from belege) = 0, 'Fremder Betrieb sieht keine Belege');
reset role;
select 'BELEGE BESTANDEN' as ergebnis;
