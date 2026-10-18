/* Sonderangebote für Kundschaft (sonderangebote.html): Liste, Details, AR-Prüfung, Reservierung. */
(function () {
  "use strict";
  var S = window.SONDER, liste = S.laden(), f = { gw: "", zustand: "", km: 50 };
  var GWN = { bad: "Sanitär & Bad", heizung: "Heizung & Klima", elektro: "Elektro", solar: "Solar", maler: "Maler", fliesen: "Fliesen", boden: "Boden", trockenbau: "Trockenbau", schreiner: "Schreiner & Küche", dach: "Dach", fenster: "Fenster, Türen & Tore", sonnenschutz: "Sonnenschutz", garten: "Garten & Zaun" };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var datum = function (iso) { var p = String(iso).split("-"); return p[2] + "." + p[1] + "." + p[0]; };
  var $l = document.getElementById("so-liste");
  function sichtbar() { return liste.filter(function (s) { return s.status !== "verkauft" && (!f.gw || s.gw === f.gw) && (!f.zustand || s.zustand === f.zustand) && s.km <= f.km; }); }
  function filterZeichnen() {
    var gws = liste.filter(function (s) { return s.status !== "verkauft"; }).map(function (s) { return s.gw; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    document.getElementById("so-gw").innerHTML = '<button type="button" data-so-gw="" aria-pressed="' + !f.gw + '">Alle</button>' + gws.map(function (g) { return '<button type="button" data-so-gw="' + g + '" aria-pressed="' + (f.gw === g) + '">' + esc(GWN[g] || g) + "</button>"; }).join("");
    var z = document.getElementById("so-zustand"); if (z.options.length === 1) Object.keys(S.ZUSTAND).forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = S.ZUSTAND[k].kurz; z.appendChild(o); });
  }
  function karte(s) {
    var p = S.preisText(s), v = S.vergleich(s), Z = S.ZUSTAND[s.zustand];
    return '<article class="so-karte' + (s.status === "reserviert" ? " reserviert" : "") + '"><button type="button" class="so-karte-knopf" data-so="' + s.id + '" aria-label="' + esc(s.titel) + ' – Details">' +
      '<span class="so-bild' + (s.fotos && s.fotos.length ? " foto" : "") + '"><img src="' + (s.fotos && s.fotos[0] ? s.fotos[0] : "img/produkte/" + s.pid + ".webp") + '" alt="" loading="lazy"><span class="so-tags"><span class="so-tag">' + esc(S.HERKUNFT[s.herkunft]) + '</span><span class="so-tag z-' + s.zustand + '">' + esc(Z.kurz) + "</span></span>" + (s.status === "reserviert" ? '<span class="so-res">reserviert</span>' : "") + "</span>" +
      '<span class="so-text"><b>' + esc(s.titel) + '</b><small>' + esc(s.betrieb) + " · " + esc(s.ort) + " · ca. " + s.km + ' km</small><span class="so-preis">' + esc(p.haupt) + "</span><small>" + esc(p.zusatz) + "</small>" + (v ? '<small class="so-vgl">' + esc(v) + "</small>" : "") + '<small class="so-mont">' + esc(S.montageText(s)) + "</small></span></button></article>";
  }
  function zeichnen() {
    liste = S.laden(); filterZeichnen(); var x = sichtbar();
    $l.innerHTML = x.length ? x.map(karte).join("") : '<p class="col-empty">Gerade keine passenden Sonderangebote. Schauen Sie bald wieder vorbei – oder stellen Sie eine <a href="anfrage.html">Anfrage</a>.</p>';
  }
  /* ---------- Detail ---------- */
  var offen = null;
  function zu() { document.querySelectorAll(".so-drawer, .so-backdrop").forEach(function (e) { e.remove(); }); document.body.style.overflow = ""; offen = null; if (location.hash) history.replaceState(null, "", location.pathname); }
  function detail(id, res) {
    var s = liste.filter(function (x) { return x.id === id; })[0]; if (!s) return; zu(); offen = s;
    var p = S.preisText(s), v = S.vergleich(s), Z = S.ZUSTAND[s.zustand], k = S.konto();
    var back = document.createElement("div"); back.className = "drawer-backdrop so-backdrop"; back.addEventListener("click", zu);
    var d = document.createElement("div"); d.className = "drawer so-drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "so-titel");
    var resForm = function () {
      if (!k) return '<div class="so-box"><b>Zum Reservieren kurz anmelden</b><p>So weiß der Betrieb, wen er erreichen soll. Ohne Passwort, mit Code per E-Mail.</p><a class="btn btn-signal" href="anmelden.html?weiter=' + encodeURIComponent("sonderangebote.html#" + s.id) + '">Anmelden und reservieren</a></div>';
      if (k.rolle === "betrieb") return '<p class="so-box">Sie sind als Betrieb angemeldet. Reservieren können nur Privat- und Geschäftskunden mit Kundenkonto.</p>';
      return '<form class="so-box so-res-form" id="so-res"><b>Reservieren für ' + esc(k.name) + "</b>" +
        (s.menge > 1 && s.einheit === "Stück" ? '<label class="so-feld">Anzahl<select name="anzahl">' + Array.apply(null, Array(s.menge)).map(function (_, i) { return "<option>" + (i + 1) + "</option>"; }).join("") + "</select></label>" : "") +
        (s.montage && s.montage.art === "fest" ? '<label class="p-check"><input type="checkbox" name="montage" checked> <span>Mit Montage zum Festpreis (' + S.euro.format(s.montage.preis) + (s.menge > 1 && s.einheit === "Stück" ? " je Stück" : "") + ")</span></label>" : "") +
        (s.abweichungen.length ? '<p class="so-klein"><b>Bitte jede Abweichung einzeln bestätigen</b> (gesetzlich vorgeschrieben, § 476 BGB):</p>' + s.abweichungen.map(function (a, i) { return '<label class="p-check"><input type="checkbox" name="abw' + i + '" data-abw> <span>Mir ist bekannt und ich vereinbare ausdrücklich: <b>' + esc(a) + "</b>. Hierfür bestehen keine Mängelrechte.</span></label>"; }).join("") : "") +
        (s.zustand === "gebraucht" ? '<label class="p-check"><input type="checkbox" name="kurz"> <span><b>Freiwillig:</b> Ich vereinbare ausdrücklich eine Gewährleistung von 1 Jahr statt 2 Jahren (gebrauchte Ware). Ohne Haken gelten 2 Jahre – der Betrieb kann dann ablehnen.</span></label>' : "") +
        '<label class="so-feld">Nachricht an den Betrieb <span class="opt">(freiwillig)</span><textarea name="text" rows="2" placeholder="z. B. Lichtmaß meines Fensters, Wunschtermin …"></textarea></label>' +
        '<p class="portal-err" id="so-err" role="alert"></p><button class="btn btn-signal" type="submit">48 Stunden kostenlos reservieren</button>' +
        '<p class="so-klein">Die Reservierung ist unverbindlich und kostenlos. Der Kaufvertrag kommt erst mit ' + esc(s.betrieb) + " zustande. Kaufen Sie ausschließlich per Telefon, E-Mail oder online, haben Sie ein 14-tägiges Widerrufsrecht.</p></form>";
    };
    d.innerHTML = '<div class="drawer-head"><div><p class="so-klein">' + esc(S.HERKUNFT[s.herkunft]) + " · " + esc(Z.kurz) + '</p><h2 id="so-titel">' + esc(s.titel) + '</h2><p class="so-klein">' + esc(s.betrieb) + " · " + esc(s.ort) + ' · ca. ' + s.km + ' km</p></div><button class="icon-btn" type="button" data-so-zu aria-label="Schließen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="so-detail"><div class="so-d-links"><div class="so-d-bild' + (s.fotos && s.fotos.length ? " foto" : "") + '"><img src="' + (s.fotos && s.fotos[0] ? s.fotos[0] : "img/produkte/" + s.pid + ".webp") + '" alt="Foto ' + esc(s.titel) + '"></div>' +
        (s.fotos && s.fotos.length > 1 ? '<div class="so-mini">' + s.fotos.map(function (f, i) { return '<button type="button" data-so-bild="' + i + '"><img src="' + f + '" alt="Foto ' + (i + 1) + '"></button>'; }).join("") + "</div>" : "") +
        '<button class="btn btn-outline so-ar" type="button" data-so-ar><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>Passt das bei mir? Im Raum ansehen (AR)</button>' +
        "<p>" + esc(s.text) + "</p></div>" +
      '<div class="so-d-rechts"><div class="so-preisbox"><span class="so-preis gross">' + esc(p.haupt) + "</span><small>" + esc(p.zusatz) + "</small>" + (v ? '<small class="so-vgl">' + esc(v) + "</small>" : "") + "</div>" +
        '<dl class="so-fakten"><div><dt>Zustand</dt><dd>' + esc(Z.l) + "</dd></div><div><dt>Gewährleistung</dt><dd>" + (s.zustand === "gebraucht" ? "1 Jahr bei ausdrücklicher Vereinbarung, sonst 2 Jahre" : "2 Jahre (gesetzlich)") + "</dd></div>" +
          "<div><dt>Montage</dt><dd>" + esc(S.montageText(s)) + "</dd></div><div><dt>Abholung</dt><dd>" + (s.abholung ? "möglich in " + esc(s.ort) : "nein, nur mit Montage") + "</dd></div><div><dt>Verfügbar</dt><dd>" + s.menge + " " + esc(s.einheit) + " · bis " + datum(s.gueltig) + "</dd></div></dl>" +
        '<p class="so-recht">' + esc(Z.info) + "</p>" +
        (s.abweichungen.length ? '<div class="so-abw"><b>Bekannte Abweichungen</b><ul>' + s.abweichungen.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul></div>" : "") +
        (s.status === "reserviert" && !(k && s.reserviertVon === k.email) ? '<p class="so-box">Gerade für jemand anderen reserviert – bis spätestens ' + new Date(s.reserviertBis).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) + " Uhr. Schauen Sie danach noch einmal.</p>" :
          s.status === "reserviert" ? '<p class="so-box ok">Für Sie reserviert bis ' + new Date(s.reserviertBis).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) + ' Uhr. ' + esc(s.betrieb) + ' meldet sich bei Ihnen. <a href="kunde.html">Zu Meine Vorhaben</a></p>' : resForm()) +
      "</div></div>";
    document.body.appendChild(back); document.body.appendChild(d); document.body.style.overflow = "hidden";
    history.replaceState(null, "", "#" + s.id); d.querySelector("[data-so-zu]").focus();
    if (res) { var r0 = d.querySelector("#so-res"); if (r0) r0.scrollIntoView({ block: "start" }); }
  }
  function reservieren(form) {
    var s = offen, k = S.konto(), err = document.getElementById("so-err"); err.textContent = "";
    var fehlt = Array.prototype.filter.call(form.querySelectorAll("[data-abw]"), function (c) { return !c.checked; });
    if (fehlt.length) { err.textContent = "Bitte bestätigen Sie jede genannte Abweichung einzeln – sonst kann der Betrieb sie nicht vereinbaren."; return; }
    var fd = new FormData(form), anzahl = +(fd.get("anzahl") || 1);
    liste = S.laden(); var x = liste.filter(function (y) { return y.id === s.id; })[0];
    if (x.status !== "aktiv") { err.textContent = "Leider gerade eben reserviert worden."; return; }
    x.status = "reserviert"; x.reserviertVon = k.email; x.reserviertBis = Date.now() + 48 * 3600 * 1000;
    var gesamt = (x.einheit === "m²" ? x.preis * x.menge : x.preis * anzahl) + (fd.get("montage") && x.montage.art === "fest" ? x.montage.preis * (x.einheit === "Stück" ? anzahl : 1) : 0);
    x.reservierung = { name: k.name, email: k.email, anzahl: anzahl, montage: !!fd.get("montage"), kurz: !!fd.get("kurz"), abw: x.abweichungen.slice(), text: String(fd.get("text") || "").trim(), gesamt: gesamt, wann: new Date().toISOString() };
    S.speichern(liste);
    try { var r = JSON.parse(localStorage.getItem("sonder-reservierungen") || "[]"); r.push({ id: x.id, titel: x.titel, betrieb: x.betrieb, ort: x.ort, gesamt: gesamt, bis: x.reserviertBis, kunde: k.name, email: k.email, anzahl: anzahl, montage: x.reservierung.montage, kurz: x.reservierung.kurz, abw: x.abweichungen, text: x.reservierung.text, pid: x.pid, cfg: x.cfg, wann: x.reservierung.wann }); localStorage.setItem("sonder-reservierungen", JSON.stringify(r.slice(-20))); } catch (e2) { /* privat */ }
    zeichnen(); detail(x.id);
    var t = document.createElement("div"); t.className = "so-toast"; t.textContent = "Reserviert für 48 Stunden – " + x.betrieb + " meldet sich bei Ihnen."; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4500);
  }
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-so-gw]"))) { f.gw = el.getAttribute("data-so-gw"); return zeichnen(); }
    if ((el = t.closest("[data-so]"))) return detail(el.getAttribute("data-so"));
    if (t.closest("[data-so-zu]")) return zu();
    if ((el = t.closest("[data-so-bild]")) && offen) { var bi = document.querySelector(".so-d-bild img"); if (bi) bi.src = offen.fotos[+el.getAttribute("data-so-bild")]; return; }
    if (t.closest("[data-so-ar]") && offen) {
      var s = offen, Z = S.ZUSTAND[s.zustand];
      window.KonfigKunde.oeffnen({ pids: [s.pid], pid: s.pid, cfg: s.cfg, fest: true, titel: s.titel, knopf: "Zurück zum Angebot",
        festInfo: '<p class="kk-fest">' + S.preisText(s).haupt + " · " + Z.kurz + (s.abweichungen.length ? " · Abweichungen siehe Angebot" : "") + "</p>" });
    }
  });
  document.addEventListener("submit", function (e) { if (e.target.id === "so-res") { e.preventDefault(); reservieren(e.target); } });
  document.addEventListener("change", function (e) { if (e.target.id === "so-zustand") { f.zustand = e.target.value; zeichnen(); } if (e.target.id === "so-km") { f.km = +e.target.value; zeichnen(); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && offen && !document.querySelector(".kk-drawer")) zu(); });
  zeichnen();
  if (/^#s\d+$/.test(location.hash)) detail(location.hash.slice(1), true);
})();
