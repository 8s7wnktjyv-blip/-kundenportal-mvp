/* Empfehlungslink erzeugen (partner.html) – Vorschau im Browser, nichts wird gespeichert. */
(function () {
  var f = document.getElementById("el-form");
  if (!f) return;
  var basis = location.href.replace(/[^/]*([?#].*)?$/, "");
  function code(name) {
    var c = String(name || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    return c || "ihr-name";
  }
  function zeige() {
    var art = (f.querySelector("[name=el-art]:checked") || {}).value || "betriebe";
    var link = basis + (art === "portal" ? "anfrage.html" : art === "affiliate" ? "demo.html" : "betriebe.html") + "?ref=" + code(document.getElementById("el-name").value);
    document.getElementById("el-link").textContent = link;
    var text = art === "affiliate" ? "Mehr Aufträge, weniger Büro – probier die Demo für deinen Betrieb aus: " : art === "portal" ? "Sie planen ein Vorhaben am Haus? Hier finden Sie einen geprüften Fachbetrieb mit ehrlichem Preis: " : "Kennst du schon das Auftrags-Cockpit für Betriebe? Mehr Aufträge, weniger Büro: ";
    document.getElementById("el-wa").href = "https://wa.me/?text=" + encodeURIComponent(text + link);
  }
  f.addEventListener("input", zeige); f.addEventListener("change", zeige);
  document.getElementById("el-kopieren").addEventListener("click", function () {
    var t = document.getElementById("el-link").textContent, b = this;
    function ok() { b.textContent = "Kopiert ✓"; setTimeout(function () { b.textContent = "Link kopieren"; }, 1800); }
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () {}); else ok();
  });
  zeige();
})();
