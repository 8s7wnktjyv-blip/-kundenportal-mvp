/* =====================================================================
   BETRIEBE im Auftragsportal (erfundene Beispieldaten)
   Wird von anfrage.html (Betrieb wählen), kunde.html (Bewertung) und
   demo.html (Cockpit: eigene Bewertungen) genutzt.
   Bewertungen: nur Kundschaft, deren Auftrag über das Portal abgeschlossen
   und deren Rechnung bezahlt ist (geprüfte Bewertung).
   ===================================================================== */
(function () {
  "use strict";
  var KRIT = [["qualitaet", "Qualität der Arbeit"], ["preis", "Preis eingehalten"], ["termin", "Termine eingehalten"], ["sauber", "Sauber & ordentlich"], ["kontakt", "Gut erreichbar"]];
  var LISTE = {
    bad: ["Fliesen Yilmaz|Erlangen", "Bad & Wärme Schmitt|Nürnberg", "Musterbetrieb Haustechnik|Erlangen", "Sanitär Keller|Fürth"],
    heizung: ["Musterbetrieb Haustechnik|Erlangen", "Wärme & Klima Weber|Erlangen", "Bad & Wärme Schmitt|Nürnberg", "Kälte & Klima Hofmann|Fürth"],
    elektro: ["Elektro Wagner|Erlangen", "Elektro Brandt|Fürth", "Elektrotechnik Sommer|Nürnberg"],
    solar: ["Sonnenstrom Franken|Erlangen", "Elektro Wagner|Erlangen", "Solartechnik Berger|Herzogenaurach"],
    maler: ["Malerbetrieb Kraus|Fürth", "Farbe & Raum Lehmann|Erlangen", "Maler Schuster|Nürnberg"],
    fliesen: ["Fliesen Yilmaz|Erlangen", "Fliesenleger Krüger|Nürnberg", "Fliesen Neumann|Fürth"],
    boden: ["Boden & Parkett Hahn|Erlangen", "Fliesen Yilmaz|Erlangen", "Raumausstattung Vogt|Nürnberg"],
    trockenbau: ["Trockenbau Schulze|Nürnberg", "Ausbau Lorenz|Erlangen", "Malerbetrieb Kraus|Fürth"],
    schreiner: ["Schreinerei Huber|Erlangen", "Holzwerk Seidel|Herzogenaurach", "Küchen & Treppen Fischer|Nürnberg"],
    dach: ["Dachdeckerei Lang|Baiersdorf", "Dach & Spengler Möller|Erlangen", "Zimmerei Ziegler|Höchstadt"],
    fenster: ["Fensterbau Huber|Nürnberg", "Fenster & Tore Krause|Erlangen", "Schreinerei Huber|Erlangen"],
    sonnenschutz: ["Sonnenschutz Wolf|Erlangen", "Fensterbau Huber|Nürnberg", "Terrassendach Schmid|Fürth"],
    garten: ["Garten & Pflaster Franke|Erlangen", "Galabau Beck|Herzogenaurach", "Hausmeisterservice Franken|Nürnberg"]
  };
  var SCHWER = { bad: ["Barrierefreie Bäder", "Komplettbad aus einer Hand", "Kleine Reparaturen", "Bodengleiche Duschen"], heizung: ["Wärmepumpen", "Förderantrag inklusive", "Klimaanlagen", "Wartung & Notdienst"],
    elektro: ["Wallboxen", "Zählerschränke", "Smart Home"], solar: ["PV mit Speicher", "Anmeldung inklusive", "Balkonkraftwerke"], maler: ["Fassaden", "Kalkputz & Spachteltechnik", "Schnell & sauber"],
    fliesen: ["Großformate", "Naturstein", "Badfliesen"], boden: ["Parkett & Schleifen", "Vinyl", "Teppich & Bodenbeläge"], trockenbau: ["Dachausbau", "Schallschutz", "Estrich"],
    schreiner: ["Einbauschränke", "Holztreppen", "Küchen nach Maß"], dach: ["Steildach", "Dachfenster", "Reparaturen"], fenster: ["Kunststofffenster", "Haustüren", "Garagentore"],
    sonnenschutz: ["Terrassendächer", "Markisen & Raffstores", "Insektenschutz"], garten: ["Pflaster & Terrassen", "Zäune", "Gartenpflege"] };
  var TEXTE = {
    qualitaet: ["Sehr saubere Arbeit, alles sitzt perfekt.", "Handwerklich top, man merkt die Erfahrung."], preis: ["Rechnung genau wie im Angebot, keine Überraschungen.", "Faire Preise, Mehrkosten vorher abgesprochen."],
    termin: ["Pünktlich zum vereinbarten Termin, schnell fertig.", "Zeitplan wurde genau eingehalten."], sauber: ["Alles abgedeckt und hinterher sauber hinterlassen.", "Baustelle jeden Abend aufgeräumt."],
    kontakt: ["Immer erreichbar, Rückruf am selben Tag.", "Fragen wurden schnell per Nachricht beantwortet."] };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var cache = {};
  function betrieb(eintrag, gw) {
    var t = eintrag.split("|"), name = t[0], key = name + "/" + gw; if (cache[key]) return cache[key];
    var h = hash(name), r = function (n) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return h % n; };
    var noten = {}; KRIT.forEach(function (k) { noten[k[0]] = Math.round((3.9 + r(12) / 10) * 10) / 10; if (noten[k[0]] > 5) noten[k[0]] = 5; });
    var schnitt = Math.round(KRIT.reduce(function (s, k) { return s + noten[k[0]]; }, 0) / KRIT.length * 10) / 10;
    var stark = KRIT.slice().sort(function (a, b) { return noten[b[0]] - noten[a[0]]; });
    var sw = SCHWER[gw] || [];
    var b = { name: name, ort: t[1], km: 3 + r(24), frei: 1 + r(6), anzahl: 8 + r(80), noten: noten, schnitt: schnitt, meister: r(5) > 0, keinVergleich: r(5) === 0,
      schwerpunkt: [sw[r(sw.length)], sw[(r(sw.length) + 1) % sw.length]].filter(function (x, i, a) { return x && a.indexOf(x) === i; }),
      stimmen: [stark[0], stark[1]].map(function (k, i) { return { text: TEXTE[k[0]][i % 2], sterne: noten[k[0]] >= 4.5 ? 5 : 4, wann: ["vor 2 Wochen", "vor 1 Monat", "vor 3 Monaten"][r(3)], gewerk: gw }; }) };
    cache[key] = b; return b;
  }
  function fuer(gw) { return (LISTE[gw] || []).map(function (e) { return betrieb(e, gw); }); }
  function passt(b, wichtig) {   // 0–100: Bewertungen in den gewünschten Punkten (70 %), freie Termine (15 %), Entfernung (15 %)
    var w = wichtig && wichtig.length ? wichtig : KRIT.map(function (k) { return k[0]; });
    var n = w.reduce(function (s, k) { return s + (b.noten[k] || b.schnitt); }, 0) / w.length;
    return Math.round(Math.max(0, Math.min(100, ((n - 3) / 2) * 70 + (1 - (b.frei - 1) / 6) * 15 + (1 - b.km / 30) * 15)));
  }
  window.BETRIEBE = { KRIT: KRIT, fuer: fuer, passt: passt };
})();
