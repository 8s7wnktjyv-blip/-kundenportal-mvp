/* Kundario – Kalender, Regieberichte, Rechnungen und Zahlungen */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;
  var ART = { besichtigung: "Besichtigung", ausfuehrung: "Ausführung", wartung: "Wartung", abnahme: "Abnahme", intern: "Intern", sonstiges: "Sonstiges" };

  /* ---------- Kalender ---------- */
  function montag(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  V.kalender = async function (id) {
    if (id && id !== "woche") return terminDetail(id);
    var start = montag(sessionStorage.getItem("kal-start") || new Date()), ende = new Date(start.getTime() + 14 * 864e5);
    var alle = await K.liste("termine", { sortiere: "beginn.asc" }), km = await K.kundenMap();
    var nurMeine = sessionStorage.getItem("kal-meine") === "1" || K.ctx.ich.rolle === "monteur";
    var l = alle.filter(function (t) { var b = new Date(t.beginn); return b >= start && b < ende && (!nurMeine || (t.mitarbeiter || []).indexOf(K.ctx.user.id) > -1); });
    var tage = []; for (var i = 0; i < 14; i++) tage.push(new Date(start.getTime() + i * 864e5));
    var heute = U.isoTag();
    return K.kopf("Kalender", "Zwei Wochen auf einen Blick.", '<button class="btn btn-outline" data-a="kalSchieben" data-n="-7">‹ Woche</button><button class="btn btn-outline" data-a="kalSchieben" data-n="0">Heute</button><button class="btn btn-outline" data-a="kalSchieben" data-n="7">Woche ›</button><button class="btn btn-outline" data-a="icsExport">In den Handy-Kalender</button><button class="btn btn-signal" data-a="terminNeu">Neuer Termin</button>') +
      (K.ctx.ich.rolle !== "monteur" ? '<label class="chk"><input type="checkbox" data-a-change="kalMeine"' + (nurMeine ? " checked" : "") + "> Nur meine Termine</label>" : "") +
      '<div class="kalender">' + tage.map(function (d) {
        var iso = U.isoTag(d), ts = l.filter(function (t) { return U.isoTag(t.beginn) === iso; });
        return '<div class="kal-tag' + (iso === heute ? " heute" : "") + (d.getDay() % 6 === 0 ? " we" : "") + '"><div class="kal-kopf">' + d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }) + "</div>" +
          ts.map(function (t) { return '<a class="kal-t art-' + t.art + '" href="#/kalender/' + t.id + '"><b>' + U.zeit(t.beginn) + "</b> " + h(t.titel) + (t.kunde_id && km[t.kunde_id] ? "<small>" + h(km[t.kunde_id].name) + "</small>" : "") + "<small>" + h((t.mitarbeiter || []).map(K.mitgliedName).join(", ")) + "</small></a>"; }).join("") + "</div>";
      }).join("") + "</div>";
  };
  K.aktion.kalSchieben = function (el) { var n = +el.dataset.n, s = montag(sessionStorage.getItem("kal-start") || new Date()); sessionStorage.setItem("kal-start", n === 0 ? new Date().toISOString() : new Date(s.getTime() + n * 864e5).toISOString()); K.neuLaden(); };
  K.aktion.kalMeine = function (el) { sessionStorage.setItem("kal-meine", el.checked ? "1" : "0"); K.neuLaden(); };
  async function terminForm(t) {
    t = t || {}; var b = t.beginn ? new Date(t.beginn) : null, e = t.ende ? new Date(t.ende) : null;
    var au = await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit", "pausiert"] }, sortiere: "nr.desc" });
    if (t.auftrag_id && !au.some(function (a) { return a.id === t.auftrag_id; })) { var x = await DB.eins("auftraege", t.auftrag_id); if (x) au.push(x); }
    return '<div class="raster">' + U.feld("titel", "Titel", t.titel || "", { pflicht: true }) + U.feld("art", "Art", t.art || "ausfuehrung", { optionen: Object.keys(ART).map(function (k) { return [k, ART[k]]; }) }) +
      U.feld("tag", "Datum", b ? U.isoTag(b) : U.plusTage(null, 1), { typ: "date", pflicht: true }) + U.feld("von", "Von", b ? ("0" + b.getHours()).slice(-2) + ":" + ("0" + b.getMinutes()).slice(-2) : "08:00", { typ: "time", pflicht: true }) + U.feld("bis", "Bis", e ? ("0" + e.getHours()).slice(-2) + ":" + ("0" + e.getMinutes()).slice(-2) : "16:00", { typ: "time" }) +
      U.feld("auftrag_id", "Auftrag", t.auftrag_id || "", { optionen: [["", "– ohne –"]].concat(au.map(function (a) { return [a.id, a.nr + " · " + a.titel]; })) }) + U.feld("ort", "Ort", t.ort || "") + "</div>" +
      '<fieldset class="mitarbeiter"><legend>Wer ist dabei?</legend>' + K.ctx.team.filter(function (m) { return m.aktiv; }).map(function (m) { return '<label class="chk"><input type="checkbox" name="m_' + m.user_id + '"' + ((t.mitarbeiter || [K.ctx.user.id]).indexOf(m.user_id) > -1 ? " checked" : "") + "> " + h(m.name) + "</label>"; }).join("") + "</fieldset>" +
      U.feld("notiz", "Notiz", t.notiz || "", { typ: "textarea", breit: true }) + U.feld("kunde_sichtbar", "Kunde sieht diesen Termin im Portal", t.id ? t.kunde_sichtbar : true, { typ: "checkbox" });
  }
  function terminDaten(d) {
    var beginn = new Date(d.tag + "T" + d.von), ende = d.bis ? new Date(d.tag + "T" + d.bis) : null;
    if (ende && ende <= beginn) throw new Error("„Bis“ muss nach „Von“ liegen.");
    var m = Object.keys(d).filter(function (k) { return k.indexOf("m_") === 0 && d[k]; }).map(function (k) { return k.slice(2); });
    return { titel: d.titel.trim(), art: d.art, beginn: beginn.toISOString(), ende: ende ? ende.toISOString() : null, auftrag_id: d.auftrag_id || null, ort: d.ort || null, mitarbeiter: m, notiz: d.notiz || null, kunde_sichtbar: !!d.kunde_sichtbar };
  }
  function ueberschneidung(neu, alle, ohneId) {
    var b = new Date(neu.beginn), e = neu.ende ? new Date(neu.ende) : new Date(b.getTime() + 36e5);
    return alle.filter(function (t) { if (t.id === ohneId) return false; var tb = new Date(t.beginn), te = t.ende ? new Date(t.ende) : new Date(tb.getTime() + 36e5); return tb < e && te > b && (t.mitarbeiter || []).some(function (m) { return neu.mitarbeiter.indexOf(m) > -1; }); });
  }
  K.aktion.terminNeu = async function (el) {
    var vor = el.dataset.auftrag ? await DB.eins("auftraege", el.dataset.auftrag) : null;
    var r = await U.dialog("Neuer Termin", await terminForm({ auftrag_id: el.dataset.auftrag || "", titel: vor ? vor.titel : "", ort: vor ? vor.ort : "" })); if (!r) return;
    var t = terminDaten(r.daten);
    if (t.auftrag_id) { var au = await DB.eins("auftraege", t.auftrag_id); t.kunde_id = au.kunde_id; if (!t.ort) t.ort = au.ort; }
    var konf = ueberschneidung(t, await K.liste("termine"), null);
    if (konf.length && !(await U.bestaetigen("Achtung: " + konf.map(function (x) { return U.zeit(x.beginn) + " " + x.titel; }).join(", ") + " überschneidet sich mit diesem Termin. Trotzdem speichern?", "Speichern"))) return;
    var n = await K.neu("termine", t); if (t.auftrag_id) await K.verlauf("auftrag", t.auftrag_id, "Termin: " + t.titel + " am " + U.datumZeit(t.beginn));
    U.toast("Termin gespeichert."); K.neuLaden(); return n;
  };
  async function terminDetail(id) {
    var t = await DB.eins("termine", id); if (!t) return K.leer("Termin nicht gefunden.");
    var k = t.kunde_id ? await DB.eins("kunden", t.kunde_id) : null;
    return K.kopf(t.titel, U.datumZeit(t.beginn) + (t.ende ? " bis " + U.zeit(t.ende) + " Uhr" : "") + (k ? " · " + k.name : ""), '<a class="btn btn-outline" href="#/kalender">Zurück</a>' + (t.auftrag_id ? '<a class="btn btn-outline" href="#/auftraege/' + t.auftrag_id + '">Zum Auftrag</a>' : "") + (t.ort ? '<a class="btn btn-outline" target="_blank" rel="noopener" href="https://www.openstreetmap.org/search?query=' + encodeURIComponent(t.ort) + '">Karte</a>' : "")) +
      '<form class="karte formular" data-f="termin" data-id="' + id + '">' + (await terminForm(t)) + '<div class="knoepfe"><button class="btn btn-signal">Speichern</button>' + (k && k.email ? '<button type="button" class="btn btn-outline" data-a="terminKunde" data-id="' + id + '">Kunde informieren</button>' : "") + (K.darf("rechnungen") ? '<button type="button" class="btn btn-ghost gefahr" data-a="terminLoeschen" data-id="' + id + '">Löschen</button>' : "") + "</div></form>";
  }
  K.formular.termin = async function (d, f) {
    var t = terminDaten(d), konf = ueberschneidung(t, await K.liste("termine"), f.dataset.id);
    if (konf.length && !(await U.bestaetigen("Überschneidung mit: " + konf.map(function (x) { return U.zeit(x.beginn) + " " + x.titel; }).join(", ") + ". Trotzdem speichern?", "Speichern"))) return;
    await DB.aendern("termine", f.dataset.id, t); U.toast("Termin gespeichert."); K.neuLaden();
  };
  K.aktion.terminLoeschen = async function (el) { if (!(await U.bestaetigen("Termin löschen?", "Löschen", true))) return; await DB.loeschen("termine", el.dataset.id); K.go("kalender"); };
  K.aktion.terminKunde = async function (el) {
    var t = await DB.eins("termine", el.dataset.id), k = await DB.eins("kunden", t.kunde_id), b = K.ctx.betrieb;
    U.mail(k.email, "Ihr Termin am " + U.datum(t.beginn), "Guten Tag " + k.name + ",\n\nwir kommen am " + new Date(t.beginn).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }) + " um " + U.zeit(t.beginn) + " Uhr" + (t.titel ? " (" + t.titel + ")" : "") + ".\nFalls der Termin nicht passt, melden Sie sich bitte unter " + (b.telefon || b.email || "") + ".\n\nMit freundlichen Grüßen\n" + K.ctx.ich.name + "\n" + b.name);
    await K.verlauf("kunde", k.id, "Über Termin " + U.datumZeit(t.beginn) + " informiert");
  };

  /* ---------- Regieberichte ---------- */
  V.berichte = async function (id, extra) {
    if (id === "neu") return berichtForm(null, extra);
    if (id) { var b = await DB.eins("berichte", id); if (!b) return K.leer("Bericht nicht gefunden."); return berichtForm(b); }
    var l = await K.liste("berichte", { sortiere: "datum.desc", limit: 200 }), au = {}; (await K.liste("auftraege", { select: "id,nr,titel" })).forEach(function (a) { au[a.id] = a; });
    if (K.ctx.ich.rolle === "monteur") l = l.filter(function (b) { return b.mitarbeiter === K.ctx.user.id; });
    return K.kopf("Regieberichte", "Stunden, Material und Unterschrift direkt auf der Baustelle.", '<a class="btn btn-signal" href="#/berichte/neu">Neuer Bericht</a>') +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Nr.</th><th>Datum</th><th>Auftrag</th><th>Tätigkeit</th><th class="r">Std.</th><th>Status</th></tr></thead><tbody>' + l.map(function (b) { return '<tr data-link="#/berichte/' + b.id + '"><td><a href="#/berichte/' + b.id + '">' + h(b.nr) + "</a></td><td>" + U.datum(b.datum) + "</td><td>" + h(au[b.auftrag_id] ? au[b.auftrag_id].nr : "–") + "</td><td>" + h(b.taetigkeit) + (b.zusatzleistung ? ' <span class="pill warn">Zusatz</span>' : "") + '</td><td class="r">' + U.zahlText(b.stunden) + "</td><td>" + K.status(b.status, K.ST.bericht) + "</td></tr>"; }).join("") + "</tbody></table></div>" : K.leer("Noch keine Regieberichte."));
  };
  async function berichtForm(b, auftragId) {
    var neu = !b; b = b || { datum: U.isoTag(), auftrag_id: auftragId || "", stunden: "", taetigkeit: "", material: [], fotos: [], status: "entwurf", mitarbeiter: K.ctx.user.id };
    var offen = b.status === "entwurf";
    var au = await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit", "pausiert", "abgeschlossen"] }, sortiere: "nr.desc" });
    var fotos = await Promise.all((b.fotos || []).map(function (p) { return DB.datei.link(p).catch(function () { return ""; }); }));
    K._bericht = b;
    var mat = (b.material || []).concat(offen ? [{ text: "", menge: "", preis: "" }] : []);
    return K.kopf(neu ? "Neuer Regiebericht" : "Regiebericht " + b.nr, neu ? "" : U.datum(b.datum) + " · " + K.ST.bericht[b.status][0], (neu ? "" : '<button class="btn btn-outline" data-a="berichtDruck" data-id="' + b.id + '">Drucken / PDF</button>') + '<a class="btn btn-outline" href="#/berichte">Zurück</a>') +
      '<form class="karte formular" data-f="bericht" data-id="' + (b.id || "") + '" id="ber-form"><fieldset' + (offen ? "" : " disabled") + '><div class="raster">' +
        U.feld("auftrag_id", "Auftrag", b.auftrag_id, { pflicht: true, optionen: [["", "– bitte wählen –"]].concat(au.map(function (a) { return [a.id, a.nr + " · " + a.titel]; })) }) + U.feld("datum", "Datum", b.datum, { typ: "date", pflicht: true }) +
        U.feld("stunden", "Stunden", b.stunden === "" ? "" : U.zahlText(b.stunden), { typ: "number", pflicht: true, hilfe: "z. B. 7,5" }) + U.feld("mitarbeiter", "Mitarbeiter", b.mitarbeiter, { optionen: K.ctx.team.map(function (m) { return [m.user_id, m.name]; }) }) +
        U.feld("taetigkeit", "Was wurde gemacht?", b.taetigkeit, { typ: "textarea", pflicht: true, breit: true, zeilen: 3 }) + U.feld("zusatzleistung", "Zusatzleistung (nicht im Angebot) – wird extra abgerechnet", b.zusatzleistung, { typ: "checkbox" }) + "</div>" +
        '<h3>Material</h3><div class="tabelle"><table class="mat"><thead><tr><th>Material</th><th>Menge</th><th>Preis je Einheit €</th></tr></thead><tbody>' + mat.map(function (m, i) { return '<tr><td><input name="mt_' + i + '" value="' + h(m.text) + '" placeholder="z. B. Silikon weiß"></td><td><input name="mm_' + i + '" inputmode="decimal" value="' + (m.menge === "" ? "" : U.zahlText(m.menge)) + '"></td><td><input name="mp_' + i + '" inputmode="decimal" value="' + (m.preis === "" ? "" : U.zahlText(m.preis, 2)) + '"></td></tr>'; }).join("") + "</tbody></table></div>" +
        (offen ? '<button type="button" class="btn btn-outline klein" data-a="berichtMatZeile">+ Zeile</button>' : "") + "</fieldset>" +
        "<h3>Fotos</h3>" + '<div class="fotos">' + fotos.map(function (u) { return u ? '<a href="' + h(u) + '" target="_blank" rel="noopener"><img src="' + h(u) + '" alt="Baustellenfoto" loading="lazy"></a>' : ""; }).join("") + "</div>" +
        (offen && b.id ? '<label class="btn btn-outline klein">Foto hinzufügen<input type="file" accept="image/*" capture="environment" hidden data-foto="' + b.id + '"></label>' : offen ? '<p class="still">Fotos können Sie nach dem ersten Speichern hinzufügen.</p>' : "") +
        (offen ? '<div class="knoepfe"><button class="btn btn-outline" type="submit">Speichern</button>' + (b.id ? '<button type="button" class="btn btn-signal" data-a="berichtUnterschrift" data-id="' + b.id + '">Kunde unterschreiben lassen</button>' : "") + "</div>" : "") + "</form>" +
      (b.unterschrift ? '<section class="karte"><h2>Unterschrift</h2><img class="unterschrift-bild" src="' + h(b.unterschrift) + '" alt="Unterschrift"><p>' + h(b.unterschrift_name || "") + ", " + U.datumZeit(b.unterschrieben_at) + "</p></section>" : "");
  }
  K.aktion.berichtMatZeile = function () { var tb = document.querySelector("#ber-form table.mat tbody"), i = tb.rows.length; tb.insertAdjacentHTML("beforeend", '<tr><td><input name="mt_' + i + '"></td><td><input name="mm_' + i + '" inputmode="decimal"></td><td><input name="mp_' + i + '" inputmode="decimal"></td></tr>'); };
  function berichtDaten(d) {
    var mat = []; for (var i = 0; d["mt_" + i] !== undefined; i++) if (String(d["mt_" + i]).trim()) mat.push({ text: d["mt_" + i].trim(), menge: U.zahl(d["mm_" + i]) || 1, preis: U.zahl(d["mp_" + i]) });
    var std = U.zahl(d.stunden); if (std < 0 || std > 24) throw new Error("Stunden müssen zwischen 0 und 24 liegen.");
    var m = K.ctx.team.filter(function (x) { return x.user_id === d.mitarbeiter; })[0];
    var x = { auftrag_id: d.auftrag_id, datum: d.datum, stunden: std, taetigkeit: d.taetigkeit.trim(), zusatzleistung: !!d.zusatzleistung, material: mat, material_euro: Math.round(mat.reduce(function (s, x) { return s + x.menge * x.preis; }, 0) * 100) / 100, mitarbeiter: d.mitarbeiter, mitarbeiter_name: m ? m.name : "" };
    if (d.position_id || (d.position_id === "" && (K._bericht || {}).position_id)) x.position_id = d.position_id || null;
    return x;
  }
  K.formular.bericht = async function (d, f) {
    var x = berichtDaten(d);
    try { await berichtSenden(f.dataset.id || null, x, true); }
    catch (e) {
      if (!K.istOffline(e)) throw e;
      if (!K.inWarteschlange({ art: "bericht", id: f.dataset.id || null, daten: x })) throw new Error("Der Speicher auf dem Gerät ist voll.");
      U.toast("Kein Netz: Bericht ist auf diesem Gerät gesichert und wird automatisch gesendet, sobald wieder Netz da ist.");
      if (!f.dataset.id) K.go("berichte");
    }
  };
  async function berichtSenden(id, x, anzeigen) {
    if (id) { await DB.aendern("berichte", id, x); if (anzeigen) { U.toast("Gespeichert."); K.neuLaden(); } return; }
    x.nr = await K.nr("RB"); var b = await K.neu("berichte", x);
    await K.verlauf("auftrag", x.auftrag_id, "Regiebericht " + b.nr + ": " + x.stunden + " Std. – " + x.taetigkeit);
    var au = await DB.eins("auftraege", x.auftrag_id); if (au && au.status === "geplant") await DB.aendern("auftraege", au.id, { status: "in_arbeit" });
    if (anzeigen) { U.toast("Bericht gespeichert."); K.go("berichte/" + b.id); }
  }
  K.berichtSenden = berichtSenden;
  document.addEventListener("change", async function (e) {
    var inp = e.target.closest("[data-foto]"); if (!inp || !inp.files.length) return;
    try {
      var b = await DB.eins("berichte", inp.dataset.foto), datei = inp.files[0];
      if (datei.size > 15e6) throw new Error("Das Foto ist zu groß (höchstens 15 MB).");
      var klein = await verkleinern(datei);
      var pfad = K.bid() + "/berichte/" + b.id + "/" + Date.now() + ".jpg";
      try { await DB.datei.hoch(pfad, klein); }
      catch (x) {
        if (!K.istOffline(x)) throw x;
        var daten = await new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.readAsDataURL(klein); });
        if (!K.inWarteschlange({ art: "foto", id: b.id, daten: daten })) throw new Error("Der Speicher auf dem Gerät ist voll. Bitte das Foto später aufnehmen, wenn wieder Netz da ist.");
        inp.value = ""; return U.toast("Kein Netz: Foto ist auf dem Gerät gesichert und wird gesendet, sobald wieder Netz da ist.");
      }
      await DB.aendern("berichte", b.id, { fotos: (b.fotos || []).concat([pfad]) }); U.toast("Foto gespeichert."); K.neuLaden();
    } catch (x) { U.fehler(x); }
  });
  K.bildVerkleinern = function (d) { return verkleinern(d); };
  function verkleinern(datei) {
    return new Promise(function (ok) {
      var img = new Image(), url = URL.createObjectURL(datei);
      img.onload = function () { var m = 1600, s = Math.min(1, m / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(function (b) { ok(b ? new File([b], "foto.jpg", { type: "image/jpeg" }) : datei); }, "image/jpeg", 0.82); };
      img.onerror = function () { ok(datei); }; img.src = url;
    });
  }
  K.aktion.berichtUnterschrift = async function (el) {
    var f = document.getElementById("ber-form"); if (f) { var d = {}; Array.prototype.forEach.call(f.elements, function (x) { if (x.name) d[x.name] = x.type === "checkbox" ? x.checked : x.value; });
      try { await DB.aendern("berichte", el.dataset.id, berichtDaten(d)); } catch (x) { if (!K.istOffline(x)) throw x; K.inWarteschlange({ art: "bericht", id: el.dataset.id, daten: berichtDaten(d) }); } }
    var b = await DB.eins("berichte", el.dataset.id);
    var dlgP = U.dialog("Unterschrift des Kunden", "<p>" + h(U.datum(b.datum)) + ": " + U.zahlText(b.stunden) + " Std. – " + h(b.taetigkeit) + (b.material.length ? "<br>Material: " + h(b.material.map(function (m) { return U.zahlText(m.menge) + " × " + m.text; }).join(", ")) : "") + "</p>" + U.feld("name", "Name des Kunden", "", { pflicht: true }) + '<canvas class="sig" id="sig" aria-label="Unterschriftsfeld"></canvas><button type="button" class="btn btn-ghost klein" id="sig-neu">Neu</button>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Unterschrift speichern", primaer: true }]);
    var pad; setTimeout(function () { pad = U.unterschrift(document.getElementById("sig")); document.getElementById("sig-neu").onclick = function () { pad.neu(); }; }, 30);
    var r = await dlgP; if (!r) return;
    if (pad.leer()) throw new Error("Bitte unterschreiben lassen.");
    var patch = { unterschrift: pad.bild(), unterschrift_name: r.daten.name, unterschrieben_at: new Date().toISOString(), status: "unterschrieben" };
    try { await DB.aendern("berichte", b.id, patch); }
    catch (x) {
      if (!K.istOffline(x)) throw x;
      if (!K.inWarteschlange({ art: "unterschrift", id: b.id, daten: patch, nr: b.nr, auftrag_id: b.auftrag_id })) throw new Error("Der Speicher auf dem Gerät ist voll.");
      return U.toast("Kein Netz: Unterschrift ist auf dem Gerät gesichert und wird gesendet, sobald wieder Netz da ist.");
    }
    await K.verlauf("auftrag", b.auftrag_id, "Regiebericht " + b.nr + " vom Kunden unterschrieben (" + r.daten.name + ")"); U.toast("Unterschrieben."); K.neuLaden();
  };
  K.aktion.berichtDruck = async function (el) {
    var b = await DB.eins("berichte", el.dataset.id), au = b.auftrag_id ? await DB.eins("auftraege", b.auftrag_id) : {}, k = au.kunde_id ? await DB.eins("kunden", au.kunde_id) : {};
    U.drucken(U.dokument({ betrieb: K.ctx.betrieb, kunde: k, titelArt: "Regiebericht", nr: b.nr, betreff: (au.nr || "") + " " + (au.titel || ""), meta: [["Datum", U.datum(b.datum)], ["Mitarbeiter", b.mitarbeiter_name || ""], ["Stunden", U.zahlText(b.stunden)]],
      einleitung: "Ausgeführte Arbeiten:\n" + b.taetigkeit + (b.zusatzleistung ? "\n\n(Zusatzleistung, nicht im Angebot enthalten)" : ""),
      zusatz: (b.material.length ? '<h3>Material</h3><table class="d-pos"><tbody>' + b.material.map(function (m) { return "<tr><td>" + h(m.text) + '</td><td class="r">' + U.zahlText(m.menge) + "</td></tr>"; }).join("") + "</tbody></table>" : "") + (b.unterschrift ? '<p>Bestätigt durch den Kunden:</p><img class="d-sig" src="' + h(b.unterschrift) + '" alt=""><p>' + h(b.unterschrift_name) + ", " + U.datumZeit(b.unterschrieben_at) + "</p>" : '<p class="d-sigfeld">Unterschrift Kunde</p>') }), "Regiebericht " + b.nr);
  };

  /* ---------- Rechnungen ---------- */
  var ARTNAME = { rechnung: "Rechnung", abschlag: "Abschlagsrechnung", schluss: "Schlussrechnung", gutschrift: "Gutschrift" };
  async function bezahlt(re) { return (await K.liste("zahlungen", { wo: { rechnung_id: re.id } })).reduce(function (s, z) { return s + (+z.betrag); }, 0); }
  V.rechnungen = async function (id) {
    if (id === "neu") return K.kopf("Neue Rechnung") + '<form class="karte formular" data-f="rechnungNeu"><div class="raster">' + (await K.kundeWahl("kunde_id", "", false)) + "</div><div class=\"knoepfe\"><button class=\"btn btn-signal\">Weiter</button></div></form>";
    if (id) return rechnungEditor(id);
    var filt = sessionStorage.getItem("re-filter") || "offen", alle = await K.liste("rechnungen", { sortiere: "datum.desc" }), km = await K.kundenMap(), z = await K.liste("zahlungen"), heute = U.isoTag();
    var bez = {}; z.forEach(function (x) { bez[x.rechnung_id] = (bez[x.rechnung_id] || 0) + (+x.betrag); });
    var g = { entwurf: function (r) { return r.status === "entwurf"; }, offen: function (r) { return r.status === "gestellt" || r.status === "teilbezahlt"; }, ueberfaellig: function (r) { return (r.status === "gestellt" || r.status === "teilbezahlt") && r.faellig && r.faellig < heute; }, bezahlt: function (r) { return r.status === "bezahlt"; }, alle: function () { return true; } };
    var l = alle.filter(g[filt]), offenSumme = alle.filter(g.offen).reduce(function (s, r) { return s + (+r.brutto) - (bez[r.id] || 0); }, 0);
    return K.kopf("Rechnungen", "Offen: " + U.eur(offenSumme) + " · Eingang dieses Jahr: " + U.eur(z.filter(function (x) { return String(x.datum).slice(0, 4) === heute.slice(0, 4); }).reduce(function (s, x) { return s + (+x.betrag); }, 0)), '<button class="btn btn-outline" data-a="kontoImport">Kontoauszug einlesen</button><button class="btn btn-outline" data-a="steuerExport">Export Steuerberater</button><a class="btn btn-signal" href="#/rechnungen/neu">Neue Rechnung</a>') +
      '<div class="tabs">' + Object.keys(g).map(function (x) { return '<button data-a="filter" data-k="re-filter" data-v="' + x + '" aria-pressed="' + (x === filt) + '">' + { entwurf: "Entwürfe", offen: "Offen", ueberfaellig: "Überfällig", bezahlt: "Bezahlt", alle: "Alle" }[x] + " " + alle.filter(g[x]).length + "</button>"; }).join("") + "</div>" +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Nr.</th><th>Kunde</th><th>Datum</th><th>Fällig</th><th>Status</th><th class="r">Brutto</th><th class="r">Offen</th></tr></thead><tbody>' + l.map(function (r) {
        var rest = (+r.brutto) - (bez[r.id] || 0), ue = r.faellig && r.faellig < heute && rest > 0 && r.status !== "entwurf";
        return '<tr data-link="#/rechnungen/' + r.id + '"><td><a href="#/rechnungen/' + r.id + '">' + h(r.status === "entwurf" ? "Entwurf" : r.nr) + "</a></td><td>" + h(km[r.kunde_id] ? km[r.kunde_id].name : "–") + "</td><td>" + U.datum(r.datum) + '</td><td class="' + (ue ? "rot" : "") + '">' + U.datum(r.faellig) + (r.mahnstufe ? " · " + r.mahnstufe + ". Erinnerung" : "") + "</td><td>" + K.status(r.status, K.ST.rechnung) + '</td><td class="r">' + U.eur(r.brutto) + '</td><td class="r">' + (r.status === "entwurf" || r.status === "storniert" ? "" : U.eur(rest)) + "</td></tr>";
      }).join("") + "</tbody></table></div>" : K.leer("Keine Rechnungen in dieser Ansicht."));
  };
  K.formular.rechnungNeu = async function (d) {
    if (!d.kunde_id) throw new Error("Bitte einen Kunden wählen.");
    var r = await K.neu("rechnungen", Object.assign(K.reStandard(), { nr: "ENTWURF-" + U.uuid().slice(0, 8), kunde_id: d.kunde_id, positionen: [{ id: U.uuid(), typ: "pos", text: "", menge: 1, einheit: "Stk.", preis: 0 }] }));
    K.go("rechnungen/" + r.id);
  };
  K.aktion.rechnungAusAuftrag = async function (el) {
    var au = await DB.eins("auftraege", el.dataset.id), art = el.dataset.art, b = K.ctx.betrieb, pos = [];
    var alte = (await K.liste("rechnungen", { wo: { auftrag_id: au.id } })).filter(function (x) { return x.status !== "storniert"; });
    if (art === "abschlag") {
      var r = await U.dialog("Abschlagsrechnung", U.feld("prozent", "Anteil vom Auftragswert (%)", "30", { typ: "number", pflicht: true }) + "<p>Auftragswert " + U.eur(au.wert_netto) + " netto</p>"); if (!r) return;
      var n = alte.filter(function (x) { return x.art === "abschlag"; }).length + 1;
      pos.push({ id: U.uuid(), typ: "pos", text: n + ". Abschlag " + U.zahlText(U.zahl(r.daten.prozent)) + " % auf Auftrag " + au.nr + " – " + au.titel, menge: 1, einheit: "pausch.", preis: Math.round(au.wert_netto * U.zahl(r.daten.prozent)) / 100 });
    } else {
      if (au.angebot_id) { var an = await DB.eins("angebote", au.angebot_id); if (an) pos = an.positionen.filter(function (p) { return !p.optional; }).map(function (p) { return Object.assign({}, p, { id: U.uuid() }); }); }
      else pos.push({ id: U.uuid(), typ: "pos", text: au.titel, menge: 1, einheit: "pausch.", preis: +au.wert_netto });
      var zus = (await K.liste("berichte", { wo: { auftrag_id: au.id, zusatzleistung: true } })).filter(function (x) { return x.status !== "abgerechnet"; });
      if (zus.length) { pos.push({ id: U.uuid(), typ: "titel", text: "Zusatzleistungen laut Regiebericht" }); zus.forEach(function (x) { pos.push({ id: U.uuid(), typ: "pos", text: x.nr + " vom " + U.datum(x.datum) + ": " + x.taetigkeit, menge: x.stunden, einheit: "Std.", preis: +b.stundensatz, bericht: x.id }); x.material.forEach(function (m) { pos.push({ id: U.uuid(), typ: "pos", text: m.text, menge: m.menge, einheit: "Stk.", preis: m.preis, bericht: x.id }); }); }); }
      var abs = alte.filter(function (x) { return x.art === "abschlag" && x.status !== "entwurf"; });
      if (abs.length) { pos.push({ id: U.uuid(), typ: "titel", text: "Abzüglich geleisteter Abschläge" }); abs.forEach(function (x) { pos.push({ id: U.uuid(), typ: "pos", text: "Abschlagsrechnung " + x.nr + " vom " + U.datum(x.datum), menge: 1, einheit: "pausch.", preis: -(+x.netto) }); }); }
    }
    var re = await K.neu("rechnungen", Object.assign(K.reStandard(), { nr: "ENTWURF-" + U.uuid().slice(0, 8), art: art, kunde_id: au.kunde_id, auftrag_id: au.id, positionen: pos, leistungszeitraum: [U.datum(au.start), U.datum(au.ende || U.isoTag())].filter(Boolean).join(" – ") }));
    var s = U.summen(pos, re.mwst); await DB.aendern("rechnungen", re.id, { netto: s.netto, brutto: s.brutto, lohn_netto: U.lohnNetto(pos) });
    await K.verlauf("auftrag", au.id, ARTNAME[art] + " als Entwurf angelegt"); K.go("rechnungen/" + re.id);
  };
  async function rechnungEditor(id) {
    var r = await DB.eins("rechnungen", id); if (!r) return K.leer("Rechnung nicht gefunden.");
    var k = r.kunde_id ? await DB.eins("kunden", r.kunde_id) : null, offen = r.status === "entwurf", s = U.summen(r.positionen, r.mwst);
    var zs = await K.liste("zahlungen", { wo: { rechnung_id: id }, sortiere: "datum.asc" }), bez = zs.reduce(function (a, z) { return a + (+z.betrag); }, 0), rest = Math.round((+r.brutto - bez) * 100) / 100;
    K._rechnung = r;
    var kn = '<a class="btn btn-outline" href="#/rechnungen">Zurück</a><button class="btn btn-outline" data-a="rechnungDruck" data-id="' + id + '">' + (offen ? "Vorschau" : "Drucken / PDF") + "</button>" +
      (offen ? '<button class="btn btn-signal" data-a="rechnungStellen" data-id="' + id + '">Rechnung stellen</button>' : "") +
      (r.status === "gestellt" || r.status === "teilbezahlt" ? '<button class="btn btn-signal" data-a="zahlung" data-id="' + id + '">Zahlung erfassen</button><button class="btn btn-outline" data-a="mahnen" data-id="' + id + '">Zahlungserinnerung</button><button class="btn btn-outline" data-a="rechnungLink" data-id="' + id + '">Kundenlink</button>' : "") +
      (!offen ? '<button class="btn btn-outline" data-a="xrechnung" data-id="' + id + '" title="Strukturierte Rechnung (XRechnung) für Behörden und Firmen">E-Rechnung (XML)</button><button class="btn btn-ghost" data-a="portalSperren" data-t="rechnungen" data-id="' + id + '">' + (r.portal_aktiv === false ? "Kundenlink freigeben" : "Kundenlink sperren") + "</button>" : "") +
      (!offen && r.status !== "storniert" && !bez ? '<button class="btn btn-ghost gefahr" data-a="stornieren" data-id="' + id + '">Stornieren</button>' : "");
    return K.kopf((offen ? "Rechnungsentwurf" : ARTNAME[r.art] + " " + r.nr), (k ? k.name : "") + (offen ? " · Die Rechnungsnummer wird beim Stellen vergeben" : " · " + U.datum(r.datum) + " · fällig " + U.datum(r.faellig) + " · " + K.ST.rechnung[r.status][0]), kn) +
      (!offen && r.status !== "storniert" ? '<div class="kpis"><div class="kpi"><span>Betrag</span><b>' + U.eur(r.brutto) + '</b></div><div class="kpi"><span>Bezahlt</span><b>' + U.eur(bez) + '</b></div><div class="kpi' + (rest > 0 && r.faellig < U.isoTag() ? " rot" : "") + '"><span>Offen</span><b>' + U.eur(rest) + "</b>" + (r.mahnstufe ? "<small>" + r.mahnstufe + ". Erinnerung gesendet</small>" : "") + "</div></div>" : "") +
      '<form class="karte formular" data-f="rechnung" data-id="' + id + '" id="re-form"><div class="raster">' + (offen ? U.feld("art", "Art", r.art, { optionen: Object.keys(ARTNAME).map(function (a) { return [a, ARTNAME[a]]; }) }) + U.feld("leistungszeitraum", "Leistungszeitraum / -datum", r.leistungszeitraum || "", { pflicht: true, hilfe: "Pflichtangabe auf Rechnungen" }) +
          U.feld("steuerfall", "Umsatzsteuer", r.steuerfall || "normal", { optionen: Object.keys(U.STEUERFALL).map(function (x) { return [x, U.STEUERFALL[x]]; }), hilfe: "§ 13b nur bei Bauleistungen an andere Bauunternehmer" }) +
          U.feld("skonto_prozent", "Skonto %", r.skonto_prozent ? U.zahlText(r.skonto_prozent) : "", { typ: "number", ph: "z. B. 2" }) + U.feld("skonto_tage", "Skonto innerhalb Tagen", r.skonto_tage || "", { typ: "number", ph: "z. B. 7" }) : "") + "</div>" +
        '<div class="pe-wrap">' + K.posEditor(r.positionen, offen) + '</div><div class="summen"><span>Netto <b id="s-netto">' + U.eur(s.netto) + "</b></span><span>USt. " + U.zahlText(r.mwst) + ' % <b id="s-mwst">' + U.eur(s.mwst) + '</b></span><span class="gesamt">Gesamt <b id="s-brutto">' + U.eur(s.brutto) + '</b></span><span>Lohnanteil § 35a <b id="s-lohn">' + U.eur(U.lohnNetto(r.positionen)) + "</b> netto</span></div>" +
        (offen ? '<div class="knoepfe"><span class="still" id="re-stand"></span><button class="btn btn-signal">Speichern</button><button type="button" class="btn btn-ghost gefahr" data-a="rechnungLoeschen" data-id="' + id + '">Entwurf löschen</button></div>' : "") + "</form>" +
      (zs.length ? '<section class="karte"><h2>Zahlungen</h2><ul class="liste">' + zs.map(function (z) { return "<li>" + U.datum(z.datum) + " · " + U.eur(z.betrag) + " · " + h({ ueberweisung: "Überweisung", bar: "Bar", karte: "Karte", skonto: "Skonto/Abzug" }[z.art] || z.art) + (z.notiz ? " · " + h(z.notiz) : "") + "</li>"; }).join("") + "</ul></section>" : "") +
      (await K.verlaufHtml("rechnung", id));
  }
  V.rechnungen.danach = function () {
    var f = document.getElementById("re-form"); if (!f || !K._rechnung || K._rechnung.status !== "entwurf") return;
    var mw = function () { return f.elements.steuerfall && f.elements.steuerfall.value !== "normal" ? 0 : (K.ctx.betrieb.kleinunternehmer ? 0 : +K.ctx.betrieb.mwst); };
    var neu = function (p) { var s = U.summen(p, mw()); f.querySelector("#s-netto").textContent = U.eur(s.netto); f.querySelector("#s-mwst").textContent = U.eur(s.mwst); f.querySelector("#s-brutto").textContent = U.eur(s.brutto); f.querySelector("#s-lohn").textContent = U.eur(U.lohnNetto(p)); f.querySelector("#re-stand").textContent = "Nicht gespeicherte Änderungen"; };
    K.posBinden(f, K._rechnung.positionen, neu);
    if (f.elements.steuerfall) f.elements.steuerfall.addEventListener("change", function () { neu(K.posLesen(f, K._rechnung.positionen)); });
  };
  async function rechnungSpeichern() {
    var f = document.getElementById("re-form"); if (!f || K._rechnung.status !== "entwurf") return K._rechnung;
    var sf = f.elements.steuerfall.value, mwst = sf !== "normal" ? 0 : (K.ctx.betrieb.kleinunternehmer ? 0 : +K.ctx.betrieb.mwst);
    if (sf === "normal" && K.ctx.betrieb.kleinunternehmer) throw new Error("Sie sind in den Einstellungen als Kleinunternehmer eingetragen. Bitte „Kleinunternehmer (§ 19 UStG)“ wählen.");
    var pos = K.posLesen(f, K._rechnung.positionen), s = U.summen(pos, mwst);
    K._rechnung = await DB.aendern("rechnungen", K._rechnung.id, { art: f.elements.art.value, leistungszeitraum: f.elements.leistungszeitraum.value, positionen: pos, netto: s.netto, brutto: s.brutto, mwst: mwst, steuerfall: sf,
      lohn_netto: U.lohnNetto(pos), skonto_prozent: U.zahl(f.elements.skonto_prozent.value) || null, skonto_tage: parseInt(f.elements.skonto_tage.value, 10) || null });
    return K._rechnung;
  }
  K.formular.rechnung = async function () { await rechnungSpeichern(); U.toast("Gespeichert."); K.neuLaden(); };
  K.aktion.rechnungLoeschen = async function (el) { if (!(await U.bestaetigen("Diesen Entwurf löschen?", "Löschen", true))) return; await DB.loeschen("rechnungen", el.dataset.id); K.go("rechnungen"); };
  K.aktion.rechnungStellen = async function (el) {
    var r = await rechnungSpeichern(), b = K.ctx.betrieb, k = r.kunde_id ? await DB.eins("kunden", r.kunde_id) : null;
    var fehlt = []; if (!b.strasse || !b.plz || !b.ort) fehlt.push("Ihre Anschrift"); if (!b.steuernummer && !b.ust_id) fehlt.push("Steuernummer oder USt-IdNr."); if (!b.iban) fehlt.push("IBAN");
    if (!k || !k.name || !k.strasse || !k.ort) fehlt.push("Anschrift des Kunden"); if (!r.leistungszeitraum) fehlt.push("Leistungszeitraum");
    if (r.steuerfall === "13b" && k && !k.ust_id) fehlt.push("USt-IdNr. des Kunden (bei § 13b, Kundendaten)");
    if (!r.positionen.some(function (p) { return p.typ === "pos" && String(p.text).trim(); })) fehlt.push("mindestens eine Position");
    if (fehlt.length) throw new Error("Für eine gültige Rechnung fehlt noch: " + fehlt.join(", ") + ". Betriebsdaten unter Einstellungen.");
    if (!(await U.bestaetigen("Rechnung über " + U.eur(r.brutto) + " stellen? Danach bekommt sie eine feste Nummer und kann nicht mehr geändert, nur noch storniert werden.", "Rechnung stellen"))) return;
    var nr = await K.nr("RE"), heute = U.isoTag();
    var dok = { absender: { name: b.name, inhaber: b.inhaber, strasse: b.strasse, plz: b.plz, ort: b.ort, telefon: b.telefon, email: b.email, steuernummer: b.steuernummer, ust_id: b.ust_id, bank: b.bank, iban: b.iban, bic: b.bic, logo: b.logo || null },
      empfaenger: { name: k.name, strasse: k.strasse, plz: k.plz, ort: k.ort, email: k.email || null, ust_id: k.ust_id || null, leitweg_id: k.leitweg_id || null, rechnungsadresse: k.rechnungsadresse || null, id: k.id }, erstellt_von: K.ctx.ich.name };
    await DB.aendern("rechnungen", r.id, { nr: nr, datum: heute, faellig: U.plusTage(heute, b.zahlungsziel_tage), status: "gestellt", gestellt_at: new Date().toISOString(), dokument: dok });
    var ids = {}; r.positionen.forEach(function (p) { if (p.bericht) ids[p.bericht] = 1; });
    for (var bid in ids) await DB.aendern("berichte", bid, { status: "abgerechnet" }).catch(function () {});
    await K.verlauf("rechnung", r.id, "Rechnung " + nr + " gestellt (" + U.eur(r.brutto) + ")"); if (r.auftrag_id) await K.verlauf("auftrag", r.auftrag_id, "Rechnung " + nr + " gestellt"); if (k) await K.verlauf("kunde", k.id, "Rechnung " + nr + " über " + U.eur(r.brutto));
    U.toast("Rechnung " + nr + " gestellt."); K.neuLaden();
    if (k && k.email && (await U.bestaetigen("Rechnung jetzt per E-Mail an " + k.email + " senden? (E-Mail-Programm öffnet sich, PDF bitte anhängen)", "E-Mail öffnen"))) {
      var x = await DB.eins("rechnungen", r.id);
      U.mail(k.email, "Rechnung " + nr + " – " + b.name, "Guten Tag " + k.name + ",\n\nanbei erhalten Sie unsere Rechnung " + nr + " über " + U.eur(x.brutto) + ", zahlbar bis " + U.datum(x.faellig) + ".\nOnline ansehen: " + K.portalLink("rechnung", x.portal_token) + "\n\nBankverbindung: " + (b.bank || "") + ", IBAN " + (b.iban || "") + "\nVerwendungszweck: " + nr + "\n\nVielen Dank für Ihren Auftrag.\n" + K.ctx.ich.name + "\n" + b.name);
    }
  };
  K.aktion.rechnungDruck = async function (el) {
    var r = K._rechnung && K._rechnung.id === el.dataset.id ? await rechnungSpeichern() : await DB.eins("rechnungen", el.dataset.id), b = K.ctx.betrieb, k = r.kunde_id ? await DB.eins("kunden", r.kunde_id) : {};
    U.drucken(U.rechnungsDoc(r, b, k, ARTNAME[r.art]), ARTNAME[r.art] + " " + r.nr);
  };
  K.aktion.rechnungLink = async function (el) { var r = await DB.eins("rechnungen", el.dataset.id); U.kopieren(K.portalLink("rechnung", r.portal_token)); };
  K.aktion.zahlung = async function (el) {
    var r = await DB.eins("rechnungen", el.dataset.id), rest = Math.round((+r.brutto - (await bezahlt(r))) * 100) / 100;
    var d = await U.dialog("Zahlung erfassen", '<div class="raster">' + U.feld("betrag", "Betrag (€)", U.zahlText(rest, 2), { typ: "number", pflicht: true }) + U.feld("datum", "Eingang am", U.isoTag(), { typ: "date", pflicht: true }) + U.feld("art", "Art", "ueberweisung", { optionen: [["ueberweisung", "Überweisung"], ["bar", "Bar"], ["karte", "Karte"], ["skonto", "Skonto/Abzug"]] }) + U.feld("notiz", "Notiz", "") + "</div>"); if (!d) return;
    var betrag = U.zahl(d.daten.betrag); if (!betrag) throw new Error("Bitte einen Betrag eingeben.");
    if (d.daten.art === "bar" && betrag > 0 && K.kasseBuchen) await K.kasseBuchen({ art: "einnahme", datum: d.daten.datum, betrag: Math.round(betrag * 100) / 100, text: "Barzahlung Rechnung " + r.nr, ust_satz: r.steuerfall === "normal" || !r.steuerfall ? +r.mwst : 0, rechnung_id: r.id });   // ins Kassenbuch
    await K.neu("zahlungen", { rechnung_id: r.id, betrag: betrag, datum: d.daten.datum, art: d.daten.art, notiz: d.daten.notiz || null });
    var neuRest = Math.round((rest - betrag) * 100) / 100;
    await DB.aendern("rechnungen", r.id, { status: neuRest <= 0.004 ? "bezahlt" : "teilbezahlt" });
    await K.verlauf("rechnung", r.id, "Zahlung " + U.eur(betrag) + " erfasst" + (neuRest <= 0 ? " – vollständig bezahlt" : ", offen " + U.eur(neuRest)));
    U.toast(neuRest <= 0 ? "Rechnung bezahlt." : "Teilzahlung erfasst."); K.neuLaden();
  };
  K.aktion.mahnen = async function (el) {
    var r = await DB.eins("rechnungen", el.dataset.id), k = await DB.eins("kunden", r.kunde_id), b = K.ctx.betrieb, n = (r.mahnstufe || 0) + 1, rest = +r.brutto - (await bezahlt(r));
    var text = "Guten Tag " + k.name + ",\n\n" + (n === 1 ? "sicher ist es nur untergegangen: Unsere Rechnung " + r.nr + " vom " + U.datum(r.datum) + " über " + U.eur(rest) + " war am " + U.datum(r.faellig) + " fällig." : "leider haben wir zu unserer Rechnung " + r.nr + " vom " + U.datum(r.datum) + " noch keinen Zahlungseingang über " + U.eur(rest) + " feststellen können. Bitte überweisen Sie den Betrag bis zum " + U.datum(U.plusTage(null, 7)) + ".") +
      "\n\nBankverbindung: " + (b.bank || "") + ", IBAN " + (b.iban || "") + ", Verwendungszweck " + r.nr + "\nRechnung online: " + K.portalLink("rechnung", r.portal_token) + "\n\nFalls Sie bereits bezahlt haben, betrachten Sie diese Nachricht bitte als gegenstandslos.\n\nMit freundlichen Grüßen\n" + K.ctx.ich.name + "\n" + b.name;
    var d = await U.dialog(n + ". Zahlungserinnerung", U.feld("text", "Nachricht", text, { typ: "textarea", zeilen: 12, breit: true }), [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "E-Mail öffnen und vermerken", primaer: true }]); if (!d) return;
    await DB.aendern("rechnungen", r.id, { mahnstufe: n }); await K.verlauf("rechnung", r.id, n + ". Zahlungserinnerung gesendet");
    U.mail(k.email, (n === 1 ? "Zahlungserinnerung" : n + ". Zahlungserinnerung") + " – Rechnung " + r.nr, d.daten.text); K.neuLaden();
  };
  K.aktion.stornieren = async function (el) {
    var r = await DB.eins("rechnungen", el.dataset.id);
    if (!(await U.bestaetigen("Rechnung " + r.nr + " stornieren? Es wird eine Stornorechnung (Gutschrift) mit eigener Nummer erzeugt.", "Stornieren", true))) return;
    var nr = await K.nr("RE");
    await K.neu("rechnungen", { nr: nr, art: "gutschrift", kunde_id: r.kunde_id, auftrag_id: r.auftrag_id, mwst: r.mwst, positionen: [{ id: U.uuid(), typ: "pos", text: "Storno zu Rechnung " + r.nr + " vom " + U.datum(r.datum), menge: 1, einheit: "pausch.", preis: -(+r.netto) }], netto: -(+r.netto), brutto: -(+r.brutto), status: "bezahlt", datum: U.isoTag(), faellig: U.isoTag(), leistungszeitraum: r.leistungszeitraum });
    await DB.aendern("rechnungen", r.id, { status: "storniert" }); await K.verlauf("rechnung", r.id, "Storniert durch " + nr); K.neuLaden();
  };
})();
