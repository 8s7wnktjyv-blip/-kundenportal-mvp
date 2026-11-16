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

Tests lokal: `PGHOST=… sh supabase/tests/lauf.sh` (Datenbank) und `node tools/e2e_app.js` (App im Testmodus).
