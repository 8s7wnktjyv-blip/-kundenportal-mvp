/* Kundario – Fristen-Service für Hausverwaltungen: Objekte, Anlagen, Fristen, Heizungsprüfung § 60b
   Inhalt § 60b wie in der freigegebenen Website-Vorschau (Stand November 2026). Keine Rechtsberatung. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;

  var ARTEN = [["heizkessel", "Heizkessel (Gas, Öl, Pellets o. Ä., Wasser als Wärmeträger)"], ["waermepumpe", "Wärmepumpe"], ["fernwaerme", "Fernwärme"], ["sonstige", "Sonstige Anlage"]];
  var ART_NAME = { heizkessel: "Heizkessel", waermepumpe: "Wärmepumpe", fernwaerme: "Fernwärme", sonstige: "Sonstige Anlage" };
  var ST = { offen: ["offen", "warn"], beauftragt: ["beauftragt", "info"], erledigt: ["erledigt", "ok"] };
  var STICHTAG_ALT = "2027-09-30";
  var monatsende = function (j, m) { var d = new Date(j, m, 0); return U.isoTag(new Date(j, m - 1, d.getDate(), 12)); };

  /* ---------- § 60b: Heizungsprüfung ----------
     betroffen: ab 6 Wohnungen/Einheiten, Heizkessel mit Wasser als Wärmeträger (keine Wärmepumpe)
     eingebaut vor dem 01.10.2009 → Prüfung bis 30.09.2027
     eingebaut ab dem 01.10.2009 → innerhalb eines Jahres, nachdem die Heizung 15 Jahre alt ist (= 16 Jahre nach Einbau)
     Fehlt der Einbaumonat, rechnet Kundario mit dem frühestmöglichen Termin und bittet um Ergänzung. */
  K.frist60b = function (objekt, anlage) {
    var e = +objekt.einheiten || 0, j = +anlage.einbau_jahr || 0, m = +anlage.einbau_monat || 0;
    if (anlage.art === "waermepumpe") return { betroffen: false, grund: "Wärmepumpe: eigene Prüfregeln, im Einzelfall klären (Änderungen zum 01.01.2027 angekündigt)." };
    if (anlage.art !== "heizkessel") return { betroffen: false, grund: "Keine Heizungsprüfung nach § 60b nötig." };
    if (e < 6) return { betroffen: false, grund: "Unter 6 Wohnungen oder Einheiten: nicht betroffen." };
    if (!j) return { betroffen: true, faellig: null, grund: "Einbaujahr fehlt – bitte ergänzen, dann rechnet Kundario die Frist." };
    if (j < 2009 || (j === 2009 && m && m < 10)) return { betroffen: true, faellig: STICHTAG_ALT, grund: "Eingebaut vor dem 01.10.2009: Prüfung bis spätestens 30.09.2027." };
    if (j === 2009 && !m) return { betroffen: true, faellig: monatsende(2025, 10), monatFehlt: true, grund: "Einbau 2009 ohne Monat: Kundario rechnet vorsichtig mit Oktober 2009 (Frist 31.10.2025). Bitte Einbaumonat ergänzen." };
    var faellig = monatsende(j + 16, m || 1);
    return { betroffen: true, faellig: faellig, monatFehlt: !m, grund: "Eingebaut " + (m ? ("0" + m).slice(-2) + "/" : "") + j + ": Prüfung innerhalb eines Jahres, nachdem die Heizung 15 Jahre alt ist – bis " + U.datum(faellig) + "." + (m ? "" : " Einbaumonat fehlt, Kundario rechnet vorsichtig mit Januar.") };
  };
  // Fristen nach § 60b für ein Objekt anlegen, anpassen oder entfernen (erledigte bleiben unangetastet)
  K.fristen60bAbgleichen = async function (objektId) {
    var o = await DB.eins("objekte", objektId); if (!o) return;
    var an = await K.liste("anlagen", { wo: { objekt_id: objektId } }), fr = await K.liste("fristen", { wo: { objekt_id: objektId, grundlage: "60b" } });
    for (var a of an) {
      var r = K.frist60b(o, a), meine = fr.filter(function (f) { return f.anlage_id === a.id; }), offen = meine.filter(function (f) { return f.status !== "erledigt"; })[0], erledigt = meine.some(function (f) { return f.status === "erledigt"; });
      var titel = "Heizungsprüfung § 60b" + (a.bezeichnung ? " – " + a.bezeichnung : "");
      if (r.betroffen && r.faellig && !erledigt) {
        if (!offen) await K.neu("fristen", { objekt_id: objektId, anlage_id: a.id, titel: titel, grundlage: "60b", faellig: r.faellig, status: "offen", notiz: r.grund });
        else if (offen.faellig !== r.faellig || offen.titel !== titel) await DB.aendern("fristen", offen.id, { faellig: r.faellig, titel: titel, notiz: r.grund });
      } else if (offen && offen.status === "offen" && (!r.betroffen || !r.faellig)) await DB.loeschen("fristen", offen.id);
    }
    for (var f of fr) if (f.status === "offen" && !an.some(function (a) { return a.id === f.anlage_id; })) await DB.loeschen("fristen", f.id);
  };

  /* ---------- Hilfen ---------- */
  var heute = function () { return U.isoTag(); };
  K.fristLage = function (f) {
    if (f.status === "erledigt") return { klasse: "ok", text: "erledigt" + (f.erledigt_am ? " am " + U.datum(f.erledigt_am) : "") };
    var tage = Math.round((new Date(f.faellig + "T12:00") - new Date(heute() + "T12:00")) / 864e5);
    if (tage < 0) return { klasse: "rot", text: "überfällig seit " + (-tage) + " Tag" + (tage === -1 ? "" : "en"), tage: tage };
    if (tage <= 90) return { klasse: "warn", text: tage === 0 ? "heute fällig" : "in " + tage + " Tag" + (tage === 1 ? "" : "en"), tage: tage };
    return { klasse: "aus", text: "in " + Math.round(tage / 30.4) + " Monaten", tage: tage };
  };
  var objektMap = async function () { var m = {}; (await K.liste("objekte")).forEach(function (o) { m[o.id] = o; }); return m; };
  var adresse = function (o) { return [o.strasse, [o.plz, o.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "); };
  function fristZeile(f, om, mitObjekt) {
    var l = K.fristLage(f), o = om[f.objekt_id] || {};
    return "<tr><td>" + U.datum(f.faellig) + '<br><span class="pill ' + l.klasse + '">' + h(l.text) + "</span></td>" + (mitObjekt ? '<td><a href="#/objekte/' + f.objekt_id + '">' + h(o.name || "") + "</a></td>" : "") +
      "<td><b>" + h(f.titel) + "</b>" + (f.fachbetrieb ? "<br><small>Fachbetrieb: " + h(f.fachbetrieb) + "</small>" : "") + (f.intervall_monate ? "<br><small>wiederkehrend alle " + f.intervall_monate + " Monate</small>" : "") + "</td><td>" + K.status(f.status, ST) + "</td>" +
      '<td class="r knoepfe-zelle">' + (f.status === "erledigt" ? (f.nachweis ? '<button class="btn btn-outline klein" data-a="fristNachweis" data-id="' + f.id + '">Nachweis</button>' : "") :
        (f.status === "offen" ? '<button class="btn btn-outline klein" data-a="fristAnfrage" data-id="' + f.id + '">Fachbetrieb anfragen</button><button class="btn btn-outline klein" data-a="fristBeauftragt" data-id="' + f.id + '">Beauftragt</button>' : "") + '<button class="btn btn-signal klein" data-a="fristErledigt" data-id="' + f.id + '">Erledigt</button>') +
      (f.grundlage === "eigen" && f.status !== "erledigt" ? '<button class="mini" data-a="fristBearb" data-id="' + f.id + '" aria-label="Frist bearbeiten">✎</button>' : "") + "</td></tr>";
  }
  var fristTabelle = function (l, om, mitObjekt) { return '<div class="tabelle"><table class="fristen"><thead><tr><th>Fällig</th>' + (mitObjekt ? "<th>Objekt</th>" : "") + "<th>Frist</th><th>Status</th><th></th></tr></thead><tbody>" + l.map(function (f) { return fristZeile(f, om, mitObjekt); }).join("") + "</tbody></table></div>"; };
  var HINWEIS = '<p class="still klein-text">§ 60b: Heizkessel in Gebäuden ab 6 Wohnungen oder Einheiten. Eingebaut vor dem 01.10.2009: Prüfung bis 30.09.2027; ab dem 01.10.2009: innerhalb eines Jahres, nachdem die Heizung 15 Jahre alt ist. Optimierungen aus der Prüfung sind innerhalb eines Jahres umzusetzen. Stand November 2026, keine Rechtsberatung – im Einzelfall gelten Ausnahmen.</p>';

  /* ---------- Übersicht ---------- */
  var altUebersicht = V.uebersicht;
  V.uebersicht = async function (id, extra) {
    if (!K.istVerwaltung()) return altUebersicht(id, extra);
    var ob = await K.liste("objekte"), fr = await K.liste("fristen", { sortiere: "faellig.asc" }), om = {}; ob.forEach(function (o) { om[o.id] = o; });
    var offen = fr.filter(function (f) { return f.status !== "erledigt"; }), ueber = offen.filter(function (f) { return f.faellig < heute(); }), bald = offen.filter(function (f) { return f.faellig >= heute() && f.faellig <= U.plusTage(null, 90); });
    var p60 = offen.filter(function (f) { return f.grundlage === "60b"; });
    if (!ob.length) return K.kopf("Willkommen, " + K.ctx.betrieb.name, "Fristen für Ihre Objekte im Blick – angefangen mit der Heizungsprüfung nach § 60b.") +
      '<section class="karte"><h2>So starten Sie</h2><ol><li>Objekt anlegen (Adresse, Anzahl Wohnungen/Einheiten).</li><li>Heizung als Anlage erfassen (Art, Einbaujahr).</li><li>Kundario rechnet die Frist und erinnert Sie rechtzeitig.</li></ol><a class="btn btn-signal" href="#/objekte/neu">Erstes Objekt anlegen</a>' + HINWEIS + "</section>";
    return K.kopf("Übersicht", "Was bald fällig ist – und was schon überfällig ist.", '<a class="btn btn-signal" href="#/objekte/neu">Neues Objekt</a>') +
      '<div class="kpis"><div class="kpi k-blau"><span>Objekte</span><b data-zaehl>' + ob.length + '</b></div><div class="kpi k-rot"><span>Überfällig</span><b data-zaehl>' + ueber.length + '</b></div><div class="kpi k-orange"><span>In 90 Tagen fällig</span><b data-zaehl>' + bald.length + '</b></div><div class="kpi k-gruen"><span>Heizungsprüfungen offen</span><b data-zaehl>' + p60.length + "</b></div></div>" +
      (ueber.length || bald.length ? '<section class="karte"><h2>Jetzt kümmern</h2>' + fristTabelle(ueber.concat(bald), om, true) + "</section>" : '<section class="karte"><h2>Alles im grünen Bereich</h2><p>In den nächsten 90 Tagen ist nichts fällig.</p></section>') +
      '<section class="karte"><h2>Heizungsprüfung § 60b</h2>' + (p60.length ? "<p>" + p60.length + " Prüfung" + (p60.length === 1 ? "" : "en") + " offen, die nächste bis " + U.datum(p60[0].faellig) + '.</p><a class="btn btn-outline klein" href="#/fristen">Alle Fristen</a>' : "<p>Keine offene Heizungsprüfung.</p>") + HINWEIS + "</section>";
  };

  if (altUebersicht.danach) V.uebersicht.danach = function (id, extra) { if (!K.istVerwaltung()) return altUebersicht.danach(id, extra); };

  /* ---------- Objekte ---------- */
  V.objekte = async function (id) {
    if (id === "neu") { setTimeout(function () { K.aktion.objektNeu(); }, 0); id = null; history.replaceState(null, "", "#/objekte"); }
    if (id) return objektSeite(id);
    var ob = await K.liste("objekte", { sortiere: "name.asc" }), an = await K.liste("anlagen"), fr = await K.liste("fristen", { wo: { status: ["offen", "beauftragt"] }, sortiere: "faellig.asc" });
    return K.kopf("Objekte", "Ihre Gebäude mit Anlagen und Fristen.", '<button class="btn btn-signal" data-a="objektNeu">Neues Objekt</button>') +
      (ob.length ? '<div class="tabelle"><table><thead><tr><th>Objekt</th><th>Adresse</th><th>Einheiten</th><th>Anlagen</th><th>Nächste Frist</th></tr></thead><tbody>' + ob.map(function (o) {
        var n = fr.filter(function (f) { return f.objekt_id === o.id; })[0], l = n && K.fristLage(n);
        return '<tr data-link="#/objekte/' + o.id + '"><td><a href="#/objekte/' + o.id + '"><b>' + h(o.name) + "</b></a></td><td>" + h(adresse(o)) + "</td><td>" + o.einheiten + "</td><td>" + an.filter(function (a) { return a.objekt_id === o.id; }).length + "</td><td>" + (n ? U.datum(n.faellig) + ' <span class="pill ' + l.klasse + '">' + h(l.text) + "</span>" : "–") + "</td></tr>";
      }).join("") + "</tbody></table></div>" : K.leer("Noch keine Objekte.", '<button class="btn btn-signal" data-a="objektNeu">Erstes Objekt anlegen</button>'));
  };
  async function objektSeite(id) {
    var o = await DB.eins("objekte", id); if (!o) return K.leer("Objekt nicht gefunden.");
    var an = await K.liste("anlagen", { wo: { objekt_id: id }, sortiere: "created_at.asc" }), fr = await K.liste("fristen", { wo: { objekt_id: id }, sortiere: "faellig.asc" }), om = {}; om[o.id] = o;
    return K.kopf(o.name, [adresse(o), o.einheiten + " Wohnungen/Einheiten", o.eigentuemer].filter(Boolean).join(" · "), '<a class="btn btn-outline" href="#/objekte">Zurück</a><button class="btn btn-outline" data-a="objektBearb" data-id="' + id + '">Bearbeiten</button>') +
      '<section class="karte"><h2>Anlagen</h2>' + (an.length ? '<div class="tabelle"><table class="anlagen"><thead><tr><th>Anlage</th><th>Einbau</th><th>Heizungsprüfung § 60b</th><th></th></tr></thead><tbody>' + an.map(function (a) {
        var r = K.frist60b(o, a);
        return "<tr><td><b>" + h(ART_NAME[a.art]) + "</b>" + (a.bezeichnung ? "<br><small>" + h(a.bezeichnung) + "</small>" : "") + (a.hersteller ? "<br><small>" + h(a.hersteller) + "</small>" : "") + "</td><td>" + (a.einbau_jahr ? (a.einbau_monat ? ("0" + a.einbau_monat).slice(-2) + "/" : "") + a.einbau_jahr : '<span class="pill warn">fehlt</span>') + "</td><td>" +
          (r.betroffen ? '<span class="pill ' + (r.faellig && r.faellig < heute() ? "rot" : "warn") + '">betroffen</span> ' : '<span class="pill aus">nicht betroffen</span> ') + "<small>" + h(r.grund) + "</small></td>" +
          '<td class="r"><button class="mini" data-a="anlageBearb" data-id="' + a.id + '" aria-label="Anlage bearbeiten">✎</button></td></tr>';
      }).join("") + "</tbody></table></div>" : "<p>Noch keine Anlage. Erfassen Sie die Heizung, dann rechnet Kundario die Frist.</p>") +
      '<div class="knoepfe links"><button class="btn btn-outline klein" data-a="anlageNeu" data-id="' + id + '">+ Anlage</button></div></section>' +
      '<section class="karte"><h2>Fristen</h2>' + (fr.length ? fristTabelle(fr, om, false) : "<p>Noch keine Fristen.</p>") +
      '<div class="knoepfe links"><button class="btn btn-outline klein" data-a="fristNeu" data-id="' + id + '">+ Eigene Frist</button></div><p class="still klein-text">Eigene Fristen (z. B. Wartung, Begehung) legen Sie mit eigenem Abstand an. Kundario behauptet dafür keine Rechtslage.</p></section>' + HINWEIS;
  }
  async function objektDialog(o) {
    o = o || { einheiten: "" };
    var r = await U.dialog(o.id ? "Objekt bearbeiten" : "Neues Objekt", '<div class="raster">' + U.feld("name", "Bezeichnung", o.name, { pflicht: true, ph: "z. B. Ringstraße 10" }) + U.feld("einheiten", "Wohnungen / Einheiten", o.einheiten, { typ: "number", pflicht: true }) +
      U.feld("strasse", "Straße", o.strasse) + U.feld("plz", "PLZ", o.plz) + U.feld("ort", "Ort", o.ort) + U.feld("eigentuemer", "Eigentümer / WEG", o.eigentuemer) + U.feld("notiz", "Notiz", o.notiz, { typ: "textarea", breit: true }) + "</div>",
      [{ wert: "", text: "Abbrechen" }].concat(o.id ? [{ wert: "weg", text: "Objekt löschen", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return;
    if (r.wert === "weg") {
      if (!(await U.bestaetigen("Objekt mit allen Anlagen und Fristen löschen?", "Löschen", true))) return;
      for (var f of await K.liste("fristen", { wo: { objekt_id: o.id } })) await DB.loeschen("fristen", f.id);
      for (var a of await K.liste("anlagen", { wo: { objekt_id: o.id } })) await DB.loeschen("anlagen", a.id);
      await DB.loeschen("objekte", o.id); U.toast("Objekt gelöscht."); return K.go("objekte");
    }
    var d = r.daten, e = parseInt(d.einheiten, 10); if (!(e >= 1)) throw new Error("Bitte die Anzahl der Wohnungen oder Einheiten angeben (mindestens 1).");
    var obj = { name: d.name.trim(), einheiten: e, strasse: d.strasse || null, plz: d.plz || null, ort: d.ort || null, eigentuemer: d.eigentuemer || null, notiz: d.notiz || null };
    if (o.id) { await DB.aendern("objekte", o.id, obj); await K.fristen60bAbgleichen(o.id); K.neuLaden(); }
    else { var n = await K.neu("objekte", obj); U.toast("Objekt angelegt. Jetzt die Heizung erfassen."); K.go("objekte/" + n.id); }
  }
  K.aktion.objektNeu = function () { return objektDialog(); };
  K.aktion.objektBearb = async function (el) { return objektDialog(await DB.eins("objekte", el.dataset.id)); };

  /* ---------- Anlagen ---------- */
  async function anlageDialog(objektId, a) {
    a = a || { art: "heizkessel" };
    var jahr = new Date().getFullYear();
    var r = await U.dialog(a.id ? "Anlage bearbeiten" : "Neue Anlage", '<div class="raster">' + U.feld("art", "Art", a.art, { optionen: ARTEN, pflicht: true }) + U.feld("bezeichnung", "Bezeichnung", a.bezeichnung, { ph: "z. B. Gaskessel Keller" }) +
      U.feld("einbau_jahr", "Einbaujahr", a.einbau_jahr || "", { typ: "number", hilfe: "Steht auf dem Typenschild oder im Schornsteinfeger-Protokoll." }) + U.feld("einbau_monat", "Einbaumonat", a.einbau_monat || "", { optionen: [["", "unbekannt"]].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return [m, ("0" + m).slice(-2)]; })) }) +
      U.feld("hersteller", "Hersteller / Typ", a.hersteller) + U.feld("notiz", "Notiz", a.notiz, { typ: "textarea", breit: true }) + "</div>",
      [{ wert: "", text: "Abbrechen" }].concat(a.id ? [{ wert: "weg", text: "Anlage entfernen", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return;
    if (r.wert === "weg") {
      if (!(await U.bestaetigen("Anlage entfernen? Offene Fristen dazu werden mit entfernt.", "Entfernen", true))) return;
      for (var f of await K.liste("fristen", { wo: { anlage_id: a.id } })) await DB.loeschen("fristen", f.id);
      await DB.loeschen("anlagen", a.id); return K.neuLaden();
    }
    var d = r.daten, j = d.einbau_jahr ? parseInt(d.einbau_jahr, 10) : null;
    if (j && (j < 1900 || j > jahr)) throw new Error("Bitte ein Einbaujahr zwischen 1900 und " + jahr + " eingeben.");
    var obj = { art: d.art, bezeichnung: d.bezeichnung || null, einbau_jahr: j, einbau_monat: d.einbau_monat ? parseInt(d.einbau_monat, 10) : null, hersteller: d.hersteller || null, notiz: d.notiz || null };
    if (a.id) await DB.aendern("anlagen", a.id, obj); else await K.neu("anlagen", Object.assign({ objekt_id: objektId }, obj));
    await K.fristen60bAbgleichen(objektId);
    var o = await DB.eins("objekte", objektId), res = K.frist60b(o, obj);
    U.toast(res.betroffen && res.faellig ? "Gespeichert. Heizungsprüfung bis " + U.datum(res.faellig) + " eingetragen." : "Gespeichert. " + res.grund); K.neuLaden();
  }
  K.aktion.anlageNeu = function (el) { return anlageDialog(el.dataset.id); };
  K.aktion.anlageBearb = async function (el) { var a = await DB.eins("anlagen", el.dataset.id); return anlageDialog(a.objekt_id, a); };

  /* ---------- Fristen ---------- */
  V.fristen = async function (filter) {
    filter = filter || "offen";
    var wo = filter === "alle" ? {} : filter === "offen" ? { status: ["offen", "beauftragt"] } : { status: filter };
    var l = await K.liste("fristen", { wo: wo, sortiere: filter === "erledigt" ? "erledigt_am.desc" : "faellig.asc" }), om = await objektMap();
    var tab = function (k, t) { return '<a href="#/fristen/' + k + '" aria-pressed="' + (k === filter) + '">' + t + "</a>"; };
    return K.kopf("Fristen", "Alle Prüf- und Wartungsfristen Ihrer Objekte.") + '<nav class="tabs">' + tab("offen", "Offen") + tab("beauftragt", "Beauftragt") + tab("erledigt", "Erledigt") + tab("alle", "Alle") + "</nav>" +
      (l.length ? fristTabelle(l, om, true) : K.leer(filter === "offen" ? "Keine offenen Fristen." : "Nichts in dieser Ansicht.")) + HINWEIS;
  };
  async function fristDialog(objektId, f) {
    f = f || { faellig: U.plusTage(null, 30) };
    var r = await U.dialog(f.id ? "Frist bearbeiten" : "Eigene Frist", '<div class="raster">' + U.feld("titel", "Was ist zu tun?", f.titel, { pflicht: true, ph: "z. B. Rauchwarnmelder prüfen lassen" }) + U.feld("faellig", "Fällig am", f.faellig, { typ: "date", pflicht: true }) +
      U.feld("intervall_monate", "Wiederholen alle … Monate (leer = einmalig)", f.intervall_monate || "", { typ: "number" }) + U.feld("notiz", "Notiz", f.notiz, { typ: "textarea", breit: true }) + "</div>",
      [{ wert: "", text: "Abbrechen" }].concat(f.id ? [{ wert: "weg", text: "Frist löschen", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return;
    if (r.wert === "weg") { await DB.loeschen("fristen", f.id); return K.neuLaden(); }
    var d = r.daten, iv = d.intervall_monate ? parseInt(d.intervall_monate, 10) : null; if (iv != null && !(iv >= 1 && iv <= 240)) throw new Error("Abstand bitte zwischen 1 und 240 Monaten.");
    var obj = { titel: d.titel.trim(), faellig: d.faellig, intervall_monate: iv, notiz: d.notiz || null };
    if (f.id) await DB.aendern("fristen", f.id, obj); else await K.neu("fristen", Object.assign({ objekt_id: objektId, grundlage: "eigen", status: "offen" }, obj));
    K.neuLaden();
  }
  K.aktion.fristNeu = function (el) { return fristDialog(el.dataset.id); };
  K.aktion.fristBearb = async function (el) { var f = await DB.eins("fristen", el.dataset.id); return fristDialog(f.objekt_id, f); };
  K.aktion.fristBeauftragt = async function (el) {
    var f = await DB.eins("fristen", el.dataset.id);
    var r = await U.dialog("Fachbetrieb beauftragt", U.feld("fachbetrieb", "Welcher Fachbetrieb?", f.fachbetrieb, { pflicht: true, ph: "z. B. Heizungsbau Muster" }) + U.feld("notiz", "Termin / Notiz", f.notiz, { typ: "textarea" }));
    if (!r) return; await DB.aendern("fristen", f.id, { status: "beauftragt", fachbetrieb: r.daten.fachbetrieb.trim(), notiz: r.daten.notiz || null }); U.toast("Als beauftragt markiert."); K.neuLaden();
  };
  K.aktion.fristErledigt = async function (el) {
    var f = await DB.eins("fristen", el.dataset.id);
    var r = await U.dialog("Frist erledigt", U.feld("erledigt_am", "Erledigt am", heute(), { typ: "date", pflicht: true }) + '<p><label>Nachweis (Prüfbericht, Foto oder PDF, optional)<br><input type="file" name="datei" accept="image/*,application/pdf"></label></p>' +
      (f.grundlage === "60b" ? '<p class="still">Optimierungen aus der Prüfung sind innerhalb eines Jahres umzusetzen. Legen Sie dafür bei Bedarf eine eigene Frist an.</p>' : "") + (f.intervall_monate ? "<p>Kundario legt danach die nächste Frist in " + f.intervall_monate + " Monaten an.</p>" : ""));
    if (!r) return;
    var d = r.daten; if (d.erledigt_am > heute()) throw new Error("Das Datum liegt in der Zukunft.");
    var inp = document.querySelector("dialog input[name=datei]"), datei = inp && inp.files && inp.files[0], pfad = null;
    if (datei) {
      if (datei.size > 15e6) throw new Error("Die Datei ist zu groß (höchstens 15 MB).");
      if (/^image\//.test(datei.type) && K.bildVerkleinern) datei = await K.bildVerkleinern(datei);
      pfad = K.bid() + "/fristen/" + f.id + "/" + Date.now() + "-" + String(datei.name || "nachweis").replace(/[^\w.\-]/g, "_").slice(-60);
      await DB.datei.hoch(pfad, datei);
    }
    await DB.aendern("fristen", f.id, { status: "erledigt", erledigt_am: d.erledigt_am, nachweis: pfad });
    if (f.intervall_monate) { var n = new Date(f.faellig + "T12:00"); n.setMonth(n.getMonth() + f.intervall_monate); await K.neu("fristen", { objekt_id: f.objekt_id, anlage_id: f.anlage_id, titel: f.titel, grundlage: f.grundlage, faellig: U.isoTag(n), intervall_monate: f.intervall_monate, status: "offen" }); }
    U.toast(f.intervall_monate ? "Erledigt. Nächste Frist angelegt." : "Erledigt."); K.neuLaden();
  };
  K.aktion.fristNachweis = async function (el) {
    var f = await DB.eins("fristen", el.dataset.id), u = f && f.nachweis && await DB.datei.link(f.nachweis); if (!u) throw new Error("Nachweis nicht gefunden.");
    var w = window.open(); if (w) { w.opener = null; w.location = u; } else location.href = u;
  };
})();
