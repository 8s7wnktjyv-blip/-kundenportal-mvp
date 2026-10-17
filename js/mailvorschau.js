/* =====================================================================
   E-MAIL-VORSCHAU: so sieht die Nachricht aus, die die KI vorbereitet hat
   - Kopf wie im Mailprogramm (Von, An, Betreff, Anhang)
   - Umschalten E-Mail / WhatsApp, Text bearbeiten, neu formulieren
   - kurzer Tippeffekt; verschickt wird nur über „Freigeben & senden“
   MailVorschau.html(opts) liefert das HTML (danach MailVorschau.start(el)),
   MailVorschau.zeigen(opts) öffnet die Vorschau als eigenes Fenster.
   opts: { von, vonMail, an, anMail, anTel, betreff, anhang, mail: [Text, Text2], wa: [Text, Text2], kanal: "mail"|"wa", senden: function () {} }
   ===================================================================== */
(function () {
  "use strict";
  var REG = {}, nr = 0;
  var ruhig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + "</svg>"; };
  var I = {
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    wa: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
    clip: '<path d="M21.4 11.1 12.2 20.3a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    stern: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>'
  };

  function inhalt(o) {
    var k = o.kanal, txt = (k === "wa" ? o.wa : o.mail)[o.v % (k === "wa" ? o.wa : o.mail).length];
    var kopf = k === "wa" ?
      '<div class="mv-wa-kopf"><span class="mv-av">' + esc((o.an || "?").replace(/^Familie /, "").charAt(0)) + "</span><div><b>" + esc(o.an) + "</b><small>" + esc(o.anTel || "WhatsApp") + "</small></div></div>" :
      '<dl class="mv-kopf"><dt>Von</dt><dd>' + esc(o.von) + (o.vonMail ? " &lt;" + esc(o.vonMail) + "&gt;" : "") + "</dd><dt>An</dt><dd>" + esc(o.an) + (o.anMail ? " &lt;" + esc(o.anMail) + "&gt;" : "") + "</dd>" +
      "<dt>Betreff</dt><dd><b>" + esc(o.betreff) + "</b></dd>" + (o.anhang ? '<dt></dt><dd><span class="mv-anhang">' + svg(I.clip) + esc(o.anhang) + "</span></dd>" : "") + "</dl>";
    return kopf + '<div class="mv-koerper"><div class="mv-text' + (k === "wa" ? " mv-blase" : "") + '" data-mv-ziel="' + esc(txt) + '"' + (o.edit ? ' contenteditable="true"' : "") + ">" + (o.edit || ruhig || o.fertig ? esc(o.textNeu != null ? o.textNeu : txt) : "") + "</div>" +
      (k === "wa" && o.anhang ? '<div class="mv-blase mv-datei">' + svg(I.clip) + esc(o.anhang) + "</div>" : "") + "</div>";
  }
  function html(o) {
    var id = "mv" + (++nr);
    o.id = id; o.v = 0; o.kanal = o.kanal === "wa" && o.wa ? "wa" : "mail"; o.wa = o.wa || o.mail; REG[id] = o;
    return '<section class="mv" id="' + id + '" aria-label="Nachricht, die die KI vorbereitet hat">' +
      '<div class="mv-leiste"><span class="mv-ki">' + svg(I.stern) + (o.titel || "Von der KI vorbereitet") + '</span><div class="mv-umschalter" role="group" aria-label="Kanal">' +
        '<button type="button" data-mv="kanal" data-k="mail" aria-pressed="' + (o.kanal === "mail") + '">' + svg(I.mail) + "E-Mail</button>" +
        '<button type="button" data-mv="kanal" data-k="wa" aria-pressed="' + (o.kanal === "wa") + '">' + svg(I.wa) + "WhatsApp</button></div></div>" +
      '<div class="mv-fenster mv-' + o.kanal + '">' + inhalt(o) + "</div>" +
      '<div class="mv-knoepfe"><button class="btn btn-signal" type="button" data-mv="senden">Freigeben &amp; senden</button><button class="btn btn-outline" type="button" data-mv="bearbeiten">Text bearbeiten</button><button class="btn btn-outline" type="button" data-mv="neu">Neu formulieren</button></div>' +
      '<p class="mv-hinweis">Von der KI vorbereitet – verschickt wird erst nach Ihrer Freigabe.</p></section>';
  }
  function tippen(box) {
    var t = box.querySelector(".mv-text"); if (!t || t.textContent || t.isContentEditable) return;
    var ziel = t.getAttribute("data-mv-ziel"), i = 0, schritt = Math.max(3, Math.ceil(ziel.length / 45));
    if (ruhig) { t.textContent = ziel; return; }
    t.classList.add("tippt");
    (function weiter() {
      if (!t.isConnected) return;
      i = Math.min(ziel.length, i + schritt); t.textContent = ziel.slice(0, i);
      if (i < ziel.length) setTimeout(weiter, 20); else t.classList.remove("tippt");
    })();
  }
  function neuZeichnen(o, tippenNeu) {
    var box = document.getElementById(o.id); if (!box) return;
    box.querySelector(".mv-fenster").className = "mv-fenster mv-" + o.kanal;
    box.querySelector(".mv-fenster").innerHTML = inhalt(o);
    box.querySelectorAll("[data-mv=kanal]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-k") === o.kanal)); });
    box.querySelector("[data-mv=bearbeiten]").textContent = o.edit ? "Fertig" : "Text bearbeiten";
    if (tippenNeu) tippen(box);
    if (o.edit) { var t = box.querySelector(".mv-text"); t.focus(); }
  }
  function start(root) { (root || document).querySelectorAll(".mv").forEach(tippen); }
  function zeigen(o) {
    var back = document.createElement("div"); back.className = "drawer-backdrop mv-back";
    var d = document.createElement("div"); d.className = "drawer mv-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Nachricht prüfen");
    d.innerHTML = '<div class="drawer-head"><div><h2>Nachricht prüfen</h2><p style="margin:0;color:var(--muted)">' + esc(o.zweck || "") + '</p></div><button class="icon-btn" type="button" data-mv="zu" aria-label="Schließen">✕</button></div>' + html(o);
    var zu = function () { d.remove(); back.remove(); document.body.style.overflow = ""; };
    o._zu = zu; back.addEventListener("click", zu);
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    start(d);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-mv]"); if (!b) return;
    var box = b.closest(".mv"), was = b.getAttribute("data-mv");
    if (was === "zu") { var dr = b.closest(".mv-drawer"); if (dr) { dr.remove(); document.querySelectorAll(".mv-back").forEach(function (x) { x.remove(); }); document.body.style.overflow = ""; } return; }
    if (!box) return;
    e.stopPropagation();
    var o = REG[box.id]; if (!o) return;
    var t = box.querySelector(".mv-text");
    if (was === "kanal") { if (o.edit) { o.edit = false; o.textNeu = null; } o.kanal = b.getAttribute("data-k"); o.fertig = false; return neuZeichnen(o, true); }
    if (was === "neu") { o.edit = false; o.textNeu = null; o.v++; o.fertig = false; return neuZeichnen(o, true); }
    if (was === "bearbeiten") { if (o.edit) { o.textNeu = t.innerText; o.edit = false; o.fertig = true; } else { o.textNeu = t.textContent; o.edit = true; } return neuZeichnen(o, false); }
    if (was === "senden") {
      var text = t ? (t.isContentEditable ? t.innerText : t.textContent) : "";
      box.innerHTML = '<div class="mv-gesendet">' + svg('<path d="M20 6 9 17l-5-5"/>') + "<div><b>" + (o.kanal === "wa" ? "WhatsApp" : "E-Mail") + " an " + esc(o.an) + " gesendet</b><small>In der Demo wurde nichts verschickt.</small></div></div>";
      var dr2 = box.closest(".mv-drawer");
      if (dr2) setTimeout(function () { if (o._zu) o._zu(); }, 900);
      if (o.senden) setTimeout(function () { o.senden(text, o.kanal); }, dr2 ? 950 : 600);
    }
  }, true);

  window.MailVorschau = { html: html, start: start, zeigen: zeigen };
})();
