/* Kundario – Offline-Start der App.
   Holt immer zuerst die aktuelle Version aus dem Netz. Nur ohne Netz wird die
   zuletzt gespeicherte App-Hülle verwendet. Kundendaten werden hier nicht gespeichert. */
var CACHE = "kundario-app-20261122-03";
var HUELLE = ["./", "index.html", "app.css", "design.css", "../fonts/inter-latin.woff2", "js/config.js", "js/db.js", "js/ui.js", "js/app.js", "js/kern.js", "js/geld.js", "js/mehr.js", "js/hilfe.js", "js/ausbau.js", "js/finanzen.js", "js/handwerk.js", "js/belege.js", "js/buero.js", "js/profi.js", "js/planung.js", "js/bauteile.js", "js/bauteile_sprache.js", "js/bauteilpreise.js", "js/checklisten.js", "js/vorort.js", "js/aufmassdruck.js", "js/heute.js", "js/verwaltung.js", "js/verwaltung_import.js", "js/anfragelink.js", "../supabase/functions/_shared/uebergabe.js", "js/uebergabe_app.js", "js/provision.js", "js/partnerbereich.js", "manifest.webmanifest", "../css/style.css", "../fonts/figtree.woff2", "../img/favicon.svg"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(HUELLE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n.indexOf("kundario-app-") === 0 && n !== CACHE; }).map(function (n) { return caches.delete(n); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;          // Server-Daten nie hier zwischenspeichern
  if (/portal\.html$/.test(u.pathname)) return;                              // Kundenportal immer frisch
  e.respondWith(fetch(r).then(function (antwort) {
    if (antwort.ok) { var kopie = antwort.clone(); caches.open(CACHE).then(function (c) { c.put(r, kopie); }); }
    return antwort;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (t) { return t || (r.mode === "navigate" ? caches.match("index.html") : Response.error()); });
  }));
});
