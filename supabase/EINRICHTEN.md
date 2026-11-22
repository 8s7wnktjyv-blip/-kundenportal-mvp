# Kundario einrichten (Supabase)

1. **Datenbank:** Supabase → SQL Editor → New query → Inhalt von `Kundario_Datenbank_einrichten.sql` einfügen → Run.
   Kann mehrfach ausgeführt werden.
2. **Anmelde-Links:** Authentication → URL Configuration
   - Site URL: `https://8s7wnktjyv-blip.github.io/-kundenportal-mvp/app/`
   - Redirect URLs: `https://8s7wnktjyv-blip.github.io/-kundenportal-mvp/app/**`
3. **E-Mail-Bestätigung:** Authentication → Sign In / Providers → Email → „Confirm email“ eingeschaltet lassen.
4. **Vor dem echten Start:** eigenen E-Mail-Versand (SMTP) hinterlegen (Authentication → Emails → SMTP Settings).
   Der eingebaute Versand von Supabase ist nur für Tests gedacht und auf wenige E-Mails pro Stunde begrenzt.
5. **Auftragsverarbeitung:** In Supabase unter Organization → Legal den Vertrag zur Auftragsverarbeitung (DPA) abschließen.

**Update November 2026 (schon eingerichtete Datenbank):** SQL Editor → New query → Inhalt von `Kundario_Update_004.sql` einfügen → Run. Ergänzt Katalog, Vorlagen, Zeiterfassung, Wartungsverträge, Protokolle, Steuerfälle (§ 13b, § 19), Logo, Kundenlink sperren und Fehlerprotokoll. Vorhandene Daten bleiben erhalten.

**Update 005 (Lager, Ausgaben, Kontostand, Steuerberater-Export):** genauso mit `Kundario_Update_005.sql`.

**Update 006 (Eingangsrechnungen, Datanorm, Kalkulation im Katalog):** genauso mit `Kundario_Update_006.sql`.

**Update 007 (Kassenbuch, Umsatzsteuer, Stundensatz, Nachkalkulation, Wiedervorlage):** genauso mit `Kundario_Update_007.sql`. Bitte vor dem Veröffentlichen der neuen App-Version ausführen.

**Update 008 (Fristen-Service für Hausverwaltungen: Objekte, Anlagen, Fristen):** genauso mit `Kundario_Update_008.sql`. Bitte vor dem Veröffentlichen der neuen App-Version ausführen.

**Update 009 (Anfrage-Link je Betrieb für die eigene Website und für Beauftragungen durch Hausverwaltungen):** genauso mit `Kundario_Update_009.sql`. Erst Update 008, dann 009.

**Update 010 (Rechnungen als Entwurf an Lexware Office / sevDesk übergeben):** genauso mit `Kundario_Update_010.sql`. Danach die Server-Funktion veröffentlichen: im Terminal `supabase functions deploy rechnung-uebergeben`. Zum ersten Ausprobieren ohne echte Übergabe in Supabase → Edge Functions → Secrets `UEBERGABE_ATTRAPPE` = `1` setzen; mit Testkonten bei Lexware Office bzw. sevDesk wieder entfernen. Den API-Schlüssel trägt jeder Betrieb selbst in der App unter Einstellungen → Rechnungsprogramm ein.

**Update 011 (Partnerbereich):** genauso mit `Kundario_Update_011.sql`. Danach sich selbst als Betreiber eintragen (SQL Editor): `insert into public.betreiber(user_id) select id from auth.users where email = 'IHRE-ADRESSE';` – dann in der App unter Adresse `#/betreiber`.

Tests lokal: `PGHOST=… sh supabase/tests/lauf.sh` (Datenbank) und `node tools/e2e_app.js` und `node tools/e2e_ausbau.js` (App im Testmodus).

## Vorbereitet, braucht ein Konto (nicht eingerichtet)

Diese Punkte brauchen ein Konto oder einen Vertrag. Kundario hat dafür noch nichts abgeschlossen.

- **E-Mails direkt aus Kundario senden** (Angebote, Rechnungen, Erinnerungen): Heute öffnet Kundario das E-Mail-Programm des Nutzers. Fertig vorbereitet ist die Edge Function `supabase/functions/email-senden`. Sie arbeitet mit jedem Anbieter, der SMTP anbietet. Einschalten, wenn ein Anbieter mit Server in der EU und Auftragsverarbeitungsvertrag gewählt ist:
  1. Eigene Absender-Domain beim Anbieter bestätigen (SPF und DKIM).
  2. Supabase → Edge Functions → Secrets: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ABSENDER` eintragen.
  3. Funktion bereitstellen (Supabase CLI: `supabase functions deploy email-senden`).
  4. In `app/js/config.js` `emailVersand: true` setzen und veröffentlichen.
  Die Zugangsdaten des Anbieters stehen danach nur in Supabase, nie in der App. Klappt der Versand nicht, öffnet sich wie bisher das E-Mail-Programm.
  Dieselben SMTP-Daten gehören auch unter Authentication → Emails → SMTP Settings, damit Bestätigungs- und Passwort-Mails zuverlässig ankommen.
- **Bezahlung des Abos:** Zahlungsanbieter mit Konto auf den Betrieb Kundario. Erst nach Gewerbeanmeldung sinnvoll.
- **KI-Antworten im Assistenten:** vorbereitet in `supabase/functions/ki-assistent`. Braucht ein Konto bei einem KI-Anbieter mit Auftragsverarbeitungsvertrag. Secrets `KI_SCHLUESSEL` (optional `KI_MODELL`), Funktion bereitstellen, in `config.js` `kiAssistent: true`. Es wird nur die Frage gesendet, keine Kundendaten.
- **Bank, Großhändler, Google/Outlook-Kalender, DATEV Unternehmen online:** brauchen jeweils einen Vertrag oder Zugang beim Anbieter. Bis dahin: Kontoauszug als CSV einlesen, Bestellung per E-Mail oder Datei, Termine als Kalenderdatei, Export als Datei.
- **Supabase Pro:** Für den Echtbetrieb mit zahlenden Kunden (tägliche Sicherungen, kein Pausieren bei Inaktivität). Kostenpflichtig, Preis bitte auf supabase.com/pricing prüfen.
