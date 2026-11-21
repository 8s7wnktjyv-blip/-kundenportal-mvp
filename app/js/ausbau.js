/* Kundario – Ausbau: Katalog, Vorlagen, Zeiterfassung, Plantafel, Wartungsverträge, Protokolle, Suche,
   Portal-Links sperren, E-Rechnung (XRechnung), Fehlerprotokoll, Beispieldaten */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;

  /* CSV aus Excel / Outlook / Großhandel lesen (Semikolon oder Komma, Anführungszeichen) */
  K.csvLesen = function (text) {
    var roh = text.replace(/^\ufeff/, "").replace(/\r/g, "").split("\n").filter(function (z) { return z.trim(); });
    if (roh.length < 2) throw new Error("Die Datei enthält keine Daten.");
    var trenner = (roh[0].match(/;/g) || []).length >= (roh[0].match(/,/g) || []).length ? ";" : ",";
    var teile = function (z) { var out = [], cur = "", inQ = false; for (var i = 0; i < z.length; i++) { var c = z[i]; if (c === '"') { if (inQ && z[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; } else if (c === trenner && !inQ) { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out.map(function (x) { return x.trim(); }); };
    var kopf = teile(roh[0]).map(function (x) { return x.toLowerCase(); });
    return { kopf: kopf, zeilen: roh.slice(1).map(teile), spalte: function (namen) {
      // erst exakte Überschrift, dann Teilwort (nur bei längeren Namen, damit „nr“ nicht in „Artikelnr“ greift)
      var i = kopf.findIndex(function (k) { return namen.indexOf(k) > -1; }); if (i > -1) return i;
      return kopf.findIndex(function (k) { return namen.some(function (n) { return n.length >= 4 && k.indexOf(n) > -1; }); });
    } };
  };

  /* ======================= Katalog ======================= */
  var TYP = { leistung: "Leistung", material: "Material", lohn: "Lohn", text: "Textbaustein" };
  V.katalog = async function () {
    var q = (sessionStorage.getItem("kat-suche") || "").toLowerCase(), alle = await K.liste("artikel", { wo: { aktiv: true }, sortiere: "text.asc" });
    var l = alle.filter(function (a) { return !q || [a.nr, a.text, a.kategorie].join(" ").toLowerCase().indexOf(q) > -1; });
    return K.kopf("Katalog", "Ihre Leistungen, Materialien und Textbausteine – mit einem Tipp im Angebot.", '<button class="btn btn-outline" data-a="katImport">CSV importieren</button><button class="btn btn-signal" data-a="katNeu">Neuer Eintrag</button>') +
      '<input class="suche" type="search" placeholder="Suchen …" value="' + h(q) + '" data-suche="kat-suche">' +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Bezeichnung</th><th>Art</th><th>Einheit</th><th class="r">EK</th><th class="r">Zuschlag</th><th class="r">Preis</th><th></th></tr></thead><tbody>' + l.map(function (a) {
        return "<tr><td><b>" + h(a.text) + "</b>" + (a.nr ? " <small>" + h(a.nr) + "</small>" : "") + (a.langtext ? "<br><small>" + h(a.langtext.slice(0, 120)) + "</small>" : "") + "</td><td>" + h(TYP[a.typ]) + "</td><td>" + h(a.einheit) + '</td><td class="r">' + (a.ek != null ? U.eur(a.ek) : "") + '</td><td class="r">' + (a.zuschlag != null ? U.zahlText(a.zuschlag) + " %" : "") + '</td><td class="r">' + (a.typ === "text" ? "" : U.eur(a.preis)) + '</td><td><button class="mini" data-a="katBearb" data-id="' + a.id + '" aria-label="bearbeiten">✎</button></td></tr>';
      }).join("") + "</tbody></table></div>" : K.leer(q ? "Nichts gefunden." : "Noch leer. Legen Sie Ihre häufigsten Leistungen an oder importieren Sie eine Preisliste (CSV)."));
  };
  async function katDialog(a) {
    a = a || { typ: "leistung", einheit: "Stk." };
    var r = await U.dialog(a.id ? "Eintrag bearbeiten" : "Neuer Eintrag", '<div class="raster">' + U.feld("typ", "Art", a.typ, { optionen: Object.keys(TYP).map(function (k) { return [k, TYP[k]]; }) }) + U.feld("nr", "Artikelnr. (optional)", a.nr) +
      U.feld("text", "Bezeichnung", a.text, { pflicht: true, breit: true }) + U.feld("langtext", "Beschreibung / Text", a.langtext, { typ: "textarea", breit: true }) + U.feld("einheit", "Einheit", a.einheit) +
      U.feld("ek", "Einkaufspreis € (optional)", a.ek != null ? U.zahlText(a.ek, 2) : "", { typ: "number" }) + U.feld("zuschlag", "Zuschlag % (optional)", a.zuschlag != null ? U.zahlText(a.zuschlag) : "", { typ: "number", hilfe: "Preis = EK + Zuschlag, wenn beides ausgefüllt" }) +
      U.feld("preis", "Verkaufspreis € netto", a.preis != null ? U.zahlText(a.preis, 2) : "", { typ: "number" }) + U.feld("kategorie", "Kategorie", a.kategorie) + "</div>",
      [{ wert: "", text: "Abbrechen" }].concat(a.id ? [{ wert: "weg", text: "Löschen", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return;
    if (r.wert === "weg") { await DB.aendern("artikel", a.id, { aktiv: false }); return K.neuLaden(); }
    var d = r.daten, ek = d.ek ? U.zahl(d.ek) : null, zu = d.zuschlag ? U.zahl(d.zuschlag) : null, preis = ek != null && zu != null ? Math.round(ek * (100 + zu)) / 100 : U.zahl(d.preis);
    var obj = { typ: d.typ, nr: d.nr || null, text: d.text.trim(), langtext: d.langtext || null, einheit: d.einheit || "Stk.", ek: ek, zuschlag: zu, preis: preis, kategorie: d.kategorie || null };
    if (a.id) await DB.aendern("artikel", a.id, obj); else await K.neu("artikel", obj);
    U.toast("Gespeichert" + (ek != null && zu != null ? " – Preis aus EK und Zuschlag: " + U.eur(preis) : "") + "."); K.neuLaden();
  }
  K.aktion.katNeu = function () { return katDialog(); };
  K.aktion.katBearb = async function (el) { return katDialog(await DB.eins("artikel", el.dataset.id)); };
  K.aktion.katImport = async function () {
    var r = await U.dialog("Preisliste importieren (CSV)", "<p>Spalten mit Überschrift, getrennt durch Semikolon: <code>Bezeichnung;Einheit;Preis</code> – optional <code>Nr;EK;Art;Beschreibung</code>. So exportieren es Excel und die meisten Großhändler-Portale.</p>" +
      '<input type="file" name="datei" accept=".csv,text/csv" required>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Importieren", primaer: true }]);
    if (!r) return; var f = r.dlg.querySelector("input[type=file]").files[0]; if (!f) return;
    var csv = K.csvLesen(await f.text()), kopf = csv.kopf, zeilen = csv.zeilen, sp = csv.spalte;
    var iT = sp(["bezeichnung", "kurztext", "text", "artikel", "name"]), iE = sp(["einheit", "me"]), iP = sp(["preis", "vk"]), iN = sp(["nr", "artikelnr", "artikelnummer", "nummer"]), iEK = sp(["ek", "einkauf"]), iA = sp(["art", "typ"]), iL = sp(["beschreibung", "langtext"]);
    if (iT < 0) throw new Error("Spalte „Bezeichnung“ nicht gefunden.");
    var n = 0;
    for (var z = 0; z < zeilen.length && z < 2000; z++) {
      var t = zeilen[z]; if (!t[iT]) continue;
      var art = iA > -1 ? String(t[iA]).toLowerCase() : "", typ = /mat/.test(art) ? "material" : /lohn|std|arbeit/.test(art) ? "lohn" : /text/.test(art) ? "text" : "leistung";
      await K.neu("artikel", { typ: typ, text: t[iT].slice(0, 300), einheit: iE > -1 && t[iE] ? t[iE] : "Stk.", preis: iP > -1 ? U.zahl(t[iP]) : 0, nr: iN > -1 ? t[iN] || null : null, ek: iEK > -1 && t[iEK] ? U.zahl(t[iEK]) : null, langtext: iL > -1 ? t[iL] || null : null });
      n++;
    }
    U.toast(n + " Einträge importiert."); K.neuLaden();
  };
  // Positionseditor: Auswahl aus Katalog und Vorlagen (eingebunden in K.posBinden)
  K.katalogWahl = async function () {
    var alle = await K.liste("artikel", { wo: { aktiv: true }, sortiere: "text.asc" });
    if (!alle.length) { if (await U.bestaetigen("Ihr Katalog ist noch leer. Jetzt Einträge anlegen? Nicht gespeicherte Änderungen gehen dabei verloren.", "Zum Katalog")) K.go("katalog"); return []; }
    var r = await U.dialog("Aus dem Katalog", '<input type="search" class="suche" placeholder="Suchen …" data-kat-filter>' +
      '<div class="kat-wahl">' + alle.map(function (a) { return '<label class="chk"><input type="checkbox" name="a_' + a.id + '"> <span><b>' + h(a.text) + "</b> <small>" + (a.typ === "text" ? "Textbaustein" : U.eur(a.preis) + " / " + h(a.einheit)) + "</small></span></label>"; }).join("") + "</div>",
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Einfügen", primaer: true }]);
    if (!r) return [];
    return alle.filter(function (a) { return r.daten["a_" + a.id]; }).map(function (a) {
      if (a.typ === "text") return { id: U.uuid(), typ: "text", text: a.langtext || a.text };
      var p = { id: U.uuid(), typ: "pos", text: a.text, langtext: a.langtext || "", menge: 1, einheit: a.einheit, preis: +a.preis, artikel_id: a.id };
      if (a.typ === "lohn") p.lohn = true; if (a.typ === "material") p.lohn = false; return p;
    });
  };
  document.addEventListener("input", function (e) { var f = e.target.closest("[data-kat-filter]"); if (!f) return; var q = f.value.toLowerCase(); f.parentNode.querySelectorAll(".kat-wahl label").forEach(function (l) { l.hidden = !!q && l.textContent.toLowerCase().indexOf(q) < 0; }); });


  /* ======================= Nachträge zum laufenden Auftrag ======================= */
  // Gespeichert im Auftrag unter kalk.nachtraege = [{ id: Angebots-ID, uebernommen: true/false }]
  K.nachtragVon = async function (a) {
    if (!a || !a.kunde_id) return null;
    var l = await K.liste("auftraege", { wo: { kunde_id: a.kunde_id } });
    for (var i = 0; i < l.length; i++) { var e = ((l[i].kalk || {}).nachtraege || []).filter(function (x) { return x.id === a.id; })[0]; if (e) return { au: l[i], eintrag: e }; }
    return null;
  };
  K.nachtraegeHtml = async function (au) {
    if (!K.darf("angebote")) return "";
    var liste = (au.kalk || {}).nachtraege || [], an = liste.length ? await K.liste("angebote", { wo: { id: liste.map(function (x) { return x.id; }) } }) : [];
    var summe = an.filter(function (a) { return a.status === "angenommen"; }).reduce(function (s, a) { return s + (+a.netto || 0); }, 0);
    return '<section class="karte"><div class="kopf-zeile"><h2>Nachträge</h2><button class="btn btn-outline klein" data-a="nachtragNeu" data-id="' + au.id + '">Nachtrag anlegen</button></div>' +
      '<p class="still">Zusätzliche Leistungen, die nicht im Auftrag stehen. Erst anbieten, dann ausführen – so wird die Mehrarbeit auch bezahlt.</p>' +
      (an.length ? '<ul class="liste">' + an.map(function (a) { var e = liste.filter(function (x) { return x.id === a.id; })[0] || {};
        return '<li><a href="#/angebote/' + a.id + '">' + h(a.nr + " · " + a.titel) + "</a> " + K.status(a.status, K.ST.angebot) + " " + U.eur(a.netto) + " netto" + (e.uebernommen ? ' <span class="pill ok">im Auftragswert</span>' : "") + "</li>"; }).join("") + "</ul>" +
        (summe ? "<p>Angenommene Nachträge: <b>" + U.eur(summe) + " netto</b></p>" : "") : "") + "</section>";
  };
  K.aktion.nachtragNeu = async function (el) {
    var au = await DB.eins("auftraege", el.dataset.id), n = (((au.kalk || {}).nachtraege) || []).length + 1;
    var r = await U.dialog("Nachtrag anlegen", U.feld("titel", "Was kommt dazu?", "", { pflicht: true, ph: "z. B. Zusätzliche Steckdosen Küche" }) + '<p class="still">Es entsteht ein Angebot für ' + h(au.nr) + '. Danach Positionen eintragen und an den Kunden senden.</p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Anlegen", primaer: true }]);
    if (!r) return;
    var a = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: au.kunde_id, titel: "Nachtrag " + n + " zu " + au.nr + ": " + r.daten.titel.trim(), einleitung: "Nachtrag zum Auftrag " + au.nr + " (" + au.titel + "). Die folgenden Leistungen sind im bisherigen Auftrag nicht enthalten.", mwst: K.mwst(), steuerfall: K.reStandard().steuerfall, positionen: [{ id: U.uuid(), typ: "pos", text: "", menge: 1, einheit: "Stk.", preis: 0 }] });
    var k = Object.assign({}, au.kalk || {}); k.nachtraege = (k.nachtraege || []).concat([{ id: a.id, uebernommen: false }]);
    await DB.aendern("auftraege", au.id, { kalk: k }); await K.verlauf("auftrag", au.id, "Nachtrag " + a.nr + " angelegt: " + r.daten.titel.trim());
    K.go("angebote/" + a.id);
  };
  K.aktion.nachtragUebernehmen = async function (el) {
    var a = await DB.eins("angebote", el.dataset.id), nt = await K.nachtragVon(a); if (!nt) throw new Error("Kein Auftrag zu diesem Nachtrag gefunden.");
    if (nt.eintrag.uebernommen) return U.toast("Schon im Auftragswert enthalten.");
    var k = Object.assign({}, nt.au.kalk || {}); k.nachtraege = (k.nachtraege || []).map(function (x) { return x.id === a.id ? Object.assign({}, x, { uebernommen: true }) : x; });
    var neu = Math.round(((+nt.au.wert_netto || 0) + (+a.netto || 0)) * 100) / 100;
    await DB.aendern("auftraege", nt.au.id, { kalk: k, wert_netto: neu });
    await K.verlauf("auftrag", nt.au.id, "Nachtrag " + a.nr + " angenommen, Auftragswert jetzt " + U.eur(neu) + " netto"); await K.verlauf("angebot", a.id, "Zum Auftrag " + nt.au.nr + " hinzugefügt");
    U.toast("Nachtrag übernommen. Auftragswert jetzt " + U.eur(neu) + " netto."); K.go("auftraege/" + nt.au.id);
  };

  /* ======================= Vorlagen ======================= */
  K.vorlageWahl = async function () {
    var vs = await K.liste("vorlagen", { sortiere: "titel.asc" }); if (!vs.length) throw new Error("Noch keine Vorlagen. Öffnen Sie ein fertiges Angebot und tippen Sie „Als Vorlage speichern“.");
    var r = await U.dialog("Vorlage einfügen", U.feld("v", "Vorlage", vs[0].id, { optionen: vs.map(function (v) { return [v.id, v.titel + " (" + v.positionen.length + " Positionen)"]; }) }) + '<p class="still">Die Positionen werden unten angehängt.</p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Einfügen", primaer: true }]);
    if (!r) return [];
    var v = vs.filter(function (x) { return x.id === r.daten.v; })[0];
    return v.positionen.map(function (p) { return Object.assign({}, p, { id: U.uuid() }); });
  };
  K.aktion.alsVorlage = async function (el) {
    if (K.angebotSpeichernFallsOffen) await K.angebotSpeichernFallsOffen();
    var a = await DB.eins("angebote", el.dataset.id), pos = a.positionen.filter(function (p) { return p.typ !== "pos" || String(p.text).trim(); });
    if (!pos.length) throw new Error("Das Angebot hat noch keine Positionen.");
    var r = await U.dialog("Als Vorlage speichern", U.feld("titel", "Name der Vorlage", a.titel, { pflicht: true }) + '<p class="still">Kunde und Preise bleiben im Angebot. Die Vorlage enthält ' + pos.length + " Positionen.</p>", [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Speichern", primaer: true }]); if (!r) return;
    await K.neu("vorlagen", { titel: r.daten.titel.trim(), einleitung: a.einleitung || null, positionen: pos }); U.toast("Vorlage gespeichert.");
  };
  V.vorlagen = async function () {
    var vs = await K.liste("vorlagen", { sortiere: "titel.asc" });
    return K.kopf("Angebotsvorlagen", "Wiederkehrende Angebote als Vorlage. Im Angebot über „+ Aus Vorlage“ einfügen.") +
      (vs.length ? '<div class="karte"><ul class="liste">' + vs.map(function (v) { return "<li><b>" + h(v.titel) + "</b> · " + v.positionen.length + ' Positionen <button class="mini" data-a="vorlageWeg" data-id="' + v.id + '" aria-label="löschen">×</button></li>'; }).join("") + "</ul></div>" : K.leer("Noch keine Vorlagen. Öffnen Sie ein Angebot und tippen Sie „Als Vorlage speichern“."));
  };
  K.aktion.vorlageWeg = async function (el) { if (!(await U.bestaetigen("Vorlage löschen?", "Löschen", true))) return; await DB.loeschen("vorlagen", el.dataset.id); K.neuLaden(); };

  /* ======================= Zeiterfassung ======================= */
  function dauerMin(z) { if (!z.ende) return Math.max(0, Math.round((Date.now() - new Date(z.beginn)) / 6e4) - z.pause_min); return Math.max(0, Math.round((new Date(z.ende) - new Date(z.beginn)) / 6e4) - z.pause_min); }
  var std = function (min) { return Math.floor(min / 60) + ":" + ("0" + (min % 60)).slice(-2) + " Std."; };
  V.zeiten = async function () {
    var ich = K.ctx.user.id, alle = K.darf("rechnungen"), wer = alle ? (sessionStorage.getItem("zeit-wer") || ich) : ich;
    var mon = new Date(); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7)); var off = +(sessionStorage.getItem("zeit-woche") || 0); mon.setDate(mon.getDate() + off * 7);
    var bis = new Date(mon.getTime() + 7 * 864e5), z = (await K.liste("zeiten", { wo: { user_id: wer }, sortiere: "beginn.desc", limit: 400 }));
    var laeuft = z.filter(function (x) { return !x.ende; })[0], woche = z.filter(function (x) { var b = new Date(x.beginn); return b >= mon && b < bis; });
    var summe = woche.reduce(function (s, x) { return s + dauerMin(x); }, 0), au = await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit"] }, sortiere: "nr.desc" });
    var tage = []; for (var i = 0; i < 7; i++) { var d = new Date(mon.getTime() + i * 864e5), iso = U.isoTag(d); tage.push({ d: d, l: woche.filter(function (x) { return U.isoTag(x.beginn) === iso; }) }); }
    return K.kopf("Zeiterfassung", "Arbeitszeit mit Kommen, Gehen und Pause – nach Arbeitszeitgesetz aufgezeichnet.", '<button class="btn btn-outline" data-a="zeitExport">Als CSV</button>') +
      (alle ? '<div class="zeile-form"><select data-a-change="zeitWer">' + K.ctx.team.map(function (m) { return '<option value="' + m.user_id + '"' + (m.user_id === wer ? " selected" : "") + ">" + h(m.name) + "</option>"; }).join("") + "</select></div>" : "") +
      (wer === ich ? '<section class="karte stempel ' + (laeuft ? "laeuft" : "") + '">' + (laeuft ? "<p>Sie arbeiten seit <b>" + U.zeit(laeuft.beginn) + " Uhr</b> (" + std(dauerMin(laeuft)) + ")" + (laeuft.auftrag_id ? "" : "") + '</p><div class="knoepfe links"><button class="btn btn-signal" data-a="gehen" data-id="' + laeuft.id + '">Gehen</button></div>' :
        '<form class="zeile-form" data-f="kommen"><select name="auftrag_id"><option value="">ohne Auftrag</option>' + au.map(function (a) { return '<option value="' + a.id + '">' + h(a.nr + " · " + a.titel) + "</option>"; }).join("") + '</select><button class="btn btn-signal">Kommen</button></form>') + "</section>" : "") +
      '<div class="kopf-zeile"><h2>Woche ab ' + U.datum(mon) + " · " + std(summe) + '</h2><span><button class="btn btn-outline klein" data-a="zeitWoche" data-n="-1">‹</button> <button class="btn btn-outline klein" data-a="zeitWoche" data-n="0">Diese Woche</button> <button class="btn btn-outline klein" data-a="zeitWoche" data-n="1">›</button> <button class="btn btn-outline klein" data-a="zeitNachtrag">Nachtragen</button></span></div>' +
      '<div class="karte"><ul class="liste">' + tage.map(function (t) { var m = t.l.reduce(function (s, x) { return s + dauerMin(x); }, 0);
        return "<li><b>" + t.d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }) + "</b> " + (t.l.length ? t.l.map(function (x) { return U.zeit(x.beginn) + "–" + (x.ende ? U.zeit(x.ende) : "läuft") + (x.pause_min ? " (Pause " + x.pause_min + " Min.)" : ""); }).join(", ") + " · <b>" + std(m) + "</b>" + (m > 600 ? ' <span class="pill rot">über 10 Std.</span>' : m > 360 && t.l.reduce(function (s, x) { return s + x.pause_min; }, 0) < 30 ? ' <span class="pill warn">Pause fehlt</span>' : "") : '<span class="still">–</span>') + "</li>"; }).join("") + "</ul></div>";
  };
  K.aktion.zeitWer = function (el) { sessionStorage.setItem("zeit-wer", el.value); K.neuLaden(); };
  K.aktion.zeitWoche = function (el) { var n = +el.dataset.n; sessionStorage.setItem("zeit-woche", n === 0 ? 0 : (+(sessionStorage.getItem("zeit-woche") || 0) + n)); K.neuLaden(); };
  K.formular.kommen = async function (d) { await K.neu("zeiten", { user_id: K.ctx.user.id, beginn: new Date().toISOString(), auftrag_id: d.auftrag_id || null }); U.toast("Guten Start!"); K.neuLaden(); };
  K.aktion.gehen = async function (el) {
    var z = await DB.eins("zeiten", el.dataset.id), min = Math.round((Date.now() - new Date(z.beginn)) / 6e4), vorschlag = min > 540 ? 45 : min > 360 ? 30 : 0;
    var r = await U.dialog("Feierabend", "<p>Arbeitszeit seit " + U.zeit(z.beginn) + " Uhr.</p>" + U.feld("pause", "Pause in Minuten", String(vorschlag), { typ: "number", hilfe: "Gesetzlich: ab 6 Std. mindestens 30 Min., ab 9 Std. 45 Min." })); if (!r) return;
    await DB.aendern("zeiten", z.id, { ende: new Date().toISOString(), pause_min: parseInt(r.daten.pause, 10) || 0 }); U.toast("Schönen Feierabend!"); K.neuLaden();
  };
  K.aktion.zeitNachtrag = async function () {
    var r = await U.dialog("Zeit nachtragen", '<div class="raster">' + U.feld("tag", "Datum", U.isoTag(), { typ: "date", pflicht: true }) + U.feld("von", "Von", "07:00", { typ: "time", pflicht: true }) + U.feld("bis", "Bis", "16:00", { typ: "time", pflicht: true }) + U.feld("pause", "Pause (Min.)", "30", { typ: "number" }) + U.feld("notiz", "Notiz", "") + "</div>"); if (!r) return;
    var b = new Date(r.daten.tag + "T" + r.daten.von), e = new Date(r.daten.tag + "T" + r.daten.bis); if (e <= b) throw new Error("„Bis“ muss nach „Von“ liegen.");
    var wer = K.darf("rechnungen") ? (sessionStorage.getItem("zeit-wer") || K.ctx.user.id) : K.ctx.user.id;
    await K.neu("zeiten", { user_id: wer, beginn: b.toISOString(), ende: e.toISOString(), pause_min: parseInt(r.daten.pause, 10) || 0, notiz: (r.daten.notiz ? r.daten.notiz + " " : "") + "(nachgetragen)" }); K.neuLaden();
  };
  K.aktion.zeitExport = async function () {
    var z = await K.liste("zeiten", { sortiere: "beginn.asc" }), zeilen = [["Mitarbeiter", "Datum", "Beginn", "Ende", "Pause (Min.)", "Arbeitszeit (Std.)", "Notiz"]];
    z.forEach(function (x) { zeilen.push([K.mitgliedName(x.user_id), U.datum(x.beginn), U.zeit(x.beginn), x.ende ? U.zeit(x.ende) : "", x.pause_min, (dauerMin(x) / 60).toFixed(2).replace(".", ","), x.notiz || ""]); });
    var csv = "﻿" + zeilen.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "arbeitszeiten-" + U.isoTag() + ".csv"; a.click();
  };

  /* ======================= Plantafel ======================= */
  V.plantafel = async function () {
    var mon = new Date(); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7)); mon.setDate(mon.getDate() + (+(sessionStorage.getItem("pt-woche") || 0)) * 7);
    var t = (await K.liste("termine", { sortiere: "beginn.asc" })).filter(function (x) { var b = new Date(x.beginn); return b >= mon && b < new Date(mon.getTime() + 7 * 864e5); });
    var team = K.ctx.team.filter(function (m) { return m.aktiv; }), tage = []; for (var i = 0; i < 6; i++) tage.push(new Date(mon.getTime() + i * 864e5));
    var zelle = function (m, d) { var iso = U.isoTag(d); return '<td data-drop data-m="' + m.user_id + '" data-tag="' + iso + '">' + t.filter(function (x) { return U.isoTag(x.beginn) === iso && (x.mitarbeiter || []).indexOf(m.user_id) > -1; }).map(function (x) { return '<a class="pt-t art-' + x.art + '" draggable="true" data-t="' + x.id + '" data-von="' + m.user_id + '" href="#/kalender/' + x.id + '"><b>' + U.zeit(x.beginn) + "</b> " + h(x.titel) + "</a>"; }).join("") + "</td>"; };
    var offen = t.filter(function (x) { return !(x.mitarbeiter || []).length; });
    return K.kopf("Plantafel", "Wer ist wann wo? Termine mit der Maus auf andere Mitarbeiter oder Tage ziehen. Am Handy: Termin antippen und dort ändern.", '<button class="btn btn-outline" data-a="ptWoche" data-n="-1">‹ Woche</button><button class="btn btn-outline" data-a="ptWoche" data-n="0">Heute</button><button class="btn btn-outline" data-a="ptWoche" data-n="1">Woche ›</button><button class="btn btn-signal" data-a="terminNeu">Neuer Termin</button>') +
      '<div class="tabelle plantafel"><table><thead><tr><th>Mitarbeiter</th>' + tage.map(function (d) { return "<th" + (U.isoTag(d) === U.isoTag() ? ' class="heute"' : "") + ">" + d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        team.map(function (m) { return "<tr><th>" + h(m.name) + "<br><small>" + h(K.rolleName[m.rolle]) + "</small></th>" + tage.map(function (d) { return zelle(m, d); }).join("") + "</tr>"; }).join("") + "</tbody></table></div>" +
      (offen.length ? '<section class="karte"><h2>Noch niemandem zugeteilt</h2><ul class="liste">' + offen.map(function (x) { return '<li><a href="#/kalender/' + x.id + '">' + U.datumZeit(x.beginn) + " · " + h(x.titel) + "</a></li>"; }).join("") + "</ul></section>" : "");
  };
  K.aktion.ptWoche = function (el) { var n = +el.dataset.n; sessionStorage.setItem("pt-woche", n === 0 ? 0 : (+(sessionStorage.getItem("pt-woche") || 0) + n)); K.neuLaden(); };
  document.addEventListener("dragstart", function (e) { var a = e.target.closest("[data-t]"); if (!a) return; e.dataTransfer.setData("text/plain", JSON.stringify({ t: a.dataset.t, von: a.dataset.von })); });
  document.addEventListener("dragover", function (e) { var z = e.target.closest("[data-drop]"); if (z) { e.preventDefault(); z.classList.add("drop"); } });
  document.addEventListener("dragleave", function (e) { var z = e.target.closest("[data-drop]"); if (z) z.classList.remove("drop"); });
  document.addEventListener("drop", async function (e) {
    var z = e.target.closest("[data-drop]"); if (!z) return; e.preventDefault(); z.classList.remove("drop");
    try {
      var info = JSON.parse(e.dataTransfer.getData("text/plain")), t = await DB.eins("termine", info.t);
      var alt = new Date(t.beginn), neu = new Date(z.dataset.tag + "T" + ("0" + alt.getHours()).slice(-2) + ":" + ("0" + alt.getMinutes()).slice(-2)), dauer = t.ende ? new Date(t.ende) - alt : 0;
      var m = (t.mitarbeiter || []).filter(function (x) { return x !== info.von; }); if (m.indexOf(z.dataset.m) < 0) m.push(z.dataset.m);
      await DB.aendern("termine", t.id, { beginn: neu.toISOString(), ende: dauer ? new Date(neu.getTime() + dauer).toISOString() : null, mitarbeiter: m });
      if (t.auftrag_id) await K.verlauf("auftrag", t.auftrag_id, "Termin " + t.titel + " verschoben auf " + U.datum(neu) + " (" + K.mitgliedName(z.dataset.m) + ")");
      U.toast("Termin verschoben."); K.neuLaden();
    } catch (x) { U.fehler(x); }
  });

  /* ======================= Wartungsverträge ======================= */
  V.wartungen = async function () {
    var l = await K.liste("wartungen", { wo: { aktiv: true }, sortiere: "naechste.asc" }), km = await K.kundenMap(), heute = U.isoTag(), bald = U.plusTage(null, 30);
    return K.kopf("Wartungsverträge", "Wiederkehrende Wartungen – Kundario erinnert, bevor sie fällig werden.", '<button class="btn btn-signal" data-a="wartungNeu">Neuer Vertrag</button>') +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Anlage / Leistung</th><th>Kunde</th><th>Intervall</th><th>Nächste</th><th class="r">Preis</th><th></th></tr></thead><tbody>' + l.map(function (w) {
        var f = w.naechste < heute ? '<span class="pill rot">überfällig</span>' : w.naechste <= bald ? '<span class="pill warn">bald fällig</span>' : "";
        return "<tr><td><b>" + h(w.titel) + "</b>" + (w.anlage ? "<br><small>" + h(w.anlage) + "</small>" : "") + "</td><td>" + h(km[w.kunde_id] ? km[w.kunde_id].name : "") + "</td><td>alle " + w.intervall_monate + " Monate</td><td>" + U.datum(w.naechste) + " " + f + '</td><td class="r">' + (w.preis ? U.eur(w.preis) : "") + '</td><td><button class="btn btn-outline klein" data-a="wartungTermin" data-id="' + w.id + '">Termin planen</button> <button class="mini" data-a="wartungBearb" data-id="' + w.id + '">✎</button></td></tr>';
      }).join("") + "</tbody></table></div>" : K.leer("Noch keine Wartungsverträge. Ideal für Heizungen, Klimaanlagen, Elektroprüfungen, Dachkontrollen."));
  };
  async function wartungDialog(w) {
    w = w || { intervall_monate: 12, naechste: U.plusTage(null, 30) };
    var r = await U.dialog(w.id ? "Wartungsvertrag" : "Neuer Wartungsvertrag", '<div class="raster">' + (await K.kundeWahl("kunde_id", w.kunde_id, false)) + U.feld("titel", "Leistung", w.titel, { pflicht: true, ph: "z. B. Jährliche Heizungswartung" }) + U.feld("anlage", "Anlage (Typ, Baujahr, Seriennr.)", w.anlage) +
      U.feld("ort", "Ort", w.ort) + U.feld("intervall_monate", "Intervall (Monate)", w.intervall_monate, { typ: "number", pflicht: true }) + U.feld("naechste", "Nächste Wartung", w.naechste, { typ: "date", pflicht: true }) + U.feld("preis", "Preis netto (€)", w.preis ? U.zahlText(w.preis, 2) : "", { typ: "number" }) + U.feld("notiz", "Notiz", w.notiz, { typ: "textarea", breit: true }) + "</div>",
      [{ wert: "", text: "Abbrechen" }].concat(w.id ? [{ wert: "ende", text: "Vertrag beenden", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return; if (r.wert === "ende") { await DB.aendern("wartungen", w.id, { aktiv: false }); return K.neuLaden(); }
    var d = r.daten; if (!d.kunde_id) throw new Error("Bitte einen Kunden wählen.");
    var obj = { kunde_id: d.kunde_id, titel: d.titel, anlage: d.anlage || null, ort: d.ort || null, intervall_monate: parseInt(d.intervall_monate, 10) || 12, naechste: d.naechste, preis: d.preis ? U.zahl(d.preis) : null, notiz: d.notiz || null };
    if (w.id) await DB.aendern("wartungen", w.id, obj); else await K.neu("wartungen", obj); K.neuLaden();
  }
  K.aktion.wartungNeu = function () { return wartungDialog(); };
  K.aktion.wartungBearb = async function (el) { return wartungDialog(await DB.eins("wartungen", el.dataset.id)); };
  K.aktion.wartungTermin = async function (el) {
    var w = await DB.eins("wartungen", el.dataset.id), k = await DB.eins("kunden", w.kunde_id);
    var r = await U.dialog("Wartung planen", '<div class="raster">' + U.feld("tag", "Datum", w.naechste < U.isoTag() ? U.plusTage(null, 3) : w.naechste, { typ: "date", pflicht: true }) + U.feld("zeit", "Uhrzeit", "09:00", { typ: "time", pflicht: true }) + U.feld("wer", "Wer?", K.ctx.user.id, { optionen: K.ctx.team.map(function (m) { return [m.user_id, m.name]; }) }) + "</div>"); if (!r) return;
    var b = new Date(r.daten.tag + "T" + r.daten.zeit);
    await K.neu("termine", { kunde_id: w.kunde_id, art: "wartung", titel: w.titel + " – " + k.name, beginn: b.toISOString(), ende: new Date(b.getTime() + 90 * 6e4).toISOString(), ort: w.ort || [k.strasse, k.plz, k.ort].filter(Boolean).join(" "), mitarbeiter: [r.daten.wer], notiz: w.anlage || null });
    var n = new Date(r.daten.tag + "T12:00"); n.setMonth(n.getMonth() + w.intervall_monate);
    await DB.aendern("wartungen", w.id, { naechste: U.isoTag(n) }); await K.verlauf("kunde", k.id, "Wartung geplant: " + U.datumZeit(b));
    U.toast("Termin angelegt, nächste Wartung " + U.datum(n) + "."); K.neuLaden();
  };
  K.wartungenFaellig = async function () { try { return (await K.liste("wartungen", { wo: { aktiv: true } })).filter(function (w) { return w.naechste <= U.plusTage(null, 30); }); } catch (e) { return []; } };

  /* ======================= Protokolle je Gewerk ======================= */
  var PV = {
    elektro_pruef: { titel: "Prüfprotokoll Elektro (Wiederholungsprüfung)", gewerk: "Elektro", felder: [["anlage", "Anlage / Verteilung", "text"], ["netz", "Netzform", ["TN-C-S", "TN-S", "TT"]], ["sichtpruefung", "Sichtprüfung in Ordnung", "ja"], ["riso", "Isolationswiderstand (MΩ)", "zahl"], ["rlo", "Schutzleiterwiderstand (Ω)", "zahl"], ["zs", "Schleifenimpedanz Zs (Ω)", "zahl"], ["rcd_ia", "RCD Auslösestrom (mA)", "zahl"], ["rcd_ta", "RCD Auslösezeit (ms)", "zahl"], ["drehfeld", "Drehfeld rechts", "ja"], ["messgeraet", "Messgerät", "text"], ["maengel", "Mängel", "lang"]] },
    shk_wartung: { titel: "Wartungsprotokoll Heizung (SHK)", gewerk: "SHK", felder: [["geraet", "Gerät / Hersteller / Typ", "text"], ["baujahr", "Baujahr", "text"], ["brenner", "Brenner gereinigt", "ja"], ["waermetauscher", "Wärmetauscher gereinigt", "ja"], ["druck", "Anlagendruck (bar)", "zahl"], ["co", "CO-Wert (ppm)", "zahl"], ["abgasverlust", "Abgasverlust (%)", "zahl"], ["dichtheit", "Gasleitung dicht", "ja"], ["ausdehnung", "Ausdehnungsgefäß Vordruck (bar)", "zahl"], ["maengel", "Mängel / Empfehlung", "lang"]] },
    abnahme: { titel: "Abnahmeprotokoll", gewerk: "alle Gewerke", felder: [["leistung", "Abgenommene Leistung", "lang"], ["vollstaendig", "Leistung vollständig erbracht", "ja"], ["maengel", "Festgestellte Mängel", "lang"], ["frist", "Frist zur Mängelbeseitigung", "text"], ["vorbehalt", "Abnahme unter Vorbehalt", "ja"]] },
    dach_kontrolle: { titel: "Dachkontrolle", gewerk: "Dachdecker", felder: [["eindeckung", "Eindeckung in Ordnung", "ja"], ["rinnen", "Dachrinnen frei", "ja"], ["anschluesse", "Anschlüsse dicht", "ja"], ["fotos", "Fotos gemacht", "ja"], ["maengel", "Mängel", "lang"]] },
    maler_untergrund: { titel: "Untergrundprüfung Maler", gewerk: "Maler", felder: [["flaeche", "Fläche / Raum", "text"], ["tragfaehig", "Untergrund tragfähig", "ja"], ["feuchte", "Feuchte (%)", "zahl"], ["kreidend", "Kreidend", "ja"], ["vorbehandlung", "Vorbehandlung nötig", "lang"]] }
  };
  V.protokolle = async function (id, extra) {
    if (id === "neu") return protokollNeu(extra);
    if (id) return protokollForm(await DB.eins("protokolle", id));
    var l = await K.liste("protokolle", { sortiere: "created_at.desc", limit: 200 }), km = await K.kundenMap();
    return K.kopf("Protokolle", "Prüf-, Wartungs- und Abnahmeprotokolle mit Unterschrift – je Gewerk.", '<a class="btn btn-signal" href="#/protokolle/neu">Neues Protokoll</a>') +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Protokoll</th><th>Kunde</th><th>Datum</th><th>Ergebnis</th></tr></thead><tbody>' + l.map(function (p) { return '<tr data-link="#/protokolle/' + p.id + '"><td><a href="#/protokolle/' + p.id + '">' + h(p.titel) + "</a></td><td>" + h(km[p.kunde_id] ? km[p.kunde_id].name : "") + "</td><td>" + U.datum(p.created_at) + "</td><td>" + (p.ergebnis ? K.status(p.ergebnis, { ok: ["in Ordnung", "ok"], maengel: ["mit Mängeln", "warn"], nicht_ok: ["nicht in Ordnung", "rot"] }) : "") + "</td></tr>"; }).join("") + "</tbody></table></div>" : K.leer("Noch keine Protokolle."));
  };
  async function protokollNeu(auftragId) {
    return K.kopf("Neues Protokoll") + '<form class="karte formular" data-f="protokollNeu"><div class="raster">' + U.feld("vorlage", "Vorlage", "", { optionen: Object.keys(PV).map(function (k) { return [k, PV[k].titel + " – " + PV[k].gewerk]; }) }) + (await K.kundeWahl("kunde_id", "", false)) + "</div><input type=\"hidden\" name=\"auftrag_id\" value=\"" + h(auftragId || "") + '"><div class="knoepfe"><button class="btn btn-signal">Weiter</button></div></form>';
  }
  K.formular.protokollNeu = async function (d) { var p = await K.neu("protokolle", { vorlage: d.vorlage, titel: PV[d.vorlage].titel, kunde_id: d.kunde_id || null, auftrag_id: d.auftrag_id || null }); K.go("protokolle/" + p.id); };
  function protokollForm(p) {
    if (!p) return K.leer("Protokoll nicht gefunden."); var v = PV[p.vorlage], zu = !!p.unterschrift;
    return K.kopf(p.titel, U.datumZeit(p.created_at), '<a class="btn btn-outline" href="#/protokolle">Zurück</a><button class="btn btn-outline" data-a="protokollDruck" data-id="' + p.id + '">Drucken / PDF</button>') +
      '<form class="karte formular" data-f="protokoll" data-id="' + p.id + '"><fieldset' + (zu ? " disabled" : "") + '><div class="raster">' + v.felder.map(function (f) {
        var w = p.werte[f[0]]; if (f[2] === "ja") return U.feld("w_" + f[0], f[1], w, { typ: "checkbox" });
        if (Array.isArray(f[2])) return U.feld("w_" + f[0], f[1], w || "", { optionen: [["", "–"]].concat(f[2]) });
        return U.feld("w_" + f[0], f[1], w || "", { typ: f[2] === "lang" ? "textarea" : f[2] === "zahl" ? "number" : "text", breit: f[2] === "lang" });
      }).join("") + U.feld("ergebnis", "Gesamtergebnis", p.ergebnis || "", { optionen: [["", "–"], ["ok", "in Ordnung"], ["maengel", "mit Mängeln"], ["nicht_ok", "nicht in Ordnung"]] }) + "</div>" +
      (zu ? "" : '<div class="knoepfe"><button class="btn btn-outline">Speichern</button><button type="button" class="btn btn-signal" data-a="protokollUnterschrift" data-id="' + p.id + '">Unterschreiben lassen</button></div>') + "</fieldset></form>" +
      (p.unterschrift ? '<section class="karte"><h2>Unterschrift</h2><img class="unterschrift-bild" src="' + h(p.unterschrift) + '" alt=""><p>' + h(p.unterschrift_name) + ", " + U.datumZeit(p.unterschrieben_at) + "</p></section>" : "");
  }
  function protokollWerte(f) { var w = {}; Array.prototype.forEach.call(f.elements, function (el) { if (el.name && el.name.indexOf("w_") === 0) w[el.name.slice(2)] = el.type === "checkbox" ? el.checked : el.value; }); return w; }
  K.formular.protokoll = async function (d, f) { await DB.aendern("protokolle", f.dataset.id, { werte: protokollWerte(f), ergebnis: d.ergebnis || null }); U.toast("Gespeichert."); K.neuLaden(); };
  K.aktion.protokollUnterschrift = async function (el) {
    var f = el.closest("form"); await DB.aendern("protokolle", el.dataset.id, { werte: protokollWerte(f), ergebnis: f.elements.ergebnis.value || null });
    var dlgP = U.dialog("Unterschrift", U.feld("name", "Name", "", { pflicht: true }) + '<canvas class="sig" id="sig2"></canvas>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Speichern", primaer: true }]);
    var pad; setTimeout(function () { pad = U.unterschrift(document.getElementById("sig2")); }, 30); var r = await dlgP; if (!r) return; if (pad.leer()) throw new Error("Bitte unterschreiben.");
    await DB.aendern("protokolle", el.dataset.id, { unterschrift: pad.bild(), unterschrift_name: r.daten.name, unterschrieben_at: new Date().toISOString() }); K.neuLaden();
  };
  K.aktion.protokollDruck = async function (el) {
    var p = await DB.eins("protokolle", el.dataset.id), v = PV[p.vorlage], k = p.kunde_id ? await DB.eins("kunden", p.kunde_id) : {};
    U.drucken(U.dokument({ betrieb: K.ctx.betrieb, kunde: k, titelArt: p.titel, nr: "", meta: [["Datum", U.datum(p.created_at)], ["Ergebnis", { ok: "in Ordnung", maengel: "mit Mängeln", nicht_ok: "nicht in Ordnung" }[p.ergebnis] || "–"]],
      zusatz: '<table class="d-pos"><tbody>' + v.felder.map(function (f) { var w = p.werte[f[0]]; return "<tr><td>" + h(f[1]) + '</td><td class="r">' + h(f[2] === "ja" ? (w ? "ja" : "nein") : (w || "–")) + "</td></tr>"; }).join("") + "</tbody></table>" +
        (p.unterschrift ? '<p>Unterschrift:</p><img class="d-sig" src="' + h(p.unterschrift) + '" alt=""><p>' + h(p.unterschrift_name) + "</p>" : '<p class="d-sigfeld">Unterschrift</p>') }), p.titel);
  };

  /* ======================= Suche über alles ======================= */
  V.suche = async function () {
    var q = (sessionStorage.getItem("such-q") || "").trim().toLowerCase();
    var feld = '<input class="suche gross" type="search" placeholder="Name, Ort, Nummer, Betreff …" value="' + h(q) + '" data-suche="such-q" autofocus>';
    if (q.length < 2) return K.kopf("Suche", "Findet Kunden, Anfragen, Angebote, Aufträge und Rechnungen.") + feld;
    var r = await Promise.all([K.liste("kunden"), K.darf("anfragen") ? K.liste("anfragen") : [], K.darf("angebote") ? K.liste("angebote") : [], K.liste("auftraege"), K.darf("rechnungen") ? K.liste("rechnungen") : []]);
    var passt = function (o, felder) { return felder.some(function (f) { return String(o[f] || "").toLowerCase().indexOf(q) > -1; }); };
    var gr = [["Kunden", r[0].filter(function (x) { return passt(x, ["name", "ort", "email", "telefon", "strasse"]); }), function (x) { return '<a href="#/kunden/' + x.id + '">' + h(x.name) + "</a> " + h(x.ort || ""); }],
      ["Anfragen", r[1].filter(function (x) { return passt(x, ["betreff", "beschreibung", "ort"]); }), function (x) { return '<a href="#/anfragen/' + x.id + '">' + h(x.betreff) + "</a>"; }],
      ["Angebote", r[2].filter(function (x) { return passt(x, ["nr", "titel"]); }), function (x) { return '<a href="#/angebote/' + x.id + '">' + h(x.nr + " · " + x.titel) + "</a>"; }],
      ["Aufträge", r[3].filter(function (x) { return passt(x, ["nr", "titel", "ort"]); }), function (x) { return '<a href="#/auftraege/' + x.id + '">' + h(x.nr + " · " + x.titel) + "</a>"; }],
      ["Rechnungen", r[4].filter(function (x) { return passt(x, ["nr"]); }), function (x) { return '<a href="#/rechnungen/' + x.id + '">' + h(x.nr) + " · " + U.eur(x.brutto) + "</a>"; }]];
    // Kunden-Treffer ziehen ihre Vorgänge mit
    var kids = gr[0][1].map(function (k) { return k.id; });
    [[1, r[1]], [2, r[2]], [3, r[3]], [4, r[4]]].forEach(function (p) { p[1].forEach(function (x) { if (kids.indexOf(x.kunde_id) > -1 && gr[p[0]][1].indexOf(x) < 0) gr[p[0]][1].push(x); }); });
    var n = gr.reduce(function (s, g) { return s + g[1].length; }, 0);
    return K.kopf("Suche", n + " Treffer für „" + q + "“") + feld + gr.filter(function (g) { return g[1].length; }).map(function (g) { return '<section class="karte"><h2>' + g[0] + " (" + g[1].length + ')</h2><ul class="liste">' + g[1].slice(0, 30).map(function (x) { return "<li>" + g[2](x) + "</li>"; }).join("") + "</ul></section>"; }).join("") + (n ? "" : K.leer("Nichts gefunden."));
  };

  /* ======================= Kundenlinks sperren ======================= */
  K.aktion.portalSperren = async function (el) {
    var t = el.dataset.t, x = await DB.eins(t, el.dataset.id);
    if (x.portal_aktiv === false) { var neu = await DB.aendern(t, x.id, { portal_aktiv: true }); U.toast("Link wieder freigegeben."); return K.neuLaden(neu); }
    if (!(await U.bestaetigen("Kundenlink sperren? Wer den Link hat, sieht danach nichts mehr. Sie können ihn wieder freigeben.", "Sperren", true))) return;
    await DB.aendern(t, x.id, { portal_aktiv: false }); await K.verlauf(t === "angebote" ? "angebot" : t === "auftraege" ? "auftrag" : "rechnung", x.id, "Kundenlink gesperrt"); U.toast("Link gesperrt."); K.neuLaden();
  };

  /* ======================= E-Rechnung (XRechnung, UBL 2.1) ======================= */
  var x = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]; }); };
  var betrag = function (v) { return (Math.round((+v || 0) * 100) / 100).toFixed(2); };
  K.xrechnung = function (r, kundeAktuell) {
    var d = r.dokument || {}, b = d.absender || K.ctx.betrieb, k = d.empfaenger || kundeAktuell || {}, pos = r.positionen.filter(function (p) { return p.typ === "pos" && !p.optional; });
    var kat = r.steuerfall === "13b" ? "AE" : r.steuerfall === "kleinunternehmer" ? "E" : (+r.mwst ? "S" : "Z"), satz = kat === "S" ? betrag(r.mwst) : "0.00", netto = betrag(r.netto), steuer = betrag(+r.brutto - +r.netto);
    var grund = kat === "AE" ? "<cbc:TaxExemptionReasonCode>VATEX-EU-AE</cbc:TaxExemptionReasonCode><cbc:TaxExemptionReason>Steuerschuldnerschaft des Leistungsempfängers</cbc:TaxExemptionReason>" : kat === "E" ? "<cbc:TaxExemptionReason>Kleinunternehmer gemäß § 19 UStG</cbc:TaxExemptionReason>" : "";
    var typ = r.art === "gutschrift" ? "381" : r.art === "abschlag" ? "326" : "380";
    var einheit = function (e) { e = String(e || "").toLowerCase(); return /std|h$/.test(e) ? "HUR" : /^m²|m2|qm/.test(e) ? "MTK" : /^m³|m3/.test(e) ? "MTQ" : /^lfm|^m$/.test(e) ? "MTR" : /kg/.test(e) ? "KGM" : /^l$/.test(e) ? "LTR" : /pausch/.test(e) ? "LS" : "H87"; };
    var partei = function (p, tag, ust, mitKontakt) { return "<cac:" + tag + "><cac:Party>" + (tag === "AccountingCustomerParty" && p.leitweg_id ? '<cbc:EndpointID schemeID="0204">' + x(p.leitweg_id) + "</cbc:EndpointID>" : p.email ? '<cbc:EndpointID schemeID="EM">' + x(p.email) + "</cbc:EndpointID>" : "") +
      (tag === "AccountingSupplierParty" && !p.ust_id && p.steuernummer ? "<cac:PartyIdentification><cbc:ID>" + x(p.steuernummer) + "</cbc:ID></cac:PartyIdentification>" : "") + "<cac:PostalAddress><cbc:StreetName>" + x(p.strasse) + "</cbc:StreetName><cbc:CityName>" + x(p.ort) + "</cbc:CityName><cbc:PostalZone>" + x(p.plz) + "</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress>" +
      (ust ? "<cac:PartyTaxScheme><cbc:CompanyID>" + x(ust) + "</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>" : "") + (tag === "AccountingSupplierParty" && p.steuernummer && !p.ust_id ? "<cac:PartyTaxScheme><cbc:CompanyID>" + x(p.steuernummer) + "</cbc:CompanyID><cac:TaxScheme><cbc:ID>FC</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>" : "") +
      "<cac:PartyLegalEntity><cbc:RegistrationName>" + x(p.name) + "</cbc:RegistrationName></cac:PartyLegalEntity>" + (mitKontakt ? "<cac:Contact><cbc:Name>" + x(d.erstellt_von || p.inhaber || p.name) + "</cbc:Name><cbc:Telephone>" + x(p.telefon || "-") + "</cbc:Telephone><cbc:ElectronicMail>" + x(p.email || "-") + "</cbc:ElectronicMail></cac:Contact>" : "") + "</cac:Party></cac:" + tag + ">"; };
    return '<?xml version="1.0" encoding="UTF-8"?>\n<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">' +
      "<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID><cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>" +
      "<cbc:ID>" + x(r.nr) + "</cbc:ID><cbc:IssueDate>" + x(r.datum) + "</cbc:IssueDate>" + (r.faellig ? "<cbc:DueDate>" + x(r.faellig) + "</cbc:DueDate>" : "") + "<cbc:InvoiceTypeCode>" + typ + "</cbc:InvoiceTypeCode>" +
      (r.leistungszeitraum ? "<cbc:Note>Leistungszeitraum: " + x(r.leistungszeitraum) + "</cbc:Note>" : "") + "<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode><cbc:BuyerReference>" + x(k.leitweg_id || r.nr) + "</cbc:BuyerReference>" +
      partei(b, "AccountingSupplierParty", b.ust_id, true) + partei(k, "AccountingCustomerParty", k.ust_id, false) +
      (b.iban ? '<cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode><cbc:PaymentID>' + x(r.nr) + "</cbc:PaymentID><cac:PayeeFinancialAccount><cbc:ID>" + x(String(b.iban).replace(/\s/g, "")) + "</cbc:ID>" + (b.bic ? "<cac:FinancialInstitutionBranch><cbc:ID>" + x(b.bic) + "</cbc:ID></cac:FinancialInstitutionBranch>" : "") + "</cac:PayeeFinancialAccount></cac:PaymentMeans>" : "") +
      "<cac:PaymentTerms><cbc:Note>" + x((r.skonto_prozent ? "#SKONTO#TAGE=" + r.skonto_tage + "#PROZENT=" + betrag(r.skonto_prozent) + "#\n" : "") + "Zahlbar bis " + U.datum(r.faellig)) + "</cbc:Note></cac:PaymentTerms>" +
      '<cac:TaxTotal><cbc:TaxAmount currencyID="EUR">' + steuer + '</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">' + netto + '</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">' + steuer + "</cbc:TaxAmount><cac:TaxCategory><cbc:ID>" + kat + "</cbc:ID><cbc:Percent>" + satz + "</cbc:Percent>" + grund + "<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>" +
      '<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">' + netto + '</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">' + netto + '</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">' + betrag(r.brutto) + '</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="EUR">' + betrag(r.brutto) + "</cbc:PayableAmount></cac:LegalMonetaryTotal>" +
      pos.map(function (p, i) { return "<cac:InvoiceLine><cbc:ID>" + (i + 1) + '</cbc:ID><cbc:InvoicedQuantity unitCode="' + einheit(p.einheit) + '">' + (+p.menge || 0) + '</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">' + betrag(U.posNetto(p)) + "</cbc:LineExtensionAmount><cac:Item>" + (p.langtext ? "<cbc:Description>" + x(p.langtext) + "</cbc:Description>" : "") + "<cbc:Name>" + x(p.text) + "</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>" + kat + "</cbc:ID><cbc:Percent>" + satz + '</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">' + betrag(U.posNetto(p) / (+p.menge || 1)) + "</cbc:PriceAmount></cac:Price></cac:InvoiceLine>"; }).join("") +
      "</ubl:Invoice>";
  };
  K.aktion.xrechnung = async function (el) {
    var r = await DB.eins("rechnungen", el.dataset.id); if (r.status === "entwurf") throw new Error("Erst die Rechnung stellen.");
    var k = r.kunde_id ? await DB.eins("kunden", r.kunde_id) : {}, d = r.dokument || {}, emp = d.empfaenger || k, abs = d.absender || K.ctx.betrieb;
    if (!abs.email) throw new Error("Für die E-Rechnung fehlt Ihre E-Mail-Adresse (Einstellungen).");
    if (!emp.email && !emp.leitweg_id) throw new Error("Für die E-Rechnung braucht der Kunde eine E-Mail-Adresse oder Leitweg-ID (Kundendaten). Bei bereits gestellten Rechnungen gilt der Stand beim Stellen.");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([K.xrechnung(r, k)], { type: "application/xml" })); a.download = r.nr + "-xrechnung.xml"; a.click();
    U.toast("E-Rechnung (XRechnung) gespeichert. Für Behörden über deren Portal hochladen, an Firmen per E-Mail mitschicken.");
  };

  /* ======================= Fehlerprotokoll ======================= */
  var gemeldet = 0;
  function melde(text, ort) {
    if (gemeldet > 20 || !K.ctx || !K.ctx.betrieb || DB.modus !== "supabase") return; gemeldet++;
    DB.melden("fehlerlog", { betrieb_id: K.ctx.betrieb.id, text: String(text).slice(0, 1000), ort: String(ort || location.hash).slice(0, 200), geraet: navigator.userAgent.slice(0, 200) }).catch(function () {});
  }
  window.addEventListener("error", function (e) { melde(e.message, e.filename + ":" + e.lineno); });
  window.addEventListener("unhandledrejection", function (e) { melde(e.reason && e.reason.message || e.reason, "Promise"); });
  K.fehlerMelden = melde;

  /* ======================= Beispieldaten ======================= */
  K.aktion.beispiel = async function () {
    if (!(await U.bestaetigen("Drei Beispielkunden mit Anfrage, Angebot und Auftrag anlegen? Sie sind mit „Beispiel“ gekennzeichnet und lassen sich löschen.", "Anlegen"))) return;
    var b = K.ctx.betrieb, heute = U.isoTag();
    var k1 = await K.neu("kunden", { name: "Beispiel: Familie Sommer", strasse: "Gartenweg 3", plz: "91054", ort: "Erlangen", telefon: "0000 000000", email: "sommer@example.org", notiz: "Beispieldaten" });
    var k2 = await K.neu("kunden", { name: "Beispiel: Hausverwaltung Nord", art: "hausverwaltung", strasse: "Ringstr. 10", plz: "90402", ort: "Nürnberg", email: "hv@example.org", notiz: "Beispieldaten" });
    var a1 = await K.neu("anfragen", { kunde_id: k1.id, kanal: "telefon", betreff: "Beispiel: Bad modernisieren", beschreibung: "Dusche statt Wanne, neue Fliesen", status: "neu" });
    var an = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: k2.id, titel: "Beispiel: Treppenhaus streichen", mwst: K.mwst(), status: "gesendet", gesendet_at: new Date(Date.now() - 8 * 864e5).toISOString(), gueltig_bis: U.plusTage(null, 22),
      positionen: [{ id: U.uuid(), typ: "pos", text: "Wände streichen", menge: 120, einheit: "m²", preis: 11.5 }, { id: U.uuid(), typ: "pos", text: "Abdeckarbeiten", menge: 6, einheit: "Std.", preis: +b.stundensatz }] });
    var s = U.summen(an.positionen, an.mwst); await DB.aendern("angebote", an.id, { netto: s.netto, brutto: s.brutto });
    var au = await K.neu("auftraege", { nr: await K.nr("AU"), kunde_id: k1.id, titel: "Beispiel: Heizkörper tauschen", wert_netto: 1850, status: "in_arbeit", start: heute });
    await K.neu("termine", { auftrag_id: au.id, kunde_id: k1.id, titel: "Beispiel: Heizkörper montieren", art: "ausfuehrung", beginn: new Date(heute + "T08:00").toISOString(), ende: new Date(heute + "T12:00").toISOString(), mitarbeiter: [K.ctx.user.id] });
    await K.verlauf("anfrage", a1.id, "Beispiel angelegt");
    U.toast("Beispieldaten angelegt."); K.go("uebersicht");
  };

  /* ======================= Kopfzeilen-Suche, Kunden-Import, Fehlerprotokoll ======================= */
  K.formular.sucheKopf = function (d, f) { sessionStorage.setItem("such-q", d.q || ""); f.reset(); document.body.classList.remove("menue-offen"); K.go("suche"); };
  K.aktion.kundenImport = async function () {
    var r = await U.dialog("Kunden importieren (CSV)", "<p>Eine Zeile pro Kunde, erste Zeile mit Überschriften. Erkannt werden <code>Name</code>, <code>Straße</code>, <code>PLZ</code>, <code>Ort</code>, <code>Telefon</code>, <code>E-Mail</code>, <code>Notiz</code>. So exportieren es Excel, Outlook und die meisten Programme.</p><p>Doppelte Kunden (gleiche E-Mail oder gleicher Name und Ort) werden übersprungen.</p>" +
      '<input type="file" name="datei" accept=".csv,text/csv" required>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Importieren", primaer: true }]);
    if (!r) return; var f = r.dlg.querySelector("input[type=file]").files[0]; if (!f) return;
    var csv = K.csvLesen(await f.text()), sp = csv.spalte;
    // Passt auch zu Exporten aus Lexware Office, sevDesk, Outlook und Excel
    var exakt = function (namen) { return csv.kopf.findIndex(function (k) { return namen.indexOf(k) > -1; }); };
    var iF = exakt(["firmenname", "firma", "unternehmen", "organisation", "firma/name", "name 1", "name1"]), iNa = exakt(["nachname", "name 2", "name2"]), iV = exakt(["vorname"]), iN = exakt(["name", "kunde", "kundenname", "anzeigename"]);
    if (iN < 0 && iF < 0 && iNa < 0) iN = sp(["name", "kunde"]);
    var iS = sp(["straße", "strasse", "adresse", "straße und hausnummer"]), iP = sp(["plz", "postleitzahl"]), iO = sp(["ort", "stadt"]), iT = sp(["telefon", "tel", "mobil", "handy"]), iE = sp(["e-mail", "email", "mail"]), iNo = sp(["notiz", "bemerkung"]);
    var iU = exakt(["ust-idnr.", "ust-id", "ust-idnr", "umsatzsteuer-id", "ustid"]), iKn = exakt(["kundennummer", "kunden-nr.", "kundennr", "nummer"]);
    if (iN < 0 && iF < 0 && iNa < 0) throw new Error("Spalte „Name“, „Firma“ oder „Nachname“ nicht gefunden.");
    var alt = await K.liste("kunden"), n = 0, ueber = 0;
    for (var z = 0; z < csv.zeilen.length && z < 5000; z++) {
      var t = csv.zeilen[z], nach = iNa > -1 ? t[iNa] : iV > -1 && iN > -1 ? t[iN] : "", person = [iV > -1 ? t[iV] : "", nach].filter(Boolean).join(" ").trim();
      var name = ((iF > -1 && t[iF]) || person || (iN > -1 && t[iN]) || "").trim(); if (!name) continue;
      var k = { name: name.slice(0, 200), strasse: iS > -1 ? t[iS] || null : null, plz: iP > -1 ? t[iP] || null : null, ort: iO > -1 ? t[iO] || null : null, telefon: iT > -1 ? t[iT] || null : null, email: iE > -1 && /@/.test(t[iE] || "") ? t[iE].toLowerCase() : null, notiz: [iNo > -1 ? t[iNo] : "", iKn > -1 && t[iKn] ? "Kundennr. alt: " + t[iKn] : "", iF > -1 && t[iF] && person ? "Ansprechpartner: " + person : ""].filter(Boolean).join(" · ") || null, ust_id: iU > -1 ? t[iU] || null : null, art: iF > -1 && t[iF] ? "firma" : "privat" };
      var doppelt = alt.some(function (a) { return (k.email && a.email && a.email.toLowerCase() === k.email) || (a.name.toLowerCase() === k.name.toLowerCase() && String(a.ort || "").toLowerCase() === String(k.ort || "").toLowerCase()); });
      if (doppelt) { ueber++; continue; }
      alt.push(await K.neu("kunden", k)); n++;
    }
    U.toast(n + " Kunden importiert" + (ueber ? ", " + ueber + " doppelte übersprungen" : "") + "."); K.neuLaden();
  };
  V.fehler = async function () {
    if (K.ctx.ich.rolle !== "gf") return K.leer("Nur für die Geschäftsführung.");
    if (DB.modus !== "supabase") return K.kopf("Fehlerprotokoll") + K.leer("Im Testmodus werden keine Fehler gespeichert.");
    var l = await DB.liste("fehlerlog", { wo: { betrieb_id: K.bid() }, sortiere: "created_at.desc", limit: 100 }).catch(function () { return []; });
    return K.kopf("Fehlerprotokoll", "Technische Fehler, die in der App bei Ihnen oder Ihrem Team aufgetreten sind. Hilft bei der Fehlersuche.") +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Zeit</th><th>Wer</th><th>Fehler</th><th>Wo</th></tr></thead><tbody>' + l.map(function (f) { return "<tr><td>" + U.datumZeit(f.created_at) + "</td><td>" + h(K.mitgliedName(f.user_id)) + "</td><td>" + h(f.text) + "</td><td><small>" + h(f.ort || "") + "<br>" + h(f.geraet || "") + "</small></td></tr>"; }).join("") + "</tbody></table></div>" : K.leer("Keine Fehler gespeichert."));
  };

  /* ======================= Offline: Warteschlange und Hinweis ======================= */
  var WS = "kundario-warteschlange";
  var wsLesen = function () { try { return JSON.parse(localStorage.getItem(WS)) || []; } catch (e) { return []; } };
  var wsSchreiben = function (l) { try { if (l.length) localStorage.setItem(WS, JSON.stringify(l)); else localStorage.removeItem(WS); } catch (e) { /* voll */ } };
  K.istOffline = function (e) { return !!e && (e.code === "offline" || e.name === "TypeError" || navigator.onLine === false); };
  K.inWarteschlange = function (e) {   // gibt false zurück, wenn der Gerätespeicher voll ist
    var l = wsLesen(); e.zeit = new Date().toISOString(); e.user = K.ctx.user && K.ctx.user.id; l.push(e);
    try { localStorage.setItem(WS, JSON.stringify(l)); } catch (x) { return false; }
    K.offlineBand(); return true;
  };
  var sendetGerade = false;
  K.warteschlangeSenden = async function () {
    if (sendetGerade || !K.ctx || !K.ctx.betrieb) return; var l = wsLesen(); if (!l.length) return; sendetGerade = true; var n = 0;
    try {
      while (l.length) {
        var e = l[0]; if (e.user && K.ctx.user && e.user !== K.ctx.user.id) { l.shift(); continue; }
        if (e.art === "bericht") await K.berichtSenden(e.id, e.daten, false);
        if (e.art === "foto") {
          var blob = await (await fetch(e.daten)).blob(), pfad = K.bid() + "/berichte/" + e.id + "/" + Date.parse(e.zeit) + ".jpg";
          await DB.datei.hoch(pfad, new File([blob], "foto.jpg", { type: "image/jpeg" })).catch(function (x) { if (!/exist|409|Duplicate/i.test(x.message)) throw x; });
          var b = await DB.eins("berichte", e.id); if (b && (b.fotos || []).indexOf(pfad) < 0) await DB.aendern("berichte", e.id, { fotos: (b.fotos || []).concat([pfad]) });
        }
        if (e.art === "unterschrift") { await DB.aendern("berichte", e.id, e.daten); await K.verlauf("auftrag", e.auftrag_id, "Regiebericht " + e.nr + " vom Kunden unterschrieben (" + e.daten.unterschrift_name + ")"); }
        l.shift(); wsSchreiben(l); n++;
      }
    } catch (x) { if (!K.istOffline(x)) { U.fehler(new Error("Ein offline gespeicherter Eintrag konnte nicht gesendet werden: " + x.message)); l.shift(); wsSchreiben(l); } }
    sendetGerade = false; if (n) { U.toast(n + (n === 1 ? " offline gespeicherter Eintrag" : " offline gespeicherte Einträge") + " gesendet."); K.neuLaden(); } K.offlineBand();
  };
  K.offlineBand = function () {
    var m = document.getElementById("inhalt"); if (!m) return; var alt = document.getElementById("offline-band"); if (alt) alt.remove();
    var off = DB.offline || navigator.onLine === false, n = wsLesen().length; if (!off && !n) return;
    m.insertAdjacentHTML("afterbegin", '<p id="offline-band" class="offline-band">' + (off ? "<b>Offline.</b> Sie sehen den zuletzt geladenen Stand. Regieberichte, Fotos und Unterschriften können Sie trotzdem speichern." : "") + (n ? " " + n + (n === 1 ? " Eintrag wartet" : " Einträge warten") + " auf Versand." + (off ? "" : ' <button class="btn btn-outline klein" data-a="wsSenden">Jetzt senden</button>') : "") + "</p>");
  };
  K.aktion.wsSenden = function () { return K.warteschlangeSenden(); };
  window.addEventListener("online", function () { DB.offline = false; K.warteschlangeSenden(); K.offlineBand(); });
  window.addEventListener("offline", function () { K.offlineBand(); });
  setTimeout(function () { K.warteschlangeSenden(); }, 4000);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () { /* ohne Offline-Start weiter */ });
})();
