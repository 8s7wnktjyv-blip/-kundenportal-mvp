/* Kundario – kleine Helfer für Oberfläche, Formate und Dokumente */
(function () {
  "use strict";
  var U = {};
  U.h = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var EUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  U.eur = function (v) { return EUR.format(+v || 0); };
  U.zahl = function (v) { if (typeof v === "number") return v; v = String(v || "").trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); var n = parseFloat(v); return isNaN(n) ? 0 : n; };
  U.zahlText = function (v, st) { return (+v || 0).toLocaleString("de-DE", { minimumFractionDigits: st == null ? 0 : st, maximumFractionDigits: st == null ? 2 : st }); };
  U.datum = function (d) { if (!d) return ""; var x = new Date(String(d).length === 10 ? d + "T12:00:00" : d); return isNaN(x) ? "" : x.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); };
  U.zeit = function (d) { if (!d) return ""; var x = new Date(d); return x.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); };
  U.datumZeit = function (d) { return U.datum(d) + (d && String(d).length > 10 ? ", " + U.zeit(d) + " Uhr" : ""); };
  U.isoTag = function (d) { d = d ? new Date(d) : new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  U.plusTage = function (d, n) { var x = d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d) : new Date(); x.setDate(x.getDate() + n); return U.isoTag(x); };
  U.tageSeit = function (d) { if (!d) return null; return Math.floor((Date.now() - new Date(d).getTime()) / 864e5); };
  U.tageBis = function (d) { if (!d) return null; return Math.ceil((new Date(d + "T23:59:59").getTime() - Date.now()) / 864e5); };
  U.relativ = function (d) {
    var t = U.tageSeit(d); if (t == null) return "";
    if (t <= 0) { var x = new Date(d); return "heute " + U.zeit(x); }
    if (t === 1) return "gestern"; if (t < 7) return "vor " + t + " Tagen"; return U.datum(d);
  };
  U.uuid = function () { return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(); };

  /* Positionen und Summen (Angebote, Rechnungen) */
  U.posNetto = function (p) { return Math.round((U.zahl(p.menge) * U.zahl(p.preis)) * (1 - U.zahl(p.rabatt) / 100) * 100) / 100; };
  U.summen = function (pos, mwst) {
    var netto = (pos || []).filter(function (p) { return !p.optional && p.typ !== "titel" && p.typ !== "text"; }).reduce(function (s, p) { return s + U.posNetto(p); }, 0);
    netto = Math.round(netto * 100) / 100; var st = Math.round(netto * (+mwst || 0)) / 100;
    return { netto: netto, mwst: st, brutto: Math.round((netto + st) * 100) / 100 };
  };

  /* Meldungen */
  U.toast = function (text, art) {
    var w = document.getElementById("toasts"); if (!w) { w = document.createElement("div"); w.id = "toasts"; w.setAttribute("aria-live", "polite"); document.body.appendChild(w); }
    var t = document.createElement("div"); t.className = "toast " + (art || ""); t.textContent = text; w.appendChild(t);
    setTimeout(function () { t.classList.add("weg"); setTimeout(function () { t.remove(); }, 300); }, art === "fehler" ? 6000 : 3500);
  };
  U.fehler = function (e) { console.error(e); U.toast((e && e.message) || "Etwas ist schiefgelaufen.", "fehler"); };

  /* Dialog */
  U.dialog = function (titel, inhalt, knoepfe) {
    return new Promise(function (fertig) {
      var d = document.createElement("dialog"); d.className = "dlg";
      d.innerHTML = '<form method="dialog" class="dlg-form"><header><h2>' + U.h(titel) + '</h2><button class="x" value="" aria-label="Schließen">×</button></header><div class="dlg-inhalt">' + inhalt + '</div><footer>' +
        (knoepfe || [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "OK", primaer: true }]).map(function (k) { return '<button class="btn ' + (k.primaer ? "btn-signal" : k.gefahr ? "btn-gefahr" : "btn-outline") + '" value="' + k.wert + '">' + U.h(k.text) + "</button>"; }).join("") + "</footer></form>";
      document.body.appendChild(d);
      var form = d.querySelector("form");
      form.addEventListener("submit", function (e) {
        var btn = e.submitter, wert = btn ? btn.value : "";
        if (wert && !form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
        var daten = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) daten[el.name] = el.type === "checkbox" ? el.checked : el.value; });
        d._erg = wert ? { wert: wert, daten: daten, dlg: d } : null;
      });
      d.addEventListener("close", function () { fertig(d._erg || null); setTimeout(function () { d.remove(); }, 50); });
      d.showModal(); var f = d.querySelector("input,select,textarea"); if (f) f.focus();
    });
  };
  U.bestaetigen = async function (frage, ja, gefahr) {
    var r = await U.dialog("Bitte bestätigen", "<p>" + U.h(frage) + "</p>", [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: ja || "Ja", primaer: !gefahr, gefahr: gefahr }]);
    return !!r;
  };
  U.feld = function (name, label, wert, o) {
    o = o || {}; var id = "f-" + name + "-" + Math.random().toString(36).slice(2, 7), w = U.h(wert == null ? "" : wert);
    var attr = (o.pflicht ? " required" : "") + (o.typ === "number" ? ' inputmode="decimal"' : "") + (o.max ? ' maxlength="' + o.max + '"' : "") + (o.ph ? ' placeholder="' + U.h(o.ph) + '"' : "") + (o.attr || "");
    var el;
    if (o.optionen) el = '<select id="' + id + '" name="' + name + '"' + attr + ">" + o.optionen.map(function (x) { var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + U.h(v) + '"' + (String(v) === String(wert == null ? "" : wert) ? " selected" : "") + ">" + U.h(l) + "</option>"; }).join("") + "</select>";
    else if (o.typ === "textarea") el = '<textarea id="' + id + '" name="' + name + '" rows="' + (o.zeilen || 3) + '"' + attr + ">" + w + "</textarea>";
    else if (o.typ === "checkbox") return '<label class="chk"><input type="checkbox" name="' + name + '"' + (wert ? " checked" : "") + attr + "> " + U.h(label) + "</label>";
    else el = '<input id="' + id + '" name="' + name + '" type="' + (o.typ === "number" ? "text" : o.typ || "text") + '" value="' + w + '"' + attr + ">";
    return '<div class="fld' + (o.breit ? " breit" : "") + '"><label for="' + id + '">' + U.h(label) + (o.pflicht ? " *" : "") + "</label>" + el + (o.hilfe ? "<small>" + U.h(o.hilfe) + "</small>" : "") + "</div>";
  };

  /* Unterschrift auf dem Bildschirm */
  U.unterschrift = function (canvas) {
    var ctx = canvas.getContext("2d"), malt = false, leer = true, letzte = null;
    function groesse() { var r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.scale(dpr, dpr); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111"; leer = true; }
    groesse();
    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    canvas.addEventListener("pointerdown", function (e) { malt = true; letzte = pos(e); canvas.setPointerCapture(e.pointerId); e.preventDefault(); });
    canvas.addEventListener("pointermove", function (e) { if (!malt) return; var p = pos(e); ctx.beginPath(); ctx.moveTo(letzte.x, letzte.y); ctx.lineTo(p.x, p.y); ctx.stroke(); letzte = p; leer = false; });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { canvas.addEventListener(ev, function () { malt = false; }); });
    return { leer: function () { return leer; }, bild: function () { return leer ? "" : canvas.toDataURL("image/png"); }, neu: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); groesse(); } };
  };

  /* Druckbare Dokumente (Angebot, Rechnung, Regiebericht) – Drucken oder „Als PDF speichern“ */
  U.dokument = function (o) {
    var b = o.betrieb || {}, k = o.kunde || {};
    var pos = (o.positionen || []).map(function (p, i) {
      if (p.typ === "titel") return '<tr class="d-titel"><td colspan="5">' + U.h(p.text) + "</td></tr>";
      if (p.typ === "text") return '<tr class="d-text"><td colspan="5">' + U.h(p.text) + "</td></tr>";
      return "<tr" + (p.optional ? ' class="d-opt"' : "") + "><td>" + (i + 1) + "</td><td>" + U.h(p.text) + (p.optional ? " <em>(optional)</em>" : "") + (p.langtext ? '<div class="d-lang">' + U.h(p.langtext) + "</div>" : "") + "</td><td class=\"r\">" + U.zahlText(p.menge) + " " + U.h(p.einheit || "") + '</td><td class="r">' + U.eur(p.preis) + (U.zahl(p.rabatt) ? "<br><small>−" + U.zahlText(p.rabatt) + " %</small>" : "") + '</td><td class="r">' + U.eur(U.posNetto(p)) + "</td></tr>";
    }).join("");
    var s = U.summen(o.positionen, o.mwst);
    var html = '<div class="doc"><header class="d-kopf"><div class="d-absender">' + U.h([b.name, b.strasse, [b.plz, b.ort].filter(Boolean).join(" ")].filter(Boolean).join(" · ")) + '</div><div class="d-firma"><b>' + U.h(b.name || "") + "</b><br>" + U.h(b.strasse || "") + "<br>" + U.h([b.plz, b.ort].filter(Boolean).join(" ")) + "<br>" + U.h(b.telefon || "") + "<br>" + U.h(b.email || "") + "</div></header>" +
      '<div class="d-an">' + U.h(k.name || "") + "<br>" + U.h(k.strasse || "") + "<br>" + U.h([k.plz, k.ort].filter(Boolean).join(" ")) + "</div>" +
      '<div class="d-meta"><h1>' + U.h(o.titelArt) + " " + U.h(o.nr || "(Entwurf)") + "</h1><table>" + (o.meta || []).map(function (m) { return "<tr><td>" + U.h(m[0]) + "</td><td>" + U.h(m[1]) + "</td></tr>"; }).join("") + "</table></div>" +
      (o.betreff ? '<p class="d-betreff"><b>' + U.h(o.betreff) + "</b></p>" : "") + (o.einleitung ? '<p class="d-einl">' + U.h(o.einleitung).replace(/\n/g, "<br>") + "</p>" : "") +
      (o.positionen ? '<table class="d-pos"><thead><tr><th>Pos.</th><th>Leistung</th><th class="r">Menge</th><th class="r">Einzelpreis</th><th class="r">Gesamt</th></tr></thead><tbody>' + pos + "</tbody></table>" +
        '<table class="d-sum"><tr><td>Summe netto</td><td class="r">' + U.eur(s.netto) + "</td></tr><tr><td>zzgl. " + U.zahlText(o.mwst) + " % USt.</td><td class=\"r\">" + U.eur(s.mwst) + '</td></tr><tr class="d-ges"><td>Gesamtbetrag</td><td class="r">' + U.eur(s.brutto) + "</td></tr></table>" : "") +
      (o.zusatz || "") + (o.schluss ? '<p class="d-schluss">' + U.h(o.schluss).replace(/\n/g, "<br>") + "</p>" : "") +
      '<footer class="d-fuss"><span>' + U.h(b.name || "") + (b.inhaber ? " · Inhaber " + U.h(b.inhaber) : "") + "</span><span>" + (b.steuernummer ? "St.-Nr. " + U.h(b.steuernummer) : "") + (b.ust_id ? " · USt-IdNr. " + U.h(b.ust_id) : "") + "</span><span>" + (b.iban ? U.h(b.bank || "") + " · IBAN " + U.h(b.iban) + (b.bic ? " · BIC " + U.h(b.bic) : "") : "") + "</span></footer></div>";
    return html;
  };
  U.drucken = function (html, titel) {
    var d = document.getElementById("druck"); if (!d) { d = document.createElement("div"); d.id = "druck"; document.body.appendChild(d); }
    d.innerHTML = html; var alt = document.title; document.title = titel || alt;
    setTimeout(function () { window.print(); document.title = alt; }, 60);
  };
  U.kopieren = async function (text) {
    try { await navigator.clipboard.writeText(text); U.toast("Link kopiert."); }
    catch (e) { await U.dialog("Link", '<input readonly value="' + U.h(text) + '" onclick="this.select()" style="width:100%">', [{ wert: "", text: "Schließen" }]); }
  };
  U.mail = function (an, betreff, text) { location.href = "mailto:" + encodeURIComponent(an || "") + "?subject=" + encodeURIComponent(betreff || "") + "&body=" + encodeURIComponent(text || ""); };

  window.U = U;
})();
