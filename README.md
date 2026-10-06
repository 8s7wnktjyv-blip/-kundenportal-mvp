# Website „Auftragsassistent“

Einfache, schnelle Website aus reinem HTML, CSS und JavaScript, ohne Framework und ohne Datenbank.
Sie können alle Texte mit einem normalen Texteditor ändern. Empfehlung: **Visual Studio Code** (kostenlos).

---

## 1. Was liegt wo?

| Datei / Ordner | Inhalt |
|---|---|
| `config.js` | **Zentrale Einstellungen:** Firmenname, Domain, Telefon, E-Mail, Adresse, Region, Formular-Adresse |
| `index.html` | Startseite |
| `leistungen.html` | Leistungen |
| `hausverwaltungen.html` | Seite für Hausverwaltungen (Paket „Auftraggeber“) |
| `preise.html` | Preise, Zusatzmodule, Konditionen, häufige Fragen |
| `ueber-mich.html` | Über mich |
| `kontakt.html` | Kontaktformular |
| `demo.html` | Klickbare Demo des Dashboards mit Beispielkunden und geführter Tour |
| `danke.html` | Wird nach dem Absenden des Formulars angezeigt |
| `impressum.html`, `datenschutz.html` | Platzhalter, mit Generator ausfüllen |
| `404.html` | Seite „nicht gefunden“ |
| `css/style.css` | Design: **Farben stehen ganz oben** |
| `js/main.js` | Menü, Hell/Dunkel-Umschalter, Formular (normalerweise nichts ändern) |
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

**Firmennamen ändern** (wenn die Markenrecherche abgeschlossen ist): In `config.js` den `name` ändern und danach per „Suchen & Ersetzen“ `Auftragsassistent` durch den neuen Namen ersetzen.

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

Die Preise stehen hier (am besten mit „Suchen“ nach dem alten Betrag suchen, z. B. `349 €`):

- `preise.html`: alle Pakete, Zusatzmodule, Konditionen
- `hausverwaltungen.html`: Preis-Kasten Paket „Auftraggeber“
- `index.html` und `leistungen.html`: Pilotpreis (490 €)

---

## 5. Foto und Dashboard-Screenshot einsetzen

1. Bild in den Ordner `img/` legen, z. B. `img/foto.jpg` (ca. 720 × 900 Pixel) und `img/dashboard.png` (ca. 1600 × 900 Pixel).
   Tipp: Bilder vorher z. B. mit [squoosh.app](https://squoosh.app) verkleinern, damit die Seite schnell lädt.
2. **Foto:** In `index.html` und `ueber-mich.html` den Platzhalter-Block `<div class="placeholder …">…</div>` löschen und
   die Zeile einsetzen, die direkt darüber im Kommentar steht, z. B.:

```html
<img src="img/foto.jpg" alt="Max Mustermann, Gründer von Auftragsassistent" width="720" height="900" loading="lazy" style="border-radius:18px">
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
- Alle Daten sind erfunden. Es wird nichts gespeichert oder verschickt. Neu laden setzt die Demo zurück.

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

Den Link (z. B. `https://auftragsassistent.pages.dev`) können Sie an jeden schicken.
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
