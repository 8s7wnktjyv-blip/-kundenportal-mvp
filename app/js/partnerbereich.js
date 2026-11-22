/* Kundario – Partnerbereich (Bauplan Schritt 7)
   Betreiber (#/betreiber): Partner anlegen, Meldungen prüfen, Verträge pflegen, Provisionen (Regeln in provision.js).
   Partner (#/partner): eigener Link, Betrieb melden, Übersicht mit Status und Provision – keine Kundendaten. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, h = U.h, P = window.KProvision;
  var $ = function (s) { return document.querySelector(s); };
  var ART = { vertrieb: "Vertriebspartner", tippgeber: "Tippgeber", influencer: "Influencer" };
  var MST = { offen: ["in Prüfung", "warn"], angenommen: ["angenommen", "ok"], abgelehnt: ["abgelehnt", "aus"] };
  var PST = { offen: ["noch nicht fällig", "warn"], faellig: ["fällig", "ok"], entfallen: ["entfallen", "aus"], bezahlt: ["ausgezahlt", "ok"] };
  var pill = function (x) { return '<span class="pill ' + x[1] + '">' + h(x[0]) + "</span>"; };
  var heute = function () { return U.isoTag(); };
  K.partnerLink = function (code) { return location.origin + location.pathname.replace(/app\/[^/]*$/, "") + "betriebe.html?p=" + encodeURIComponent(code); };
  var codeVorschlag = function (name) { var c = String(name || "").toUpperCase().replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/[^A-Z]/g, "").slice(0, 6) || "PARTNER"; return c + (Math.floor(Math.random() * 90) + 10); };

  // Eigener Rahmen (ohne Betriebsmenü)
  function rahmen(titel, unter, inhalt) {
    document.body.className = "app-body sonder-body";
    $("#app").innerHTML = '<header class="leiste"><span class="logo"><span class="logo-k">k.</span><span><b>Kundario</b><small>' + h(unter) + "</small></span></span>" + (DB.modus === "lokal" ? '<span class="pill warn">Testmodus</span>' : "") +
      '<div class="leiste-rechts"><button class="btn btn-outline klein" data-sonder-ab>Abmelden</button></div></header><main id="inhalt" class="inhalt sonder-inhalt" tabindex="-1">' + inhalt + "</main>";
  }
  document.addEventListener("click", async function (e) { if (e.target.closest("[data-sonder-ab]")) { await DB.auth.abmelden(); location.hash = ""; location.reload(); } });

  /* ---------- Einstieg ---------- */
  K.sonderStart = async function (ohneBetrieb) {
    var hs = location.hash, istB = await DB.rpc("ist_betreiber").catch(function () { return false; });
    if (istB && (hs.indexOf("#/betreiber") === 0 || ohneBetrieb)) { await betreiber(hs.split("/")[2] || "partner"); return true; }
    var pa = await DB.rpc("ich_partner").catch(function () { return null; });
    if (pa && (hs.indexOf("#/partner") === 0 || ohneBetrieb)) { await partnerSeite(pa); return true; }
    return false;
  };
  // Link im Betriebsmenü für den Betreiber
  setTimeout(async function warten() {
    var el = document.getElementById("nav-sonder"); if (!el) return setTimeout(warten, 500);
    if (await DB.rpc("ist_betreiber").catch(function () { return false; })) el.innerHTML = '<a href="#/betreiber">Kundario-Betreiber</a> · ';
  }, 800);

  /* ---------- Betreiber ---------- */
  async function daten() {
    var pa = await DB.liste("partner", { sortiere: "name.asc" }), me = await DB.liste("partner_meldungen", { sortiere: "am.desc" }), ve = await DB.liste("vertraege"), be = await DB.rpc("betreiber_betriebe");
    var pm = {}; pa.forEach(function (x) { pm[x.id] = x; }); var bm = {}; be.forEach(function (x) { bm[x.id] = x; });
    return { pa: pa, me: me, ve: ve, be: be, pm: pm, bm: bm };
  }
  // Provision je Vertrag: Zuordnung aus angenommenen Meldungen zu diesem Betrieb
  K.provisionen = function (d, stichtag) {
    return d.ve.map(function (v) {
      var ms = d.me.filter(function (m) { return m.betrieb_id === v.betrieb_id && m.status === "angenommen"; }).map(function (m) { return { partner: m.partner_id, am: m.am, quelle: m.quelle }; });
      var z = P.zuordnung(ms, v.beginn, v.in_bearbeitung_seit); if (!z) return null;
      var r = P.provision(v, stichtag || heute()); if (v.provision_bezahlt_am && r.status === "faellig") r = Object.assign({}, r, { status: "bezahlt", bezahlt_am: v.provision_bezahlt_am });
      return { vertrag: v, partner: d.pm[z.partner], betrieb: d.bm[v.betrieb_id] || { name: "?" }, r: r };
    }).filter(Boolean);
  }
  async function betreiber(reiter) {
    var d = await daten(), tab = function (k, t, n) { return '<a href="#/betreiber/' + k + '" aria-pressed="' + (k === reiter) + '">' + t + (n ? " (" + n + ")" : "") + "</a>"; };
    var pv = K.provisionen(d), faellig = pv.filter(function (x) { return x.r.status === "faellig"; }), offenM = d.me.filter(function (m) { return m.status === "offen"; });
    var inhalt = K.kopf("Partnerbereich", "Vertriebspartner, Meldungen, Verträge und Provisionen – nur für Sie als Betreiber sichtbar.") +
      '<div class="kpis"><div class="kpi k-blau"><span>Partner</span><b>' + d.pa.filter(function (x) { return x.aktiv; }).length + '</b></div><div class="kpi k-orange"><span>Meldungen in Prüfung</span><b>' + offenM.length + '</b></div><div class="kpi k-gruen"><span>Verträge</span><b>' + d.ve.length + '</b></div><div class="kpi k-rot"><span>Provision fällig</span><b>' + U.eur(faellig.reduce(function (s, x) { return s + x.r.betrag; }, 0)) + "</b></div></div>" +
      '<nav class="tabs">' + tab("partner", "Partner") + tab("meldungen", "Meldungen", offenM.length) + tab("vertraege", "Verträge") + tab("provisionen", "Provisionen", faellig.length) + "</nav>";
    if (reiter === "meldungen") inhalt += d.me.length ? '<div class="tabelle"><table><thead><tr><th>Gemeldet</th><th>Partner</th><th>Betrieb</th><th>Quelle</th><th>Status</th><th></th></tr></thead><tbody>' + d.me.map(function (m) {
      var dop = d.me.filter(function (x) { return x.id !== m.id && (m.betrieb_id ? x.betrieb_id === m.betrieb_id : x.betrieb_name.toLowerCase() === m.betrieb_name.toLowerCase()); }).length;
      return "<tr><td>" + U.datum(m.am) + "</td><td>" + h((d.pm[m.partner_id] || {}).name || "") + "</td><td><b>" + h(m.betrieb_name) + "</b>" + (m.ort ? "<br><small>" + h(m.ort) + "</small>" : "") + (m.notiz ? "<br><small>" + h(m.notiz) + "</small>" : "") + (dop ? '<br><span class="pill warn">auch von anderem Partner gemeldet – früheste gilt</span>' : "") + "</td><td>" + (m.quelle === "link" ? "Link (Registrierung)" : "Meldung") + "</td><td>" + pill(MST[m.status]) + (m.grund ? "<br><small>" + h(m.grund) + "</small>" : "") + "</td>" +
        '<td class="r">' + (m.status === "offen" ? '<button class="btn btn-signal klein" data-a="meldungAnnehmen" data-id="' + m.id + '">Annehmen</button> <button class="btn btn-outline klein" data-a="meldungAblehnen" data-id="' + m.id + '">Ablehnen</button>' : "") + "</td></tr>";
    }).join("") + "</tbody></table></div>" : K.leer("Noch keine Meldungen.");
    else if (reiter === "vertraege") inhalt += '<div class="tabelle"><table><thead><tr><th>Betrieb</th><th>Partner-Code</th><th>Vertrag</th><th>Bezahlte Monate</th><th></th></tr></thead><tbody>' + d.be.filter(function (b) { return b.gewerk !== "Hausverwaltung" || d.ve.some(function (v) { return v.betrieb_id === b.id; }); }).map(function (b) {
      var v = d.ve.filter(function (x) { return x.betrieb_id === b.id; })[0];
      return "<tr><td><b>" + h(b.name) + "</b><br><small>" + h([b.gewerk, b.ort].filter(Boolean).join(" · ")) + "</small></td><td>" + h(b.partner_code || "–") + "</td><td>" + (v ? h(v.tarif) + " seit " + U.datum(v.beginn) + "<br><small>" + U.eur(+v.monatsbeitrag) + "/Monat · Einrichtung " + U.eur(+v.einrichtung) + (v.gekuendigt_am ? " · gekündigt zum " + U.datum(v.gekuendigt_am) : "") + "</small>" : '<span class="still">kein Vertrag</span>') + "</td><td>" + (v ? (v.bezahlt || []).length : "") + '</td><td class="r"><button class="btn btn-outline klein" data-a="vertragBearb" data-betrieb="' + b.id + '">' + (v ? "Bearbeiten" : "Vertrag anlegen") + "</button></td></tr>";
    }).join("") + "</tbody></table></div>";
    else if (reiter === "provisionen") inhalt += (pv.length ? '<div class="tabelle"><table><thead><tr><th>Partner</th><th>Betrieb</th><th class="r">Provision</th><th>Status</th><th></th></tr></thead><tbody>' + pv.map(function (x) {
      return "<tr><td>" + h(x.partner ? x.partner.name : "?") + "</td><td>" + h(x.betrieb.name) + '</td><td class="r">' + U.eur(x.r.betrag) + "</td><td>" + pill(PST[x.r.status]) + "<br><small>" + h(x.r.status === "faellig" ? "zahlen bis " + U.datum(x.r.zahlen_bis) : x.r.status === "bezahlt" ? "am " + U.datum(x.r.bezahlt_am) : x.r.grund || "") + "</small></td>" +
        '<td class="r">' + (x.r.status === "faellig" ? '<button class="btn btn-signal klein" data-a="provisionBezahlt" data-id="' + x.vertrag.id + '">Ausgezahlt</button>' : "") + "</td></tr>";
    }).join("") + "</tbody></table></div>" : K.leer("Noch keine Provisionen – zuerst Meldungen annehmen und Verträge anlegen.")) + (faellig.length ? '<div class="knoepfe links"><button class="btn btn-outline" data-a="provisionCsv">Fällige Provisionen als CSV</button></div>' : "") +
      '<p class="still klein-text">Regeln laut Partnervereinbarung: halbe Einrichtungsgebühr + erster Monatsbeitrag (netto); fällig, wenn der Betrieb 2 Monate Kunde ist und beide Monatsrechnungen bezahlt hat; Auszahlung bis zum 15. des Folgemonats. Zuordnung 6 Monate ab Meldung, früheste gültige Meldung gewinnt, nicht wenn Kundario den Betrieb schon in Bearbeitung hatte.</p>';
    else inhalt += '<div class="knoepfe links"><button class="btn btn-signal" data-a="partnerNeu">Neuer Partner</button></div>' + (d.pa.length ? '<div class="tabelle"><table><thead><tr><th>Partner</th><th>Art</th><th>Code / Link</th><th>Zugang</th><th></th></tr></thead><tbody>' + d.pa.map(function (x) {
      return "<tr><td><b>" + h(x.name) + "</b><br><small>" + h(x.email) + "</small></td><td>" + h(ART[x.art] || x.art) + "</td><td><code>" + h(x.code) + '</code><br><small class="link-klein">' + h(K.partnerLink(x.code)) + "</small></td><td>" + (x.aktiv ? (x.user_id ? pill(["angemeldet", "ok"]) : pill(["noch nicht angemeldet", "warn"])) : pill(["deaktiviert", "aus"])) + "</td>" +
        '<td class="r"><button class="btn btn-outline klein" data-a="partnerLinkKopieren" data-code="' + h(x.code) + '">Link kopieren</button> <button class="btn btn-outline klein" data-a="partnerAktiv" data-id="' + x.id + '">' + (x.aktiv ? "Deaktivieren" : "Aktivieren") + "</button></td></tr>";
    }).join("") + "</tbody></table></div>" : K.leer("Noch keine Partner.")) + '<p class="still klein-text">Der Partner meldet sich mit der hier eingetragenen E-Mail-Adresse in der App an und sieht dann nur seinen Bereich.</p>';
    rahmen("Partnerbereich", "Betreiber", inhalt + '<p class="still klein-text"><a href="#/uebersicht" data-zurueck-app>Zurück zur App</a></p>');
  }
  var neuZeigen = function () { var r = (location.hash.split("/")[2]) || "partner"; return betreiber(r); };
  window.addEventListener("hashchange", function () { if (document.body.classList.contains("sonder-body")) { if (/^#\/betreiber/.test(location.hash)) neuZeigen(); else location.reload(); } });

  K.aktion.partnerNeu = async function () {
    var r = await U.dialog("Neuer Partner", '<div class="raster">' + U.feld("name", "Name", "", { pflicht: true }) + U.feld("email", "E-Mail (für die Anmeldung)", "", { typ: "email", pflicht: true }) + U.feld("art", "Art", "vertrieb", { optionen: [["vertrieb", "Vertriebspartner"], ["tippgeber", "Tippgeber"], ["influencer", "Influencer"]] }) +
      U.feld("code", "Code (Buchstaben/Ziffern)", "", { ph: "wird vorgeschlagen", max: 12 }) + "</div>");
    if (!r) return; var d = r.daten, code = (d.code || codeVorschlag(d.name)).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[A-Z0-9]{4,12}$/.test(code)) throw new Error("Code: 4–12 Buchstaben oder Ziffern.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) throw new Error("Bitte eine gültige E-Mail-Adresse.");
    if ((await DB.liste("partner", { wo: { code: code } })).length) throw new Error("Diesen Code gibt es schon.");
    await DB.neu("partner", { name: d.name.trim(), email: d.email.trim(), art: d.art, code: code }); U.toast("Partner angelegt – Link: " + K.partnerLink(code)); neuZeigen();
  };
  K.aktion.partnerLinkKopieren = function (el) { U.kopieren(K.partnerLink(el.dataset.code)); };
  K.aktion.partnerAktiv = async function (el) { var x = await DB.eins("partner", el.dataset.id); await DB.aendern("partner", x.id, { aktiv: !x.aktiv }); neuZeigen(); };
  K.aktion.meldungAnnehmen = async function (el) {
    var m = await DB.eins("partner_meldungen", el.dataset.id), be = await DB.rpc("betreiber_betriebe");
    var r = await U.dialog("Meldung annehmen: " + m.betrieb_name, U.feld("betrieb_id", "Zu welchem Betrieb in Kundario gehört die Meldung?", m.betrieb_id || "", { optionen: [["", "noch kein Konto (später zuordnen)"]].concat(be.map(function (b) { return [b.id, b.name + (b.ort ? " · " + b.ort : "")]; })) }) +
      "<p class=\"still\">Annehmen heißt: Kundario hatte den Betrieb nicht schon in Bearbeitung. Gibt es mehrere Meldungen, gilt die früheste.</p>");
    if (!r) return; await DB.aendern("partner_meldungen", m.id, { status: "angenommen", betrieb_id: r.daten.betrieb_id || m.betrieb_id || null }); U.toast("Meldung angenommen."); neuZeigen();
  };
  K.aktion.meldungAblehnen = async function (el) {
    var r = await U.dialog("Meldung ablehnen", U.feld("grund", "Grund (sieht der Partner)", "", { pflicht: true, ph: "z. B. Betrieb war schon in Bearbeitung" })); if (!r) return;
    await DB.aendern("partner_meldungen", el.dataset.id, { status: "abgelehnt", grund: r.daten.grund.trim() }); neuZeigen();
  };
  K.aktion.vertragBearb = async function (el) {
    var v = (await DB.liste("vertraege", { wo: { betrieb_id: el.dataset.betrieb } }))[0] || { tarif: "Grundpreis", einrichtung: 750, monatsbeitrag: 249, beginn: heute(), bezahlt: [] };
    var r = await U.dialog(v.id ? "Vertrag bearbeiten" : "Vertrag anlegen", '<div class="raster">' + U.feld("tarif", "Tarif", v.tarif, { pflicht: true }) + U.feld("beginn", "Beginn", v.beginn, { typ: "date", pflicht: true }) + U.feld("einrichtung", "Einrichtung netto (€)", U.zahlText(+v.einrichtung, 2), { typ: "number" }) + U.feld("monatsbeitrag", "Monatsbeitrag netto (€)", U.zahlText(+v.monatsbeitrag, 2), { typ: "number", hilfe: "inkl. gebuchter Zusatznutzer" }) +
      U.feld("bezahlt", "Bezahlte Monatsrechnungen (Zahltage, je Zeile ein Datum TT.MM.JJJJ)", (v.bezahlt || []).map(function (x) { return U.datum(x); }).join("\n"), { typ: "textarea", zeilen: 3 }) + U.feld("gekuendigt_am", "Gekündigt zum (leer = läuft)", v.gekuendigt_am || "", { typ: "date" }) +
      U.feld("in_bearbeitung_seit", "Von Kundario selbst in Bearbeitung seit (optional)", v.in_bearbeitung_seit || "", { typ: "date", hilfe: "Liegt dieses Datum vor der Meldung eines Partners, bekommt er keine Provision." }) + U.feld("notiz", "Notiz", v.notiz || "", { typ: "textarea", breit: true }) + "</div>");
    if (!r) return; var d = r.daten;
    var bez = String(d.bezahlt || "").split(/[\n,;]+/).map(function (x) { x = x.trim(); var m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(x); return m ? m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2) : /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : x ? "!" : ""; }).filter(Boolean);
    if (bez.indexOf("!") > -1) throw new Error("Bezahlte Monate bitte als Datum TT.MM.JJJJ, je Zeile eines.");
    var obj = { tarif: d.tarif.trim(), beginn: d.beginn, einrichtung: U.zahl(d.einrichtung), monatsbeitrag: U.zahl(d.monatsbeitrag), bezahlt: bez.sort(), gekuendigt_am: d.gekuendigt_am || null, in_bearbeitung_seit: d.in_bearbeitung_seit || null, notiz: d.notiz || null };
    if (v.id) await DB.aendern("vertraege", v.id, obj); else await DB.neu("vertraege", Object.assign({ betrieb_id: el.dataset.betrieb }, obj)); U.toast("Vertrag gespeichert."); neuZeigen();
  };
  K.aktion.provisionBezahlt = async function (el) { if (!(await U.bestaetigen("Provision als ausgezahlt markieren?", "Ausgezahlt"))) return; await DB.aendern("vertraege", el.dataset.id, { provision_bezahlt_am: heute() }); neuZeigen(); };
  K.aktion.provisionCsv = async function () {
    var d = await daten(), l = K.provisionen(d).filter(function (x) { return x.r.status === "faellig"; });
    var csv = "Partner;E-Mail;Betrieb;Provision netto;fällig seit;zahlen bis\n" + l.map(function (x) { return [x.partner.name, x.partner.email, x.betrieb.name, String(x.r.betrag.toFixed(2)).replace(".", ","), U.datum(x.r.faellig_seit), U.datum(x.r.zahlen_bis)].map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = "Provisionen_" + heute() + ".csv"; document.body.appendChild(a); a.click(); a.remove();
  };

  /* ---------- Partner ---------- */
  async function partnerSeite(pa) {
    var l = await DB.rpc("partner_uebersicht"), link = K.partnerLink(pa.code);
    var zeile = function (m) {
      var pr = m.vertrag ? P.provision(m.vertrag, heute()) : null; if (pr && m.vertrag.provision_bezahlt_am && pr.status === "faellig") pr = Object.assign({}, pr, { status: "bezahlt" });
      return "<tr><td>" + U.datum(m.am) + "</td><td><b>" + h(m.betrieb_name) + "</b>" + (m.ort ? "<br><small>" + h(m.ort) + "</small>" : "") + "</td><td>" + pill(MST[m.status]) + (m.grund ? "<br><small>" + h(m.grund) + "</small>" : "") + "</td><td>" +
        (pr ? pill(PST[pr.status]) + " " + U.eur(pr.betrag || 0) + "<br><small>" + h(pr.status === "faellig" ? "Auszahlung bis " + U.datum(pr.zahlen_bis) : pr.grund || "") + "</small>" : m.status === "angenommen" ? '<span class="still">Vertrag noch nicht geschlossen</span>' : "–") + "</td></tr>";
    };
    var summe = l.reduce(function (s, m) { var pr = m.vertrag ? P.provision(m.vertrag, heute()) : null; return s + (pr && pr.status === "faellig" && !m.vertrag.provision_bezahlt_am ? pr.betrag : 0); }, 0);
    rahmen("Partner", pa.name + " · " + (ART[pa.art] || "Partner"),
      K.kopf("Ihr Partnerbereich", "Ihre Meldungen, Status und Provision. Kundendaten der Betriebe sehen Sie hier bewusst nicht.") +
      '<section class="karte"><h2>Ihr Link</h2><p>Betriebe, die sich über diesen Link registrieren (oder Ihren Code <b>' + h(pa.code) + "</b> angeben), werden Ihnen zugeordnet – 6 Monate lang.</p>" +
        '<p class="link-zeile"><input readonly value="' + h(link) + '" aria-label="Partner-Link"><button type="button" class="btn btn-outline klein" data-a="partnerLinkKopieren" data-code="' + h(pa.code) + '">Kopieren</button></p></section>' +
      '<div class="kpis"><div class="kpi k-blau"><span>Gemeldet</span><b>' + l.length + '</b></div><div class="kpi k-gruen"><span>Kunde geworden</span><b>' + l.filter(function (m) { return m.vertrag; }).length + '</b></div><div class="kpi k-orange"><span>Provision fällig</span><b>' + U.eur(summe) + "</b></div></div>" +
      '<section class="karte"><h2>Betrieb melden</h2><p class="still">Meldung in Textform mit Zeitstempel. Gilt, wenn Kundario den Betrieb nicht schon in Bearbeitung hatte.</p><form class="raster" id="partner-melden">' + U.feld("betrieb_name", "Name des Betriebs", "", { pflicht: true }) + U.feld("ort", "Ort", "") + U.feld("notiz", "Notiz (z. B. Ansprechpartner, Gespräch am …)", "", { typ: "textarea", breit: true }) +
        '<div class="knoepfe links breit"><button class="btn btn-signal">Melden</button></div></form></section>' +
      '<section class="karte"><h2>Ihre Meldungen</h2>' + (l.length ? '<div class="tabelle"><table><thead><tr><th>Gemeldet</th><th>Betrieb</th><th>Status</th><th>Provision</th></tr></thead><tbody>' + l.map(zeile).join("") + "</tbody></table></div>" : "<p>Noch keine Meldungen.</p>") + "</section>" +
      '<p class="still klein-text">Provision: halbe Einrichtungsgebühr + erster Monatsbeitrag (netto), fällig nach zwei bezahlten Monaten, Auszahlung bis zum 15. des Folgemonats. Bitte stellen Sie dann eine Rechnung (mit Umsatzsteuer, falls Sie nicht Kleinunternehmer sind).</p>');
    var f = document.getElementById("partner-melden");
    f.onsubmit = async function (e) {
      e.preventDefault(); if (!f.checkValidity()) return f.reportValidity();
      try { await DB.neu("partner_meldungen", { partner_id: pa.id, betrieb_name: f.elements.betrieb_name.value.trim(), ort: f.elements.ort.value.trim() || null, notiz: f.elements.notiz.value.trim() || null, quelle: "meldung", status: "offen" }); U.toast("Gemeldet am " + U.datumZeit(new Date()) + "."); partnerSeite(pa); } catch (x) { U.fehler(x); }
    };
  }
})();
