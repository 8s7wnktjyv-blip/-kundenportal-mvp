/* =====================================================================
   KLEINE HELFER FÜR ALLE SEITEN
   ---------------------------------------------------------------------
   1. Kontaktdaten aus config.js überall einsetzen
   2. Menü auf dem Handy auf- und zuklappen
   3. Kopfzeile bekommt beim Scrollen eine feine Linie
   4. Aktuelles Jahr in der Fußzeile
   5. Umschalter hell / dunkel (Dark Mode)
   6. Kontaktformular (Versand über Formspree, Rückfall: E-Mail)
   Hier müssen Sie normalerweise nichts ändern.
   ===================================================================== */
(function () {
  "use strict";
  var site = window.SITE || {};

  /* 1. Kontaktdaten einsetzen ------------------------------------------
     <span data-site="phone"></span>      → Text wird ersetzt
     <a data-site-link="phone"></a>       → Anruf-Link (tel:)
     <a data-site-link="email"></a>       → E-Mail-Link (mailto:)        */
  document.querySelectorAll("[data-site]").forEach(function (el) {
    var key = el.getAttribute("data-site");
    if (site[key]) el.textContent = site[key];
  });

  document.querySelectorAll("[data-site-link]").forEach(function (el) {
    var key = el.getAttribute("data-site-link");
    if (key === "phone" && site.phoneLink) el.setAttribute("href", "tel:" + site.phoneLink);
    if (key === "email" && site.email) el.setAttribute("href", "mailto:" + site.email);
  });

  /* 2. Handy-Menü ------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Mit der Escape-Taste schließen
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* 3. Linie unter der Kopfzeile beim Scrollen ------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* 4. Jahr in der Fußzeile -------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* 5. Hell / Dunkel umschalten ------------------------------------------
     Die Wahl wird nur im Browser des Besuchers gespeichert (localStorage).
     Es werden keine Daten übertragen – kein Cookie-Banner nötig.         */
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-toggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      var dark = theme === "dark";
      themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
      themeBtn.setAttribute("aria-label", dark ? "Helles Design einschalten" : "Dunkles Design einschalten");
    }
  }
  function savedTheme() {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  }

  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) { /* z. B. privater Modus */ }
    });
  }

  // Ändert der Besucher die Einstellung seines Geräts und hat selbst
  // nichts gewählt, passt sich die Seite automatisch an.
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function (e) { if (!savedTheme()) applyTheme(e.matches ? "dark" : "light"); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
  }
  /* 6. Kontaktformular ---------------------------------------------------
     - Ist in config.js eine Formspree-Adresse eingetragen, wird das
       Formular dorthin geschickt und danach „danke.html“ angezeigt.
     - Ist noch keine Adresse eingetragen (oder klappt der Versand nicht),
       öffnet sich stattdessen das E-Mail-Programm mit allen Angaben.      */
  var form = document.getElementById("kontaktformular");
  if (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var endpoint = (site.formEndpoint || "").trim();
    var hasEndpoint = /^https:\/\//.test(endpoint);
    if (hasEndpoint) form.setAttribute("action", endpoint);

    var setStatus = function (text, isError) {
      status.textContent = text;
      status.classList.toggle("error", !!isError);
    };

    // Angaben als E-Mail öffnen (Rückfall)
    var openMail = function () {
      var d = new FormData(form);
      var lines = [
        "Name: " + (d.get("name") || ""),
        "Betrieb: " + (d.get("betrieb") || ""),
        "Gewerk: " + (d.get("gewerk") || ""),
        "Telefon: " + (d.get("telefon") || ""),
        "E-Mail: " + (d.get("email") || ""),
        "",
        String(d.get("nachricht") || "")
      ];
      window.location.href = "mailto:" + (site.email || "") +
        "?subject=" + encodeURIComponent("Anfrage Angebots-Check") +
        "&body=" + encodeURIComponent(lines.join("\n"));
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Pflichtfelder prüfen
      var firstInvalid = null;
      form.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (el.name === "_gotcha") return;
        var ok = el.checkValidity();
        el.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) {
        var msg = "Bitte füllen Sie alle Pflichtfelder aus.";
        if (firstInvalid.type === "email" && firstInvalid.value) msg = "Bitte prüfen Sie Ihre E-Mail-Adresse.";
        if (firstInvalid.type === "checkbox") msg = "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.";
        setStatus(msg, true);
        firstInvalid.focus();
        return;
      }

      // Spam-Bot? (unsichtbares Feld ausgefüllt) → so tun, als wäre alles gut
      if (form.querySelector('[name="_gotcha"]').value) { window.location.href = "danke.html"; return; }

      if (!hasEndpoint) {
        setStatus("Ihr E-Mail-Programm öffnet sich mit Ihren Angaben – bitte dort auf „Senden“ tippen.");
        openMail();
        return;
      }

      button.disabled = true;
      setStatus("Wird gesendet …");
      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          window.location.href = "danke.html";
        })
        .catch(function () {
          button.disabled = false;
          setStatus("Das hat leider nicht geklappt. Bitte schreiben Sie mir direkt per E-Mail – Ihr E-Mail-Programm öffnet sich gleich.", true);
          setTimeout(openMail, 1500);
        });
    });
  }
})();
