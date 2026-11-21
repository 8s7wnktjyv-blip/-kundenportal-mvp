/* Kundario – Provision für Vertriebspartner (Regeln laut Partnervereinbarung §§ 4–5, Stand 11/2026)
   Provision = halbe Einrichtungsgebühr + erster Monatsbeitrag (netto).
   Fällig, wenn der Betrieb 2 Monate Kunde ist und beide Monatsrechnungen bezahlt hat; Auszahlung bis zum 15. des Folgemonats.
   Entfällt, wenn der Betrieb vorher kündigt oder nicht zahlt. Zuordnung: Link oder Meldung in Textform, 6 Monate gültig,
   nicht wenn Kundario den Betrieb schon in Bearbeitung hatte; bei mehreren Meldungen gilt die früheste.
   Noch nicht in die App eingebunden – wartet auf Freigabe des Plans (unterlagen/Kundario_Plan_Partnerbereich). */
(function (g) {
  "use strict";
  var rund = function (x) { return Math.round((+x || 0) * 100) / 100; };
  var tag = function (d) { return String(d || "").slice(0, 10); };
  var plusMonate = function (d, n) { var x = new Date(tag(d) + "T12:00:00Z"), t = x.getUTCDate(); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n); var max = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate(); x.setUTCDate(Math.min(t, max)); return x.toISOString().slice(0, 10); };
  var auszahlungBis = function (d) { var x = new Date(tag(d) + "T12:00:00Z"); return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 15)).toISOString().slice(0, 10); };

  // Welcher Partner bekommt den Betrieb? meldungen: [{ partner, am, quelle: "link"|"meldung" }], vertragAm: Vertragsschluss, inBearbeitungSeit: Kundario selbst
  function zuordnung(meldungen, vertragAm, inBearbeitungSeit) {
    var gueltig = (meldungen || []).filter(function (m) {
      if (!m || !m.partner || !m.am || tag(m.am) > tag(vertragAm)) return false;
      if (plusMonate(m.am, 6) < tag(vertragAm)) return false;                     // älter als 6 Monate
      if (inBearbeitungSeit && tag(inBearbeitungSeit) <= tag(m.am)) return false;  // Kundario war schon dran
      return true;
    }).sort(function (a, b) { return tag(a.am) < tag(b.am) ? -1 : tag(a.am) > tag(b.am) ? 1 : 0; });
    return gueltig.length ? gueltig[0] : null;
  }
  // Status der Provision für einen Vertrag am Stichtag
  // v: { beginn, einrichtung, monatsbeitrag, gekuendigt_am?, bezahlt: ["JJJJ-MM-TT", …] (Zahltage der Monatsrechnungen 1 und 2) }
  function provision(v, stichtag) {
    var betrag = rund((+v.einrichtung || 0) / 2 + (+v.monatsbeitrag || 0)), zweiMonate = plusMonate(v.beginn, 2), heute = tag(stichtag);
    var bezahlt = (v.bezahlt || []).filter(Boolean).map(tag).sort();
    if (v.gekuendigt_am && tag(v.gekuendigt_am) < zweiMonate) return { status: "entfallen", grund: "vor Ablauf von 2 Monaten gekündigt", betrag: 0 };
    if (heute < zweiMonate) return { status: "offen", grund: "Betrieb noch keine 2 Monate Kunde", betrag: betrag, fruehestens: zweiMonate };
    if (bezahlt.length < 2) return { status: "offen", grund: "Monatsrechnungen noch nicht bezahlt (" + bezahlt.length + " von 2)", betrag: betrag };
    var fallig = bezahlt[1] > zweiMonate ? bezahlt[1] : zweiMonate;
    return { status: "faellig", betrag: betrag, faellig_seit: fallig, zahlen_bis: auszahlungBis(fallig) };
  }
  g.KProvision = { zuordnung: zuordnung, provision: provision, plusMonate: plusMonate };
})(typeof window !== "undefined" ? window : globalThis);
