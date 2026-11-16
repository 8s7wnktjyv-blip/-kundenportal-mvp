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

Tests lokal: `PGHOST=… sh supabase/tests/lauf.sh` (Datenbank) und `node tools/e2e_app.js` und `node tools/e2e_ausbau.js` (App im Testmodus).

## Vorbereitet, braucht ein Konto (nicht eingerichtet)

Diese Punkte brauchen ein Konto oder einen Vertrag. Kundario hat dafür noch nichts abgeschlossen.

- **E-Mails direkt aus Kundario senden** (Angebote, Rechnungen, Erinnerungen): Heute öffnet Kundario das E-Mail-Programm des Nutzers. Für echten Versand braucht es einen E-Mail-Dienst mit Server in der EU und Auftragsverarbeitungsvertrag, dazu eine eigene Absender-Domain. Danach eine Supabase Edge Function, die den Dienst aufruft. Der Schlüssel des Dienstes kommt nur in Supabase (Edge Functions → Secrets), nie in die App.
- **Bezahlung des Abos:** Zahlungsanbieter mit Konto auf den Betrieb Kundario. Erst nach Gewerbeanmeldung sinnvoll.
- **Supabase Pro:** Für den Echtbetrieb mit zahlenden Kunden (tägliche Sicherungen, kein Pausieren bei Inaktivität). Kostenpflichtig, Preis bitte auf supabase.com/pricing prüfen.
