/* Anmeldung (Demo): E-Mail + 6-stelliger Code, Rolle Kunde oder Betrieb. Nur im Browser. */
(function () {
  "use strict";
  var rolle = "kunde", code = null, ziel = new URLSearchParams(location.search).get("weiter");
  var $ = function (id) { return document.getElementById(id); };
  function zeigeRolle() {
    document.querySelectorAll("[data-rolle]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-rolle") === rolle)); });
    document.querySelectorAll("[data-nur]").forEach(function (el) { el.hidden = el.getAttribute("data-nur") !== rolle; });
  }
  function drin() {
    var k = SONDER.konto(); $("anm").hidden = !!k; $("anm-drin").hidden = !k; if (!k) return;
    $("anm-hallo").textContent = "Hallo " + (k.name || "").split(" ")[0] + "!";
    $("anm-info").textContent = "Angemeldet als " + k.email + (k.rolle === "betrieb" ? " für " + k.firma : "") + ".";
    $("anm-weiter").innerHTML = k.rolle === "betrieb" ?
      '<a class="btn btn-signal" href="demo.html">Zum Cockpit</a><a class="btn btn-outline" href="demo.html#sonder">Sonderangebote einstellen</a><a class="btn btn-outline" href="demo.html#boerse">Börse unter Betrieben</a>' :
      '<a class="btn btn-signal" href="kunde.html">Meine Vorhaben</a><a class="btn btn-outline" href="sonderangebote.html">Sonderangebote ansehen</a>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-rolle]"); if (b) { rolle = b.getAttribute("data-rolle"); code = null; $("anm-code-feld").hidden = true; $("anm-knopf").textContent = "Code senden"; zeigeRolle(); return; }
    if (e.target.closest("#anm-ab")) { SONDER.abmelden(); location.reload(); }
  });
  $("anm-form").addEventListener("submit", function (e) {
    e.preventDefault(); var err = $("anm-err"); err.textContent = "";
    var name = $("anm-name").value.trim(), mail = $("anm-mail").value.trim(), firma = $("anm-firma").value.trim();
    if (rolle === "betrieb" && !firma) { err.textContent = "Bitte den Namen des Betriebs eingeben."; return; }
    if (!name) { err.textContent = "Bitte Ihren Namen eingeben."; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { err.textContent = "Bitte eine gültige E-Mail-Adresse eingeben."; return; }
    if (!code) {
      code = String(Math.floor(100000 + Math.random() * 900000));
      $("anm-code-feld").hidden = false; $("anm-demo").textContent = "Demo: Ihr Code lautet " + code + " (in echt kommt er per E-Mail und gilt 10 Minuten).";
      $("anm-knopf").textContent = "Anmelden"; $("anm-code").focus(); return;
    }
    if ($("anm-code").value.trim() !== code) { err.textContent = "Der Code stimmt nicht. Bitte noch einmal prüfen."; return; }
    SONDER.anmelden({ rolle: rolle, name: name, email: mail, firma: rolle === "betrieb" ? firma : null, seit: new Date().toISOString() });
    if (ziel && /^[a-z-]+\.html(#[a-z0-9-]+)?(\?[a-z0-9=&-]*)?$/i.test(ziel)) { location.href = ziel; return; }
    drin(); window.scrollTo(0, 0);
  });
  var r = new URLSearchParams(location.search).get("rolle"); if (r === "betrieb") rolle = "betrieb";
  zeigeRolle(); drin();
})();
