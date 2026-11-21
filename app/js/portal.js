/* Kundario – Kundenportal: Angebot, Auftrag oder Rechnung über einen geheimen Link, ohne Anmeldung */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, el = document.getElementById("portal");
  var p = location.hash.replace(/^#/, "").split("="), art = p[0], token = p[1];
  function fuss(b) { return '<footer class="p-fuss">' + h(b.name || "") + (b.telefon ? ' · <a href="tel:' + h(b.telefon) + '">' + h(b.telefon) + "</a>" : "") + (b.email ? ' · <a href="mailto:' + h(b.email) + '">' + h(b.email) + "</a>" : "") + '<br><small>Bereitgestellt mit Kundario · <a href="../datenschutz.html">Datenschutz</a></small></footer>'; }
  function tabelle(pos, mwst, steuerfall) {
    var s = U.summen(pos, mwst), ohne = steuerfall === "13b" || steuerfall === "kleinunternehmer";
    return '<div class="tabelle"><table class="pos"><thead><tr><th>Leistung</th><th class="r">Menge</th><th class="r">Preis</th><th class="r">Gesamt</th></tr></thead><tbody>' + pos.map(function (x) {
      if (x.typ === "titel") return '<tr class="pe-titel"><td colspan="4"><b>' + h(x.text) + "</b></td></tr>"; if (x.typ === "text") return '<tr><td colspan="4"><em>' + h(x.text) + "</em></td></tr>";
      return "<tr><td>" + h(x.text) + (x.optional ? " <em>(optional)</em>" : "") + (x.langtext ? "<br><small>" + h(x.langtext) + "</small>" : "") + '</td><td class="r">' + U.zahlText(x.menge) + " " + h(x.einheit || "") + '</td><td class="r">' + U.eur(x.preis) + '</td><td class="r">' + U.eur(U.posNetto(x)) + "</td></tr>"; }).join("") +
      '</tbody></table></div>' + (ohne ? '<div class="summen"><span class="gesamt">Gesamt (ohne Umsatzsteuer) <b>' + U.eur(s.netto) + "</b></span></div>" :
      '<div class="summen"><span>Netto <b>' + U.eur(s.netto) + "</b></span><span>USt. " + U.zahlText(mwst) + " % <b>" + U.eur(s.mwst) + '</b></span><span class="gesamt">Gesamt <b>' + U.eur(s.brutto) + "</b></span></div>");
  }
  async function angebot() {
    var d = await DB.rpc("portal_angebot", { p_token: token }); if (!d) return fehlt();
    var a = d.angebot, b = d.betrieb, abgelaufen = a.gueltig_bis && a.gueltig_bis < U.isoTag();
    el.innerHTML = '<header class="p-kopf"><span class="p-betrieb">' + h(b.name) + "</span><h1>Angebot " + h(a.nr) + "</h1><p>" + h(a.titel) + " · für " + h(d.kunde.name || "") + (a.gueltig_bis ? " · gültig bis " + U.datum(a.gueltig_bis) : "") + "</p></header>" +
      (a.einleitung ? '<p class="karte">' + h(a.einleitung) + "</p>" : "") + '<section class="karte">' + tabelle(a.positionen, a.mwst, d.betrieb && d.betrieb.kleinunternehmer ? "kleinunternehmer" : a.steuerfall) + "</section>" +
      (a.status === "angenommen" ? '<section class="karte ok-box"><h2>Vielen Dank!</h2><p>Sie haben das Angebot am ' + U.datumZeit(a.angenommen_at) + " angenommen. " + h(b.name) + " meldet sich wegen des Termins.</p></section>" :
       a.status === "abgelehnt" ? '<section class="karte"><p>Sie haben dieses Angebot abgelehnt. Bei Fragen melden Sie sich gern.</p></section>' :
       abgelaufen ? '<section class="karte"><p>Dieses Angebot ist abgelaufen. Bitte melden Sie sich bei ' + h(b.name) + ", wir schicken Ihnen gern ein aktuelles.</p></section>" :
       '<section class="karte"><h2>Angebot annehmen</h2><form id="annahme" novalidate>' + U.feld("name", "Ihr Name", d.kunde.name || "", { pflicht: true }) + '<label class="fld-label">Unterschrift</label><canvas class="sig" id="sig" aria-label="Unterschriftsfeld"></canvas><button type="button" class="btn btn-ghost klein" id="sig-neu">Neu unterschreiben</button>' +
         U.feld("agb", "Ich beauftrage die Leistungen zu den genannten Preisen.", false, { typ: "checkbox", attr: " required" }) + '<div class="knoepfe"><button class="btn btn-signal" type="submit">Verbindlich annehmen</button><button class="btn btn-ghost" type="button" id="ablehnen">Ablehnen</button></div></form></section>') + fuss(b);
    var f = document.getElementById("annahme"); if (!f) return;
    var pad = U.unterschrift(document.getElementById("sig")); document.getElementById("sig-neu").onclick = function () { pad.neu(); };
    f.onsubmit = async function (e) { e.preventDefault(); if (!f.checkValidity()) return f.reportValidity(); if (pad.leer()) return U.toast("Bitte unterschreiben Sie im Feld.", "fehler");
      try { await DB.rpc("portal_angebot_antwort", { p_token: token, p_annehmen: true, p_name: f.elements.name.value, p_unterschrift: pad.bild(), p_grund: null }); U.toast("Danke, angenommen!"); angebot(); } catch (x) { U.fehler(x); } };
    document.getElementById("ablehnen").onclick = async function () { var r = await U.dialog("Angebot ablehnen", U.feld("grund", "Möchten Sie uns den Grund nennen? (freiwillig)", "", { typ: "textarea" }), [{ wert: "", text: "Zurück" }, { wert: "ok", text: "Ablehnen", gefahr: true }]); if (!r) return;
      try { await DB.rpc("portal_angebot_antwort", { p_token: token, p_annehmen: false, p_name: null, p_unterschrift: null, p_grund: r.daten.grund || null }); angebot(); } catch (x) { U.fehler(x); } };
  }
  async function auftrag() {
    var d = await DB.rpc("portal_auftrag", { p_token: token }); if (!d) return fehlt();
    var a = d.auftrag, b = d.betrieb, ST = { geplant: "Geplant", in_arbeit: "In Arbeit", pausiert: "Pausiert", abgeschlossen: "Abgeschlossen", storniert: "Storniert" };
    el.innerHTML = '<header class="p-kopf"><span class="p-betrieb">' + h(b.name) + "</span><h1>" + h(a.titel) + "</h1><p>Auftrag " + h(a.nr) + " · " + h(ST[a.status] || a.status) + "</p></header>" +
      '<section class="karte"><h2>Termine</h2>' + (d.termine.length ? '<ul class="liste">' + d.termine.map(function (t) { return "<li><b>" + new Date(t.beginn).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }) + ", " + U.zeit(t.beginn) + " Uhr</b> · " + h(t.titel) + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch keine Termine.</p>') + "</section>" +
      '<section class="karte"><h2>Berichte</h2>' + (d.berichte.length ? '<ul class="liste">' + d.berichte.map(function (x) { return "<li>" + U.datum(x.datum) + " · " + U.zahlText(x.stunden) + " Std. · " + h(x.taetigkeit) + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch keine Berichte.</p>') + "</section>" +
      '<section class="karte"><h2>Rechnungen</h2>' + (d.rechnungen.length ? '<ul class="liste">' + d.rechnungen.map(function (r) { var t = h(r.nr) + " · " + U.eur(r.brutto) + " · " + (r.status === "bezahlt" ? "bezahlt" : "fällig " + U.datum(r.faellig)); return "<li>" + (r.token ? '<a href="#rechnung=' + h(r.token) + '">' + t + "</a>" : t) + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch keine Rechnungen.</p>') + "</section>" + fuss(b);
  }
  async function rechnung() {
    var d = await DB.rpc("portal_rechnung", { p_token: token }); if (!d) return fehlt();
    var r = d.rechnung, b = d.betrieb, offen = Math.round((+r.brutto - (+r.bezahlt)) * 100) / 100;
    el.innerHTML = '<header class="p-kopf"><span class="p-betrieb">' + h(b.name) + "</span><h1>Rechnung " + h(r.nr) + "</h1><p>vom " + U.datum(r.datum) + " · " + (offen > 0 ? "offen " + U.eur(offen) + ", fällig " + U.datum(r.faellig) : "bezahlt – vielen Dank") + "</p></header>" +
      '<section class="karte">' + tabelle(r.positionen, r.mwst, r.steuerfall) + "</section>" +
      (offen > 0 && b.iban ? '<section class="karte"><h2>Überweisung</h2><dl class="daten"><dt>Empfänger</dt><dd>' + h(b.name) + "</dd><dt>IBAN</dt><dd>" + h(b.iban) + "</dd>" + (b.bic ? "<dt>BIC</dt><dd>" + h(b.bic) + "</dd>" : "") + "<dt>Betrag</dt><dd>" + U.eur(offen) + "</dd><dt>Verwendungszweck</dt><dd>" + h(r.nr) + "</dd></dl></section>" : "") +
      '<div class="knoepfe"><button class="btn btn-outline" id="drucken">Drucken / PDF</button></div>' + fuss(b);
    document.getElementById("drucken").onclick = function () { U.drucken(U.rechnungsDoc(r, b, d.kunde, { rechnung: "Rechnung", abschlag: "Abschlagsrechnung", schluss: "Schlussrechnung", gutschrift: "Gutschrift" }[r.art]), "Rechnung " + r.nr); };
  }
  // Anfrage an einen Betrieb über seinen Anfrage-Link (auch von der eigenen Website). Vorbelegung: #anfrage=TOKEN&betreff=…&text=…&ort=…
  async function anfrage() {
    var b = await DB.rpc("portal_betrieb", { p_token: token }); if (!b) return fehlt();
    var q = {}; location.hash.split("&").slice(1).forEach(function (x) { var t = x.split("="); try { q[t[0]] = decodeURIComponent(t[1] || ""); } catch (e) { /* ungültig */ } });
    document.title = "Anfrage an " + b.name;
    el.innerHTML = '<section class="karte"><p class="p-betrieb">' + h(b.name) + (b.gewerk ? " · " + h(b.gewerk) : "") + (b.ort ? " · " + h(b.ort) : "") + "</p><h1>Ihre Anfrage</h1><p>Beschreiben Sie kurz Ihr Vorhaben. " + h(b.name) + " meldet sich bei Ihnen.</p>" +
      '<form id="anfrage" novalidate>' + U.feld("name", "Ihr Name bzw. Firma", "", { pflicht: true, max: 120 }) + U.feld("email", "E-Mail", "", { typ: "email", max: 200 }) + U.feld("telefon", "Telefon", "", { typ: "tel", max: 50, hilfe: "E-Mail oder Telefon genügt." }) +
      U.feld("ort", "Ort bzw. Adresse des Vorhabens", q.ort || "", { max: 300 }) + U.feld("betreff", "Worum geht es?", q.betreff || "", { pflicht: true, max: 200, ph: "z. B. 3 Fenster tauschen" }) + U.feld("text", "Beschreibung", q.text || "", { typ: "textarea", zeilen: 5, max: 5000 }) +
      '<p class="hp" aria-hidden="true"><label>Bitte leer lassen <input name="website" tabindex="-1" autocomplete="off"></label></p>' +
      U.feld("ok", "Ich bin einverstanden, dass " + b.name + " meine Angaben zur Bearbeitung der Anfrage speichert und mich dazu kontaktiert.", false, { typ: "checkbox", attr: " required" }) +
      '<div class="knoepfe"><button class="btn btn-signal" type="submit">Anfrage senden</button></div></form></section>' + fuss(b);
    var f = document.getElementById("anfrage");
    f.onsubmit = async function (e) {
      e.preventDefault(); if (!f.checkValidity()) return f.reportValidity();
      var v = function (n) { return f.elements[n].value.trim(); };
      if (!v("email") && !v("telefon")) return U.toast("Bitte E-Mail oder Telefon angeben.", "fehler");
      if (v("website")) { el.innerHTML = '<section class="karte"><h1>Danke!</h1></section>'; return; }   // Spam-Falle
      var btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      try { await DB.rpc("anfrage_einreichen", { p_token: token, p_name: v("name"), p_email: v("email"), p_telefon: v("telefon"), p_ort: v("ort"), p_betreff: v("betreff"), p_text: v("text"), p_art: "privat" });
        el.innerHTML = '<section class="karte ok-box"><h1>Danke, Ihre Anfrage ist angekommen.</h1><p>' + h(b.name) + " meldet sich bei Ihnen" + (b.telefon ? ". Eilig? " + h(b.telefon) : "") + ".</p></section>" + fuss(b); }
      catch (x) { btn.disabled = false; U.fehler(x); }
    };
  }
  function fehlt() { el.innerHTML = '<section class="karte"><h1>Link ungültig</h1><p>Dieser Link ist nicht (mehr) gültig. Bitte wenden Sie sich an den Betrieb, der Ihnen den Link geschickt hat.</p></section>'; }
  async function los() {
    try { art = location.hash.replace(/^#/, "").split("=")[0]; token = (location.hash.split("=")[1] || "").split("&")[0]; if (!token || token.length < 24) return fehlt();
      if (art === "angebot") await angebot(); else if (art === "auftrag") await auftrag(); else if (art === "rechnung") await rechnung(); else if (art === "anfrage") await anfrage(); else fehlt(); }
    catch (x) { el.innerHTML = '<section class="karte"><h1>Das hat nicht geklappt</h1><p>' + h(x.message) + "</p></section>"; }
  }
  window.addEventListener("hashchange", los); los();
})();
