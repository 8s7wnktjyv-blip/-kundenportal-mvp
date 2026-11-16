-- GoBD: Gestellte Rechnungen sind festgeschrieben. Nur Status, Mahnstufe und Zahlungsstand dürfen sich noch ändern.
create or replace function public.rechnung_festschreiben() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'entwurf' then raise exception 'Gestellte Rechnungen können nicht gelöscht werden. Bitte stornieren.'; end if;
    return old;
  end if;
  if old.status <> 'entwurf' then
    if new.nr is distinct from old.nr or new.positionen is distinct from old.positionen or new.netto is distinct from old.netto or new.brutto is distinct from old.brutto
       or new.mwst is distinct from old.mwst or new.datum is distinct from old.datum or new.kunde_id is distinct from old.kunde_id or new.art is distinct from old.art
       or new.leistungszeitraum is distinct from old.leistungszeitraum or new.betrieb_id is distinct from old.betrieb_id then
      raise exception 'Gestellte Rechnungen sind festgeschrieben. Änderungen nur per Storno und neuer Rechnung.';
    end if;
    if new.status = 'entwurf' then raise exception 'Eine gestellte Rechnung kann nicht zurück in den Entwurf.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists rechnung_festschreiben on public.rechnungen;
create trigger rechnung_festschreiben before update or delete on public.rechnungen for each row execute function public.rechnung_festschreiben();

-- Unterschriebene Regieberichte: Inhalt bleibt, nur der Status darf weiter (abgerechnet)
create or replace function public.bericht_festschreiben() returns trigger language plpgsql as $$
begin
  if old.status <> 'entwurf' and (new.stunden is distinct from old.stunden or new.taetigkeit is distinct from old.taetigkeit or new.material is distinct from old.material
     or new.unterschrift is distinct from old.unterschrift or new.datum is distinct from old.datum) then
    raise exception 'Unterschriebene Berichte können nicht mehr geändert werden.';
  end if;
  return new;
end $$;
drop trigger if exists bericht_festschreiben on public.berichte;
create trigger bericht_festschreiben before update on public.berichte for each row execute function public.bericht_festschreiben();
