\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
-- Betrieb B (3333) legt Objekt, Anlage und Frist an
select pg_temp.als('33333333-3333-3333-3333-333333333333');
insert into objekte(betrieb_id, name, einheiten) select betrieb_id, 'Ringstraße 10', 8 from mitglieder where user_id = auth.uid();
insert into anlagen(betrieb_id, objekt_id, art, einbau_jahr) select o.betrieb_id, o.id, 'heizkessel', 2005 from objekte o;
insert into fristen(betrieb_id, objekt_id, anlage_id, titel, grundlage, faellig) select a.betrieb_id, a.objekt_id, a.id, 'Heizungsprüfung § 60b', '60b', '2027-09-30' from anlagen a;
select pg_temp.pruef((select count(*) from fristen) = 1 and (select status from fristen) = 'offen', 'Verwaltung legt Objekt, Anlage und Frist an');
do $$ declare ok boolean := false; begin
  begin insert into public.anlagen(betrieb_id, objekt_id, art) values ((select betrieb_id from public.objekte limit 1), (select id from public.objekte limit 1), 'kernkraftwerk'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Unbekannte Anlagenart wird abgelehnt');
end $$;
-- Betrieb A (1111) sieht nichts davon und kann nichts einschleusen
select pg_temp.als('11111111-1111-1111-1111-111111111111');
select pg_temp.pruef((select count(*) from objekte) = 0 and (select count(*) from anlagen) = 0 and (select count(*) from fristen) = 0, 'Fremder Betrieb sieht keine Objekte, Anlagen, Fristen');
do $$ declare ok boolean := false; begin
  begin insert into public.objekte(betrieb_id, name) select o.betrieb_id, 'Eingeschleust' from public.objekte o where false; insert into public.objekte(betrieb_id, name) values ((select betrieb_id from public.mitglieder where user_id = '33333333-3333-3333-3333-333333333333'), 'Eingeschleust'); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Fremder Betrieb kann kein Objekt bei B anlegen');
end $$;
insert into objekte(betrieb_id, name) select betrieb_id, 'Eigenes Objekt A' from mitglieder where user_id = auth.uid() and rolle = 'gf';
do $$ declare ok boolean := false; begin
  begin
    reset role; -- Objekt-ID von B nur für den Test holen
    perform set_config('test.obj_b', (select id::text from public.objekte where name = 'Ringstraße 10'), false);
    perform pg_temp.als('11111111-1111-1111-1111-111111111111');
    insert into public.anlagen(betrieb_id, objekt_id, art) select betrieb_id, current_setting('test.obj_b')::uuid, 'heizkessel' from public.mitglieder where user_id = auth.uid() and rolle = 'gf';
  exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Anlage mit eigenem Betrieb, aber fremdem Objekt wird abgelehnt');
end $$;
select pg_temp.als('11111111-1111-1111-1111-111111111111');
update fristen set status = 'erledigt';
reset role;
select pg_temp.pruef((select status from public.fristen where titel = 'Heizungsprüfung § 60b') = 'offen', 'Fremder Betrieb kann Frist nicht ändern');
-- Montagekraft (2222) darf in Betrieb A nichts löschen
select pg_temp.als('22222222-2222-2222-2222-222222222222');
delete from objekte;
reset role;
select pg_temp.pruef((select count(*) from public.objekte where name = 'Eigenes Objekt A') = 1, 'Montagekraft kann keine Objekte löschen');
-- Objekt löschen entfernt Anlagen und Fristen mit
select pg_temp.als('33333333-3333-3333-3333-333333333333');
delete from objekte;
select pg_temp.pruef((select count(*) from anlagen) = 0 and (select count(*) from fristen) = 0, 'Objekt löschen entfernt Anlagen und Fristen');
reset role;
