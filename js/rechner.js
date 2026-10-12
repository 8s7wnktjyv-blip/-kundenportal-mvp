/* Angebots-Rechner auf der Startseite: reine Beispielrechnung im Browser, nichts wird gespeichert. */
(function () {
  var f = document.getElementById("rechner");
  if (!f) return;
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  function wert(id) { var v = parseFloat(String(document.getElementById(id).value).replace(",", ".")); return isNaN(v) || v < 0 ? 0 : v; }
  function rechne() {
    var angebote = wert("r-angebote") * 12;
    var schnitt = wert("r-wert");
    var ohne = Math.min(wert("r-ohne"), 100) / 100;
    var liegen = angebote * ohne * schnitt;              // Umsatz in Angeboten ohne Rückmeldung pro Jahr
    var mehr = liegen * 0.1;                              // Annahme: 10 % davon werden durch Nachfassen gewonnen
    document.getElementById("r-liegen").textContent = euro.format(liegen);
    document.getElementById("r-mehr").textContent = euro.format(mehr);
    document.getElementById("r-auftraege").textContent = Math.round(angebote * ohne * 0.1);
  }
  f.addEventListener("input", rechne);
  f.addEventListener("submit", function (e) { e.preventDefault(); rechne(); });
  rechne();
})();
