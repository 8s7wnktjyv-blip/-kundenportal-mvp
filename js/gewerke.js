/* =====================================================================
   GEWERKE, AUFMASS JE GEWERK UND PRODUKT-KONFIGURATOR (gehört zu demo.html)
   ---------------------------------------------------------------------
   1. Hilfen zum Zeichnen und Rechnen
   2. GEWERKE        – die 13 Gewerke (Auswahl beim Start, Menü, Texte)
   3. PRODUKTE       – Konfigurator: Maße, Farben, Ausstattung, Preis,
                       Zeichnung und 3D-Modell (models/*.glb, eigene Modelle)
   4. AUFMASS        – eigenes Aufmaß je Gewerk: Felder, Rechnung,
                       Zeichnungen, Material, Angebotspositionen
   Preise sind Beispielpreise (netto, Stand 2026) und im echten Cockpit
   frei einstellbar. Alle Richtwerte ersetzen keine Fachplanung.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Hilfen ---------- */
  var Z = function (n) { return (+n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var Z1 = function (n) { return (+n || 0).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
  var Z0 = function (n) { return Math.round(+n || 0).toLocaleString("de-DE"); };
  var M = function (n) { return Z(n).replace(/,(\d)0$/, ",$1") + " m"; };
  var CM = function (n) { return Z0((+n || 0) * 100) + " cm"; };
  var MM = function (n) { return Z0((+n || 0) * 1000); };
  var EUR = function (n) { return Math.round(n).toLocaleString("de-DE") + " €"; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var r2 = function (x) { return Math.round((+x || 0) * 100) / 100; };
  var auf = Math.ceil, rad = function (d) { return d * Math.PI / 180; };
  var num = function (v) { var x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : 0; };
  var sum = function (a, f) { return a.reduce(function (s, x) { return s + (f ? f(x) : x); }, 0); };

  function pos(text, menge, einheit, ep, optional) { return { text: text, menge: r2(menge), einheit: einheit, ep: r2(ep), rabatt: 0, optional: !!optional }; }
  function tab(kopf, zeilen, summe) {
    return '<table class="mk-tab am-tab"><thead><tr>' + kopf.map(function (k) { return "<th>" + k + "</th>"; }).join("") + "</tr></thead><tbody>" +
      zeilen.map(function (z) { return "<tr>" + z.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      (summe ? '<tr class="summe">' + summe.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>" : "") + "</tbody></table>";
  }
  function mat(titel, items) { return '<div class="gw-mat"><h3>' + titel + "</h3><ul>" + items.filter(Boolean).map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul></div>"; }
  function warn(t) { return '<p class="gw-warn">' + t + "</p>"; }
  function ok(t) { return '<p class="gw-ok">' + t + "</p>"; }
  function hin(t) { return '<p class="src gw-hin">' + t + "</p>"; }

  /* SVG */
  function svgBox(w, h, label, inner) {
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="am-svg gw-svg" role="img" aria-label="' + esc(label) + '"><defs>' +
      '<marker id="gwpf" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="am-pfeil"/></marker>' +
      '<pattern id="gwschraff" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="gw-schraff"/></pattern>' +
      '<pattern id="gwstoff" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" class="gw-stoff1"/><rect x="4" width="4" height="8" class="gw-stoff2"/></pattern>' +
      "</defs>" + inner + "</svg>";
  }
  function pf(x1, y1, x2, y2, txt, vert, off) {
    off = off || 7;
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="am-mass" marker-start="url(#gwpf)" marker-end="url(#gwpf)"/>' +
      (vert ? '<text x="' + (x1 - off) + '" y="' + ((y1 + y2) / 2) + '" class="am-masstext" text-anchor="middle" transform="rotate(-90 ' + (x1 - off) + " " + ((y1 + y2) / 2) + ')">' + txt + "</text>"
            : '<text x="' + ((x1 + x2) / 2) + '" y="' + (y1 - off) + '" class="am-masstext" text-anchor="middle">' + txt + "</text>");
  }
  function tx(x, y, t, cls, anchor) { return '<text x="' + x + '" y="' + y + '" class="' + (cls || "am-klein") + '" text-anchor="' + (anchor || "middle") + '">' + t + "</text>"; }
  function rc(x, y, w, h, cls, extra) { return '<rect x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(Math.max(0, w)) + '" height="' + r2(Math.max(0, h)) + '" class="' + cls + '"' + (extra || "") + "/>"; }
  function ln(x1, y1, x2, y2, cls, extra) { return '<line x1="' + r2(x1) + '" y1="' + r2(y1) + '" x2="' + r2(x2) + '" y2="' + r2(y2) + '" class="' + cls + '"' + (extra || "") + "/>"; }
  function poly(pts, cls, extra) { return '<polygon points="' + pts.map(function (p) { return r2(p[0]) + "," + r2(p[1]); }).join(" ") + '" class="' + cls + '"' + (extra || "") + "/>"; }
  function geo(r) { var W = 360, H = 280, pad = 54, s = Math.min((W - 2 * pad) / r.l, (H - 2 * pad) / r.b); return { s: s, x0: (W - r.l * s) / 2, y0: (H - r.b * s) / 2 }; }
  function farbeVon(liste, name) { var o = liste.filter(function (x) { return x[0] === name; })[0]; return o ? o[1] : null; }
  function faerben(svgText, cls, hex, attr) { return hex ? svgText.replace(new RegExp('class="' + cls + '"', "g"), 'class="' + cls + '" style="' + (attr || "fill") + ":" + hex + '"') : svgText; }
  function einfuegen(svgText, extra) { return svgText.replace(/<\/svg>$/, extra + "</svg>"); }
  function raumFl(r, vob) {   // Wand-, Boden-, Deckenfläche eines Raums; vob: Öffnungen bis 2,5 m² übermessen (Maler)
    var abz = sum(r.ab || [], function (x) { var f = x.b * x.h; return vob && f <= 2.5 ? 0 : f; });
    var tuer = sum((r.ab || []).filter(function (x) { return x.art === "Tür"; }), function (x) { return x.b; });
    var boden = r.l * r.b;
    return { boden: boden, wand: Math.max(0, 2 * (r.l + r.b) * r.h - abz), decke: boden, umfang: 2 * (r.l + r.b), sockel: Math.max(0, 2 * (r.l + r.b) - tuer), abz: abz, tueren: (r.ab || []).filter(function (x) { return x.art === "Tür"; }).length };
  }
  function F(k, l, o) { var f = { k: k, l: l, t: "n", min: 0.3, max: 30, st: 0.01, e: "m" }; for (var x in o) f[x] = o[x]; return f; }
  var RAUM = [{ k: "name", l: "Raum", t: "txt" }, F("l", "Länge"), F("b", "Breite"), F("h", "Höhe", { min: 1.5, max: 8 })];
  var FARBE_ALU = [["Anthrazit RAL 7016", "#383e42"], ["Weiß RAL 9016", "#f1f0ea"], ["Schwarz RAL 9005", "#1f2022"], ["Silber eloxiert", "#b9bcbe"]];

  /* ---------- 2. GEWERKE ---------- */
  var IC = {
    shk: '<path d="M5 21V9a5 5 0 0 1 10 0"/><path d="M10 12h10"/><path d="M12 15v1M15 15v1M18 15v1M13.5 18v1M16.5 18v1"/>',
    heizung: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7.5 6v12M12 6v12M16.5 6v12M5 21v-3M19 21v-3"/>',
    elektro: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    solar: '<path d="M4 15 7 5h14l-3 10z"/><path d="M5.5 10h14M12 5l-2 10M16.5 5l-2 10M11 15v5M7 20h8"/>',
    maler: '<rect x="3" y="3" width="14" height="6" rx="1.5"/><path d="M17 6h3v5h-8v3"/><rect x="10" y="14" width="4" height="7" rx="1"/>',
    fliesen: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v6M15 9v6M9 15v6"/>',
    boden: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9.3h18M3 14.6h18M10 4v5.3M15 9.3v5.3M7 14.6V20"/>',
    trockenbau: '<path d="M4 21V3h16v18z"/><path d="M8 3v18M12 3v18M16 3v18"/>',
    schreiner: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M9.5 11v2M14.5 11v2"/>',
    dach: '<path d="M2 12 12 4l10 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    fenster: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/>',
    sonnenschutz: '<path d="M3 5h18l-2 6H5z"/><path d="M5 11v10M19 11v10"/><path d="M8 5l-1 6M12 5v6M16 5l1 6"/>',
    garten: '<path d="M12 21v-6"/><path d="M12 15c-4 0-7-2.5-7-6a7 7 0 0 1 14 0c0 3.5-3 6-7 6z"/><path d="M4 21h16"/>'
  };
  var GEWERKE = [
    { id: "shk", name: "Sanitär & Bad", bsp: "Badsanierung, Gäste-WC, barrierefrei", gruppe: "Bad & Haustechnik" },
    { id: "heizung", name: "Heizung, Wärmepumpe & Klima", bsp: "Wärmepumpe, Heizkörper, Klima, Kaminofen", gruppe: "Bad & Haustechnik" },
    { id: "elektro", name: "Elektro", bsp: "Installation, Zählerschrank, Smart Home, Wallbox", gruppe: "Bad & Haustechnik" },
    { id: "solar", name: "Solar & Photovoltaik", bsp: "PV-Anlage, Speicher, Ertrag", gruppe: "Bad & Haustechnik" },
    { id: "maler", name: "Maler & Fassade", bsp: "Innenanstrich, Tapeten, Fassade", gruppe: "Innenausbau" },
    { id: "fliesen", name: "Fliesen", bsp: "Boden, Wand, Verlegeplan", gruppe: "Innenausbau" },
    { id: "boden", name: "Boden & Parkett", bsp: "Vinyl, Laminat, Parkett, Teppich", gruppe: "Innenausbau" },
    { id: "trockenbau", name: "Trockenbau & Estrich", bsp: "Wände, Decken, Estrich", gruppe: "Innenausbau" },
    { id: "schreiner", name: "Schreiner, Küche & Treppen", bsp: "Einbauschrank, Küche, Treppe", gruppe: "Innenausbau" },
    { id: "dach", name: "Dach & Spengler", bsp: "Eindeckung, Dachrinne, Dachfenster", gruppe: "Gebäudehülle & Außen" },
    { id: "fenster", name: "Fenster, Türen & Tore", bsp: "Fenster, Haustür, Garagentor", gruppe: "Gebäudehülle & Außen" },
    { id: "sonnenschutz", name: "Sonnenschutz & Terrassendach", bsp: "Terrassendach, Markise, Rollladen", gruppe: "Gebäudehülle & Außen" },
    { id: "garten", name: "Garten, Pflaster & Zaun", bsp: "Pflaster, Rasen, Hecke, Zaun", gruppe: "Gebäudehülle & Außen" }
  ];
  GEWERKE.forEach(function (g) { g.icon = IC[g.id]; });
  var ANDERE = [["reinigung", "Gebäudereinigung"], ["it", "IT-Service"], ["hausmeister", "Hausmeister"], ["sicherheit", "Sicherheits- & Klimatechnik"]];
  var AUFMASS_FUER = { reinigung: "allgemein", it: "allgemein", sicherheit: "allgemein", hausmeister: "garten" };

  /* ---------- 3. PRODUKTE (Konfigurator) ----------
     masse/optionen: Felder; mat: Material im 3D-Modell, das bei dieser Wahl sichtbar ist
     farben: wählbare Farben; mat = Materialien, die eingefärbt werden ("*_r" = alle Rahmen)
     tint: Option färbt ein Material (z. B. Glas klar/matt)
     skal(cfg): Maßstab x (Breite), y (Höhe), z (Tiefe) gegenüber dem Grundmodell */
  var JA = [["nein", "nein"], ["ja", "ja"]];
  var PRODUKTE = {
    terrassendach: { name: "Terrassendach / Sommergarten", gw: "sonnenschutz", modell: "terrassendach",
      masse: [F("b", "Breite", { min: 2, max: 10, st: 0.1 }), F("t", "Tiefe", { min: 1.5, max: 5, st: 0.1 }), F("hw", "Höhe am Haus", { min: 2, max: 4, st: 0.05 }), F("hs", "Höhe vorne (Stützen)", { min: 1.9, max: 3.5, st: 0.05 })],
      farben: [{ k: "farbe", l: "Gestell", mat: ["Farbe", "*_r"], o: FARBE_ALU }],
      optionen: [
        { k: "dach", l: "Eindeckung", t: "sel", o: ["VSG-Glas 8 mm klar", "VSG-Glas 8 mm matt", "Polycarbonat 16 mm"], tint: { mat: "Glas", w: { "VSG-Glas 8 mm klar": "#cfe6f1", "VSG-Glas 8 mm matt": "#f1f4f5", "Polycarbonat 16 mm": "#e3ecee" } } },
        { k: "front", l: "Vorne", t: "sel", o: ["offen", "Glasschiebewand", "Senkrechtmarkise"], mat: { Glasschiebewand: ["o_front_glas", "o_front_glas_r"], Senkrechtmarkise: ["o_front_markise", "o_front_markise_r"] } },
        { k: "seite", l: "Seiten", t: "sel", o: ["offen", "Keile", "Glasschiebewände"], mat: { Keile: ["o_seite_keil"], "Glasschiebewände": ["o_seite_glas", "o_seite_glas_r"] } },
        { k: "schatten", l: "Beschattung", t: "sel", o: ["keine", "Unterdachmarkise", "Aufdachmarkise"], mat: { Unterdachmarkise: ["o_unterdach"], Aufdachmarkise: ["o_aufdach", "o_aufdach_r"] } },
        { k: "led", l: "LED-Spots in den Sparren", t: "sel", o: JA, mat: { ja: ["o_led"] } },
        { k: "heiz", l: "Infrarot-Heizstrahler", t: "sel", o: JA, mat: { ja: ["o_heiz", "o_heiz_glut"] } },
        { k: "motor", l: "Motor mit Funk-Handsender", t: "sel", o: JA, wenn: function (c) { return c.schatten !== "keine" || c.front === "Senkrechtmarkise"; } }
      ],
      start: function () { return { b: 5, t: 3.5, hw: 2.8, hs: 2.3, farbe: "Anthrazit RAL 7016", dach: "VSG-Glas 8 mm klar", front: "offen", seite: "Keile", schatten: "keine", led: "ja", heiz: "nein", motor: "ja" }; },
      skal: function (c) { return [c.b / 4, c.hw / 2.6, c.t / 3]; },
      mass: function (c) { return M(c.b) + " × " + M(c.t) + ", Höhe " + M(c.hw) + " / " + M(c.hs); },
      daten: function (c) {
        var gef = Math.atan2(c.hw - c.hs, c.t) * 180 / Math.PI, st = Math.max(2, auf(c.b / 3.5) + 1), felder = Math.max(3, auf((c.b - 0.1) / 0.85));
        return { gef: gef, stuetzen: st, felder: felder, sparren: felder + 1, flaeche: c.b * c.t / Math.cos(Math.atan2(c.hw - c.hs, c.t)) };
      },
      preis: function (c) {
        var d = this.daten(c), out = [], ep = { "VSG-Glas 8 mm klar": 249, "VSG-Glas 8 mm matt": 269, "Polycarbonat 16 mm": 179 }[c.dach] || 249;
        out.push(pos("Terrassendach Aluminium " + M(c.b) + " × " + M(c.t) + ", " + c.dach + ", Gestell " + c.farbe + " (" + d.sparren + " Sparren, " + d.stuetzen + " Stützen)", c.b * c.t, "m²", ep));
        out.push(pos("Montage inkl. Wandanschluss und Abdichtung", 1, "psch", 690 + c.b * 120));
        out.push(pos("Punktfundamente für Stützen", d.stuetzen, "Stk.", 190));
        if (c.front === "Glasschiebewand") out.push(pos("Glasschiebewand vorne, 5-teilig, ESG 10 mm", c.b, "m", 690));
        if (c.front === "Senkrechtmarkise") out.push(pos("Senkrechtmarkise vorne (Screen)", c.b, "m", 390));
        if (c.seite === "Keile") out.push(pos("Seitenkeile aus Glas (links und rechts)", 2, "Stk.", 790 + Math.max(0, c.t - 3) * 150));
        if (c.seite === "Glasschiebewände") out.push(pos("Glasschiebewände seitlich (links und rechts)", 2 * c.t, "m", 720));
        if (c.schatten === "Unterdachmarkise") out.push(pos("Unterdachmarkise", 1, "Stk.", 690 + c.b * c.t * 95));
        if (c.schatten === "Aufdachmarkise") out.push(pos("Aufdachmarkise mit Kassette", 1, "Stk.", 1490 + c.b * c.t * 110));
        var mot = (c.schatten !== "keine" ? 1 : 0) + (c.front === "Senkrechtmarkise" ? 1 : 0);
        if (mot && c.motor === "ja") out.push(pos("Motor mit Funk-Handsender", mot, "Stk.", 390));
        if (c.led === "ja") out.push(pos("LED-Spots dimmbar in den Sparren", 1, "psch", 390 + (d.sparren - 2) * 2 * 40));
        if (c.heiz === "ja") out.push(pos("Infrarot-Heizstrahler 2.000 W", 1, "Stk.", 490));
        return out;
      },
      hinweise: function (c) {
        var d = this.daten(c), h = [];
        if (c.hw <= c.hs) h.push(warn("Die Höhe am Haus muss größer sein als vorne – sonst läuft das Wasser zur Wand."));
        else if (d.gef < 5 && /Glas/.test(c.dach)) h.push(warn("Gefälle nur " + Z1(d.gef) + "°. Für Glasdächer werden meist mindestens 5° empfohlen (Herstellerangabe beachten)."));
        else h.push(ok("Gefälle " + Z1(d.gef) + "° – passt."));
        if (c.front === "Glasschiebewand" && c.seite === "Glasschiebewände") h.push(hin("Rundum verglast: Sommergarten ohne Heizung. Ein beheizter Wintergarten ist Wohnraum – dafür gelten die Anforderungen des GEG."));
        h.push(hin("Schneelast nach Standort (Schneelastzone) – die Statik bzw. Typenstatik liefert der Hersteller. Ob eine Genehmigung nötig ist, hängt von Bundesland, Größe und Grenzabstand ab: vorab bei der Gemeinde klären."));
        return h.join("");
      },
      zeichnung: function (c) {
        var W = 520, H = 292, s = Math.min(150 / c.t, 170 / Math.max(c.hw, 1)), bx = 60, by = 230;   // Seitenansicht
        var wx = bx, fx = bx + c.t * s, yw = by - c.hw * s, yf = by - c.hs * s, g = "";
        g += rc(bx - 22, by - 3.4 * s - 10, 22, 3.4 * s + 10, "gw-haus") + tx(bx - 11, by - 3.4 * s - 16, "Haus");
        g += ln(10, by, 250, by, "gw-boden");
        if (c.seite === "Keile") g += poly([[wx, yw], [fx, yf], [fx, yf + 2], [wx, yf + 2]], "gw-glas");
        if (c.seite === "Glasschiebewände") g += poly([[wx, yw], [fx, yf], [fx, by], [wx, by]], "gw-glas");
        if (c.schatten === "Aufdachmarkise") g += ln(wx + 6, yw - 8, fx, yf - 8, "gw-stofflinie") + rc(wx, yw - 14, 14, 9, "gw-rahmen");
        g += ln(wx, yw, fx + 6, yf + (yf - yw) * 6 / (fx - wx), "gw-dachlinie");
        if (c.schatten === "Unterdachmarkise") g += ln(wx + 4, yw + 8, fx - 6, yf + 8, "gw-stofflinie");
        g += rc(fx - 5, yf, 8, by - yf, "gw-rahmen");
        if (c.front === "Glasschiebewand") g += rc(fx - 1, yf + 6, 4, by - yf - 6, "gw-glas");
        if (c.front === "Senkrechtmarkise") g += rc(fx - 1, yf + 6, 4, (by - yf) * 0.85, "gw-stoff");
        if (c.led === "ja") for (var i = 1; i <= 3; i++) { var zx = wx + (fx - wx) * i / 4, zy = yw + (yf - yw) * i / 4; g += '<circle cx="' + r2(zx) + '" cy="' + r2(zy + 5) + '" r="2.6" class="gw-led"/>'; }
        if (c.heiz === "ja") g += rc(wx + 3, yw + 16, 18, 6, "gw-heiz");
        g += pf(wx, by + 18, fx, by + 18, "Tiefe " + M(c.t), false, -14) + pf(wx + 30, yw, wx + 30, by, M(c.hw), true) + pf(fx + 22, yf, fx + 22, by, M(c.hs), true, -10);
        g += tx(155, 22, "Seitenansicht", "gw-titel");
        // Vorderansicht
        var s2 = Math.min(200 / c.b, 170 / Math.max(c.hw, 1)), ox = 290, oy = by, bw = c.b * s2, d = this.daten(c);
        g += ln(ox - 10, oy, ox + bw + 10, oy, "gw-boden");
        g += rc(ox, oy - c.hs * s2 - 8, bw, 8, "gw-rahmen");
        for (var k = 0; k < d.stuetzen; k++) { var px = ox + (bw - 7) * k / (d.stuetzen - 1); g += rc(px, oy - c.hs * s2, 7, c.hs * s2, "gw-rahmen"); }
        if (c.front === "Glasschiebewand") for (var j = 0; j < 5; j++) g += rc(ox + 8 + j * (bw - 16) / 5, oy - c.hs * s2 + 3, (bw - 16) / 5 - 2, c.hs * s2 - 4, "gw-glas");
        if (c.front === "Senkrechtmarkise") g += rc(ox + 7, oy - c.hs * s2, bw - 14, c.hs * s2 * 0.85, "gw-stoff");
        g += pf(ox, oy + 18, ox + bw, oy + 18, "Breite " + M(c.b), false, -14) + tx(ox + bw / 2, 22, "Vorderansicht", "gw-titel");
        g += tx(W / 2, H - 6, "Gefälle " + Z1(d.gef) + "° · " + d.sparren + " Sparren · " + d.stuetzen + " Stützen · Gestell " + esc(c.farbe), "am-klein");
        var hx = farbeVon(FARBE_ALU, c.farbe); g = faerben(faerben(faerben(g, "gw-rahmen", hx), "gw-dachlinie", hx, "stroke"), "gw-sparren", hx, "stroke");
        return svgBox(W, H, "Zeichnung Terrassendach", g);
      }
    },
    markise: { name: "Markise", gw: "sonnenschutz", modell: "markise",
      masse: [F("b", "Breite", { min: 2, max: 7, st: 0.1 }), F("a", "Ausfall", { min: 1.5, max: 4, st: 0.25 })],
      farben: [{ k: "farbe", l: "Gestell", mat: ["Farbe", "*_r"], o: FARBE_ALU }, { k: "tuch", l: "Tuch", mat: ["Tuch", "o_volant"], o: [["Sand uni", "#d9cdb3"], ["Hellgrau", "#c9cac6"], ["Bordeaux", "#7b2d35"], ["Anthrazit", "#4b4e52"], ["Blockstreifen Blau", "#5d7ea0"]] }],
      optionen: [
        { k: "modell", l: "Modell", t: "sel", o: ["Kassettenmarkise", "offene Gelenkarmmarkise", "Wintergartenmarkise (auf dem Glasdach)", "Pergolamarkise (mit Stützen)"], mat: { Kassettenmarkise: ["o_kassette_r"], "offene Gelenkarmmarkise": ["o_offen_r"], "Wintergartenmarkise (auf dem Glasdach)": ["o_kassette_r"], "Pergolamarkise (mit Stützen)": ["o_kassette_r"] } },
        { k: "antrieb", l: "Antrieb", t: "sel", o: ["Kurbel", "Motor (Funk)", "Motor mit Wind- und Sonnensensor"], mat: { "Motor (Funk)": ["o_motor"], "Motor mit Wind- und Sonnensensor": ["o_motor", "o_sensor"] } },
        { k: "volant", l: "Volant-Rollo (Sichtschutz vorne)", t: "sel", o: JA, mat: { ja: ["o_volant"] } },
        { k: "montage", l: "Montage", t: "sel", o: ["Wand", "Decke", "Sparren"] }
      ],
      start: function () { return { b: 4, a: 3, modell: "Kassettenmarkise", farbe: "Anthrazit RAL 7016", tuch: "Sand uni", antrieb: "Motor mit Wind- und Sonnensensor", volant: "nein", montage: "Wand" }; },
      skal: function (c) { return [c.b / 4, 1, c.a / 3]; },
      mass: function (c) { return M(c.b) + " breit, Ausfall " + M(c.a); },
      preis: function (c) {
        var mo = c.modell || "Kassettenmarkise", basis = { "offene Gelenkarmmarkise": 890, "Wintergartenmarkise (auf dem Glasdach)": 1890, "Pergolamarkise (mit Stützen)": 1690 }[mo] || 1290;
        var out = [pos(mo.replace(/ \(.*\)/, "") + " " + M(c.b) + " × " + M(c.a) + ", Gestell " + c.farbe + ", Tuch " + c.tuch, 1, "Stk.", basis + 290 * c.b + (/Wintergarten|Pergola/.test(mo) ? 190 : 140) * c.a)];
        if (/Pergola/.test(mo)) out.push(pos("Stützen mit Fundament", 2, "Stk.", 190));
        if (c.antrieb !== "Kurbel") out.push(pos("Motor mit Funk-Handsender", 1, "Stk.", 390));
        if (/Sensor/.test(c.antrieb)) out.push(pos("Wind- und Sonnensensor (funkgesteuert)", 1, "Stk.", 290));
        if (c.volant === "ja") out.push(pos("Volant-Rollo", 1, "Stk.", 390 + 90 * c.b));
        out.push(pos("Montage " + c.montage + (c.montage === "Sparren" ? " inkl. Sparrenhalter" : ""), 1, "psch", c.montage === "Sparren" ? 480 : 290));
        return out;
      },
      hinweise: function (c) { return (c.a > c.b ? warn("Ausfall größer als die Breite – das bieten nicht alle Hersteller an.") : ok("Maße passen zu gängigen Modellen.")) + (c.antrieb === "Kurbel" ? hin("Tipp: Mit Windsensor fährt die Markise bei Böen selbst ein.") : ""); },
      zeichnung: function (c) {
        var W = 520, H = 268, s = Math.min(150 / c.a, 60), by = 215, wx = 70, hy = by - 2.5 * s, ex = wx + c.a * s * 0.97, ey = hy + c.a * s * 0.22, g = "";
        g += rc(wx - 20, by - 3 * s, 20, 3 * s, "gw-haus") + ln(10, by, 250, by, "gw-boden");
        g += rc(wx, hy - 8, 16, 12, "gw-rahmen") + ln(wx + 8, hy, ex, ey, "gw-stofflinie") + rc(ex - 3, ey - 3, 7, 7, "gw-rahmen");
        if (c.volant === "ja") g += rc(ex - 1, ey + 4, 3, 0.8 * s, "gw-stoff");
        if (/Sensor/.test(c.antrieb)) g += '<circle cx="' + (wx - 6) + '" cy="' + (hy - 18) + '" r="5" class="gw-led"/>' + tx(wx - 6, hy - 27, "Sensor");
        g += pf(wx + 8, by + 18, ex, by + 18, "Ausfall " + M(c.a), false, -14) + tx(150, 22, "Seitenansicht", "gw-titel");
        var s2 = 200 / c.b, ox = 300, bw = c.b * s2;
        g += rc(ox, 70, bw, 14, "gw-rahmen") + rc(ox + 4, 84, bw - 8, 70, "gw-stoff") + (c.volant === "ja" ? rc(ox + 4, 154, bw - 8, 22, "gw-stoff") : "");
        g += pf(ox, 196, ox + bw, 196, "Breite " + M(c.b), false, -14) + tx(ox + bw / 2, 22, "Vorderansicht", "gw-titel") + tx(W / 2, H - 6, "Tuch " + esc(c.tuch) + " · Gestell " + esc(c.farbe) + " · " + esc(c.antrieb));
        var tu = farbeVon(this.farben[1].o, c.tuch); g = faerben(faerben(faerben(g, "gw-rahmen", farbeVon(FARBE_ALU, c.farbe)), "gw-stoff", tu), "gw-stofflinie", tu, "stroke");
        return svgBox(W, H, "Zeichnung Markise", g);
      }
    },
    dusche: { name: "Walk-in-Dusche", gw: "shk", modell: "dusche",
      masse: [{ k: "b", l: "Breite", t: "sel", o: [["0.9", "90 cm"], ["1.2", "120 cm"], ["1.4", "140 cm"]] }, { k: "t", l: "Tiefe", t: "sel", o: [["0.8", "80 cm"], ["0.9", "90 cm"], ["1", "100 cm"]] }],
      farben: [{ k: "profil", l: "Profile und Armatur", mat: ["Farbe", "*_r"], o: [["Chrom", "#cdd1d6"], ["Schwarz matt", "#232323"], ["Messing gebürstet", "#b89b5e"]] }, { k: "glas", l: "Glas", mat: ["Glas"], o: [["Klarglas", "#cfe6f1"], ["Satiniert", "#f2f5f6"], ["Grauglas", "#7f878c"]], alpha: true }],
      optionen: [{ k: "modell", l: "Modell", t: "sel", o: ["Walk-in", "Eckdusche mit Tür"], mat: { "Eckdusche mit Tür": ["o_eck", "o_eck_r"] } }, { k: "ablauf", l: "Ablauf", t: "sel", o: ["Duschrinne", "Punktablauf"] }, { k: "nische", l: "Wandnische mit Ablage", t: "sel", o: JA }],
      start: function () { return { b: "1.2", t: "0.9", profil: "Chrom", glas: "Klarglas", modell: "Walk-in", ablauf: "Duschrinne", nische: "ja" }; },
      skal: function (c) { return [num(c.b) / 0.9, 1, num(c.t) / 0.9]; },
      mass: function (c) { return CM(num(c.b)) + " × " + CM(num(c.t)) + ", Glas 2,00 m"; },
      preis: function (c) {
        var b = num(c.b), p = 1990 + (c.modell === "Eckdusche mit Tür" ? 490 : 0) + (b >= 1.4 ? 600 : b >= 1.2 ? 350 : 0) + ({ Satiniert: 180, Grauglas: 240 }[c.glas] || 0) + ({ "Schwarz matt": 190, "Messing gebürstet": 320 }[c.profil] || 0);
        var out = [pos((c.modell === "Eckdusche mit Tür" ? "Eckdusche mit Tür, bodengleich, " : "Bodengleiche Walk-in-Dusche ") + CM(b) + " × " + CM(num(c.t)) + " mit " + c.ablauf + ", Glaswand " + c.glas + ", Profil " + c.profil, 1, "Stk.", p)];
        if (c.nische === "ja") out.push(pos("Wandnische mit Ablage, gefliest", 1, "Stk.", 390));
        return out;
      },
      zeichnung: function (c) { var b = num(c.b), t = num(c.t), s = 150 / Math.max(b, t), g = rc(90, 60, b * s, t * s, "gw-objekt") + ln(90, 60 + t * s, 90 + b * s * 0.66, 60 + t * s, "gw-glaslinie") + (c.ablauf === "Duschrinne" ? rc(100, 66, b * s - 20, 5, "gw-rahmen") : '<circle cx="' + (90 + b * s / 2) + '" cy="' + (60 + t * s / 2) + '" r="5" class="gw-rahmen"/>') + pf(90, 48, 90 + b * s, 48, CM(b)) + pf(78, 60, 78, 60 + t * s, CM(t), true); return svgBox(360, 260, "Draufsicht Dusche", g + tx(180, 245, "Draufsicht · Glas " + esc(c.glas) + " · Profil " + esc(c.profil))); }
    },
    waschtisch: { name: "Waschtisch mit Unterschrank", gw: "shk", modell: "waschtisch",
      masse: [{ k: "b", l: "Breite", t: "sel", o: [["0.6", "60 cm"], ["0.8", "80 cm"], ["1", "100 cm"], ["1.2", "120 cm"]] }],
      farben: [{ k: "front", l: "Front", mat: ["Farbe"], o: [["Eiche natur", "#9a7552"], ["Weiß Hochglanz", "#f2f2f0"], ["Graphit matt", "#3d3f42"], ["Salbeigrün", "#9fae95"]] }],
      optionen: [{ k: "spiegel", l: "Darüber", t: "sel", o: ["Spiegel mit LED", "Spiegelschrank"], mat: { "Spiegel mit LED": ["o_spiegel"], Spiegelschrank: ["o_spiegelschrank"] } }, { k: "becken", l: "Becken", t: "sel", o: ["Einzelbecken", "Doppelbecken"], wenn: function (c) { return num(c.b) >= 1.2; } }],
      start: function () { return { b: "0.8", front: "Eiche natur", spiegel: "Spiegel mit LED", becken: "Einzelbecken" }; },
      skal: function (c) { return [num(c.b) / 0.8, 1, 1]; },
      mass: function (c) { return CM(num(c.b)) + " breit, Oberkante 88 cm"; },
      preis: function (c) {
        var b = num(c.b), d = c.becken === "Doppelbecken" && b >= 1.2;
        var out = [pos("Waschtisch " + CM(b) + " mit Unterschrank, Front " + c.front + (d ? ", Doppelbecken" : "") + ", inkl. Armatur" + (d ? "en" : ""), 1, "Stk.", 690 + b * 700 + (d ? 570 : 0))];
        out.push(pos(c.spiegel, 1, "Stk.", c.spiegel === "Spiegelschrank" ? 590 : 240));
        return out;
      },
      zeichnung: function (c) { var b = num(c.b), s = 200 / 1.2, x = 180 - b * s / 2, g = rc(x, 150, b * s, 70, "gw-holz") + rc(x - 4, 140, b * s + 8, 12, "gw-objekt") + rc(x + 10, 30, b * s - 20, 90, c.spiegel === "Spiegelschrank" ? "gw-rahmen" : "gw-glas") + ln(x, 185, x + b * s, 185, "gw-linie") + pf(x, 240, x + b * s, 240, CM(b), false, -12); return svgBox(360, 270, "Ansicht Waschtisch", g + tx(180, 20, "Ansicht · Front " + esc(c.front), "gw-titel")); }
    },
    heizkoerper: { name: "Heizkörper", gw: "heizung", modell: "heizkoerper",
      masse: [{ k: "l", l: "Länge", t: "sel", o: [["0.6", "60 cm"], ["0.8", "80 cm"], ["1", "100 cm"], ["1.2", "120 cm"], ["1.4", "140 cm"], ["1.6", "160 cm"]] }, { k: "h", l: "Höhe", t: "sel", o: [["0.6", "60 cm"], ["0.9", "90 cm"]] }],
      farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe", "*_r"], o: [["Weiß RAL 9016", "#f3f3f1"], ["Anthrazit", "#3a3d40"], ["Schwarz matt", "#1e1e1e"], ["Salbei", "#9fae95"]] }],
      optionen: [{ k: "modell", l: "Modell", t: "sel", o: ["Flach", "Röhren", "Design"], mat: { Flach: ["o_flach_r"], "Röhren": ["o_roehren_r"], Design: ["o_design_r"] } }, { k: "typ", l: "Bautiefe", t: "sel", o: ["Typ 22", "Typ 33"] }],
      start: function () { return { l: "1.2", h: "0.6", farbe: "Weiß RAL 9016", modell: "Flach", typ: "Typ 22" }; },
      skal: function (c) { return [num(c.l), (num(c.h) + 0.15) / 0.75, c.typ === "Typ 33" ? 1.4 : 1]; },
      watt: function (c) { return Math.round(num(c.l) * num(c.h) * (c.typ === "Typ 33" ? 1950 : 1450)); },   // Richtwert bei 55/45/20 °C
      mass: function (c) { return CM(num(c.l)) + " × " + CM(num(c.h)) + ", " + c.typ + ", ca. " + Z0(this.watt(c)) + " W bei 55 °C"; },
      preis: function (c) { var p = (180 + num(c.l) * num(c.h) * 260) * (c.typ === "Typ 33" ? 1.3 : 1) * (/Weiß/.test(c.farbe) ? 1 : 1.25) * ({ "Röhren": 1.6, Design: 1.9 }[c.modell] || 1); return [pos((c.modell && c.modell !== "Flach" ? c.modell + "heizkörper " : "Flachheizkörper ") + c.typ + " " + CM(num(c.l)) + " × " + CM(num(c.h)) + ", " + c.farbe + ", liefern und montieren", 1, "Stk.", p + 160)]; },
      zeichnung: function (c) { var l = num(c.l), h = num(c.h), s = 180 / 1.6, x = 180 - l * s / 2, g = rc(x, 190 - h * s, l * s, h * s, "gw-objekt"); for (var i = 1; i < l * 20; i++) g += ln(x + i * s / 20, 194 - h * s, x + i * s / 20, 186, "gw-linie"); return svgBox(360, 250, "Heizkörper", g + pf(x, 215, x + l * s, 215, CM(l), false, -12) + pf(x - 14, 190 - h * s, x - 14, 190, CM(h), true) + tx(180, 22, "Ansicht · " + Z0(this.watt(c)) + " W bei 55 °C (Richtwert)", "gw-titel")); }
    },
    waermepumpe: { name: "Wärmepumpe (Außengerät)", gw: "heizung", modell: "waermepumpe",
      masse: [{ k: "kw", l: "Leistung", t: "sel", o: [["6", "6 kW"], ["8", "8 kW"], ["10", "10 kW"], ["12", "12 kW"], ["14", "14 kW"], ["16", "16 kW"]] }],
      farben: [{ k: "farbe", l: "Gehäuse", mat: ["Farbe"], o: [["Lichtgrau", "#dcdddf"], ["Anthrazit", "#3b3e42"], ["Weiß", "#f2f2f2"]] }],
      optionen: [{ k: "sockel", l: "Betonsockel", t: "sel", o: JA, mat: { ja: ["o_sockel"] } }],
      start: function () { return { kw: "10", farbe: "Lichtgrau", sockel: "ja" }; },
      skal: function (c) { var f = { 6: 0.9, 8: 1, 10: 1, 12: 1.12, 14: 1.18, 16: 1.25 }[c.kw] || 1; return [f, f, f]; },
      mass: function (c) { var f = this.skal(c)[0]; return c.kw + " kW · ca. " + CM(1.1 * f) + " × " + CM(0.97 * f) + " × " + CM(0.5 * f); },
      preis: function (c) { var out = [pos("Luft-Wasser-Wärmepumpe " + c.kw + " kW, Gehäuse " + c.farbe + ", liefern", 1, "Stk.", { 6: 9800, 8: 10900, 10: 12400, 12: 13900, 14: 15400, 16: 16900 }[c.kw] || 12400)]; if (c.sockel === "ja") out.push(pos("Betonsockel für das Außengerät", 1, "psch", 480)); return out; },
      zeichnung: function (c) { var f = this.skal(c)[0], s = 140, x = 180 - 0.55 * f * s, y = 220 - 0.97 * f * s, g = rc(x, y, 1.1 * f * s, 0.85 * f * s, "gw-objekt") + '<circle cx="' + (x + 0.43 * f * s) + '" cy="' + (y + 0.42 * f * s) + '" r="' + (0.3 * f * s) + '" class="gw-rahmen"/>' + rc(x + 10, 220 - 0.12 * f * s, 1.1 * f * s - 20, 0.12 * f * s, "gw-rahmen"); return svgBox(360, 260, "Wärmepumpe", g + ln(40, 220, 320, 220, "gw-boden") + pf(x, 240, x + 1.1 * f * s, 240, CM(1.1 * f), false, -12) + tx(180, 22, c.kw + " kW · " + esc(c.farbe), "gw-titel")); }
    },
    klimageraet: { name: "Klimagerät (Split, innen)", gw: "heizung", modell: "klimageraet",
      masse: [{ k: "kw", l: "Kühlleistung", t: "sel", o: [["2.5", "2,5 kW (bis ca. 25 m²)"], ["3.5", "3,5 kW (bis ca. 35 m²)"], ["5", "5,0 kW (bis ca. 50 m²)"]] }],
      farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe"], o: [["Weiß", "#f4f4f2"], ["Schwarz", "#26272a"], ["Silber", "#b9bcbe"]] }],
      optionen: [{ k: "wlan", l: "Steuerung per App", t: "sel", o: JA }],
      start: function () { return { kw: "3.5", farbe: "Weiß", wlan: "ja" }; },
      skal: function (c) { var f = { "2.5": 0.9, "3.5": 1, "5": 1.15 }[c.kw] || 1; return [f, 1, 1]; },
      mass: function (c) { return Z1(num(c.kw)) + " kW · ca. " + CM(0.8 * this.skal(c)[0]) + " breit, Montage auf 2,10 m"; },
      preis: function (c) { return [pos("Split-Klimagerät " + Z1(num(c.kw)) + " kW, " + c.farbe + ", inkl. Außengerät und Montage (Leitungen bis 3 m)", 1, "Stk.", { "2.5": 1890, "3.5": 2190, "5": 2690 }[c.kw] || 2190)].concat(c.wlan === "ja" ? [pos("WLAN-Modul für App-Steuerung", 1, "Stk.", 89)] : []); },
      hinweise: function () { return hin("Kältemittel-Arbeiten nur durch zertifizierten Fachbetrieb (EU-F-Gase-Verordnung)."); },
      zeichnung: function (c) { var f = this.skal(c)[0], x = 180 - 0.4 * f * 220; return svgBox(360, 200, "Klimagerät", rc(x, 70, 0.8 * f * 220, 60, "gw-objekt") + ln(x + 12, 118, x + 0.8 * f * 220 - 12, 118, "gw-linie") + pf(x, 150, x + 0.8 * f * 220, 150, CM(0.8 * f), false, -12) + tx(180, 30, Z1(num(c.kw)) + " kW · " + esc(c.farbe), "gw-titel")); }
    },
    kaminofen: { name: "Kaminofen", gw: "heizung", modell: "kaminofen",
      masse: [{ k: "kw", l: "Nennleistung", t: "sel", o: [["5", "5 kW"], ["7", "7 kW"], ["8", "8 kW"]] }],
      farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe"], o: [["Schwarz", "#222325"], ["Grau", "#6f7072"], ["Gussgrau", "#4a4b4d"]] }],
      optionen: [{ k: "speicher", l: "Speichersteine-Aufsatz", t: "sel", o: JA, mat: { ja: ["o_speicher"] } }, { k: "seitenglas", l: "Seitenscheibe", t: "sel", o: JA, mat: { ja: ["o_seitenglas"] } }],
      start: function () { return { kw: "7", farbe: "Schwarz", speicher: "ja", seitenglas: "nein" }; },
      skal: function (c) { var f = { 5: 0.92, 7: 1, 8: 1.06 }[c.kw] || 1; return [f, f, f]; },
      mass: function () { return "ca. 50 × 110 × 45 cm, Rauchrohr Ø 15 cm"; },
      preis: function (c) { var out = [pos("Kaminofen " + c.kw + " kW, " + c.farbe + (c.speicher === "ja" ? ", mit Speichersteinen" : "") + (c.seitenglas === "ja" ? ", Seitenscheibe" : ""), 1, "Stk.", 2490 + (c.speicher === "ja" ? 690 : 0) + (c.seitenglas === "ja" ? 390 : 0))]; out.push(pos("Aufstellen, Rauchrohr und Anschluss an den Schornstein", 1, "psch", 690)); return out; },
      hinweise: function () { return hin("Vor der ersten Nutzung nimmt der bevollmächtigte Bezirksschornsteinfeger die Anlage ab."); },
      zeichnung: function (c) { var g = rc(150, 80 - (c.speicher === "ja" ? 28 : 0), 60, 110 + (c.speicher === "ja" ? 28 : 0), "gw-objekt") + rc(160, 110, 40, 45, "gw-glut") + rc(172, 20, 16, 60 - (c.speicher === "ja" ? 28 : 0), "gw-rahmen") + rc(120, 190, 120, 4, "gw-rahmen"); return svgBox(360, 230, "Kaminofen", g + ln(40, 194, 320, 194, "gw-boden") + tx(180, 215, c.kw + " kW · " + esc(c.farbe))); }
    },
    wallbox: { name: "Wallbox", gw: "elektro", modell: "wallbox",
      masse: [{ k: "kw", l: "Ladeleistung", t: "sel", o: [["11", "11 kW"], ["22", "22 kW"]] }],
      farben: [{ k: "farbe", l: "Gehäuse", mat: ["Farbe"], o: [["Weiß", "#f4f4f2"], ["Anthrazit", "#3a3d40"], ["Edelstahl", "#b9bcbe"]] }],
      optionen: [{ k: "anschluss", l: "Anschluss", t: "sel", o: ["Ladekabel 5 m", "Steckdose Typ 2"], mat: { "Ladekabel 5 m": ["o_kabel"], "Steckdose Typ 2": ["o_dose"] } }, { k: "saeule", l: "Standsäule (statt Wand)", t: "sel", o: JA, mat: { ja: ["o_saeule"] } }, { k: "pv", l: "PV-Überschussladen", t: "sel", o: JA }],
      start: function () { return { kw: "11", farbe: "Weiß", anschluss: "Ladekabel 5 m", saeule: "nein", pv: "ja" }; },
      skal: function () { return [1, 1, 1]; },
      mass: function () { return "ca. 30 × 40 × 15 cm, Montage auf 1,20 m"; },
      preis: function (c) { var out = [pos("Wallbox " + c.kw + " kW, " + c.farbe + ", " + c.anschluss, 1, "Stk.", c.kw === "22" ? 1290 : 990), pos("Montage, Zuleitung bis 10 m, FI Typ A + DC-Fehlerstromerkennung", 1, "psch", 690)]; if (c.saeule === "ja") out.push(pos("Standsäule mit Fundament", 1, "Stk.", 590)); if (c.pv === "ja") out.push(pos("Einbindung PV-Überschussladen", 1, "psch", 190)); out.push(pos("Meldung beim Netzbetreiber", 1, "psch", 0)); return out; },
      hinweise: function (c) { return hin(c.kw === "22" ? "22 kW: Der Netzbetreiber muss vorher zustimmen." : "11 kW: Beim Netzbetreiber anmelden (keine Genehmigung nötig)."); },
      zeichnung: function (c) { var g = (c.saeule === "ja" ? rc(170, 120, 20, 90, "gw-rahmen") : rc(60, 30, 18, 180, "gw-haus")) + rc(160, 70, 40, 52, "gw-objekt") + rc(166, 76, 28, 38, "gw-rahmen") + (c.anschluss === "Ladekabel 5 m" ? '<path d="M200 110 q30 30 0 60 q-20 20 10 30" class="gw-kabel"/>' : ""); return svgBox(360, 230, "Wallbox", g + ln(40, 210, 320, 210, "gw-boden") + tx(180, 22, c.kw + " kW · " + esc(c.farbe) + " · " + esc(c.anschluss), "gw-titel")); }
    },
    stromspeicher: { name: "Stromspeicher", gw: "solar", modell: "stromspeicher",
      masse: [{ k: "kwh", l: "Kapazität", t: "sel", o: [["5", "5 kWh"], ["10", "10 kWh"], ["15", "15 kWh"]] }],
      farben: [{ k: "farbe", l: "Gehäuse", mat: ["Farbe"], o: [["Weiß", "#f4f4f2"], ["Anthrazit", "#3a3d40"]] }],
      optionen: [{ k: "notstrom", l: "Ersatzstrom bei Stromausfall", t: "sel", o: JA }],
      start: function () { return { kwh: "10", farbe: "Weiß", notstrom: "nein" }; },
      skal: function (c) { return [1, { 5: 0.6, 10: 1, 15: 1.4 }[c.kwh] || 1, 1]; },
      mass: function (c) { return c.kwh + " kWh · ca. 60 × " + CM(1.2 * this.skal(c)[1]) + " × 25 cm"; },
      preis: function (c) { var out = [pos("Batteriespeicher " + c.kwh + " kWh, " + c.farbe, 1, "Stk.", { 5: 3900, 10: 6400, 15: 8900 }[c.kwh] || 6400)]; if (c.notstrom === "ja") out.push(pos("Ersatzstrom-Umschaltung", 1, "Stk.", 890)); return out; },
      zeichnung: function (c) { var h = 1.2 * this.skal(c)[1] * 120; return svgBox(360, 230, "Stromspeicher", rc(150, 205 - h, 60, h, "gw-objekt") + ln(40, 205, 320, 205, "gw-boden") + tx(180, 22, c.kwh + " kWh · " + esc(c.farbe), "gw-titel")); }
    },
    haustuer: { name: "Haustür", gw: "fenster", modell: "haustuer",
      masse: [F("b", "Breite (Maueröffnung)", { min: 0.9, max: 1.4, st: 0.01 }), F("h", "Höhe (Maueröffnung)", { min: 1.9, max: 2.5, st: 0.01 })],
      farben: [{ k: "farbe", l: "Farbe außen", mat: ["Farbe"], o: [["Anthrazit RAL 7016", "#383e42"], ["Weiß", "#f1f0ea"], ["Eiche-Dekor", "#8d6a49"], ["Rubinrot", "#7a2a2a"]] }],
      optionen: [
        { k: "material", l: "Material", t: "sel", o: ["Aluminium", "Kunststoff", "Holz"] },
        { k: "licht", l: "Glas im Türblatt", t: "sel", o: ["Glasstreifen", "drei Glasfelder", "ohne Glas"], mat: { Glasstreifen: ["o_glasstreifen"], "drei Glasfelder": ["o_glas3"] } },
        { k: "seitenteil", l: "Seitenteil mit Glas", t: "sel", o: JA, mat: { ja: ["o_seitenteil", "o_seitenteil_r"] } },
        { k: "schloss", l: "Schloss", t: "sel", o: ["Mehrfachverriegelung", "Motorschloss mit Fingerprint"] }
      ],
      start: function () { return { b: 1.1, h: 2.1, farbe: "Anthrazit RAL 7016", material: "Aluminium", licht: "Glasstreifen", seitenteil: "nein", schloss: "Mehrfachverriegelung" }; },
      skal: function (c) { return [c.b / 1.1, c.h / 2.1, 1]; },
      mass: function (c) { return "Maueröffnung " + MM(c.b) + " × " + MM(c.h) + " mm"; },
      preis: function (c) {
        var p = { Aluminium: 3900, Kunststoff: 2600, Holz: 3600 }[c.material] * (c.b > 1.15 || c.h > 2.15 ? 1.12 : 1);
        var out = [pos("Haustür " + c.material + ", " + c.farbe + ", " + c.licht + ", " + c.schloss + ", Bestellmaß " + MM(c.b - 0.03) + " × " + MM(c.h - 0.015) + " mm", 1, "Stk.", p + (c.schloss === "Motorschloss mit Fingerprint" ? 890 : 0))];
        if (c.seitenteil === "ja") out.push(pos("Seitenteil mit Ornamentglas", 1, "Stk.", 1190));
        out.push(pos("Altbau-Tür ausbauen und entsorgen", 1, "Stk.", 160), pos("Montage nach RAL mit Fugenbändern", 1, "Stk.", 420));
        return out;
      },
      zeichnung: function (c) {
        var s = 90, x = 120, y = 230 - c.h * s, w = c.b * s, g = rc(x, y, w, c.h * s, "gw-rahmen") + rc(x + 6, y + 6, w - 12, c.h * s - 6, "gw-tuer");
        if (c.licht === "Glasstreifen") g += rc(x + 16, y + 30, 10, c.h * s - 60, "gw-glas");
        if (c.licht === "drei Glasfelder") for (var i = 0; i < 3; i++) g += rc(x + 16, y + 30 + i * 50, 18, 26, "gw-glas");
        g += rc(x + w - 22, y + c.h * s * 0.35, 5, c.h * s * 0.45, "gw-griff");
        if (c.seitenteil === "ja") g += rc(x + w, y, 42, c.h * s, "gw-rahmen") + rc(x + w + 6, y + 6, 30, c.h * s - 12, "gw-glas");
        g = faerben(g, "gw-tuer", farbeVon(this.farben[0].o, c.farbe));
        return svgBox(360, 270, "Haustür Ansicht", g + ln(40, 230, 320, 230, "gw-boden") + pf(x, 250, x + w, 250, MM(c.b) + " mm", false, -12) + pf(x - 16, y, x - 16, 230, MM(c.h) + " mm", true) + tx(180, 18, "Ansicht außen · " + esc(c.material) + " · " + esc(c.farbe), "gw-titel"));
      }
    }
  };
  Object.keys(PRODUKTE).forEach(function (k) { PRODUKTE[k].id = k; });

  window.GW = { GEWERKE: GEWERKE, ANDERE: ANDERE, AUFMASS_FUER: AUFMASS_FUER, PRODUKTE: PRODUKTE, IC: IC,
    h: { Z: Z, Z0: Z0, Z1: Z1, M: M, CM: CM, MM: MM, EUR: EUR, esc: esc, r2: r2, num: num, sum: sum, pos: pos, tab: tab, mat: mat, warn: warn, ok: ok, hin: hin, svgBox: svgBox, pf: pf, tx: tx, rc: rc, ln: ln, poly: poly, geo: geo, einfuegen: einfuegen, raumFl: raumFl, F: F, RAUM: RAUM, JA: JA, auf: auf, rad: rad },
    AUFMASS: {} };
})();

/* =====================================================================
   3b. PRODUKTKATALOG: weitere Produkte für alle Gewerke
   Jedes Produkt: Kategorie, Maße, Farben, Ausstattung, Preis (Beispiel,
   netto), Zeichnung und – wo sinnvoll – ein eigenes 3D-Modell für AR.
   ===================================================================== */
(function () {
  "use strict";
  var GW = window.GW, h = GW.h, P = GW.PRODUKTE, Z1 = h.Z1, Z0 = h.Z0, M = h.M, CM = h.CM, MM = h.MM, esc = h.esc, pos = h.pos, num = h.num, F = h.F, JA = h.JA;
  var rc = h.rc, ln = h.ln, tx = h.tx, pf = h.pf, svgBox = h.svgBox, poly = h.poly;
  var ALU = [["Anthrazit RAL 7016", "#383e42"], ["Weiß RAL 9016", "#f1f0ea"], ["Schwarz RAL 9005", "#1f2022"], ["Silber eloxiert", "#b9bcbe"]];
  var WEISSE = [["Weiß", "#f4f4f2"], ["Anthrazit", "#3a3d40"], ["Schwarz matt", "#222222"]];
  var hex = function (liste, name) { var o = liste.filter(function (x) { return x[0] === name; })[0]; return o ? o[1] : "#ccc"; };
  var sel = function (k, l, werte, einheit) { return { k: k, l: l, t: "sel", o: werte.map(function (w) { return [String(w), String(w).replace(".", ",") + (einheit ? " " + einheit : "")]; }) }; };

  /* Ansicht von vorne: Rechteck in Originalproportion, mit Maßen und Farbe */
  function ansicht(o) {
    var b = o.b, hh = o.h, y0 = o.y0 || 0, s = Math.min(280 / b, 180 / (hh + y0)), x = 180 - b * s / 2, boden = 232, y = boden - (y0 + hh) * s;
    var g = ln(30, boden, 330, boden, "gw-boden") + rc(x, y, b * s, hh * s, "gw-objekt", ' style="fill:' + (o.farbe || "#eee") + '"') + (o.deko ? o.deko(x, y, b * s, hh * s, s) : "");
    return svgBox(360, 270, o.titel, g + pf(x, boden + 18, x + b * s, boden + 18, o.bText || M(b), false, -12) + pf(x - 16, y, x - 16, y + hh * s, o.hText || M(hh), true) + tx(180, 18, esc(o.titel), "gw-titel"));
  }
  function flaeche(o) {   // Musterfläche von oben (Fliesen, Dielen, Pflaster)
    var g = "", fb = o.farbe, n = 0, s = 30;
    if (o.muster === "dielen") for (var r = 0; r < 9; r++) { var off = (r % 2) * 60; for (var x = -off; x < 300; x += 120) { g += rc(30 + Math.max(0, x), 30 + r * 22, Math.min(120, 300 - Math.max(0, x), x + 120), 21, "gw-objekt", ' style="fill:' + fb + '"'); } }
    else { var a = o.a || 60, bb = o.bb || 60; for (var yy = 0; yy < 200; yy += bb) for (var xx = 0; xx < 300; xx += a) { var vx = (o.verband && (yy / bb) % 2) ? a / 2 : 0; g += rc(30 + Math.max(0, xx - vx), 30 + yy, Math.min(a, 300 - Math.max(0, xx - vx)), Math.min(bb, 200 - yy) - 2, "gw-objekt", ' style="fill:' + fb + ';stroke:#888"'); } }
    return svgBox(360, 270, o.titel, g + tx(180, 18, esc(o.titel), "gw-titel") + tx(180, 252, o.unten || "", "am-klein"));
  }
  function neu(id, d) { d.id = id; if (!d.skal) d.skal = function () { return [1, 1, 1]; }; P[id] = d; }

  /* ---------- Sanitär & Bad ---------- */
  neu("badewanne", { name: "Badewanne", gw: "shk", kat: "Bad", modell: "badewanne",
    masse: [sel("l", "Länge", [1.7, 1.8, 1.9], "m"), sel("b", "Breite", [0.75, 0.8, 0.9], "m")],
    farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe", "*_r"], o: [["Weiß glänzend", "#f4f4f2"], ["Weiß matt", "#ecebe7"], ["Schwarz matt", "#262626"], ["Sand", "#d8ccb6"]] }],
    optionen: [{ k: "modell", l: "Modell", t: "sel", o: ["Einbauwanne mit Schürze", "freistehend"], mat: { "Einbauwanne mit Schürze": ["o_einbau_r", "o_einbau_arm"], freistehend: ["o_frei_r", "o_frei_arm"] } }, { k: "whirl", l: "Whirlpool-Funktion", t: "sel", o: JA }],
    start: function () { return { l: "1.8", b: "0.8", farbe: "Weiß glänzend", modell: "freistehend", whirl: "nein" }; },
    skal: function (c) { return [num(c.l) / 1.8, 1, num(c.b) / 0.8]; },
    mass: function (c) { return CM(num(c.l)) + " × " + CM(num(c.b)) + ", " + c.modell; },
    preis: function (c) { var frei = c.modell === "freistehend"; return [pos((frei ? "Freistehende Badewanne " : "Einbauwanne mit Schürze ") + CM(num(c.l)) + " × " + CM(num(c.b)) + ", " + c.farbe + (frei ? ", mit Standarmatur" : ", mit Wannenarmatur"), 1, "Stk.", (frei ? 2890 : 1290) + (num(c.l) - 1.7) * 2000 + (/Schwarz|Sand/.test(c.farbe) ? 590 : 0))].concat(c.whirl === "ja" ? [pos("Whirlpool-Funktion mit Elektroanschluss", 1, "psch", 1890)] : [], [pos("Montage und Anschluss Vor- und Abwasser", 1, "psch", 690)]); },
    zeichnung: function (c) { var frei = c.modell === "freistehend"; return ansicht({ titel: "Badewanne " + c.modell + " · " + c.farbe, b: num(c.l), h: 0.6, farbe: hex(this.farben[0].o, c.farbe), deko: function (x, y, w, hh) { return (frei ? rc(x + w * 0.9 + 20, y - 40, 5, hh + 40, "gw-griff") : rc(x + w / 2 - 6, y - 8, 12, 8, "gw-griff")) + ln(x + 10, y + 6, x + w - 10, y + 6, "gw-linie"); } }); }
  });
  neu("wc", { name: "WC / Dusch-WC", gw: "shk", kat: "Bad", modell: "wc",
    masse: [],
    farben: [{ k: "platte", l: "Betätigungsplatte", mat: ["Farbe"], o: [["Chrom", "#cdd1d6"], ["Weiß", "#f4f4f2"], ["Schwarz matt", "#222"], ["Messing gebürstet", "#b89b5e"]] }],
    optionen: [{ k: "modell", l: "Modell", t: "sel", o: ["Wand-WC spülrandlos", "Dusch-WC"], mat: { "Dusch-WC": ["o_duschwc"] } }, { k: "soft", l: "Sitz mit Absenkautomatik", t: "sel", o: JA }],
    start: function () { return { platte: "Chrom", modell: "Wand-WC spülrandlos", soft: "ja" }; },
    mass: function (c) { return c.modell + ", Vorwand 60 × 112 cm"; },
    preis: function (c) { var d = c.modell === "Dusch-WC"; return [pos((d ? "Dusch-WC" : "Wand-WC spülrandlos") + " mit Vorwandelement, Betätigungsplatte " + c.platte, 1, "Stk.", d ? 2890 : 1290)].concat(d ? [pos("Steckdose für Dusch-WC (Elektrofachbetrieb)", 1, "Stk.", 190)] : [], c.soft === "ja" ? [pos("WC-Sitz mit Absenkautomatik", 1, "Stk.", 89)] : []); },
    zeichnung: function (c) { return ansicht({ titel: c.modell + " · Platte " + c.platte, b: 0.6, h: 1.12, farbe: "#d9d9d6", deko: function (x, y, w, hh, s) { return rc(x + w * 0.2, y + hh - 0.75 * s, w * 0.6, 0.35 * s, "gw-objekt") + rc(x + w * 0.3, y + 0.05 * s, w * 0.4, 0.15 * s, "gw-rahmen", ' style="fill:' + hex(P.wc.farben[0].o, c.platte) + '"') + (c.modell === "Dusch-WC" ? rc(x + w * 0.2, y + hh - 0.82 * s, w * 0.6, 0.07 * s, "gw-glas") : ""); }, bText: "60 cm", hText: "112 cm" }); }
  });
  neu("handtuchheizkoerper", { name: "Handtuchheizkörper", gw: "shk", kat: "Bad", modell: "handtuchheizkoerper",
    masse: [sel("b", "Breite", [0.5, 0.6], "m"), sel("h", "Höhe", [0.8, 1.2, 1.5], "m")],
    farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe"], o: [["Weiß", "#f4f4f2"], ["Anthrazit", "#3a3d40"], ["Schwarz matt", "#222"], ["Chrom", "#cdd1d6"]] }],
    optionen: [{ k: "betrieb", l: "Betrieb", t: "sel", o: ["Warmwasser", "elektrisch", "beides (mit Heizstab)"] }],
    start: function () { return { b: "0.6", h: "1.2", farbe: "Weiß", betrieb: "beides (mit Heizstab)" }; },
    skal: function (c) { return [num(c.b) / 0.6, (num(c.h) + 0.15) / 1.35, 1]; },
    mass: function (c) { return CM(num(c.b)) + " × " + CM(num(c.h)) + ", " + c.betrieb; },
    preis: function (c) { return [pos("Handtuchheizkörper " + CM(num(c.b)) + " × " + CM(num(c.h)) + ", " + c.farbe + ", " + c.betrieb, 1, "Stk.", 290 + num(c.b) * num(c.h) * 320 + (c.farbe === "Chrom" ? 190 : /Weiß/.test(c.farbe) ? 0 : 90) + ({ elektrisch: 190, "beides (mit Heizstab)": 290 }[c.betrieb] || 0)), pos("Montage und Anschluss", 1, "psch", 180)]; },
    zeichnung: function (c) { var b = num(c.b), hh = num(c.h); return ansicht({ titel: "Handtuchheizkörper · " + c.farbe, b: b, h: hh, y0: 0.15, farbe: "none", deko: function (x, y, w, H, s) { var g = rc(x, y, 6, H, "gw-rahmen") + rc(x + w - 6, y, 6, H, "gw-rahmen"); for (var i = 0; i < hh / 0.08; i++) g += rc(x, y + 6 + i * 0.08 * s, w, 3, "gw-rahmen"); return g.replace(/gw-rahmen"/g, 'gw-rahmen" style="fill:' + hex(P.handtuchheizkoerper.farben[0].o, c.farbe) + ';stroke:#999"'); } }); }
  });

  /* ---------- Heizung ---------- */
  neu("gastherme", { name: "Gas-Brennwerttherme", gw: "heizung", kat: "Wärme", modell: "gastherme",
    masse: [sel("kw", "Leistung", [20, 24, 30], "kW")],
    farben: [{ k: "farbe", l: "Gehäuse", mat: ["Farbe"], o: WEISSE.slice(0, 2) }],
    optionen: [{ k: "ww", l: "Warmwasser", t: "sel", o: ["Kombitherme (Warmwasser inklusive)", "mit Speicher 120 l"] }, { k: "app", l: "Steuerung per App", t: "sel", o: JA }],
    start: function () { return { kw: "24", farbe: "Weiß", ww: "Kombitherme (Warmwasser inklusive)", app: "ja" }; },
    mass: function (c) { return c.kw + " kW · ca. 44 × 72 × 34 cm, Wandmontage"; },
    preis: function (c) { return [pos("Gas-Brennwerttherme " + c.kw + " kW, " + c.ww, 1, "Stk.", { 20: 2990, 24: 3290, 30: 3690 }[c.kw] + (/Speicher/.test(c.ww) ? 1150 : 0)), pos("Montage, Abgasleitung und Inbetriebnahme", 1, "psch", 1490)].concat(c.app === "ja" ? [pos("Internet-Modul für App-Steuerung", 1, "Stk.", 190)] : []); },
    hinweise: function () { return h.hin("Vor dem Einbau einer neuen Gasheizung die aktuellen Vorgaben des Gebäudeenergiegesetzes (GEG) prüfen – sie haben sich zuletzt häufig geändert."); },
    zeichnung: function (c) { return ansicht({ titel: "Gas-Brennwerttherme " + c.kw + " kW", b: 0.44, h: 0.72, y0: 1.2, farbe: hex(WEISSE, c.farbe), bText: "44 cm", hText: "72 cm", deko: function (x, y, w) { return rc(x + w * 0.3, y + 14, w * 0.4, 8, "gw-rahmen") + rc(x + w * 0.45, y - 40, w * 0.1, 40, "gw-rahmen"); } }); }
  });
  neu("pufferspeicher", { name: "Speicher", gw: "heizung", kat: "Wärme", modell: "pufferspeicher",
    masse: [sel("l", "Inhalt", [300, 500, 800], "l")],
    farben: [{ k: "farbe", l: "Mantel", mat: ["Farbe"], o: [["Weiß", "#f4f4f2"], ["Silber", "#c4c7ca"]] }],
    optionen: [{ k: "typ", l: "Art", t: "sel", o: ["Pufferspeicher", "Warmwasserspeicher", "Kombispeicher"] }],
    start: function () { return { l: "500", farbe: "Weiß", typ: "Pufferspeicher" }; },
    skal: function (c) { return { 300: [0.86, 0.75, 0.86], 500: [1, 1, 1], 800: [1.15, 1.2, 1.15] }[c.l] || [1, 1, 1]; },
    mass: function (c) { var k = this.skal(c); return c.l + " l · Ø " + CM(0.7 * k[0]) + ", Höhe " + CM(1.6 * k[1]); },
    preis: function (c) { return [pos(c.typ + " " + c.l + " l", 1, "Stk.", { 300: 1190, 500: 1590, 800: 2290 }[c.l] + (c.typ === "Kombispeicher" ? 600 : 0)), pos("Aufstellen und hydraulisch anschließen", 1, "psch", 490)]; },
    zeichnung: function (c) { var k = this.skal(c); return ansicht({ titel: c.typ + " " + c.l + " l", b: 0.7 * k[0], h: 1.6 * k[1], farbe: hex(this.farben[0].o, c.farbe) }); }
  });

  /* ---------- Elektro ---------- */
  neu("zaehlerschrank", { name: "Zählerschrank", gw: "elektro", kat: "Strom", modell: "zaehlerschrank",
    masse: [{ k: "plaetze", l: "Größe", t: "sel", o: ["2 Zählerplätze", "3 Zählerplätze"] }],
    farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe"], o: [["Lichtgrau", "#e6e6e3"], ["Weiß", "#f4f4f2"]] }],
    optionen: [{ k: "ueber", l: "Überspannungsschutz Typ 1+2", t: "sel", o: JA }, { k: "smg", l: "Platz für Smart-Meter-Gateway", t: "sel", o: JA }],
    start: function () { return { plaetze: "2 Zählerplätze", farbe: "Lichtgrau", ueber: "ja", smg: "ja" }; },
    skal: function (c) { return [/3/.test(c.plaetze) ? 1.3 : 1, 1, 1]; },
    mass: function (c) { return c.plaetze + " · ca. " + CM(0.8 * this.skal(c)[0]) + " × 110 cm"; },
    preis: function (c) { return [pos("Zählerschrank nach TAB, " + c.plaetze + ", inkl. Unterverteilung", 1, "Stk.", /3/.test(c.plaetze) ? 3150 : 2650)].concat(c.ueber === "ja" ? [pos("Überspannungsschutz Typ 1+2", 1, "Stk.", 490)] : [], c.smg === "ja" ? [pos("Vorbereitung Smart-Meter-Gateway", 1, "psch", 120)] : [], [pos("Anmeldung beim Netzbetreiber", 1, "psch", 0)]); },
    zeichnung: function (c) { return ansicht({ titel: "Zählerschrank · " + c.plaetze, b: 0.8 * this.skal(c)[0], h: 1.1, y0: 0.6, farbe: hex(this.farben[0].o, c.farbe), deko: function (x, y, w, hh) { return ln(x + w / 2, y + 4, x + w / 2, y + hh - 4, "gw-linie"); } }); }
  });
  neu("schalter", { name: "Schalter & Steckdosen", gw: "elektro", kat: "Strom", modell: null,
    masse: [F("sd", "Steckdosen", { min: 1, max: 200, st: 1, e: "" }), F("sch", "Schalter", { min: 0, max: 100, st: 1, e: "" })],
    farben: [{ k: "farbe", l: "Farbe", mat: [], o: [["Reinweiß glänzend", "#f7f7f5"], ["Weiß matt", "#eeeeea"], ["Anthrazit", "#3a3d40"], ["Edelstahl", "#b9bcbe"], ["Schwarz matt", "#222"]] }],
    optionen: [{ k: "serie", l: "Serie", t: "sel", o: ["Standard", "Flachdesign", "Glasrahmen"] }, { k: "usb", l: "Steckdosen mit USB-C (je Raum eine)", t: "sel", o: JA }],
    start: function () { return { sd: 40, sch: 18, farbe: "Weiß matt", serie: "Flachdesign", usb: "ja" }; },
    mass: function (c) { return c.sd + " Steckdosen, " + c.sch + " Schalter · " + c.serie; },
    preis: function (c) { var f = { Standard: 1, Flachdesign: 1.4, Glasrahmen: 2.1 }[c.serie] * (/Edelstahl|Schwarz/.test(c.farbe) ? 1.3 : 1); return [pos("Steckdosen, Serie " + c.serie + ", " + c.farbe, num(c.sd), "Stk.", 14 * f), pos("Schalter, Serie " + c.serie + ", " + c.farbe, num(c.sch), "Stk.", 19 * f)].concat(c.usb === "ja" ? [pos("Steckdose mit USB-C", 6, "Stk.", 59)] : []); },
    zeichnung: function (c) { var fb = hex(this.farben[0].o, c.farbe), r = c.serie === "Glasrahmen" ? 4 : c.serie === "Flachdesign" ? 2 : 10, g = ""; [80, 180, 280].forEach(function (x, i) { g += rc(x - 40, 80, 80, 80, "gw-objekt", ' rx="' + r + '" style="fill:' + fb + '"') + (i === 1 ? rc(x - 14, 100, 28, 40, "gw-linie", ' rx="3"') : '<circle cx="' + x + '" cy="120" r="22" class="gw-linie"/><circle cx="' + (x - 8) + '" cy="120" r="3" class="gw-rahmen"/><circle cx="' + (x + 8) + '" cy="120" r="3" class="gw-rahmen"/>'); }); return svgBox(360, 220, "Schalterprogramm", g + tx(180, 30, "Serie " + esc(c.serie) + " · " + esc(c.farbe), "gw-titel") + tx(180, 195, "Steckdose · Schalter · Steckdose", "am-klein")); }
  });

  /* ---------- Solar ---------- */
  neu("balkonkraftwerk", { name: "Balkonkraftwerk", gw: "solar", kat: "Strom", modell: "balkonkraftwerk",
    masse: [{ k: "module", l: "Module", t: "sel", o: ["1 Modul", "2 Module"] }],
    farben: [{ k: "rahmen", l: "Rahmen", mat: ["Farbe"], o: [["Silber", "#c4c7ca"], ["Schwarz", "#222"]] }],
    optionen: [{ k: "halter", l: "Befestigung", t: "sel", o: ["Balkongeländer", "Hauswand", "Aufständerung"] }, { k: "speicher", l: "Speicher 1,6 kWh", t: "sel", o: JA }],
    start: function () { return { module: "2 Module", rahmen: "Schwarz", halter: "Balkongeländer", speicher: "nein" }; },
    skal: function (c) { return [/^1/.test(c.module) ? 0.5 : 1, 1, 1]; },
    mass: function (c) { return c.module + " à 430 Wp, Wechselrichter 800 W"; },
    preis: function (c) { var n = /^1/.test(c.module) ? 1 : 2; return [pos("Balkonkraftwerk " + n + " × 430 Wp, Wechselrichter 800 W, Rahmen " + c.rahmen + ", Halterung " + c.halter, 1, "Stk.", n === 1 ? 429 : 690)].concat(c.speicher === "ja" ? [pos("Balkon-Speicher 1,6 kWh", 1, "Stk.", 590)] : [], [pos("Montage und Einweisung", 1, "psch", 190)]); },
    hinweise: function () { return h.hin("Anmeldung nur im Marktstammdatenregister. Mieter und Wohnungseigentümer brauchen die Zustimmung, haben aber in der Regel einen Anspruch darauf."); },
    zeichnung: function (c) { var n = /^1/.test(c.module) ? 1 : 2; return ansicht({ titel: "Balkonkraftwerk · " + c.module, b: 1.72 * n, h: 1.13, farbe: "#22355a", deko: function (x, y, w, hh) { var g = ""; for (var i = 1; i < n * 6; i++) g += ln(x + i * w / (n * 6), y, x + i * w / (n * 6), y + hh, "gw-linie"); return g; } }); }
  });

  /* ---------- Maler ---------- */
  var TECHNIK = { "Dispersion glatt": 9.8, "Raufaser": 13.5, "Vliestapete": 17.5, "Kalkputz": 39, "Mineralputz (Kratzputz)": 45, "Betonoptik": 69 };
  neu("wandgestaltung", { name: "Wandgestaltung", gw: "maler", kat: "Wohnen", modell: "wandmuster", platzierung: "wall", foto: true,
    masse: [F("b", "Wandbreite", { min: 1, max: 15, st: 0.1 }), F("h", "Wandhöhe", { min: 2, max: 5, st: 0.05 })],
    farben: [{ k: "farbe", l: "Farbton", mat: ["Farbe"], o: [["Reinweiß", "#f4f3ef"], ["Kieselgrau", "#cfcac0"], ["Salbei", "#b5c1a8"], ["Taubenblau", "#a9b8c6"], ["Sand", "#e0cfb1"], ["Terracotta", "#c98a6b"], ["Petrol", "#3f6b6f"], ["Anthrazit", "#4a4d50"]] }],
    optionen: [{ k: "technik", l: "Technik", t: "sel", o: Object.keys(TECHNIK) }],
    textur: function (c) { return c.technik === "Dispersion glatt" ? null : c.technik; },
    start: function () { return { b: 4.2, h: 2.55, farbe: "Salbei", technik: "Kalkputz" }; },
    skal: function (c) { return [num(c.b) / 2.5, num(c.h) / 2.5, 1]; },
    mass: function (c) { return h.Z(num(c.b) * num(c.h)) + " m² · " + c.technik; },
    preis: function (c) { var f = num(c.b) * num(c.h); return [pos("Wand " + c.technik + ", Farbton " + c.farbe, f, "m²", TECHNIK[c.technik]), pos("Abkleben und Abdecken", 1, "psch", 60)]; },
    hinweise: function () { return h.hin("In der AR-Ansicht hängt die Fläche in Originalgröße direkt an Ihrer Wand: Handy auf die Wand richten, bis sie erkannt ist. Oder die Farbe gleich im eigenen Foto ausprobieren."); },
    zeichnung: function (c) { var t = c.technik; return ansicht({ titel: "Wand · " + c.farbe + " · " + t, b: num(c.b), h: num(c.h), farbe: hex(this.farben[0].o, c.farbe), deko: function (x, y, w, hh) { var g = ""; if (t === "Betonoptik") for (var i = 1; i < 4; i++) g += ln(x + i * w / 4, y, x + i * w / 4, y + hh, "gw-linie") + '<circle cx="' + (x + i * w / 4 - 20) + '" cy="' + (y + 20) + '" r="2" class="gw-rahmen"/>'; if (/Kalkputz|Mineral/.test(t)) for (var k = 0; k < 14; k++) g += '<path d="M' + (x + (k * 37) % w) + " " + (y + (k * 53) % hh) + ' q12 -6 24 0" class="gw-linie"/>'; if (/Tapete|Raufaser/.test(t)) for (var j = 1; j < w / 30; j++) g += ln(x + j * 30, y, x + j * 30, y + hh, "gw-linie"); return g; } }); }
  });

  /* ---------- Fliesen, Boden, Pflaster: Musterfläche 2 × 2 m im Raum ---------- */
  function belagProdukt(id, d) {
    neu(id, { name: d.name, gw: d.gw, kat: d.kat, modell: "bodenmuster",
      masse: [F("fl", "Fläche", { min: 1, max: 500, st: 0.5, e: "m²" })].concat(d.masse || []),
      farben: [{ k: "farbe", l: d.farbL, mat: ["Farbe"], o: d.farben }],
      optionen: d.optionen, immer: [d.muster === "Dielen" ? "o_planke" : "o_fliese"],
      start: d.start, mass: d.mass, preis: d.preis, hinweise: function () { return h.hin("Im Raum sehen Sie eine Musterfläche von 2 × 2 m in Originalgröße."); },
      zeichnung: function (c) { return flaeche({ titel: d.name + " · " + c.farbe, farbe: hex(d.farben, c.farbe), muster: d.muster === "Dielen" ? "dielen" : "raster", a: d.a ? d.a(c) : 60, bb: d.bb ? d.bb(c) : 60, verband: c.verlegung === "Halbverband", unten: d.mass(c) }); } });
  }
  var FMT = { "30 × 60": [30, 60, 0.6], "60 × 60": [60, 60, 0.8], "60 × 120": [60, 120, 1.2], "120 × 120": [120, 120, 1.6] };
  belagProdukt("fliese", { name: "Fliesen", gw: "fliesen", kat: "Wohnen", muster: "Raster", farbL: "Farbe",
    farben: [["Betongrau", "#9a9a96"], ["Sand", "#d9cfbf"], ["Anthrazit", "#4a4c4e"], ["Weiß", "#eeeeea"], ["Marmoroptik", "#e8e6e1"], ["Terrazzo", "#cfc8bd"], ["Holzoptik Eiche", "#b8946a"]],
    masse: [{ k: "fmt", l: "Format (cm)", t: "sel", o: Object.keys(FMT) }],
    optionen: [{ k: "oberfl", l: "Oberfläche", t: "sel", o: ["matt", "poliert", "rutschhemmend R10"] }, { k: "verlegung", l: "Verlegung", t: "sel", o: ["Kreuzfuge", "Halbverband"] }],
    start: function () { return { fl: 24, fmt: "60 × 60", farbe: "Betongrau", oberfl: "matt", verlegung: "Kreuzfuge", muster: "Raster" }; },
    a: function (c) { return FMT[c.fmt][1] * 0.75; }, bb: function (c) { return FMT[c.fmt][0] * 0.75; },
    mass: function (c) { return Z1(num(c.fl)) + " m² · " + c.fmt + " cm · " + c.oberfl; },
    preis: function (c) { var f = num(c.fl); return [pos("Fliesen " + c.fmt + ", " + c.farbe + ", " + c.oberfl + " liefern (inkl. 10 % Verschnitt)", f * 1.1, "m²", 29 + FMT[c.fmt][2] * 22 + (c.oberfl === "poliert" ? 8 : 0)), pos("Fliesen verlegen, " + c.verlegung, f, "m²", 58 + (FMT[c.fmt][2] > 1 ? 14 : 0))]; } });
  belagProdukt("bodenbelag", { name: "Boden: Vinyl, Laminat, Parkett", gw: "boden", kat: "Wohnen", muster: "Dielen", farbL: "Dekor",
    farben: [["Eiche natur", "#c7a57a"], ["Eiche grau", "#a59c8f"], ["Esche hell", "#e0d2bb"], ["Nussbaum", "#7a5a40"], ["Eiche geräuchert", "#6f5440"]],
    optionen: [{ k: "belag", l: "Belag", t: "sel", o: ["Vinyl (Klick)", "Laminat", "Parkett geölt"] }, { k: "leisten", l: "Sockelleisten", t: "sel", o: ["weiß", "in Bodenfarbe"] }],
    start: function () { return { fl: 38, farbe: "Eiche natur", belag: "Parkett geölt", leisten: "weiß", muster: "Dielen" }; },
    mass: function (c) { return Z1(num(c.fl)) + " m² · " + c.belag; },
    preis: function (c) { var f = num(c.fl), ep = { "Vinyl (Klick)": 39, Laminat: 22, "Parkett geölt": 59 }[c.belag]; return [pos(c.belag + ", Dekor " + c.farbe + " liefern (inkl. 8 % Verschnitt)", f * 1.08, "m²", ep), pos(c.belag + " verlegen inkl. Trittschalldämmung", f, "m²", c.belag === "Parkett geölt" ? 34 : 27), pos("Sockelleisten " + c.leisten, Math.sqrt(f) * 4, "m", c.leisten === "weiß" ? 12.9 : 15.9)]; } });
  belagProdukt("pflaster", { name: "Pflaster & Terrassenplatten", gw: "garten", kat: "Außen", muster: "Raster", farbL: "Farbe",
    farben: [["Grau", "#9c9a95"], ["Anthrazit", "#55575a"], ["Muschelkalk", "#d8cfbd"], ["Rotbunt", "#a5644a"], ["Sandstein", "#c9b38f"]],
    optionen: [{ k: "stein", l: "Stein", t: "sel", o: ["Betonpflaster 20 × 10", "Terrassenplatte 60 × 40", "Naturstein"] }, { k: "verlegung", l: "Verlegung", t: "sel", o: ["Halbverband", "Kreuzfuge"] }],
    start: function () { return { fl: 30, farbe: "Grau", stein: "Terrassenplatte 60 × 40", verlegung: "Halbverband", muster: "Raster" }; },
    a: function (c) { return /20 × 10/.test(c.stein) ? 30 : 60; }, bb: function (c) { return /20 × 10/.test(c.stein) ? 15 : 40; },
    mass: function (c) { return Z1(num(c.fl)) + " m² · " + c.stein; },
    preis: function (c) { var f = num(c.fl); return [pos(c.stein + ", " + c.farbe + " liefern und verlegen inkl. Splittbett", f, "m²", { "Betonpflaster 20 × 10": 79, "Terrassenplatte 60 × 40": 99, Naturstein: 159 }[c.stein]), pos("Unterbau Schotter 20 cm einbauen und verdichten", f, "m²", 22)]; } });

  /* ---------- Trockenbau ---------- */
  neu("trennwand", { name: "Trennwand mit Tür", gw: "trockenbau", kat: "Wohnen", modell: "trennwand",
    masse: [F("b", "Breite", { min: 2, max: 6, st: 0.1 }), F("h", "Höhe", { min: 2.3, max: 3.2, st: 0.05 })],
    farben: [{ k: "tuer", l: "Türblatt", mat: ["Farbe"], o: [["Weiß", "#f1f0ec"], ["Eiche", "#b8946a"], ["Schwarz matt", "#222"]] }],
    optionen: [{ k: "ausf", l: "Ausführung", t: "sel", o: ["Gipskarton", "Glas mit Rahmen"], mat: { Gipskarton: ["o_gips"], "Glas mit Rahmen": ["o_glas", "o_glas_r"] } }],
    start: function () { return { b: 3, h: 2.5, tuer: "Weiß", ausf: "Glas mit Rahmen" }; },
    skal: function (c) { return [num(c.b) / 3, num(c.h) / 2.5, 1]; },
    mass: function (c) { return M(num(c.b)) + " × " + M(num(c.h)) + " · " + c.ausf; },
    preis: function (c) { var f = num(c.b) * num(c.h) - 1.9, gl = /Glas/.test(c.ausf); return [pos((gl ? "Glastrennwand mit schwarzem Stahlrahmen" : "Ständerwand Gipskarton, doppelt beplankt") + ", " + M(num(c.b)) + " × " + M(num(c.h)), f, "m²", gl ? 390 : 72), pos("Tür " + c.tuer + " mit Zarge", 1, "Stk.", gl ? 990 : 690)]; },
    zeichnung: function (c) { var gl = /Glas/.test(c.ausf), b = num(c.b); return ansicht({ titel: "Trennwand · " + c.ausf, b: b, h: num(c.h), farbe: gl ? "rgba(160,205,230,.45)" : "#f2f1ee", deko: function (x, y, w, hh, s) { return rc(x + 1.2 * s, y + hh - 2.1 * s, 0.9 * s, 2.1 * s, "gw-tuer", ' style="fill:' + hex(P.trennwand.farben[0].o, c.tuer) + '"') + (gl ? ln(x, y + hh * 0.35, x + w, y + hh * 0.35, "gw-dachlinie") : ""); } }); }
  });

  /* ---------- Schreiner ---------- */
  var FRONTEN = [["Weiß matt", "#f1f0ec"], ["Eiche furniert", "#b8946a"], ["Salbei lackiert", "#9fae95"], ["Anthrazit lackiert", "#3d4043"]];
  neu("einbauschrank", { name: "Einbauschrank nach Maß", gw: "schreiner", kat: "Wohnen", modell: "einbauschrank",
    masse: [F("b", "Breite", { min: 0.8, max: 5, st: 0.05 }), F("h", "Höhe", { min: 1.8, max: 2.8, st: 0.05 }), sel("t", "Tiefe", [0.4, 0.6], "m")],
    farben: [{ k: "front", l: "Front", mat: ["Farbe"], o: FRONTEN }],
    optionen: [{ k: "griff", l: "Griffe", t: "sel", o: ["Griffstangen", "grifflos (Push-to-open)"] }, { k: "led", l: "LED-Beleuchtung", t: "sel", o: JA, mat: { ja: ["o_led"] } }],
    start: function () { return { b: 2.4, h: 2.3, t: "0.6", front: "Eiche furniert", griff: "Griffstangen", led: "ja" }; },
    skal: function (c) { return [num(c.b) / 2.4, num(c.h) / 2.3, num(c.t) / 0.6]; },
    mass: function (c) { return M(num(c.b)) + " × " + M(num(c.h)) + " × " + CM(num(c.t)); },
    preis: function (c) { var f = { "Weiß matt": 1, "Eiche furniert": 1.35, "Salbei lackiert": 1.25, "Anthrazit lackiert": 1.25 }[c.front]; return [pos("Einbauschrank nach Maß " + M(num(c.b)) + " × " + M(num(c.h)) + ", Front " + c.front + ", " + c.griff, num(c.b), "lfm", 1450 * num(c.h) / 2.4 * f * (num(c.t) < 0.5 ? 0.85 : 1))].concat(c.led === "ja" ? [pos("LED-Beleuchtung mit Bewegungsmelder", 1, "psch", 390)] : [], [pos("Lieferung und Montage", 1, "psch", 390)]); },
    zeichnung: function (c) { var n = Math.max(2, Math.round(num(c.b) / 0.6)); return ansicht({ titel: "Einbauschrank · " + c.front, b: num(c.b), h: num(c.h), farbe: hex(FRONTEN, c.front), deko: function (x, y, w, hh) { var g = ""; for (var i = 1; i < n; i++) g += ln(x + i * w / n, y, x + i * w / n, y + hh, "gw-linie"); if (c.griff === "Griffstangen") for (var j = 0; j < n; j++) g += rc(x + (j + (j % 2 ? 0.12 : 0.85)) * w / n - 2, y + hh * 0.4, 4, hh * 0.18, "gw-griff"); return g; } }); }
  });
  neu("kueche", { name: "Küchenzeile", gw: "schreiner", kat: "Wohnen", modell: "kueche",
    masse: [F("l", "Länge", { min: 1.8, max: 6, st: 0.1 })],
    farben: [{ k: "front", l: "Front", mat: ["Farbe", "o_haenge"], o: FRONTEN }, { k: "platte", l: "Arbeitsplatte", mat: ["Platte"], o: [["Eiche massiv", "#9a7552"], ["Keramik weiß", "#efeeea"], ["Granit schwarz", "#2b2b2b"], ["Betonoptik", "#9b9a96"]] }],
    optionen: [{ k: "haenge", l: "Hängeschränke", t: "sel", o: JA, mat: { ja: ["o_haenge"] } }, { k: "geraete", l: "Geräte", t: "sel", o: ["ohne Geräte", "mit Geräten (Mittelklasse)", "mit Geräten (Premium)"] }],
    start: function () { return { l: 3.6, front: "Weiß matt", platte: "Eiche massiv", haenge: "ja", geraete: "mit Geräten (Mittelklasse)" }; },
    skal: function (c) { return [num(c.l) / 3.6, 1, 1]; },
    mass: function (c) { return M(num(c.l)) + " Zeile · " + c.front + " · " + c.platte; },
    preis: function (c) { var l = num(c.l), f = { "Weiß matt": 1, "Eiche furniert": 1.35, "Salbei lackiert": 1.25, "Anthrazit lackiert": 1.25 }[c.front]; return [pos("Unterschränke, Front " + c.front, l, "lfm", 1150 * f), pos("Arbeitsplatte " + c.platte, l, "lfm", { "Eiche massiv": 390, "Keramik weiß": 690, "Granit schwarz": 590, "Betonoptik": 260 }[c.platte])].concat(c.haenge === "ja" ? [pos("Hängeschränke, Front " + c.front, l * 0.8, "lfm", 690 * f)] : [], c.geraete !== "ohne Geräte" ? [pos("Geräte: Kochfeld, Backofen, Spülmaschine, Kühlschrank, Haube (" + (/Premium/.test(c.geraete) ? "Premium" : "Mittelklasse") + ")", 1, "psch", /Premium/.test(c.geraete) ? 6900 : 3900)] : [], [pos("Lieferung und Montage (Anschlüsse Sanitär/Elektro separat)", 1, "psch", 1290)]); },
    zeichnung: function (c) { var n = Math.round(num(c.l) / 0.6), fb = hex(FRONTEN, c.front), pl = hex(this.farben[1].o, c.platte); return ansicht({ titel: "Küchenzeile · " + c.front, b: num(c.l), h: 0.9, farbe: fb, deko: function (x, y, w, hh, s) { var g = rc(x, y - 4, w, 6, "gw-objekt", ' style="fill:' + pl + '"'); for (var i = 1; i < n; i++) g += ln(x + i * w / n, y + 2, x + i * w / n, y + hh, "gw-linie"); if (c.haenge === "ja") { g += rc(x, y - 1.25 * s, w, 0.7 * s, "gw-objekt", ' style="fill:' + fb + '"'); for (var j = 1; j < n; j++) g += ln(x + j * w / n, y - 1.25 * s, x + j * w / n, y - 0.55 * s, "gw-linie"); } return g; } }); }
  });
  neu("treppe", { name: "Holztreppe", gw: "schreiner", kat: "Wohnen", modell: "treppe",
    masse: [F("gh", "Geschosshöhe", { min: 2.4, max: 3.2, st: 0.01 }), sel("b", "Laufbreite", [0.8, 0.9, 1.0], "m")],
    farben: [{ k: "holz", l: "Holz", mat: ["Farbe", "Wange"], o: [["Eiche", "#b08a5a"], ["Buche", "#c9a073"], ["Eiche geräuchert", "#6b4f36"], ["Weiß lackiert", "#efeeea"]] }],
    optionen: [{ k: "gel", l: "Geländer", t: "sel", o: ["Edelstahl", "Holz", "Glas"], mat: { Edelstahl: ["o_gelaender"], Holz: ["o_gelaender"], Glas: ["o_gelaender"] } }],
    start: function () { return { gh: 2.75, b: "0.9", holz: "Eiche", gel: "Edelstahl" }; },
    skal: function (c) { var n = Math.round(num(c.gh) / 0.18); return [num(c.b) / 0.9, num(c.gh) / 2.75, (n - 1) / 13]; },
    mass: function (c) { var n = Math.round(num(c.gh) / 0.18); return n + " Steigungen à " + CM(num(c.gh) / n) + ", Laufbreite " + CM(num(c.b)); },
    preis: function (c) { var n = Math.round(num(c.gh) / 0.18); return [pos("Gerade Holztreppe " + c.holz + ", " + n + " Steigungen, Laufbreite " + CM(num(c.b)), n - 1, "Stufen", { Eiche: 440, Buche: 360, "Eiche geräuchert": 490, "Weiß lackiert": 400 }[c.holz]), pos("Geländer " + c.gel + " mit Handlauf", (n - 1) * 0.27, "m", { Edelstahl: 290, Holz: 220, Glas: 590 }[c.gel]), pos("Montage", 1, "psch", 980)]; },
    zeichnung: function (c) { var n = Math.round(num(c.gh) / 0.18), st = num(c.gh) / n, a = 0.63 - 2 * st, s = Math.min(300 / ((n - 1) * a), 190 / num(c.gh)), x0 = 30, y0 = 232, g = ln(20, y0, 340, y0, "gw-boden"), fb = hex(this.farben[0].o, c.holz); for (var i = 0; i < n - 1; i++) g += rc(x0 + i * a * s, y0 - (i + 1) * st * s, a * s + 3, 5, "gw-holz", ' style="fill:' + fb + '"'); return svgBox(360, 270, "Treppe", g + tx(180, 18, n + " Steigungen à " + CM(st) + " · Auftritt " + CM(a) + " · " + esc(c.holz), "gw-titel") + pf(x0, 252, x0 + (n - 1) * a * s, 252, "Lauflänge " + M((n - 1) * a), false, -12)); }
  });
  neu("innentuer", { name: "Innentür", gw: "schreiner", kat: "Wohnen", modell: "innentuer",
    masse: [sel("b", "Breite", [0.735, 0.86, 0.985], "m")],
    farben: [{ k: "farbe", l: "Oberfläche", mat: ["Farbe", "Zarge"], o: [["Weiß lackiert", "#f1f0ec"], ["Eiche", "#b8946a"], ["Grau", "#9a9b9c"], ["Schwarz matt", "#222"]] }],
    optionen: [{ k: "glas", l: "Lichtausschnitt", t: "sel", o: JA, mat: { ja: ["o_glas"] } }, { k: "schloss", l: "Schloss", t: "sel", o: ["Buntbart", "Bad-Verriegelung"] }],
    start: function () { return { b: "0.86", farbe: "Weiß lackiert", glas: "nein", schloss: "Buntbart" }; },
    skal: function (c) { return [num(c.b) / 0.86, 1, 1]; },
    mass: function (c) { return CM(num(c.b)) + " × 198,5 cm"; },
    preis: function (c) { return [pos("Innentür " + CM(num(c.b)) + " × 198,5 cm, " + c.farbe + (c.glas === "ja" ? ", mit Lichtausschnitt" : "") + ", " + c.schloss + ", inkl. Zarge", 1, "Stk.", (/Weiß/.test(c.farbe) ? 390 : 520) + (c.glas === "ja" ? 120 : 0)), pos("Montage", 1, "Stk.", 190)]; },
    zeichnung: function (c) { return ansicht({ titel: "Innentür · " + c.farbe, b: num(c.b), h: 1.985, farbe: hex(this.farben[0].o, c.farbe), deko: function (x, y, w, hh) { return rc(x + w - 18, y + hh * 0.48, 12, 3, "gw-griff") + (c.glas === "ja" ? rc(x + w * 0.36, y + hh * 0.1, w * 0.28, hh * 0.6, "gw-glas") : ""); } }); }
  });

  /* ---------- Dach ---------- */
  neu("dachfenster", { name: "Dachfenster", gw: "dach", kat: "Außen", modell: null,
    masse: [{ k: "gr", l: "Größe", t: "sel", o: ["78 × 118 cm", "78 × 140 cm", "114 × 118 cm"] }],
    farben: [{ k: "innen", l: "Rahmen innen", mat: [], o: [["Kiefer natur", "#d6b48a"], ["Weiß", "#f4f4f2"]] }],
    optionen: [{ k: "bed", l: "Bedienung", t: "sel", o: ["manuell", "elektrisch", "Solar (ohne Kabel)"] }, { k: "rolll", l: "Außenrollladen", t: "sel", o: JA }],
    start: function () { return { gr: "78 × 118 cm", innen: "Weiß", bed: "Solar (ohne Kabel)", rolll: "ja" }; },
    mass: function (c) { return c.gr + " · " + c.bed; },
    preis: function (c) { return [pos("Dachfenster " + c.gr + ", Rahmen " + c.innen + ", " + c.bed, 1, "Stk.", { "78 × 118 cm": 690, "78 × 140 cm": 790, "114 × 118 cm": 890 }[c.gr] + ({ elektrisch: 490, "Solar (ohne Kabel)": 690 }[c.bed] || 0))].concat(c.rolll === "ja" ? [pos("Außenrollladen (Solar)", 1, "Stk.", 590)] : [], [pos("Einbau inkl. Eindeckrahmen und Innenfutter", 1, "Stk.", 690)]); },
    zeichnung: function (c) { var w = parseInt(c.gr, 10) / 100, hh = parseInt(c.gr.split("×")[1], 10) / 100; return ansicht({ titel: "Dachfenster " + c.gr, b: w, h: hh, farbe: "#4a5056", deko: function (x, y, W, H) { return rc(x + 8, y + 8, W - 16, H - 16, "gw-glas") + (c.rolll === "ja" ? rc(x, y - 10, W, 10, "gw-kasten") : ""); } }); }
  });

  /* ---------- Fenster, Türen & Tore ---------- */
  var RAHMEN = [["Weiß", "#f4f4f2"], ["Anthrazit außen", "#383e42"], ["Eiche-Dekor", "#8d6a49"], ["Schwarz", "#222"]];
  neu("fenster", { name: "Fenster", gw: "fenster", kat: "Außen", modell: "fenster",
    masse: [F("b", "Breite", { min: 0.5, max: 2.4, st: 0.01 }), F("h", "Höhe", { min: 0.5, max: 2.2, st: 0.01 })],
    farben: [{ k: "farbe", l: "Rahmen", mat: ["Farbe", "*_r"], o: RAHMEN }],
    optionen: [{ k: "fl", l: "Flügel", t: "sel", o: ["1-flügelig", "2-flügelig"], mat: { "2-flügelig": ["o_mittel_r"] } }, { k: "mat", l: "Material", t: "sel", o: ["Kunststoff", "Holz", "Holz-Alu", "Aluminium"] }, { k: "glas", l: "Verglasung", t: "sel", o: ["3-fach", "3-fach Schallschutz", "2-fach"] }, { k: "rc2", l: "Sicherheit RC2", t: "sel", o: JA }],
    start: function () { return { b: 1.2, h: 1.4, farbe: "Anthrazit außen", fl: "2-flügelig", mat: "Kunststoff", glas: "3-fach", rc2: "nein" }; },
    skal: function (c) { return [num(c.b) / 1.2, num(c.h) / 1.4, 1]; },
    mass: function (c) { return MM(c.b) + " × " + MM(c.h) + " mm · " + c.fl + " · " + c.glas; },
    preis: function (c) { var m2 = num(c.b) * num(c.h), f = { Kunststoff: 1, Holz: 1.45, "Holz-Alu": 1.75, Aluminium: 1.6 }[c.mat] * (c.fl === "2-flügelig" ? 1.1 : 1) * ({ "3-fach Schallschutz": 1.15, "2-fach": 0.9 }[c.glas] || 1); return [pos("Fenster " + c.mat + ", " + c.fl + ", " + c.glas + ", " + c.farbe + ", " + MM(c.b) + " × " + MM(c.h) + " mm", 1, "Stk.", (160 + 380 * m2) * f + (/Anthrazit|Eiche|Schwarz/.test(c.farbe) ? 120 : 0))].concat(c.rc2 === "ja" ? [pos("Sicherheitsbeschläge RC2", 1, "Stk.", 190)] : [], [pos("Ausbau Altfenster und Montage nach RAL", 1, "Stk.", 280)]); },
    hinweise: function (c) { return c.glas === "2-fach" ? h.warn("Beim Austausch verlangt das GEG für Fenster Uw höchstens 1,3 W/(m²K) – Herstellerwert prüfen.") : ""; },
    zeichnung: function (c) { var zwei = c.fl === "2-flügelig"; return ansicht({ titel: "Fenster · " + c.fl + " · " + c.farbe, b: num(c.b), h: num(c.h), y0: 0.9, farbe: hex(RAHMEN, c.farbe), bText: MM(c.b) + " mm", hText: MM(c.h) + " mm", deko: function (x, y, w, hh) { return zwei ? rc(x + 6, y + 6, w / 2 - 9, hh - 12, "gw-glas") + rc(x + w / 2 + 3, y + 6, w / 2 - 9, hh - 12, "gw-glas") : rc(x + 6, y + 6, w - 12, hh - 12, "gw-glas"); } }); }
  });
  neu("schiebetuer", { name: "Hebe-Schiebetür", gw: "fenster", kat: "Außen", modell: "schiebetuer",
    masse: [F("b", "Breite", { min: 2, max: 6, st: 0.05 }), F("h", "Höhe", { min: 2.1, max: 2.7, st: 0.01 })],
    farben: [{ k: "farbe", l: "Rahmen", mat: ["Farbe"], o: RAHMEN }],
    optionen: [{ k: "schwelle", l: "Schwelle", t: "sel", o: ["barrierefrei (flach)", "Standard"] }, { k: "glas", l: "Verglasung", t: "sel", o: ["3-fach", "3-fach Sicherheitsglas"] }],
    start: function () { return { b: 3, h: 2.3, farbe: "Anthrazit außen", schwelle: "barrierefrei (flach)", glas: "3-fach" }; },
    skal: function (c) { return [num(c.b) / 3, num(c.h) / 2.3, 1]; },
    mass: function (c) { return M(num(c.b)) + " × " + M(num(c.h)) + " · " + c.schwelle; },
    preis: function (c) { return [pos("Hebe-Schiebetür " + M(num(c.b)) + " × " + M(num(c.h)) + ", " + c.farbe + ", " + c.glas + ", Schwelle " + c.schwelle, 1, "Stk.", 1900 + num(c.b) * num(c.h) * 590 + (/Sicherheit/.test(c.glas) ? 690 : 0) + (/barriere/.test(c.schwelle) ? 390 : 0)), pos("Montage nach RAL", 1, "Stk.", 690)]; },
    zeichnung: function (c) { return ansicht({ titel: "Hebe-Schiebetür · " + c.farbe, b: num(c.b), h: num(c.h), farbe: hex(RAHMEN, c.farbe), deko: function (x, y, w, hh) { return rc(x + 6, y + 6, w / 2 - 9, hh - 12, "gw-glas") + rc(x + w / 2 + 3, y + 6, w / 2 - 9, hh - 12, "gw-glas") + ln(x + w / 2 + 20, y + hh / 2, x + w / 2 + 60, y + hh / 2, "gw-dachlinie"); } }); }
  });
  neu("garagentor", { name: "Garagentor", gw: "fenster", kat: "Außen", modell: "garagentor",
    masse: [F("b", "Breite", { min: 2.3, max: 5.5, st: 0.01 }), F("h", "Höhe", { min: 1.9, max: 2.6, st: 0.01 })],
    farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe"], o: [["Anthrazit", "#383e42"], ["Weiß", "#f1f0ea"], ["Holzdekor Golden Oak", "#a3733f"], ["Silber", "#b9bcbe"]] }],
    optionen: [{ k: "antrieb", l: "Antrieb", t: "sel", o: ["mit 2 Handsendern", "mit App-Steuerung"] }, { k: "fenster", l: "Fensterreihe", t: "sel", o: JA, mat: { ja: ["o_fenster"] } }],
    start: function () { return { b: 2.5, h: 2.125, farbe: "Anthrazit", antrieb: "mit App-Steuerung", fenster: "nein" }; },
    skal: function (c) { return [num(c.b) / 2.5, num(c.h) / 2.125, 1]; },
    mass: function (c) { return MM(c.b) + " × " + MM(c.h) + " mm · Sektionaltor"; },
    preis: function (c) { return [pos("Sektionaltor " + MM(c.b) + " × " + MM(c.h) + " mm, " + c.farbe + (c.fenster === "ja" ? ", mit Fensterreihe" : ""), 1, "Stk.", 1490 + num(c.b) * num(c.h) * 160 + (/Holz/.test(c.farbe) ? 390 : 0) + (c.fenster === "ja" ? 290 : 0)), pos("Antrieb " + c.antrieb, 1, "Stk.", /App/.test(c.antrieb) ? 590 : 490), pos("Montage", 1, "Stk.", 690)]; },
    zeichnung: function (c) { return ansicht({ titel: "Sektionaltor · " + c.farbe, b: num(c.b), h: num(c.h), farbe: hex(this.farben[0].o, c.farbe), bText: MM(c.b) + " mm", hText: MM(c.h) + " mm", deko: function (x, y, w, hh) { var g = ""; for (var i = 1; i < 4; i++) g += ln(x, y + i * hh / 4, x + w, y + i * hh / 4, "gw-linie"); if (c.fenster === "ja") for (var j = 0; j < 4; j++) g += rc(x + 10 + j * (w - 20) / 4, y + hh * 0.08, (w - 20) / 4 - 8, hh * 0.1, "gw-glas"); return g; } }); }
  });

  /* ---------- Sonnenschutz ---------- */
  neu("lamellendach", { name: "Lamellendach (Pergola)", gw: "sonnenschutz", kat: "Außen", modell: "lamellendach",
    masse: [F("b", "Breite", { min: 3, max: 7, st: 0.1 }), F("t", "Tiefe", { min: 2.5, max: 5, st: 0.1 }), F("hh", "Höhe", { min: 2.2, max: 3, st: 0.05 })],
    farben: [{ k: "farbe", l: "Gestell und Lamellen", mat: ["Farbe", "Lamellen"], o: ALU }],
    optionen: [{ k: "seiten", l: "Zip-Screens", t: "sel", o: ["keine", "seitlich", "rundum"], mat: { seitlich: ["o_seiten"], rundum: ["o_seiten", "o_front"] } }, { k: "led", l: "LED-Lichtleisten", t: "sel", o: JA, mat: { ja: ["o_led"] } }, { k: "sensor", l: "Regen- und Windsensor", t: "sel", o: JA }],
    start: function () { return { b: 4, t: 3, hh: 2.5, farbe: "Anthrazit RAL 7016", seiten: "seitlich", led: "ja", sensor: "ja" }; },
    skal: function (c) { return [num(c.b) / 4, num(c.hh) / 2.5, num(c.t) / 3]; },
    mass: function (c) { return M(num(c.b)) + " × " + M(num(c.t)) + ", Höhe " + M(num(c.hh)); },
    preis: function (c) { var out = [pos("Lamellendach Aluminium " + M(num(c.b)) + " × " + M(num(c.t)) + ", drehbare Lamellen mit Motor, " + c.farbe, num(c.b) * num(c.t), "m²", 690), pos("Montage inkl. Fundamente", 1, "psch", 1290)]; if (c.seiten !== "keine") out.push(pos("Zip-Screens " + c.seiten, c.seiten === "rundum" ? 2 * num(c.t) + num(c.b) : 2 * num(c.t), "m", 590)); if (c.led === "ja") out.push(pos("LED-Lichtleisten dimmbar", 1, "psch", 690)); if (c.sensor === "ja") out.push(pos("Regen- und Windsensor", 1, "Stk.", 390)); return out; },
    hinweise: function () { return h.hin("Bei Regen schließen die Lamellen automatisch (mit Sensor). Genehmigung je nach Bundesland und Größe vorab klären."); },
    zeichnung: function (c) { return ansicht({ titel: "Lamellendach · " + c.farbe, b: num(c.b), h: num(c.hh), farbe: "none", deko: function (x, y, w, hh) { var fb = hex(ALU, c.farbe), g = rc(x, y, w, 14, "gw-rahmen", ' style="fill:' + fb + '"') + rc(x, y, 10, hh, "gw-rahmen", ' style="fill:' + fb + '"') + rc(x + w - 10, y, 10, hh, "gw-rahmen", ' style="fill:' + fb + '"'); if (c.seiten === "rundum") g += rc(x + 12, y + 16, w - 24, hh - 18, "gw-stoff"); return g; } }); }
  });
  neu("screen", { name: "Senkrechtmarkise (Screen)", gw: "sonnenschutz", kat: "Außen", modell: "screen",
    masse: [F("b", "Breite", { min: 0.8, max: 5, st: 0.05 }), F("hh", "Höhe", { min: 1.2, max: 3.5, st: 0.05 })],
    farben: [{ k: "farbe", l: "Kassette und Schienen", mat: ["Farbe"], o: ALU }, { k: "tuch", l: "Tuch", mat: ["Tuch"], o: [["Grau", "#7f7f7c"], ["Anthrazit", "#4b4e52"], ["Sand", "#cfc2a5"], ["Weiß", "#ecebe6"]] }],
    optionen: [{ k: "antrieb", l: "Antrieb", t: "sel", o: ["Motor (Funk)", "Motor mit App"] }, { k: "zip", l: "Zip-System (windstabil)", t: "sel", o: JA }],
    start: function () { return { b: 2, hh: 2.4, farbe: "Anthrazit RAL 7016", tuch: "Grau", antrieb: "Motor (Funk)", zip: "ja" }; },
    skal: function (c) { return [num(c.b) / 2, num(c.hh) / 2.4, 1]; },
    mass: function (c) { return M(num(c.b)) + " × " + M(num(c.hh)); },
    preis: function (c) { return [pos("Senkrechtmarkise " + (c.zip === "ja" ? "mit Zip-System " : "") + M(num(c.b)) + " × " + M(num(c.hh)) + ", Tuch " + c.tuch + ", " + c.antrieb, 1, "Stk.", 690 + num(c.b) * num(c.hh) * 120 + (c.zip === "ja" ? 290 : 0) + (/App/.test(c.antrieb) ? 110 : 0)), pos("Montage", 1, "Stk.", 190)]; },
    zeichnung: function (c) { var t = hex(this.farben[1].o, c.tuch); return ansicht({ titel: "Screen · Tuch " + c.tuch, b: num(c.b), h: num(c.hh), farbe: t, deko: function (x, y, w) { return rc(x - 4, y - 12, w + 8, 12, "gw-rahmen", ' style="fill:' + hex(ALU, c.farbe) + '"'); } }); }
  });
  neu("rollladen", { name: "Rollladen", gw: "sonnenschutz", kat: "Außen", modell: "rollladen",
    masse: [F("b", "Lichtmaß Breite", { min: 0.5, max: 3, st: 0.01 }), F("hh", "Lichtmaß Höhe", { min: 0.5, max: 2.6, st: 0.01 })],
    farben: [{ k: "farbe", l: "Kasten und Panzer", mat: ["Farbe", "Panzer"], o: [["Weiß", "#f1f0ea"], ["Grau", "#9a9b9c"], ["Anthrazit", "#383e42"]] }],
    optionen: [{ k: "kasten", l: "Kasten", t: "sel", o: ["Vorbau", "Aufsatz"] }, { k: "antrieb", l: "Antrieb", t: "sel", o: ["Gurt", "Motor", "Motor mit App"] }, { k: "insekt", l: "Insektenschutz integriert", t: "sel", o: JA }],
    start: function () { return { b: 1.2, hh: 1.4, farbe: "Anthrazit", kasten: "Vorbau", antrieb: "Motor mit App", insekt: "nein" }; },
    skal: function (c) { return [num(c.b) / 1.2, num(c.hh) / 1.4, 1]; },
    mass: function (c) { return MM(c.b) + " × " + MM(c.hh) + " mm · " + c.kasten + " · " + c.antrieb; },
    preis: function (c) { var m2 = num(c.b) * (num(c.hh) + 0.2); return [pos("Rollladen " + c.kasten + ", Alu-Panzer " + c.farbe + ", " + c.antrieb + ", " + MM(c.b) + " × " + MM(c.hh) + " mm", 1, "Stk.", 260 + 140 * m2 + (c.kasten === "Aufsatz" ? 120 : 0) + (c.antrieb !== "Gurt" ? 240 : 0) + (c.antrieb === "Motor mit App" ? 110 : 0) + (c.insekt === "ja" ? 190 : 0)), pos("Montage", 1, "Stk.", 120)]; },
    zeichnung: function (c) { var fb = hex(this.farben[0].o, c.farbe); return ansicht({ titel: "Rollladen · " + c.kasten + " · " + c.farbe, b: num(c.b), h: num(c.hh), y0: 0.9, farbe: "rgba(160,205,230,.45)", bText: MM(c.b) + " mm", hText: MM(c.hh) + " mm", deko: function (x, y, w, hh) { var g = rc(x - 4, y - 20, w + 8, 20, "gw-rahmen", ' style="fill:' + fb + '"') + rc(x, y, w, hh * 0.5, "gw-panzer", ' style="fill:' + fb + '"'); for (var i = 1; i < hh * 0.5 / 7; i++) g += ln(x, y + i * 7, x + w, y + i * 7, "gw-linie"); return g; } }); }
  });
  neu("sonnensegel", { name: "Sonnensegel", gw: "sonnenschutz", kat: "Außen", modell: "sonnensegel",
    masse: [{ k: "b", l: "Größe", t: "sel", o: [["3", "3 × 3 m"], ["4", "4 × 4 m"], ["5", "5 × 5 m"]] }],
    farben: [{ k: "tuch", l: "Tuch", mat: ["Tuch"], o: [["Sand", "#d9cdb3"], ["Weiß", "#ecebe6"], ["Anthrazit", "#4b4e52"], ["Terracotta", "#c47a55"]] }, { k: "mast", l: "Masten", mat: ["Farbe"], o: [["Edelstahl", "#b9bcbe"], ["Anthrazit", "#383e42"]] }],
    optionen: [{ k: "art", l: "Ausführung", t: "sel", o: ["fest gespannt", "aufrollbar mit Motor"] }],
    start: function () { return { b: "4", tuch: "Sand", mast: "Edelstahl", art: "fest gespannt" }; },
    skal: function (c) { return [num(c.b) / 4, 1, num(c.b) / 4]; },
    mass: function (c) { return c.b + " × " + c.b + " m · " + c.art; },
    preis: function (c) { var b = num(c.b); return [pos("Sonnensegel " + c.b + " × " + c.b + " m, Tuch " + c.tuch + ", " + c.art, 1, "Stk.", 390 + b * b * 45 + (/Motor/.test(c.art) ? 1490 : 0)), pos("Masten " + c.mast + " mit Fundament", 2, "Stk.", 390), pos("Montage und Wandbefestigung", 1, "psch", 390)]; },
    zeichnung: function (c) { var t = hex(this.farben[0].o, c.tuch); return svgBox(360, 250, "Sonnensegel", poly([[60, 60], [300, 80], [280, 190], [80, 170]], "gw-stoff", ' style="fill:' + t + '"') + ln(300, 80, 300, 230, "gw-dachlinie") + ln(280, 190, 280, 230, "gw-dachlinie") + tx(180, 24, "Sonnensegel " + c.b + " × " + c.b + " m · " + esc(c.tuch), "gw-titel")); }
  });

  /* ---------- Garten ---------- */
  neu("carport", { name: "Carport", gw: "garten", kat: "Außen", modell: "carport",
    masse: [sel("b", "Breite", [3, 3.5, 6], "m"), F("l", "Länge", { min: 5, max: 8, st: 0.1 })],
    farben: [{ k: "farbe", l: "Gestell", mat: ["Farbe"], o: ALU.concat([["Holz Lärche", "#a8794c"]]) }],
    optionen: [{ k: "dach", l: "Dach", t: "sel", o: ["Trapezblech", "Gründach", "Polycarbonat"] }, { k: "raum", l: "Geräteraum hinten", t: "sel", o: JA, mat: { ja: ["o_raum"] } }, { k: "seite", l: "Seitenwand", t: "sel", o: JA, mat: { ja: ["o_seite"] } }],
    start: function () { return { b: "3", l: 5.5, farbe: "Anthrazit RAL 7016", dach: "Trapezblech", raum: "ja", seite: "nein" }; },
    skal: function (c) { return [num(c.b) / 3, 1, num(c.l) / 5.5]; },
    mass: function (c) { return M(num(c.b)) + " × " + M(num(c.l)) + " · " + c.dach; },
    preis: function (c) { var f = num(c.b) * num(c.l); return [pos("Carport " + M(num(c.b)) + " × " + M(num(c.l)) + ", Gestell " + c.farbe + ", Dach " + c.dach, f, "m²", 260 + ({ "Gründach": 90, Polycarbonat: 30 }[c.dach] || 0))].concat(c.raum === "ja" ? [pos("Geräteraum hinten, abschließbar", 1, "Stk.", 1890)] : [], c.seite === "ja" ? [pos("Seitenwand", num(c.l), "m", 290)] : [], [pos("Punktfundamente und Montage", 1, "psch", 1390)]); },
    hinweise: function () { return h.hin("Ob ein Carport genehmigungsfrei ist, regelt die Bauordnung des Bundeslands (Größe, Grenzabstand) – vorab bei der Gemeinde klären."); },
    zeichnung: function (c) { var fb = hex(this.farben[0].o, c.farbe); return ansicht({ titel: "Carport · " + c.dach, b: num(c.b), h: 2.5, farbe: "none", deko: function (x, y, w, hh) { return rc(x - 6, y, w + 12, 14, "gw-rahmen", ' style="fill:' + fb + '"') + rc(x, y, 10, hh, "gw-rahmen", ' style="fill:' + fb + '"') + rc(x + w - 10, y, 10, hh, "gw-rahmen", ' style="fill:' + fb + '"') + (c.dach === "Gründach" ? rc(x - 6, y - 6, w + 12, 6, "gw-rasen") : ""); } }); }
  });
  neu("zaun", { name: "Zaun", gw: "garten", kat: "Außen", modell: "zaun",
    masse: [F("lm", "Länge", { min: 2.5, max: 200, st: 0.5 }), sel("hz", "Höhe", [1.03, 1.23, 1.63], "m")],
    farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe"], o: [["Anthrazit RAL 7016", "#383e42"], ["Moosgrün RAL 6005", "#2f4a35"], ["Verzinkt", "#b9bcbe"]] }],
    optionen: [{ k: "sicht", l: "Sichtschutzstreifen", t: "sel", o: JA, mat: { ja: ["o_sicht"] } }, F("tor", "Tore", { min: 0, max: 4, st: 1, e: "" })],
    start: function () { return { lm: 22, hz: "1.23", farbe: "Anthrazit RAL 7016", sicht: "ja", tor: 1 }; },
    skal: function (c) { return [1, num(c.hz) / 1.23, 1]; },
    mass: function (c) { return M(num(c.lm)) + " · Höhe " + CM(num(c.hz)) + " · " + Math.ceil(num(c.lm) / 2.5) + " Felder"; },
    preis: function (c) { return [pos("Doppelstabmattenzaun " + CM(num(c.hz)) + ", " + c.farbe + ", inkl. Pfosten in Beton", num(c.lm), "lfm", { "1.03": 79, "1.23": 89, "1.63": 109 }[c.hz])].concat(c.sicht === "ja" ? [pos("Sichtschutzstreifen", num(c.lm), "lfm", 29)] : [], +c.tor ? [pos("Gartentor einflügelig", +c.tor, "Stk.", 690)] : []); },
    zeichnung: function (c) { var fb = hex(this.farben[0].o, c.farbe); return ansicht({ titel: "Zaun · " + c.farbe, b: 5, h: num(c.hz), farbe: "none", bText: "2 von " + Math.ceil(num(c.lm) / 2.5) + " Feldern", deko: function (x, y, w, hh) { var g = ""; for (var i = 0; i <= 50; i++) g += ln(x + i * w / 50, y, x + i * w / 50, y + hh, "gw-linie", ' style="stroke:' + fb + '"'); [0, 0.5, 1].forEach(function (k) { g += rc(x + k * w - 3, y - 4, 6, hh + 4, "gw-rahmen", ' style="fill:' + fb + '"'); }); if (c.sicht === "ja") for (var j = 0; j < 5; j++) g += rc(x, y + 6 + j * hh / 5.2, w, hh / 7, "gw-rahmen", ' style="fill:' + fb + ';opacity:.75"'); return g; } }); }
  });
  neu("hochbeet", { name: "Hochbeet", gw: "garten", kat: "Außen", modell: "hochbeet",
    masse: [sel("l", "Länge", [1.2, 2.0, 3.0], "m")],
    farben: [{ k: "farbe", l: "Material", mat: ["Farbe"], o: [["Lärche", "#b48a5e"], ["Douglasie", "#a8714a"], ["Cortenstahl", "#8a4b2b"], ["Anthrazit", "#3a3d40"]] }],
    optionen: [{ k: "fuell", l: "Befüllung mit Erde", t: "sel", o: JA }],
    start: function () { return { l: "2", farbe: "Lärche", fuell: "ja" }; },
    skal: function (c) { return [num(c.l) / 2, 1, 1]; },
    mass: function (c) { return CM(num(c.l)) + " × 80 × 80 cm"; },
    preis: function (c) { return [pos("Hochbeet " + CM(num(c.l)) + " × 80 × 80 cm, " + c.farbe, 1, "Stk.", 290 + num(c.l) * (c.farbe === "Cortenstahl" ? 260 : 160))].concat(c.fuell === "ja" ? [pos("Befüllung (Drainage, Kompost, Pflanzerde)", num(c.l) * 0.64, "m³", 120)] : [], [pos("Aufbau", 1, "psch", 120)]); },
    zeichnung: function (c) { return ansicht({ titel: "Hochbeet · " + c.farbe, b: num(c.l), h: 0.8, farbe: hex(this.farben[0].o, c.farbe), deko: function (x, y, w, hh) { var g = ""; for (var i = 1; i < 5; i++) g += ln(x, y + i * hh / 5, x + w, y + i * hh / 5, "gw-linie"); for (var j = 0; j < 6; j++) g += '<circle cx="' + (x + 15 + j * (w - 30) / 5) + '" cy="' + (y - 8) + '" r="9" class="gw-rasen"/>'; return g; } }); }
  });
  neu("gartenhaus", { name: "Gartenhaus", gw: "garten", kat: "Außen", modell: "gartenhaus",
    masse: [{ k: "b", l: "Größe", t: "sel", o: [["2.5", "2,5 × 2,5 m"], ["3", "3 × 3 m"], ["4", "4 × 4 m"]] }],
    farben: [{ k: "farbe", l: "Farbe", mat: ["Farbe"], o: [["Holz natur", "#a8794c"], ["Schwedenrot", "#8f2d24"], ["Anthrazit", "#3a3d40"], ["Weiß", "#f1f0ea"]] }],
    optionen: [{ k: "fund", l: "Fundament (Punkt- oder Plattenfundament)", t: "sel", o: JA }, { k: "boden", l: "Holzboden", t: "sel", o: JA }],
    start: function () { return { b: "3", farbe: "Holz natur", fund: "ja", boden: "ja" }; },
    skal: function (c) { var k = num(c.b) / 3; return [k, 1, k]; },
    mass: function (c) { return c.b + " × " + c.b + " m · Satteldach"; },
    preis: function (c) { var b = num(c.b); return [pos("Gartenhaus " + c.b + " × " + c.b + " m, Satteldach, " + c.farbe, 1, "Stk.", 1490 + b * b * 210)].concat(c.fund === "ja" ? [pos("Fundament", b * b, "m²", 59)] : [], c.boden === "ja" ? [pos("Holzboden", b * b, "m²", 38)] : [], [pos("Aufbau und Dachpappe", 1, "psch", 790)]); },
    zeichnung: function (c) { var fb = hex(this.farben[0].o, c.farbe); return ansicht({ titel: "Gartenhaus " + c.b + " × " + c.b + " m", b: num(c.b), h: 2.1, farbe: fb, deko: function (x, y, w, hh) { return poly([[x - 10, y], [x + w / 2, y - 50], [x + w + 10, y]], "gw-dach") + rc(x + w * 0.38, y + hh * 0.15, w * 0.24, hh * 0.85, "gw-tuer"); } }); }
  });

  /* ---------- Sonnenschutz: Raffstore, Insektenschutz, Plissee ---------- */
  var fensterBild = function (c, titel, deko) { return ansicht({ titel: titel, b: num(c.b), h: num(c.h), y0: 0.9, farbe: "rgba(160,205,230,.45)", bText: MM(c.b) + " mm", hText: MM(c.h) + " mm", deko: deko }); };
  neu("raffstore", { name: "Raffstore", gw: "sonnenschutz", kat: "Außen", modell: "raffstore",
    masse: [F("b", "Breite", { min: 0.6, max: 4, st: 0.01 }), F("h", "Höhe", { min: 0.6, max: 3.2, st: 0.01 })],
    farben: [{ k: "farbe", l: "Lamellen und Blende", mat: ["Farbe", "Lamellen"], o: [["Anthrazit", "#383e42"], ["Weißaluminium", "#a5a8a6"], ["Grau", "#7d8084"], ["Bronze", "#6b5b48"]] }],
    optionen: [{ k: "lamelle", l: "Lamelle", t: "sel", o: ["80 mm gebördelt", "90 mm Flachlamelle", "Z-Lamelle 90 mm (dunkelt besser ab)"] }, { k: "antrieb", l: "Antrieb", t: "sel", o: ["Motor (Funk)", "Motor mit App", "Motor mit Sonnenautomatik"] }, { k: "einbau", l: "Einbau", t: "sel", o: ["Vorbau mit Blende", "Unterputz (Neubau oder Sanierung)"] }],
    start: function () { return { b: 1.2, h: 1.4, farbe: "Anthrazit", lamelle: "80 mm gebördelt", antrieb: "Motor mit App", einbau: "Vorbau mit Blende" }; },
    skal: function (c) { return [num(c.b) / 1.2, num(c.h) / 1.4, 1]; },
    mass: function (c) { return MM(c.b) + " × " + MM(c.h) + " mm · " + c.lamelle; },
    preis: function (c) { var m2 = num(c.b) * num(c.h); return [pos("Raffstore " + c.lamelle + ", " + c.farbe + ", " + c.antrieb + ", " + c.einbau + ", " + MM(c.b) + " × " + MM(c.h) + " mm", 1, "Stk.", (480 + 360 * m2) * (/^Z/.test(c.lamelle) ? 1.1 : 1) + ({ "Motor mit App": 110, "Motor mit Sonnenautomatik": 290 }[c.antrieb] || 0) + (/Unterputz/.test(c.einbau) ? 190 : 0)), pos("Montage Raffstore", 1, "Stk.", 190)]; },
    hinweise: function () { return h.hin("Raffstores lenken das Licht: Lamellen schräg stellen, dann bleibt es hell, aber die Sonne bleibt draußen."); },
    zeichnung: function (c) { var fb = hex(this.farben[0].o, c.farbe); return fensterBild(c, "Raffstore · " + c.farbe, function (x, y, w, hh) { var g = rc(x - 4, y - 16, w + 8, 16, "gw-rahmen", ' style="fill:' + fb + '"'); for (var i = 0; i < hh * 0.55 / 7; i++) g += rc(x, y + i * 7, w, 4, "gw-lamelle", ' style="fill:' + fb + '"'); return g; }); }
  });
  neu("insektenschutz", { name: "Insektenschutz (Fliegengitter)", gw: "sonnenschutz", kat: "Außen", modell: "insektenschutz",
    masse: [F("b", "Breite", { min: 0.4, max: 3.5, st: 0.01 }), F("h", "Höhe", { min: 0.4, max: 2.6, st: 0.01 })],
    farben: [{ k: "farbe", l: "Rahmen", mat: ["o_fenster_r", "o_tuer_r", "o_rollo_r"], o: [["Weiß", "#f1f0ea"], ["Anthrazit", "#383e42"], ["Braun", "#5b4636"], ["Silber", "#b9bcbe"]] }],
    optionen: [{ k: "typ", l: "Art", t: "sel", o: ["Spannrahmen (Fenster)", "Rollo (Fenster)", "Pendeltür (Terrassentür)", "Schiebeanlage (große Türen)"], mat: { "Spannrahmen (Fenster)": ["o_fenster_r", "o_fenster_netz"], "Rollo (Fenster)": ["o_fenster_r", "o_fenster_netz", "o_rollo_r"], "Pendeltür (Terrassentür)": ["o_tuer_r", "o_tuer_netz"], "Schiebeanlage (große Türen)": ["o_tuer_r", "o_tuer_netz"] } },
      { k: "netz", l: "Gewebe", t: "sel", o: ["Standardgewebe", "Pollenschutz", "Haustierschutz (reißfest)", "Transparent (bessere Durchsicht)"] }],
    start: function () { return { b: 1.2, h: 1.4, farbe: "Weiß", typ: "Spannrahmen (Fenster)", netz: "Standardgewebe" }; },
    skal: function (c) { return /Tür/.test(c.typ) ? [num(c.b) / 1.0, num(c.h) / 2.1, 1] : [num(c.b) / 1.2, num(c.h) / 1.4, 1]; },
    mass: function (c) { return MM(c.b) + " × " + MM(c.h) + " mm · " + c.typ; },
    preis: function (c) { var m2 = num(c.b) * num(c.h), basis = { "Spannrahmen (Fenster)": [89, 60, 39], "Rollo (Fenster)": [190, 90, 89], "Pendeltür (Terrassentür)": [290, 80, 89], "Schiebeanlage (große Türen)": [490, 90, 129] }[c.typ], f = { Pollenschutz: 1.4, "Haustierschutz (reißfest)": 1.3, "Transparent (bessere Durchsicht)": 1.15 }[c.netz] || 1; return [pos("Insektenschutz " + c.typ + ", " + c.netz + ", Rahmen " + c.farbe + ", " + MM(c.b) + " × " + MM(c.h) + " mm", 1, "Stk.", (basis[0] + basis[1] * m2) * f), pos("Aufmaß und Montage", 1, "Stk.", basis[2])]; },
    hinweise: function (c) { return /Spannrahmen/.test(c.typ) ? h.hin("Der Spannrahmen wird ohne Bohren eingehängt – passt auch in Mietwohnungen.") : ""; },
    zeichnung: function (c) { var fb = hex(this.farben[0].o, c.farbe), tuer = /Tür/.test(c.typ); return ansicht({ titel: c.typ + " · " + c.netz, b: num(c.b), h: num(c.h), y0: tuer ? 0 : 0.9, farbe: "rgba(60,64,70,.35)", bText: MM(c.b) + " mm", hText: MM(c.h) + " mm", deko: function (x, y, w, hh) { var g = rc(x, y, w, 6, "gw-rahmen") + rc(x, y + hh - 6, w, 6, "gw-rahmen") + rc(x, y, 6, hh, "gw-rahmen") + rc(x + w - 6, y, 6, hh, "gw-rahmen"); if (/Rollo/.test(c.typ)) g += rc(x - 3, y - 12, w + 6, 12, "gw-rahmen"); if (tuer) g += rc(x, y + hh * 0.48, w, 5, "gw-rahmen"); for (var i = 8; i < w - 8; i += 6) g += ln(x + i, y + 6, x + i, y + hh - 6, "gw-linie", ' style="opacity:.35"'); return g.replace(/gw-rahmen"/g, 'gw-rahmen" style="fill:' + fb + '"'); } }); }
  });
  neu("plissee", { name: "Plissee", gw: "sonnenschutz", kat: "Wohnen", modell: "plissee",
    masse: [F("b", "Breite (Glas)", { min: 0.3, max: 2.5, st: 0.01 }), F("h", "Höhe (Glas)", { min: 0.3, max: 2.5, st: 0.01 })],
    farben: [{ k: "stoff", l: "Stoff", mat: ["Tuch", "o_unten"], o: [["Creme", "#e8dfcc"], ["Weiß", "#f3f2ee"], ["Hellgrau", "#c9cac7"], ["Taupe", "#a39889"], ["Taubenblau", "#8fa2b8"], ["Anthrazit", "#4b4e52"]] }, { k: "profil", l: "Profile", mat: ["Farbe"], o: [["Weiß", "#f1f0ea"], ["Silber", "#b9bcbe"], ["Anthrazit", "#383e42"]] }],
    optionen: [{ k: "stoffart", l: "Stoff", t: "sel", o: ["lichtdurchlässig", "Verdunkelung", "Wabenplissee (dämmt)", "Tag und Nacht (zwei Stoffe)"], mat: { "Tag und Nacht (zwei Stoffe)": ["o_unten"] } }, { k: "montage", l: "Befestigung", t: "sel", o: ["Glasleiste (ohne Bohren)", "Fensterflügel", "Nische"] }, { k: "bed", l: "Bedienung", t: "sel", o: ["Griff", "elektrisch (Akku)"] }],
    start: function () { return { b: 1.06, h: 1.26, stoff: "Creme", profil: "Weiß", stoffart: "lichtdurchlässig", montage: "Glasleiste (ohne Bohren)", bed: "Griff" }; },
    skal: function (c) { return [num(c.b) / 1.06, num(c.h) / 1.26, 1]; },
    mass: function (c) { return MM(c.b) + " × " + MM(c.h) + " mm · " + c.stoffart; },
    preis: function (c) { var m2 = num(c.b) * num(c.h); return [pos("Plissee " + c.stoffart + ", Stoff " + c.stoff + ", Profile " + c.profil + ", " + c.montage + ", " + MM(c.b) + " × " + MM(c.h) + " mm", 1, "Stk.", (120 + 140 * m2) * ({ Verdunkelung: 1.2, "Wabenplissee (dämmt)": 1.45, "Tag und Nacht (zwei Stoffe)": 1.6 }[c.stoffart] || 1) + (/elektrisch/.test(c.bed) ? 290 : 0)), pos("Aufmaß und Montage", 1, "Stk.", 39)]; },
    hinweise: function (c) { return /Glasleiste/.test(c.montage) ? h.hin("An der Glasleiste wird ohne Bohren befestigt – der Fensterrahmen bleibt unversehrt.") : ""; },
    zeichnung: function (c) { var st = hex(this.farben[0].o, c.stoff), pr = hex(this.farben[1].o, c.profil); return fensterBild(c, "Plissee · " + c.stoff + " · " + c.stoffart, function (x, y, w, hh) { var g = rc(x, y, w, 5, "gw-rahmen", ' style="fill:' + pr + '"'), unten = hh * 0.62; for (var i = 5; i < unten; i += 5) g += rc(x, y + i, w, 5, "gw-stoff", ' style="fill:' + st + ";opacity:" + (i % 10 ? 0.92 : 0.78) + '"'); g += rc(x, y + unten, w, 4, "gw-rahmen", ' style="fill:' + pr + '"'); return g; }); }
  });

  /* Wandprodukte erscheinen in der AR-Ansicht direkt an der Wand */
  ["raffstore", "rollladen", "insektenschutz", "plissee", "fenster", "schiebetuer", "garagentor", "haustuer", "innentuer", "markise", "screen", "wallbox", "klimageraet", "gastherme", "zaehlerschrank", "handtuchheizkoerper", "heizkoerper", "wandgestaltung"].forEach(function (k) { if (P[k]) P[k].platzierung = "wall"; });
  /* Unterkategorien für den Katalog */
  var UK = { dusche: "Dusche & Wanne", badewanne: "Dusche & Wanne", wc: "WC & Waschtisch", waschtisch: "WC & Waschtisch", handtuchheizkoerper: "Heizkörper", heizkoerper: "Heizkörper",
    waermepumpe: "Wärmepumpe & Kessel", gastherme: "Wärmepumpe & Kessel", pufferspeicher: "Speicher", klimageraet: "Klima & Kaminofen", kaminofen: "Klima & Kaminofen",
    zaehlerschrank: "Installation", schalter: "Installation", wallbox: "E-Mobilität", stromspeicher: "Solar & Speicher", balkonkraftwerk: "Solar & Speicher",
    wandgestaltung: "Wände & Farbe", fliese: "Böden & Fliesen", bodenbelag: "Böden & Fliesen", trennwand: "Wände & Farbe", einbauschrank: "Möbel & Küche", kueche: "Möbel & Küche", treppe: "Treppen & Innentüren", innentuer: "Treppen & Innentüren",
    dachfenster: "Dach", fenster: "Fenster", schiebetuer: "Türen & Tore", haustuer: "Türen & Tore", garagentor: "Türen & Tore",
    markise: "Markisen", screen: "Markisen", rollladen: "Rollläden & Raffstores", raffstore: "Rollläden & Raffstores", insektenschutz: "Insektenschutz", plissee: "Innenbeschattung",
    terrassendach: "Terrassendach & Pergola", lamellendach: "Terrassendach & Pergola", sonnensegel: "Terrassendach & Pergola",
    carport: "Carport & Gartenhaus", gartenhaus: "Carport & Gartenhaus", zaun: "Zaun & Beete", hochbeet: "Zaun & Beete", pflaster: "Pflaster & Platten" };
  Object.keys(UK).forEach(function (k) { if (P[k]) P[k].uk = UK[k]; });

  /* Kategorien der ersten Produkte */
  var KAT = { terrassendach: "Außen", markise: "Außen", dusche: "Bad", waschtisch: "Bad", heizkoerper: "Wärme", waermepumpe: "Wärme", klimageraet: "Wärme", kaminofen: "Wärme", wallbox: "Strom", stromspeicher: "Strom", haustuer: "Außen" };
  Object.keys(KAT).forEach(function (k) { if (P[k]) P[k].kat = KAT[k]; });
})();

/* =====================================================================
   4. AUFMASS JE GEWERK
   Jede Konfiguration: posten (Name eines Eintrags), arten (optional),
   felder(p), oeff (Türen/Fenster abziehen), einst (Einstellungen),
   start(), neu(art), ansichten(p), bild(id, p, A, H), ergebnis(A),
   positionen(A), scan, produkte(p) → Konfigurator-Produkte zum Eintrag.
   A = { posten: [...], e: {...} }, H = Zeichenhilfen aus demo.js
   ===================================================================== */
(function () {
  "use strict";
  var GW = window.GW, h = GW.h, Z = h.Z, Z0 = h.Z0, Z1 = h.Z1, M = h.M, CM = h.CM, MM = h.MM, esc = h.esc, pos = h.pos, tab = h.tab, mat = h.mat, sum = h.sum, num = h.num, auf = h.auf, rad = h.rad;
  var rc = h.rc, ln = h.ln, tx = h.tx, pf = h.pf, poly = h.poly, svgBox = h.svgBox, F = h.F, RAUM = h.RAUM, JA = h.JA, geo = h.geo, einfuegen = h.einfuegen, raumFl = h.raumFl;
  var P = GW.PRODUKTE, A = GW.AUFMASS;
  var kopie = function (o) { return JSON.parse(JSON.stringify(o)); };
  var tuer = function (b) { return { art: "Tür", b: b || 0.8, h: 2.0 }; }, fen = function (b, hh) { return { art: "Fenster", b: b || 1.0, h: hh || 1.2 }; };
  var ANS_RAUM = [["grundriss", "Grundriss"], ["3d", "3D"], ["foto", "Foto mit Maßen"]];

  /* ---------- Sanitär & Bad ---------- */
  function badObjekte(r, G) {   // Objekte im Grundriss: Dusche oben links, Waschtisch oben, WC links, Wanne rechts
    var s = G.s, X = function (m) { return G.x0 + m * s; }, Y = function (m) { return G.y0 + m * s; }, g = "";
    var kd = r.kd || P.dusche.start(), db = Math.min(num(kd.b), r.l * 0.5), dt = Math.min(num(kd.t), r.b * 0.45);
    if (r.dusche !== "keine") {
      g += h.rc(X(0), Y(0), db * s, dt * s, "gw-objekt gw-klick", ' data-gw-produkt="dusche"');
      if (r.dusche === "bodengleich") g += h.ln(X(0), Y(dt), X(db * 0.66), Y(dt), "gw-glaslinie") + h.rc(X(0.06), Y(0.04), (db - 0.12) * s, 4, "gw-rahmen");
      else g += h.ln(X(0.05), Y(0.05), X(db - 0.05), Y(dt - 0.05), "gw-linie") + h.ln(X(db - 0.05), Y(0.05), X(0.05), Y(dt - 0.05), "gw-linie");
      g += tx(X(db / 2), Y(dt / 2), "Dusche") + tx(X(db / 2), Y(dt / 2) + 12, CM(num(kd.b)) + " × " + CM(num(kd.t)));
    }
    var kw = r.kw || P.waschtisch.start(), wb = Math.min(num(kw.b), 1.2), wx = r.dusche !== "keine" ? db + 0.25 : 0.3;
    for (var i = 0; i < (+r.wt || 0); i++) { if (wx + wb > r.l - 0.1) break; g += h.rc(X(wx), Y(0), wb * s, 0.48 * s, "gw-objekt gw-klick", ' data-gw-produkt="waschtisch"') + '<ellipse cx="' + (X(wx + wb / 2)) + '" cy="' + Y(0.24) + '" rx="' + (wb * s * 0.3) + '" ry="' + (0.13 * s) + '" class="gw-linie"/>' + tx(X(wx + wb / 2), Y(0.62), "WT " + CM(wb)); wx += wb + 0.2; }
    var wy = r.dusche !== "keine" ? dt + 0.35 : 0.4;
    for (var j = 0; j < (+r.wc || 0); j++) { if (wy + 0.4 > r.b - 0.1) break; g += h.rc(X(0), Y(wy), 0.2 * s, 0.4 * s, "gw-objekt") + '<ellipse cx="' + X(0.42) + '" cy="' + Y(wy + 0.2) + '" rx="' + (0.24 * s) + '" ry="' + (0.18 * s) + '" class="gw-objekt"/>' + tx(X(0.42), Y(wy + 0.62), "WC"); wy += 0.9; }
    if (r.wanne === "ja" && r.b >= 1.75 && r.l >= 1.6) g += h.rc(X(r.l - 0.75), Y(r.b - 1.75), 0.75 * s, 1.7 * s, "gw-objekt") + h.rc(X(r.l - 0.68), Y(r.b - 1.68), 0.61 * s, 1.56 * s, "gw-linie", ' rx="10"') + tx(X(r.l - 0.375), Y(r.b - 0.9), "Wanne");
    return g;
  }
  function badWand(r) {
    var f = raumFl(r), spritz = (r.dusche !== "keine" ? 2 * num((r.kd || {}).t || 0.9) * 2.0 + num((r.kd || {}).b || 0.9) * 2.0 * 0.5 : 0) + (r.wanne === "ja" ? (1.7 + 0.75) * 0.6 : 0) + (+r.wt || 0) * 0.36;
    if (r.fh === "raumhoch") return f.wand;
    if (r.fh === "1,20 m hoch") return Math.max(0, 2 * (r.l + r.b) * 1.2 - sum((r.ab || []).filter(function (x) { return x.art === "Tür"; }), function (x) { return x.b * 1.2; }));
    return spritz;
  }
  A.shk = { titel: "Bad aufmessen", posten: "Raum", oeff: true,
    felder: function () { return RAUM.concat([{ k: "dusche", l: "Dusche", t: "sel", o: ["bodengleich", "Duschwanne", "keine"] }, { k: "wanne", l: "Badewanne", t: "sel", o: JA }, F("wc", "WC", { min: 0, max: 3, st: 1, e: "" }), F("wt", "Waschtische", { min: 0, max: 3, st: 1, e: "" }), { k: "fh", l: "Wandfliesen", t: "sel", o: ["raumhoch", "1,20 m hoch", "nur Spritzbereich"] }]); },
    einst: [F("v", "Verschnitt Fliesen", { min: 0, max: 30, st: 1, e: "%" })],
    start: function () { return { e: { v: 10 }, posten: [{ name: "Bad", l: 2.8, b: 2.9, h: 2.5, ab: [tuer(0.8), fen(0.9, 1.0)], dusche: "bodengleich", wanne: "nein", wc: 1, wt: 1, fh: "raumhoch", kd: P.dusche.start(), kw: P.waschtisch.start() }, { name: "Gäste-WC", l: 1.2, b: 1.6, h: 2.5, ab: [tuer(0.7)], dusche: "keine", wanne: "nein", wc: 1, wt: 1, fh: "1,20 m hoch", kw: { b: "0.6", front: "Weiß Hochglanz", spiegel: "Spiegel mit LED", becken: "Einzelbecken" } }] }; },
    neu: function () { return { name: "Raum", l: 2.4, b: 2.0, h: 2.5, ab: [tuer(0.8)], dusche: "keine", wanne: "nein", wc: 1, wt: 1, fh: "1,20 m hoch" }; },
    ansichten: function () { return ANS_RAUM; },
    bild: function (id, p, A_, H) { if (id === "3d") return H.iso(p); if (id === "foto") return H.foto(p); return einfuegen(H.grund(p), badObjekte(p, geo(p))); },
    produkte: function (p) { return (p.dusche === "bodengleich" ? ["dusche"] : []).concat(+p.wt ? ["waschtisch"] : []); },
    ergebnis: function (A_) {
      var v = (A_.e.v || 0) / 100, zeilen = A_.posten.map(function (r) { var f = raumFl(r); return [esc(r.name), Z(f.boden) + " m²", Z(badWand(r)) + " m²", [r.dusche !== "keine" ? "Dusche" : "", r.wanne === "ja" ? "Wanne" : "", r.wc ? r.wc + "× WC" : "", r.wt ? r.wt + "× WT" : ""].filter(Boolean).join(", ")]; });
      var b = sum(A_.posten, function (r) { return raumFl(r).boden; }), w = sum(A_.posten, badWand);
      return tab(["Raum", "Boden", "Wandfliesen", "Objekte"], zeilen, ["Gesamt", Z(b) + " m²", Z(w) + " m²", ""]) + mat("Material", ["Fliesen Boden " + Z(b * (1 + v)) + " m², Wand " + Z(w * (1 + v)) + " m² (inkl. " + Math.round(v * 100) + " % Verschnitt)", "Abdichtung Nassbereich ca. " + Z(this._abd(A_)) + " m²", "Fliesenkleber ca. " + auf((b + w) * 4.5 / 25) + " Sack à 25 kg"]);
    },
    _abd: function (A_) { return sum(A_.posten, function (r) { return (r.dusche !== "keine" ? 2 * 0.9 * 2.0 + num((r.kd || {}).b || 0.9) * 1.0 + (r.dusche === "bodengleich" ? raumFl(r).boden : 0) : 0) + (r.wanne === "ja" ? 1.5 : 0); }); },
    positionen: function (A_) {
      var v = (A_.e.v || 0) / 100, out = [], b = sum(A_.posten, function (r) { return raumFl(r).boden; }), w = sum(A_.posten, badWand);
      out.push(pos("Rückbau und Entsorgung Bestand (" + A_.posten.map(function (r) { return r.name; }).join(", ") + ")", 1, "psch", sum(A_.posten, function (r) { return raumFl(r).boden > 4 ? 1450 : 690; })));
      out.push(pos("Sanitärinstallation Vor- und Abwasser", 1, "psch", sum(A_.posten, function (r) { return 450 + ((+r.wc || 0) + (+r.wt || 0) + (r.dusche !== "keine" ? 1 : 0) + (r.wanne === "ja" ? 1 : 0)) * 390; })));
      A_.posten.forEach(function (r) {
        if (r.dusche === "bodengleich") out = out.concat(P.dusche.preis(r.kd || P.dusche.start()));
        if (r.dusche === "Duschwanne") out.push(pos("Duschwanne mit Glasabtrennung (" + r.name + ")", 1, "Stk.", 1490));
        if (r.wanne === "ja") out.push(pos("Badewanne mit Wannenträger und Armatur (" + r.name + ")", 1, "Stk.", 1380));
        if (+r.wc) out.push(pos("Wand-WC mit Vorwandelement und Betätigungsplatte (" + r.name + ")", +r.wc, "Stk.", 1290));
        for (var i = 0; i < (+r.wt || 0); i++) out = out.concat(P.waschtisch.preis(r.kw || P.waschtisch.start()));
      });
      out.push(pos("Abdichtung Nassbereich", this._abd(A_), "m²", 48));
      out.push(pos("Bodenfliesen liefern und verlegen (+" + Math.round(v * 100) + " % Verschnitt)", b * (1 + v), "m²", 112));
      out.push(pos("Wandfliesen liefern und verlegen (+" + Math.round(v * 100) + " % Verschnitt)", w * (1 + v), "m²", 105));
      return out;
    },
    scan: { label: "Raum scannen", text: "Raum wird gescannt … Handy langsam drehen" }
  };

  /* ---------- Heizung, Wärmepumpe & Klima ---------- */
  var WPM2 = { "unsaniert (vor 1978)": 100, "teilsaniert": 70, "saniert / Neubau": 45 };
  function heizlast(A_) { return sum(A_.posten, function (r) { return num(r.fl) * WPM2[r.zustand]; }); }
  function wpGroesse(A_) { var kw = heizlast(A_) / 1000 + 0.8; return [6, 8, 10, 12, 14, 16].filter(function (x) { return x >= kw; })[0] || 16; }
  A.heizung = { titel: "Heizung planen", posten: "Raum",
    felder: function () { return [{ k: "name", l: "Raum", t: "txt" }, F("fl", "Fläche", { min: 2, max: 200, st: 0.5, e: "m²" }), { k: "zustand", l: "Zustand", t: "sel", o: Object.keys(WPM2) }, F("hk", "Heizkörper heute", { min: 0, max: 8, st: 1, e: "" }), { k: "klima", l: "Klimagerät", t: "sel", o: JA }]; },
    einst: [{ k: "alt", l: "Heizung heute", t: "sel", o: ["Gas", "Öl", "Nachtspeicher", "keine"] }, F("ab", "Abstand Außengerät zur Grenze", { min: 0.5, max: 30, st: 0.1 }), { k: "kamin", l: "Kaminofen dazu", t: "sel", o: JA }],
    start: function () { return { e: { alt: "Öl", ab: 3.5, kamin: "ja", kwp: P.waermepumpe.start(), kk: P.kaminofen.start() }, posten: [
      { name: "Wohnzimmer", fl: 32, zustand: "teilsaniert", hk: 2, klima: "nein" }, { name: "Küche", fl: 14, zustand: "teilsaniert", hk: 1, klima: "nein" },
      { name: "Schlafzimmer", fl: 16, zustand: "teilsaniert", hk: 1, klima: "ja", kk: P.klimageraet.start() }, { name: "Kinderzimmer", fl: 13, zustand: "unsaniert (vor 1978)", hk: 1, klima: "nein" },
      { name: "Bad", fl: 9, zustand: "teilsaniert", hk: 1, klima: "nein" }, { name: "Arbeitszimmer", fl: 12, zustand: "unsaniert (vor 1978)", hk: 1, klima: "nein" }, { name: "Flur", fl: 11, zustand: "teilsaniert", hk: 1, klima: "nein" }] }; },
    neu: function () { return { name: "Raum", fl: 12, zustand: "teilsaniert", hk: 1, klima: "nein" }; },
    ansichten: function () { return [["last", "Wärmebedarf je Raum"], ["aufstellung", "Aufstellort"], ["heizkoerper", "Heizkörper"]]; },
    produkte: function (p) { return ["waermepumpe", "heizkoerper"].concat(p.klima === "ja" ? ["klimageraet"] : []).concat(["kaminofen"]); },
    bild: function (id, p, A_) {
      if (id === "aufstellung") {
        var kwp = A_.e.kwp || P.waermepumpe.start(), f = P.waermepumpe.skal(kwp)[0], ab = num(A_.e.ab), s = 22, g = "";
        g += rc(20, 20, 320, 220, "gw-rasen") + ln(20, 236, 340, 236, "gw-grenze") + tx(180, 252, "Grundstücksgrenze");
        g += rc(60, 40, 170, 110, "gw-haus") + tx(145, 98, "Wohnhaus", "gw-titel");
        var wy = 150 + 4, wx = 120, ww = 1.1 * f * s, wh = 0.5 * f * s;
        g += rc(wx, wy, ww, wh, "gw-objekt gw-klick", ' data-gw-produkt="waermepumpe"') + tx(wx + ww + 8, wy + wh - 2, "Wärmepumpe " + kwp.kw + " kW", "am-klein", "start");
        var gy = 236, ay = wy + wh; g += pf(wx + ww / 2, ay, wx + ww / 2, gy, M(ab), true, 8);
        if (A_.posten.some(function (r) { return r.klima === "ja"; })) g += rc(232, 70, 12, 22, "gw-objekt") + tx(276, 84, "Klima außen", "am-klein");
        if (A_.e.kamin === "ja") g += rc(70, 46, 18, 18, "gw-glut") + tx(110, 59, "Kaminofen", "am-klein");
        return svgBox(360, 260, "Aufstellort Wärmepumpe", g);
      }
      if (id === "heizkoerper") {
        var g2 = "", y = 30, vl = 55;
        A_.posten.forEach(function (r) { var bedarf = num(r.fl) * WPM2[r.zustand], hkw = (+r.hk || 1) * 900, okk = hkw >= bedarf; g2 += tx(14, y + 12, esc(r.name), "am-klein", "start") + rc(120, y, Math.min(200, hkw / 20), 8, okk ? "gw-balken-ok" : "gw-balken-warn") + rc(120, y + 9, Math.min(200, bedarf / 20), 5, "gw-balken") + tx(330, y + 12, okk ? "passt" : "größer", okk ? "gw-ok-t" : "gw-warn-t", "end"); y += 30; });
        return svgBox(360, Math.max(140, y + 20), "Heizkörper bei " + vl + " °C", g2 + tx(180, 16, "Heizkörper-Leistung bei 55 °C (oben) und Bedarf (unten), Richtwert", "am-klein"));
      }
      var max = Math.max.apply(null, A_.posten.map(function (r) { return num(r.fl) * WPM2[r.zustand]; }).concat([1])), g3 = "", yy = 28;
      A_.posten.forEach(function (r) { var w = num(r.fl) * WPM2[r.zustand]; g3 += tx(14, yy + 12, esc(r.name), "am-klein", "start") + rc(120, yy, 190 * w / max, 14, r === p ? "gw-balken-aktiv" : "gw-balken") + tx(320, yy + 12, Z0(w) + " W", "am-klein", "start"); yy += 26; });
      return svgBox(360, Math.max(140, yy + 30), "Wärmebedarf je Raum", g3 + tx(180, yy + 18, "Summe " + Z1(heizlast(A_) / 1000) + " kW + Warmwasser 0,8 kW → Vorschlag " + wpGroesse(A_) + " kW", "gw-titel"));
    },
    ergebnis: function (A_) {
      var hl = heizlast(A_), kw = wpGroesse(A_), ab = num(A_.e.ab), alt = A_.posten.filter(function (r) { return r.zustand === "unsaniert (vor 1978)"; }).length;
      return tab(["Raum", "Fläche", "Zustand", "Richtwert", "Heizkörper"], A_.posten.map(function (r) { return [esc(r.name), Z1(num(r.fl)) + " m²", esc(r.zustand), Z0(num(r.fl) * WPM2[r.zustand]) + " W", (+r.hk || 0) + ""]; }),
        ["Gesamt", Z1(sum(A_.posten, function (r) { return num(r.fl); })) + " m²", "", Z1(hl / 1000) + " kW", sum(A_.posten, function (r) { return +r.hk || 0; }) + ""]) +
        '<div class="gw-kacheln"><div><b>' + kw + ' kW</b><span>Wärmepumpe (Vorschlag)</span></div><div><b>' + Z1(hl / 1000) + ' kW</b><span>Heizlast Richtwert</span></div><div><b>' + M(ab) + "</b><span>Abstand zur Grenze</span></div></div>" +
        (ab < 3 ? h.warn("Abstand unter 3 m: Schall mit dem Schallrechner des Herstellers prüfen (TA Lärm, Nachbarschaft).") : h.ok("Abstand " + M(ab) + " – Schall trotzdem mit dem Herstellerrechner prüfen.")) +
        (alt ? h.warn(alt + " Räume unsaniert: Für niedrige Vorlauftemperatur meist größere Heizkörper nötig.") : "") +
        h.hin("Richtwerte fürs Erstgespräch. Für Auslegung und Förderung ist eine Heizlastberechnung nach DIN EN 12831 und der hydraulische Abgleich nötig.");
    },
    positionen: function (A_) {
      var kwp = A_.e.kwp || P.waermepumpe.start(), out = [];
      if (A_.e.alt !== "keine") out.push(pos("Demontage und Entsorgung Altanlage (" + A_.e.alt + (A_.e.alt === "Öl" ? ", inkl. Tankreinigung" : "") + ")", 1, "psch", A_.e.alt === "Öl" ? 1950 : 890));
      out = out.concat(P.waermepumpe.preis(kwp));
      out.push(pos("Pufferspeicher und Warmwasserspeicher 300 l", 1, "Stk.", 2650), pos("Montage und hydraulischer Anschluss", 1, "psch", 3400), pos("Elektroanschluss Wärmepumpe (Elektrofachbetrieb)", 1, "psch", 950), pos("Heizlastberechnung und hydraulischer Abgleich", 1, "psch", 890));
      var tausch = A_.posten.filter(function (r) { return r.zustand === "unsaniert (vor 1978)"; }).length;
      if (tausch) out.push(pos("Heizkörper gegen größere tauschen (Niedertemperatur)", tausch, "Stk.", 720, true));
      A_.posten.filter(function (r) { return r.klima === "ja"; }).forEach(function (r) { out = out.concat(P.klimageraet.preis(r.kk || P.klimageraet.start()).map(function (x) { x.text += " (" + r.name + ")"; return x; })); });
      if (A_.e.kamin === "ja") out = out.concat(P.kaminofen.preis(A_.e.kk || P.kaminofen.start()).map(function (x) { x.optional = true; return x; }));
      out.push(pos("Inbetriebnahme und Einweisung", 1, "psch", 390));
      return out;
    }
  };
  /* Für den Konfigurator: Wärmepumpe, Kaminofen hängen an den Einstellungen, Klima am Raum */
  A.heizung.ziel = { waermepumpe: "e.kwp", kaminofen: "e.kk", klimageraet: "p.kk", heizkoerper: "p.khk" };

  /* ---------- Elektro ---------- */
  var TYPEN = { Wohnzimmer: [[5, 7, 10], [1, 2, 3], [0, 1, 2]], "Küche": [[6, 8, 10], [2, 3, 4], [0, 0, 1]], Schlafzimmer: [[4, 6, 8], [1, 2, 2], [0, 1, 1]], Kinderzimmer: [[4, 6, 8], [1, 1, 2], [0, 1, 1]], Bad: [[2, 3, 4], [2, 2, 3], [0, 0, 0]], Flur: [[1, 2, 3], [1, 2, 3], [0, 0, 1]], "Büro": [[5, 7, 10], [1, 2, 2], [1, 2, 3]], "Keller / Technik": [[2, 3, 4], [1, 1, 2], [0, 1, 1]] };
  var stufe = function (A_) { return (parseInt(A_.e.stufe, 10) || 2) - 1; };
  A.elektro = { titel: "Elektro aufnehmen", posten: "Raum",
    felder: function () { return [{ k: "name", l: "Raum", t: "txt" }, { k: "typ", l: "Raumart", t: "sel", o: Object.keys(TYPEN) }, F("sd", "Steckdosen", { min: 0, max: 30, st: 1, e: "" }), F("sch", "Schalter", { min: 0, max: 12, st: 1, e: "" }), F("li", "Lichtauslässe", { min: 0, max: 12, st: 1, e: "" }), F("nw", "Netzwerkdosen", { min: 0, max: 8, st: 1, e: "" })]; },
    einst: [{ k: "stufe", l: "Ausstattung", t: "sel", o: [["1", "1 – einfach"], ["2", "2 – Standard"], ["3", "3 – Komfort"]] }, { k: "zs", l: "Zählerschrank", t: "sel", o: ["passt", "erneuern"] }, { k: "wb", l: "Wallbox", t: "sel", o: JA }, { k: "sh", l: "Smart Home (Licht, Rollläden)", t: "sel", o: JA }],
    start: function () { return { e: { stufe: "2", zs: "erneuern", wb: "ja", sh: "nein", kwb: P.wallbox.start() }, posten: [
      { name: "Wohnzimmer", typ: "Wohnzimmer", sd: 6, sch: 2, li: 2, nw: 1 }, { name: "Küche", typ: "Küche", sd: 6, sch: 2, li: 2, nw: 0 }, { name: "Schlafzimmer", typ: "Schlafzimmer", sd: 5, sch: 2, li: 1, nw: 0 },
      { name: "Kinderzimmer", typ: "Kinderzimmer", sd: 4, sch: 1, li: 1, nw: 0 }, { name: "Bad", typ: "Bad", sd: 3, sch: 2, li: 2, nw: 0 }, { name: "Flur", typ: "Flur", sd: 2, sch: 3, li: 2, nw: 0 }, { name: "Büro", typ: "Büro", sd: 6, sch: 1, li: 1, nw: 2 }] }; },
    neu: function () { return { name: "Raum", typ: "Schlafzimmer", sd: 4, sch: 1, li: 1, nw: 0 }; },
    ansichten: function () { return [["plan", "Räume"], ["verteiler", "Unterverteilung"]]; },
    produkte: function () { return ["wallbox"]; },
    ziel: { wallbox: "e.kwb" },
    _kreise: function (A_) { return sum(A_.posten, function (r) { return auf((+r.sd || 0) / 8) + auf((+r.li || 0) / 8) + (r.typ === "Küche" ? 3 : 0) + (r.typ === "Bad" ? 1 : 0); }) + (A_.e.wb === "ja" ? 1 : 0) + 2; },
    bild: function (id, p, A_) {
      if (id === "verteiler") {
        var n = this._kreise(A_), reihen = auf(n / 12), g = rc(80, 20, 200, 40 + reihen * 50, "gw-objekt");
        for (var i = 0; i < n; i++) { var rr = Math.floor(i / 12), c = i % 12; g += rc(92 + c * 15.5, 40 + rr * 50, 12, 28, "gw-sicherung"); }
        return svgBox(360, 80 + reihen * 50, "Unterverteilung", g + tx(180, 14, n + " Stromkreise · " + reihen + "-reihig" + (A_.e.zs === "erneuern" ? " · Zählerschrank neu" : ""), "gw-titel"));
      }
      var st = stufe(A_), g2 = "", cols = 3, w = 108, hh = 74;
      A_.posten.forEach(function (r, i) {
        var x = 10 + (i % cols) * (w + 8), y = 10 + Math.floor(i / cols) * (hh + 8), e = TYPEN[r.typ] || TYPEN.Wohnzimmer, fehlt = Math.max(0, e[0][st] - (+r.sd || 0));
        g2 += rc(x, y, w, hh, r === p ? "gw-raum-aktiv" : "gw-raum") + tx(x + 8, y + 16, esc(r.name), "gw-titel", "start") +
          tx(x + 8, y + 34, "⏚ " + (r.sd || 0) + " Steckd." + (fehlt ? " (+" + fehlt + ")" : ""), fehlt ? "gw-warn-t" : "am-klein", "start") + tx(x + 8, y + 50, "◐ " + (r.sch || 0) + " Schalter · ☀ " + (r.li || 0), "am-klein", "start") + tx(x + 8, y + 66, "⇄ " + (r.nw || 0) + " Netzwerk", "am-klein", "start");
      });
      var rows = auf(A_.posten.length / cols);
      return svgBox(360, 20 + rows * (hh + 8), "Räume mit Elektro-Ausstattung", g2);
    },
    ergebnis: function (A_) {
      var st = stufe(A_), k = function (key) { return sum(A_.posten, function (r) { return +r[key] || 0; }); };
      return tab(["Raum", "Steckdosen", "Schalter", "Licht", "Netzwerk"], A_.posten.map(function (r) { var e = TYPEN[r.typ] || TYPEN.Wohnzimmer, sd = +r.sd || 0; return [esc(r.name), sd + (sd < e[0][st] ? ' <span class="gw-warn-t">(Empf. ' + e[0][st] + ")</span>" : ""), (r.sch || 0) + "", (r.li || 0) + (+r.li < e[1][st] ? ' <span class="gw-warn-t">(Empf. ' + e[1][st] + ")</span>" : ""), (r.nw || 0) + ""]; }), ["Gesamt", k("sd") + "", k("sch") + "", k("li") + "", k("nw") + ""]) +
        '<div class="gw-kacheln"><div><b>' + this._kreise(A_) + "</b><span>Stromkreise</span></div><div><b>Stufe " + (st + 1) + "</b><span>Ausstattung</span></div><div><b>" + (A_.e.wb === "ja" ? "ja" : "nein") + "</b><span>Wallbox</span></div></div>" +
        h.hin("Empfehlungen sind Richtwerte je Ausstattungsstufe. Nach der Installation: Prüfung und Messprotokoll nach DIN VDE 0100-600.");
    },
    positionen: function (A_) {
      var k = function (key) { return sum(A_.posten, function (r) { return +r[key] || 0; }); }, out = [pos("Steckdose inkl. Leitung und Unterputzdose", k("sd"), "Stk.", 89), pos("Schalter / Taster inkl. Leitung", k("sch"), "Stk.", 79), pos("Lichtauslass inkl. Leitung", k("li"), "Stk.", 98)];
      if (k("nw")) out.push(pos("Netzwerkdose Cat. 7 inkl. Leitung", k("nw"), "Stk.", 159));
      out.push(pos("Stromkreis in der Unterverteilung (LS + FI)", this._kreise(A_), "Stk.", 135));
      if (A_.e.zs === "erneuern") out.push(pos("Zählerschrank nach TAB des Netzbetreibers erneuern", 1, "psch", 2650));
      if (A_.e.wb === "ja") out = out.concat(P.wallbox.preis(A_.e.kwb || P.wallbox.start()));
      if (A_.e.sh === "ja") out.push(pos("Smart Home für Licht und Rollläden je Raum", A_.posten.length, "Stk.", 240, true));
      out.push(pos("Prüfung und Messprotokoll (DIN VDE 0100-600)", 1, "psch", 190));
      return out;
    }
  };

  /* ---------- Solar & Photovoltaik ---------- */
  var MODUL = { "430 Wp (1,72 × 1,13 m)": [0.43, 1.72, 1.134], "450 Wp (1,76 × 1,13 m)": [0.45, 1.762, 1.134] };
  var ERTRAG = { "Süd": 950, "Südost / Südwest": 920, "Ost / West": 820, "Nord": 600 };
  function belegung(p, A_) { var m = MODUL[A_.e.modul] || MODUL["430 Wp (1,72 × 1,13 m)"], reihen = Math.max(0, Math.floor((num(p.b) - 0.6) / (m[1] + 0.02))), spalten = Math.max(0, Math.floor((num(p.l) - 0.6) / (m[2] + 0.02))), weg = { keine: 0, Dachfenster: 2, Kamin: 1, beides: 3 }[p.hind] || 0; return { reihen: reihen, spalten: spalten, n: Math.max(0, reihen * spalten - weg), weg: weg, m: m }; }
  function pvSumme(A_) { var n = sum(A_.posten, function (p) { return belegung(p, A_).n; }), kwp = sum(A_.posten, function (p) { var b = belegung(p, A_); return b.n * b.m[0]; }), ertrag = sum(A_.posten, function (p) { var b = belegung(p, A_); return b.n * b.m[0] * (ERTRAG[p.ausr] || 900); }); return { n: n, kwp: kwp, ertrag: ertrag }; }
  A.solar = { titel: "PV-Anlage planen", posten: "Dachfläche",
    felder: function () { return [{ k: "name", l: "Dachfläche", t: "txt" }, F("l", "Breite (Traufe)", { min: 2, max: 30 }), F("b", "Höhe (Sparrenlänge)", { min: 2, max: 15 }), { k: "ausr", l: "Ausrichtung", t: "sel", o: Object.keys(ERTRAG) }, F("neig", "Neigung", { min: 0, max: 60, st: 1, e: "°" }), { k: "hind", l: "Im Weg", t: "sel", o: ["keine", "Dachfenster", "Kamin", "beides"] }]; },
    einst: [{ k: "modul", l: "Modul", t: "sel", o: Object.keys(MODUL) }, F("verbrauch", "Stromverbrauch", { min: 500, max: 30000, st: 100, e: "kWh/Jahr" }), { k: "speicher", l: "Speicher", t: "sel", o: JA }, F("preis", "Strompreis", { min: 10, max: 80, st: 1, e: "ct/kWh" }), F("einsp", "Einspeisevergütung", { min: 0, max: 20, st: 0.1, e: "ct/kWh" })],
    start: function () { return { e: { modul: "430 Wp (1,72 × 1,13 m)", verbrauch: 4500, speicher: "ja", preis: 35, einsp: 7.8, ksp: P.stromspeicher.start() }, posten: [{ name: "Dach Süd", l: 10.5, b: 6.2, ausr: "Süd", neig: 35, hind: "Kamin" }, { name: "Garage", l: 6, b: 3.4, ausr: "Ost / West", neig: 10, hind: "keine" }] }; },
    neu: function () { return { name: "Dachfläche", l: 8, b: 5, ausr: "Süd", neig: 30, hind: "keine" }; },
    ansichten: function () { return [["belegung", "Modulbelegung"], ["ertrag", "Ertrag & Ersparnis"]]; },
    produkte: function () { return ["stromspeicher"]; },
    ziel: { stromspeicher: "e.ksp" },
    _rechnung: function (A_) {
      var s = pvSumme(A_), kwh = A_.e.speicher === "ja" ? num((A_.e.ksp || {}).kwh || 10) : 0, quote = kwh >= 15 ? 0.7 : kwh >= 10 ? 0.65 : kwh >= 5 ? 0.55 : 0.3;
      var eigen = Math.min(num(A_.e.verbrauch) * 0.85, s.ertrag * quote), einsp = Math.max(0, s.ertrag - eigen);
      return { s: s, eigen: eigen, einsp: einsp, euro: eigen * num(A_.e.preis) / 100 + einsp * num(A_.e.einsp) / 100, autark: num(A_.e.verbrauch) ? eigen / num(A_.e.verbrauch) : 0 };
    },
    scan: { label: "Dach aus Luftbild messen", text: "Dachfläche wird aus dem Luftbild vermessen …", run: function (p) { p.l = Math.round((num(p.l) + 0.12) * 100) / 100; p.b = Math.round((num(p.b) - 0.05) * 100) / 100; p.neig = 38; return "Gemessen (Simulation): " + M(p.l) + " × " + M(p.b) + ", Neigung 38°"; } },
    bild: function (id, p, A_) {
      if (id === "ertrag") {
        var r = this._rechnung(A_), max = Math.max(r.s.ertrag, num(A_.e.verbrauch), 1), w = function (x) { return 220 * x / max; }, g = "";
        g += tx(14, 40, "Erzeugung", "am-klein", "start") + rc(110, 28, w(r.eigen), 16, "gw-balken-ok") + rc(110 + w(r.eigen), 28, w(r.einsp), 16, "gw-balken");
        g += tx(14, 76, "Verbrauch", "am-klein", "start") + rc(110, 64, w(r.eigen), 16, "gw-balken-ok") + rc(110 + w(r.eigen), 64, w(Math.max(0, num(A_.e.verbrauch) - r.eigen)), 16, "gw-balken-warn");
        g += rc(110, 104, 10, 10, "gw-balken-ok") + tx(126, 113, "selbst genutzt " + Z0(r.eigen) + " kWh", "am-klein", "start") + rc(110, 122, 10, 10, "gw-balken") + tx(126, 131, "eingespeist " + Z0(r.einsp) + " kWh", "am-klein", "start") + rc(110, 140, 10, 10, "gw-balken-warn") + tx(126, 149, "aus dem Netz", "am-klein", "start");
        return svgBox(360, 190, "Ertrag und Verbrauch", g + tx(180, 180, "ca. " + Z0(r.euro) + " € Ersparnis im Jahr · " + Math.round(r.autark * 100) + " % unabhängig (Richtwert)", "gw-titel"));
      }
      var b = belegung(p, A_), s = Math.min(320 / num(p.l), 200 / num(p.b)), x0 = (360 - num(p.l) * s) / 2, y0 = 30, g2 = poly([[x0, y0 + num(p.b) * s], [x0 + num(p.l) * s, y0 + num(p.b) * s], [x0 + num(p.l) * s, y0], [x0, y0]], "gw-dach");
      var mx = x0 + 0.3 * s, my = y0 + 0.3 * s, k = 0, sperr = { keine: [], Dachfenster: [0, 1], Kamin: [2], beides: [0, 1, 2] }[p.hind] || [];
      for (var rr = 0; rr < b.reihen; rr++) for (var c = 0; c < b.spalten; c++) { var idx = rr * b.spalten + c, frei = !(rr === 0 && sperr.indexOf(c) > -1 && false); var blockiert = (p.hind === "Kamin" || p.hind === "beides") && rr === 0 && c === b.spalten - 1 || (p.hind === "Dachfenster" || p.hind === "beides") && rr === b.reihen - 1 && c < 2; g2 += rc(mx + c * (b.m[2] + 0.02) * s, my + rr * (b.m[1] + 0.02) * s, b.m[2] * s, b.m[1] * s, blockiert ? "gw-modul-weg" : "gw-modul"); if (!blockiert) k++; }
      return svgBox(360, 280, "Modulbelegung " + p.name, g2 + h.pf(x0, y0 + num(p.b) * s + 18, x0 + num(p.l) * s, y0 + num(p.b) * s + 18, M(num(p.l)), false, -12) + tx(180, 18, b.n + " Module · " + Z(b.n * b.m[0]) + " kWp · " + esc(p.ausr), "gw-titel"));
    },
    ergebnis: function (A_) {
      var r = this._rechnung(A_);
      return tab(["Dachfläche", "Maße", "Ausrichtung", "Module", "kWp"], A_.posten.map(function (p) { var b = belegung(p, A_); return [esc(p.name), M(num(p.l)) + " × " + M(num(p.b)), esc(p.ausr) + ", " + p.neig + "°", b.n + "", Z(b.n * b.m[0])]; }), ["Gesamt", "", "", r.s.n + "", Z(r.s.kwp)]) +
        '<div class="gw-kacheln"><div><b>' + Z0(r.s.ertrag) + " kWh</b><span>Ertrag im Jahr</span></div><div><b>" + Math.round(r.autark * 100) + " %</b><span>unabhängig</span></div><div><b>" + Z0(r.euro) + " €</b><span>Ersparnis im Jahr</span></div></div>" +
        h.hin("Richtwerte (Ertrag Süddeutschland, Eigenverbrauch je nach Speicher). Strompreis und Einspeisevergütung bitte aktuell eintragen. Für PV-Anlagen auf Wohngebäuden gilt 0 % Umsatzsteuer (§ 12 Abs. 3 UStG) – die Demo rechnet pauschal mit 19 %.");
    },
    positionen: function (A_) {
      var r = this._rechnung(A_), n = r.s.n, kwp = r.s.kwp, modul = A_.e.modul.split(" (")[0], out = [pos("PV-Modul " + modul + " liefern", n, "Stk.", 145), pos("Unterkonstruktion für Ziegeldach je Modul", n, "Stk.", 62), pos("Wechselrichter " + (kwp <= 6 ? "6" : kwp <= 10 ? "10" : "15") + " kW", 1, "Stk.", kwp <= 6 ? 1350 : kwp <= 10 ? 1750 : 2350), pos("Montage auf dem Dach inkl. Gerüst", 1, "psch", 900 + n * 45), pos("DC- und AC-Verkabelung, Anschluss im Zählerschrank", 1, "psch", 1150)];
      if (A_.e.speicher === "ja") out = out.concat(P.stromspeicher.preis(A_.e.ksp || P.stromspeicher.start()));
      out.push(pos("Anmeldung beim Netzbetreiber und im Marktstammdatenregister", 1, "psch", 290));
      return out;
    }
  };

  /* ---------- Maler & Fassade ---------- */
  var FARBEN = { "Reinweiß": "#f4f3ef", "Kieselgrau": "#cfcac0", "Salbei": "#b5c1a8", "Taubenblau": "#a9b8c6", "Sand": "#e0cfb1", "Terracotta": "#c98a6b", "Anthrazit": "#4a4d50" };
  function malerFl(p, A_) { var vob = /^ja/.test(A_.e.vob); if (p.art === "Fassade") { var abz = sum(p.ab || [], function (x) { var f = x.b * x.h; return vob && f <= 2.5 ? 0 : f; }); return { wand: Math.max(0, num(p.l) * num(p.h) - abz), decke: 0, boden: 0, abz: abz, geruest: (num(p.l) + 1.4) * (num(p.h) + 1) }; } var f = raumFl(p, vob); return { wand: f.wand, decke: p.decke === "ja" ? f.decke : 0, boden: f.boden, abz: f.abz, geruest: 0 }; }
  A.maler = { titel: "Malerarbeiten aufmessen", posten: "Raum", oeff: true, arten: ["Innenraum", "Fassade"],
    felder: function (p) { var fa = { k: "farbe", l: "Farbton", t: "sel", o: Object.keys(FARBEN) }; if (p.art === "Fassade") return [{ k: "art", l: "Art", t: "sel", o: this.arten }, { k: "name", l: "Fassade", t: "txt" }, F("l", "Länge"), F("h", "Höhe", { min: 1.5, max: 20 }), fa]; return [{ k: "art", l: "Art", t: "sel", o: this.arten }].concat(RAUM).concat([{ k: "decke", l: "Decke streichen", t: "sel", o: JA }, { k: "tapete", l: "Tapete", t: "sel", o: ["keine", "Raufaser", "Vlies"] }, fa]); },
    einst: [{ k: "vob", l: "Öffnungen", t: "sel", o: ["ja – bis 2,5 m² übermessen (VOB/C)", "nein – alles abziehen"] }, { k: "anstr", l: "Anstriche", t: "sel", o: ["2", "1"] }, { k: "q", l: "Spachteln", t: "sel", o: ["keine", "Q3 (glatt)"] }],
    start: function () { return { e: { vob: "ja – bis 2,5 m² übermessen (VOB/C)", anstr: "2", q: "keine" }, posten: [
      { art: "Innenraum", name: "Wohnzimmer", l: 5.2, b: 4.1, h: 2.55, ab: [tuer(0.9), fen(1.8, 1.4), fen(1.2, 1.4)], decke: "ja", tapete: "Raufaser", farbe: "Salbei" },
      { art: "Innenraum", name: "Flur", l: 4.0, b: 1.4, h: 2.55, ab: [tuer(0.9), tuer(0.8), tuer(0.8)], decke: "ja", tapete: "keine", farbe: "Reinweiß" },
      { art: "Fassade", name: "Fassade Süd", l: 11.5, h: 6.2, ab: [fen(1.2, 1.3), fen(1.2, 1.3), fen(1.2, 1.3), fen(2.4, 2.2), tuer(1.1)], farbe: "Sand" }] }; },
    neu: function (art) { return art === "Fassade" ? { art: "Fassade", name: "Fassade", l: 10, h: 6, ab: [fen()], farbe: "Reinweiß" } : { art: "Innenraum", name: "Raum", l: 4, b: 3.5, h: 2.5, ab: [tuer(0.9), fen()], decke: "ja", tapete: "keine", farbe: "Reinweiß" }; },
    ansichten: function (p) { return p.art === "Fassade" ? [["ansicht", "Fassadenansicht"]] : [["abwicklung", "Wandabwicklung"], ["3d", "3D mit Farbe"], ["grundriss", "Grundriss"]]; },
    bild: function (id, p, A_, H) {
      var col = FARBEN[p.farbe] || "#eee";
      if (p.art === "Fassade") {
        var s = Math.min(320 / num(p.l), 200 / num(p.h)), x0 = (360 - num(p.l) * s) / 2, y0 = 240 - num(p.h) * s, g = rc(x0, y0, num(p.l) * s, num(p.h) * s, "gw-wandfarbe", ' style="fill:' + col + '"') + poly([[x0 - 10, y0], [x0 + num(p.l) * s / 2, y0 - 50], [x0 + num(p.l) * s + 10, y0]], "gw-dach"), fx = x0 + 14;
        (p.ab || []).forEach(function (o, i) { var oy = o.art === "Tür" ? 240 - o.h * s : y0 + (i % 2 ? num(p.h) * s * 0.55 : num(p.h) * s * 0.12); if (fx + o.b * s > x0 + num(p.l) * s) { fx = x0 + 14; } g += rc(fx, oy, o.b * s, o.h * s, o.art === "Tür" ? "gw-tuer" : "gw-glas"); fx += o.b * s + 14; });
        return svgBox(360, 270, "Fassadenansicht", g + ln(20, 240, 340, 240, "gw-boden") + pf(x0, 258, x0 + num(p.l) * s, 258, M(num(p.l)), false, -12) + tx(180, 16, "Farbton " + esc(p.farbe) + " · " + Z(malerFl(p, A_).wand) + " m² Anstrich", "gw-titel"));
      }
      if (id === "3d") return H.iso(p, { farbe: col, ohneFugen: true });
      if (id === "grundriss") return H.grund(p, { boden: "gw-parkett" });
      var waende = [["A", num(p.l)], ["B", num(p.b)], ["C", num(p.l)], ["D", num(p.b)]], ges = sum(waende, function (w) { return w[1]; }), s2 = 340 / ges, hs = Math.min(150, num(p.h) * s2 * 1.6), sy = hs / num(p.h), x = 10, g2 = "", ti = 0, fi = 0;
      var tueren = (p.ab || []).filter(function (o) { return o.art === "Tür"; }), fenster = (p.ab || []).filter(function (o) { return o.art !== "Tür"; });
      waende.forEach(function (w, i) {
        g2 += rc(x, 40, w[1] * s2, hs, "gw-wandfarbe", ' style="fill:' + col + '"') + tx(x + w[1] * s2 / 2, 32, "Wand " + w[0] + " · " + M(w[1]), "am-klein");
        if (i % 2 === 0 && fenster[fi]) { var o = fenster[fi++]; g2 += rc(x + (w[1] - o.b) * s2 / 2, 40 + hs * 0.25, o.b * s2, o.h * sy, "gw-glas"); }
        if (i % 2 === 1 && tueren[ti]) { var t = tueren[ti++]; g2 += rc(x + 6, 40 + hs - t.h * sy, t.b * s2, t.h * sy, "gw-tuer"); }
        x += w[1] * s2;
      });
      return svgBox(360, 240, "Wandabwicklung " + p.name, g2 + pf(10, 40 + hs + 22, 350, 40 + hs + 22, "Umfang " + M(ges), false, -12) + tx(180, 16, "Farbton " + esc(p.farbe) + " · " + Z(malerFl(p, A_).wand) + " m² Wand", "gw-titel"));
    },
    ergebnis: function (A_) {
      var an = +A_.e.anstr || 2, w = sum(A_.posten, function (p) { return malerFl(p, A_).wand; }), d = sum(A_.posten, function (p) { return malerFl(p, A_).decke; }), liter = (w + d) * an / 7;
      return tab(["Raum", "Wand", "Decke", "Abzug", "Farbton"], A_.posten.map(function (p) { var f = malerFl(p, A_); return [esc(p.name), Z(f.wand) + " m²", Z(f.decke) + " m²", Z(f.abz) + " m²", '<span class="gw-farbpunkt" style="background:' + (FARBEN[p.farbe] || "#eee") + '"></span>' + esc(p.farbe)]; }), ["Gesamt", Z(w) + " m²", Z(d) + " m²", "", ""]) +
        mat("Material", ["Farbe ca. " + Z0(liter) + " l (" + auf(liter / 12.5) + " Eimer à 12,5 l) bei " + an + " Anstrich" + (an > 1 ? "en" : ""), "Abdeckvlies " + Z0(sum(A_.posten, function (p) { return malerFl(p, A_).boden; })) + " m²", A_.posten.some(function (p) { return p.art === "Fassade"; }) ? "Gerüst " + Z0(sum(A_.posten, function (p) { return malerFl(p, A_).geruest; })) + " m²" : ""]) +
        h.hin(/^ja/.test(A_.e.vob) ? "Abrechnung nach VOB/C (DIN 18363): Öffnungen bis 2,5 m² werden übermessen, also nicht abgezogen." : "Alle Öffnungen werden abgezogen.");
    },
    positionen: function (A_) {
      var an = +A_.e.anstr || 2, out = [], inn = A_.posten.filter(function (p) { return p.art !== "Fassade"; }), fas = A_.posten.filter(function (p) { return p.art === "Fassade"; });
      var w = sum(inn, function (p) { return malerFl(p, A_).wand; }), d = sum(inn, function (p) { return malerFl(p, A_).decke; });
      if (inn.length) out.push(pos("Boden und Möbel abdecken, Schutz abbauen", sum(inn, function (p) { return malerFl(p, A_).boden; }), "m²", 2.4));
      var rau = sum(inn.filter(function (p) { return p.tapete === "Raufaser"; }), function (p) { return malerFl(p, A_).wand; }), vl = sum(inn.filter(function (p) { return p.tapete === "Vlies"; }), function (p) { return malerFl(p, A_).wand; });
      if (A_.e.q !== "keine" && w) out.push(pos("Wände spachteln Q3", w, "m²", 14));
      if (rau) out.push(pos("Raufaser tapezieren", rau, "m²", 13.5));
      if (vl) out.push(pos("Vliestapete tapezieren", vl, "m²", 17.5));
      if (w) out.push(pos("Wände streichen, Dispersion, " + an + " Anstrich" + (an > 1 ? "e" : "") + " (" + inn.map(function (p) { return p.name + ": " + p.farbe; }).join(", ") + ")", w, "m²", an > 1 ? 9.8 : 6.2));
      if (d) out.push(pos("Decken streichen, weiß", d, "m²", 10.9));
      fas.forEach(function (p) { var f = malerFl(p, A_); out.push(pos("Gerüst stellen und 4 Wochen vorhalten (" + p.name + ")", f.geruest, "m²", 11.5), pos("Fassade reinigen (" + p.name + ")", f.wand, "m²", 4.5), pos("Fassade grundieren und 2× streichen, Silikonharz, " + p.farbe + " (" + p.name + ")", f.wand, "m²", 24)); });
      return out;
    },
    scan: { label: "Raum scannen", text: "Raum wird gescannt … Handy langsam drehen" }
  };
  A.maler.FARBEN = FARBEN;

  /* ---------- Fliesen ---------- */
  var FORMAT = { "30 × 60": [0.3, 0.6, 1.44], "60 × 60": [0.6, 0.6, 1.44], "60 × 120": [0.6, 1.2, 1.44], "20 × 20": [0.2, 0.2, 1.0], "Mosaik 30 × 30": [0.3, 0.3, 0.9] };
  var MUSTER = { Kreuzfuge: 0, Halbverband: 3, Diagonal: 7 };
  function flWand(r) { var f = raumFl(r); if (r.bereich === "nur Boden") return 0; return r.wh === "1,20 m" ? Math.max(0, 2 * (r.l + r.b) * 1.2 - sum((r.ab || []).filter(function (x) { return x.art === "Tür"; }), function (x) { return x.b * 1.2; })) : f.wand; }
  function flBoden(r) { return r.bereich === "nur Wand" ? 0 : raumFl(r).boden; }
  A.fliesen = { titel: "Fliesen aufmessen", posten: "Raum", oeff: true,
    felder: function () { return RAUM.concat([{ k: "bereich", l: "Bereich", t: "sel", o: ["Boden und Wand", "nur Boden", "nur Wand"] }, { k: "wh", l: "Wandfliesen", t: "sel", o: ["raumhoch", "1,20 m"] }]); },
    einst: [{ k: "fmt", l: "Format (cm)", t: "sel", o: Object.keys(FORMAT) }, { k: "muster", l: "Verlegung", t: "sel", o: Object.keys(MUSTER) }, F("v", "Grundverschnitt", { min: 0, max: 30, st: 1, e: "%" })],
    start: function () { return { e: { fmt: "60 × 60", muster: "Halbverband", v: 8 }, posten: [{ name: "Bad", l: 2.8, b: 2.9, h: 2.5, ab: [tuer(0.8), fen(0.9, 1.0)], bereich: "Boden und Wand", wh: "raumhoch" }, { name: "Gäste-WC", l: 1.2, b: 1.6, h: 2.5, ab: [tuer(0.7)], bereich: "Boden und Wand", wh: "1,20 m" }, { name: "Küche (Spiegel)", l: 3.6, b: 0.6, h: 0.6, ab: [], bereich: "nur Wand", wh: "raumhoch" }] }; },
    neu: function () { return { name: "Raum", l: 3, b: 2.5, h: 2.5, ab: [tuer()], bereich: "Boden und Wand", wh: "1,20 m" }; },
    ansichten: function () { return [["verlegeplan", "Verlegeplan"], ["3d", "3D"], ["foto", "Foto mit Maßen"]]; },
    _v: function (A_) { return ((+A_.e.v || 0) + (MUSTER[A_.e.muster] || 0)) / 100; },
    bild: function (id, p, A_, H) {
      if (id === "3d") return H.iso(p); if (id === "foto") return H.foto(p);
      var f = FORMAT[A_.e.fmt] || FORMAT["60 × 60"], G = geo(p), a = f[1] * G.s, b = f[0] * G.s, m = A_.e.muster, mu;
      if (m === "Halbverband") mu = '<pattern id="gwfl" width="' + a + '" height="' + (2 * b) + '" patternUnits="userSpaceOnUse"><path d="M0 0H' + a + "M0 " + b + "H" + a + "M0 0V" + b + "M" + (a / 2) + " " + b + "V" + (2 * b) + '" class="am-fuge"/></pattern>';
      else mu = '<pattern id="gwfl" width="' + a + '" height="' + b + '" patternUnits="userSpaceOnUse"' + (m === "Diagonal" ? ' patternTransform="rotate(45)"' : "") + '><path d="M' + a + " 0H0V" + b + '" class="am-fuge"/></pattern>';
      return einfuegen(H.grund(p, { muster: mu, fill: "url(#gwfl)" }), tx(180, 274, "Format " + esc(A_.e.fmt) + " · " + esc(m) + (p.bereich === "nur Wand" ? " (nur Wand)" : ""), "am-klein"));
    },
    ergebnis: function (A_) {
      var v = this._v(A_), f = FORMAT[A_.e.fmt] || FORMAT["60 × 60"], b = sum(A_.posten, flBoden), w = sum(A_.posten, flWand), ges = (b + w) * (1 + v), stk = auf(ges / (f[0] * f[1])), kart = auf(ges / f[2]);
      return tab(["Raum", "Boden", "Wand", "Sockel"], A_.posten.map(function (r) { return [esc(r.name), Z(flBoden(r)) + " m²", Z(flWand(r)) + " m²", r.bereich === "nur Wand" ? "–" : M(raumFl(r).sockel)]; }), ["Gesamt", Z(b) + " m²", Z(w) + " m²", M(sum(A_.posten, function (r) { return r.bereich === "nur Wand" ? 0 : raumFl(r).sockel; }))]) +
        '<div class="gw-kacheln"><div><b>' + Z(ges) + " m²</b><span>Fliesen inkl. " + Math.round(v * 100) + " % Verschnitt</span></div><div><b>" + stk + "</b><span>Fliesen " + esc(A_.e.fmt) + "</span></div><div><b>" + kart + "</b><span>Kartons à " + Z(f[2]) + " m²</span></div></div>" +
        mat("Material", ["Fliesenkleber ca. " + auf((b + w) * (A_.e.fmt === "60 × 120" ? 5 : 4) / 25) + " Sack à 25 kg", "Fugenmörtel ca. " + auf((b + w) * (/Mosaik/.test(A_.e.fmt) ? 1.2 : 0.5) / 5) + " Sack à 5 kg", "Silikon für Anschlussfugen ca. " + auf(sum(A_.posten, function (r) { return raumFl(r).umfang; }) / 12) + " Kartuschen"]);
    },
    positionen: function (A_) {
      var v = this._v(A_), b = sum(A_.posten, flBoden), w = sum(A_.posten, flWand), gross = A_.e.fmt === "60 × 120" ? 14 : 0, out = [];
      out.push(pos("Untergrund prüfen, vorbereiten und grundieren", b + w, "m²", 6.5));
      if (b) out.push(pos("Bodenfliesen " + A_.e.fmt + " verlegen, " + A_.e.muster, b, "m²", 58 + gross + (A_.e.muster === "Diagonal" ? 6 : 0)));
      if (w) out.push(pos("Wandfliesen " + A_.e.fmt + " verlegen, " + A_.e.muster, w, "m²", 64 + gross));
      out.push(pos("Fliesen " + A_.e.fmt + " liefern (inkl. " + Math.round(v * 100) + " % Verschnitt)", (b + w) * (1 + v), "m²", 42));
      var so = sum(A_.posten, function (r) { return r.bereich === "nur Wand" || r.bereich === "Boden und Wand" && r.wh === "raumhoch" ? 0 : raumFl(r).sockel; });
      if (so) out.push(pos("Sockelfliesen", so, "m", 18));
      out.push(pos("Silikon- und Wartungsfugen", sum(A_.posten, function (r) { return raumFl(r).umfang; }), "m", 7.5));
      return out;
    },
    scan: { label: "Raum scannen", text: "Raum wird gescannt … Handy langsam drehen" }
  };

  /* ---------- Boden & Parkett ---------- */
  var BELAG = { "Vinyl (Klick)": { typ: "planke", paket: 2.2, ep: 39, verl: 22 }, Laminat: { typ: "planke", paket: 2.4, ep: 22, verl: 19 }, "Parkett (Fertigparkett)": { typ: "planke", paket: 1.9, ep: 59, verl: 29 }, "Teppich (Bahnenware)": { typ: "bahn", ep: 28, verl: 18 }, "PVC / Linoleum (Bahnenware)": { typ: "bahn", ep: 25, verl: 21 } };
  function bodenRechnung(r, A_) {
    var be = BELAG[r.bel] || BELAG["Vinyl (Klick)"], f = r.l * r.b, rb = num(A_.e.rb) || 4;
    if (be.typ === "bahn") { var lang = r.ri === "längs" ? r.l : r.b, quer = r.ri === "längs" ? r.b : r.l, bahnen = auf(quer / rb), lfm = bahnen * (lang + 0.1); return { f: f, kauf: lfm * rb, bahnen: bahnen, lfm: lfm, pakete: 0, be: be }; }
    var kauf = f * (1 + (+A_.e.v || 0) / 100); return { f: f, kauf: kauf, pakete: auf(kauf / be.paket), be: be };
  }
  A.boden = { titel: "Boden aufmessen", posten: "Raum",
    felder: function () { return [{ k: "name", l: "Raum", t: "txt" }, F("l", "Länge"), F("b", "Breite"), { k: "bel", l: "Belag", t: "sel", o: Object.keys(BELAG) }, { k: "ri", l: "Verlegerichtung", t: "sel", o: ["längs", "quer"] }, F("tu", "Türen", { min: 0, max: 4, st: 1, e: "" })]; },
    einst: [F("v", "Verschnitt Planken", { min: 0, max: 25, st: 1, e: "%" }), { k: "rb", l: "Rollenbreite Bahnenware", t: "sel", o: [["2", "2 m"], ["4", "4 m"], ["5", "5 m"]] }, { k: "alt", l: "Alter Belag", t: "sel", o: ["entfernen", "bleibt", "keiner"] }, { k: "sp", l: "Untergrund spachteln", t: "sel", o: JA }],
    start: function () { return { e: { v: 8, rb: "4", alt: "entfernen", sp: "ja" }, posten: [{ name: "Wohnzimmer", l: 5.2, b: 4.1, h: 2.5, bel: "Parkett (Fertigparkett)", ri: "längs", tu: 1 }, { name: "Schlafzimmer", l: 4.2, b: 3.6, h: 2.5, bel: "Teppich (Bahnenware)", ri: "längs", tu: 1 }, { name: "Flur", l: 4.0, b: 1.4, h: 2.5, bel: "Vinyl (Klick)", ri: "längs", tu: 3 }] }; },
    neu: function () { return { name: "Raum", l: 4, b: 3, h: 2.5, bel: "Vinyl (Klick)", ri: "längs", tu: 1 }; },
    ansichten: function () { return [["plan", "Verlegeplan"], ["3d", "3D"]]; },
    bild: function (id, p, A_, H) {
      var r = Object.assign({}, p, { l: num(p.l), b: num(p.b), h: num(p.h) || 2.5, ab: [] });
      if (id === "3d") return H.iso(r, { boden: "gw-parkett", ohneFugen: true });
      var R = bodenRechnung(r, A_), G = geo(r), g = "", be = R.be;
      if (be.typ === "bahn") {
        var rb = num(A_.e.rb) || 4, quer = p.ri === "längs" ? r.b : r.l;
        for (var i = 0; i < R.bahnen; i++) { var w = Math.min(rb, quer - i * rb); g += p.ri === "längs" ? rc(G.x0, G.y0 + i * rb * G.s, r.l * G.s, w * G.s, "gw-bahn" + (i % 2)) : rc(G.x0 + i * rb * G.s, G.y0, w * G.s, r.b * G.s, "gw-bahn" + (i % 2)); g += tx(p.ri === "längs" ? G.x0 + 30 : G.x0 + (i * rb + w / 2) * G.s, p.ri === "längs" ? G.y0 + (i * rb + w / 2) * G.s + 4 : G.y0 + 20, "Bahn " + (i + 1)); }
        return einfuegen(H.grund(r, { boden: "gw-leer" }), g + tx(180, 274, R.bahnen + " Bahnen à " + M(rb) + " · " + Z1(R.lfm) + " lfm · Rest " + Z(R.kauf - R.f) + " m²", "am-klein"));
      }
      var pl = 1.22 * G.s, pb = 0.2 * G.s, mu = '<pattern id="gwpl" width="' + pl + '" height="' + (2 * pb) + '" patternUnits="userSpaceOnUse"' + (p.ri === "quer" ? ' patternTransform="rotate(90)"' : "") + '><rect width="' + pl + '" height="' + (2 * pb) + '" class="gw-parkett"/><path d="M0 0H' + pl + "M0 " + pb + "H" + pl + "M0 0V" + pb + "M" + (pl * 0.4) + " " + pb + "V" + (2 * pb) + '" class="am-fuge"/></pattern>';
      return einfuegen(H.grund(r, { muster: mu, fill: "url(#gwpl)" }), tx(180, 274, esc(p.bel) + " · " + R.pakete + " Pakete · Verlegung " + p.ri, "am-klein"));
    },
    ergebnis: function (A_) {
      var rs = A_.posten.map(function (p) { var r = { l: num(p.l), b: num(p.b) }; return [p, bodenRechnung(Object.assign({}, p, r), A_)]; });
      return tab(["Raum", "Fläche", "Belag", "Bestellen", "Sockel"], rs.map(function (x) { var p = x[0], R = x[1]; return [esc(p.name), Z(R.f) + " m²", esc(p.bel), R.be.typ === "bahn" ? Z1(R.lfm) + " lfm (" + Z(R.kauf) + " m²)" : R.pakete + " Pakete (" + Z(R.kauf) + " m²)", M(Math.max(0, 2 * (num(p.l) + num(p.b)) - (+p.tu || 0) * 0.9))]; }), ["Gesamt", Z(sum(rs, function (x) { return x[1].f; })) + " m²", "", Z(sum(rs, function (x) { return x[1].kauf; })) + " m²", M(sum(A_.posten, function (p) { return Math.max(0, 2 * (num(p.l) + num(p.b)) - (+p.tu || 0) * 0.9); }))]) +
        h.hin("Bahnenware: Bahnen werden in voller Rollenbreite bestellt – der Rest ist eingerechnet.");
    },
    positionen: function (A_) {
      var out = [], F_ = sum(A_.posten, function (p) { return num(p.l) * num(p.b); });
      if (A_.e.alt === "entfernen") out.push(pos("Alten Bodenbelag entfernen und entsorgen", F_, "m²", 9.5));
      if (A_.e.sp === "ja") out.push(pos("Untergrund spachteln", F_, "m²", 14.5));
      var gruppen = {};
      A_.posten.forEach(function (p) { var R = bodenRechnung(Object.assign({}, p, { l: num(p.l), b: num(p.b) }), A_); var g = gruppen[p.bel] = gruppen[p.bel] || { f: 0, kauf: 0, be: R.be, raeume: [] }; g.f += R.f; g.kauf += R.kauf; g.raeume.push(p.name); });
      Object.keys(gruppen).forEach(function (k) { var g = gruppen[k]; if (g.be.typ === "planke") out.push(pos("Trittschalldämmung (" + g.raeume.join(", ") + ")", g.f, "m²", 4.9)); out.push(pos(k + " liefern (" + g.raeume.join(", ") + ")", g.kauf, "m²", g.be.ep), pos(k + " verlegen", g.f, "m²", g.be.verl)); });
      var so = sum(A_.posten, function (p) { return Math.max(0, 2 * (num(p.l) + num(p.b)) - (+p.tu || 0) * 0.9); }), tu = sum(A_.posten, function (p) { return +p.tu || 0; });
      out.push(pos("Sockelleisten liefern und montieren", so, "m", 12.9));
      if (tu) out.push(pos("Übergangsprofile an Türen", tu, "Stk.", 34));
      return out;
    },
    scan: { label: "Raum scannen", text: "Raum wird gescannt … Handy langsam drehen" }
  };

  /* ---------- Trockenbau & Estrich ---------- */
  A.trockenbau = { titel: "Trockenbau & Estrich aufmessen", posten: "Bauteil", arten: ["Trennwand", "Vorsatzschale", "Abhangdecke", "Estrich"],
    felder: function (p) {
      var art = { k: "art", l: "Art", t: "sel", o: this.arten }, nm = { k: "name", l: "Bezeichnung", t: "txt" };
      if (p.art === "Estrich") return [art, nm, F("l", "Länge"), F("b", "Breite"), { k: "est", l: "Estrich", t: "sel", o: ["Zementestrich", "Calciumsulfat-Fließestrich", "Heizestrich (Zement)"] }, F("d", "Dicke", { min: 3, max: 10, st: 0.5, e: "cm" })];
      if (p.art === "Abhangdecke") return [art, nm, F("l", "Länge"), F("b", "Breite")];
      return [art, nm, F("l", "Länge"), F("h", "Höhe", { min: 1.5, max: 6 })].concat(p.art === "Trennwand" ? [{ k: "lagen", l: "Beplankung", t: "sel", o: ["einfach", "doppelt"] }, F("tu", "Türöffnungen", { min: 0, max: 3, st: 1, e: "" })] : []).concat([{ k: "daem", l: "Dämmung", t: "sel", o: ["ja", "nein"] }]);
    },
    einst: [],
    start: function () { return { e: {}, posten: [{ art: "Trennwand", name: "Wand Ankleide", l: 3.6, h: 2.55, lagen: "doppelt", tu: 1, daem: "ja" }, { art: "Vorsatzschale", name: "Installationswand Bad", l: 2.8, h: 2.55, daem: "ja" }, { art: "Abhangdecke", name: "Decke Flur", l: 4, b: 1.4 }, { art: "Estrich", name: "Estrich Anbau", l: 6, b: 4.5, est: "Heizestrich (Zement)", d: 6.5 }] }; },
    neu: function (art) { return { Trennwand: { art: "Trennwand", name: "Trennwand", l: 3, h: 2.5, lagen: "einfach", tu: 1, daem: "ja" }, Vorsatzschale: { art: "Vorsatzschale", name: "Vorsatzschale", l: 2.5, h: 2.5, daem: "ja" }, Abhangdecke: { art: "Abhangdecke", name: "Decke", l: 4, b: 3 }, Estrich: { art: "Estrich", name: "Estrich", l: 5, b: 4, est: "Zementestrich", d: 5 } }[art || "Trennwand"]; },
    ansichten: function (p) { return p.art === "Estrich" ? [["schnitt", "Schnitt"]] : p.art === "Abhangdecke" ? [["drauf", "Draufsicht"]] : [["ansicht", "Ansicht mit Ständern"]]; },
    _f: function (p) { if (p.art === "Estrich" || p.art === "Abhangdecke") return num(p.l) * num(p.b); return Math.max(0, num(p.l) * num(p.h) - (p.art === "Trennwand" ? (+p.tu || 0) * 1.01 * 2.135 : 0)); },
    _trocken: function (p) { var d = num(p.d); return /Zement/.test(p.est) ? (d <= 4 ? d : 4 + (d - 4) * 2) : Math.ceil(d * 0.7); },
    bild: function (id, p) {
      var f = this._f(p);
      if (p.art === "Estrich") { var d = num(p.d), s = 18, g = rc(30, 120, 300, 22, "gw-beton") + rc(30, 112, 300, 8, "gw-daemm") + rc(30, 112 - d * s * 0.35, 300, d * s * 0.35, "gw-estrich"); if (/Heiz/.test(p.est)) for (var i = 0; i < 10; i++) g += '<circle cx="' + (50 + i * 28) + '" cy="' + (112 - d * s * 0.12) + '" r="4" class="gw-rohr"/>'; return svgBox(360, 200, "Schnitt Estrich", g + rc(30, 60, 6, 82, "gw-daemm") + pf(345, 112 - d * s * 0.35, 345, 112, d + " cm", true, -10) + tx(180, 30, esc(p.est) + " · " + Z(f) + " m² · " + Z(f * d / 100) + " m³", "gw-titel") + tx(180, 172, "Belegreif nach ca. " + this._trocken(p) + " Wochen (Richtwert)") + tx(180, 188, "Vor dem Belag immer CM-Messung")); }
      if (p.art === "Abhangdecke") { var s2 = Math.min(300 / num(p.l), 160 / num(p.b)), g2 = rc(30, 50, num(p.l) * s2, num(p.b) * s2, "gw-gips"); for (var x = 0.5; x < num(p.l); x += 0.5) g2 += ln(30 + x * s2, 50, 30 + x * s2, 50 + num(p.b) * s2, "gw-linie"); return svgBox(360, 250, "Draufsicht Abhangdecke", g2 + pf(30, 40, 30 + num(p.l) * s2, 40, M(num(p.l))) + tx(180, 240, "CD-Profile alle 50 cm · " + Z(f) + " m²")); }
      var s3 = Math.min(320 / num(p.l), 180 / num(p.h)), x0 = 20, y0 = 230 - num(p.h) * s3, g3 = rc(x0, y0, num(p.l) * s3, num(p.h) * s3, "gw-gips") + rc(x0, y0, num(p.l) * s3, 5, "gw-rahmen") + rc(x0, 225, num(p.l) * s3, 5, "gw-rahmen");
      var st = auf(num(p.l) / 0.625) + 1; for (var k = 0; k < st; k++) g3 += rc(x0 + Math.min(num(p.l), k * 0.625) * s3 - 1.5, y0, 3, num(p.h) * s3, "gw-staender");
      for (var t = 0; t < (+p.tu || 0); t++) g3 += rc(x0 + (0.5 + t * 1.6) * s3, 230 - 2.135 * s3, 1.01 * s3, 2.135 * s3, "gw-tueroeff");
      return svgBox(360, 270, "Ansicht " + p.name, g3 + pf(x0, 250, x0 + num(p.l) * s3, 250, M(num(p.l)), false, -12) + tx(180, 18, st + " Ständer (Achsmaß 62,5 cm) · " + Z(f) + " m²" + (p.lagen ? " · " + p.lagen + " beplankt" : ""), "gw-titel"));
    },
    ergebnis: function (A_) {
      var self = this, z = A_.posten.map(function (p) { var f = self._f(p), platten = p.art === "Estrich" ? "–" : auf(f * (p.art === "Trennwand" ? 2 : 1) * (p.lagen === "doppelt" ? 2 : 1) * 1.05 / 2.5) + " Platten"; return [esc(p.name), esc(p.art), Z(f) + " m²", p.art === "Estrich" ? Z(f * num(p.d) / 100) + " m³ · " + self._trocken(p) + " Wo." : platten]; });
      return tab(["Bauteil", "Art", "Fläche", "Material"], z) + h.hin("Gipskartonplatten 1,25 × 2,00 m (2,5 m²) inkl. 5 % Verschnitt. Trocknungszeiten sind Richtwerte – vor dem Belag immer messen.");
    },
    positionen: function (A_) {
      var self = this, out = [];
      A_.posten.forEach(function (p) {
        var f = self._f(p);
        if (p.art === "Trennwand") { out.push(pos("Ständerwand CW 75, " + p.lagen + " beplankt, Q2 gespachtelt (" + p.name + ")", f, "m²", p.lagen === "doppelt" ? 72 : 54)); if (+p.tu) out.push(pos("Türöffnung mit UA-Profilen", +p.tu, "Stk.", 165)); }
        if (p.art === "Vorsatzschale") out.push(pos("Vorsatzschale, Q2 gespachtelt (" + p.name + ")", f, "m²", 49));
        if ((p.art === "Trennwand" || p.art === "Vorsatzschale") && p.daem === "ja") out.push(pos("Mineralwolle-Dämmung (" + p.name + ")", f, "m²", 8.5));
        if (p.art === "Abhangdecke") out.push(pos("Abhangdecke, Gipskarton auf CD-Profilen (" + p.name + ")", f, "m²", 56));
        if (p.art === "Estrich") { var d = num(p.d), ep = (/Fließ/.test(p.est) ? 27 + d * 2.1 : 24 + d * 1.8) + (/Heiz/.test(p.est) ? 4 : 0); out.push(pos("Randdämmstreifen", 2 * (num(p.l) + num(p.b)), "m", 2.8), pos("Trennlage / PE-Folie", f, "m²", 2.2), pos(p.est + ", " + Z1(d) + " cm (" + p.name + ")", f, "m²", ep), pos("Belegreife-Messung (CM-Messung)", 1, "Stk.", 69)); }
      });
      return out;
    }
  };

  /* ---------- Schreiner, Küche & Treppen ---------- */
  function treppe(p) {
    var gh = num(p.gh), n = Math.round(gh / 0.18), best = null;
    for (var k = n - 1; k <= n + 2; k++) { var s = gh / k, a = 0.63 - 2 * s, lauf = (k - 1) * a - (p.form === "viertelgewendelt" ? num(p.br) * 0.8 : 0); if (s >= 0.16 && s <= 0.2 && a >= 0.25) { var c = { n: k, s: s, a: a, lauf: lauf, passt: lauf <= num(p.lr) }; if (!best || (c.passt && !best.passt) || (c.passt === best.passt && Math.abs(s - 0.18) < Math.abs(best.s - 0.18))) best = c; } }
    return best || { n: n, s: gh / n, a: 0.63 - 2 * gh / n, lauf: (n - 1) * (0.63 - 2 * gh / n), passt: false };
  }
  var FRONT = { "Weiß matt": 1, "Eiche furniert": 1.35, "Lack Hochglanz": 1.25 };
  A.schreiner = { titel: "Schreinerarbeiten aufmessen", posten: "Möbel", arten: ["Einbauschrank", "Küche", "Treppe"],
    felder: function (p) {
      var art = { k: "art", l: "Art", t: "sel", o: this.arten }, nm = { k: "name", l: "Bezeichnung", t: "txt" };
      if (p.art === "Küche") return [art, nm, { k: "form", l: "Form", t: "sel", o: ["Zeile", "L-Form", "U-Form"] }, F("l1", "Länge Hauptzeile", { min: 1, max: 8 }), F("l2", "Länge Schenkel", { min: 0.6, max: 5 }), { k: "hs", l: "Hängeschränke", t: "sel", o: ["ja", "nein"] }, { k: "ap", l: "Arbeitsplatte", t: "sel", o: ["Schichtstoff", "Massivholz", "Keramik"] }, { k: "front", l: "Front", t: "sel", o: Object.keys(FRONT) }];
      if (p.art === "Treppe") return [art, nm, F("gh", "Geschosshöhe (Fußboden bis Fußboden)", { min: 2.2, max: 3.6 }), F("lr", "Verfügbare Lauflänge", { min: 1.5, max: 6 }), F("br", "Laufbreite", { min: 0.7, max: 1.4 }), { k: "form", l: "Form", t: "sel", o: ["gerade", "viertelgewendelt"] }, { k: "holz", l: "Holz", t: "sel", o: ["Buche", "Eiche"] }];
      return [art, nm, F("b", "Nischenbreite", { min: 0.4, max: 6 }), F("h", "Höhe", { min: 0.5, max: 3 }), F("t", "Tiefe", { min: 0.3, max: 0.8 }), F("tue", "Türen", { min: 1, max: 10, st: 1, e: "" }), F("fa", "Fachböden je Tür", { min: 0, max: 8, st: 1, e: "" }), { k: "front", l: "Front", t: "sel", o: Object.keys(FRONT) }];
    },
    einst: [],
    start: function () { return { e: {}, posten: [{ art: "Einbauschrank", name: "Schrank Dachschräge", b: 2.4, h: 2.3, t: 0.6, tue: 4, fa: 4, front: "Weiß matt" }, { art: "Küche", name: "Küche", form: "L-Form", l1: 3.6, l2: 2.2, hs: "ja", ap: "Massivholz", front: "Lack Hochglanz" }, { art: "Treppe", name: "Treppe ins DG", gh: 2.75, lr: 3.4, br: 0.9, form: "gerade", holz: "Eiche" }] }; },
    neu: function (art) { return { Einbauschrank: { art: "Einbauschrank", name: "Schrank", b: 2, h: 2.4, t: 0.6, tue: 3, fa: 4, front: "Weiß matt" }, "Küche": { art: "Küche", name: "Küche", form: "Zeile", l1: 3, l2: 1.8, hs: "ja", ap: "Schichtstoff", front: "Weiß matt" }, Treppe: { art: "Treppe", name: "Treppe", gh: 2.7, lr: 3.5, br: 0.9, form: "gerade", holz: "Buche" } }[art || "Einbauschrank"]; },
    ansichten: function (p) { return p.art === "Treppe" ? [["seite", "Seitenansicht"]] : p.art === "Küche" ? [["drauf", "Draufsicht"]] : [["front", "Frontansicht"]]; },
    _lfm: function (p) { var u = num(p.l1) + (p.form !== "Zeile" ? num(p.l2) - 0.6 : 0) + (p.form === "U-Form" ? num(p.l2) - 0.6 : 0); return u; },
    bild: function (id, p) {
      if (p.art === "Treppe") {
        var T = treppe(p), s = Math.min(300 / Math.max(T.lauf + T.a, num(p.lr)), 190 / num(p.gh)), x0 = 30, y0 = 230, g = rc(x0, y0, Math.max(num(p.lr), T.lauf + T.a) * s + 10, 6, "gw-beton") + rc(x0 + num(p.lr) * s, y0 - num(p.gh) * s - 6, 60, 6, "gw-beton");
        for (var i = 0; i < T.n - 1; i++) g += rc(x0 + i * T.a * s, y0 - (i + 1) * T.s * s, T.a * s + 4, 5, "gw-holz");
        g += ln(x0, y0 - 2, x0 + (T.n - 1) * T.a * s, y0 - (T.n - 1) * T.s * s - 2, "gw-linie") + pf(x0, 250, x0 + T.lauf * s, 250, "Lauflänge " + M(T.lauf), false, -12) + pf(x0 + num(p.lr) * s + 70, y0 - num(p.gh) * s, x0 + num(p.lr) * s + 70, y0, M(num(p.gh)), true, -10);
        return svgBox(360, 270, "Treppe Seitenansicht", g + tx(180, 18, T.n + " Steigungen à " + CM(T.s) + " · Auftritt " + CM(T.a) + " · Schrittmaß 63 cm", "gw-titel"));
      }
      if (p.art === "Küche") {
        var s2 = 240 / Math.max(num(p.l1), num(p.l2) + 0.6, 1), g2 = rc(40, 40, num(p.l1) * s2, 0.6 * s2, "gw-holz");
        if (p.form !== "Zeile") g2 += rc(40, 40 + 0.6 * s2, 0.6 * s2, (num(p.l2) - 0.6) * s2, "gw-holz");
        if (p.form === "U-Form") g2 += rc(40 + (num(p.l1) - 0.6) * s2, 40 + 0.6 * s2, 0.6 * s2, (num(p.l2) - 0.6) * s2, "gw-holz");
        g2 += rc(40 + num(p.l1) * s2 * 0.45, 46, 0.5 * s2, 0.42 * s2, "gw-objekt") + tx(40 + num(p.l1) * s2 * 0.45 + 0.25 * s2, 46 + 0.25 * s2, "Spüle") + rc(40 + num(p.l1) * s2 * 0.75, 46, 0.6 * s2, 0.48 * s2, "gw-glut") + tx(40 + num(p.l1) * s2 * 0.75 + 0.3 * s2, 46 + 0.28 * s2, "Kochfeld");
        return svgBox(360, 260, "Küche Draufsicht", g2 + pf(40, 28, 40 + num(p.l1) * s2, 28, M(num(p.l1))) + tx(180, 248, esc(p.form) + " · " + Z1(this._lfm(p)) + " lfm Unterschränke · Platte " + esc(p.ap)));
      }
      var s3 = Math.min(300 / num(p.b), 200 / num(p.h)), x = 180 - num(p.b) * s3 / 2, y = 230 - num(p.h) * s3, tw = num(p.b) * s3 / (+p.tue || 1), g3 = "";
      for (var j = 0; j < (+p.tue || 1); j++) { g3 += rc(x + j * tw + 1, y, tw - 2, num(p.h) * s3, "gw-front" + (p.front === "Eiche furniert" ? " gw-holz" : "")) + rc(x + j * tw + (j % 2 ? 8 : tw - 12), y + num(p.h) * s3 * 0.45, 4, 26, "gw-griff"); }
      return svgBox(360, 270, "Schrank Frontansicht", g3 + ln(20, 230, 340, 230, "gw-boden") + pf(x, 250, x + num(p.b) * s3, 250, M(num(p.b)), false, -12) + pf(x - 14, y, x - 14, 230, M(num(p.h)), true) + tx(180, 18, (+p.tue) + " Türen · " + (+p.fa) + " Fachböden je Tür · " + esc(p.front), "gw-titel"));
    },
    ergebnis: function (A_) {
      var self = this;
      return tab(["Möbel", "Art", "Maße", "Hinweis"], A_.posten.map(function (p) {
        if (p.art === "Treppe") { var T = treppe(p); return [esc(p.name), "Treppe", T.n + " × " + CM(T.s) + " / " + CM(T.a), T.passt ? '<span class="gw-ok-t">passt</span>' : '<span class="gw-warn-t">Lauflänge ' + M(T.lauf) + " – zu wenig Platz, gewendelt prüfen</span>"]; }
        if (p.art === "Küche") return [esc(p.name), "Küche " + esc(p.form), Z1(self._lfm(p)) + " lfm", esc(p.ap)];
        return [esc(p.name), "Einbauschrank", M(num(p.b)) + " × " + M(num(p.h)) + " × " + CM(num(p.t)), esc(p.front)];
      })) + h.hin("Treppe: Schrittmaßregel 2 Steigungen + 1 Auftritt = 63 cm. Bauordnung (Steigung, Auftritt, Geländer) des Bundeslands beachten.");
    },
    positionen: function (A_) {
      var self = this, out = [];
      A_.posten.forEach(function (p) {
        if (p.art === "Einbauschrank") out.push(pos("Einbauschrank nach Maß, " + M(num(p.b)) + " × " + M(num(p.h)) + ", " + p.tue + " Türen, Front " + p.front + " (" + p.name + ")", num(p.b), "lfm", 1450 * (num(p.h) / 2.4) * (FRONT[p.front] || 1)), pos("Lieferung und Montage (" + p.name + ")", 1, "psch", 390));
        if (p.art === "Küche") { var l = self._lfm(p); out.push(pos("Unterschränke, Front " + p.front, l, "lfm", 1150 * (FRONT[p.front] || 1))); if (p.hs === "ja") out.push(pos("Hängeschränke", l * 0.6, "lfm", 690 * (FRONT[p.front] || 1))); out.push(pos("Arbeitsplatte " + p.ap, l, "lfm", { Schichtstoff: 180, Massivholz: 390, Keramik: 690 }[p.ap]), pos("Lieferung und Montage Küche (Anschlüsse Sanitär/Elektro separat)", 1, "psch", 1290)); }
        if (p.art === "Treppe") { var T = treppe(p); out.push(pos("Holztreppe " + p.form + ", " + p.holz + ", " + T.n + " Steigungen, Laufbreite " + CM(num(p.br)), T.n - 1, "Stufen", p.holz === "Eiche" ? 440 : 360), pos("Geländer mit Handlauf", Math.max(T.lauf, 1), "m", 290), pos("Montage Treppe", 1, "psch", 980)); }
      });
      return out;
    }
  };

  /* ---------- Dach & Spengler ---------- */
  var EIND = { Betondachstein: [10, 38, 22], Tondachziegel: [12, 47, 22], Biberschwanz: [36, 79, 30] };   // Stück/m², €/m², Regeldachneigung
  function dach(p) {
    var n = rad(num(p.n)), c = Math.cos(n), ue = num(p.ue), L = num(p.l) + 2 * ue, B = num(p.b) + 2 * ue, s, Fl, first, ortgang = 0, traufe, grat = 0;
    if (p.form === "Pultdach") { s = B / c; Fl = L * s; first = L; ortgang = 2 * s; traufe = L; }
    else if (p.form === "Walmdach") { s = B / 2 / c; Fl = L * B / c; first = Math.max(0, L - B); traufe = 2 * (L + B); grat = 4 * Math.sqrt(2 * Math.pow(B / 2, 2) + Math.pow(B / 2 * Math.tan(n), 2)); }
    else { s = B / 2 / c; Fl = 2 * L * s; first = L; ortgang = 4 * s; traufe = 2 * L; }
    return { s: s, F: Fl, first: first, ortgang: ortgang, traufe: traufe, grat: grat, fallrohre: Math.max(2, auf(traufe / 10)), geruest: 2 * (num(p.l) + num(p.b)) * (num(p.th) + 1), L: L, B: B };
  }
  A.dach = { titel: "Dach aufmessen", posten: "Dach",
    felder: function () { return [{ k: "name", l: "Gebäude", t: "txt" }, { k: "form", l: "Dachform", t: "sel", o: ["Satteldach", "Pultdach", "Walmdach"] }, F("l", "Hauslänge (Traufe)", { min: 3, max: 40 }), F("b", "Hausbreite", { min: 3, max: 25 }), F("n", "Neigung", { min: 5, max: 60, st: 1, e: "°" }), F("ue", "Dachüberstand", { min: 0, max: 1.2 }), F("th", "Traufhöhe", { min: 2, max: 15 }), { k: "ein", l: "Eindeckung", t: "sel", o: Object.keys(EIND) }, F("df", "Dachfenster", { min: 0, max: 8, st: 1, e: "" })]; },
    einst: [{ k: "alt", l: "Bestand", t: "sel", o: ["alte Eindeckung abnehmen", "Neubau"] }, { k: "daem", l: "Dämmung", t: "sel", o: ["keine", "Zwischensparren", "Aufsparren"] }, { k: "rinne", l: "Rinne und Fallrohre", t: "sel", o: ["Titanzink", "Kupfer"] }],
    start: function () { return { e: { alt: "alte Eindeckung abnehmen", daem: "Zwischensparren", rinne: "Titanzink" }, posten: [{ name: "Wohnhaus", form: "Satteldach", l: 11.5, b: 9, n: 38, ue: 0.5, th: 5.8, ein: "Tondachziegel", df: 2 }, { name: "Garage", form: "Pultdach", l: 6.5, b: 3.4, n: 12, ue: 0.3, th: 2.6, ein: "Betondachstein", df: 0 }] }; },
    neu: function () { return { name: "Dach", form: "Satteldach", l: 10, b: 8, n: 35, ue: 0.4, th: 5.5, ein: "Tondachziegel", df: 0 }; },
    ansichten: function () { return [["drauf", "Draufsicht"], ["giebel", "Giebelansicht"]]; },
    scan: { label: "Dach aus Luftbild messen", text: "Dach wird aus dem Luftbild vermessen …", run: function (p) { p.l = Math.round((num(p.l) + 0.08) * 100) / 100; p.b = Math.round((num(p.b) - 0.04) * 100) / 100; p.n = 37; return "Gemessen (Simulation): " + M(p.l) + " × " + M(p.b) + ", Neigung 37°"; } },
    bild: function (id, p) {
      var d = dach(p);
      if (id === "giebel") {
        var s = Math.min(300 / d.B, 150 / (num(p.th) + d.B / 2 * Math.tan(rad(num(p.n))))), x0 = 180 - num(p.b) * s / 2, yT = 240 - num(p.th) * s, g = rc(x0, yT, num(p.b) * s, num(p.th) * s, "gw-haus");
        if (p.form === "Pultdach") g += poly([[x0 - num(p.ue) * s, yT], [x0 + (num(p.b) + num(p.ue)) * s, yT], [x0 - num(p.ue) * s, yT - d.B * Math.tan(rad(num(p.n))) * s]], "gw-dach");
        else g += poly([[x0 - num(p.ue) * s, yT], [x0 + (num(p.b) + num(p.ue)) * s, yT], [180, yT - d.B / 2 * Math.tan(rad(num(p.n))) * s]], "gw-dach");
        return svgBox(360, 270, "Giebelansicht", g + ln(20, 240, 340, 240, "gw-boden") + pf(x0, 258, x0 + num(p.b) * s, 258, M(num(p.b)), false, -12) + pf(x0 - 24, yT, x0 - 24, 240, M(num(p.th)), true) + tx(180, 18, "Neigung " + p.n + "° · Sparrenlänge " + M(d.s), "gw-titel"));
      }
      var s2 = Math.min(310 / d.L, 200 / d.B), x = 180 - d.L * s2 / 2, y = 135 - d.B * s2 / 2, g2 = "";
      if (p.form === "Walmdach") { var k = d.B / 2 * s2; g2 += poly([[x, y], [x + d.L * s2, y], [x + d.L * s2 - k, y + k], [x + k, y + k]], "gw-dach") + poly([[x, y + d.B * s2], [x + d.L * s2, y + d.B * s2], [x + d.L * s2 - k, y + k], [x + k, y + k]], "gw-dach2") + poly([[x, y], [x + k, y + k], [x, y + d.B * s2]], "gw-dach2") + poly([[x + d.L * s2, y], [x + d.L * s2 - k, y + k], [x + d.L * s2, y + d.B * s2]], "gw-dach"); }
      else if (p.form === "Pultdach") g2 += rc(x, y, d.L * s2, d.B * s2, "gw-dach");
      else g2 += rc(x, y, d.L * s2, d.B * s2 / 2, "gw-dach") + rc(x, y + d.B * s2 / 2, d.L * s2, d.B * s2 / 2, "gw-dach2") + ln(x, y + d.B * s2 / 2, x + d.L * s2, y + d.B * s2 / 2, "gw-first");
      for (var i = 0; i < (+p.df || 0); i++) g2 += rc(x + (0.2 + i * 0.25) * d.L * s2, y + d.B * s2 * 0.62, 0.78 * s2, 1.18 * s2, "gw-glas");
      return svgBox(360, 270, "Draufsicht Dach", g2 + pf(x, y - 14, x + d.L * s2, y - 14, M(d.L)) + pf(x - 14, y, x - 14, y + d.B * s2, M(d.B), true) + tx(180, 262, Z(d.F) + " m² Dachfläche · First " + M(d.first) + (d.grat ? " · Grate " + M(d.grat) : "") + " · Traufe " + M(d.traufe)));
    },
    ergebnis: function (A_) {
      var z = A_.posten.map(function (p) { var d = dach(p), e = EIND[p.ein]; return [esc(p.name), esc(p.form) + ", " + p.n + "°", Z(d.F) + " m²", Z0(d.F * e[0] * 1.05) + " " + esc(p.ein), M(d.traufe)]; });
      var warn = A_.posten.filter(function (p) { return num(p.n) < EIND[p.ein][2]; }).map(function (p) { return h.warn(p.name + ": " + p.n + "° liegt unter der Regeldachneigung für " + p.ein + " (" + EIND[p.ein][2] + "°) – Zusatzmaßnahmen nötig (z. B. regensicheres Unterdach)."); }).join("");
      return tab(["Dach", "Form", "Fläche", "Steine (+5 %)", "Rinne"], z, ["Gesamt", "", Z(sum(A_.posten, function (p) { return dach(p).F; })) + " m²", "", M(sum(A_.posten, function (p) { return dach(p).traufe; }))]) + warn +
        mat("Spengler", ["Dachrinne " + A_.e.rinne + " " + M(sum(A_.posten, function (p) { return dach(p).traufe; })), sum(A_.posten, function (p) { return dach(p).fallrohre; }) + " Fallrohre", "Gerüst ca. " + Z0(sum(A_.posten, function (p) { return dach(p).geruest; })) + " m²"]);
    },
    positionen: function (A_) {
      var out = [], Fl = sum(A_.posten, function (p) { return dach(p).F; });
      out.push(pos("Gerüst stellen und 4 Wochen vorhalten", sum(A_.posten, function (p) { return dach(p).geruest; }), "m²", 9.8));
      if (A_.e.alt !== "Neubau") out.push(pos("Alte Eindeckung abnehmen und entsorgen", Fl, "m²", 16));
      if (A_.e.daem !== "keine") out.push(pos("Dämmung " + A_.e.daem + " (WLS 035)", Fl, "m²", A_.e.daem === "Aufsparren" ? 98 : 46));
      out.push(pos("Unterdeckbahn diffusionsoffen", Fl, "m²", 8.5), pos("Konter- und Traglattung", Fl, "m²", 13.5));
      A_.posten.forEach(function (p) { var d = dach(p); out.push(pos("Eindeckung " + p.ein + " (" + p.name + ")", d.F, "m²", EIND[p.ein][1])); if (d.first) out.push(pos((p.form === "Pultdach" ? "Pultabschluss" : "First mit Lüfterelementen") + " (" + p.name + ")", d.first, "m", 52)); if (d.grat) out.push(pos("Grat (" + p.name + ")", d.grat, "m", 58)); if (d.ortgang) out.push(pos("Ortgang (" + p.name + ")", d.ortgang, "m", 42)); if (+p.df) out.push(pos("Dachfenster einbauen inkl. Eindeckrahmen (" + p.name + ")", +p.df, "Stk.", 1450)); });
      var ku = A_.e.rinne === "Kupfer";
      out.push(pos("Dachrinne " + A_.e.rinne, sum(A_.posten, function (p) { return dach(p).traufe; }), "m", ku ? 115 : 58), pos("Fallrohr inkl. Bögen und Anschluss", sum(A_.posten, function (p) { return dach(p).fallrohre; }), "Stk.", ku ? 480 : 240));
      return out;
    }
  };

  /* ---------- Fenster, Türen & Tore ---------- */
  var ARTEN_F = ["Fenster 1-flügelig", "Fenster 2-flügelig", "Balkontür", "Festverglasung", "Haustür", "Nebeneingangstür", "Garagentor (Sektional)"];
  var istTuerTor = function (a) { return /Haustür|Nebeneingang|Garagentor/.test(a); };
  function fPreis(p) {
    var m2 = num(p.b) * num(p.h), mf = { Kunststoff: 1, Holz: 1.45, "Holz-Alu": 1.75, Aluminium: 1.6 }[p.mat] || 1;
    if (p.art === "Garagentor (Sektional)") return 2250 + 490;
    if (p.art === "Nebeneingangstür") return { Kunststoff: 1450, Holz: 1900, "Holz-Alu": 2200, Aluminium: 2200 }[p.mat] || 1450;
    var base = (160 + 380 * m2) * mf * (/2-fach/.test(p.glas) ? 0.9 : 1);
    return base * ({ "Balkontür": 1.15, Festverglasung: 0.75, "Fenster 2-flügelig": 1.1 }[p.art] || 1);
  }
  A.fenster = { titel: "Fenster & Türen aufmessen", posten: "Element", arten: ARTEN_F,
    felder: function (p) {
      var f = [{ k: "art", l: "Art", t: "sel", o: ARTEN_F }, { k: "name", l: "Raum / Position", t: "txt" }, F("b", "Breite Maueröffnung", { min: 0.3, max: 6 }), F("h", "Höhe Maueröffnung", { min: 0.3, max: 3.5 }), F("anz", "Anzahl gleiche", { min: 1, max: 30, st: 1, e: "" })];
      if (p.art === "Haustür" || p.art === "Garagentor (Sektional)") return f;
      f.push({ k: "mat", l: "Material", t: "sel", o: ["Kunststoff", "Holz", "Holz-Alu", "Aluminium"] });
      if (p.art !== "Nebeneingangstür") f.push({ k: "glas", l: "Verglasung", t: "sel", o: ["3-fach (Uw ca. 0,9)", "2-fach (Uw ca. 1,3)"] });
      if (p.art === "Fenster 1-flügelig" || p.art === "Balkontür") f.push({ k: "ans", l: "Anschlag", t: "sel", o: ["DK links", "DK rechts"] });
      return f;
    },
    einst: [F("fuge", "Montagefuge je Seite", { min: 5, max: 30, st: 1, e: "mm" }), { k: "alt", l: "Bestand", t: "sel", o: ["Altfenster ausbauen und entsorgen", "Neubau"] }, { k: "ral", l: "Montage", t: "sel", o: ["RAL-Montage mit Fugenbändern", "Standard"] }, { k: "fb", l: "Fensterbänke innen", t: "sel", o: JA }],
    start: function () { return { e: { fuge: 15, alt: "Altfenster ausbauen und entsorgen", ral: "RAL-Montage mit Fugenbändern", fb: "ja" }, posten: [
      { art: "Fenster 2-flügelig", name: "Wohnzimmer", b: 1.76, h: 1.38, anz: 2, mat: "Kunststoff", glas: "3-fach (Uw ca. 0,9)" }, { art: "Balkontür", name: "Wohnzimmer", b: 1.01, h: 2.135, anz: 1, mat: "Kunststoff", glas: "3-fach (Uw ca. 0,9)", ans: "DK rechts" },
      { art: "Fenster 1-flügelig", name: "Bad", b: 0.885, h: 1.01, anz: 1, mat: "Kunststoff", glas: "3-fach (Uw ca. 0,9)", ans: "DK links" },
      Object.assign({ art: "Haustür", name: "Eingang", anz: 1 }, P.haustuer.start(), { b: 1.135, h: 2.135 }), { art: "Garagentor (Sektional)", name: "Garage", b: 2.5, h: 2.125, anz: 1 }] }; },
    neu: function () { return { art: "Fenster 1-flügelig", name: "Raum", b: 1.01, h: 1.26, anz: 1, mat: "Kunststoff", glas: "3-fach (Uw ca. 0,9)", ans: "DK links" }; },
    ansichten: function () { return [["ansicht", "Ansicht"], ["liste", "Bestellliste"], ["foto", "Foto-Aufmaß"]]; },
    produkte: function (p) { return p.art === "Haustür" ? ["haustuer"] : []; },
    ziel: { haustuer: "p" },
    scan: { label: "Foto-Aufmaß", text: "Maße werden aus dem Foto berechnet …", run: function (p) { p.b = Math.round((num(p.b) + 0.004) * 1000) / 1000; p.h = Math.round((num(p.h) - 0.003) * 1000) / 1000; return "Aus dem Foto gemessen (Simulation): " + MM(p.b) + " × " + MM(p.h) + " mm"; } },
    bild: function (id, p, A_) {
      var fu = (+A_.e.fuge || 15) / 1000;
      if (id === "liste") return '<div class="gw-liste">' + tab(["Pos.", "Raum", "Art", "Maueröffnung", "Bestellmaß", "Ausführung", "Stk."], A_.posten.map(function (q, i) { return [(i + 1) + "", esc(q.name), esc(q.art), MM(q.b) + " × " + MM(q.h), MM(num(q.b) - 2 * fu) + " × " + MM(num(q.h) - (istTuerTor(q.art) ? fu : 2 * fu)), esc([q.mat, (q.glas || "").split(" (")[0], q.ans].filter(Boolean).join(", ")), (q.anz || 1) + ""]; })) + "</div>";
      if (p.art === "Haustür") return P.haustuer.zeichnung(Object.assign(P.haustuer.start(), p));
      if (id === "foto") return svgBox(360, 270, "Foto-Aufmaß", rc(0, 0, 360, 270, "gw-fotowand") + rc(90, 50, 180, 170, "gw-rahmen") + rc(100, 60, 160, 150, "gw-glas") + '<g class="am-foto-mass">' + ln(90, 236, 270, 236, "") + tx(180, 252, MM(p.b) + " mm", "") + ln(286, 50, 286, 220, "") + tx(300, 140, MM(p.h), "", "start") + "</g>" + tx(10, 18, "Illustration · Kanten antippen, Maß wird berechnet", "am-foto-hinweis", "start"));
      var s = Math.min(300 / num(p.b), 190 / num(p.h)), x = 180 - num(p.b) * s / 2, y = 225 - num(p.h) * s, w = num(p.b) * s, hh = num(p.h) * s, g = rc(x, y, w, hh, "gw-rahmen");
      if (p.art === "Garagentor (Sektional)") { g += rc(x + 5, y + 5, w - 10, hh - 5, "gw-tor"); for (var i = 1; i < 4; i++) g += ln(x + 5, y + 5 + i * (hh - 5) / 4, x + w - 5, y + 5 + i * (hh - 5) / 4, "gw-linie"); }
      else if (p.art === "Nebeneingangstür") g += rc(x + 5, y + 5, w - 10, hh - 5, "gw-tuer") + rc(x + w - 18, y + hh * 0.48, 5, 18, "gw-griff");
      else { var fl = p.art === "Fenster 2-flügelig" ? 2 : 1; for (var k = 0; k < fl; k++) { var fx = x + 6 + k * (w - 12) / fl, fw = (w - 12) / fl; g += rc(fx + 2, y + 6, fw - 4, hh - 12, "gw-glas"); if (p.art !== "Festverglasung") { var links = fl === 2 ? k === 0 : p.ans === "DK links"; g += poly([[links ? fx + fw - 4 : fx + 4, y + 8], [links ? fx + 4 : fx + fw - 4, y + hh / 2], [links ? fx + fw - 4 : fx + 4, y + hh - 8]], "gw-oeffnung") + poly([[fx + 4, y + hh - 8], [fx + fw / 2, y + 8], [fx + fw - 4, y + hh - 8]], "gw-oeffnung gw-kipp"); } } }
      return svgBox(360, 270, "Ansicht " + p.art, g + pf(x, 245, x + w, 245, MM(p.b) + " mm", false, -12) + pf(x - 14, y, x - 14, 225, MM(p.h) + " mm", true) + tx(180, 18, esc(p.art) + (p.anz > 1 ? " · " + p.anz + " Stück" : "") + " · Bestellmaß " + MM(num(p.b) - 2 * fu) + " × " + MM(num(p.h) - (istTuerTor(p.art) ? fu : 2 * fu)) + " · von innen", "gw-titel"));
    },
    ergebnis: function (A_) {
      var n = sum(A_.posten, function (p) { return +p.anz || 1; }), zwei = A_.posten.filter(function (p) { return /2-fach/.test(p.glas || ""); });
      return '<div class="gw-kacheln"><div><b>' + n + "</b><span>Elemente</span></div><div><b>" + Z(sum(A_.posten, function (p) { return num(p.b) * num(p.h) * (+p.anz || 1); })) + " m²</b><span>Fläche gesamt</span></div><div><b>" + (+A_.e.fuge || 15) + " mm</b><span>Fuge je Seite</span></div></div>" +
        (zwei.length ? h.warn("2-fach-Verglasung: Beim Austausch fordert das GEG für Fenster Uw höchstens 1,3 W/(m²K) – Herstellerwert prüfen.") : h.ok("3-fach-Verglasung erfüllt die GEG-Anforderung beim Austausch.")) + h.hin("Bestellmaß = Maueröffnung minus Montagefuge (Türen und Tore unten ohne Fuge).");
    },
    positionen: function (A_) {
      var fu = (+A_.e.fuge || 15) / 1000, out = [], fen = 0, tue = 0, fb = 0;
      A_.posten.forEach(function (p) {
        var anz = +p.anz || 1;
        if (p.art === "Haustür") { out = out.concat(P.haustuer.preis(Object.assign(P.haustuer.start(), p)).filter(function (x) { return !/Montage|ausbauen/.test(x.text); })); tue += anz; return; }
        out.push(pos(p.art + (p.mat ? " " + p.mat : "") + (p.glas ? ", " + p.glas.split(" (")[0] : "") + (p.ans ? ", " + p.ans : "") + ", Bestellmaß " + MM(num(p.b) - 2 * fu) + " × " + MM(num(p.h) - (istTuerTor(p.art) ? fu : 2 * fu)) + " mm (" + p.name + ")", anz, "Stk.", fPreis(p)));
        if (istTuerTor(p.art)) tue += anz; else { fen += anz; if (p.art !== "Balkontür") fb += num(p.b) * anz; }
      });
      if (A_.e.alt !== "Neubau") out.push(pos("Altfenster und -türen ausbauen und entsorgen", fen + tue, "Stk.", 70));
      if (fen) out.push(pos("Montage Fenster" + (/RAL/.test(A_.e.ral) ? " nach RAL mit Fugenbändern" : ""), fen, "Stk.", /RAL/.test(A_.e.ral) ? 210 : 165));
      if (tue) out.push(pos("Montage Türen und Tore", tue, "Stk.", 480));
      if (A_.e.fb === "ja" && fb) out.push(pos("Fensterbänke innen, Kunststein", fb, "m", 49));
      return out;
    }
  };

  /* ---------- Sonnenschutz & Terrassendach ---------- */
  var PROD_ART = { Raffstore: "raffstore", Insektenschutz: "insektenschutz", Plissee: "plissee" };
  A.sonnenschutz = { titel: "Sonnenschutz & Terrassendach planen", posten: "Element", arten: ["Terrassendach", "Markise", "Rollladen", "Raffstore", "Insektenschutz", "Plissee"],
    felder: function (p) {
      var art = { k: "art", l: "Art", t: "sel", o: this.arten }, nm = { k: "name", l: "Position", t: "txt" };
      if (p.art === "Terrassendach") return [art, nm].concat(P.terrassendach.masse);
      if (p.art === "Markise") return [art, nm].concat(P.markise.masse);
      if (PROD_ART[p.art]) { var pr = P[PROD_ART[p.art]]; return [art, nm].concat(pr.masse, [F("anz", "Anzahl gleiche", { min: 1, max: 30, st: 1, e: "" })], pr.optionen.filter(function (o) { return o.t === "sel"; })); }
      return [art, nm, F("b", "Lichtmaß Breite", { min: 0.4, max: 5 }), F("h", "Lichtmaß Höhe", { min: 0.4, max: 3.5 }), F("anz", "Anzahl gleiche", { min: 1, max: 30, st: 1, e: "" })].concat(p.art === "Rollladen" ? [{ k: "kasten", l: "Kasten", t: "sel", o: ["Vorbau", "Aufsatz"] }, { k: "an", l: "Antrieb", t: "sel", o: ["Gurt", "Motor", "Motor mit App"] }] : [{ k: "an", l: "Antrieb", t: "sel", o: ["Motor", "Motor mit App"] }]);
    },
    einst: [],
    start: function () { return { e: {}, posten: [Object.assign({ art: "Terrassendach", name: "Terrasse Süd" }, P.terrassendach.start()), Object.assign({ art: "Markise", name: "Balkon OG" }, P.markise.start(), { b: 3.5, a: 2.5 }), { art: "Rollladen", name: "Schlafzimmer", b: 1.26, h: 1.38, anz: 2, kasten: "Vorbau", an: "Motor mit App" }, Object.assign({ art: "Raffstore", name: "Wohnzimmer Süd", anz: 1 }, P.raffstore.start(), { b: 2.4, h: 2.2 }), Object.assign({ art: "Insektenschutz", name: "Küche und Bad", anz: 2 }, P.insektenschutz.start(), { b: 0.9, h: 1.1 }), Object.assign({ art: "Plissee", name: "Kinderzimmer", anz: 2 }, P.plissee.start())] }; },
    neu: function (art) { if (PROD_ART[art]) return Object.assign({ art: art, name: "Fenster", anz: 1 }, P[PROD_ART[art]].start()); if (art === "Terrassendach") return Object.assign({ art: art, name: "Terrasse" }, P.terrassendach.start()); if (art === "Markise") return Object.assign({ art: art, name: "Markise" }, P.markise.start()); return { art: art || "Rollladen", name: "Fenster", b: 1.2, h: 1.3, anz: 1, kasten: "Vorbau", an: "Motor" }; },
    ansichten: function (p) { return p.art === "Terrassendach" || p.art === "Markise" ? [["zeichnung", "Zeichnung"], ["garten", "Im Grundriss"]] : [["ansicht", "Ansicht"]]; },
    produkte: function (p) { return p.art === "Terrassendach" ? ["terrassendach"] : p.art === "Markise" ? ["markise"] : PROD_ART[p.art] ? [PROD_ART[p.art]] : []; },
    ziel: { terrassendach: "p", markise: "p", raffstore: "p", insektenschutz: "p", plissee: "p" },
    bild: function (id, p, A_) {
      if (id === "garten" && (p.art === "Terrassendach" || p.art === "Markise")) {   // Draufsicht: Haus, Terrasse, Produkt
        var b = num(p.b), t = num(p.art === "Markise" ? p.a : p.t), s = Math.min(240 / (b + 2), 150 / (t + 1.5)), hx = 30, hy = 30, hw = 300, x0 = 180 - b * s / 2, y0 = hy + 60, g = rc(hx, hy, hw, 60, "gw-haus") + tx(180, hy + 36, "Wohnhaus", "gw-titel") + rc(20, y0, 320, 190, "gw-rasen") + rc(x0 - 0.5 * s, y0, (b + 1) * s, (t + 0.4) * s, "gw-pflaster");
        if (p.art === "Terrassendach") { var d = P.terrassendach.daten(p); g += rc(x0, y0, b * s, t * s, "gw-glasdach"); for (var i = 0; i <= d.felder; i++) g += ln(x0 + b * s * i / d.felder, y0, x0 + b * s * i / d.felder, y0 + t * s, "gw-sparren"); for (var k = 0; k < d.stuetzen; k++) g += rc(x0 + (b * s - 8) * k / (d.stuetzen - 1), y0 + t * s - 8, 8, 8, "gw-rahmen"); if (p.front === "Glasschiebewand") g += rc(x0, y0 + t * s - 2, b * s, 4, "gw-glas"); if (p.seite === "Glasschiebewände") g += rc(x0 - 2, y0, 4, t * s, "gw-glas") + rc(x0 + b * s - 2, y0, 4, t * s, "gw-glas"); }
        else g += rc(x0, y0, b * s, t * s, "gw-stoff");
        g += rc(x0 + b * s * 0.25, y0 + t * s * 0.35, b * s * 0.5, t * s * 0.3, "gw-moebel") + tx(x0 + b * s / 2, y0 + t * s * 0.53, "Tisch");
        return svgBox(360, 290, "Draufsicht Terrasse", g + pf(x0, y0 + t * s + 20, x0 + b * s, y0 + t * s + 20, M(b), false, -12) + pf(x0 + b * s + 18, y0, x0 + b * s + 18, y0 + t * s, M(t), true, -10));
      }
      if (p.art === "Terrassendach") return P.terrassendach.zeichnung(p);
      if (p.art === "Markise") return P.markise.zeichnung(p);
      if (PROD_ART[p.art]) { var pr2 = P[PROD_ART[p.art]]; return pr2.zeichnung(Object.assign(pr2.start(), p)); }
      var s2 = Math.min(280 / num(p.b), 170 / num(p.h)), x = 180 - num(p.b) * s2 / 2, y = 60, w = num(p.b) * s2, hh = num(p.h) * s2, g2 = rc(x - 10, y - 10, w + 20, hh + 20, "gw-haus") + rc(x, y, w, hh, "gw-glas");
      var zu = 0.55; if (p.art === "Raffstore") { for (var j = 0; j < hh * zu / 6; j++) g2 += rc(x, y + j * 6, w, 4, "gw-lamelle"); g2 += rc(x - 4, y - 12, w + 8, 10, "gw-rahmen"); }
      else { g2 += rc(x, y, w, hh * zu, "gw-panzer"); for (var q = 1; q < hh * zu / 7; q++) g2 += ln(x, y + q * 7, x + w, y + q * 7, "gw-linie"); g2 += p.kasten === "Vorbau" ? rc(x - 6, y - 24, w + 12, 22, "gw-rahmen") : rc(x - 10, y - 32, w + 20, 22, "gw-kasten"); }
      return svgBox(360, 270, "Ansicht " + p.art, g2 + pf(x, y + hh + 30, x + w, y + hh + 30, MM(p.b) + " mm", false, -12) + tx(180, 22, esc(p.art) + (p.kasten ? " · " + esc(p.kasten) : "") + " · " + esc(p.an) + (p.anz > 1 ? " · " + p.anz + " Stück" : ""), "gw-titel"));
    },
    ergebnis: function (A_) {
      var z = A_.posten.map(function (p) {
        if (p.art === "Terrassendach") { var d = P.terrassendach.daten(p); return [esc(p.name), "Terrassendach", M(num(p.b)) + " × " + M(num(p.t)), "Gefälle " + Z1(d.gef) + "° · " + [p.front !== "offen" ? p.front : "", p.seite !== "offen" ? p.seite : "", p.schatten !== "keine" ? p.schatten : ""].filter(Boolean).join(", ")]; }
        if (p.art === "Markise") return [esc(p.name), "Markise", M(num(p.b)) + " × " + M(num(p.a)) + " Ausfall", esc(p.tuch) + ", " + esc(p.antrieb)];
        if (PROD_ART[p.art]) { var q = Object.assign(P[PROD_ART[p.art]].start(), p); return [esc(p.name), esc(p.art) + (p.anz > 1 ? " × " + p.anz : ""), MM(q.b) + " × " + MM(q.h) + " mm", esc([q.typ, q.lamelle, q.netz, q.stoffart, q.stoff, q.antrieb, q.bed].filter(Boolean).join(", "))]; }
        return [esc(p.name), esc(p.art) + (p.anz > 1 ? " × " + p.anz : ""), MM(p.b) + " × " + MM(p.h) + " mm", esc([p.kasten, p.an].filter(Boolean).join(", "))];
      });
      var tdach = A_.posten.filter(function (p) { return p.art === "Terrassendach"; });
      return tab(["Position", "Art", "Maße", "Ausstattung"], z) + tdach.map(function (p) { return P.terrassendach.hinweise(p); }).join("");
    },
    positionen: function (A_) {
      var out = [];
      A_.posten.forEach(function (p) {
        if (p.art === "Terrassendach") out = out.concat(P.terrassendach.preis(p).map(function (x) { x.text += " (" + p.name + ")"; return x; }));
        else if (p.art === "Markise") out = out.concat(P.markise.preis(p).map(function (x) { x.text += " (" + p.name + ")"; return x; }));
        else if (PROD_ART[p.art]) { var pr3 = P[PROD_ART[p.art]], q3 = Object.assign(pr3.start(), p); out = out.concat(pr3.preis(q3).map(function (x) { x.menge = Math.round(x.menge * (+p.anz || 1) * 100) / 100; x.text += " (" + p.name + ")"; return x; })); }
        else if (p.art === "Rollladen") { var m2 = num(p.b) * (num(p.h) + 0.2); out.push(pos("Rollladen " + p.kasten + ", Alu-Panzer, " + p.an + ", Lichtmaß " + MM(p.b) + " × " + MM(p.h) + " mm (" + p.name + ")", +p.anz || 1, "Stk.", 260 + 140 * m2 + (p.kasten === "Aufsatz" ? 120 : 0) + (p.an !== "Gurt" ? 240 : 0) + (p.an === "Motor mit App" ? 110 : 0)), pos("Montage Rollladen", +p.anz || 1, "Stk.", 120)); }
        else { var m3 = num(p.b) * num(p.h); out.push(pos("Raffstore 80 mm Lamelle, " + p.an + ", " + MM(p.b) + " × " + MM(p.h) + " mm (" + p.name + ")", +p.anz || 1, "Stk.", 480 + 360 * m3 + (p.an === "Motor mit App" ? 110 : 0)), pos("Montage Raffstore", +p.anz || 1, "Stk.", 190)); }
      });
      return out;
    }
  };

  /* ---------- Garten, Pflaster & Zaun ---------- */
  var PFL = { "Gehweg / Terrasse": 0.2, "Zufahrt (PKW)": 0.3 };
  A.garten = { titel: "Außenanlage aufmessen", posten: "Fläche", arten: ["Pflaster", "Rasen", "Hecke", "Zaun"],
    felder: function (p) {
      var art = { k: "art", l: "Art", t: "sel", o: this.arten }, nm = { k: "name", l: "Bezeichnung", t: "txt" };
      if (p.art === "Pflaster") return [art, nm, F("l", "Länge", { max: 60 }), F("b", "Breite", { max: 40 }), { k: "bel", l: "Belastung", t: "sel", o: Object.keys(PFL) }, { k: "st", l: "Stein", t: "sel", o: ["Betonpflaster", "Naturstein"] }];
      if (p.art === "Rasen") return [art, nm, F("l", "Länge", { max: 80 }), F("b", "Breite", { max: 60 }), { k: "ra", l: "Ausführung", t: "sel", o: ["Ansaat", "Rollrasen"] }];
      if (p.art === "Hecke") return [art, nm, F("lm", "Länge", { min: 1, max: 200 }), { k: "pf", l: "Pflanze", t: "sel", o: ["Liguster", "Hainbuche", "Kirschlorbeer"] }];
      return [art, nm, F("lm", "Länge", { min: 1, max: 300 }), { k: "hz", l: "Höhe", t: "sel", o: ["1,03 m", "1,23 m", "1,63 m"] }, F("tor", "Tore", { min: 0, max: 4, st: 1, e: "" })];
    },
    einst: [],
    start: function () { return { e: {}, posten: [{ art: "Pflaster", name: "Einfahrt", l: 8, b: 3.2, bel: "Zufahrt (PKW)", st: "Betonpflaster" }, { art: "Pflaster", name: "Terrasse", l: 5, b: 3.5, bel: "Gehweg / Terrasse", st: "Naturstein" }, { art: "Rasen", name: "Rasen hinten", l: 14, b: 9, ra: "Rollrasen" }, { art: "Hecke", name: "Hecke Nachbar", lm: 18, pf: "Hainbuche" }, { art: "Zaun", name: "Zaun Straße", lm: 22, hz: "1,23 m", tor: 1 }] }; },
    neu: function (art) { return { Pflaster: { art: "Pflaster", name: "Weg", l: 6, b: 1.2, bel: "Gehweg / Terrasse", st: "Betonpflaster" }, Rasen: { art: "Rasen", name: "Rasen", l: 10, b: 6, ra: "Ansaat" }, Hecke: { art: "Hecke", name: "Hecke", lm: 10, pf: "Liguster" }, Zaun: { art: "Zaun", name: "Zaun", lm: 15, hz: "1,23 m", tor: 1 } }[art || "Pflaster"]; },
    ansichten: function (p) { return p.art === "Pflaster" ? [["plan", "Gartenplan"], ["aufbau", "Aufbau"]] : [["plan", "Gartenplan"]]; },
    _f: function (p) { return num(p.l) * num(p.b); },
    bild: function (id, p, A_) {
      if (id === "aufbau" && p.art === "Pflaster") { var d = PFL[p.bel], s = 300, g = rc(30, 70, 300, 8 * 3, p.st === "Naturstein" ? "gw-naturstein" : "gw-pflaster") + rc(30, 94, 300, 0.04 * s, "gw-splitt") + rc(30, 94 + 0.04 * s, 300, d * s, "gw-schotter") + rc(30, 94 + (0.04 + d) * s, 300, 30, "gw-erde"); return svgBox(360, 260, "Aufbau Pflaster", g + tx(340, 86, "Pflaster 8 cm", "am-klein", "end") + tx(340, 104, "Splitt 4 cm", "am-klein", "end") + tx(340, 94 + (0.04 + d / 2) * s, "Schotter " + Math.round(d * 100) + " cm", "am-klein", "end") + tx(180, 40, esc(p.bel) + " · Aushub ca. " + Z1(this._f(p) * (d + 0.12)) + " m³", "gw-titel")); }
      var self = this, fl = A_.posten.filter(function (q) { return q.art === "Pflaster" || q.art === "Rasen"; }), li = A_.posten.filter(function (q) { return q.art === "Hecke" || q.art === "Zaun"; });
      var sc = Math.min(100 / Math.max.apply(null, fl.map(function (q) { return Math.sqrt(self._f(q)); }).concat([1])), 12), x = 20, y = 20, zeileH = 0, g2 = "";
      fl.forEach(function (q) {
        var w = Math.max(56, Math.min(200, num(q.l) * sc)), hh = Math.max(36, Math.min(110, num(q.b) * sc));
        if (x + w > 340) { x = 20; y += zeileH + 26; zeileH = 0; }
        g2 += rc(x, y, w, hh, (q.art === "Rasen" ? "gw-rasen" : q.st === "Naturstein" ? "gw-naturstein" : "gw-pflaster") + (q === p ? " gw-aktiv" : "")) + tx(x + w / 2, y + hh + 13, esc(q.name) + " · " + Z1(self._f(q)) + " m²", "am-klein");
        x += w + 16; zeileH = Math.max(zeileH, hh);
      });
      var lineY = y + zeileH + 44;
      li.forEach(function (q) { g2 += ln(20, lineY, 20 + Math.min(320, num(q.lm) * 9), lineY, (q.art === "Hecke" ? "gw-hecke" : "gw-zaun") + (q === p ? " gw-aktiv" : "")) + tx(24, lineY - 9, esc(q.name) + " · " + M(num(q.lm)), "am-klein", "start"); lineY += 30; });
      return svgBox(360, Math.max(200, lineY), "Gartenplan", rc(6, 6, 348, Math.max(188, lineY - 12), "gw-rasen-hell") + g2);
    },
    ergebnis: function (A_) {
      var self = this, z = A_.posten.map(function (p) {
        if (p.art === "Pflaster") { var f = self._f(p), d = PFL[p.bel]; return [esc(p.name), "Pflaster", Z1(f) + " m²", "Schotter " + Z1(f * d * 2.0) + " t · Splitt " + Z1(f * 0.04 * 1.6) + " t · Randstein " + M(2 * (num(p.l) + num(p.b)))]; }
        if (p.art === "Rasen") { var f2 = self._f(p); return [esc(p.name), "Rasen", Z1(f2) + " m²", p.ra === "Rollrasen" ? Z1(f2 * 1.03) + " m² Rollrasen" : Z1(f2 * 0.03) + " kg Saatgut · Oberboden " + Z1(f2 * 0.1) + " m³"]; }
        if (p.art === "Hecke") return [esc(p.name), "Hecke", M(num(p.lm)), auf(num(p.lm) * (p.pf === "Kirschlorbeer" ? 2 : 3)) + " Pflanzen " + esc(p.pf)];
        var matten = auf(num(p.lm) / 2.5); return [esc(p.name), "Zaun " + esc(p.hz), M(num(p.lm)), matten + " Matten · " + (matten + 1 + (+p.tor || 0)) + " Pfosten · " + (+p.tor || 0) + " Tor"];
      });
      return tab(["Bereich", "Art", "Menge", "Material"], z) + h.hin("Pflaster: Schotter verdichtet ca. 2,0 t/m³, Splitt ca. 1,6 t/m³. Zaun: Doppelstabmatten 2,50 m. Grenzabstände für Hecken nach Landesnachbarrecht beachten.");
    },
    positionen: function (A_) {
      var self = this, out = [];
      A_.posten.forEach(function (p) {
        if (p.art === "Pflaster") { var f = self._f(p), d = PFL[p.bel]; out.push(pos("Aushub laden und entsorgen (" + p.name + ")", f * (d + 0.12), "m³", 42), pos("Schottertragschicht einbauen und verdichten, " + Math.round(d * 100) + " cm (" + p.name + ")", f, "m²", d > 0.25 ? 29 : 22), pos(p.st + " liefern und verlegen inkl. Splittbett und Fugen (" + p.name + ")", f, "m²", p.st === "Naturstein" ? 159 : 79), pos("Randsteine in Beton setzen (" + p.name + ")", 2 * (num(p.l) + num(p.b)), "m", 39)); }
        if (p.art === "Rasen") { var f2 = self._f(p); out.push(pos("Oberboden liefern und einbauen, 10 cm (" + p.name + ")", f2 * 0.1, "m³", 49), pos("Feinplanum (" + p.name + ")", f2, "m²", 3.5), pos(p.ra === "Rollrasen" ? "Rollrasen liefern und verlegen" : "Rasen ansäen", f2, "m²", p.ra === "Rollrasen" ? 12.9 : 2.8)); }
        if (p.art === "Hecke") out.push(pos("Heckenpflanzen " + p.pf + " liefern und pflanzen (" + p.name + ")", auf(num(p.lm) * (p.pf === "Kirschlorbeer" ? 2 : 3)), "Stk.", { Liguster: 9.5, Hainbuche: 12.5, Kirschlorbeer: 24 }[p.pf]));
        if (p.art === "Zaun") { out.push(pos("Doppelstabmattenzaun " + p.hz + " inkl. Pfosten in Beton (" + p.name + ")", num(p.lm), "lfm", { "1,03 m": 79, "1,23 m": 89, "1,63 m": 109 }[p.hz])); if (+p.tor) out.push(pos("Gartentor einflügelig", +p.tor, "Stk.", 690)); }
      });
      return out;
    }
  };

  /* ---------- Allgemein (andere Branchen) ---------- */
  A.allgemein = { titel: "Flächen aufnehmen", posten: "Raum", oeff: true,
    felder: function () { return RAUM; }, einst: [],
    start: function () { return { e: {}, posten: [{ name: "Büro", l: 6.2, b: 4.8, h: 2.8, ab: [tuer(1.0), fen(1.5, 1.4), fen(1.5, 1.4)] }, { name: "Besprechung", l: 4.5, b: 3.6, h: 2.8, ab: [tuer(1.0), fen(1.5, 1.4)] }] }; },
    neu: function () { return { name: "Raum", l: 4, b: 3, h: 2.6, ab: [tuer(0.9)] }; },
    ansichten: function () { return ANS_RAUM; },
    bild: function (id, p, A_, H) { return id === "3d" ? H.iso(p) : id === "foto" ? H.foto(p) : H.grund(p); },
    ergebnis: function (A_) { return tab(["Raum", "Boden", "Wände", "Fenster/Türen"], A_.posten.map(function (r) { var f = raumFl(r); return [esc(r.name), Z(f.boden) + " m²", Z(f.wand) + " m²", (r.ab || []).length + ""]; }), ["Gesamt", Z(sum(A_.posten, function (r) { return raumFl(r).boden; })) + " m²", Z(sum(A_.posten, function (r) { return raumFl(r).wand; })) + " m²", ""]); },
    positionen: function (A_) { return [pos("Leistung je m² Bodenfläche (Einheitspreis eintragen)", sum(A_.posten, function (r) { return raumFl(r).boden; }), "m²", 0)]; },
    scan: { label: "Raum scannen", text: "Raum wird gescannt … Handy langsam drehen" }
  };
})();
