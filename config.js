/* =====================================================================
   ZENTRALE EINSTELLUNGEN DER WEBSITE
   ---------------------------------------------------------------------
   Hier ändern Sie Firmenname, Kontaktdaten usw. an EINER Stelle.
   Die Website setzt diese Werte automatisch überall ein, wo sie
   gebraucht werden (Kopfzeile, Fußzeile, Kontaktseite, Buttons ...).

   So ändern Sie einen Wert:
   - Nur den Text zwischen den Anführungszeichen "..." ändern.
   - Anführungszeichen, Doppelpunkt und Komma am Zeilenende stehen lassen.

   Wichtig: Für Google stehen Name & Kontaktdaten zusätzlich direkt in
   den HTML-Seiten. Wie Sie die auf einen Schlag ändern, steht in der
   README.md (Abschnitt „Suchen & Ersetzen“).
   ===================================================================== */

window.SITE = {
  // Name des Unternehmens (Arbeitstitel)
  name: "Kundario",

  // Ihre Domain OHNE https:// – z. B. "kundario.de"
  domain: "[Domain]",

  // Ihr Name (Inhaber/Gründer)
  owner: "Dominik Böhm",

  // Telefonnummer so, wie sie angezeigt werden soll
  phone: "[Telefon]",

  // Telefonnummer für den Anruf-Link: nur Ziffern mit +49 vorne, ohne Leerzeichen
  // Beispiel: "+4989123456"
  phoneLink: "[Telefon]",

  // E-Mail-Adresse
  email: "[E-Mail]",

  // Postanschrift (für Impressum und Kontaktseite)
  address: "[Adresse]",

  // Region / Einzugsgebiet, z. B. "Oberbayern und Großraum München"
  region: "Nürnberg · Erlangen · Fürth",

  // Formspree-Adresse für das Kontaktformular (siehe README.md)
  // Beispiel: "https://formspree.io/f/abcdwxyz"
  formEndpoint: "[Formspree-Adresse]",

  // WhatsApp-Nummer: nur Ziffern mit 49 vorne, ohne + und Leerzeichen
  // Beispiel: "4915112345678". Solange leer bzw. in [ ], erscheint der
  // WhatsApp-Knopf nicht (auf dem Handy steht dann „Anrufen“).
  whatsapp: "[WhatsApp-Nummer]",

  // Online-Terminbuchung (z. B. kostenlos über cal.com oder Calendly)
  // Beispiel: "https://cal.com/ihrname/angebots-check"
  // Leer lassen = Betriebe wählen einen Wunschtermin im Kontaktformular.
  bookingUrl: "",

  // Foto von Ihnen: Datei in den Ordner img/ legen und hier eintragen
  // Beispiel: "img/foto.jpg" (Hochformat, ca. 720 × 900 Pixel)
  photo: "",

  // Kurzes Video (60–90 Sekunden), z. B. "img/rundgang.mp4"
  // Leer lassen = es erscheint der klickbare Rundgang.
  videoUrl: "",

  // TESTVERSION: true = oben erscheint ein Hinweis „Testversion“ und
  // Google nimmt die Seite nicht auf. Für den echten Start auf false setzen.
  testMode: true
};
