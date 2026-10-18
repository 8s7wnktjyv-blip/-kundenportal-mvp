/* =====================================================================
   KLEINE HELFER FÜR ALLE SEITEN
   ---------------------------------------------------------------------
   1. Kontaktdaten aus config.js überall einsetzen
   2. Menü auf dem Handy auf- und zuklappen
   3. Kopfzeile bekommt beim Scrollen eine feine Linie
   4. Aktuelles Jahr in der Fußzeile
   5. Umschalter hell / dunkel (Dark Mode)
   6. Kontaktformular (Versand über Formspree, Rückfall: E-Mail)
   7. Hinweis „Testversion“ (wenn testMode in config.js auf true steht)
   8. Leiste unten auf dem Handy
   9. Foto, WhatsApp-Knopf, Terminwahl, Rundgang
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

  /* Logo-Buchstabe = erster Buchstabe des Namens aus config.js */
  if (site.name) document.querySelectorAll(".logo-mark").forEach(function (el) { el.setAttribute("data-l", site.name.trim().charAt(0).toLowerCase()); });

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
    try { return sessionStorage.getItem("theme"); } catch (e) { return null; }
  }

  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { sessionStorage.setItem("theme", next); } catch (e) { /* z. B. privater Modus */ }
    });
  }

  // Die Seite öffnet immer hell – auch wenn das Gerät auf Dunkel steht.
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () { /* Seite bleibt hell, bis der Besucher selbst umschaltet */ };
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

      if (!hasEndpoint && !/@/.test(site.email || "")) {   // Testversion: weder Formular-Dienst noch E-Mail-Adresse eingetragen
        setStatus("Testversion: Das Formular ist noch nicht angeschlossen – Ihre Angaben wurden nicht gesendet. Kontaktdaten folgen in Kürze.", true);
        return;
      }
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

  /* 7. Testversion -------------------------------------------------------
     Zeigt oben einen Hinweis und bittet Suchmaschinen, die Seite nicht
     aufzunehmen. Abschalten: in config.js  testMode: false               */
  if (site.testMode) {
    var robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);

    var bar = document.createElement("div");
    bar.className = "test-bar";
    bar.setAttribute("role", "note");
    var feedback = /@/.test(site.email || "")
      ? ' <a href="mailto:' + site.email + '?subject=' + encodeURIComponent("Feedback zur Website") + '">Feedback geben</a>'
      : "";
    bar.innerHTML = "<strong>Testversion</strong> – Inhalte, Preise und Kontaktdaten sind noch vorläufig." + feedback;
    var hdr = document.querySelector(".site-header");
    document.body.insertBefore(bar, hdr || document.body.firstChild);
  }

  /* 8. Leiste unten auf dem Handy (wie in einer App) ----------------------
     Nur auf normalen Seiten; die Demo hat ihre eigene Leiste.            */
  if (!document.body.classList.contains("app-body") && !document.body.classList.contains("portal-body") && !document.body.classList.contains("start-body")) {
    var seite = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var tel = /^\+?\d[\d ]{5,}$/.test(String(site.phoneLink || "")) ? "tel:" + site.phoneLink : "kontakt.html";
    var I = {
      start: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
      demo: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
      preise: '<path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/>',
      tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
      kontakt: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>'
    };
    I.wa = '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5z"/>';
    I.termin = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>';
    var waOk = /^\d{8,15}$/.test(String(site.whatsapp || ""));
    var punkte = [["index.html", "Start", "start"], ["demo.html", "Demo", "demo"], ["preise.html", "Preise", "preise"],
      waOk ? ["https://wa.me/" + site.whatsapp, "WhatsApp", "wa"] : [tel, "Anrufen", "tel"], ["kontakt.html#termin", "Termin", "termin"]];
    var bar = document.createElement("nav");
    bar.className = "site-tabbar";
    bar.setAttribute("aria-label", "Schnellzugriff");
    bar.innerHTML = punkte.map(function (p) {
      return '<a href="' + p[0] + '"' + (p[0].split("#")[0] === seite ? ' aria-current="page"' : "") + (/^https/.test(p[0]) ? ' target="_blank" rel="noopener"' : "") + '><svg viewBox="0 0 24 24" aria-hidden="true">' + I[p[2]] + "</svg><span>" + p[1] + "</span></a>";
    }).join("");
    document.body.appendChild(bar);
    document.body.classList.add("has-tabbar");
  }
})();

/* Untermenü „Für wen“: beim Klick außerhalb schließen */
document.addEventListener("click", function (e) {
  document.querySelectorAll(".has-sub details[open]").forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute("open"); });
});

/* 9. Foto, WhatsApp-Knopf, Terminwahl, Rundgang ---------------------------- */
(function () {
  "use strict";
  var site = window.SITE || {};
  var leer = function (v) { return !v || /^\[.*\]$/.test(String(v).trim()); };

  /* Foto: ersetzt die Platzhalter, sobald in config.js ein Foto steht */
  if (!leer(site.photo)) {
    document.querySelectorAll(".placeholder.portrait").forEach(function (ph) {
      var img = document.createElement("img");
      img.src = site.photo; img.alt = (site.owner || "Gründer") + ", Ansprechpartner";
      img.className = "portrait-foto" + (ph.classList.contains("klein") ? " klein" : "");
      img.loading = "lazy";
      ph.replaceWith(img);
    });
  }

  /* WhatsApp-Knopf (PC) – nur auf den Seiten für Betriebe, nur mit Nummer */
  var b = document.body.classList;
  if (/^\d{8,15}$/.test(String(site.whatsapp || "")) && !b.contains("app-body") && !b.contains("portal-body") && !b.contains("start-body")) {
    var a = document.createElement("a");
    a.className = "wa-fab"; a.target = "_blank"; a.rel = "noopener";
    a.href = "https://wa.me/" + site.whatsapp + "?text=" + encodeURIComponent("Hallo, ich interessiere mich für den Angebots-Check.");
    a.setAttribute("aria-label", "Per WhatsApp schreiben");
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5z"/></svg><span>WhatsApp</span>';
    document.body.appendChild(a);
    document.querySelectorAll("[data-wa]").forEach(function (el) { el.href = a.href; el.hidden = false; });
  }

  /* Terminwahl im Kontaktformular */
  var tw = document.getElementById("terminwahl");
  if (tw) {
    if (!leer(site.bookingUrl)) {
      var direkt = document.getElementById("termin-direkt");
      if (direkt) { direkt.href = site.bookingUrl; direkt.hidden = false; }
    }
    var feld = document.getElementById("f-termin");
    var tage = [], d = new Date(); d.setHours(12, 0, 0, 0);
    while (tage.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() > 0 && d.getDay() < 6) tage.push(new Date(d)); }
    var WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    var ZEITEN = ["8:00", "10:00", "13:00", "16:00", "18:00"];
    var wahlTag = 0, wahlZeit = "";
    var fmt = function (t) { return WT[t.getDay()] + " " + t.getDate() + "." + (t.getMonth() + 1) + "."; };
    function zeichne() {
      tw.querySelector(".tw-tage").innerHTML = tage.map(function (t, i) {
        return '<button type="button" class="tw-tag" data-tag="' + i + '" aria-pressed="' + (i === wahlTag) + '"><small>' + WT[t.getDay()] + "</small><b>" + t.getDate() + "." + (t.getMonth() + 1) + ".</b></button>";
      }).join("");
      tw.querySelector(".tw-zeiten").innerHTML = ZEITEN.map(function (z) {
        return '<button type="button" class="tw-zeit" data-zeit="' + z + '" aria-pressed="' + (z === wahlZeit) + '">' + z + " Uhr</button>";
      }).join("");
      var art = (tw.querySelector("[name=gespraech]:checked") || {}).value || "Telefon";
      feld.value = wahlZeit ? fmt(tage[wahlTag]) + " um " + wahlZeit + " Uhr (" + art + ")" : "";
      tw.querySelector(".tw-auswahl").textContent = wahlZeit ? "Ihr Wunschtermin: " + feld.value : "Bitte Tag und Uhrzeit antippen – oder einfach ohne Termin absenden.";
    }
    tw.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tag]"), z = e.target.closest("[data-zeit]");
      if (t) { wahlTag = +t.getAttribute("data-tag"); zeichne(); }
      if (z) { wahlZeit = z.getAttribute("data-zeit") === wahlZeit ? "" : z.getAttribute("data-zeit"); zeichne(); }
    });
    tw.addEventListener("change", zeichne);
    zeichne();
  }

  /* Rundgang „So läuft ein Auftrag“ (ersetzt ein Video, bis eines da ist) */
  var rg = document.getElementById("rundgang");
  if (rg) {
    if (!leer(site.videoUrl)) {
      var v = document.getElementById("rundgang-video");
      v.innerHTML = '<video controls preload="metadata" playsinline src="' + site.videoUrl + '"></video>';
      v.hidden = false;
    }
    var schritte = rg.querySelectorAll(".rg-schritt"), punkte = rg.querySelector(".rg-punkte");
    var nr = 0, timer = null, ruhig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    punkte.innerHTML = Array.prototype.map.call(schritte, function (s, i) { return '<button type="button" data-rg="' + i + '" aria-label="Schritt ' + (i + 1) + '"></button>'; }).join("");
    function zeige(i) {
      nr = (i + schritte.length) % schritte.length;
      schritte.forEach(function (s, k) { s.hidden = k !== nr; });
      punkte.querySelectorAll("button").forEach(function (p, k) { p.setAttribute("aria-current", k === nr ? "step" : "false"); });
      rg.querySelector(".rg-zahl").textContent = (nr + 1) + " / " + schritte.length;
    }
    function play(an) {
      clearInterval(timer); timer = null;
      var btn = rg.querySelector("[data-rg-play]");
      if (an) { timer = setInterval(function () { zeige(nr + 1); }, 6000); btn.textContent = "Pause"; btn.setAttribute("aria-pressed", "true"); }
      else { btn.textContent = "Abspielen"; btn.setAttribute("aria-pressed", "false"); }
    }
    rg.addEventListener("click", function (e) {
      var p = e.target.closest("[data-rg]");
      if (p) { zeige(+p.getAttribute("data-rg")); play(false); }
      if (e.target.closest("[data-rg-vor]")) { zeige(nr + 1); play(false); }
      if (e.target.closest("[data-rg-zurueck]")) { zeige(nr - 1); play(false); }
      if (e.target.closest("[data-rg-play]")) play(!timer);
    });
    zeige(0);
    if (!ruhig && "IntersectionObserver" in window) {
      var gestartet = false;
      new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting && !gestartet) { gestartet = true; play(true); } }); }, { threshold: 0.5 }).observe(rg);
    } else play(false);
  }
})();

/* 10. Sanftes Einblenden beim Scrollen ------------------------------------ */
(function () {
  if (document.body.classList.contains("app-body")) return;
  if (!("IntersectionObserver" in window) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var els = document.querySelectorAll("main .section-head, main .card, main .vorteil, main .f-grid, main .vn, main .kennzahlen, main .rundgang, main .dark-block, main .final-cta, main .price-card, main .feature, main .faq, main .mock-wrap");
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("rein"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -6% 0px" });
  els.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
})();

/* 11. Empfehlungscode (?ref=...) merken – 90 Tage, nur im Browser –
   und beim Absenden von Kontaktformular und Portal mitschicken. */
(function () {
  var m = location.search.match(/[?&]ref=([a-z0-9-]{1,40})/i), ref = null;
  try {
    if (m) localStorage.setItem("empfehlung", JSON.stringify({ c: m[1], t: Date.now() }));
    var e = JSON.parse(localStorage.getItem("empfehlung") || "null");
    if (e && Date.now() - e.t < 90 * 864e5) ref = e.c;
  } catch (x) {}
  window.EMPFEHLUNG = ref;
  var f = document.getElementById("kontaktformular");
  if (ref && f) { var i = document.createElement("input"); i.type = "hidden"; i.name = "empfehlung"; i.value = ref; f.appendChild(i); }
})();
