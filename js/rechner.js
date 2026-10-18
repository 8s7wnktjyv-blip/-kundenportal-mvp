/* Ersparnis-Rechner (betriebe.html#ersparnis): Zeit, Geld, Mehrumsatz und Kosten.
   Reine Beispielrechnung im Browser – nichts wird gespeichert oder verschickt. */
(function () {
  var box = document.getElementById("rechner");
  if (!box) return;
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var zahl = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
  /* Aufgabe, Minuten heute, Minuten mit Cockpit, wer es macht (buero/chef), wie oft (Funktion der Eingaben) */
  var A = [
    ["Anfrage erfassen und einschätzen", 10, 3, "buero", function (e) { return e.anfragen; }],
    ["Angebot schreiben (mit Aufmaß und Vorlagen)", 45, 20, "chef", function (e) { return e.angebote; }],
    ["Angebot nachfassen", 10, 1, "buero", function (e) { return e.angebote; }],
    ["Rechnung aus Regiebericht und Aufmaß", 20, 5, "buero", function (e) { return e.rechnungen; }],
    ["Termin mit Kunde abstimmen", 8, 2, "buero", function (e) { return e.baustellen * 4.33; }],
    ["Zahlungserinnerung (jede 4. Rechnung)", 10, 1, "buero", function (e) { return e.rechnungen * 0.25; }]
  ];
  var tb = document.getElementById("e-annahmen");
  tb.innerHTML = A.map(function (a, i) { return "<tr><td>" + a[0] + '</td><td><input type="number" min="0" max="240" value="' + a[1] + '" data-a="' + i + '" data-s="1" aria-label="' + a[0] + ' heute in Minuten"> Min.</td><td><input type="number" min="0" max="240" value="' + a[2] + '" data-a="' + i + '" data-s="2" aria-label="' + a[0] + ' mit Cockpit in Minuten"> Min.</td></tr>'; }).join("");
  function w(id) { var v = parseFloat(String(document.getElementById(id).value).replace(",", ".")); return isFinite(v) && v >= 0 ? v : 0; }
  function rechne() {
    box.querySelectorAll("output").forEach(function (o) { var i = document.getElementById(o.getAttribute("for")), e = o.getAttribute("data-e"), v = +i.value;
      o.textContent = e === "€" ? euro.format(v) : v + (e ? " " + e : ""); });
    box.querySelectorAll("[data-a]").forEach(function (i) { var v = parseFloat(i.value); if (isFinite(v) && v >= 0) A[+i.getAttribute("data-a")][+i.getAttribute("data-s")] = v; });
    var e = { anfragen: w("e-anfragen"), angebote: w("e-angebote"), rechnungen: w("e-rechnungen"), baustellen: w("e-baustellen") };
    var satz = { buero: w("e-buero"), chef: w("e-chef") }, min = 0, wert = 0, zeilen = [];
    A.forEach(function (a) { var m = Math.max(0, a[1] - a[2]) * a[4](e); min += m; wert += m / 60 * satz[a[3]]; if (m > 0) zeilen.push([a[0], m / 60]); });
    var mehrUmsatz = e.angebote * Math.min(w("e-ohne"), 100) / 100 * Math.min(w("e-quote"), 100) / 100 * w("e-wert"), mehr = mehrUmsatz * Math.min(w("e-marge"), 100) / 100;
    var nb = w("e-nbuero"), na = w("e-naussen"), nm = w("e-nmonteur"), kosten = 199 + nb * 149 + na * 79 + Math.max(0, nm - 2) * 25;
    var netto = wert + mehr - kosten;
    document.getElementById("e-stunden").textContent = zahl.format(Math.round(min / 60 * 2) / 2);
    document.getElementById("e-zeitwert").textContent = euro.format(wert);
    document.getElementById("e-liste").innerHTML = zeilen.sort(function (x, y) { return y[1] - x[1]; }).map(function (z) { return "<li><span>" + z[0] + "</span><b>" + zahl.format(Math.round(z[1] * 2) / 2) + " Std.</b></li>"; }).join("");
    document.getElementById("e-mehr").textContent = euro.format(mehr);
    document.getElementById("e-mehrinfo").textContent = "(" + euro.format(mehrUmsatz) + " Umsatz)";
    document.getElementById("e-kosten").textContent = euro.format(kosten);
    document.getElementById("e-kosteninfo").textContent = "(Grundpreis, " + nb + " Büro" + (na ? ", " + na + " Außendienst" : "") + (nm ? ", " + nm + " Montage" : "") + ")";
    var n = document.getElementById("e-netto"); n.textContent = (netto < 0 ? "− " : "") + euro.format(Math.abs(netto)); n.className = netto < 0 ? "neg" : "";
    document.getElementById("e-mini-std").textContent = zahl.format(Math.round(min / 60 * 2) / 2); document.getElementById("e-mini-netto").textContent = (netto < 0 ? "− " : "") + euro.format(Math.abs(netto));
    var f = document.getElementById("e-fazit");
    if (netto > 0) f.innerHTML = "Die Einrichtung (750 €) hat sich nach etwa <b>" + Math.max(1, Math.ceil(750 / netto)) + (Math.ceil(750 / netto) <= 1 ? " Monat" : " Monaten") + "</b> bezahlt gemacht. Aufs Jahr gerechnet bleiben rund <b>" + euro.format(netto * 12) + "</b>.";
    else f.innerHTML = "Ehrlich gesagt: Bei diesen Zahlen lohnt sich das Cockpit für Sie noch nicht. Sprechen Sie mich gern an – manchmal reicht schon ein einzelner Baustein.";
  }
  box.addEventListener("input", rechne);
  box.addEventListener("submit", function (ev) { ev.preventDefault(); });
  rechne();
})();
