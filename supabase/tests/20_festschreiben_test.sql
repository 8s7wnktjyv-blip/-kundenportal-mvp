\set ON_ERROR_STOP on
create or replace function pg_temp.pruef(ok boolean, was text) returns void language plpgsql as $$ begin
  if not ok then raise exception 'PRÜFUNG FEHLGESCHLAGEN: %', was; end if; raise notice 'OK %', was; end $$;
do $$ declare ok boolean := false; begin
  begin update public.rechnungen set brutto = 1 where nr = 'RE-2026-0001'; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Gestellte Rechnung: Betrag nicht änderbar');
  ok := false; begin delete from public.rechnungen where nr = 'RE-2026-0001'; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Gestellte Rechnung: nicht löschbar');
end $$;
update public.rechnungen set status = 'bezahlt' where nr = 'RE-2026-0001';
select pg_temp.pruef((select status from public.rechnungen where nr = 'RE-2026-0001') = 'bezahlt', 'Status darf sich ändern');
update public.berichte set status = 'unterschrieben' where nr = 'RB-2026-0001';
do $$ declare ok boolean := false; begin
  begin update public.berichte set stunden = 9 where nr = 'RB-2026-0001'; exception when others then ok := true; end;
  perform pg_temp.pruef(ok, 'Unterschriebener Bericht: Stunden nicht änderbar');
end $$;
select 'FESTSCHREIBEN BESTANDEN' as ergebnis;
