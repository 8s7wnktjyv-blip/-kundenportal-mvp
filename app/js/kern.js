/* Kundario – Kernbereiche: Übersicht, Anfragen, Kunden, Angebote, Nachfassen, Aufträge */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;
  K.aktion = {}; K.formular = {};
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-a]"); if (!el || !K.aktion[el.dataset.a]) return;
    e.preventDefault(); if (el.disabled) return;
    el.disabled = true; Promise.resolve(K.aktion[el.dataset.a](el)).catch(U.fehler).finally(function () { el.disabled = false; });
  });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-f]"); if (!f || !K.formular[f.dataset.f]) return;
    e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; }
    var d = {}; Array.prototype.forEach.call(f.elements, function (el) { if (el.name) d[el.name] = el.type === "checkbox" ? el.checked : el.value; });
    var b = f.querySelector("[type=submit]"); if (b) b.disabled = true;
    Promise.resolve(K.formular[f.dataset.f](d, f)).catch(U.fehler).finally(function () { if (b) b.disabled = false; });
  });

  /* ---------- Gemeinsames ---------- */
  K.ST = {
    anfrage: { neu: ["Neu", "info"], in_pruefung: ["In Prüfung", ""], besichtigung: ["Besichtigung", "info"], angebot: ["Angebot raus", "warn"], gewonnen: ["Gewonnen", "ok"], verloren: ["Verloren", "aus"], spam: ["Spam", "aus"] },
    angebot: { entwurf: ["Entwurf", ""], gesendet: ["Gesendet", "warn"], angenommen: ["Angenommen", "ok"], abgelehnt: ["Abgelehnt", "aus"], abgelaufen: ["Abgelaufen", "aus"] },
    auftrag: { geplant: ["Geplant", "info"], in_arbeit: ["In Arbeit", "warn"], pausiert: ["Pausiert", ""], abgeschlossen: ["Abgeschlossen", "ok"], storniert: ["Storniert", "aus"] },
    rechnung: { entwurf: ["Entwurf", ""], gestellt: ["Offen", "warn"], teilbezahlt: ["Teilbezahlt", "warn"], bezahlt: ["Bezahlt", "ok"], storniert: ["Storniert", "aus"] },
    bericht: { entwurf: ["Entwurf", ""], unterschrieben: ["Unterschrieben", "info"], abgerechnet: ["Abgerechnet", "ok"] }
  };
  K.KANAL = { telefon: "Telefon", email: "E-Mail", whatsapp: "WhatsApp", formular: "Website-Formular", empfehlung: "Empfehlung", portal: "Portal", sonstiges: "Sonstiges" };
  K.kundenMap = async function () { var m = {}; (await K.liste("kunden", { select: "id,name,ort,email,telefon,strasse,plz" })).forEach(function (k) { m[k.id] = k; }); return m; };
  K.kundeWahl = async function (name, wert, mitNeu) {
    var ks = await K.liste("kunden", { select: "id,name,ort", sortiere: "name.asc" }), lid = "kl-" + Math.random().toString(36).slice(2, 7);
    var label = function (k) { return k.name + (k.ort ? ", " + k.ort : ""); }, akt = ks.filter(function (k) { return k.id === wert; })[0];
    return '<div class="fld kunde-suche"><label>Kunde</label><input type="search" list="' + lid + '" data-kunde-suche="' + name + '" value="' + h(akt ? label(akt) : "") + '" placeholder="' + (mitNeu ? "Namen tippen – oder unten neuen Kunden anlegen" : "Namen tippen …") + '" autocomplete="off">' +
      '<input type="hidden" name="' + name + '" value="' + h(wert || "") + '"><datalist id="' + lid + '">' + ks.map(function (k) { return '<option value="' + h(label(k)) + '" data-id="' + k.id + '"></option>'; }).join("") + "</datalist><small data-kunde-info></small></div>";
  };
  document.addEventListener("input", function (e) {
    var el = e.target.closest("[data-kunde-suche]"); if (!el) return;
    var opt = Array.prototype.filter.call(document.getElementById(el.getAttribute("list")).options, function (o) { return o.value === el.value; })[0];
    var hid = el.parentNode.querySelector('input[type=hidden][name="' + el.dataset.kundeSuche + '"]'); hid.value = opt ? opt.dataset.id : "";
    el.parentNode.querySelector("[data-kunde-info]").textContent = el.value && !opt ? "Nicht gefunden – bitte aus der Liste wählen oder neuen Kunden anlegen." : "";
  });
  K.verlaufHtml = async function (typ, id) {
    var v = await K.liste("verlauf", { wo: { bezug_typ: typ, bezug_id: id }, sortiere: "created_at.desc", limit: 50 });
    return '<section class="karte"><h2>Verlauf</h2><form class="zeile-form" data-f="notiz" data-typ="' + typ + '" data-id="' + id + '"><input name="text" placeholder="Notiz hinzufügen …" required maxlength="1000"><button class="btn btn-outline klein">Speichern</button></form>' +
      (v.length ? '<ol class="verlauf">' + v.map(function (x) { return "<li><time>" + h(U.datumZeit(x.created_at)) + "</time> " + h(x.text) + (x.user_id ? " <small>(" + h(K.mitgliedName(x.user_id) || "") + ")</small>" : "") + "</li>"; }).join("") + "</ol>" : '<p class="still">Noch keine Einträge.</p>') + "</section>";
  };
  K.formular.notiz = async function (d, f) { await K.verlauf(f.dataset.typ, f.dataset.id, d.text); K.neuLaden(); };
  K.kundeAnlegenAus = async function (d) {
    if (d.kunde_id) return d.kunde_id;
    if (!String(d.k_name || "").trim()) throw new Error("Bitte einen Kunden wählen oder den Namen eines neuen Kunden eingeben.");
    var doppelt = await K.dublettenOk({ name: d.k_name, email: d.k_email, telefon: d.k_telefon }, true); if (doppelt && doppelt.id) return doppelt.id; if (doppelt === false) throw new Error("Abgebrochen.");
    var k = await K.neu("kunden", { name: d.k_name.trim(), telefon: d.k_telefon || null, email: d.k_email || null, strasse: d.k_strasse || null, plz: d.k_plz || null, ort: d.k_ort || null, quelle: d.kanal || null });
    await K.verlauf("kunde", k.id, "Kunde angelegt"); return k.id;
  };
  // Dublettenprüfung: gleicher Name, gleiche E-Mail oder gleiche Telefonnummer
  K.dublettenOk = async function (k, nehmenAnbieten) {
    var norm = function (x) { return String(x || "").toLowerCase().replace(/^(familie|herr|frau|firma)\s+/, "").replace(/[^a-z0-9äöüß@.]/g, ""); }, tel = function (x) { return String(x || "").replace(/\D/g, "").replace(/^49/, "0"); };
    var alle = await K.liste("kunden", { select: "id,name,email,telefon,ort" });
    var treffer = alle.filter(function (x) { return (norm(x.name) && norm(x.name) === norm(k.name)) || (k.email && norm(x.email) === norm(k.email)) || (tel(k.telefon).length > 5 && tel(x.telefon) === tel(k.telefon)); });
    if (!treffer.length) return true;
    var t = treffer[0];
    var r = await U.dialog("Kunde schon vorhanden?", "<p>Es gibt bereits <b>" + h(t.name) + "</b>" + (t.ort ? " (" + h(t.ort) + ")" : "") + (t.email ? ", " + h(t.email) : "") + (t.telefon ? ", " + h(t.telefon) : "") + ".</p>",
      [{ wert: "", text: "Abbrechen" }].concat(nehmenAnbieten ? [{ wert: "nehmen", text: "Diesen Kunden nehmen", primaer: true }] : []).concat([{ wert: "neu", text: "Trotzdem neu anlegen" }]));
    if (!r) return false; if (r.wert === "nehmen") return t; return true;
  };
  var neuerKundeFelder = '<details class="neu-kunde"><summary>Neuen Kunden anlegen</summary><div class="raster">' + U.feld("k_name", "Name", "") + U.feld("k_telefon", "Telefon", "", { typ: "tel" }) + U.feld("k_email", "E-Mail", "", { typ: "email" }) + U.feld("k_strasse", "Straße", "") + U.feld("k_plz", "PLZ", "") + U.feld("k_ort", "Ort", "") + "</div></details>";

  /* ---------- Übersicht ---------- */
  V.uebersicht = async function () {
    var c = K.ctx, fin = K.darf("rechnungen"), vertr = K.darf("angebote");
    var heute = U.isoTag(), morgen = U.plusTage(heute, 1);
    var r = await Promise.all([
      K.darf("anfragen") ? K.liste("anfragen", { wo: { status: ["neu", "in_pruefung"] }, sortiere: "created_at.desc" }) : [],
      vertr ? K.liste("angebote", { wo: { status: "gesendet" } }) : [],
      K.liste("termine", { sortiere: "beginn.asc" }),
      K.liste("aufgaben", { wo: { erledigt: false }, sortiere: "faellig.asc" }),
      fin ? K.liste("rechnungen", { wo: { status: ["gestellt", "teilbezahlt"] } }) : [],
      K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit"] } }),
      K.kundenMap()
    ]);
    var anf = r[0], ang = r[1], ter = r[2].filter(function (t) { return t.beginn.slice(0, 10) >= heute && t.beginn.slice(0, 10) <= morgen && (c.ich.rolle !== "monteur" || (t.mitarbeiter || []).indexOf(c.user.id) > -1); }), auf = r[3].filter(function (a) { return !a.zugewiesen_an || a.zugewiesen_an === c.user.id || c.ich.rolle === "gf" || c.ich.rolle === "buero"; }), re = r[4], au = r[5], km = r[6];
    var faellig = ang.filter(function (a) { return K.nachfassFaellig(a).faellig; });
    var wart = K.wartungenFaellig ? await K.wartungenFaellig() : [];
    var ueber = re.filter(function (x) { return x.faellig && x.faellig < heute; });
    var kpi = function (t, w, s, link, farbe) { return '<a class="kpi farbig ' + (farbe || "") + '" href="#/' + link + '"><span>' + h(t) + '</span><b data-zaehl>' + w + "</b><small>" + h(s) + "</small></a>"; };
    var gruss = new Date().getHours() < 11 ? "Guten Morgen" : new Date().getHours() < 18 ? "Guten Tag" : "Guten Abend";
    return K.kopf(gruss + ", " + c.ich.name.split(" ")[0], "Das steht heute an – " + new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }) + ".") + (K.startCheckliste ? await K.startCheckliste() : "") +
      '<div class="kpis">' + (K.darf("anfragen") ? kpi("Neue Anfragen", anf.length, "warten auf Sie", "anfragen", "k-blau") : "") +
        (vertr ? kpi("Nachfassen fällig", faellig.length, "Angebote ohne Antwort", "nachfassen", "k-orange") + kpi("Offene Angebote", U.eur(ang.reduce(function (s, a) { return s + (+a.netto); }, 0)), ang.length + " gesendet, netto", "angebote", "k-lila") : "") +
        kpi("Aufträge aktiv", au.length, U.eur(au.reduce(function (s, a) { return s + (+a.wert_netto); }, 0)) + " netto", "auftraege", "k-gruen") +
        (fin ? kpi("Überfällig", U.eur(ueber.reduce(function (s, x) { return s + (+x.brutto); }, 0)), ueber.length + " Rechnungen", "rechnungen", ueber.length ? "k-rot" : "k-grau") : "") + "</div>" +
      '<div class="raster-2">' +
        '<section class="karte"><h2>Termine heute und morgen</h2>' + (ter.length ? '<ul class="liste">' + ter.map(function (t) { return '<li><a href="#/kalender/' + t.id + '"><b>' + (t.beginn.slice(0, 10) === heute ? "Heute" : "Morgen") + " " + U.zeit(t.beginn) + "</b> " + h(t.titel) + (t.kunde_id && km[t.kunde_id] ? " – " + h(km[t.kunde_id].name) : "") + "</a></li>"; }).join("") + "</ul>" : '<p class="still">Keine Termine.</p>') + '<a class="mehr" href="#/kalender">Zum Kalender</a></section>' +
        '<section class="karte"><h2>Offene Aufgaben</h2>' + (auf.length ? '<ul class="liste">' + auf.slice(0, 8).map(function (a) { return '<li><label class="chk"><input type="checkbox" data-a="aufgabeErledigt" data-id="' + a.id + '"> ' + h(a.titel) + (a.faellig ? " <small>bis " + U.datum(a.faellig) + "</small>" : "") + "</label></li>"; }).join("") + "</ul>" : '<p class="still">Alles erledigt.</p>') + "</section>" +
        (wart.length && K.darf("wartungen") ? '<section class="karte"><h2>Wartungen fällig</h2><ul class="liste">' + wart.slice(0, 6).map(function (w) { return '<li><a href="#/wartungen"><b>' + U.datum(w.naechste) + "</b> " + h(w.titel) + (km[w.kunde_id] ? " – " + h(km[w.kunde_id].name) : "") + "</a></li>"; }).join("") + '</ul><a class="mehr" href="#/wartungen">Alle Wartungsverträge</a></section>' : "") +
        (K.darf("anfragen") ? '<section class="karte"><h2>Neue Anfragen</h2>' + (anf.length ? '<ul class="liste">' + anf.slice(0, 6).map(function (a) { return '<li><a href="#/anfragen/' + a.id + '"><b>' + h(a.betreff) + "</b> " + (a.kunde_id && km[a.kunde_id] ? h(km[a.kunde_id].name) + " · " : "") + h(U.relativ(a.created_at)) + "</a></li>"; }).join("") + "</ul>" : '<p class="still">Keine neuen Anfragen.</p>') + '<a class="mehr" href="#/anfragen">Alle Anfragen</a></section>' : "") +
        (vertr ? '<section class="karte"><h2>Heute nachfassen</h2>' + (faellig.length ? '<ul class="liste">' + faellig.slice(0, 6).map(function (a) { return '<li><a href="#/nachfassen"><b>' + h(a.nr) + "</b> " + h(km[a.kunde_id] ? km[a.kunde_id].name : "") + " · " + U.eur(a.netto) + "</a></li>"; }).join("") + "</ul>" : '<p class="still">Nichts fällig.</p>') + "</section>" : "") +
      "</div>";
  };
  K.aktion.aufgabeErledigt = async function (el) { await DB.aendern("aufgaben", el.dataset.id, { erledigt: true, erledigt_at: new Date().toISOString() }); U.toast("Erledigt."); K.neuLaden(); };

  /* ---------- Anfragen ---------- */
  V.anfragen = async function (id) {
    if (id === "neu") return anfrageNeu();
    if (id) return anfrageDetail(id);
    var filt = sessionStorage.getItem("anf-filter") || "offen";
    var alle = await K.liste("anfragen", { sortiere: "created_at.desc" }), km = await K.kundenMap();
    var gruppen = { offen: ["neu", "in_pruefung", "besichtigung", "angebot"], gewonnen: ["gewonnen"], verloren: ["verloren", "spam"] };
    var liste = alle.filter(function (a) { return gruppen[filt].indexOf(a.status) > -1; });
    return K.kopf("Anfragen", "Alle Anfragen an einem Ort – egal ob Telefon, E-Mail oder WhatsApp.", '<a class="btn btn-signal" href="#/anfragen/neu">Neue Anfrage</a>') +
      '<div class="tabs">' + Object.keys(gruppen).map(function (g) { return '<button data-a="filter" data-k="anf-filter" data-v="' + g + '" aria-pressed="' + (g === filt) + '">' + { offen: "Offen", gewonnen: "Gewonnen", verloren: "Verloren" }[g] + " " + alle.filter(function (a) { return gruppen[g].indexOf(a.status) > -1; }).length + "</button>"; }).join("") + "</div>" +
      (liste.length ? '<div class="tabelle"><table><thead><tr><th>Anfrage</th><th>Kunde</th><th>Kanal</th><th>Eingang</th><th>Status</th><th class="r">Wert</th></tr></thead><tbody>' + liste.map(function (a) {
        return '<tr data-link="#/anfragen/' + a.id + '"><td><a href="#/anfragen/' + a.id + '">' + h(a.betreff) + "</a></td><td>" + h(km[a.kunde_id] ? km[a.kunde_id].name : "–") + "</td><td>" + h(K.KANAL[a.kanal]) + "</td><td>" + h(U.relativ(a.created_at)) + "</td><td>" + K.status(a.status, K.ST.anfrage) + '</td><td class="r">' + (a.wert_geschaetzt ? U.eur(a.wert_geschaetzt) : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>" : K.leer(filt === "offen" ? "Keine offenen Anfragen. Neue Anfragen tragen Sie über „Neue Anfrage“ ein." : "Hier ist noch nichts."));
  };
  K.aktion.filter = function (el) { sessionStorage.setItem(el.dataset.k, el.dataset.v); K.neuLaden(); };
  document.addEventListener("click", function (e) { var tr = e.target.closest("tr[data-link]"); if (tr && !e.target.closest("a,button,input,label")) location.hash = tr.dataset.link; });

  async function anfrageNeu() {
    return K.kopf("Neue Anfrage", "Was will der Kunde? Je genauer, desto schneller wird das Angebot.") +
      '<form class="karte formular" data-f="anfrageNeu"><div class="raster">' +
        U.feld("kanal", "Woher kam die Anfrage?", "telefon", { optionen: Object.keys(K.KANAL).map(function (k) { return [k, K.KANAL[k]]; }) }) +
        (await K.kundeWahl("kunde_id", "", true)) + "</div>" + neuerKundeFelder +
        '<div class="raster">' + U.feld("betreff", "Worum geht es?", "", { pflicht: true, max: 200, breit: true, ph: "z. B. Bad renovieren, Heizung tauschen" }) +
        U.feld("beschreibung", "Beschreibung", "", { typ: "textarea", breit: true, zeilen: 4 }) + U.feld("ort", "Ort der Arbeiten", "") + U.feld("wert_geschaetzt", "Geschätzter Wert (€, optional)", "", { typ: "number" }) + "</div>" +
        '<div class="knoepfe"><a class="btn btn-outline" href="#/anfragen">Abbrechen</a><button class="btn btn-signal" type="submit">Anfrage speichern</button></div></form>';
  }
  K.formular.anfrageNeu = async function (d) {
    var kid = await K.kundeAnlegenAus(d);
    var a = await K.neu("anfragen", { kunde_id: kid, kanal: d.kanal, betreff: d.betreff.trim(), beschreibung: d.beschreibung || null, ort: d.ort || null, wert_geschaetzt: d.wert_geschaetzt ? U.zahl(d.wert_geschaetzt) : null, zugewiesen_an: K.ctx.user.id });
    await K.verlauf("anfrage", a.id, "Anfrage erfasst (" + K.KANAL[d.kanal] + ")"); await K.verlauf("kunde", kid, "Neue Anfrage: " + a.betreff);
    U.toast("Anfrage gespeichert."); K.go("anfragen/" + a.id);
  };
  async function anfrageDetail(id) {
    var a = await DB.eins("anfragen", id); if (!a) return K.leer("Anfrage nicht gefunden.");
    var k = a.kunde_id ? await DB.eins("kunden", a.kunde_id) : null;
    var ang = K.darf("angebote") ? await K.liste("angebote", { wo: { anfrage_id: id } }) : [];
    var ter = await K.liste("termine", { wo: { anfrage_id: id }, sortiere: "beginn.asc" });
    return K.kopf(a.betreff, "Eingang " + U.datumZeit(a.created_at) + " · " + K.KANAL[a.kanal], '<a class="btn btn-outline" href="#/anfragen">Zurück</a>') +
      '<div class="raster-2"><section class="karte"><h2>Anfrage</h2><dl class="daten"><dt>Status</dt><dd><select data-a-change="anfrageStatus" data-id="' + id + '">' + Object.keys(K.ST.anfrage).map(function (s) { return '<option value="' + s + '"' + (s === a.status ? " selected" : "") + ">" + K.ST.anfrage[s][0] + "</option>"; }).join("") + "</select></dd>" +
        "<dt>Kunde</dt><dd>" + (k ? '<a href="#/kunden/' + k.id + '">' + h(k.name) + "</a>" + (k.telefon ? ' · <a href="tel:' + h(k.telefon) + '">' + h(k.telefon) + "</a>" : "") + (k.email ? ' · <a href="mailto:' + h(k.email) + '">' + h(k.email) + "</a>" : "") : "–") + "</dd>" +
        "<dt>Ort</dt><dd>" + h(a.ort || (k && k.ort) || "–") + "</dd><dt>Wert</dt><dd>" + (a.wert_geschaetzt ? U.eur(a.wert_geschaetzt) : "–") + "</dd><dt>Beschreibung</dt><dd>" + h(a.beschreibung || "–").replace(/\n/g, "<br>") + "</dd>" + (a.verlustgrund ? "<dt>Verlustgrund</dt><dd>" + h(a.verlustgrund) + "</dd>" : "") + "</dl>" +
        '<div class="knoepfe">' + (K.darf("angebote") ? '<button class="btn btn-signal" data-a="angebotAusAnfrage" data-id="' + id + '">Angebot erstellen</button>' : "") + '<button class="btn btn-outline" data-a="besichtigung" data-id="' + id + '">Besichtigung planen</button><a class="btn btn-outline" href="#/aufmass/neu/' + id + '">Aufmaß</a>' +
        (a.status !== "verloren" ? '<button class="btn btn-ghost" data-a="anfrageVerloren" data-id="' + id + '">Verloren</button>' : "") + "</div></section>" +
        '<section class="karte"><h2>Angebote und Termine</h2>' + (ang.length ? '<ul class="liste">' + ang.map(function (x) { return '<li><a href="#/angebote/' + x.id + '">' + h(x.nr) + " · " + h(x.titel) + " · " + U.eur(x.netto) + "</a> " + K.status(x.status, K.ST.angebot) + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch kein Angebot.</p>') +
        (ter.length ? '<ul class="liste">' + ter.map(function (t) { return '<li><a href="#/kalender/' + t.id + '">' + h(U.datumZeit(t.beginn)) + " · " + h(t.titel) + "</a></li>"; }).join("") + "</ul>" : "") + "</section></div>" +
      (await K.verlaufHtml("anfrage", id));
  }
  document.addEventListener("change", function (e) {
    var el = e.target.closest("[data-a-change]"); if (!el || !K.aktion[el.dataset.aChange]) return;
    Promise.resolve(K.aktion[el.dataset.aChange](el)).catch(U.fehler);
  });
  K.aktion.anfrageStatus = async function (el) { await DB.aendern("anfragen", el.dataset.id, { status: el.value }); await K.verlauf("anfrage", el.dataset.id, "Status: " + K.ST.anfrage[el.value][0]); U.toast("Status gespeichert."); K.neuLaden(); };
  K.aktion.anfrageVerloren = async function (el) {
    var r = await U.dialog("Anfrage verloren", U.feld("grund", "Warum? (hilft bei der Auswertung)", "", { optionen: ["Preis zu hoch", "Zu spät geantwortet", "Kunde hat anderen Betrieb", "Projekt verschoben", "Keine Rückmeldung", "Passt nicht zu uns", "Sonstiges"] }));
    if (!r) return; await DB.aendern("anfragen", el.dataset.id, { status: "verloren", verlustgrund: r.daten.grund }); await K.verlauf("anfrage", el.dataset.id, "Als verloren markiert: " + r.daten.grund); K.neuLaden();
  };
  K.aktion.besichtigung = async function (el) {
    var a = await DB.eins("anfragen", el.dataset.id);
    var r = await U.dialog("Besichtigung planen", '<div class="raster">' + U.feld("tag", "Datum", U.plusTage(null, 1), { typ: "date", pflicht: true }) + U.feld("zeit", "Uhrzeit", "09:00", { typ: "time", pflicht: true }) + U.feld("dauer", "Dauer (Minuten)", "60", { typ: "number" }) +
      U.feld("wer", "Wer fährt hin?", K.ctx.user.id, { optionen: K.ctx.team.map(function (m) { return [m.user_id, m.name]; }) }) + "</div>");
    if (!r) return; var beginn = new Date(r.daten.tag + "T" + r.daten.zeit);
    await K.neu("termine", { anfrage_id: a.id, kunde_id: a.kunde_id, art: "besichtigung", titel: "Besichtigung: " + a.betreff, beginn: beginn.toISOString(), ende: new Date(beginn.getTime() + (U.zahl(r.daten.dauer) || 60) * 6e4).toISOString(), ort: a.ort, mitarbeiter: [r.daten.wer] });
    await DB.aendern("anfragen", a.id, { status: "besichtigung" }); await K.verlauf("anfrage", a.id, "Besichtigung geplant am " + U.datum(r.daten.tag) + " um " + r.daten.zeit + " Uhr");
    U.toast("Besichtigung im Kalender."); K.neuLaden();
  };

  /* ---------- Kunden ---------- */
  V.kunden = async function (id) {
    if (id === "neu") return kundeForm(null);
    if (id) return kundeDetail(id);
    var q = (sessionStorage.getItem("kunden-suche") || "").toLowerCase();
    var ks = await K.liste("kunden", { sortiere: "name.asc" });
    var l = ks.filter(function (k) { return !q || [k.name, k.ort, k.email, k.telefon].join(" ").toLowerCase().indexOf(q) > -1; });
    return K.kopf("Kunden", ks.length + " Kunden in Ihrer Kartei.", K.darf("anfragen") ? '<button class="btn btn-outline" data-a="kundenImport">CSV importieren</button><a class="btn btn-signal" href="#/kunden/neu">Neuer Kunde</a>' : "") +
      '<input class="suche" type="search" placeholder="Suchen nach Name, Ort, Telefon …" value="' + h(q) + '" data-suche="kunden-suche">' +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Name</th><th>Ort</th><th>Telefon</th><th>E-Mail</th></tr></thead><tbody>' + l.map(function (k) { return '<tr data-link="#/kunden/' + k.id + '"><td><a href="#/kunden/' + k.id + '">' + h(k.name) + "</a></td><td>" + h(k.ort || "") + "</td><td>" + (k.telefon ? '<a href="tel:' + h(k.telefon) + '">' + h(k.telefon) + "</a>" : "") + "</td><td>" + h(k.email || "") + "</td></tr>"; }).join("") + "</tbody></table></div>" : K.leer(q ? "Kein Kunde gefunden." : "Noch keine Kunden. Kunden entstehen automatisch mit der ersten Anfrage."));
  };
  var sucheTimer; document.addEventListener("input", function (e) { var el = e.target.closest("[data-suche]"); if (!el) return; clearTimeout(sucheTimer); sucheTimer = setTimeout(function () { sessionStorage.setItem(el.dataset.suche, el.value); var pos = el.selectionStart; K.zeigen().then(function () { var n = document.querySelector("[data-suche]"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); }, 250); });
  function kundeForm(k) {
    k = k || {};
    return (k.id ? "" : K.kopf("Neuer Kunde")) + '<form class="karte formular" data-f="kunde" data-id="' + (k.id || "") + '"><h2>' + (k.id ? "Stammdaten" : "Daten") + '</h2><div class="raster">' +
      U.feld("name", "Name / Firma", k.name, { pflicht: true }) + U.feld("art", "Art", k.art || "privat", { optionen: [["privat", "Privatkunde"], ["firma", "Firma"], ["hausverwaltung", "Hausverwaltung"], ["oeffentlich", "Öffentlicher Auftraggeber"]] }) +
      U.feld("ansprechpartner", "Ansprechpartner", k.ansprechpartner) + U.feld("telefon", "Telefon", k.telefon, { typ: "tel" }) + U.feld("email", "E-Mail", k.email, { typ: "email" }) +
      U.feld("strasse", "Straße und Nr.", k.strasse) + U.feld("plz", "PLZ", k.plz) + U.feld("ort", "Ort", k.ort) +
      U.feld("rechnungsadresse", "Abweichende Rechnungsadresse", k.rechnungsadresse, { typ: "textarea", zeilen: 2, ph: "nur ausfüllen, wenn anders als oben" }) +
      U.feld("weitere", "Weitere Ansprechpartner (je Zeile: Name, Telefon, E-Mail)", (k.ansprechpartner_liste || []).map(function (a) { return [a.name, a.telefon, a.email].filter(Boolean).join(", "); }).join("\n"), { typ: "textarea", zeilen: 2 }) +
      U.feld("ust_id", "USt-IdNr. (bei Firmen, für § 13b)", k.ust_id) + U.feld("leitweg_id", "Leitweg-ID (öffentliche Auftraggeber, E-Rechnung)", k.leitweg_id) +
      U.feld("notiz", "Notiz", k.notiz, { typ: "textarea", breit: true }) +
      U.feld("bewertung_ok", "Darf um eine Bewertung gebeten werden", k.id ? k.bewertung_ok : true, { typ: "checkbox" }) + '</div><div class="knoepfe">' + (k.id ? "" : '<a class="btn btn-outline" href="#/kunden">Abbrechen</a>') + '<button class="btn btn-signal" type="submit">Speichern</button>' +
      (k.id && K.darf("rechnungen") ? '<button class="btn btn-ghost gefahr" type="button" data-a="kundeLoeschen" data-id="' + k.id + '">Löschen</button>' : "") + "</div></form>";
  }
  K.formular.kunde = async function (d, f) {
    var weitere = String(d.weitere || "").split("\n").map(function (z) { var t = z.split(",").map(function (x) { return x.trim(); }); return t[0] ? { name: t[0], telefon: t.find(function (x) { return /\d{4,}/.test(x) && !/@/.test(x); }) || "", email: t.find(function (x) { return /@/.test(x); }) || "" } : null; }).filter(Boolean);
    var obj = { name: d.name.trim(), art: d.art, ansprechpartner: d.ansprechpartner || null, telefon: d.telefon || null, email: d.email || null, strasse: d.strasse || null, plz: d.plz || null, ort: d.ort || null, notiz: d.notiz || null, bewertung_ok: !!d.bewertung_ok,
      rechnungsadresse: d.rechnungsadresse || null, ansprechpartner_liste: weitere, ust_id: d.ust_id || null, leitweg_id: d.leitweg_id || null };
    if (f.dataset.id) { await DB.aendern("kunden", f.dataset.id, obj); U.toast("Gespeichert."); K.neuLaden(); }
    else { if (!(await K.dublettenOk(obj))) return; var k = await K.neu("kunden", obj); await K.verlauf("kunde", k.id, "Kunde angelegt"); K.go("kunden/" + k.id); }
  };
  K.aktion.kundeLoeschen = async function (el) {
    if (!(await U.bestaetigen("Kunden wirklich löschen? Anfragen, Angebote und Rechnungen bleiben erhalten, verlieren aber die Zuordnung. Für Rechnungen gilt die Aufbewahrungspflicht.", "Löschen", true))) return;
    await DB.loeschen("kunden", el.dataset.id); U.toast("Gelöscht."); K.go("kunden");
  };
  async function kundeDetail(id) {
    var k = await DB.eins("kunden", id); if (!k) return K.leer("Kunde nicht gefunden.");
    var r = await Promise.all([K.darf("anfragen") ? K.liste("anfragen", { wo: { kunde_id: id }, sortiere: "created_at.desc" }) : [], K.darf("angebote") ? K.liste("angebote", { wo: { kunde_id: id }, sortiere: "created_at.desc" }) : [], K.liste("auftraege", { wo: { kunde_id: id }, sortiere: "created_at.desc" }), K.darf("rechnungen") ? K.liste("rechnungen", { wo: { kunde_id: id }, sortiere: "datum.desc" }) : []]);
    var block = function (t, arr, f) { return arr.length ? "<h3>" + t + '</h3><ul class="liste">' + arr.map(f).join("") + "</ul>" : ""; };
    return K.kopf(k.name, [k.strasse, [k.plz, k.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "), (k.telefon ? '<a class="btn btn-outline" href="tel:' + h(k.telefon) + '">Anrufen</a>' : "") + (k.email ? '<a class="btn btn-outline" href="mailto:' + h(k.email) + '">E-Mail</a>' : "") + (K.darf("anfragen") ? '<a class="btn btn-signal" href="#/anfragen/neu">Neue Anfrage</a>' : "")) +
      '<div class="raster-2">' + kundeForm(k) + '<section class="karte"><h2>Vorgänge</h2>' +
        block("Anfragen", r[0], function (x) { return '<li><a href="#/anfragen/' + x.id + '">' + h(x.betreff) + "</a> " + K.status(x.status, K.ST.anfrage) + "</li>"; }) +
        block("Angebote", r[1], function (x) { return '<li><a href="#/angebote/' + x.id + '">' + h(x.nr) + " · " + h(x.titel) + " · " + U.eur(x.netto) + "</a> " + K.status(x.status, K.ST.angebot) + "</li>"; }) +
        block("Aufträge", r[2], function (x) { return '<li><a href="#/auftraege/' + x.id + '">' + h(x.nr) + " · " + h(x.titel) + "</a> " + K.status(x.status, K.ST.auftrag) + "</li>"; }) +
        block("Rechnungen", r[3], function (x) { return '<li><a href="#/rechnungen/' + x.id + '">' + h(x.nr) + " · " + U.eur(x.brutto) + "</a> " + K.status(x.status, K.ST.rechnung) + "</li>"; }) +
        (r[0].length + r[1].length + r[2].length + r[3].length ? "" : '<p class="still">Noch keine Vorgänge.</p>') + "</section></div>" + (await K.verlaufHtml("kunde", id));
  }

  /* ---------- Angebote ---------- */
  K.aktion.angebotAusAnfrage = async function (el) {
    var a = await DB.eins("anfragen", el.dataset.id), b = K.ctx.betrieb;
    if (!a.kunde_id) throw new Error("Bitte der Anfrage zuerst einen Kunden zuordnen.");
    var an = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: a.kunde_id, anfrage_id: a.id, titel: a.betreff, mwst: K.mwst(), einleitung: "vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen folgende Leistungen an:", positionen: [{ id: U.uuid(), typ: "pos", text: "", menge: 1, einheit: "Stk.", preis: 0 }] });
    await K.verlauf("anfrage", a.id, "Angebot " + an.nr + " angelegt"); K.go("angebote/" + an.id);
  };
  V.angebote = async function (id) {
    if (id === "neu") return angebotNeu();
    if (id) return angebotEditor(id);
    var filt = sessionStorage.getItem("ang-filter") || "offen";
    var alle = await K.liste("angebote", { sortiere: "created_at.desc" }), km = await K.kundenMap();
    var g = { offen: ["entwurf", "gesendet"], angenommen: ["angenommen"], abgelehnt: ["abgelehnt", "abgelaufen"] };
    var l = alle.filter(function (a) { return g[filt].indexOf(a.status) > -1; });
    return K.kopf("Angebote", "Erstellen, versenden, nachfassen.", '<a class="btn btn-signal" href="#/angebote/neu">Neues Angebot</a>') +
      '<div class="tabs">' + Object.keys(g).map(function (x) { return '<button data-a="filter" data-k="ang-filter" data-v="' + x + '" aria-pressed="' + (x === filt) + '">' + { offen: "Offen", angenommen: "Angenommen", abgelehnt: "Abgelehnt" }[x] + " " + alle.filter(function (a) { return g[x].indexOf(a.status) > -1; }).length + "</button>"; }).join("") + "</div>" +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Nr.</th><th>Titel</th><th>Kunde</th><th>Status</th><th>Gültig bis</th><th class="r">Netto</th></tr></thead><tbody>' + l.map(function (a) {
        return '<tr data-link="#/angebote/' + a.id + '"><td><a href="#/angebote/' + a.id + '">' + h(a.nr) + "</a></td><td>" + h(a.titel) + "</td><td>" + h(km[a.kunde_id] ? km[a.kunde_id].name : "–") + "</td><td>" + K.status(a.status, K.ST.angebot) + "</td><td>" + U.datum(a.gueltig_bis) + '</td><td class="r">' + U.eur(a.netto) + "</td></tr>";
      }).join("") + "</tbody></table></div>" : K.leer("Keine Angebote in dieser Ansicht."));
  };
  async function angebotNeu() {
    return K.kopf("Neues Angebot") + '<form class="karte formular" data-f="angebotNeu"><div class="raster">' + (await K.kundeWahl("kunde_id", "", true)) + U.feld("titel", "Titel", "", { pflicht: true, ph: "z. B. Badsanierung EG" }) + "</div>" + neuerKundeFelder +
      '<div class="knoepfe"><a class="btn btn-outline" href="#/angebote">Abbrechen</a><button class="btn btn-signal">Weiter zu den Positionen</button></div></form>';
  }
  K.formular.angebotNeu = async function (d) {
    var kid = await K.kundeAnlegenAus(d), b = K.ctx.betrieb;
    var an = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: kid, titel: d.titel.trim(), mwst: K.mwst(), einleitung: "vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen folgende Leistungen an:", positionen: [{ id: U.uuid(), typ: "pos", text: "", menge: 1, einheit: "Stk.", preis: 0 }] });
    K.go("angebote/" + an.id);
  };

  /* Positionseditor – für Angebote und Rechnungen gleich */
  K.posEditor = function (pos, offen) {
    var zeile = function (p, i) {
      if (!offen) return "";
      if (p.typ === "titel" || p.typ === "text") return '<tr class="pe-' + p.typ + '" data-i="' + i + '"><td colspan="6"><input data-p="text" value="' + h(p.text) + '" placeholder="' + (p.typ === "titel" ? "Zwischenüberschrift" : "Hinweistext") + '"></td><td class="pe-akt">' + akt(i) + "</td></tr>";
      return '<tr data-i="' + i + '"><td><input data-p="text" value="' + h(p.text) + '" placeholder="Leistung oder Material" required><textarea data-p="langtext" rows="1" placeholder="Beschreibung (optional)">' + h(p.langtext || "") + '</textarea></td><td><input data-p="menge" class="r" inputmode="decimal" value="' + U.zahlText(p.menge) + '"></td><td><input data-p="einheit" value="' + h(p.einheit || "") + '" list="einheiten"></td><td><input data-p="preis" class="r" inputmode="decimal" value="' + U.zahlText(p.preis, 2) + '"></td><td><input data-p="rabatt" class="r" inputmode="decimal" value="' + (p.rabatt ? U.zahlText(p.rabatt) : "") + '" placeholder="0"></td><td class="r pe-summe">' + U.eur(U.posNetto(p)) + '<label class="chk klein"><input type="checkbox" data-p="optional"' + (p.optional ? " checked" : "") + "> optional</label><label class=\"chk klein\" title=\"Arbeitskosten für den Steuerabzug nach § 35a\"><input type=\"checkbox\" data-p=\"lohn\"" + (U.istLohn(Object.assign({}, p, { optional: false })) ? " checked" : "") + "> Lohn</label></td><td class=\"pe-akt\">" + akt(i) + "</td></tr>";
    };
    var akt = function (i) { return '<button type="button" class="mini" data-pe="hoch" data-i="' + i + '" aria-label="nach oben">↑</button><button type="button" class="mini" data-pe="weg" data-i="' + i + '" aria-label="entfernen">×</button>'; };
    if (!offen) return '<div class="tabelle"><table class="pos"><thead><tr><th>Leistung</th><th class="r">Menge</th><th class="r">Preis</th><th class="r">Gesamt</th></tr></thead><tbody>' + pos.map(function (p) {
      if (p.typ === "titel") return '<tr class="pe-titel"><td colspan="4"><b>' + h(p.text) + "</b></td></tr>"; if (p.typ === "text") return '<tr><td colspan="4"><em>' + h(p.text) + "</em></td></tr>";
      return "<tr><td>" + h(p.text) + (p.optional ? " <em>(optional)</em>" : "") + (p.langtext ? "<br><small>" + h(p.langtext) + "</small>" : "") + '</td><td class="r">' + U.zahlText(p.menge) + " " + h(p.einheit || "") + '</td><td class="r">' + U.eur(p.preis) + (p.rabatt ? " −" + U.zahlText(p.rabatt) + " %" : "") + '</td><td class="r">' + U.eur(U.posNetto(p)) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    return '<datalist id="einheiten"><option>Stk.</option><option>Std.</option><option>m</option><option>m²</option><option>m³</option><option>lfm</option><option>pausch.</option><option>kg</option><option>l</option></datalist><div class="tabelle"><table class="pos pe"><thead><tr><th>Leistung</th><th>Menge</th><th>Einheit</th><th>Einzelpreis €</th><th>Rabatt %</th><th class="r">Gesamt</th><th></th></tr></thead><tbody>' + pos.map(zeile).join("") + "</tbody></table></div>" +
      '<div class="knoepfe links"><button type="button" class="btn btn-outline klein" data-pe="neu">+ Position</button><button type="button" class="btn btn-outline klein" data-pe="std">+ Arbeitsstunden (' + U.eur(K.ctx.betrieb.stundensatz) + ")</button><button type=\"button\" class=\"btn btn-outline klein\" data-pe=\"titel\">+ Überschrift</button><button type=\"button\" class=\"btn btn-outline klein\" data-pe=\"text\">+ Hinweistext</button><button type=\"button\" class=\"btn btn-outline klein\" data-pe=\"katalog\">+ Aus Katalog</button><button type=\"button\" class=\"btn btn-outline klein\" data-pe=\"vorlage\">+ Aus Vorlage</button></div>";
  };
  K.posLesen = function (wurzel, alt) {
    var neu = [];
    wurzel.querySelectorAll("tbody tr[data-i]").forEach(function (tr) {
      var p = Object.assign({}, alt[+tr.dataset.i]);
      tr.querySelectorAll("[data-p]").forEach(function (el) { var f = el.dataset.p; p[f] = el.type === "checkbox" ? el.checked : ["menge", "preis", "rabatt"].indexOf(f) > -1 ? U.zahl(el.value) : el.value; });
      neu.push(p);
    });
    return neu;
  };
  K.posBinden = function (wurzel, pos, beiAenderung) {
    function neuZeichnen() { var tb = wurzel.querySelector(".pe-wrap"); tb.innerHTML = K.posEditor(pos, true); beiAenderung(pos); }
    wurzel.addEventListener("input", function (e) {
      if (!e.target.dataset.p) return; var n = K.posLesen(wurzel, pos); pos.length = 0; n.forEach(function (x) { pos.push(x); });
      var tr = e.target.closest("tr[data-i]"), p = pos[+tr.dataset.i], s = tr.querySelector(".pe-summe"); if (s && p) s.firstChild.textContent = U.eur(U.posNetto(p));
      beiAenderung(pos);
    });
    wurzel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pe]"); if (!b) return; e.preventDefault();
      var n = K.posLesen(wurzel, pos); pos.length = 0; n.forEach(function (x) { pos.push(x); });
      var i = +b.dataset.i, a = b.dataset.pe;
      if (a === "katalog" || a === "vorlage") { (a === "katalog" ? K.katalogWahl() : K.vorlageWahl()).then(function (neu) { if (neu && neu.length) { neu.forEach(function (x) { pos.push(x); }); neuZeichnen(); U.toast(neu.length + " eingefügt."); } }).catch(U.fehler); return; }
      if (a === "neu") pos.push({ id: U.uuid(), typ: "pos", text: "", menge: 1, einheit: "Stk.", preis: 0 });
      if (a === "std") pos.push({ id: U.uuid(), typ: "pos", text: "Arbeitszeit", menge: 1, einheit: "Std.", preis: +K.ctx.betrieb.stundensatz });
      if (a === "titel" || a === "text") pos.push({ id: U.uuid(), typ: a, text: "" });
      if (a === "weg") pos.splice(i, 1);
      if (a === "hoch" && i > 0) pos.splice(i - 1, 0, pos.splice(i, 1)[0]);
      neuZeichnen();
    });
  };
  async function angebotEditor(id) {
    var a = await DB.eins("angebote", id); if (!a) return K.leer("Angebot nicht gefunden.");
    var k = a.kunde_id ? await DB.eins("kunden", a.kunde_id) : null, offen = a.status === "entwurf", s = U.summen(a.positionen, a.mwst);
    var au = await K.liste("auftraege", { wo: { angebot_id: id } });
    K._angebot = a;
    var knoepfe = '<a class="btn btn-outline" href="#/angebote">Zurück</a><button class="btn btn-outline" data-a="angebotDruck" data-id="' + id + '">Drucken / PDF</button>' +
      (offen ? '<button class="btn btn-signal" data-a="angebotSenden" data-id="' + id + '">Senden</button>' : "") +
      (a.status === "gesendet" ? '<button class="btn btn-outline" data-a="angebotLink" data-id="' + id + '">Kundenlink</button><button class="btn btn-signal" data-a="angebotAngenommen" data-id="' + id + '">Angenommen</button><button class="btn btn-ghost" data-a="angebotAbgelehnt" data-id="' + id + '">Abgelehnt</button>' : "") +
      (a.status === "angenommen" && !au.length ? '<button class="btn btn-signal" data-a="auftragAusAngebot" data-id="' + id + '">Auftrag anlegen</button>' : "") +
      (!offen ? '<button class="btn btn-ghost" data-a="angebotKopie" data-id="' + id + '">Als neuen Entwurf kopieren</button>' : "") +
      '<button class="btn btn-ghost" data-a="alsVorlage" data-id="' + id + '">Als Vorlage speichern</button>' +
      (a.status !== "entwurf" ? '<button class="btn btn-ghost" data-a="portalSperren" data-t="angebote" data-id="' + id + '">' + (a.portal_aktiv === false ? "Kundenlink freigeben" : "Kundenlink sperren") + "</button>" : "");
    return K.kopf("Angebot " + a.nr, (k ? k.name + " · " : "") + K.ST.angebot[a.status][0] + (a.gesendet_at ? " am " + U.datum(a.gesendet_at) : "") + (a.angenommen_name ? " · angenommen von " + a.angenommen_name : ""), knoepfe) +
      (au.length ? '<p class="hinweis-box">Auftrag: <a href="#/auftraege/' + au[0].id + '">' + h(au[0].nr) + "</a></p>" : "") +
      '<form class="karte formular" data-f="angebot" data-id="' + id + '" id="ang-form"><div class="raster">' + (offen ? (await K.kundeWahl("kunde_id", a.kunde_id)) + U.feld("titel", "Titel", a.titel, { pflicht: true }) : "<div class=\"fld\"><label>Kunde</label><p>" + h(k ? k.name : "–") + "</p></div><div class=\"fld\"><label>Titel</label><p>" + h(a.titel) + "</p></div>") +
        (offen ? U.feld("einleitung", "Einleitungstext", a.einleitung, { typ: "textarea", breit: true, zeilen: 2 }) : "") + "</div>" +
        '<div class="pe-wrap">' + K.posEditor(a.positionen, offen) + "</div>" +
        (offen ? "" : "") + '<div class="summen"><span>Netto <b id="s-netto">' + U.eur(s.netto) + "</b></span><span>USt. " + U.zahlText(a.mwst) + ' % <b id="s-mwst">' + U.eur(s.mwst) + '</b></span><span class="gesamt">Gesamt <b id="s-brutto">' + U.eur(s.brutto) + "</b></span></div>" +
        (offen ? '<div class="knoepfe"><span class="still" id="ang-stand"></span><button class="btn btn-signal" type="submit">Speichern</button><button class="btn btn-ghost gefahr" type="button" data-a="angebotLoeschen" data-id="' + id + '">Entwurf löschen</button></div>' : "") + "</form>" +
      (a.unterschrift ? '<section class="karte"><h2>Unterschrift des Kunden</h2><img class="unterschrift-bild" src="' + h(a.unterschrift) + '" alt="Unterschrift"><p>' + h(a.angenommen_name || "") + ", " + U.datumZeit(a.angenommen_at) + "</p></section>" : "") +
      (await K.verlaufHtml("angebot", id));
  }
  V.angebote.danach = function (id) {
    var f = document.getElementById("ang-form"); if (!f || !K._angebot || K._angebot.status !== "entwurf") return;
    var pos = K._angebot.positionen;
    K.posBinden(f, pos, function (p) { var s = U.summen(p, K._angebot.mwst); f.querySelector("#s-netto").textContent = U.eur(s.netto); f.querySelector("#s-mwst").textContent = U.eur(s.mwst); f.querySelector("#s-brutto").textContent = U.eur(s.brutto); f.querySelector("#ang-stand").textContent = "Nicht gespeicherte Änderungen"; });
  };
  K.formular.angebot = async function (d, f) {
    var pos = K.posLesen(f, K._angebot.positionen), s = U.summen(pos, K._angebot.mwst);
    await DB.aendern("angebote", f.dataset.id, { kunde_id: d.kunde_id || null, titel: d.titel.trim(), einleitung: d.einleitung, positionen: pos, netto: s.netto, brutto: s.brutto });
    U.toast("Angebot gespeichert."); K.neuLaden();
  };
  K.angebotSpeichernFallsOffen = angebotSpeichernFallsOffen;
  async function angebotSpeichernFallsOffen() { var f = document.getElementById("ang-form"); if (f && K._angebot && K._angebot.status === "entwurf") { var d = {}; Array.prototype.forEach.call(f.elements, function (el) { if (el.name) d[el.name] = el.value; }); var pos = K.posLesen(f, K._angebot.positionen), s = U.summen(pos, K._angebot.mwst); K._angebot = await DB.aendern("angebote", K._angebot.id, { kunde_id: d.kunde_id || null, titel: (d.titel || K._angebot.titel).trim(), einleitung: d.einleitung, positionen: pos, netto: s.netto, brutto: s.brutto }); } }
  K.aktion.angebotDruck = async function (el) {
    await angebotSpeichernFallsOffen();
    var a = await DB.eins("angebote", el.dataset.id), k = a.kunde_id ? await DB.eins("kunden", a.kunde_id) : {}, b = K.ctx.betrieb;
    U.drucken(U.dokument({ betrieb: b, kunde: k, titelArt: "Angebot", nr: a.nr, betreff: a.titel, einleitung: "Sehr geehrte Damen und Herren,\n" + (a.einleitung || ""), positionen: a.positionen, mwst: a.mwst, steuerfall: a.steuerfall === "13b" || b.kleinunternehmer ? (b.kleinunternehmer ? "kleinunternehmer" : "13b") : "normal",
      hinweise: b.kleinunternehmer ? ["Als Kleinunternehmer gemäß § 19 UStG berechnen wir keine Umsatzsteuer."] : [],
      meta: [["Datum", U.datum(a.gesendet_at || new Date())], ["Gültig bis", U.datum(a.gueltig_bis || U.plusTage(null, b.angebot_gueltig_tage))], ["Ihr Ansprechpartner", K.ctx.ich.name]],
      schluss: "Optionale Positionen sind nicht in der Gesamtsumme enthalten. Wir freuen uns auf Ihren Auftrag.\n\nMit freundlichen Grüßen\n" + K.ctx.ich.name }), "Angebot " + a.nr);
  };
  K.aktion.angebotSenden = async function (el) {
    await angebotSpeichernFallsOffen();
    var a = await DB.eins("angebote", el.dataset.id), k = a.kunde_id ? await DB.eins("kunden", a.kunde_id) : null, b = K.ctx.betrieb;
    if (!k) throw new Error("Bitte zuerst einen Kunden wählen und speichern.");
    if (!a.positionen.some(function (p) { return p.typ === "pos" && String(p.text).trim(); }) || !(+a.netto > 0)) throw new Error("Das Angebot hat noch keine Positionen mit Preis.");
    var gueltig = U.plusTage(null, b.angebot_gueltig_tage), link = K.portalLink("angebot", a.portal_token);
    var text = "Guten Tag " + k.name + ",\n\nvielen Dank für Ihre Anfrage. Ihr Angebot " + a.nr + " über " + U.eur(a.brutto) + " (brutto) können Sie hier ansehen und direkt online annehmen:\n" + link + "\n\nDas Angebot gilt bis " + U.datum(gueltig) + ". Bei Fragen erreichen Sie uns unter " + (b.telefon || b.email || "") + ".\n\nMit freundlichen Grüßen\n" + K.ctx.ich.name + "\n" + b.name;
    var r = await U.dialog("Angebot senden", "<p>So geht das Angebot an <b>" + h(k.name) + "</b>" + (k.email ? " (" + h(k.email) + ")" : "") + ". Die E-Mail öffnet sich in Ihrem E-Mail-Programm, Sie können sie dort noch ändern.</p>" + U.feld("text", "Nachricht", text, { typ: "textarea", zeilen: 9, breit: true }) + '<p class="still">Tipp: Hängen Sie zusätzlich das PDF an (Drucken / PDF → Als PDF speichern).</p>',
      [{ wert: "", text: "Abbrechen" }, { wert: "link", text: "Nur als gesendet markieren" }, { wert: "mail", text: "E-Mail öffnen und als gesendet markieren", primaer: true }]);
    if (!r) return;
    await DB.aendern("angebote", a.id, { status: "gesendet", gesendet_at: new Date().toISOString(), gueltig_bis: gueltig });
    if (a.anfrage_id) await DB.aendern("anfragen", a.anfrage_id, { status: "angebot" }).catch(function () {});
    await K.verlauf("angebot", a.id, "Angebot gesendet (" + U.eur(a.brutto) + ")"); await K.verlauf("kunde", k.id, "Angebot " + a.nr + " gesendet");
    if (r.wert === "mail") U.mail(k.email, "Ihr Angebot " + a.nr + " – " + b.name, r.daten.text);
    U.toast("Als gesendet markiert. Kundario erinnert Sie ans Nachfassen."); K.neuLaden();
  };
  K.aktion.angebotLink = async function (el) { var a = await DB.eins("angebote", el.dataset.id); U.kopieren(K.portalLink("angebot", a.portal_token)); };
  K.aktion.angebotAngenommen = async function (el) {
    var r = await U.dialog("Angebot angenommen", "<p>Der Kunde hat telefonisch, per E-Mail oder schriftlich zugesagt.</p>" + U.feld("name", "Wer hat zugesagt?", "", { pflicht: true }) + U.feld("auftrag", "Gleich Auftrag anlegen", true, { typ: "checkbox" }));
    if (!r) return; var a = await DB.aendern("angebote", el.dataset.id, { status: "angenommen", angenommen_at: new Date().toISOString(), angenommen_name: r.daten.name });
    if (a.anfrage_id) await DB.aendern("anfragen", a.anfrage_id, { status: "gewonnen" }).catch(function () {});
    await K.verlauf("angebot", a.id, "Angenommen von " + r.daten.name);
    if (r.daten.auftrag) return K.aktion.auftragAusAngebot(el); K.neuLaden();
  };
  K.aktion.angebotAbgelehnt = async function (el) {
    var r = await U.dialog("Angebot abgelehnt", U.feld("grund", "Grund", "", { optionen: ["Preis zu hoch", "Anderer Betrieb", "Projekt verschoben", "Keine Rückmeldung", "Sonstiges"] }));
    if (!r) return; var a = await DB.aendern("angebote", el.dataset.id, { status: "abgelehnt", ablehngrund: r.daten.grund });
    if (a.anfrage_id) await DB.aendern("anfragen", a.anfrage_id, { status: "verloren", verlustgrund: r.daten.grund }).catch(function () {});
    await K.verlauf("angebot", a.id, "Abgelehnt: " + r.daten.grund); K.neuLaden();
  };
  K.aktion.angebotKopie = async function (el) {
    var a = await DB.eins("angebote", el.dataset.id);
    var n = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: a.kunde_id, anfrage_id: a.anfrage_id, titel: a.titel, einleitung: a.einleitung, positionen: a.positionen, mwst: a.mwst, netto: a.netto, brutto: a.brutto });
    await K.verlauf("angebot", n.id, "Kopie von " + a.nr); K.go("angebote/" + n.id);
  };
  K.aktion.angebotLoeschen = async function (el) { if (!(await U.bestaetigen("Diesen Entwurf löschen?", "Löschen", true))) return; await DB.loeschen("angebote", el.dataset.id); K.go("angebote"); };

  /* ---------- Nachfassen ---------- */
  K.nachfassFaellig = function (a) {
    var tage = K.ctx.betrieb.nachfass_tage || [3, 7, 14], stufe = a.erinnert || 0, seit = U.tageSeit(a.gesendet_at) || 0;
    if (stufe >= tage.length) return { faellig: seit >= tage[tage.length - 1] + 3, anrufen: true, stufe: stufe, seit: seit };
    return { faellig: seit >= tage[stufe], inTagen: tage[stufe] - seit, stufe: stufe, seit: seit };
  };
  V.nachfassen = async function () {
    var ang = await K.liste("angebote", { wo: { status: "gesendet" }, sortiere: "gesendet_at.asc" }), km = await K.kundenMap(), tage = K.ctx.betrieb.nachfass_tage;
    var zeilen = ang.map(function (a) { return { a: a, f: K.nachfassFaellig(a) }; }).sort(function (x, y) { return (y.f.faellig - x.f.faellig) || (y.f.seit - x.f.seit); });
    return K.kopf("Nachfassen", "Angebote ohne Antwort. Erinnerung nach " + tage.join(", ") + " Tagen, danach ein Anruf. Sie entscheiden, was rausgeht.") +
      (zeilen.length ? '<div class="karten">' + zeilen.map(function (z) {
        var a = z.a, k = km[a.kunde_id] || {}, f = z.f;
        return '<article class="karte nf' + (f.faellig ? " faellig" : "") + '"><div class="nf-kopf"><a href="#/angebote/' + a.id + '"><b>' + h(a.nr) + "</b> " + h(a.titel) + "</a>" + '<span class="pill ' + (f.faellig ? "warn" : "") + '">' + (f.anrufen ? (f.faellig ? "Jetzt anrufen" : "Alle Erinnerungen gesendet") : f.faellig ? (f.stufe + 1) + ". Erinnerung fällig" : (f.stufe + 1) + ". Erinnerung in " + f.inTagen + " Tagen") + "</span></div>" +
          "<p>" + h(k.name || "") + " · " + U.eur(a.netto) + " netto · gesendet " + h(U.relativ(a.gesendet_at)) + (a.gueltig_bis ? " · gültig bis " + U.datum(a.gueltig_bis) : "") + "</p>" +
          '<div class="knoepfe links">' + (f.anrufen ? (k.telefon ? '<a class="btn btn-signal klein" href="tel:' + h(k.telefon) + '">Anrufen</a>' : "") : '<button class="btn ' + (f.faellig ? "btn-signal" : "btn-outline") + ' klein" data-a="erinnern" data-id="' + a.id + '">Erinnerung senden</button>') +
          '<button class="btn btn-outline klein" data-a="angebotAngenommen" data-id="' + a.id + '">Angenommen</button><button class="btn btn-ghost klein" data-a="angebotAbgelehnt" data-id="' + a.id + '">Abgelehnt</button></div></article>';
      }).join("") + "</div>" : K.leer("Keine offenen Angebote. Sobald Sie ein Angebot senden, erscheint es hier."));
  };
  K.aktion.erinnern = async function (el) {
    var a = await DB.eins("angebote", el.dataset.id), k = a.kunde_id ? await DB.eins("kunden", a.kunde_id) : {}, b = K.ctx.betrieb, n = (a.erinnert || 0) + 1;
    var text = "Guten Tag " + (k.name || "") + ",\n\n" + (n === 1 ? "ich wollte kurz nachfragen, ob Sie unser Angebot " + a.nr + " schon ansehen konnten." : n === 2 ? "unser Angebot " + a.nr + " ist noch offen. Haben Sie noch Fragen dazu? Gerne passen wir es an." : "ich melde mich ein letztes Mal zu unserem Angebot " + a.nr + ". Wenn es gerade nicht passt, ist das völlig in Ordnung – sagen Sie uns einfach kurz Bescheid.") +
      "\n\nHier können Sie es ansehen und online annehmen:\n" + K.portalLink("angebot", a.portal_token) + "\n\nMit freundlichen Grüßen\n" + K.ctx.ich.name + "\n" + b.name + (b.telefon ? "\nTel. " + b.telefon : "");
    var r = await U.dialog(n + ". Erinnerung", "<p>An " + h(k.name || "") + (k.email ? " (" + h(k.email) + ")" : " – keine E-Mail hinterlegt") + "</p>" + U.feld("text", "Nachricht", text, { typ: "textarea", zeilen: 10, breit: true }), [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "E-Mail öffnen und vermerken", primaer: true }]);
    if (!r) return;
    await DB.aendern("angebote", a.id, { erinnert: n, letzte_erinnerung_at: new Date().toISOString() });
    await K.verlauf("angebot", a.id, n + ". Erinnerung gesendet");
    if (K.darf("ablaeufe")) await K.neu("ablauf_laeufe", { ablauf: "nachfassen", titel: n + ". Erinnerung an " + (k.name || "") + " (" + a.nr + ")", status: "ok", protokoll: [[new Date().toISOString(), "Von " + K.ctx.ich.name + " freigegeben und per E-Mail-Programm versendet"]], bezug_typ: "angebot", bezug_id: a.id }).catch(function () {});
    U.mail(k.email, "Ihr Angebot " + a.nr, r.daten.text); K.neuLaden();
  };

  /* ---------- Aufträge ---------- */
  K.aktion.auftragAusAngebot = async function (el) {
    var a = await DB.eins("angebote", el.dataset.id);
    var au = await K.neu("auftraege", { nr: await K.nr("AU"), kunde_id: a.kunde_id, angebot_id: a.id, titel: a.titel, wert_netto: a.netto, verantwortlich: K.ctx.user.id, start: U.plusTage(null, 7) });
    await K.verlauf("auftrag", au.id, "Auftrag aus Angebot " + a.nr + " angelegt"); await K.verlauf("angebot", a.id, "Auftrag " + au.nr + " angelegt");
    if (a.kunde_id) await K.verlauf("kunde", a.kunde_id, "Neuer Auftrag " + au.nr);
    U.toast("Auftrag " + au.nr + " angelegt."); K.go("auftraege/" + au.id);
  };
  V.auftraege = async function (id, tab) {
    if (id === "neu") return K.kopf("Neuer Auftrag", "Ohne Angebot, z. B. für Kleinaufträge oder Wartung.") + '<form class="karte formular" data-f="auftragNeu"><div class="raster">' + (await K.kundeWahl("kunde_id", "", true)) + U.feld("titel", "Titel", "", { pflicht: true }) + U.feld("wert_netto", "Auftragswert netto (€)", "", { typ: "number" }) + U.feld("start", "Start", U.plusTage(null, 1), { typ: "date" }) + "</div>" + neuerKundeFelder + '<div class="knoepfe"><a class="btn btn-outline" href="#/auftraege">Abbrechen</a><button class="btn btn-signal">Anlegen</button></div></form>';
    if (id) return auftragDetail(id, tab || "ueberblick");
    var filt = sessionStorage.getItem("au-filter") || "aktiv", alle = await K.liste("auftraege", { sortiere: "created_at.desc" }), km = await K.kundenMap();
    var g = { aktiv: ["geplant", "in_arbeit", "pausiert"], abgeschlossen: ["abgeschlossen"], storniert: ["storniert"] }, l = alle.filter(function (a) { return g[filt].indexOf(a.status) > -1; });
    return K.kopf("Aufträge", "Alles zu einem Auftrag an einer Stelle: Termine, Aufgaben, Berichte, Rechnungen.", K.darf("angebote") ? '<a class="btn btn-signal" href="#/auftraege/neu">Neuer Auftrag</a>' : "") +
      '<div class="tabs">' + Object.keys(g).map(function (x) { return '<button data-a="filter" data-k="au-filter" data-v="' + x + '" aria-pressed="' + (x === filt) + '">' + { aktiv: "Aktiv", abgeschlossen: "Abgeschlossen", storniert: "Storniert" }[x] + " " + alle.filter(function (a) { return g[x].indexOf(a.status) > -1; }).length + "</button>"; }).join("") + "</div>" +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Nr.</th><th>Titel</th><th>Kunde</th><th>Status</th><th>Start</th><th class="r">Wert netto</th></tr></thead><tbody>' + l.map(function (a) { return '<tr data-link="#/auftraege/' + a.id + '"><td><a href="#/auftraege/' + a.id + '">' + h(a.nr) + "</a></td><td>" + h(a.titel) + "</td><td>" + h(km[a.kunde_id] ? km[a.kunde_id].name : "–") + "</td><td>" + K.status(a.status, K.ST.auftrag) + "</td><td>" + U.datum(a.start) + '</td><td class="r">' + (K.darf("angebote") ? U.eur(a.wert_netto) : "") + "</td></tr>"; }).join("") + "</tbody></table></div>" : K.leer("Keine Aufträge in dieser Ansicht."));
  };
  K.formular.auftragNeu = async function (d) {
    var kid = await K.kundeAnlegenAus(d);
    var au = await K.neu("auftraege", { nr: await K.nr("AU"), kunde_id: kid, titel: d.titel.trim(), wert_netto: U.zahl(d.wert_netto), start: d.start || null, verantwortlich: K.ctx.user.id });
    await K.verlauf("auftrag", au.id, "Auftrag angelegt"); K.go("auftraege/" + au.id);
  };

  K.kalk = function (au, berichte, material) {
    var k = au.kalk || {}, b = K.ctx.betrieb;
    var soll = { std: k.std != null ? +k.std : null, satz: k.satz != null ? +k.satz : 42, mat: k.mat != null ? +k.mat : null, fremd: +(k.fremd || 0), fahrt: +(k.fahrt || 0) };
    var istStd = berichte.reduce(function (s, x) { return s + (+x.stunden); }, 0);
    var istMat = berichte.reduce(function (s, x) { return s + (+x.material_euro); }, 0) + material.filter(function (m) { return m.status === "bestellt" || m.status === "geliefert"; }).reduce(function (s, m) { return s + (+m.preis || 0) * (+m.menge); }, 0);
    var nachtrag = berichte.filter(function (x) { return x.zusatzleistung; }).reduce(function (s, x) { return s + (+x.stunden) * (+b.stundensatz) + (+x.material_euro); }, 0);
    var erloes = +au.wert_netto + nachtrag;
    var kSoll = soll.std == null || soll.mat == null ? null : soll.std * soll.satz + soll.mat + soll.fremd + soll.fahrt;
    var kIst = istStd * soll.satz + istMat + (+(k.fremd_ist || 0)) + (+(k.fahrt_ist || 0));
    return { soll: soll, istStd: istStd, istMat: istMat, nachtrag: nachtrag, erloes: erloes, dbSoll: kSoll == null ? null : +au.wert_netto - kSoll, dbIst: erloes - kIst, k: k };
  };
  async function auftragDetail(id, tab) {
    var au = await DB.eins("auftraege", id); if (!au) return K.leer("Auftrag nicht gefunden.");
    var fin = K.darf("rechnungen");
    var r = await Promise.all([au.kunde_id ? DB.eins("kunden", au.kunde_id) : null, K.liste("termine", { wo: { auftrag_id: id }, sortiere: "beginn.asc" }), K.liste("aufgaben", { wo: { auftrag_id: id }, sortiere: "created_at.asc" }), K.liste("berichte", { wo: { auftrag_id: id }, sortiere: "datum.desc" }), K.liste("material", { wo: { auftrag_id: id }, sortiere: "created_at.desc" }), fin ? K.liste("rechnungen", { wo: { auftrag_id: id }, sortiere: "datum.asc" }) : []]);
    var k = r[0], ter = r[1], auf = r[2], ber = r[3], mat = r[4], re = r[5];
    var tabs = [["ueberblick", "Überblick"], ["termine", "Termine " + ter.length], ["aufgaben", "Aufgaben " + auf.filter(function (a) { return !a.erledigt; }).length], ["berichte", "Berichte " + ber.length], ["material", "Material " + mat.length]].concat(fin ? [["rechnungen", "Rechnungen " + re.length], ["rentabilitaet", "Rentabilität"]] : []);
    var inhalt = "";
    if (tab === "ueberblick") inhalt = '<div class="raster-2"><section class="karte"><h2>Auftrag</h2><form data-f="auftrag" data-id="' + id + '" class="formular"><div class="raster">' + U.feld("titel", "Titel", au.titel, { pflicht: true }) +
        U.feld("status", "Status", au.status, { optionen: Object.keys(K.ST.auftrag).map(function (s) { return [s, K.ST.auftrag[s][0]]; }) }) + U.feld("start", "Start", au.start, { typ: "date" }) + U.feld("ende", "Ende", au.ende, { typ: "date" }) +
        U.feld("ort", "Ort der Arbeiten", au.ort || (k ? [k.strasse, k.plz, k.ort].filter(Boolean).join(" ") : "")) + U.feld("verantwortlich", "Verantwortlich", au.verantwortlich, { optionen: [["", "–"]].concat(K.ctx.team.map(function (m) { return [m.user_id, m.name]; })) }) +
        (K.darf("angebote") ? U.feld("wert_netto", "Auftragswert netto (€)", U.zahlText(au.wert_netto, 2), { typ: "number" }) : "") + '</div><div class="knoepfe"><button class="btn btn-signal">Speichern</button></div></form></section>' +
      '<section class="karte"><h2>Kunde</h2>' + (k ? '<p><a href="#/kunden/' + k.id + '"><b>' + h(k.name) + "</b></a><br>" + h([k.strasse, [k.plz, k.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")) + "</p><p>" + (k.telefon ? '<a class="btn btn-outline klein" href="tel:' + h(k.telefon) + '">Anrufen</a> ' : "") + (au.ort || k.ort ? '<a class="btn btn-outline klein" target="_blank" rel="noopener" href="https://www.openstreetmap.org/search?query=' + encodeURIComponent(au.ort || [k.strasse, k.plz, k.ort].join(" ")) + '">Karte</a>' : "") + "</p>" : "<p>–</p>") +
        '<h3>Kundenportal</h3><p class="still">Über diesen Link sieht der Kunde Termine, unterschriebene Berichte und Rechnungen zu diesem Auftrag – ohne Anmeldung.</p><button class="btn btn-outline klein" data-a="auftragLink" data-id="' + id + '">Link kopieren</button> <button class="btn btn-ghost klein" data-a="portalSperren" data-t="auftraege" data-id="' + id + '">' + (au.portal_aktiv === false ? "Link freigeben" : "Link sperren") + '</button><h3>Protokolle</h3><p class="still">Prüf-, Wartungs- oder Abnahmeprotokoll zu diesem Auftrag.</p><a class="btn btn-outline klein" href="#/protokolle/neu/' + id + '">Protokoll anlegen</a></section></div>' + (await K.verlaufHtml("auftrag", id));
    if (tab === "termine") inhalt = '<section class="karte"><div class="kopf-zeile"><h2>Termine</h2><button class="btn btn-signal klein" data-a="terminNeu" data-auftrag="' + id + '">Termin</button></div>' + (ter.length ? '<ul class="liste">' + ter.map(function (t) { return '<li><a href="#/kalender/' + t.id + '">' + h(U.datumZeit(t.beginn)) + " · " + h(t.titel) + "</a> <small>" + h((t.mitarbeiter || []).map(K.mitgliedName).join(", ")) + "</small></li>"; }).join("") + "</ul>" : '<p class="still">Noch keine Termine.</p>') + "</section>";
    if (tab === "aufgaben") inhalt = '<section class="karte"><h2>Aufgaben</h2><form class="zeile-form" data-f="aufgabe" data-auftrag="' + id + '"><input name="titel" placeholder="Neue Aufgabe …" required><input name="faellig" type="date"><select name="wer"><option value="">alle</option>' + K.ctx.team.map(function (m) { return '<option value="' + m.user_id + '">' + h(m.name) + "</option>"; }).join("") + '</select><button class="btn btn-outline klein">Hinzufügen</button></form>' +
      (auf.length ? '<ul class="liste">' + auf.map(function (a) { return '<li class="' + (a.erledigt ? "erledigt" : "") + '"><label class="chk"><input type="checkbox" data-a-change="aufgabeHaken" data-id="' + a.id + '"' + (a.erledigt ? " checked" : "") + "> " + h(a.titel) + "</label> <small>" + (a.faellig ? "bis " + U.datum(a.faellig) + " · " : "") + h(K.mitgliedName(a.zugewiesen_an) || "") + "</small></li>"; }).join("") + "</ul>" : '<p class="still">Keine Aufgaben.</p>') + "</section>";
    if (tab === "berichte") inhalt = '<section class="karte"><div class="kopf-zeile"><h2>Regieberichte</h2><a class="btn btn-signal klein" href="#/berichte/neu/' + id + '">Neuer Bericht</a></div>' + (ber.length ? '<ul class="liste">' + ber.map(function (b) { return '<li><a href="#/berichte/' + b.id + '">' + h(b.nr) + " · " + U.datum(b.datum) + " · " + U.zahlText(b.stunden) + " Std. · " + h(b.taetigkeit) + "</a> " + K.status(b.status, K.ST.bericht) + (b.zusatzleistung ? ' <span class="pill warn">Zusatz</span>' : "") + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch keine Berichte.</p>') + "</section>";
    if (tab === "material") inhalt = '<section class="karte"><div class="kopf-zeile"><h2>Material</h2><a class="btn btn-signal klein" href="#/material/neu/' + id + '">Material anfordern</a></div>' + (mat.length ? '<ul class="liste">' + mat.map(function (m) { return "<li>" + U.zahlText(m.menge) + " " + h(m.einheit) + " " + h(m.artikel) + (m.preis ? " · " + U.eur(m.preis * m.menge) : "") + " " + K.status(m.status, K.MATST) + "</li>"; }).join("") + "</ul>" : '<p class="still">Kein Material erfasst.</p>') + "</section>";
    if (tab === "rechnungen") { var bez = re.filter(function (x) { return x.status !== "storniert" && x.status !== "entwurf"; }).reduce(function (s, x) { return s + (+x.netto); }, 0);
      inhalt = '<section class="karte"><div class="kopf-zeile"><h2>Rechnungen</h2><span><button class="btn btn-outline klein" data-a="rechnungAusAuftrag" data-id="' + id + '" data-art="abschlag">Abschlagsrechnung</button> <button class="btn btn-signal klein" data-a="rechnungAusAuftrag" data-id="' + id + '" data-art="schluss">Schlussrechnung</button></span></div><p>Auftragswert ' + U.eur(au.wert_netto) + " netto · abgerechnet " + U.eur(bez) + " netto</p>" + (re.length ? '<ul class="liste">' + re.map(function (x) { return '<li><a href="#/rechnungen/' + x.id + '">' + h(x.nr) + " · " + h({ rechnung: "Rechnung", abschlag: "Abschlag", schluss: "Schlussrechnung", gutschrift: "Gutschrift" }[x.art]) + " · " + U.eur(x.brutto) + "</a> " + K.status(x.status, K.ST.rechnung) + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch keine Rechnung.</p>') + "</section>"; }
    if (tab === "rentabilitaet") {
      var c = K.kalk(au, ber, mat), s = c.soll, feld = function (n, w) { return '<input name="' + n + '" inputmode="decimal" value="' + (w == null ? "" : U.zahlText(w, 2)) + '">'; };
      var abw = s.std != null && c.istStd > s.std ? '<div class="warn-box"><b>' + U.zahlText(c.istStd - s.std) + " Std. mehr als geplant</b> – Mehrkosten ca. " + U.eur((c.istStd - s.std) * s.satz) + (c.nachtrag ? ". Davon als Zusatzleistung erfasst: " + U.eur(c.nachtrag) + "." : ". Keine Zusatzleistung erfasst – Nachtrag prüfen.") + "</div>" : "";
      inhalt = '<section class="karte"><h2>Rentabilität</h2><form data-f="kalk" data-id="' + id + '"><div class="tabelle"><table><thead><tr><th></th><th>geplant</th><th>tatsächlich</th></tr></thead><tbody>' +
        "<tr><th>Arbeitsstunden</th><td>" + feld("std", s.std) + "</td><td>" + U.zahlText(c.istStd) + " Std. <small>aus Regieberichten</small></td></tr>" +
        "<tr><th>Kosten je Stunde (intern)</th><td>" + feld("satz", s.satz) + "</td><td>wie geplant</td></tr>" +
        "<tr><th>Material</th><td>" + feld("mat", s.mat) + "</td><td>" + U.eur(c.istMat) + " <small>Berichte + bestelltes Material</small></td></tr>" +
        "<tr><th>Fremdleistungen</th><td>" + feld("fremd", s.fremd) + "</td><td>" + feld("fremd_ist", c.k.fremd_ist) + "</td></tr>" +
        "<tr><th>Fahrtkosten</th><td>" + feld("fahrt", s.fahrt) + "</td><td>" + feld("fahrt_ist", c.k.fahrt_ist) + "</td></tr>" +
        "<tr><th>Erlös</th><td>" + U.eur(au.wert_netto) + "</td><td>" + U.eur(c.erloes) + (c.nachtrag ? " <small>inkl. Zusatzleistungen " + U.eur(c.nachtrag) + "</small>" : "") + "</td></tr>" +
        '<tr class="summe"><th>Deckungsbeitrag</th><td>' + (c.dbSoll == null ? '<span class="still">Stunden und Material planen</span>' : U.eur(c.dbSoll)) + "</td><td>" + U.eur(c.dbIst) + "</td></tr></tbody></table></div>" + abw +
        '<p class="still">Deckungsbeitrag = Erlös − Stunden × interne Kosten je Stunde − Material − Fremdleistungen − Fahrt. Diese Zahlen sieht der Kunde nie.</p><div class="knoepfe"><button class="btn btn-signal">Planwerte speichern</button></div></form></section>';
    }
    return K.kopf(au.nr + " · " + au.titel, (k ? k.name + " · " : "") + K.ST.auftrag[au.status][0], '<a class="btn btn-outline" href="#/auftraege">Zurück</a>') +
      '<div class="tabs">' + tabs.map(function (t) { return '<a href="#/auftraege/' + id + "/" + t[0] + '" aria-pressed="' + (t[0] === tab) + '">' + h(t[1]) + "</a>"; }).join("") + "</div>" + inhalt;
  }
  K.formular.auftrag = async function (d, f) {
    var alt = await DB.eins("auftraege", f.dataset.id), patch = { titel: d.titel.trim(), status: d.status, start: d.start || null, ende: d.ende || null, ort: d.ort || null, verantwortlich: d.verantwortlich || null };
    if (d.wert_netto != null) patch.wert_netto = U.zahl(d.wert_netto);
    await DB.aendern("auftraege", f.dataset.id, patch);
    if (alt.status !== d.status) await K.verlauf("auftrag", f.dataset.id, "Status: " + K.ST.auftrag[d.status][0]);
    U.toast("Gespeichert."); K.neuLaden();
  };
  K.formular.kalk = async function (d, f) {
    var k = {}; Object.keys(d).forEach(function (x) { if (String(d[x]).trim() !== "") k[x] = U.zahl(d[x]); });
    await DB.aendern("auftraege", f.dataset.id, { kalk: k }); U.toast("Planwerte gespeichert."); K.neuLaden();
  };
  K.formular.aufgabe = async function (d, f) { await K.neu("aufgaben", { auftrag_id: f.dataset.auftrag, titel: d.titel.trim(), faellig: d.faellig || null, zugewiesen_an: d.wer || null }); K.neuLaden(); };
  K.aktion.aufgabeHaken = async function (el) { await DB.aendern("aufgaben", el.dataset.id, { erledigt: el.checked, erledigt_at: el.checked ? new Date().toISOString() : null }); K.neuLaden(); };
  K.aktion.auftragLink = async function (el) { var a = await DB.eins("auftraege", el.dataset.id); U.kopieren(K.portalLink("auftrag", a.portal_token)); };
  K.MATST = { warenkorb: ["Warenkorb", ""], freigabe: ["Zur Freigabe", "warn"], bestellt: ["Bestellt", "info"], geliefert: ["Geliefert", "ok"] };
})();
