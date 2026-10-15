/* Preisrechner (preise.html): reine Beispielrechnung im Browser, nichts wird gespeichert oder verschickt. */
(function () {
  var box = document.getElementById("pr");
  if (!box) return;
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var n = { buero: 1, aussen: 0, monteur: 2 };
  var MAX = { buero: 10, aussen: 20, monteur: 60 }, MIN = { buero: 1, aussen: 0, monteur: 0 };
  function rechne() {
    Object.keys(n).forEach(function (k) { document.getElementById("pr-" + k).textContent = n[k]; });
    var gewaehlt = Array.prototype.filter.call(box.querySelectorAll(".pr-module input"), function (i) { return i.checked; });
    var einmal = 750 + gewaehlt.reduce(function (s, i) { return s + (+i.getAttribute("data-einmal") || 0); }, 0);
    var zeilen = [["Grundpreis", 199], [n.buero + " × Büro-Nutzer", n.buero * 149]];
    if (n.aussen) zeilen.push([n.aussen + " × Außendienst", n.aussen * 79]);
    var bezahlt = Math.max(0, n.monteur - 2);
    if (n.monteur) zeilen.push([n.monteur + " × Montagekraft" + (n.monteur <= 2 ? " (kostenlos)" : " (2 kostenlos)"), bezahlt * 25]);
    gewaehlt.forEach(function (i) { zeilen.push([(i.hasAttribute("data-preis") ? "" : "Modul ") + i.value, +i.getAttribute("data-preis") || 149]); });
    var summe = zeilen.reduce(function (s, z) { return s + z[1]; }, 0);
    document.getElementById("pr-monat").textContent = euro.format(summe);
    document.getElementById("pr-liste").innerHTML = zeilen.map(function (z) { return "<li><span>" + z[0] + "</span><span>" + euro.format(z[1]) + "</span></li>"; }).join("");
    document.getElementById("pr-einmal").textContent = "+ " + euro.format(einmal) + " einmalig (Einrichtung" + (einmal > 750 ? " und Website" : "") + ") – Einrichtung auch ohne Startkosten: 12 × 69 € · 12 Monate Laufzeit";
    var foerder = Math.min(7500, Math.round((einmal + summe * 18) * 0.5));
    document.getElementById("pr-foerder").textContent = euro.format(foerder);
  }
  box.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pr]"); if (!b) return;
    var k = b.getAttribute("data-pr"); n[k] = Math.min(MAX[k], Math.max(MIN[k], n[k] + Number(b.getAttribute("data-d")))); rechne();
  });
  box.addEventListener("change", rechne);
  rechne();
})();
