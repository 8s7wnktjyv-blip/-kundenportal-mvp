/* =====================================================================
   SONDERANGEBOTE (Restposten, abgesprungene Aufträge, Ausstellungsstücke)
   und ANMELDUNG (Demo) – gemeinsam für Portal, Kundenbereich und Cockpit.
   Gespeichert nur im Browser (localStorage). Echte Konten brauchen später
   einen Server; in der Demo wird der Anmeldecode angezeigt statt verschickt.
   ===================================================================== */
(function () {
  "use strict";
  var KEY = "sonderangebote-v1", KONTO = "aa-konto";
  /* Zustand → Rechtsfolgen gegenüber Privatkunden (Verbrauchsgüterkauf) */
  var ZUSTAND = {
    neu: { l: "Neu, originalverpackt", kurz: "Neuware", gewaehr: 24, abw: false,
      info: "Neuware: volle gesetzliche Gewährleistung von 2 Jahren." },
    ausst: { l: "Ausstellungsstück, unbenutzt", kurz: "Ausstellungsstück", gewaehr: 24, abw: true,
      info: "Ein unbenutztes Ausstellungsstück gilt als neu: 2 Jahre Gewährleistung. Sichtbare Abweichungen (z. B. Kratzer) sind unten einzeln genannt und werden vor dem Kauf gesondert bestätigt – dafür gibt es keine Mängelrechte, für alles andere schon." },
    gebraucht: { l: "Ausstellungsstück, aufgebaut und genutzt", kurz: "Ausstellung, gebraucht", gewaehr: 12, abw: true,
      info: "Gebrauchte Ware: Die Gewährleistung beträgt 1 Jahr – nur, wenn Sie das vor dem Kauf ausdrücklich und gesondert vereinbaren; sonst 2 Jahre. Abweichungen sind unten einzeln genannt und werden gesondert bestätigt." },
    bware: { l: "B-Ware / Rückläufer, unbenutzt", kurz: "B-Ware", gewaehr: 24, abw: true,
      info: "Unbenutzte B-Ware gilt als neu: 2 Jahre Gewährleistung. Die genannten Abweichungen werden vor dem Kauf gesondert bestätigt." }
  };
  var HERKUNFT = { rest: "Restposten", abgesprungen: "Kunde abgesprungen", ausstellung: "Aus der Ausstellung" };
  function tage(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  var START = [
    { id: "s1", betrieb: "Sonnenschutz Wolf", ort: "Erlangen", km: 6, gw: "sonnenschutz", pid: "markise", cfg: { b: 4.5, a: 3, modell: "Kassettenmarkise", farbe: "Anthrazit RAL 7016", tuch: "Hellgrau", antrieb: "Motor (Funk)" }, herkunft: "ausstellung",
      titel: "Kassettenmarkise 4,50 × 3,00 m, Motor mit Funk", text: "Stand 8 Monate in unserer Ausstellung, nie unter Sonne oder Regen. Mit Funkmotor und Handsender.", menge: 1, einheit: "Stück",
      zustand: "ausst", abweichungen: ["Kleiner Kratzer (ca. 2 cm) an der linken Seitenkappe", "Tuch leicht verstaubt, wird vor Auslieferung gereinigt"], preis: 2490, normal: 3690, normalArt: "uvp",
      montage: { art: "fest", preis: 390 }, abholung: true, gueltig: tage(30), status: "aktiv" },
    { id: "s2", betrieb: "Sonnenschutz Wolf", ort: "Erlangen", km: 6, gw: "sonnenschutz", pid: "rollladen", cfg: { b: 1.2, hh: 1.4, farbe: "Anthrazit", kasten: "Vorbau", antrieb: "Motor mit App" }, herkunft: "abgesprungen",
      titel: "3 Vorbaurollläden 1.200 × 1.400 mm, Smart Home", text: "Für ein Projekt gefertigt, der Auftrag kam nicht zustande. Originalverpackt. Passt auf Fenster mit Lichtmaß 1,20 × 1,40 m (± 1 cm über die Führungsschienen anpassbar).", menge: 3, einheit: "Stück",
      zustand: "neu", abweichungen: [], preis: 690, normal: 940, normalArt: "eigen", montage: { art: "fest", preis: 160 }, abholung: true, gueltig: tage(21), status: "aktiv" },
    { id: "s3", betrieb: "Fliesen Yilmaz", ort: "Erlangen", km: 4, gw: "fliesen", pid: "fliese", cfg: { fl: 18, fmt: "60 × 60", farbe: "Betongrau", oberfl: "rutschhemmend R10" }, herkunft: "rest",
      titel: "Feinsteinzeug 60 × 60 cm, Betonoptik grau – 18 m²", text: "Restmenge aus einer Badsanierung, gleiche Charge. Rutschhemmung R10, für Boden und Wand.", menge: 18, einheit: "m²",
      zustand: "neu", abweichungen: [], preis: 29, normal: 46, normalArt: "eigen", grundpreis: true, montage: { art: "aufwand", preis: 0 }, abholung: true, gueltig: tage(45), status: "aktiv" },
    { id: "s4", betrieb: "Fenster & Tore Krause", ort: "Erlangen", km: 9, gw: "fenster", pid: "haustuer", cfg: { b: 1.1, h: 2.1, farbe: "Anthrazit RAL 7016", material: "Aluminium", schloss: "Motorschloss mit Fingerprint" }, herkunft: "ausstellung",
      titel: "Aluminium-Haustür 1.100 × 2.100 mm mit Fingerprint", text: "Ausstellungstür, war zwei Jahre im Schauraum eingebaut und wurde täglich geöffnet. Ausbau durch uns, Einbau bei Ihnen inklusive.", menge: 1, einheit: "Stück",
      zustand: "gebraucht", abweichungen: ["Leichte Gebrauchsspuren am Griff", "Dichtung unten wird bei Einbau erneuert", "Fingerprint-Leser: Herstellergarantie bereits abgelaufen"], preis: 2950, normal: 4800, normalArt: "uvp",
      montage: { art: "inkl", preis: 0 }, abholung: false, gueltig: tage(30), status: "aktiv" },
    { id: "s5", betrieb: "Bad & Wärme Schmitt", ort: "Nürnberg", km: 18, gw: "bad", pid: "dusche", cfg: { b: 1.2, profil: "Schwarz matt", glas: "Klarglas", modell: "Walk-in" }, herkunft: "abgesprungen",
      titel: "Walk-in-Duschwand 120 cm, Klarglas, schwarzer Rahmen", text: "Bestellt für einen Kunden, der kurzfristig abgesagt hat. Noch originalverpackt.", menge: 1, einheit: "Stück",
      zustand: "neu", abweichungen: [], preis: 590, normal: 840, normalArt: "eigen", montage: { art: "fest", preis: 220 }, abholung: true, gueltig: tage(20), status: "aktiv" },
    { id: "s6", betrieb: "Fenster & Tore Krause", ort: "Erlangen", km: 9, gw: "fenster", pid: "garagentor", cfg: { b: 2.5, h: 2.125, farbe: "Weiß", antrieb: "mit 2 Handsendern" }, herkunft: "rest",
      titel: "Sektionaltor 2.500 × 2.125 mm mit Antrieb", text: "Falsch bestellte Farbe für einen Kunden – bei uns übrig. Neu, mit 2 Handsendern.", menge: 1, einheit: "Stück",
      zustand: "bware", abweichungen: ["Verpackung beschädigt, Tor selbst unbeschädigt geprüft"], preis: 1390, normal: 1990, normalArt: "uvp", montage: { art: "fest", preis: 450 }, abholung: true, gueltig: tage(30), status: "aktiv" }
  ];
  function laden() { try { var x = JSON.parse(localStorage.getItem(KEY) || "null"); if (Array.isArray(x)) return x; } catch (e) { /* privat */ } return JSON.parse(JSON.stringify(START)); }
  function speichern(liste) { try { localStorage.setItem(KEY, JSON.stringify(liste)); } catch (e) { /* privat */ } }
  function aktiv(liste) {   // abgelaufene Reservierungen freigeben
    var jetzt = Date.now(), geaendert = false;
    liste.forEach(function (s) { if (s.status === "reserviert" && s.reserviertBis && s.reserviertBis < jetzt) { s.status = "aktiv"; s.reserviertVon = null; geaendert = true; } });
    if (geaendert) speichern(liste); return liste;
  }
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }), euro2 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function preisText(s) {   // Gesamtpreis inkl. MwSt. (PAngV), bei m²-Ware mit Grundpreis
    var ges = s.preis * (s.einheit === "m²" ? s.menge : 1);
    return s.einheit === "m²" ? { haupt: euro.format(ges) + " für " + s.menge + " m²", zusatz: "Grundpreis " + euro2.format(s.preis) + " / m² · inkl. MwSt." }
      : { haupt: euro.format(s.preis) + (s.menge > 1 ? " je Stück" : ""), zusatz: "inkl. MwSt." + (s.menge > 1 ? " · " + s.menge + " Stück verfügbar" : "") };
  }
  function vergleich(s) {   // nur erlaubte Vergleichspreise: UVP (gekennzeichnet) oder eigener Preis der letzten 30 Tage
    if (!s.normal || s.normal <= s.preis) return "";
    var p = Math.round((1 - s.preis / s.normal) * 100);
    return s.normalArt === "uvp" ? "UVP des Herstellers " + euro.format(s.normal) + " · " + p + " % darunter" : "Unser Preis der letzten 30 Tage: " + euro.format(s.normal) + " · " + p + " % günstiger";
  }
  function montageText(s) { var m = s.montage || {}; return m.art === "fest" ? "Montage zum Festpreis " + euro.format(m.preis) : m.art === "inkl" ? "Montage inklusive" : m.art === "aufwand" ? "Verlegung/Montage nach Aufwand möglich" : "Nur Abholung oder Lieferung"; }
  /* ---------- Anmeldung (Demo) ---------- */
  function konto() { try { return JSON.parse(localStorage.getItem(KONTO) || "null"); } catch (e) { return null; } }
  function anmelden(k) { try { localStorage.setItem(KONTO, JSON.stringify(k)); } catch (e) { /* privat */ } }
  function abmelden() { try { localStorage.removeItem(KONTO); } catch (e) { /* privat */ } }
  window.SONDER = { ZUSTAND: ZUSTAND, HERKUNFT: HERKUNFT, laden: function () { return aktiv(laden()); }, speichern: speichern, preisText: preisText, vergleich: vergleich, montageText: montageText, euro: euro, konto: konto, anmelden: anmelden, abmelden: abmelden, tage: tage };
  
  /* ---------- Börse unter Betrieben (nur Unternehmen, Preise netto) ---------- */
  var BKEY = "betriebe-boerse-v1";
  var BKAT = ["Fliesen & Platten", "Rohre & Fittings", "Elektromaterial", "Dämmung & Trockenbau", "Holz & Profile", "Farben & Putze", "Werkzeug & Geräte", "Sonstiges"];
  var BSTART = [
    { id: "b1", betrieb: "Fliesen Yilmaz", ort: "Erlangen", km: 4, kat: "Fliesen & Platten", titel: "Feinsteinzeug 30 × 60 anthrazit, 9 m² (6 Pakete)", menge: 9, einheit: "m²", preis: 14, zustand: "neu", gewaehr: "aus", abholung: "abholung", text: "Restmenge, Charge 2214. Abholung werktags 7–16 Uhr.", status: "aktiv", anfragen: [] },
    { id: "b2", betrieb: "Bad & Wärme Schmitt", ort: "Nürnberg", km: 18, kat: "Rohre & Fittings", titel: "Mehrschicht-Verbundrohr 16 × 2, 2 Rollen à 50 m", menge: 2, einheit: "Rolle", preis: 85, zustand: "neu", gewaehr: "aus", abholung: "beides", text: "Originalverpackt, falsch bestellt.", status: "aktiv", anfragen: [] },
    { id: "b3", betrieb: "Elektro Wagner", ort: "Erlangen", km: 3, kat: "Elektromaterial", titel: "NYM-J 3 × 1,5 mm², Restring ca. 60 m", menge: 1, einheit: "Ring", preis: 25, zustand: "angebrochen", gewaehr: "aus", abholung: "abholung", text: "Angebrochener 100-m-Ring.", status: "aktiv", anfragen: [] },
    { id: "b4", betrieb: "Trockenbau Schulze", ort: "Nürnberg", km: 15, kat: "Dämmung & Trockenbau", titel: "Gipskartonplatten 12,5 mm, 1250 × 2000, 22 Stück", menge: 22, einheit: "Stück", preis: 0, zustand: "neu", gewaehr: "aus", abholung: "abholung", text: "Zu verschenken an Selbstabholer – Lager wird geräumt.", status: "aktiv", anfragen: [] },
    { id: "b5", betrieb: "Malerbetrieb Kraus", ort: "Fürth", km: 11, kat: "Farben & Putze", titel: "Innenfarbe weiß, matt, 6 Eimer à 12,5 l", menge: 6, einheit: "Eimer", preis: 32, zustand: "neu", gewaehr: "wie", abholung: "beides", text: "Haltbar bis 08/2027.", status: "aktiv", anfragen: [] }
  ];
  function bLaden() { try { var x = JSON.parse(localStorage.getItem(BKEY) || "null"); if (Array.isArray(x)) return x; } catch (e) { /* privat */ } return JSON.parse(JSON.stringify(BSTART)); }
  function bSpeichern(l) { try { localStorage.setItem(BKEY, JSON.stringify(l)); } catch (e) { /* privat */ } }
  window.SONDER.BOERSE = { KAT: BKAT, laden: bLaden, speichern: bSpeichern };

  /* Kopfzeile: „Anmelden“ bzw. Name anzeigen (Elemente mit data-konto) */
  document.addEventListener("DOMContentLoaded", function () {
    var k = konto();
    document.querySelectorAll("[data-konto]").forEach(function (el) {
      if (k) { el.textContent = (k.rolle === "betrieb" ? "Betrieb: " : "") + (k.name || k.email); el.setAttribute("href", k.rolle === "betrieb" ? "demo.html" : "kunde.html"); el.setAttribute("title", "Angemeldet als " + k.email); }
      else { el.textContent = "Anmelden"; el.setAttribute("href", "anmelden.html"); }
    });
  });
})();
