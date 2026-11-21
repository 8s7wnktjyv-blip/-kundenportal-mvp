/* Kundario – Anfrage-Link je Betrieb
   Handwerksbetrieb: eigener Link für Website, E-Mail-Signatur, Visitenkarte → Anfragen landen unter „Anfragen“.
   Hausverwaltung: Frist → „Fachbetrieb anfragen“ schickt die Objektdaten über den Link des Betriebs. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;
  var neuerToken = function () { var a = new Uint8Array(18); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); };
  K.anfrageLink = async function () {
    var b = K.ctx.betrieb;
    if (!b.anfrage_token && K.ctx.ich.rolle === "gf") K.ctx.betrieb = b = await DB.aendern("betriebe", b.id, { anfrage_token: neuerToken() });
    return b.anfrage_token ? K.portalLink("anfrage", b.anfrage_token) : "";
  };
  // Token aus einem eingefügten Link oder direkt
  K.tokenAusLink = function (t) { t = String(t || "").trim(); var m = /anfrage=([0-9a-f]{24,})/i.exec(t); if (m) return m[1]; return /^[0-9a-f]{24,}$/i.test(t) ? t : ""; };

  /* ---------- Einstellungen: Link anzeigen ---------- */
  var altEinst = V.einstellungen, altEinstDanach = altEinst.danach;
  V.einstellungen.danach = async function (id, extra) {
    if (altEinstDanach) altEinstDanach(id, extra);
    if (K.istVerwaltung() || K.ctx.ich.rolle !== "gf") return;
    var link = await K.anfrageLink(); if (!link || document.getElementById("anfrage-link")) return;
    var ziel = document.querySelector("#inhalt .seite-kopf"); if (!ziel) return;
    ziel.insertAdjacentHTML("afterend", '<section class="karte" id="anfrage-link"><h2>Ihr Anfrage-Link</h2><p>Für Ihre Website, die E-Mail-Signatur oder einen QR-Code auf der Visitenkarte. Wer ihn öffnet, schickt Ihnen eine Anfrage; sie landet unter <a href="#/anfragen">Anfragen</a>. Hausverwaltungen mit Kundario beauftragen Sie darüber mit allen Objektdaten.</p>' +
      '<p class="link-zeile"><input readonly value="' + h(link) + '" aria-label="Anfrage-Link"><button type="button" class="btn btn-outline klein" data-a="anfrageLinkKopieren">Kopieren</button></p>' +
      '<details><summary>Knopf für Ihre Website</summary><p class="still">Diesen Code in Ihre Website einfügen (z. B. bei WordPress als „HTML“-Block):</p><pre class="btp-bsp">' + h('<a href="' + link + '" target="_blank" rel="noopener">Jetzt Anfrage senden</a>') + "</pre></details></section>");
  };
  K.aktion.anfrageLinkKopieren = async function () { U.kopieren(await K.anfrageLink()); };

  /* ---------- Hausverwaltung: Fachbetrieb anfragen ---------- */
  K.aktion.fristAnfrage = async function (el) {
    var f = await DB.eins("fristen", el.dataset.id), o = await DB.eins("objekte", f.objekt_id), a = f.anlage_id ? await DB.eins("anlagen", f.anlage_id) : null, b = K.ctx.betrieb;
    var bekannt = ((b.kalkulation || {}).fachbetriebe || []);
    var adr = [o.strasse, [o.plz, o.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    var text = "Objekt: " + o.name + (adr ? "\nAdresse: " + adr : "") + "\nWohnungen/Einheiten: " + o.einheiten + (o.eigentuemer ? "\nEigentümer: " + o.eigentuemer : "") +
      (a ? "\nAnlage: " + ({ heizkessel: "Heizkessel", waermepumpe: "Wärmepumpe", fernwaerme: "Fernwärme", sonstige: "Sonstige Anlage" }[a.art] || a.art) + (a.bezeichnung ? " (" + a.bezeichnung + ")" : "") + (a.einbau_jahr ? ", eingebaut " + (a.einbau_monat ? ("0" + a.einbau_monat).slice(-2) + "/" : "") + a.einbau_jahr : "") + (a.hersteller ? ", " + a.hersteller : "") : "") +
      "\nFällig bis: " + U.datum(f.faellig) + (f.grundlage === "60b" ? "\n\nBitte Heizungsprüfung und -optimierung nach § 60b durchführen und den Prüfbericht schicken." : "") + "\n\nAnsprechpartner: " + (K.ctx.ich.name || "") + ", " + b.name;
    var r = await U.dialog("Fachbetrieb anfragen", (bekannt.length ? U.feld("bekannt", "Fachbetrieb", bekannt[0].token, { optionen: bekannt.map(function (x) { return [x.token, x.name]; }).concat([["", "anderer Betrieb (Link einfügen)"]]) }) : "") +
      U.feld("link", "Anfrage-Link des Fachbetriebs", "", { ph: "https://…/portal.html#anfrage=…", hilfe: "Jeder Betrieb mit Kundario hat einen Anfrage-Link (Einstellungen → Ihr Anfrage-Link). Einmal eingefügt, merkt Kundario ihn sich." }) +
      U.feld("betreff", "Betreff", f.titel + " – " + o.name, { pflicht: true, max: 200 }) + U.feld("text", "Nachricht mit Objektdaten", text, { typ: "textarea", zeilen: 10, breit: true, max: 5000 }) +
      U.feld("telefon", "Ihre Telefonnummer für Rückfragen", b.telefon || "", { typ: "tel" }),
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Anfrage senden", primaer: true }]);
    if (!r) return;
    var d = r.daten, tok = K.tokenAusLink(d.link) || d.bekannt || ""; if (!tok) throw new Error("Bitte den Anfrage-Link des Fachbetriebs einfügen.");
    var fb = await DB.rpc("portal_betrieb", { p_token: tok }); if (!fb) throw new Error("Dieser Anfrage-Link ist ungültig. Bitte beim Fachbetrieb nachfragen.");
    await DB.rpc("anfrage_einreichen", { p_token: tok, p_name: b.name, p_email: b.email || K.ctx.user.email, p_telefon: d.telefon || "", p_ort: adr || o.name, p_betreff: d.betreff, p_text: d.text, p_art: "hausverwaltung" });
    await DB.aendern("fristen", f.id, { status: "beauftragt", fachbetrieb: fb.name, notiz: "Anfrage über Kundario gesendet am " + U.datum(new Date()) });
    if (!bekannt.some(function (x) { return x.token === tok; })) {
      try { K.ctx.betrieb = await DB.aendern("betriebe", b.id, { kalkulation: Object.assign({}, b.kalkulation || {}, { fachbetriebe: [{ name: fb.name, token: tok }].concat(bekannt).slice(0, 30) }) }); } catch (x) { /* nur Geschäftsführung speichert die Liste */ }
    }
    U.toast("Anfrage an " + fb.name + " gesendet. Frist steht auf „beauftragt“."); K.neuLaden();
  };
})();
