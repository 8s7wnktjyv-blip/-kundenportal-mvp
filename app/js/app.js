/* Kundario – App-Rahmen: Anmeldung, Betrieb, Navigation, Seitenwechsel */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h;
  var K = window.K = { views: {}, ctx: { user: null, betrieb: null, ich: null, team: [] } };
  var $ = function (s) { return document.querySelector(s); };

  var NAV = [
    ["Alltag", [["uebersicht", "Übersicht"], ["assistent", "Assistent"], ["anfragen", "Anfragen"], ["nachfassen", "Nachfassen"], ["kunden", "Kunden"], ["kalender", "Kalender"], ["suche", "Suche"]]],
    ["Baustelle", [["auftraege", "Aufträge"], ["plantafel", "Plantafel"], ["berichte", "Regieberichte"], ["zeiten", "Zeiterfassung"], ["protokolle", "Protokolle"], ["aufmass", "Aufmaß"], ["material", "Material"], ["lager", "Lager"], ["dokumente", "Dokumente"]]],
    ["Büro & Geld", [["angebote", "Angebote"], ["katalog", "Katalog"], ["vorlagen", "Vorlagen"], ["rechnungen", "Rechnungen"], ["belege", "Eingangsrechnungen"], ["finanzen", "Finanzen"], ["kasse", "Kassenbuch"], ["steuer", "Umsatzsteuer"], ["stundensatz", "Stundensatz"], ["wartungen", "Wartungsverträge"], ["ablaeufe", "Abläufe"], ["auswertungen", "Auswertungen"]]],
    ["Betrieb", [["team", "Team"], ["einstellungen", "Einstellungen"]]],
    ["Hilfe", [["hilfe", "So geht's"]]]
  ];
  // Hausverwaltung (Fristen-Service): eigenes, schlankes Menü
  var NAV_HV = [
    ["Verwaltung", [["uebersicht", "Übersicht"], ["objekte", "Objekte"], ["fristen", "Fristen"], ["dokumente", "Dokumente"]]],
    ["Verwaltung intern", [["team", "Team"], ["einstellungen", "Einstellungen"]]],
    ["Hilfe", [["hilfe", "So geht's"]]]
  ];
  var HV_VIEWS = ["uebersicht", "objekte", "fristen", "dokumente", "team", "einstellungen", "hilfe"];
  K.istVerwaltung = function () { return !!(K.ctx.betrieb && K.ctx.betrieb.gewerk === "Hausverwaltung"); };
  // Symbole für die untere Leiste (einfache Linien, passen sich der Schriftfarbe an)
  var ICON = {
    heute: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    post: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    auftrag: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    mikro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    euro: '<path d="M17 6a7 7 0 1 0 0 12M4 10h10M4 14h10"/>',
    kalender: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    stift: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    uhr: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mehr: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    haus: '<path d="M4 21V9l8-5 8 5v12z"/><path d="M9 21v-6h6v6"/>'
  };
  var svg = function (n) { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + "</svg>"; };
  var UNTEN = {
    gf: [["uebersicht", "Heute", "heute"], ["anfragen", "Anfragen", "post"], ["auftraege", "Aufträge", "auftrag"], ["assistent", "Assistent", "mikro"]],
    buero: [["uebersicht", "Heute", "heute"], ["anfragen", "Anfragen", "post"], ["rechnungen", "Rechnungen", "euro"], ["assistent", "Assistent", "mikro"]],
    aussen: [["uebersicht", "Heute", "heute"], ["anfragen", "Anfragen", "post"], ["kalender", "Kalender", "kalender"], ["assistent", "Assistent", "mikro"]],
    monteur: [["uebersicht", "Heute", "heute"], ["kalender", "Kalender", "kalender"], ["zeiten", "Zeit", "uhr"], ["berichte", "Bericht", "stift"]]
  };
  var RECHTE = {
    gf: null,
    buero: null,
    aussen: ["uebersicht", "assistent", "anfragen", "nachfassen", "kunden", "kalender", "suche", "auftraege", "plantafel", "berichte", "zeiten", "protokolle", "aufmass", "material", "lager", "belege", "dokumente", "angebote", "katalog", "vorlagen", "wartungen"],
    monteur: ["uebersicht", "assistent", "kalender", "suche", "auftraege", "plantafel", "berichte", "zeiten", "protokolle", "aufmass", "material", "lager", "belege", "dokumente", "kunden"]
  };
  K.darf = function (view) { var r = K.ctx.ich && K.ctx.ich.rolle; if (!r) return false; if (view === "hilfe") return true; if (K.istVerwaltung() && HV_VIEWS.indexOf(view) < 0) return false; if (!K.istVerwaltung() && (view === "objekte" || view === "fristen")) return false; var l = RECHTE[r]; if (view === "team" || view === "einstellungen") return r === "gf" || (view === "team" && r === "buero"); return !l || l.indexOf(view) > -1; };
  K.rolleName = { gf: "Geschäftsführung", buero: "Büro", aussen: "Außendienst", monteur: "Montagekraft" };
  K.mitgliedName = function (id) { var m = K.ctx.team.filter(function (x) { return x.user_id === id; })[0]; return m ? m.name : ""; };

  /* ---------- Hilfen für alle Bereiche ---------- */
  K.bid = function () { return K.ctx.betrieb.id; };
  K.mwst = function () { return K.ctx.betrieb.kleinunternehmer ? 0 : +K.ctx.betrieb.mwst; };
  K.reStandard = function () { var b = K.ctx.betrieb; return { mwst: K.mwst(), steuerfall: b.kleinunternehmer ? "kleinunternehmer" : "normal", skonto_prozent: b.skonto_prozent || null, skonto_tage: b.skonto_tage || null }; };
  K.liste = function (t, o) { o = o || {}; o.wo = Object.assign({ betrieb_id: K.bid() }, o.wo || {}); return DB.liste(t, o); };
  K.neu = function (t, obj) { return DB.neu(t, Object.assign({ betrieb_id: K.bid() }, obj)); };
  K.verlauf = function (typ, id, text) { return DB.neu("verlauf", { betrieb_id: K.bid(), bezug_typ: typ, bezug_id: id, text: text, user_id: K.ctx.user.id }).catch(function () { /* Verlauf darf nie blockieren */ }); };
  K.nr = function (art) { return DB.rpc("naechste_nr", { p_betrieb: K.bid(), p_art: art }); };
  K.go = function (pfad) { if (location.hash === "#/" + pfad) zeigen(); else location.hash = "#/" + pfad; };
  K.neuLaden = function () { zeigen(); };
  K.kopf = function (titel, text, knoepfe) {
    return '<div class="seite-kopf"><div><h1>' + h(titel) + "</h1>" + (text ? "<p>" + h(text) + "</p>" : "") + "</div>" + (knoepfe ? '<div class="kopf-knoepfe">' + knoepfe + "</div>" : "") + "</div>";
  };
  K.leer = function (text, knopf) { return '<div class="leer"><p>' + h(text) + "</p>" + (knopf || "") + "</div>"; };
  K.status = function (s, liste) { var x = liste[s] || [s, ""]; return '<span class="pill ' + x[1] + '">' + h(x[0]) + "</span>"; };
  K.portalLink = function (art, token) { return location.origin + location.pathname.replace(/[^/]*$/, "") + "portal.html#" + art + "=" + token; };

  /* ---------- Anmeldung ---------- */
  function authSeite(art, meldung) {
    document.body.className = "auth-body";
    var test = DB.modus === "lokal" ? '<p class="hinweis">Testmodus: ohne Server, alle Daten bleiben nur in diesem Browser.</p>' : "";
    var f = {
      anmelden: '<h1>Anmelden</h1>' + U.feld("email", "E-Mail", "", { typ: "email", pflicht: true, attr: ' autocomplete="email"' }) + U.feld("pw", "Passwort", "", { typ: "password", pflicht: true, attr: ' autocomplete="current-password"' }) +
        '<button class="btn btn-signal breit" type="submit">Anmelden</button><p class="auth-links"><a href="#registrieren">Neu hier? Konto anlegen</a><a href="#vergessen">Passwort vergessen?</a></p>',
      registrieren: '<h1>Konto anlegen</h1>' + U.feld("name", "Ihr Name", "", { pflicht: true, attr: ' autocomplete="name"' }) + U.feld("email", "E-Mail", "", { typ: "email", pflicht: true, attr: ' autocomplete="email"' }) + U.feld("pw", "Passwort (mind. 8 Zeichen)", "", { typ: "password", pflicht: true, attr: ' minlength="8" autocomplete="new-password"' }) +
        U.feld("agb", "Ich akzeptiere die Nutzungsbedingungen und habe die Datenschutzerklärung gelesen.", false, { typ: "checkbox", attr: " required" }) +
        '<button class="btn btn-signal breit" type="submit">Konto anlegen</button><p class="auth-links"><a href="#anmelden">Schon ein Konto? Anmelden</a><a href="../nutzungsbedingungen.html" target="_blank">Nutzungsbedingungen</a><a href="../datenschutz.html" target="_blank">Datenschutz</a></p>',
      vergessen: '<h1>Passwort vergessen</h1><p>Sie bekommen eine E-Mail mit einem Link zum Zurücksetzen.</p>' + U.feld("email", "E-Mail", "", { typ: "email", pflicht: true }) + '<button class="btn btn-signal breit" type="submit">Link senden</button><p class="auth-links"><a href="#anmelden">Zurück zur Anmeldung</a></p>',
      "passwort-neu": '<h1>Neues Passwort</h1>' + U.feld("pw", "Neues Passwort (mind. 8 Zeichen)", "", { typ: "password", pflicht: true, attr: ' minlength="8" autocomplete="new-password"' }) + '<button class="btn btn-signal breit" type="submit">Speichern</button>',
      betrieb: '<h1>Ihr Betrieb</h1><p>Noch ein Schritt: Legen Sie Ihren Betrieb oder Ihre Hausverwaltung an. Wenn Sie zu einem bestehenden Betrieb gehören, nutzen Sie den Einladungslink Ihres Chefs.</p>' +
        U.feld("name", "Name des Betriebs bzw. der Verwaltung", "", { pflicht: true }) + U.feld("gewerk", "Gewerk bzw. Art", "", { optionen: [["", "bitte wählen"], "Maler und Lackierer", "SHK", "Elektro", "Dachdecker", "Fenster- und Türenbau", "Tischler und Schreiner", "Metallbau", "Trockenbau", "Zimmerer", "Maurer und Betonbau", "Fliesenleger", "Bodenleger", "Gerüstbau", "Bauunternehmen", "Garten- und Landschaftsbau", "Gebäudereinigung", "Hausmeisterdienst", "Kälte- und Lüftungstechnik", "Solar und Photovoltaik", "Sonstiges Handwerk", ["Hausverwaltung", "Hausverwaltung (Fristen-Service)"]], pflicht: true }) +
        U.feld("inhaber", "Inhaber", (K.ctx.user && K.ctx.user.user_metadata && K.ctx.user.user_metadata.name) || "", { pflicht: true }) +
        '<button class="btn btn-signal breit" type="submit">Betrieb anlegen</button><p class="auth-links"><a href="#" data-abmelden>Abmelden</a></p>'
    }[art];
    $("#app").innerHTML = '<main class="auth"><a class="auth-logo" href="../index.html"><span class="logo-k">k.</span> Kundario</a><form class="auth-karte" data-auth="' + art + '" novalidate>' + (meldung ? '<p class="meldung">' + h(meldung) + "</p>" : "") + f + test + "</form></main>";
  }
  document.addEventListener("submit", async function (e) {
    var f = e.target.closest("[data-auth]"); if (!f) return; e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var art = f.getAttribute("data-auth"), v = function (n) { return f.elements[n] ? f.elements[n].value.trim() : ""; }, btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      if (art === "anmelden") { await DB.auth.anmelden(v("email"), f.elements.pw.value); location.hash = ""; await start(); }
      else if (art === "registrieren") { var r = await DB.auth.registrieren(v("email"), f.elements.pw.value, v("name")); if (r.bestaetigen) authSeite("anmelden", "Fast geschafft: Wir haben Ihnen eine E-Mail geschickt. Bitte bestätigen Sie Ihre Adresse über den Link und melden Sie sich dann an."); else await start(); }
      else if (art === "vergessen") { await DB.auth.passwortVergessen(v("email")); authSeite("anmelden", "Wenn die Adresse bei uns registriert ist, kommt gleich eine E-Mail mit einem Link."); }
      else if (art === "passwort-neu") { await DB.auth.passwortSetzen(f.elements.pw.value); location.hash = ""; U.toast("Passwort gespeichert."); await start(); }
      else if (art === "betrieb") { await DB.rpc("betrieb_anlegen", { p_name: v("name"), p_gewerk: v("gewerk"), p_inhaber: v("inhaber") }); U.toast("Betrieb angelegt. Willkommen!"); await start(); }
    } catch (x) { U.fehler(x); } finally { btn.disabled = false; }
  });
  window.addEventListener("hashchange", function () {
    var hs = location.hash.slice(1);
    if (["anmelden", "registrieren", "vergessen"].indexOf(hs) > -1 && !K.ctx.user) return authSeite(hs);
    if (K.ctx.betrieb) zeigen();
  });
  document.addEventListener("click", async function (e) {
    if (e.target.closest("[data-abmelden]")) { e.preventDefault(); await DB.auth.abmelden(); K.ctx = { user: null, betrieb: null, ich: null, team: [] }; authSeite("anmelden", "Sie sind abgemeldet."); return; }
    if (e.target.closest("[data-menue]")) { document.body.classList.toggle("menue-offen"); return; }
    if (document.body.classList.contains("menue-offen") && !e.target.closest(".nav")) { document.body.classList.remove("menue-offen"); }
    if (e.target.closest(".nav a")) document.body.classList.remove("menue-offen");
  });

  /* ---------- Start ---------- */
  async function start() {
    try {
      var u = await DB.auth.nutzer();
      if (location.hash === "#passwort-neu" && u) { K.ctx.user = u; return authSeite("passwort-neu"); }
      if (!u) { var hs = location.hash.slice(1); return authSeite(["registrieren", "vergessen"].indexOf(hs) > -1 ? hs : (new URLSearchParams(location.search).get("einladung") ? "registrieren" : "anmelden"), new URLSearchParams(location.search).get("einladung") ? "Sie wurden eingeladen. Legen Sie ein Konto mit der E-Mail an, an die die Einladung ging – oder melden Sie sich an." : ""); }
      K.ctx.user = u;
      var token = new URLSearchParams(location.search).get("einladung");
      if (token) { try { await DB.rpc("einladung_annehmen", { p_token: token }); U.toast("Einladung angenommen."); } catch (x) { U.fehler(x); } history.replaceState(null, "", location.pathname); }
      var mg = await DB.liste("mitglieder", { wo: { user_id: u.id, aktiv: true } });
      if (!mg.length) return authSeite("betrieb");
      K.ctx.ich = mg[0];
      K.ctx.betrieb = await DB.eins("betriebe", mg[0].betrieb_id);
      K.ctx.team = await DB.liste("mitglieder", { wo: { betrieb_id: K.ctx.betrieb.id }, sortiere: "name.asc" });
      rahmen(); zeigen();
    } catch (x) {
      if (x && x.code === "abgemeldet") return authSeite("anmelden", x.message);
      $("#app").innerHTML = '<main class="auth"><div class="auth-karte"><h1>Verbindung fehlgeschlagen</h1><p>' + h(x.message) + '</p><p>Ist die Datenbank eingerichtet (supabase/migrations)? Ist das Internet erreichbar?</p><button class="btn btn-signal" onclick="location.reload()">Erneut versuchen</button></div></main>';
    }
  }

  function rahmen() {
    document.body.className = "app-body";
    var c = K.ctx;
    $("#app").innerHTML =
      '<header class="leiste"><button class="menue-knopf" data-menue aria-label="Menü">☰</button><a class="logo" href="#/uebersicht"><span class="logo-k">k.</span><span><b>Kundario</b><small>' + h(c.betrieb.name) + "</small></span></a>" +
        (DB.modus === "lokal" ? '<span class="pill warn" title="Daten nur in diesem Browser">Testmodus</span>' : "") +
        (K.istVerwaltung() ? "" : '<form class="leiste-suche" data-f="sucheKopf" role="search"><input type="search" name="q" placeholder="Suchen …" aria-label="Suchen"></form>') + '<div class="leiste-rechts"><span class="ich">' + h(c.ich.name) + " · " + h(K.rolleName[c.ich.rolle]) + '</span><button class="btn btn-outline klein" data-abmelden>Abmelden</button></div></header>' +
      '<nav class="nav" aria-label="Bereiche">' + (K.istVerwaltung() ? NAV_HV : NAV).map(function (g) {
        var items = g[1].filter(function (x) { return K.darf(x[0]); }); if (!items.length) return "";
        return '<div class="nav-gruppe"><span>' + h(g[0]) + "</span>" + items.map(function (x) { return '<a href="#/' + x[0] + '" data-v="' + x[0] + '">' + h(x[1]) + "</a>"; }).join("") + "</div>";
      }).join("") + '<p class="nav-fuss"><a href="#" data-abmelden>Abmelden</a> · <a href="../datenschutz.html" target="_blank">Datenschutz</a> · <a href="../impressum.html" target="_blank">Impressum</a></p></nav>' +
      '<main id="inhalt" class="inhalt" tabindex="-1"></main>' +
      '<nav class="unten" aria-label="Schnellzugriff">' + (K.istVerwaltung() ? [["uebersicht", "Heute", "heute"], ["objekte", "Objekte", "haus"], ["fristen", "Fristen", "kalender"], ["dokumente", "Dokumente", "auftrag"]] : UNTEN[K.ctx.ich.rolle]).map(function (x) { return '<a href="#/' + x[0] + '" data-v="' + x[0] + '">' + svg(x[2]) + "<span>" + h(x[1]) + "</span></a>"; }).join("") + '<button type="button" data-menue>' + svg("mehr") + "<span>Mehr</span></button></nav>";
  }

  var laeuft = 0;
  async function zeigen() {
    if (!K.ctx.betrieb) return;
    var teile = (location.hash.replace(/^#\/?/, "") || "uebersicht").split("/"), view = teile[0], id = teile[1], extra = teile[2];
    if (!K.views[view]) { view = "uebersicht"; id = null; history.replaceState(null, "", location.pathname + location.search + "#/uebersicht"); }
    K.aktView = view;
    if (!K.darf(view)) { view = "uebersicht"; U.toast("Dieser Bereich ist für Ihre Rolle nicht freigegeben."); }
    document.querySelectorAll(".nav a").forEach(function (a) { a.classList.toggle("aktiv", a.getAttribute("data-v") === view); });
    var m = $("#inhalt"), nr = ++laeuft;
    m.innerHTML = '<div class="laden">Wird geladen …</div>';
    try {
      var html = await K.views[view](id, extra);
      if (nr !== laeuft) return;
      if (typeof html === "string") m.innerHTML = html;
      if (K.views[view].danach) K.views[view].danach(id, extra);
      K.zaehlen(m); K.handyTabellen(m); if (K.hilfeKnopf) K.hilfeKnopf(); if (K.offlineBand) K.offlineBand();
      document.querySelectorAll(".unten a").forEach(function (a) { a.classList.toggle("aktiv", a.getAttribute("data-v") === view); });
      m.focus({ preventScroll: true }); window.scrollTo(0, 0);
    } catch (x) { if (nr === laeuft) m.innerHTML = K.leer("Das hat nicht geklappt: " + (x.message || x)); U.fehler(x); }
  }
  // Zahlen in Kacheln hochzählen lassen (nur wenn Bewegung erwünscht)
  K.zaehlen = function (wurzel) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    wurzel.querySelectorAll("[data-zaehl]").forEach(function (el) {
      var text = el.textContent, euro = /€/.test(text), ziel = U.zahl(text.replace(/[^\d,.-]/g, "")); if (!ziel) return;
      var t0 = performance.now(), dauer = 700;
      function schritt(t) { var p = Math.min(1, (t - t0) / dauer), w = ziel * (1 - Math.pow(1 - p, 3)); el.textContent = euro ? U.eur(w) : String(Math.round(w)); if (p < 1) requestAnimationFrame(schritt); else el.textContent = text; }
      requestAnimationFrame(schritt);
    });
  };
  // Auf dem Handy werden Tabellen zu Karten: jede Zelle bekommt ihre Spaltenüberschrift
  K.handyTabellen = function (wurzel) {
    wurzel.querySelectorAll(".tabelle:not(.plantafel) table:not(.pe):not(.mat):not(.am)").forEach(function (t) {
      var kopf = Array.prototype.map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
      if (!kopf.length) return; t.classList.add("karten-tabelle");
      t.querySelectorAll("tbody tr").forEach(function (tr) { Array.prototype.forEach.call(tr.children, function (td, i) { if (kopf[i]) td.setAttribute("data-label", kopf[i]); }); });
    });
  };
  K.zeigen = zeigen;
  window.addEventListener("load", start);
})();
