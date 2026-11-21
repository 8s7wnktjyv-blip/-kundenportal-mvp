-- Kundario – Update 009: Anfrage-Link je Betrieb (eigene Website, Beauftragung durch Hausverwaltungen). Kann mehrfach ausgeführt werden.
alter table public.betriebe add column if not exists anfrage_token text unique default encode(gen_random_bytes(18), 'hex');
update public.betriebe set anfrage_token = encode(gen_random_bytes(18), 'hex') where anfrage_token is null;

-- Öffentlich lesbar über den Link: nur Name, Gewerk und Kontakt des Betriebs
create or replace function public.portal_betrieb(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', b.name, 'gewerk', b.gewerk, 'ort', b.ort, 'telefon', b.telefon, 'email', b.email)
  from public.betriebe b where b.anfrage_token = p_token and length(p_token) >= 24 and coalesce(b.gewerk, '') <> 'Hausverwaltung';
$$;

-- Anfrage über den Link einreichen: legt Kunde (oder findet ihn über die E-Mail) und Anfrage an
create or replace function public.anfrage_einreichen(p_token text, p_name text, p_email text, p_telefon text, p_ort text, p_betreff text, p_text text, p_art text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b public.betriebe; k uuid; n int;
begin
  select * into b from public.betriebe where anfrage_token = p_token and length(p_token) >= 24 and coalesce(gewerk, '') <> 'Hausverwaltung';
  if b.id is null then raise exception 'Anfrage-Link ungültig'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 or length(p_name) > 120 then raise exception 'Bitte einen Namen angeben'; end if;
  if length(trim(coalesce(p_email, ''))) = 0 and length(trim(coalesce(p_telefon, ''))) = 0 then raise exception 'Bitte E-Mail oder Telefon angeben'; end if;
  if coalesce(p_email, '') <> '' and (length(p_email) > 200 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'E-Mail-Adresse prüfen'; end if;
  if length(trim(coalesce(p_betreff, ''))) = 0 or length(p_betreff) > 200 or length(coalesce(p_text, '')) > 5000 or length(coalesce(p_ort, '')) > 300 or length(coalesce(p_telefon, '')) > 50 then raise exception 'Angaben zu lang oder Betreff fehlt'; end if;
  select count(*) into n from public.anfragen where betrieb_id = b.id and kanal = 'formular' and created_at > now() - interval '1 hour';
  if n >= 20 then raise exception 'Gerade sind sehr viele Anfragen eingegangen. Bitte später erneut versuchen oder anrufen.'; end if;
  if coalesce(p_email, '') <> '' then select id into k from public.kunden where betrieb_id = b.id and lower(email) = lower(trim(p_email)) limit 1; end if;
  if k is null then
    insert into public.kunden(betrieb_id, art, name, email, telefon, ort, quelle)
    values (b.id, case when p_art in ('privat','firma','hausverwaltung') then p_art else 'privat' end, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_telefon), ''), nullif(trim(p_ort), ''), 'Anfrage-Link')
    returning id into k;
  end if;
  insert into public.anfragen(betrieb_id, kunde_id, kanal, betreff, beschreibung, ort, status) values (b.id, k, 'formular', trim(p_betreff), nullif(trim(p_text), ''), nullif(trim(p_ort), ''), 'neu');
  return jsonb_build_object('betrieb', b.name);
end $$;

revoke all on function public.portal_betrieb(text), public.anfrage_einreichen(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.portal_betrieb(text), public.anfrage_einreichen(text, text, text, text, text, text, text, text) to anon, authenticated;
