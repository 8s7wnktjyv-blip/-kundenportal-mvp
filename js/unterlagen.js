/* Partner-Unterlagen: Links und Newsletter-Text in die Zwischenablage kopieren */
(function () {
  "use strict";
  function kopiere(text, knopf) {
    var fertig = function () { var alt = knopf.textContent; knopf.textContent = "Kopiert ✓"; setTimeout(function () { knopf.textContent = alt; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(fertig, function () { prompt("Bitte kopieren:", text); });
    else prompt("Bitte kopieren:", text);
  }
  document.addEventListener("click", function (e) {
    var k = e.target.closest("[data-kopieren]");
    if (k) return kopiere(new URL(k.getAttribute("data-kopieren"), location.href).href, k);
    var f = e.target.closest("[data-kopieren-feld]");
    if (f) { var t = document.getElementById(f.getAttribute("data-kopieren-feld")); if (t) kopiere(t.value, f); }
  });
})();
