/* Kundario – „So geht's“: Schritt-für-Schritt-Anleitung, Hilfe-Knopf je Seite, Start-Checkliste */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;

  // view: zu welchem Bereich gehört die Anleitung (für Rechte und Hilfe-Knopf)
  var T = [
    { id: "start", view: "einstellungen", titel: "Erste Schritte", kurz: "Einmal einrichten, dann läuft es.", schritte: [
      "Menü → <b>Einstellungen</b>: Anschrift, Telefon, Steuernummer und IBAN eintragen. Diese Angaben stehen auf Angeboten und Rechnungen – ohne sie lässt sich keine Rechnung stellen.",
      "Stundensatz, Zahlungsziel und Nachfass-Tage prüfen (Standard: 64 €, 14 Tage, Erinnerung nach 3, 7 und 14 Tagen).",
      "Menü → <b>Team</b> → „Mitarbeiter einladen“: Name, E-Mail und Rolle wählen. Der Mitarbeiter bekommt einen Link und legt damit sein eigenes Konto an.",
      "Tipp fürs iPhone: In Safari auf Teilen → „Zum Home-Bildschirm“. Dann startet Kundario wie eine App."],
      tipp: "Rollen: Geschäftsführung sieht alles. Büro alles außer Einstellungen. Außendienst ohne Rechnungen. Montagekraft nur Baustelle (Aufträge, Kalender, Berichte, Material)." },
    { id: "anfragen", view: "anfragen", titel: "Anfrage aufnehmen", kurz: "Jede Anfrage an einem Ort – egal über welchen Weg sie kam.", schritte: [
      "Menü → <b>Anfragen</b> → „Neue Anfrage“.",
      "Wählen, woher die Anfrage kam (Telefon, E-Mail, WhatsApp …).",
      "Bestehenden Kunden wählen – oder „Neuen Kunden anlegen“ aufklappen und Name, Telefon, E-Mail, Anschrift eintragen.",
      "Kurz beschreiben, worum es geht, und speichern.",
      "In der Anfrage: „Besichtigung planen“ legt einen Termin im Kalender an, „Aufmaß“ startet die Vermessung, „Angebot erstellen“ macht direkt das Angebot."],
      tipp: "Geht ein Auftrag verloren, auf „Verloren“ tippen und den Grund wählen. Unter Auswertungen sehen Sie später, woran es meistens liegt." },
    { id: "aufmass", view: "aufmass", titel: "Aufmaß", kurz: "Räume vermessen, Flächen werden sofort berechnet.", schritte: [
      "In der Anfrage auf „Aufmaß“ tippen oder Menü → <b>Aufmaß</b> → „Neues Aufmaß“.",
      "Je Raum Länge, Breite und Höhe in Metern eintragen, Fenster und Türen als Abzug in m².",
      "„Speichern und rechnen“: Boden- und Wandfläche stehen in der Tabelle.",
      "„Ins Angebot übernehmen“: auswählen, welche Flächen als Positionen ins Angebot sollen. Danach nur noch die Preise eintragen."] },
    { id: "angebote", view: "angebote", titel: "Angebot schreiben und senden", kurz: "Positionen eintragen, Summe rechnet mit, Kunde nimmt online an.", schritte: [
      "In der Anfrage „Angebot erstellen“ – oder Menü → <b>Angebote</b> → „Neues Angebot“.",
      "Je Zeile Leistung, Menge, Einheit und Einzelpreis eintragen. „+ Arbeitsstunden“ fügt eine Zeile mit Ihrem Stundensatz ein, „+ Überschrift“ gliedert das Angebot.",
      "Optionale Positionen anhaken – sie stehen im Angebot, zählen aber nicht zur Summe.",
      "„Speichern“, dann „Drucken / PDF“ zum Prüfen (am iPhone: Teilen → „In Dateien sichern“ für ein PDF).",
      "„Senden“: Die E-Mail an den Kunden öffnet sich in Ihrem Mail-Programm, mit einem Link, über den der Kunde das Angebot ansehen und unterschreiben kann."],
      tipp: "Ein gesendetes Angebot lässt sich nicht mehr ändern. Mit „Als neuen Entwurf kopieren“ machen Sie eine geänderte Fassung." },
    { id: "nachfassen", view: "nachfassen", titel: "Nachfassen", kurz: "Kein Angebot geht mehr unter.", schritte: [
      "Menü → <b>Nachfassen</b> zeigt alle gesendeten Angebote ohne Antwort. Fällige stehen oben und sind orange markiert.",
      "„Erinnerung senden“ öffnet eine fertige, freundliche E-Mail. Sie können sie ändern und senden. Kundario merkt sich die Stufe.",
      "Nach der letzten Erinnerung schlägt Kundario einen Anruf vor.",
      "Sagt der Kunde zu oder ab: „Angenommen“ oder „Abgelehnt“ tippen."] },
    { id: "kundenportal", view: "angebote", titel: "Was der Kunde sieht (Kundenportal)", kurz: "Kein Konto für den Kunden nötig – nur ein geheimer Link.", schritte: [
      "Angebot: Der Kunde sieht alle Positionen, unterschreibt mit dem Finger und tippt „Verbindlich annehmen“. Bei Ihnen steht das Angebot sofort auf „Angenommen“.",
      "Auftrag: Im Auftrag unter „Überblick“ → „Link kopieren“. Der Kunde sieht Termine, unterschriebene Berichte und Rechnungen.",
      "Rechnung: Der Kunde sieht die Rechnung mit IBAN und Verwendungszweck und kann sie drucken."],
      tipp: "Interne Zahlen wie Rentabilität, Notizen oder andere Kunden sieht der Kunde nie." },
    { id: "auftraege", view: "auftraege", titel: "Auftrag", kurz: "Alles zu einer Baustelle an einer Stelle.", schritte: [
      "Ist das Angebot angenommen: „Auftrag anlegen“. Ohne Angebot: Menü → <b>Aufträge</b> → „Neuer Auftrag“.",
      "Reiter <b>Überblick</b>: Status, Start, Ende, Verantwortlicher, Kundenlink.",
      "Reiter <b>Termine</b>: Termine mit Mitarbeitern planen. Überschneidet sich etwas, warnt Kundario.",
      "Reiter <b>Aufgaben</b>: To-dos mit Frist und Zuständigem, zum Abhaken.",
      "Reiter <b>Berichte</b>, <b>Material</b>, <b>Rechnungen</b>: alles, was auf der Baustelle entsteht.",
      "Reiter <b>Rentabilität</b>: Stunden und Material planen – Kundario vergleicht mit den echten Stunden aus den Regieberichten und zeigt, ob der Auftrag sich rechnet."] },
    { id: "kalender", view: "kalender", titel: "Kalender", kurz: "Zwei Wochen auf einen Blick.", schritte: [
      "Menü → <b>Kalender</b>. Mit „‹ Woche“ und „Woche ›“ blättern.",
      "„Neuer Termin“: Titel, Datum, Uhrzeit, Auftrag und wer dabei ist.",
      "Termin antippen zum Ändern. „Kunde informieren“ öffnet eine fertige E-Mail mit Datum und Uhrzeit.",
      "Montagekräfte sehen nur ihre eigenen Termine."] },
    { id: "berichte", view: "berichte", titel: "Regiebericht auf der Baustelle", kurz: "Stunden, Material, Fotos und Unterschrift – direkt am Handy.", schritte: [
      "Im Auftrag → Reiter Berichte → „Neuer Bericht“ (oder Menü → <b>Regieberichte</b>).",
      "Stunden und Tätigkeit eintragen, verbrauchtes Material mit Menge und Preis.",
      "War es nicht im Angebot? „Zusatzleistung“ anhaken – dann kommt es automatisch in die Schlussrechnung.",
      "Speichern, dann „Foto hinzufügen“ – die Kamera öffnet sich.",
      "„Kunde unterschreiben lassen“: Der Kunde unterschreibt mit dem Finger auf dem Handy."],
      tipp: "Ein unterschriebener Bericht kann nicht mehr geändert werden – so ist er als Nachweis gültig." },
    { id: "material", view: "material", titel: "Material anfordern und bestellen", kurz: "Von der Baustelle ins Büro, vom Büro zum Lieferanten.", schritte: [
      "Menü → <b>Material</b> → „Material anfordern“ (oder per Assistent: „Bestell 3 Kupferrohre für Huber“).",
      "Artikel, Menge und Auftrag eintragen. Mit „Gleich zur Freigabe“ sieht das Büro es sofort.",
      "Büro: „Bestellung per E-Mail“ sammelt alles zur Freigabe in einer E-Mail an den Lieferanten.",
      "Kommt die Ware: „Geliefert“ tippen."] },
    { id: "rechnungen", view: "rechnungen", titel: "Rechnung stellen und Zahlung erfassen", kurz: "Aus dem Auftrag, mit allen Zusatzleistungen.", schritte: [
      "Im Auftrag → Reiter Rechnungen → „Abschlagsrechnung“ (Prozent vom Auftragswert) oder „Schlussrechnung“.",
      "Die Schlussrechnung übernimmt die Positionen aus dem Angebot, alle Zusatzleistungen aus Regieberichten und zieht Abschläge ab.",
      "Prüfen, „Vorschau“ ansehen, dann „Rechnung stellen“. Erst jetzt bekommt sie ihre feste Nummer und ist festgeschrieben.",
      "Danach öffnet sich die E-Mail an den Kunden. PDF über „Drucken / PDF“ anhängen.",
      "Geld eingegangen: „Zahlung erfassen“. Bei Teilzahlung bleibt der Rest offen.",
      "Überfällig: „Zahlungserinnerung“ öffnet eine höfliche E-Mail, die nächste wird deutlicher."],
      tipp: "Falsche Rechnung? „Stornieren“ erzeugt eine Gutschrift mit eigener Nummer. Gestellte Rechnungen werden nie gelöscht – so verlangt es das Finanzamt." },
    { id: "assistent", view: "assistent", titel: "Assistent (Sprache oder Text)", kurz: "Kurz sagen, was zu tun ist.", schritte: [
      "Menü → <b>Assistent</b>. Auf das Mikrofon tippen und sprechen – oder tippen.",
      "Beispiele: „Bestell 3 Kupferrohre 15 mm für Huber“, „Bei Huber muss die Steckdose versetzt werden“, „Huber kann erst am Donnerstag um 9 Uhr“, „Was ist heute offen?“",
      "Kundario zeigt einen Vorschlag. Erst wenn Sie „Passt“ tippen, wird etwas geändert."],
      tipp: "Den Kunden immer mit Nachnamen nennen. Der Assistent versteht einfache Sätze wie die Beispiele." },
    { id: "dokumente", view: "dokumente", titel: "Dokumente", kurz: "Pläne, Lieferscheine, Verträge sicher ablegen.", schritte: [
      "Menü → <b>Dokumente</b>: Datei wählen, optional einem Auftrag zuordnen, „Hochladen“.",
      "Zum Öffnen auf den Namen tippen. Nur Ihr Team hat Zugriff."] },
    { id: "auswertungen", view: "auswertungen", titel: "Auswertungen", kurz: "Wo Geld liegt und wo Aufträge verloren gehen.", schritte: [
      "Menü → <b>Auswertungen</b>: offene Angebote, nach Erinnerung angenommene Angebote, offene Forderungen, nicht abgerechnete Zusatzleistungen, Deckungsbeitrag.",
      "Darunter Umsatz, Zahlungseingang und Anfragen der letzten sechs Monate und die häufigsten Gründe für verlorene Anfragen."],
      tipp: "Volumen ist kein Umsatz und Umsatz ist kein Zahlungseingang – Kundario zeigt alles getrennt." },
    { id: "ablaeufe", view: "ablaeufe", titel: "Abläufe", kurz: "Was Kundario vorbereitet und was ausgeführt wurde.", schritte: [
      "Menü → <b>Abläufe</b> zeigt, was heute fällig ist (Nachfassen, überfällige Rechnungen) und ein Protokoll aller Erinnerungen.",
      "Nichts geht ohne Ihre Freigabe raus."] },
    { id: "katalog", view: "katalog", titel: "Katalog und Vorlagen", kurz: "Einmal anlegen, in jedem Angebot mit einem Tipp einfügen.", schritte: [
      "Menü → <b>Katalog</b> → „Neuer Eintrag“: Bezeichnung, Einheit und Preis. Mit Einkaufspreis und Zuschlag rechnet Kundario den Verkaufspreis aus.",
      "Art „Textbaustein“ für wiederkehrende Hinweise, z. B. Zahlungsbedingungen.",
      "Preisliste vom Großhändler oder aus Excel: „CSV importieren“. Erste Zeile mit Überschriften wie Bezeichnung;Einheit;Preis.",
      "Im Angebot oder in der Rechnung: „+ Aus Katalog“ und Einträge anhaken.",
      "Ein fertiges Angebot als Vorlage speichern: im Angebot „Als Vorlage speichern“. Im nächsten Angebot „+ Aus Vorlage“."] },
    { id: "zeiten", view: "zeiten", titel: "Zeiterfassung", kurz: "Kommen, Gehen, Pause – auch für die Pflicht zur Arbeitszeiterfassung.", schritte: [
      "Menü → <b>Zeiterfassung</b> → „Kommen“ bei Arbeitsbeginn, optional mit Auftrag.",
      "Bei Feierabend „Gehen“ und die Pause eintragen. Kundario schlägt die gesetzliche Pause vor.",
      "Vergessen? „Nachtragen“. Nachgetragene Zeiten werden als solche markiert.",
      "Geschäftsführung und Büro sehen alle Mitarbeiter und laden die Zeiten als CSV für die Lohnabrechnung herunter."],
      tipp: "Rot markiert: mehr als 10 Stunden. Gelb: über 6 Stunden ohne 30 Minuten Pause." },
    { id: "plantafel", view: "plantafel", titel: "Plantafel", kurz: "Wer ist wann auf welcher Baustelle.", schritte: [
      "Menü → <b>Plantafel</b> zeigt die Woche: eine Zeile pro Mitarbeiter.",
      "Am Computer: Termin mit der Maus auf einen anderen Tag oder Mitarbeiter ziehen.",
      "Am Handy: Termin antippen und dort Datum oder Mitarbeiter ändern.",
      "Unten stehen Termine, die noch niemandem zugeteilt sind."] },
    { id: "wartungen", view: "wartungen", titel: "Wartungsverträge", kurz: "Wiederkehrende Aufträge nicht vergessen.", schritte: [
      "Menü → <b>Wartungsverträge</b> → „Neuer Vertrag“: Kunde, Leistung, Anlage, Intervall und nächster Termin.",
      "30 Tage vorher erscheint die Wartung auf der Übersicht.",
      "„Termin planen“ legt den Termin im Kalender an und setzt die nächste Wartung automatisch weiter."] },
    { id: "protokolle", view: "protokolle", titel: "Protokolle", kurz: "Prüfung, Wartung, Abnahme – mit Unterschrift.", schritte: [
      "Menü → <b>Protokolle</b> → „Neues Protokoll“ oder im Auftrag „Protokoll anlegen“.",
      "Vorlage wählen: Elektro-Prüfprotokoll, Heizungswartung, Abnahme, Dachkontrolle oder Untergrundprüfung.",
      "Messwerte und Ergebnis eintragen, speichern, vom Kunden unterschreiben lassen, drucken oder als PDF speichern."],
      tipp: "Die Vorlagen sind Arbeitshilfen. Prüfen Sie, ob sie die Vorgaben Ihrer Norm oder Ihres Verbands vollständig abdecken." },
    { id: "offline", view: "berichte", titel: "Ohne Netz auf der Baustelle", kurz: "Was ohne Internet geht.", schritte: [
      "Seiten, die Sie vorher geöffnet hatten, bleiben lesbar. Oben erscheint dann „Offline“.",
      "Regieberichte, Fotos und die Unterschrift des Kunden können Sie ohne Netz speichern. Sie werden gesendet, sobald wieder Netz da ist.",
      "Einen ganz neuen Bericht ohne Netz zuerst speichern. Fotos und Unterschrift kommen dazu, sobald er gesendet ist.",
      "Fotos brauchen Platz auf dem Gerät. Ist der Speicher voll, meldet Kundario das."] },
    { id: "erechnung", view: "rechnungen", titel: "E-Rechnung und Steuerfälle", kurz: "XRechnung, § 13b, Kleinunternehmer, § 35a.", schritte: [
      "Gestellte Rechnung → „E-Rechnung (XML)“ speichert die Rechnung im Format XRechnung. Behörden verlangen das, Firmen ab 2027/2028 nach und nach auch.",
      "Bauleistung an einen anderen Bauunternehmer: in der Rechnung Steuerfall „§ 13b“ wählen. Die USt.-IdNr. des Kunden muss in der Kundenkarte stehen.",
      "Kleinunternehmer: in den Einstellungen anhaken. Dann steht der Hinweis nach § 19 UStG automatisch auf jeder Rechnung.",
      "Positionen mit Haken „Lohn“ werden als Arbeitskosten nach § 35a ausgewiesen. Privatkunden können sie von der Steuer absetzen."],
      tipp: "Die Datei wurde im Test gegen die Regeln der EN 16931 und der XRechnung geprüft, aber nicht mit dem vollständigen offiziellen Prüfprogramm (KoSIT-Validator). Vor dem ersten Einsatz bei einer Behörde einmal über deren Portal prüfen lassen." },
    { id: "lager", view: "lager", titel: "Lager und Einkauf", kurz: "Bestände, Mindestmengen, Bestellung beim Lieferanten.", schritte: [
      "Menü → <b>Lager</b> → „Neuer Artikel“: Artikel, Bestand, Mindestbestand und Ort, zum Beispiel Lager oder Transporter 1.",
      "Entnahme mit Auftrag: Das Material steht dann am Auftrag und zählt in der Rentabilität.",
      "Unter dem Mindestbestand erscheint der Artikel auf der Übersicht. „Nachbestellen“ legt ihn zur Freigabe ins Material.",
      "Menü → <b>Material</b> → „Bestellung“: je Lieferant per E-Mail oder als Datei für den Webshop.",
      "Ist die Ware da: „Geliefert“ tippen. Lagerware wird dabei zugebucht."],
      tipp: "Die direkte Bestellung im Großhändler-Shop (IDS/OCI) braucht eine Anbindung an Ihren Großhändler. Bis dahin hilft die Bestelldatei." },
    { id: "finanzen", view: "finanzen", titel: "Finanzen und Kontoauszug", kurz: "Was kommt rein, was geht raus, reicht das Geld?", schritte: [
      "Menü → <b>Finanzen</b> → „Kontostand eintragen“. Ohne Bankanbindung einmal pro Woche aktualisieren.",
      "Feste Kosten als „Ausgabe“ eintragen, zum Beispiel Miete monatlich oder Versicherung jährlich.",
      "Die Vorschau zeigt 13 Wochen: offene Rechnungen als Eingang, Ihre Ausgaben als Abgang.",
      "„Kontoauszug einlesen“: Im Online-Banking die Umsätze als CSV herunterladen und hier auswählen. Kundario findet Zahlungen zu offenen Rechnungen, Sie bestätigen."],
      tipp: "Die Rücklage für die Umsatzsteuer ist ein Richtwert ohne Vorsteuer. Die genaue Zahl kommt von Ihrem Steuerberater." },
    { id: "export", view: "einstellungen", titel: "Export für den Steuerberater", kurz: "Rechnungsausgangsbuch und DATEV.", schritte: [
      "Einstellungen → Daten → „Konten und Beraternummer“: Beraternummer, Mandantennummer und Kontenrahmen eintragen.",
      "„Export für den Steuerberater“: Zeitraum wählen, Format wählen, Datei weitergeben.",
      "Das Rechnungsausgangsbuch (CSV) kann jedes Programm öffnen. Der DATEV-Buchungsstapel ist eine Testversion: die erste Datei bitte gemeinsam mit Ihrem Steuerberater einlesen."] },
    { id: "kalenderdatei", view: "kalender", titel: "Termine im Handy-Kalender", kurz: "Kundario-Termine in Apple- oder Google-Kalender.", schritte: [
      "Menü → <b>Kalender</b> → „In den Handy-Kalender“.",
      "Nur Ihre Termine oder alle wählen. Es wird eine Kalenderdatei gespeichert.",
      "Am iPhone die Datei öffnen und „Alle hinzufügen“ tippen."],
      tipp: "Später geänderte Termine kommen nicht automatisch nach. Ein laufender Abgleich mit Google oder Outlook braucht eine Anbindung." },
    { id: "daten", view: "einstellungen", titel: "Ihre Daten", kurz: "Sicher gespeichert, jederzeit exportierbar.", schritte: [
      "Gespeichert auf Servern in Frankfurt. Jeder Betrieb sieht nur seine eigenen Daten.",
      "Menü → <b>Einstellungen</b> → „Daten herunterladen“ speichert alles als Datei, z. B. für den Steuerberater.",
      "Mitarbeiter, die gehen: Menü → <b>Team</b> → Haken bei „Aktiv“ entfernen. Der Zugang ist sofort gesperrt."] }
  ];
  var ZU = { uebersicht: "start", anfragen: "anfragen", nachfassen: "nachfassen", kunden: "anfragen", kalender: "kalender", auftraege: "auftraege", berichte: "berichte", aufmass: "aufmass", material: "material", dokumente: "dokumente", angebote: "angebote", rechnungen: "rechnungen", ablaeufe: "ablaeufe", auswertungen: "auswertungen", assistent: "assistent", team: "start", einstellungen: "start", katalog: "katalog", vorlagen: "katalog", zeiten: "zeiten", plantafel: "plantafel", wartungen: "wartungen", protokolle: "protokolle", suche: "start", lager: "lager", finanzen: "finanzen" };
  function sichtbar(t) { return K.darf(t.view) || t.view === "einstellungen" && (t.id === "daten" || K.ctx.ich.rolle !== "monteur"); }

  V.hilfe = function (id) {
    var l = T.filter(sichtbar);
    return K.kopf("So geht's", "Alles Schritt für Schritt. Tippen Sie auf ein Thema.") +
      '<nav class="hilfe-index" aria-label="Themen">' + l.map(function (t, i) { return '<a href="#/hilfe/' + t.id + '">' + (i + 1) + ". " + h(t.titel) + "</a>"; }).join("") + "</nav>" +
      l.map(function (t, i) {
        return '<details class="karte hilfe" id="h-' + t.id + '"' + (t.id === id || (!id && i === 0) ? " open" : "") + '><summary><span class="h-nr">' + (i + 1) + "</span><span><b>" + h(t.titel) + "</b><small>" + h(t.kurz) + "</small></span></summary>" +
          '<ol class="h-schritte">' + t.schritte.map(function (s) { return "<li><span>" + s + "</span></li>"; }).join("") + "</ol>" + (t.tipp ? '<p class="h-tipp"><b>Gut zu wissen:</b> ' + h(t.tipp) + "</p>" : "") +
          (K.darf(t.view) && t.view !== "einstellungen" ? '<a class="btn btn-outline klein" href="#/' + t.view + '">Zu ' + h(t.titel.split(" ")[0]) + "</a>" : "") + "</details>";
      }).join("") +
      '<section class="karte"><h2>Noch Fragen?</h2><p>Melden Sie sich bei uns – wir helfen gern.</p><a class="btn btn-outline" href="../kontakt.html" target="_blank" rel="noopener">Kontakt</a></section>';
  };
  V.hilfe.danach = function (id) { if (!id) return; var d = document.getElementById("h-" + id); if (d) { d.open = true; setTimeout(function () { d.scrollIntoView({ block: "start" }); }, 30); } };

  // Hilfe-Knopf oben auf jeder Seite
  var main = null;
  function knopf() {
    var m = document.getElementById("inhalt"); if (!m) return;
    var kopf = m.querySelector(".seite-kopf"); if (!kopf || kopf.querySelector(".hilfe-knopf")) return;
    var view = K.aktView || "uebersicht", ziel = ZU[view]; if (!ziel || view === "hilfe") return;
    var a = document.createElement("a"); a.className = "hilfe-knopf"; a.href = "#/hilfe/" + ziel; a.textContent = "? So geht's"; a.setAttribute("aria-label", "Hilfe zu dieser Seite");
    var h1 = kopf.querySelector("h1"); if (h1) h1.insertAdjacentElement("afterend", a);
  }
  K.hilfeKnopf = knopf; void main;

  // Start-Checkliste auf der Übersicht (nur Geschäftsführung, bis alles erledigt ist)
  K.startCheckliste = async function () {
    if (K.ctx.ich.rolle !== "gf") return "";
    try { if (localStorage.getItem("kundario-checkliste-zu-" + K.bid())) return ""; } catch (e) { /* weiter */ }
    var b = K.ctx.betrieb, r = await Promise.all([K.liste("anfragen", { limit: 1 }), K.liste("angebote", { wo: { status: ["gesendet", "angenommen", "abgelehnt"] }, limit: 1 }), K.liste("auftraege", { limit: 1 }), K.liste("berichte", { limit: 1 }), K.liste("rechnungen", { wo: { status: ["gestellt", "teilbezahlt", "bezahlt"] }, limit: 1 })]);
    var p = [
      [!!(b.strasse && b.ort && b.iban && (b.steuernummer || b.ust_id)), "Betriebsdaten eintragen", "#/einstellungen"],
      [K.ctx.team.length > 1, "Mitarbeiter einladen", "#/team"],
      [r[0].length > 0, "Erste Anfrage aufnehmen", "#/anfragen/neu"],
      [r[1].length > 0, "Erstes Angebot senden", "#/angebote"],
      [r[2].length > 0, "Ersten Auftrag anlegen", "#/auftraege"],
      [r[3].length > 0, "Ersten Regiebericht schreiben", "#/berichte/neu"],
      [r[4].length > 0, "Erste Rechnung stellen", "#/rechnungen"]
    ], fertig = p.filter(function (x) { return x[0]; }).length;
    if (fertig === p.length) return "";
    return '<section class="karte checkliste"><div class="kopf-zeile"><h2>Erste Schritte: ' + fertig + " von " + p.length + ' erledigt</h2><span><a class="btn btn-outline klein" href="#/hilfe/start">Anleitung</a> <button class="btn btn-ghost klein" data-a="checklisteZu">Ausblenden</button></span></div>' +
      '<div class="fortschritt"><span style="width:' + Math.round(fertig / p.length * 100) + '%"></span></div><ol class="check">' + p.map(function (x) { return '<li class="' + (x[0] ? "ok" : "") + '"><a href="' + x[2] + '">' + h(x[1]) + "</a></li>"; }).join("") + "</ol></section>";
  };
  K.aktion.checklisteZu = function () { try { localStorage.setItem("kundario-checkliste-zu-" + K.bid(), "1"); } catch (e) { /* privat */ } K.neuLaden(); };
  void DB;
})();
