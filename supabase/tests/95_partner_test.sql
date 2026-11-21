\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
reset role;
insert into auth.users values ('55555555-5555-5555-5555-555555555555', 'betreiber@kundario.test'), ('66666666-6666-6666-6666-666666666666', 'partner@beispiel.test') on conflict do nothing;
insert into public.betreiber(user_id) values ('55555555-5555-5555-5555-555555555555') on conflict do nothing;
select set_config('test.a', (select betrieb_id::text from public.mitglieder where user_id = '11111111-1111-1111-1111-111111111111' and rolle = 'gf' limit 1), false);
-- Betreiber legt Partner an
select pg_temp.als('55555555-5555-5555-5555-555555555555');
select pg_temp.pruef(public.ist_betreiber(), 'Betreiber erkannt');
insert into partner(name, email, code) values ('Paul Partner', 'Partner@Beispiel.test', 'MUSTER7');
do $$ declare ok boolean := false; begin
  begin insert into public.partner(name, email, code) values ('X', 'x@y.de', 'ab'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Ungültiger Code abgelehnt');
end $$;
-- Partner meldet sich an und wird über die E-Mail verknüpft
select pg_temp.als('66666666-6666-6666-6666-666666666666');
select pg_temp.pruef((public.ich_partner() ->> 'code') = 'MUSTER7', 'Partner über E-Mail verknüpft');
select pg_temp.pruef(not public.ist_betreiber(), 'Partner ist kein Betreiber');
insert into partner_meldungen(partner_id, betrieb_name, ort) select id, 'Rollladen Huber', 'Erlangen' from partner;
select pg_temp.pruef((select count(*) from partner_meldungen) = 1, 'Partner meldet einen Betrieb');
do $$ declare ok boolean := false; begin
  begin insert into public.partner_meldungen(partner_id, betrieb_name, status) select id, 'Schummel', 'angenommen' from public.partner; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Partner kann Meldung nicht selbst annehmen');
end $$;
update partner_meldungen set status = 'angenommen';
select pg_temp.pruef((select status from partner_meldungen limit 1) = 'offen', 'Partner kann den Status nicht ändern');
do $$ declare ok boolean := false; begin
  begin perform public.betreiber_betriebe(); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Partner sieht keine Liste der Betriebe');
end $$;
-- Betrieb A gibt bei der Registrierung den Code an
select pg_temp.als('22222222-2222-2222-2222-222222222222');
do $$ declare ok boolean := false; begin
  begin perform public.partner_code_setzen(current_setting('test.a')::uuid, 'MUSTER7'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Montagekraft kann keinen Partner-Code setzen');
end $$;
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select pg_temp.pruef(public.partner_code_setzen(current_setting('test.a')::uuid, ' muster7 '), 'Geschäftsführung setzt Partner-Code (Groß-/Kleinschreibung egal)');
select pg_temp.pruef(not public.partner_code_setzen(current_setting('test.a')::uuid, 'MUSTER7'), 'Code nur einmal');
select pg_temp.pruef((select count(*) from partner) = 0 and (select count(*) from partner_meldungen) = 0 and (select count(*) from vertraege) = 0, 'Betrieb sieht nichts vom Partnerbereich');
-- Fremder Betrieb sieht ebenfalls nichts
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select pg_temp.pruef((select count(*) from partner) = 0 and public.partner_uebersicht() = '[]'::jsonb, 'Fremder Betrieb sieht keine Partner');
-- Betreiber nimmt an und legt Vertrag an
select pg_temp.als('55555555-5555-5555-5555-555555555555');
select pg_temp.pruef(jsonb_array_length(public.betreiber_betriebe()) >= 2, 'Betreiber sieht alle Betriebe');
update partner_meldungen set status = 'angenommen' where quelle = 'link';
insert into vertraege(betrieb_id, beginn, bezahlt) values (current_setting('test.a')::uuid, '2027-04-01', '{2027-04-05,2027-05-05}');
select pg_temp.als('66666666-6666-6666-6666-666666666666');
select pg_temp.pruef((select count(*) from vertraege) = 0, 'Partner liest die Vertragstabelle nicht direkt');
select pg_temp.pruef((select count(*) from jsonb_array_elements(public.partner_uebersicht()) e where e -> 'vertrag' ->> 'beginn' = '2027-04-01') = 1 and public.partner_uebersicht()::text not like '%kunden%', 'Partner-Übersicht: Vertragszahlen seiner Meldung, keine Kundendaten');
reset role;
