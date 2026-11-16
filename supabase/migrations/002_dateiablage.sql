-- Dateiablage für Dokumente und Baustellenfotos (privat).
-- Pfad immer: <betrieb_id>/<datei>. Nur Mitglieder des Betriebs dürfen lesen und hochladen.
insert into storage.buckets (id, name, public, file_size_limit)
values ('dokumente', 'dokumente', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "kundario_lesen" on storage.objects;
drop policy if exists "kundario_hochladen" on storage.objects;
drop policy if exists "kundario_loeschen" on storage.objects;
create policy "kundario_lesen" on storage.objects for select to authenticated
  using (bucket_id = 'dokumente' and public.ist_mitglied(((storage.foldername(name))[1])::uuid));
create policy "kundario_hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'dokumente' and public.ist_mitglied(((storage.foldername(name))[1])::uuid));
create policy "kundario_loeschen" on storage.objects for delete to authenticated
  using (bucket_id = 'dokumente' and public.darf_finanzen(((storage.foldername(name))[1])::uuid));
