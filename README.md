# Website „Kundario“

Einfache, schnelle Website aus reinem HTML, CSS und JavaScript, ohne Framework und ohne Datenbank.
Sie können alle Texte mit einem normalen Texteditor ändern. Empfehlung: **Visual Studio Code** (kostenlos).

---

## 1. Was liegt wo?

| Datei / Ordner | Inhalt |
|---|---|
| `config.js` | **Zentrale Einstellungen:** Firmenname, Domain, Telefon, E-Mail, Adresse, Region, Formular-Adresse |
| `index.html` | Startseite |
| `leistungen.html` | Leistungen |
| `hausverwaltungen.html` | Seite für Hausverwaltungen (Modul „Auftraggeber“) |
| `makler.html` | Seite für Immobilienmakler |
| `branchen.html` | Vorlagen für jede Branche, Kundenportal, Wartung, Rollen |
| `partner.html` | Partner werden: Tippgeber, Terminierer, Vertriebspartner (Provisionen) |
| `preise.html` | Preise, Zusatzmodule, Konditionen, häufige Fragen |
| `ueber-mich.html` | Über mich |
| `kontakt.html` | Kontaktformular |
| `index.html`, `css/start.css` | Startseite: Auswahl „Ich suche einen Handwerker“ oder „Ich bin ein Handwerksbetrieb“ |
| `betriebe.html` | Startseite für Betriebe (bisherige Startseite) |
| `kunde.html`, `js/kunde.js`, `css/kunde.css` | Bereich für Endkunden (Demo): Vorhaben, Richtpreis bestätigen, Angebot unterschreiben, Nachrichten, Dokumente, Bewertung |
| `anfrage.html`, `js/portal.js`, `css/portal.css` | Auftragsportal für Endkunden (Zusatztool): Vorhaben beschreiben, Preisspanne sehen, Anfrage geht an einen Betrieb. Preise für die Spanne stehen oben in `js/portal.js` |
| `demo.html` | Klickbare Demo des Dashboards mit Beispielkunden und geführter Tour |
| `danke.html` | Wird nach dem Absenden des Formulars angezeigt |
| `impressum.html`, `datenschutz.html` | Platzhalter, mit Generator ausfüllen |
| `404.html` | Seite „nicht gefunden“ |
| `css/style.css` | Design: **Farben stehen ganz oben** |
| `js/main.js` | Menü, Hell/Dunkel-Umschalter, Formular (normalerweise nichts ändern) |
| `js/rechner.js` | Angebots-Rechner auf der Startseite (Annahme: 10 % mehr Aufträge durch Nachfassen) |
| `js/demo.js`, `css/demo.css` | Logik und Design der Demo. **Beispielkunden stehen ganz oben in `js/demo.js`** |
| `fonts/` | Schrift „Inter“, lokal gespeichert (DSGVO: keine Google-Server) |
| `img/` | Bilder und Website-Symbol (Favicon) |
| `sitemap.xml`, `robots.txt` | Für Google |
| `_headers` | Nur für Cloudflare: Test-Adresse wird nicht bei Google aufgenommen |

---

## 2. Kontaktdaten und Namen ändern

### Schritt 1: `config.js` ausfüllen
Öffnen Sie `config.js` und ersetzen Sie die Werte in eckigen Klammern, z. B.:

```js
phone: "0871 123456",
phoneLink: "+49871123456",
email: "info@ihre-domain.de",
```

Nur den Text **zwischen den Anführungszeichen** ändern. Diese Werte erscheinen automatisch auf allen Seiten.

### Schritt 2: Platzhalter in den HTML-Dateien ersetzen (für Google)
Damit Google die Daten auch ohne JavaScript sieht, stehen sie zusätzlich direkt in den Seiten.
In Visual Studio Code geht das für **alle Dateien auf einmal**:

1. Ordner öffnen → links das Lupen-Symbol („Suchen“) anklicken bzw. `Strg + Umschalt + H`.
2. Oben eingeben, was gesucht wird, z. B. `[Telefon]`, darunter den neuen Text, z. B. `0871 123456`.
3. Auf „Alle ersetzen“ klicken.

Das machen Sie für jeden Platzhalter:

| Platzhalter | Beispiel |
|---|---|
| `[Mein Name]` | Max Mustermann |
| `[Adresse]` | Musterstraße 1, 84028 Landshut |
| `[Telefon]` | 0871 123456 |
| `[E-Mail]` | info@ihre-domain.de |
| `[Region/Einzugsgebiet]` | Niederbayern und Großraum München |
| `[Domain]` | ihre-domain.de (ohne https://) |

**Achtung:** `tel:[Telefon]` bitte im internationalen Format ohne Leerzeichen ersetzen, also zuerst nach `tel:[Telefon]` suchen und durch `tel:+49871123456` ersetzen, **danach** `[Telefon]` allgemein.

**Firmennamen ändern** (wenn die Markenrecherche abgeschlossen ist): In `config.js` den `name` ändern und danach per „Suchen & Ersetzen“ `Kundario` durch den neuen Namen ersetzen.

---

## 3. Texte ändern

Jeder Abschnitt ist im HTML mit einem Kommentar markiert, z. B.:

```html
<!-- ================= 2. DAS PROBLEM ================= -->
```

Texte stehen zwischen den „Tags“, z. B. `<p>Hier steht der Text.</p>` oder `<h2>Überschrift</h2>`.
Ändern Sie nur den Text, nicht die spitzen Klammern `< >`.

Sonderzeichen: `&amp;` bedeutet `&`. Umlaute (ä, ö, ü, ß) können Sie ganz normal schreiben.

**Seitentitel für Google:** ganz oben in jeder Datei, in `<title>…</title>` und `<meta name="description" content="…">`.

---

## 4. Preise ändern

Die Preise stehen hier (am besten mit „Suchen“ nach dem alten Betrag suchen, z. B. `199 €`):

- `preise.html`: Bausteine (Grundpreis, Büro-Nutzer, Module), Beispielrechnungen, Provisionen, Empfehlungsprogramm, Konditionen
- `hausverwaltungen.html`: Preis-Kasten mit Beispielrechnung für Hausverwaltungen
- `kontakt.html`: Kasten „Partner werden“ (Empfehlungsprämie)

---

## 5. Foto und Dashboard-Screenshot einsetzen

1. Bild in den Ordner `img/` legen, z. B. `img/foto.jpg` (ca. 720 × 900 Pixel) und `img/dashboard.png` (ca. 1600 × 900 Pixel).
   Tipp: Bilder vorher z. B. mit [squoosh.app](https://squoosh.app) verkleinern, damit die Seite schnell lädt.
2. **Foto:** In `index.html` und `ueber-mich.html` den Platzhalter-Block `<div class="placeholder …">…</div>` löschen und
   die Zeile einsetzen, die direkt darüber im Kommentar steht, z. B.:

```html
<img src="img/foto.jpg" alt="Max Mustermann, Gründer von Kundario" width="720" height="900" loading="lazy" style="border-radius:18px">
```

3. **Dashboard-Screenshot (optional):** Auf der Startseite steht an dieser Stelle jetzt der Einstieg in die klickbare Demo.
   Im Kommentar darüber finden Sie eine fertige `<img …>`-Zeile, falls Sie zusätzlich einen Screenshot zeigen möchten.

Der `alt`-Text beschreibt das Bild für Blinde und für Google.

---

## 6. Demo anpassen

Die Demo (`demo.html`) zeigt Interessenten, wie das System im Alltag funktioniert.
- **Beispielkunden ändern:** in `js/demo.js` ganz oben, Abschnitt „1. BEISPIELDATEN“. Jeder Kunde steht in geschweiften Klammern `{ … }`.
  Name, Ort, Betrag (`wert`) und Texte lassen sich direkt ändern.
- **Name des Beispielbetriebs:** in `js/demo.js` die Zeile `var BETRIEB = "Musterbetrieb Haustechnik";`
- **Texte der Tour:** in `js/demo.js`, Abschnitt „6. GEFÜHRTE TOUR“.
- **Direkt mit Tour öffnen:** Link `demo.html#tour` verschicken.
- **Demo je Branche:** `demo.html?branche=` mit `shk`, `maler`, `elektro`, `dach`, `reinigung`, `it`, `hausmeister` oder `sicherheit` – oben in der Demo umschaltbar. Die Begriffe stehen in `js/demo-branchen.js`.
- Alle Daten sind erfunden. Es wird nichts gespeichert oder verschickt. Neu laden setzt die Demo zurück.
- Rolle „Montagekraft“ (oben auswählen) zeigt die komplette Montage-App: Heute, Aufmaß, Formulare, Kunden, Arbeitszeit.
- „Abläufe“ zeigt wie bei n8n, was die Automatik erledigt und wo jeder Vorgang steht.
- Der Morgenbericht wird mit der Stimme des Geräts vorgelesen (Auswahl unter „Stimme“). Am natürlichsten klingt es in Microsoft Edge.
- Auf dem Handy lässt sich die Seite über „Zum Home-Bildschirm“ wie eine App speichern (`manifest.webmanifest`, `manifest-demo.webmanifest`, Symbole in `img/`).

---

## 7. Farben ändern

Ganz oben in `css/style.css` stehen alle Farben, mit Erklärung:

- erster Block: helles Design
- zweiter und dritter Block: dunkles Design (beide gleich halten)

Die Akzentfarbe (aktuell Smaragdgrün) heißt `--signal`. Wenn Sie sie ändern, färben sich Buttons, Häkchen und Logo automatisch mit.

---

## 8. Kontaktformular einrichten (Formspree, kostenlos)

Reine HTML-Seiten können selbst keine E-Mails verschicken. Das übernimmt der Dienst **Formspree**.

1. Auf [formspree.io](https://formspree.io) ein kostenloses Konto anlegen (mit Ihrer geschäftlichen E-Mail-Adresse).
2. „+ New Form“ anklicken, Namen vergeben (z. B. „Website Kontakt“), die E-Mail-Adresse wählen, an die Anfragen gehen sollen.
3. Formspree zeigt eine Adresse wie `https://formspree.io/f/abcdwxyz`. Diese kopieren.
4. In `config.js` eintragen:
   ```js
   formEndpoint: "https://formspree.io/f/abcdwxyz"
   ```
5. Website hochladen (siehe Abschnitt 11), Formular einmal selbst ausfüllen und absenden.
   Beim ersten Mal schickt Formspree eine Bestätigungs-E-Mail. Den Link darin anklicken, fertig.

**Gut zu wissen**
- Der kostenlose Tarif erlaubt eine begrenzte Zahl an Nachrichten pro Monat. Die aktuellen Grenzen stehen auf formspree.io.
- Solange keine Formspree-Adresse eingetragen ist, öffnet das Formular automatisch das E-Mail-Programm des Besuchers mit allen Angaben (Rückfall-Lösung). Zusätzlich steht unter dem Formular ein E-Mail-Link.
- Datenschutz: Formspree ist ein Anbieter aus den USA. Nennen Sie den Dienst in Ihrer Datenschutzerklärung (siehe Platzhalter in `datenschutz.html`).
  Wenn Sie lieber einen Anbieter mit Sitz in der EU möchten, lässt sich die Formular-Adresse in `config.js` später austauschen.

---

## 9. Impressum und Datenschutz

Beide Seiten sind Platzhalter. Erstellen Sie die Texte mit einem Generator (z. B. **e-recht24.de**) und fügen Sie sie in
`impressum.html` bzw. `datenschutz.html` an der Stelle `<!-- HIER DEN TEXT AUS DEM GENERATOR EINFÜGEN -->` ein.
In `datenschutz.html` steht eine Liste, was Sie im Generator angeben sollten (Hosting, Formspree, lokale Speicherung des Hell/Dunkel-Modus).

---

## 10. Testversion zum Weitersenden

Solange in `config.js` `testMode: true` steht:
- erscheint oben auf jeder Seite der Hinweis „**Testversion** – Inhalte, Preise und Kontaktdaten sind noch vorläufig.“
  (mit „Feedback geben“-Link, sobald Ihre E-Mail-Adresse eingetragen ist),
- wird Google gebeten, die Seite **nicht** aufzunehmen.

Zusätzlich sorgt die Datei `_headers` dafür, dass die kostenlose Cloudflare-Adresse (`….pages.dev`) nie bei Google erscheint.

**Zum echten Start:** in `config.js` `testMode: false` setzen.

Den Link (z. B. `https://kundario.pages.dev`) können Sie an jeden schicken.
Der Empfänger braucht **kein Konto** und muss sich nirgends einloggen.

---

## 11. Website kostenlos online stellen

Die Website liegt bereits in Ihrem GitHub-Repository. Für den Test können Sie bei Cloudflare direkt den Arbeitszweig
`claude/auftragsassistent-website-jpkcpg` als Produktionszweig wählen. Später übernehmen Sie alles in den Hauptzweig `main`
(auf GitHub per „Pull Request“ → „Merge“) und stellen Cloudflare auf `main` um.

### Variante A: Cloudflare Pages (empfohlen, funktioniert auch mit privatem Repository)

1. Kostenloses Konto bei [cloudflare.com](https://dash.cloudflare.com/sign-up) anlegen.
2. Im Menü **Workers & Pages** → **Erstellen** → Reiter **Pages** → **Mit Git verbinden**.
3. GitHub-Konto verbinden und das Repository auswählen.
4. Einstellungen:
   - Produktionszweig: `main` (für den Test: `claude/auftragsassistent-website-jpkcpg`)
   - Framework-Voreinstellung: **Keine**
   - Build-Befehl: **leer lassen**
   - Ausgabeverzeichnis: `/` (bzw. leer lassen)
5. **Speichern und bereitstellen**. Nach ca. 1 Minute ist die Seite unter `ihr-projekt.pages.dev` erreichbar.
6. Jede Änderung, die Sie auf GitHub in `main` speichern, geht automatisch online.

### Variante B: GitHub Pages

Kostenlos nur mit **öffentlichem** Repository (sonst ist ein bezahltes GitHub-Abo nötig).

1. Auf GitHub im Repository: **Settings** → **Pages**.
2. Bei „Source“: **Deploy from a branch** → Branch `main`, Ordner `/ (root)` → **Save**.
3. Nach 1–2 Minuten ist die Seite unter `ihrname.github.io/repository-name` erreichbar.

---

## 12. Eigene Domain verbinden (ca. 5–15 € pro Jahr)

1. **Domain kaufen** bei einem deutschen Anbieter, z. B. INWX, IONOS, Strato oder netcup.
   Achten Sie auf den Preis **ab dem 2. Jahr** (manche Anbieter locken mit günstigem ersten Jahr).
2. **Bei Cloudflare Pages:** Projekt öffnen → **Benutzerdefinierte Domains** → **Domain einrichten** → Domain eingeben.
   Cloudflare zeigt Ihnen einen Eintrag (meist einen `CNAME`), den Sie beim Domain-Anbieter in den **DNS-Einstellungen** eintragen.
3. **Bei GitHub Pages:** Settings → Pages → „Custom domain“ eintragen. Beim Domain-Anbieter die DNS-Einträge setzen,
   die GitHub in seiner Hilfe nennt (`A`-Einträge bzw. `CNAME`). Danach „Enforce HTTPS“ aktivieren.
4. Warten: Die Umstellung kann einige Minuten bis wenige Stunden dauern. Danach ist die Seite unter Ihrer Domain erreichbar, mit HTTPS (Schloss-Symbol).
5. Zum Schluss `[Domain]` überall ersetzen (siehe Abschnitt 2) und in der [Google Search Console](https://search.google.com/search-console)
   die Domain anmelden und `https://ihre-domain.de/sitemap.xml` einreichen.

---

## 13. Vorschau auf dem eigenen Computer

Einfach `index.html` doppelklicken, dann öffnet sie sich im Browser.
(Das Formular funktioniert erst online richtig.)

---

## Technische Hinweise

- Keine Cookies, kein Tracking, keine externen Schriften oder Skripte, deshalb ist kein Cookie-Banner nötig.
- Hell/Dunkel-Modus: richtet sich nach der Geräteeinstellung. Die Wahl über den Knopf wird nur im Browser gespeichert (`localStorage`).
- Kopf- und Fußzeile stehen in jeder HTML-Datei. Wenn Sie einen Menüpunkt ändern, bitte in allen Dateien ändern (Suchen & Ersetzen).

## Hinweis: Neue Version wird im Browser nicht angezeigt?
Browser merken sich CSS- und JavaScript-Dateien. Deshalb steht hinter jeder Datei eine Versionsnummer, z. B. `js/demo.js?v=20261012-8`.
Wenn Sie `css/` oder `js/` ändern, erhöhen Sie diese Nummer in allen HTML-Dateien (Suchen & Ersetzen), dann laden alle Besucher sofort die neue Version.

## Vor dem echten Start – Checkliste

Alles Folgende steht in **config.js** und wirkt automatisch auf allen Seiten:

| Eintrag | Was passiert, wenn er ausgefüllt ist |
|---|---|
| `name`, `phone`, `phoneLink`, `email`, `address`, `domain` | Kontaktdaten erscheinen überall, Impressum und Datenschutz sind vollständig |
| `whatsapp` (z. B. `4915112345678`) | WhatsApp-Knopf auf dem PC, „WhatsApp“ statt „Anrufen“ in der Handy-Leiste, Knöpfe auf Kontakt- und Betriebsseite |
| `bookingUrl` (z. B. Cal.com-Link) | Knopf „Termin direkt im Kalender buchen“ auf der Kontaktseite. Ohne Link wählen Betriebe einen Wunschtermin im Formular |
| `photo` (z. B. `img/foto.jpg`) | Ihr Foto ersetzt alle Foto-Platzhalter |
| `videoUrl` (z. B. `img/rundgang.mp4`) | Das Video erscheint über dem Rundgang „So läuft ein Auftrag“ |
| `formEndpoint` (Formspree) | Kontaktformular **und** Auftragsportal verschicken echte E-Mails |
| `testMode: false` | Hinweis „Testversion“ verschwindet, Google darf die Seiten aufnehmen |

Außerdem: `[Domain]` in allen HTML-Dateien und in `sitemap.xml` ersetzen (Suchen & Ersetzen) und die Datenschutzerklärung aus dem Rechtstexte-Abo in `datenschutz.html` einfügen.

## Produktbilder austauschen

Die Bilder in Laptop- und Handyrahmen liegen in `img/screens/` (Format WebP). Es sind Bildschirmfotos der Demo mit erfundenen Daten. Zum Austauschen eine neue Datei mit **gleichem Namen** ablegen (z. B. `cockpit.webp`, Querformat 1440 × 900; Handybilder `handy-….webp`, Hochformat 780 × 1688). Andere Formate (.jpg, .png) gehen auch – dann im HTML die Endung anpassen.

## Neu: Preisrechner, Vergleich, Empfehlungslinks

- **Preisrechner und Vergleich:** auf `preise.html` (Rechnung nur im Browser, `js/preisrechner.js`).
- **Empfehlungslink für Tippgeber:** auf `partner.html` (`js/empfehlung.js`). Wer über einen Link mit `?ref=name` kommt, wird 90 Tage im Browser gemerkt; der Code wird mit dem Kontaktformular und mit Portal-Anfragen mitgeschickt (Feld `empfehlung`).

## Neu: Fragebogen, Datensicherheit, AV-Vertrag, Partner-Unterlagen

- **`fragebogen.html`** – Einrichtungs-Fragebogen für neue Kunden (ca. 15 Minuten). Geht an dieselbe Formspree-Adresse wie das Kontaktformular, Betreff „Einrichtungs-Fragebogen“. Eingaben werden auf dem Gerät des Kunden zwischengespeichert. Den Link schicken Sie nach dem Abschluss.
- **Abschnitt „Ihre Daten sind sicher“** auf `betriebe.html` und `preise.html`. **Wichtig:** Die Zusagen (Server in Deutschland mit ISO 27001, tägliche Sicherung 30 Tage, Zwei-Faktor, Export, Löschung in 30 Tagen) nur so stehen lassen, wenn Ihr Hosting und Ihre Abläufe das wirklich erfüllen. Sonst den Text anpassen.
- **`av-vertrag.html`** – Muster-Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO) mit Anlage 1 (Maßnahmen) und Anlage 2 (Unterauftragsverarbeiter). Vor dem ersten Einsatz anwaltlich prüfen lassen und die eckigen Klammern füllen. Drucken über den Knopf oben.
- **`partner-unterlagen.html`** – Flyer A4 und Aufsteller A5 als PDF, QR-Codes zur Demo je Branche, Newsletter-Text, Konditionen.
- **QR-Codes und PDFs neu erzeugen** (nach Änderung von Name, Domain, Telefon oder E-Mail in `config.js`): `python3 tools/unterlagen.py`. Ohne eingetragene Domain zeigen die QR-Codes auf die Testseite.
- **Einrichtung:** 750 € einmalig oder ohne Startkosten 12 × 69 € (Preisseite, Preisrechner, Hausverwaltungen, Makler).
- **Provisionen:** Vertriebspartner und Influencer: Einrichtung 750 € plus erster Monatsbeitrag. Affiliates (Webseiten, Blogs, Newsletter): 1 Monatsbeitrag. Tippgeber/Empfehlung: 250 €, Terminierer: 400 €. Ausgezahlt wird immer nach 2 Monaten Mitgliedschaft des neuen Kunden. Affiliate-Links führen zur Demo (`demo.html?ref=code`).

## Rechtsform: UG ab Monat 4

Gründung als Einzelunternehmen, in Monat 4 (vor dem ersten zahlenden Kunden) wird eine UG (haftungsbeschränkt) gegründet. Dann anpassen:
- `impressum.html`: Firma mit Zusatz „UG (haftungsbeschränkt)“, Sitz, Registergericht und Handelsregisternummer, Geschäftsführer, USt-IdNr.
- `config.js` (`name`, `address`) und `av-vertrag.html` (Auftragnehmer = die UG).
- Danach `python3 tools/unterlagen.py` für Flyer und Aufsteller.
