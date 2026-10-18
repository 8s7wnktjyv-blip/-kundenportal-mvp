/* Ersparnis-Rechner (rechner.html): Zeit, Wert der Zeit, Gewinn aus Mehrumsatz, Kosten.
   Reine Beispielrechnung im Browser – nichts wird gespeichert oder verschickt.
   Ruhige Animationen: Zahlen zählen hoch, Balken wachsen; aus bei „Bewegung reduzieren“. */
(function () {
  var box = document.getElementById("rechner");
  if (!box) return;
  var ruhig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var zahl = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
  var A = [
    ["Angebot schreiben", "mit Aufmaß und Vorlagen", 45, 20, "chef", function (e) { return e.angebote; }],
    ["Rechnung schreiben", "aus Regiebericht und Aufmaß", 20, 5, "buero", function (e) { return e.rechnungen; }],
    ["Anfragen erfassen", "und einschätzen", 10, 3, "buero", function (e) { return e.anfragen; }],
    ["Angebote nachfassen", "automatisch statt per Telefon", 10, 1, "buero", function (e) { return e.angebote; }],
    ["Termine abstimmen", "Kunde wählt selbst", 8, 2, "buero", function (e) { return e.baustellen * 4.33; }],
    ["Zahlungserinnerungen", "jede 4. Rechnung", 10, 1, "buero", function (e) { return e.rechnungen * 0.25; }]
  ];
  document.getElementById("e-annahmen").innerHTML = A.map(function (a, i) { return "<tr><td>" + a[0] + '</td><td><input type="number" min="0" max="240" value="' + a[2] + '" data-a="' + i + '" data-s="2" aria-label="' + a[0] + ' heute in Minuten"> Min.</td><td><input type="number" min="0" max="240" value="' + a[3] + '" data-a="' + i + '" data-s="3" aria-label="' + a[0] + ' mit Cockpit in Minuten"> Min.</td></tr>'; }).join("");
  var balken = document.getElementById("e-balken");
  balken.innerHTML = A.map(function (a, i) { return '<li data-i="' + i + '"><div class="rr-b-text"><b>' + a[0] + "</b><small>" + a[1] + ' · <span class="rr-b-min"></span></small></div><div class="rr-b-spur"><i></i></div><b class="rr-b-std">–</b></li>'; }).join("");

  function w(id) { var v = parseFloat(String(document.getElementById(id).value).replace(",", ".")); return isFinite(v) && v >= 0 ? v : 0; }
  function stepWert(k) { var el = box.querySelector('.rr-st[data-k="' + k + '"] input'); var v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : 0; }

  /* Zahlen sanft hochzählen */
  var aktuell = {};
  function zeige(key, ziel, format) {
    var els = box.querySelectorAll('[data-zahl="' + key + '"]'), start = aktuell[key] == null ? 0 : aktuell[key], t0 = null, dauer = ruhig ? 0 : 550;
    aktuell[key] = ziel;
    function schreibe(v) { els.forEach(function (el) { el.textContent = format(v); }); }
    if (!dauer || start === ziel) return schreibe(ziel);
    function schritt(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dauer), e = 1 - Math.pow(1 - p, 3); schreibe(start + (ziel - start) * e); if (p < 1 && aktuell[key] === ziel) requestAnimationFrame(schritt); }
    requestAnimationFrame(schritt);
  }
  var fEuro = function (v) { return (v < -0.5 ? "− " : "") + euro.format(Math.abs(v)); }, fStd = function (v) { return zahl.format(Math.round(v * 2) / 2); };

  function rechne(hervor) {
    box.querySelectorAll("[data-a]").forEach(function (i) { var v = parseFloat(i.value); if (isFinite(v) && v >= 0) A[+i.getAttribute("data-a")][+i.getAttribute("data-s")] = v; });
    var e = { anfragen: stepWert("anfragen"), angebote: stepWert("angebote"), rechnungen: stepWert("rechnungen"), baustellen: stepWert("baustellen") };
    var satz = { buero: w("e-buero"), chef: w("e-chef") }, min = 0, wert = 0, std = [];
    A.forEach(function (a, i) { var m = Math.max(0, a[2] - a[3]) * a[5](e); min += m; wert += m / 60 * satz[a[4]]; std[i] = m / 60; });
    var max = Math.max.apply(null, std.concat([1]));
    balken.querySelectorAll("li").forEach(function (li) { var i = +li.getAttribute("data-i"), a = A[i];
      li.querySelector("i").style.width = (std[i] / max * 100) + "%"; li.querySelector(".rr-b-std").textContent = fStd(std[i]) + " Std.";
      li.querySelector(".rr-b-min").textContent = a[2] + " → " + a[3] + " Min."; li.classList.toggle("leer", std[i] <= 0); });
    var umsatz = e.angebote * Math.min(w("e-ohne"), 100) / 100 * Math.min(w("e-quote"), 100) / 100 * w("e-wert"), mehr = umsatz * Math.min(w("e-marge"), 100) / 100;
    var PA = window.PREIS_AUSWAHL || { monat: 348, einmal: 750, text: "Grundpreis, 1 × Büro-Nutzer, 2 × Montagekraft" }, kosten = PA.monat, einmal = PA.einmal;
    var netto = wert + mehr - kosten;
    zeige("std", min / 60, fStd); zeige("wert", wert, fEuro); zeige("mehr", mehr, fEuro); zeige("umsatz", umsatz, fEuro); zeige("kosten", kosten, fEuro); zeige("netto", netto, fEuro); zeige("jahr", netto * 12, fEuro);
    document.getElementById("e-kosteninfo").textContent = PA.text.replace(/ \(kostenlos\)| \(2 kostenlos\)/g, "");
    box.querySelectorAll('.rr-summe, .rr-haupt').forEach(function (el) { el.classList.toggle("neg", netto < 0); });
    var f = document.getElementById("e-fazit"), mon = Math.max(1, Math.ceil(einmal / Math.max(1, netto)));
    f.innerHTML = netto > 0 ? "Die Einrichtung (" + euro.format(einmal) + ") hat sich nach etwa <b>" + mon + (mon === 1 ? " Monat" : " Monaten") + "</b> bezahlt gemacht." :
      "Ehrlich gesagt: Bei diesen Zahlen lohnt sich das Cockpit für Sie noch nicht. Sprechen Sie mich gern an – manchmal reicht schon ein einzelner Baustein.";
    if (hervor && !ruhig) box.querySelectorAll(".rr-kachel").forEach(function (k) { k.classList.remove("blink"); void k.offsetWidth; k.classList.add("blink"); });
  }
  box.addEventListener("click", function (ev) {
    var b = ev.target.closest(".rr-zahl button"); if (!b) return;
    var st = b.closest(".rr-st"), inp = st.querySelector("input"), s = +st.getAttribute("data-schritt"), v = (parseFloat(inp.value) || 0) + s * +b.getAttribute("data-d");
    inp.value = Math.max(+st.getAttribute("data-min"), Math.min(+st.getAttribute("data-max"), Math.round(v / s) * s));
    if (!ruhig) { inp.classList.remove("hupf"); void inp.offsetWidth; inp.classList.add("hupf"); }
    rechne(true);
  });
  var warte = null;
  box.addEventListener("input", function () { clearTimeout(warte); warte = setTimeout(function () { rechne(true); }, 180); });
  document.addEventListener("preis-geaendert", function () { rechne(true); });
  rechne(false);
  /* Kacheln zählen beim ersten Sichtbarwerden von 0 hoch */
  if (!ruhig && "IntersectionObserver" in window) {
    var k = box.querySelector(".rr-kacheln"), werte = JSON.parse(JSON.stringify(aktuell));
    Object.keys(aktuell).forEach(function (key) { aktuell[key] = 0; box.querySelectorAll('[data-zahl="' + key + '"]').forEach(function (el) { el.textContent = key === "std" ? "0" : "0 €"; }); });
    var io = new IntersectionObserver(function (en) { if (!en[0].isIntersecting) return; io.disconnect(); setTimeout(function () { rechne(false); }, 150); }, { threshold: 0.3 });
    io.observe(k); void werte;
  }
})();
