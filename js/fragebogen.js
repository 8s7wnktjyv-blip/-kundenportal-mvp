/* =====================================================================
   EINRICHTUNGS-FRAGEBOGEN (fragebogen.html)
   - Eingaben werden auf dem Gerät zwischengespeichert (falls erlaubt).
   - Versand an die Formspree-Adresse aus config.js, sonst per E-Mail.
   ===================================================================== */
(function () {
  "use strict";
  var form = document.getElementById("fragebogen");
  if (!form) return;
  var site = window.SITE || {};
  var KEY = "fragebogen-entwurf";
  var status = form.querySelector(".form-status");
  var button = form.querySelector('button[type="submit"]');
  var endpoint = (site.formEndpoint || "").trim();
  var hasEndpoint = /^https:\/\//.test(endpoint);

  function setStatus(t, err) { status.textContent = t; status.classList.toggle("error", !!err); }
  function felder() { return form.querySelectorAll("input:not([type=hidden]), select, textarea"); }

  /* Zwischenspeichern */
  function speichern() {
    var d = {};
    felder().forEach(function (el) {
      if (!el.name || el.name === "_gotcha" || el.name === "datenschutz") return;
      if (el.type === "checkbox") { if (el.checked) (d[el.name] = d[el.name] || []).push(el.value); }
      else d[el.name] = el.value;
    });
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }
  function laden() {
    var d; try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { d = null; }
    if (!d) return;
    felder().forEach(function (el) {
      if (!(el.name in d)) return;
      if (el.type === "checkbox") el.checked = (d[el.name] || []).indexOf(el.value) >= 0;
      else el.value = d[el.name];
    });
  }
  laden();
  form.addEventListener("input", speichern);
  form.addEventListener("change", speichern);

  /* Empfehlungscode mitschicken, falls vorhanden */
  if (window.EMPFEHLUNG && !form.querySelector('[name="empfehlung"]')) {
    var h = document.createElement("input"); h.type = "hidden"; h.name = "empfehlung"; h.value = window.EMPFEHLUNG; form.appendChild(h);
  }

  /* Text für den E-Mail-Rückfall */
  function alsText() {
    var zeilen = [], fd = new FormData(form), gesehen = {};
    fd.forEach(function (v, k) {
      if (k.charAt(0) === "_" || k === "datenschutz") return;
      if (gesehen[k]) return; gesehen[k] = 1;
      var alle = fd.getAll(k).filter(Boolean).join(", ");
      if (alle) zeilen.push(k.replace(/_/g, " ") + ": " + alle);
    });
    return zeilen.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var first = null;
    felder().forEach(function (el) {
      if (el.name === "_gotcha") return;
      var ok = el.checkValidity();
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !first) first = el;
    });
    if (first) {
      setStatus(first.type === "checkbox" ? "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu." : "Bitte füllen Sie die Pflichtfelder in Abschnitt 1 aus.", true);
      first.focus(); return;
    }
    if (form.querySelector('[name="_gotcha"]').value) { location.href = "danke.html"; return; }
    if (!hasEndpoint) {
      setStatus("Ihr E-Mail-Programm öffnet sich mit Ihren Angaben – bitte dort auf „Senden“ tippen.");
      location.href = "mailto:" + (site.email || "") + "?subject=" + encodeURIComponent("Einrichtungs-Fragebogen") + "&body=" + encodeURIComponent(alsText());
      return;
    }
    button.disabled = true; setStatus("Wird gesendet …");
    fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        try { localStorage.removeItem(KEY); } catch (e2) {}
        location.href = "danke.html";
      })
      .catch(function () { button.disabled = false; setStatus("Das hat nicht geklappt. Ihre Eingaben sind gespeichert – bitte später noch einmal versuchen.", true); });
  });

  var dr = form.querySelector("[data-fb-drucken]");
  if (dr) dr.addEventListener("click", function () { window.print(); });
  var lo = form.querySelector("[data-fb-leeren]");
  if (lo) lo.addEventListener("click", function () {
    if (!confirm("Alle Eingaben in diesem Fragebogen löschen?")) return;
    form.reset(); try { localStorage.removeItem(KEY); } catch (e) {}
    setStatus("Eingaben gelöscht.");
  });
})();
