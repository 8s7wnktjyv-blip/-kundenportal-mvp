\set ON_ERROR_STOP on
create or replace function pg_temp.als(u text) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claim.sub', u, false); if u = '' then execute 'set role anon'; else execute 'set role authenticated'; end if; end $$;
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
select pg_temp.als('11111111-1111-1111-1111-111111111111');
insert into kasse(betrieb_id, art, text, betrag) select betrieb_id, 'einlage', 'Anfangsbestand', 200 from mitglieder where user_id = auth.uid() and rolle = 'gf';
insert into kasse(betrieb_id, art, text, betrag, ust_satz) select betrieb_id, 'ausgabe', 'Schrauben', 50, 19 from mitglieder where user_id = auth.uid() and rolle = 'gf';
select pg_temp.pruef((select array_agg(nr order by nr) from kasse) = array[1,2], 'Kasse nummeriert fortlaufend');
do $$ declare ok boolean := false; begin
  begin insert into public.kasse(betrieb_id, art, text, betrag) select betrieb_id, 'ausgabe', 'Zu viel', 500 from public.mitglieder where user_id = auth.uid() and rolle = 'gf'; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Kassenbestand kann nicht negativ werden');
end $$;
do $$ declare ok boolean := false; n int; begin
  begin update public.kasse set betrag = 1; get diagnostics n = row_count; ok := n = 0; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Kassenbuchung kann nicht geändert werden');
  ok := false;
  begin delete from public.kasse; get diagnostics n = row_count; ok := n = 0; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Kassenbuchung kann nicht gelöscht werden');
end $$;
insert into kasse(betrieb_id, art, text, betrag, storno_von) select betrieb_id, 'einnahme', 'Storno', 1, id from kasse where nr = 2;
select pg_temp.pruef((select art = 'ausgabe' and betrag = 50 and nr = 3 from kasse where storno_von is not null), 'Storno übernimmt die Werte der Buchung');
do $$ declare ok boolean := false; begin
  begin insert into public.kasse(betrieb_id, art, text, betrag, storno_von) select betrieb_id, 'ausgabe', 'Nochmal', 1, id from public.kasse where nr = 2; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Eine Buchung kann nur einmal storniert werden');
end $$;
select pg_temp.als('22222222-2222-2222-2222-222222222222');
select pg_temp.pruef((select count(*) from kasse) = 0, 'Monteur sieht die Kasse nicht');
do $$ declare ok boolean := false; begin
  begin insert into public.kasse(betrieb_id, art, text, betrag) select betrieb_id, 'einnahme', 'x', 5 from public.mitglieder where user_id = auth.uid(); exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Monteur kann nicht in die Kasse buchen');
end $$;
select pg_temp.als('33333333-3333-3333-3333-333333333333');
select pg_temp.pruef((select count(*) from kasse) = 0, 'Fremder Betrieb sieht die Kasse nicht');
reset role;
select 'KASSE BESTANDEN' as ergebnis;
