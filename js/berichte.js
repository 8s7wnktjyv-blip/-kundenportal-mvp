/* =====================================================================
   BERICHTE (gehört zu demo.html): Berichtsgenerator für Fachbetriebe
   ---------------------------------------------------------------------
   1. VORLAGEN  ← hier Berichte ändern oder ergänzen
   2. Ansicht „Berichte“ (Liste und neue Berichte)
   3. Fenster zum Ausfüllen: Prüfpunkte, Messwerte, Mängel, Fotos,
      Sprachnachricht, Unterschriften, PDF
   Braucht window.DEMO_AM (demo.js) und window.AMVO (aufmass-vorort.js).
   Vorlagen sind Arbeitshilfen. Maßgeblich bleiben Normen, Herstellerangaben
   und die Formulare des Betriebs. Alles bleibt in diesem Browser.
   ===================================================================== */
(function () {
  "use strict";
  var B = window.BERICHTSGEN = {};
  var X = function () { return window.DEMO_AM; };

  /* ---------- 1. VORLAGEN ----------
     P = Prüfpunkt (in Ordnung / Mangel / entfällt), N = Messwert, S = Auswahl, T = Text, J = ja / nein */
  var PO = ["in Ordnung", "Mangel", "entfällt"];
  function P(k, l, syn, w) { return { k: k, l: l, t: "sel", o: PO, syn: syn || [], w: w || "", gr: "p" }; }
  function N(k, l, e, syn, w, min, max) { return { k: k, l: l, t: "n", e: e || "", syn: syn || [], w: w || "", min: min == null ? 0 : min, max: max == null ? 9999 : max, gr: "m" }; }
  function S(k, l, o, syn, w) { return { k: k, l: l, t: "sel", o: o, syn: syn || [], w: w || "", gr: "a" }; }
  function T(k, l, syn, w) { return { k: k, l: l, t: "txt", syn: syn || [], w: w || "", gr: "a" }; }
  function J(k, l, syn, w) { return { k: k, l: l, t: "sel", o: ["ja", "nein"], ja: true, syn: syn || [], w: w || "", gr: "a" }; }

  var ALLE = "*";
  var VORLAGEN = [
    { id: "abnahme", name: "Abnahmeprotokoll", gw: ALLE, kurz: "Übergabe der fertigen Leistung, mit Mängeln und Unterschrift.",
      hinweis: "Mit der Abnahme beginnt in der Regel die Gewährleistung. Bekannte Mängel und Vorbehalte unbedingt eintragen.",
      felder: [T("leistung", "Abgenommene Leistung", ["leistung", "abgenommen wird"]), S("ergebnis", "Abnahme", ["erklärt", "unter Vorbehalt der Mängel", "verweigert"], ["abnahme"]),
        J("vollst", "Leistung vollständig erbracht", ["vollständig"]), J("funktion", "Funktion vorgeführt", ["funktion", "vorgeführt"]), J("einweis", "Einweisung und Unterlagen übergeben", ["einweisung", "unterlagen"]),
        P("sauber", "Baustelle sauber übergeben", ["baustelle", "sauber"])], sprache: "Abgenommene Leistung Malerarbeiten Wohnzimmer und Flur. Abnahme unter Vorbehalt der Mängel. Vollständig ja. Funktion vorgeführt ja. Einweisung ja. Baustelle sauber in Ordnung. Mangel: kleine Farbspur an der Fußleiste im Flur." },
    { id: "maengel", name: "Mängelbericht und Nachbesserung", gw: ALLE, kurz: "Mangel aufnehmen, Frist setzen, Erledigung bestätigen.",
      hinweis: "Jeden Mangel mit Foto und Ort festhalten. Nach der Nachbesserung den Bericht erneut unterschreiben lassen.",
      felder: [T("ort", "Ort / Raum", ["ort", "raum"]), T("ursache", "Vermutete Ursache", ["ursache"]), T("frist", "Frist zur Nachbesserung", ["frist", "bis zum"]), S("stand", "Stand", ["offen", "nachgebessert", "kein Mangel"], ["stand", "status"])],
      sprache: "Ort Bad im Obergeschoss. Ursache Silikonfuge an der Duschwanne gerissen. Frist bis zum 15. November. Stand offen. Mangel: Silikonfuge Duschwanne erneuern." },
    { id: "bautag", name: "Bautagesbericht", gw: ALLE, kurz: "Wer war da, was wurde gemacht, was hat behindert.",
      hinweis: "Täglich kurz ausfüllen – bei Streit über Zeiten, Wetter oder Behinderungen ist er der wichtigste Nachweis.",
      felder: [S("wetter", "Wetter", ["trocken", "Regen", "Frost", "Sturm"], ["wetter"]), N("temp", "Temperatur", "°C", ["temperatur", "grad"], "", -30, 45), N("pers", "Personal vor Ort", "Personen", ["personal", "mitarbeiter", "leute"], "", 0, 50), N("std", "Arbeitsstunden gesamt", "Std.", ["stunden", "arbeitsstunden"], "", 0, 500),
        T("arbeit", "Ausgeführte Arbeiten", ["arbeiten", "gemacht", "ausgeführt"]), T("behind", "Behinderungen", ["behinderung", "behindert", "gewartet"], "Behinderungen sofort schriftlich anzeigen, sonst ist es später schwer nachzuweisen."), T("lief", "Lieferungen", ["geliefert", "lieferung"])],
      sprache: "Wetter trocken, Temperatur 9 Grad. Personal 3 Mitarbeiter, Stunden 22. Arbeiten Estrich im Anbau verlegt und abgezogen. Behinderung keine. Geliefert 2 Paletten Estrich." },
    { id: "schaden", name: "Schadensbericht für die Versicherung", gw: ALLE, kurz: "Wasser, Sturm, Einbruch: Ursache, Umfang, Sofortmaßnahmen.",
      hinweis: "Fotos vor Beginn der Arbeiten machen. Schadennummer der Versicherung eintragen. Keine Aussagen zur Haftung – nur Tatsachen.",
      felder: [T("datum_s", "Schadensdatum", ["schadensdatum", "passiert am"]), S("sart", "Schadensart", ["Leitungswasser", "Sturm / Hagel", "Einbruch", "Brand", "Sonstiges"], ["schadensart", "schaden durch"]), T("ursache", "Ursache (festgestellt)", ["ursache"]),
        N("flaeche", "Betroffene Fläche", "m²", ["fläche", "betroffen"], "", 0, 2000), N("feuchte", "Materialfeuchte (Messgerät)", "Digits", ["feuchte", "materialfeuchte"], "", 0, 200), T("sofort", "Sofortmaßnahmen", ["sofortmaßnahme", "sofort"]), T("schadennr", "Schadennummer der Versicherung", ["schadennummer", "schadensnummer"])],
      sprache: "Schadensdatum 18. Oktober. Schadensart Leitungswasser. Ursache undichte Verschraubung am Waschtisch. Fläche 6 Quadratmeter. Feuchte 112 Digits. Sofortmaßnahmen Wasser abgestellt, Verschraubung erneuert, Trockner aufgestellt. Schadennummer folgt." },
    { id: "hv", name: "Bericht für die Hausverwaltung", gw: ALLE, kurz: "Kurz und klar für Verwaltung und Eigentümer.",
      hinweis: "Objekt und Wohnung genau angeben; Folgeaufträge als Empfehlung, nicht als Auftrag formulieren.",
      felder: [T("objekt", "Objekt / Wohnung", ["objekt", "wohnung"]), J("mieter", "Mieter informiert", ["mieter"]), T("zugang", "Zugang / Schlüssel", ["zugang", "schlüssel"]), S("stand", "Arbeiten", ["erledigt", "teilweise erledigt", "nicht möglich"], ["arbeiten", "erledigt"]), J("folge", "Folgeauftrag empfohlen", ["folgeauftrag", "empfehlung"])],
      sprache: "Objekt Wohnbau Fürth, Wohnung 4. Mieter informiert ja. Zugang über Hausmeister. Arbeiten erledigt. Folgeauftrag ja, Fensterdichtungen im Treppenhaus erneuern." },
    { id: "wartung_heiz", name: "Wartungsprotokoll Heizung (Gas / Öl)", gw: ["heizung", "shk"], kurz: "Jährliche Wartung mit Messwerten.",
      hinweis: "Arbeitshilfe. Maßgeblich sind die Wartungsanleitung des Herstellers und die Messung nach den geltenden Vorschriften.",
      felder: [P("brenner", "Brenner / Wärmetauscher gereinigt", ["brenner", "wärmetauscher"]), P("abgas", "Abgasweg geprüft", ["abgasweg", "abgas"]), P("siv", "Sicherheitsventil geprüft", ["sicherheitsventil"]), P("kond", "Kondensatablauf / Siphon frei", ["kondensat", "siphon"]),
        N("druck", "Anlagendruck", "bar", ["anlagendruck", "druck"], "Üblich bei Einfamilienhäusern etwa 1,5–2 bar – Herstellerangabe gilt.", 0, 6), N("mag", "Vordruck Ausdehnungsgefäß", "bar", ["vordruck", "ausdehnungsgefäß"], "", 0, 4), N("co", "CO-Wert", "ppm", ["co-wert", "co wert", "kohlenmonoxid"], "", 0, 2000), N("verlust", "Abgasverlust", "%", ["abgasverlust"], "", 0, 30)],
      sprache: "Brenner gereinigt in Ordnung. Abgasweg in Ordnung. Sicherheitsventil in Ordnung. Kondensat frei in Ordnung. Anlagendruck 1,6 bar. Vordruck 1,0 bar. CO-Wert 18 ppm. Abgasverlust 4 Prozent. Empfehlung: Ausdehnungsgefäß nächstes Jahr tauschen." },
    { id: "wartung_wp", name: "Wartungsprotokoll Wärmepumpe", gw: ["heizung", "shk", "solar"], kurz: "Außengerät, Hydraulik, Fehlerspeicher.",
      hinweis: "Dichtheitskontrollen des Kältekreises nur, soweit vorgeschrieben (F-Gase-Verordnung) und nur durch zertifiziertes Personal.",
      felder: [P("verd", "Verdampfer / Lamellen gereinigt", ["verdampfer", "lamellen"]), P("kond", "Kondensatablauf frei", ["kondensat"]), P("fehler", "Fehlerspeicher ausgelesen", ["fehlerspeicher", "fehler"]), P("filter", "Schmutzfilter gereinigt", ["schmutzfilter", "filter"]),
        N("vl", "Vorlauftemperatur", "°C", ["vorlauf", "vorlauftemperatur"], "", 15, 80), N("rl", "Rücklauftemperatur", "°C", ["rücklauf", "rücklauftemperatur"], "", 10, 70), N("druck", "Anlagendruck", "bar", ["anlagendruck", "druck"], "", 0, 6)],
      sprache: "Verdampfer gereinigt in Ordnung. Kondensat frei in Ordnung. Fehlerspeicher ausgelesen in Ordnung. Filter in Ordnung. Vorlauf 38 Grad, Rücklauf 33 Grad. Anlagendruck 1,8 bar." },
    { id: "druck", name: "Druckprüfung Trinkwasser / Heizung", gw: ["shk", "heizung"], kurz: "Prüfdruck, Dauer, Druckabfall, Ergebnis.",
      hinweis: "Arbeitshilfe. Prüfverfahren und Grenzwerte nach den anerkannten Regeln der Technik und Merkblättern des Fachverbands.",
      felder: [S("medium", "Prüfmedium", ["Wasser", "Luft / Inertgas"], ["prüfmedium", "medium", "mit wasser", "mit luft"]), N("pdruck", "Prüfdruck", "bar", ["prüfdruck"], "", 0, 30), N("dauer", "Prüfdauer", "min", ["prüfdauer", "dauer"], "", 0, 600), N("abfall", "Druckabfall", "bar", ["druckabfall", "abfall"], "", 0, 5),
        S("erg", "Ergebnis", ["dicht", "undicht"], ["ergebnis"])],
      sprache: "Prüfmedium Wasser. Prüfdruck 11 bar. Prüfdauer 30 Minuten. Druckabfall 0 bar. Ergebnis dicht." },
    { id: "echeck", name: "Prüfprotokoll Elektro (Orientierung E-Check / DGUV V3)", gw: ["elektro", "solar"], kurz: "Sichtprüfung und Messwerte je Stromkreis.",
      hinweis: "Arbeitshilfe. Maßgeblich sind DIN VDE 0100-600 bzw. 0105-100 und die Prüfprotokolle des Betriebs.",
      felder: [P("sicht", "Sichtprüfung", ["sichtprüfung"]), P("rcd_t", "RCD-Test (Prüftaste und Messung)", ["rcd", "fi"]), N("riso", "Isolationswiderstand (kleinster Wert)", "MΩ", ["isolationswiderstand", "isolation"], "", 0, 1000), N("zs", "Schleifenimpedanz (größter Wert)", "Ω", ["schleifenimpedanz", "schleife"], "", 0, 50),
        N("ta", "RCD-Auslösezeit", "ms", ["auslösezeit"], "", 0, 1000), N("ia", "RCD-Auslösestrom", "mA", ["auslösestrom"], "", 0, 500), N("kreise", "Geprüfte Stromkreise", "Stk.", ["stromkreise"], "", 0, 200)],
      sprache: "Sichtprüfung in Ordnung. RCD in Ordnung. Isolationswiderstand 250 Megaohm. Schleifenimpedanz 0,62 Ohm. Auslösezeit 24 ms. Auslösestrom 22 mA. Stromkreise 14." },
    { id: "wallbox", name: "Inbetriebnahme Wallbox", gw: ["elektro"], kurz: "Leistung, Absicherung, Schutz, Anmeldung.",
      hinweis: "Wallboxen beim Netzbetreiber anmelden; über 11 kW ist vorher eine Genehmigung nötig.",
      felder: [N("kw", "Ladeleistung", "kW", ["ladeleistung", "leistung"], "", 1, 22), N("abs", "Absicherung", "A", ["absicherung", "sicherung"], "", 10, 63), S("rcd", "Fehlerstromschutz", ["RCD Typ A + DC-Erkennung 6 mA", "RCD Typ B"], ["fehlerstromschutz", "rcd"]),
        N("leit", "Leitungslänge", "m", ["leitungslänge", "leitung"], "", 0, 200), S("netz", "Anmeldung Netzbetreiber", ["gemeldet", "genehmigt", "noch offen"], ["netzbetreiber", "anmeldung"]), J("einw", "Einweisung des Kunden", ["einweisung"])],
      sprache: "Ladeleistung 11 kW. Absicherung 20 Ampere. Fehlerstromschutz RCD Typ A + DC-Erkennung 6 mA. Leitungslänge 14 Meter. Anmeldung Netzbetreiber gemeldet. Einweisung ja." },
    { id: "pv", name: "Übergabeprotokoll PV-Anlage", gw: ["solar", "elektro"], kurz: "Anlagendaten, Messungen, Anmeldungen.",
      hinweis: "Anlagen sind im Marktstammdatenregister einzutragen (Frist beachten). Inbetriebsetzung mit dem Netzbetreiber abstimmen.",
      felder: [N("kwp", "Anlagenleistung", "kWp", ["anlagenleistung", "kwp"], "", 0, 100), N("speicher", "Speicher", "kWh", ["speicher"], "", 0, 100), T("wr", "Wechselrichter (Typ, Seriennummer)", ["wechselrichter"]), P("iso", "Isolationsmessung Strings", ["isolationsmessung", "strings"]),
        S("mastr", "Marktstammdatenregister", ["eingetragen", "noch offen"], ["marktstammdatenregister", "mastr"]), J("einw", "Einweisung und App eingerichtet", ["einweisung", "app"])],
      sprache: "Anlagenleistung 9,8 kWp. Speicher 10 kWh. Wechselrichter Hybrid 10 kW, Seriennummer folgt. Isolationsmessung in Ordnung. Marktstammdatenregister noch offen. Einweisung ja." },
    { id: "sonnen", name: "Wartung Markise / Rollladen / Raffstore", gw: ["sonnenschutz", "fenster"], kurz: "Mechanik, Antrieb, Sensoren, Befestigung.",
      hinweis: "Befestigung und Dübel immer prüfen – bei Markisen hängt die Sicherheit daran.",
      felder: [P("tuch", "Tuch / Panzer / Lamellen", ["tuch", "panzer", "lamellen"]), P("mech", "Gelenkarme, Federn, Lager", ["gelenkarme", "federn", "lager"]), P("antrieb", "Antrieb und Endlagen", ["antrieb", "endlagen"]), P("sensor", "Wind- / Sonnensensor getestet", ["sensor", "windsensor"]),
        P("befest", "Befestigung / Dübel", ["befestigung", "dübel"]), N("anz", "Anzahl Anlagen", "Stk.", ["anzahl", "anlagen"], "", 1, 100)],
      sprache: "Tuch in Ordnung. Gelenkarme in Ordnung. Antrieb Endlagen neu eingestellt in Ordnung. Sensor in Ordnung. Befestigung Mangel, ein Dübel locker. Anzahl 3 Anlagen." },
    { id: "dach", name: "Dachinspektion", gw: ["dach", "solar"], kurz: "Eindeckung, Rinnen, Anschlüsse, Sturmschäden.",
      felder: [P("eind", "Eindeckung", ["eindeckung", "ziegel"]), P("rinne", "Rinnen und Fallrohre frei", ["rinne", "fallrohr"]), P("ansch", "Anschlüsse und Durchdringungen dicht", ["anschlüsse", "durchdringung", "kamin"]), P("sturm", "Sturmschäden", ["sturm"]),
        P("moos", "Moos / Bewuchs", ["moos", "bewuchs"]), S("empf", "Empfehlung", ["keine Maßnahme", "Reparatur", "Sanierung prüfen"], ["empfehlung"])],
      sprache: "Eindeckung in Ordnung. Rinne Mangel, Laub im Rinnenkessel. Anschlüsse in Ordnung. Sturm entfällt. Moos Mangel an der Nordseite. Empfehlung Reparatur." },
    { id: "feuchte", name: "Feuchte- und Schimmelaufnahme", gw: ["maler", "trockenbau", "fliesen", "boden"], kurz: "Messwerte und vermutete Ursache, bevor gestrichen wird.",
      hinweis: "Ursache klären, bevor gestrichen oder verkleidet wird. Bei großen Flächen Fachgutachter hinzuziehen.",
      felder: [N("rt", "Raumtemperatur", "°C", ["raumtemperatur"], "", 0, 40), N("rf", "Relative Luftfeuchte", "%", ["luftfeuchte", "luftfeuchtigkeit"], "", 0, 100), N("ot", "Oberflächentemperatur Wand", "°C", ["oberflächentemperatur", "wandtemperatur"], "", -10, 40),
        N("flaeche", "Betroffene Fläche", "m²", ["fläche", "betroffen"], "", 0, 500), S("urs", "Vermutete Ursache", ["Lüftung / Kondensat", "Leitungswasser", "aufsteigende Feuchte", "unbekannt"], ["ursache"])],
      sprache: "Raumtemperatur 19 Grad. Luftfeuchte 68 Prozent. Oberflächentemperatur Wand 12 Grad. Fläche 1,5 Quadratmeter. Ursache Lüftung." },
    { id: "boden", name: "Untergrundprüfung vor Belagsarbeiten", gw: ["boden", "fliesen"], kurz: "Feuchte, Ebenheit, Festigkeit – vor dem Verlegen dokumentiert.",
      hinweis: "Grenzwerte nach Herstellerangabe des Belags. Bedenken schriftlich anmelden, bevor verlegt wird.",
      felder: [N("cm", "CM-Messung", "%", ["cm-messung", "cm messung", "restfeuchte"], "", 0, 10), N("eben", "Ebenheit: größte Abweichung", "mm", ["ebenheit", "abweichung"], "", 0, 50), P("fest", "Festigkeit (Kratzprobe)", ["festigkeit", "kratzprobe"]),
        J("fbh", "Fußbodenheizung mit Aufheizprotokoll", ["aufheizprotokoll", "fußbodenheizung"]), S("bedenken", "Bedenken angemeldet", ["nein", "ja – schriftlich"], ["bedenken"])],
      sprache: "CM-Messung 1,7 Prozent. Ebenheit 2 Millimeter. Festigkeit in Ordnung. Aufheizprotokoll ja. Bedenken nein." }
  ];
  B.VORLAGEN = VORLAGEN;
  function vorlage(id) { return VORLAGEN.filter(function (v) { return v.id === id; })[0]; }
  function passend(v, gw) { return v.gw === ALLE || v.gw.indexOf(gw) >= 0; }

  /* ---------- 2. ANSICHT ---------- */
  function liste() { var s = X().state(); s.berichte = s.berichte || []; return s.berichte; }
  function kunden() { var x = X(), k = x.state().leads.map(function (l) { return l.name; }); if (k.indexOf(x.kunde()) < 0) k.unshift(x.kunde()); return k; }
  var STATUS = { entwurf: ["Entwurf", "check"], fertig: ["unterschrieben", "ok"] };
  B.ansicht = function () {
    var x = X(), esc = x.esc, svg = x.svg, I = x.ICON, gw = x.haupt(), alle = liste().slice().reverse();
    var karte = function (v) { return '<button type="button" class="ber-karte" data-ber-neu="' + v.id + '"><b>' + esc(v.name) + "</b><span>" + esc(v.kurz) + "</span></button>"; };
    var eig = VORLAGEN.filter(function (v) { return v.gw !== ALLE && passend(v, gw); }), allg = VORLAGEN.filter(function (v) { return v.gw === ALLE; }), rest = VORLAGEN.filter(function (v) { return v.gw !== ALLE && !passend(v, gw); });
    return '<div data-nt>' + x.head("Berichte", "Berichte und Protokolle aus Fotos, Sprachnachricht und Checkliste – als PDF mit Unterschrift des Kunden.",
        "Geplant ab Q1 2029. Der Regiebericht mit Fotos und Unterschrift ist ab Start unter „Montagekräfte“ nutzbar. Vorlagen sind Arbeitshilfen: maßgeblich bleiben Normen, Herstellerangaben und die Formulare Ihres Betriebs.") +
      '<section class="panel"><h2>Neuer Bericht</h2><div class="dash-filter"><label>Kunde <select id="ber-kunde">' + kunden().map(function (k) { return '<option value="' + esc(k) + '"' + (k === x.kunde() ? " selected" : "") + ">" + esc(x.nameT(k)) + "</option>"; }).join("") + "</select></label></div>" +
        (eig.length ? "<h3 class=\"am-h3\">Für " + esc(x.gwName(gw)) + '</h3><div class="ber-karten">' + eig.map(karte).join("") + "</div>" : "") +
        '<h3 class="am-h3">Für alle Gewerke</h3><div class="ber-karten">' + allg.map(karte).join("") + "</div>" +
        '<details class="ber-mehr"><summary>Weitere Vorlagen (' + rest.length + ")</summary><div class=\"ber-karten\">" + rest.map(karte).join("") + "</div></details></section>" +
      '<section class="panel" style="margin-top:16px"><h2>Erstellte Berichte</h2>' + (alle.length ? '<div class="rows">' + alle.map(function (b) {
        var v = vorlage(b.vorlage) || { name: b.vorlage }, st = STATUS[b.status] || STATUS.entwurf;
        return '<div class="row"><div class="row-main"><strong>' + esc(b.nr) + " · " + esc(v.name) + "</strong><small>" + esc(x.nameT(b.kunde)) + " · " + esc(b.datum) + " · " + (b.fotos || []).length + " Fotos" + ((b.maengel || []).length ? " · " + b.maengel.length + " Mängel" : "") + '</small></div><div class="row-side"><span class="pill ' + st[1] + '">' + st[0] + '</span><button class="btn-mini" type="button" data-ber-auf="' + esc(b.nr) + '">Öffnen</button><button class="btn-mini primary" type="button" data-ber-pdf="' + esc(b.nr) + '">' + svg(I.doc) + "PDF</button></div></div>";
      }).join("") + "</div>" : '<p class="col-empty">Noch kein Bericht. Wählen Sie oben eine Vorlage.</p>') + "</section></div>";
  };
  B.klick = function (t) {
    var el;
    if ((el = t.closest("[data-ber-neu]"))) { var k = document.getElementById("ber-kunde"); oeffnen(neuerBericht(el.getAttribute("data-ber-neu"), k ? k.value : X().kunde())); return true; }
    if ((el = t.closest("[data-ber-auf]"))) { oeffnen(finde(el.getAttribute("data-ber-auf"))); return true; }
    if ((el = t.closest("[data-ber-pdf]"))) { pdf(finde(el.getAttribute("data-ber-pdf")), false); return true; }
    return false;
  };
  function finde(nr) { return liste().filter(function (b) { return b.nr === nr; })[0]; }
  function heute() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear(); }
  function neuerBericht(vid, kunde) {
    var n = liste().length + 1;
    return { nr: "BE-" + new Date().getFullYear() + "-" + ("00" + n).slice(-3), vorlage: vid, kunde: kunde, datum: heute(), werte: {}, maengel: [], fotos: [], text: "", sig: {}, status: "entwurf", neu: true };
  }

  /* ---------- 3. FENSTER ZUM AUSFÜLLEN ---------- */
  var be = null, MIC = '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>';
  function feld(f) {
    var x = X(), esc = x.esc, v = be.werte[f.k], id = "ber-f-" + f.k, ein;
    if (f.t === "sel") ein = '<select id="' + id + '" data-ber-k="' + f.k + '"><option value="">– offen –</option>' + AMVO.optionen(f).map(function (o) { return '<option value="' + esc(o.v) + '"' + (String(v) === String(o.v) ? " selected" : "") + ">" + esc(o.t) + "</option>"; }).join("") + "</select>";
    else if (f.t === "txt") ein = '<input id="' + id + '" data-ber-k="' + f.k + '" value="' + esc(v == null ? "" : v) + '">';
    else ein = '<span class="vo-zahl"><input type="number" inputmode="decimal" step="any" id="' + id + '" data-ber-k="' + f.k + '" value="' + (v == null ? "" : v) + '"><span>' + esc(f.e) + "</span></span>";
    var ok = v != null && v !== "", mangel = v === "Mangel";
    return '<div class="vo-zeile' + (ok ? " ok" : "") + (mangel ? " ber-mangel" : "") + (be.neuK && be.neuK[f.k] ? " neu" : "") + '" data-ber-zeile="' + f.k + '"><span class="vo-punkt" aria-hidden="true"></span><div class="vo-feld"><label for="' + id + '">' + esc(f.l) + "</label>" + ein + (f.w ? "<small>" + esc(f.w) + "</small>" : "") + "</div></div>";
  }
  function felderHtml() {
    var v = vorlage(be.vorlage), g = { p: [], m: [], a: [] };
    v.felder.forEach(function (f) { g[f.gr].push(feld(f)); });
    return (g.a.length ? "<h4>Angaben</h4>" + g.a.join("") : "") + (g.p.length ? "<h4>Prüfpunkte</h4>" + g.p.join("") : "") + (g.m.length ? "<h4>Messwerte</h4>" + g.m.join("") : "");
  }
  function maengelHtml() {
    var esc = X().esc;
    return be.maengel.map(function (m, i) { return '<div class="ber-m"><input data-ber-m="' + i + '" value="' + esc(m) + '" aria-label="Mangel ' + (i + 1) + '"><button class="icon-btn" type="button" data-ber-mdel="' + i + '" aria-label="Mangel entfernen">✕</button></div>'; }).join("") || '<p class="src">Keine Mängel eingetragen.</p>';
  }
  function fotosHtml() { var esc = X().esc; return be.fotos.map(function (f, i) { return '<figure class="ber-foto"><img src="' + f.url + '" alt="Foto ' + (i + 1) + '"><button class="icon-btn" type="button" data-ber-fdel="' + i + '" aria-label="Foto entfernen">✕</button><figcaption>' + esc(f.titel || "Foto " + (i + 1)) + "</figcaption></figure>"; }).join(""); }
  function neuZeichnen(teil) {
    var d = document.querySelector(".ber-drawer"); if (!d) return;
    if (!teil || teil === "f") d.querySelector("#ber-felder").innerHTML = felderHtml();
    if (!teil || teil === "m") d.querySelector("#ber-maengel").innerHTML = maengelHtml();
    if (!teil || teil === "b") d.querySelector("#ber-fotos").innerHTML = fotosHtml();
    var v = vorlage(be.vorlage), n = v.felder.filter(function (f) { return be.werte[f.k] != null && be.werte[f.k] !== ""; }).length;
    d.querySelector("#ber-zahl").textContent = n + " von " + v.felder.length + " erfasst";
  }
  function bildAusDatei(datei, fertig) {
    var img = new Image(), url = URL.createObjectURL(datei);
    img.onload = function () { var W = Math.min(900, img.naturalWidth), H = Math.round(img.naturalHeight * W / img.naturalWidth), c = document.createElement("canvas"); c.width = W; c.height = H; c.getContext("2d").drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url); fertig({ url: c.toDataURL("image/jpeg", 0.75), w: W, h: H }); };
    img.onerror = function () { X().toast("Ein Foto konnte nicht geöffnet werden."); };
    img.src = url;
  }
  function klein(c) { var W = 640, H = Math.round(c.height * W / c.width), k = document.createElement("canvas"); k.width = W; k.height = H; k.getContext("2d").drawImage(c, 0, 0, W, H); return { url: k.toDataURL("image/jpeg", 0.72), w: W, h: H }; }
  function unterschriftFeld(id, titel) {
    return '<div class="ber-sig"><span>' + titel + '</span><canvas id="' + id + '" width="600" height="200" aria-label="' + titel + ' – mit dem Finger unterschreiben"></canvas><button class="btn-mini" type="button" data-ber-sigweg="' + id + '">Löschen</button></div>';
  }
  function sigEinrichten(c, key) {
    var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.lineWidth = 3; g.lineCap = "round"; g.strokeStyle = "#111";
    if (be.sig[key]) { var im = new Image(); im.onload = function () { g.drawImage(im, 0, 0, c.width, c.height); }; im.src = be.sig[key]; }
    var zieht = false, pt = function (e) { var r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    c.addEventListener("pointerdown", function (e) { e.preventDefault(); zieht = true; var p = pt(e); g.beginPath(); g.moveTo(p[0], p[1]); try { c.setPointerCapture(e.pointerId); } catch (x) { /* egal */ } });
    c.addEventListener("pointermove", function (e) { if (!zieht) return; var p = pt(e); g.lineTo(p[0], p[1]); g.stroke(); });
    var ende = function () { if (zieht) { zieht = false; be.sig[key] = c.toDataURL("image/jpeg", 0.85); } };
    c.addEventListener("pointerup", ende); c.addEventListener("pointercancel", ende);
  }
  function auswerten() {
    var ta = document.getElementById("ber-text"), text = ta.value.trim(), out = document.getElementById("ber-erkannt"), v = vorlage(be.vorlage);
    if (!text) { X().toast("Bitte zuerst sprechen oder Text eingeben."); return; }
    var r = AMVO.auswerten(text, v.felder); be.neuK = {};
    r.erkannt.forEach(function (k) { be.werte[k] = r.werte[k]; be.neuK[k] = true; });
    var neuM = [], re = /mangel:\s*([^.]+)/gi, m; while ((m = re.exec(text))) neuM.push(m[1].trim());
    neuM.forEach(function (x) { if (be.maengel.indexOf(x) < 0) be.maengel.push(x); });
    var empf = /empfehlung:\s*([^.]+)/i.exec(text); if (empf && !be.bemerkung) be.bemerkung = "Empfehlung: " + empf[1].trim();
    be.text = text; neuZeichnen(); var bm = document.getElementById("ber-bem"); if (bm && be.bemerkung) bm.value = be.bemerkung;
    out.innerHTML = "<b>" + r.erkannt.length + " Angaben" + (neuM.length ? " und " + neuM.length + " Mangel" + (neuM.length > 1 ? "" : "") : "") + " eingetragen</b> (blau markiert). Bitte kurz prüfen.";
  }
  function mikro() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, btn = document.querySelector("[data-ber-mic]"), ta = document.getElementById("ber-text");
    if (be.sr) { try { be.sr.stop(); } catch (x) { /* schon aus */ } return; }
    if (!SR) { X().toast("Dieser Browser wandelt Sprache nicht selbst in Text um – bitte tippen oder das Mikrofon der Handy-Tastatur nutzen."); ta.focus(); return; }
    var sr = new SR(), basis = ta.value ? ta.value.trim() + " " : ""; sr.lang = "de-DE"; sr.continuous = true; sr.interimResults = true; be.sr = sr;
    sr.onresult = function (e) { var t = ""; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript + (e.results[i].isFinal ? " " : ""); ta.value = basis + t; };
    sr.onend = function () { be.sr = null; if (btn) { btn.classList.remove("aktiv"); btn.lastChild.textContent = "Sprechen"; } if (ta.value.trim()) auswerten(); };
    sr.onerror = function () { X().toast("Spracherkennung nicht verfügbar – bitte Text eintippen."); };
    try { sr.start(); btn.classList.add("aktiv"); btn.lastChild.textContent = "Fertig"; } catch (x) { be.sr = null; }
  }
  function speichern(abschliessen) {
    var x = X(), l = x.state().leads.filter(function (q) { return q.name === be.kunde; })[0], v = vorlage(be.vorlage);
    if (abschliessen && !be.sig.kunde) { x.toast("Bitte zuerst vom Kunden unterschreiben lassen."); return; }
    be.bemerkung = (document.getElementById("ber-bem") || {}).value || "";
    if (abschliessen) be.status = "fertig";
    var istNeu = be.neu; delete be.neu; delete be.neuK; delete be.sr;
    if (istNeu) liste().push(be);
    if (l) x.add(l, v.name + " " + be.nr + (abschliessen ? " vom Kunden unterschrieben" : " als Entwurf gespeichert") + " (" + be.fotos.length + " Fotos)");
    x.speichern(); x.closeDrawer(); x.render();
    x.toast(abschliessen ? "Bericht " + be.nr + " abgeschlossen – das PDF ist bereit." : "Entwurf " + be.nr + " gespeichert.");
  }
  function bytes(url) { var b = atob(url.split(",")[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function sigBild(url) { if (!url) return null; return { bytes: bytes(url), w: 600, h: 200 }; }
  function pdf(b, leer) {
    var x = X(), v = vorlage(b.vorlage), l = x.state().leads.filter(function (q) { return q.name === b.kunde; })[0];
    var mit = function (f) { return Object.assign({}, f, { v: b.werte[f.k] }); };
    var gr = function (k) { return v.felder.filter(function (f) { return f.gr === k; }).map(mit); };
    var gruppen = [{ titel: "Angaben", felder: gr("a") }, { titel: "Prüfpunkte", felder: gr("p") }, { titel: "Messwerte", felder: gr("m") }].filter(function (g) { return g.felder.length; });
    var m = leer ? [1, 2, 3] : b.maengel; gruppen.push({ titel: "Mängel", felder: (m.length ? m : [0]).map(function (t, i) { return { k: "mangel" + i, l: "Mangel " + (i + 1), t: "txt", v: leer || !m.length ? "" : t }; }) });
    var daten = {
      titel: v.name, untertitel: "Bericht-Nr. " + (leer ? "____________" : b.nr), betrieb: x.betrieb, kunde: leer ? "" : x.nameT(b.kunde), adresse: !leer && l && l.ort ? l.ort : "", datum: leer ? "" : b.datum,
      vonLabel: "Ausgeführt von", leer: !!leer, hinweis: v.hinweis || "", gruppen: gruppen, skizze: leer ? undefined : false, skizzeTitel: "Skizze / Lage", fotosTitel: "Fotos",
      fotos: leer ? [] : b.fotos.map(function (f, i) { return { bytes: bytes(f.url), w: f.w, h: f.h, titel: f.titel || "Foto " + (i + 1) }; }),
      bemerkung: b.bemerkung || "", bemerkungTitel: "Bemerkungen und Empfehlungen",
      unterschriftTexte: ["Ausgeführt von (Name, Datum, Unterschrift)", "Kunde (Unterschrift)"], unterschriften: leer ? [] : [sigBild(b.sig.betrieb), sigBild(b.sig.kunde)],
      fuss: x.betrieb + " · Bericht aus der Kundario-Demo (Beispiel, ohne Gewähr)"
    };
    var out = AMVO.zettelPdf(daten), blob = new Blob([out], { type: "application/pdf" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = (leer ? "Vorlage_" : b.nr + "_") + v.name.replace(/[^A-Za-z0-9ÄÖÜäöüß]+/g, "_").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue") + ".pdf";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
    B.letztesPdf = { name: a.download, groesse: out.length };
    x.toast(leer ? "Leere Vorlage erstellt – zum Ausdrucken oder Ausfüllen am Tablet." : "PDF " + b.nr + " erstellt.");
  }
  function oeffnen(b) {
    if (!b) return; var x = X(), esc = x.esc, svg = x.svg, I = x.ICON, v = vorlage(b.vorlage);
    x.closeDrawer(); x.merkeFokus();
    be = JSON.parse(JSON.stringify(b)); if (b.neu) be.neu = true; else be.original = b;
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.addEventListener("click", function () { x.closeDrawer(); });
    var d = document.createElement("div"); d.className = "drawer kf-drawer ber-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "drawer-title"); d.setAttribute("data-nt", "");
    d.innerHTML = x.kopfX(esc(v.name) + " <small>" + esc(be.nr) + " · " + esc(x.nameT(be.kunde)) + "</small>") +
      (v.hinweis ? '<p class="src ber-hinweis">' + esc(v.hinweis) + "</p>" : "") +
      '<div class="kf-layout"><div class="kf-optionen"><ol class="ff-schritte">' +
        '<li><b>Fotos</b><div class="btn-row"><label class="btn btn-outline ff-datei">' + svg(I.camera) + 'Fotos aufnehmen oder wählen<input type="file" accept="image/*" capture="environment" multiple id="ber-datei" hidden></label><button class="btn-mini" type="button" data-ber-bspfoto>Beispielfoto</button></div><div class="ber-fotos" id="ber-fotos"></div></li>' +
        '<li><b>Sprachnachricht</b><div class="btn-row"><button class="btn btn-outline vo-mic" type="button" data-ber-mic>' + svg(MIC) + "<span>Sprechen</span></button><button class=\"btn-mini\" type=\"button\" data-ber-bsptext>Beispiel-Nachricht</button></div>" +
          '<label class="vo-text-l" for="ber-text">Text</label><textarea id="ber-text" rows="3" placeholder="z. B. Anlagendruck 1,6 bar, Sicherheitsventil in Ordnung, Mangel: Dichtung undicht …">' + esc(be.text || "") + "</textarea>" +
          '<div class="btn-row"><button class="btn btn-signal btn-klein" type="button" data-ber-auswerten>Auswerten und eintragen</button></div><p class="src vo-erkannt" id="ber-erkannt" aria-live="polite">Tipp: „Mangel: …“ sagen, dann landet es in der Mängelliste.</p></li>' +
        '<li><b>Checkliste <span class="pill" id="ber-zahl"></span></b><div class="vo-liste" id="ber-felder"></div></li></ol></div>' +
      '<div class="kf-optionen"><h4>Mängel</h4><div id="ber-maengel" class="ber-maengel"></div><div class="btn-row"><button class="btn-mini" type="button" data-ber-mneu>+ Mangel</button></div>' +
        '<h4>Bemerkungen und Empfehlungen</h4><textarea id="ber-bem" rows="3" class="ber-bem">' + esc(be.bemerkung || "") + "</textarea>" +
        "<h4>Unterschriften</h4>" + unterschriftFeld("ber-sig-betrieb", "Ausgeführt von") + unterschriftFeld("ber-sig-kunde", "Kunde") +
        '<div class="kf-knoepfe"><button class="btn btn-signal" type="button" data-ber-fertig>Abschließen (Kunde hat unterschrieben)</button><button class="btn btn-outline" type="button" data-ber-entwurf>Als Entwurf speichern</button>' +
        '<button class="btn btn-outline" type="button" data-ber-pdfjetzt>' + svg(I.doc) + 'PDF erstellen</button><button class="btn-mini" type="button" data-ber-leer>Leere Vorlage zum Ausdrucken</button></div>' +
        '<p class="src">Fotos und Unterschriften bleiben in der Demo in diesem Browser. Im echten Cockpit landet der Bericht in der Kundenakte und kann dem Kunden im Kundenbereich gezeigt werden.</p></div></div>';
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    neuZeichnen(); sigEinrichten(d.querySelector("#ber-sig-betrieb"), "betrieb"); sigEinrichten(d.querySelector("#ber-sig-kunde"), "kunde");
    d.addEventListener("click", function (e) {
      var t = e.target, el;
      if (t.closest("[data-ber-bsptext]")) { document.getElementById("ber-text").value = v.sprache || ""; auswerten(); return; }
      if (t.closest("[data-ber-auswerten]")) { auswerten(); return; }
      if (t.closest("[data-ber-mic]")) { mikro(); return; }
      if (t.closest("[data-ber-mneu]")) { be.maengel.push(""); neuZeichnen("m"); var ins = d.querySelectorAll("[data-ber-m]"); if (ins.length) ins[ins.length - 1].focus(); return; }
      if ((el = t.closest("[data-ber-mdel]"))) { be.maengel.splice(+el.getAttribute("data-ber-mdel"), 1); neuZeichnen("m"); return; }
      if ((el = t.closest("[data-ber-fdel]"))) { be.fotos.splice(+el.getAttribute("data-ber-fdel"), 1); neuZeichnen("b"); return; }
      if (t.closest("[data-ber-bspfoto]")) { if (be.fotos.length >= 6) { x.toast("Höchstens 6 Fotos je Bericht in der Demo."); return; } var c = window.AMVO && /heizung|elektro|solar|dach|sonnenschutz|fenster|garten/.test(x.haupt()) ? AMVO.fassadeFoto() : x.beispielFoto(); var f = klein(c); f.titel = "Beispielfoto"; be.fotos.push(f); neuZeichnen("b"); return; }
      if ((el = t.closest("[data-ber-sigweg]"))) { var cv = d.querySelector("#" + el.getAttribute("data-ber-sigweg")), g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); be.sig[/kunde/.test(cv.id) ? "kunde" : "betrieb"] = null; return; }
      if (t.closest("[data-ber-entwurf]")) { uebernehmen(); speichern(false); return; }
      if (t.closest("[data-ber-fertig]")) { uebernehmen(); speichern(true); return; }
      if (t.closest("[data-ber-pdfjetzt]")) { be.bemerkung = document.getElementById("ber-bem").value; pdf(be, false); return; }
      if (t.closest("[data-ber-leer]")) { pdf(be, true); return; }
    });
    d.querySelector("#ber-datei").addEventListener("change", function (e) {
      var fs = Array.prototype.slice.call(e.target.files || []).filter(function (f) { return /^image\//.test(f.type); }).slice(0, Math.max(0, 6 - be.fotos.length));
      fs.forEach(function (f) { bildAusDatei(f, function (b) { b.titel = "Foto " + (be.fotos.length + 1); be.fotos.push(b); neuZeichnen("b"); }); });
      if (!fs.length) x.toast("Höchstens 6 Fotos je Bericht in der Demo.");
    });
    var aendern = function (e) {
      var t = e.target, k = t.getAttribute && t.getAttribute("data-ber-k"), mi = t.getAttribute && t.getAttribute("data-ber-m");
      if (mi !== null && mi !== undefined) { be.maengel[+mi] = t.value; return; }
      if (!k) return; var f = v.felder.filter(function (q) { return q.k === k; })[0];
      be.werte[k] = f.t === "n" ? (t.value === "" ? null : parseFloat(String(t.value).replace(",", "."))) : t.value;
      if (be.neuK) delete be.neuK[k];
      if (e.type === "change") { if (f.t === "sel" && t.value === "Mangel" && be.maengel.indexOf(f.l) < 0) { be.maengel.push(f.l + ": "); neuZeichnen("m"); } neuZeichnen("f"); }
    };
    d.addEventListener("input", aendern); d.addEventListener("change", aendern);
    var c0 = d.querySelector("[data-close]"); if (c0) c0.focus();
  }
  function uebernehmen() {   // Entwurf in den gespeicherten Bericht zurückschreiben
    var bm = document.getElementById("ber-bem"); if (bm) be.bemerkung = bm.value;
    be.maengel = be.maengel.map(function (m) { return String(m).trim(); }).filter(Boolean);
    if (be.original) { var o = be.original; delete be.original; Object.keys(be).forEach(function (k) { o[k] = be[k]; }); be = o; }
  }
})();
