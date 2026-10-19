/* =====================================================================
   ANGEBOTS-CHECK (läuft komplett im Browser, nichts wird gespeichert
   oder verschickt)
   ---------------------------------------------------------------------
   1. Angebotsliste laden: CSV/TXT, Excel (.xlsx/.xls) oder aus Excel
      kopieren und einfügen; alternativ Beispieldaten.
   2. Spalten erkennen (Datum, Kunde, Betrag, Status, Betreff) – der
      Betrieb kann die Zuordnung ändern.
   3. Auswertung: offene Angebote nach Alter, Abschlussquote, Potenzial
      durch Nachfassen (Quoten je Altersgruppe als Annahme änderbar),
      Liste „zuerst nachfassen“.
   ===================================================================== */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var app = $("#ac-app"); if (!app) return;

  var euro = function (v) { return (Math.round(v) || 0).toLocaleString("de-DE") + " €"; };
  var zahl = function (v) { return (Math.round(v) || 0).toLocaleString("de-DE"); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Einlesen ---------- */
  function trennzeichen(zeilen) {
    var probe = zeilen.slice(0, 15), best = ";", bestN = -1;
    [";", "\t", ","].forEach(function (t) {
      var n = probe.map(function (z) { return teile(z, t).length; });
      var gleich = n.filter(function (x) { return x === n[0] && x > 1; }).length;
      if (gleich > bestN) { bestN = gleich; best = t; }
    });
    return best;
  }
  function teile(z, t) {
    var out = [], cur = "", q = false;
    for (var i = 0; i < z.length; i++) {
      var ch = z[i];
      if (ch === '"') { if (q && z[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (ch === t && !q) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(function (x) { return x.trim(); });
  }
  function textZuTabelle(text) {
    var zeilen = String(text).replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n").filter(function (z) { return z.trim(); });
    if (!zeilen.length) return [];
    var t = trennzeichen(zeilen);
    return zeilen.map(function (z) { return teile(z, t); });
  }

  function zahlLesen(v) {
    if (typeof v === "number") return v;
    var s = String(v == null ? "" : v).replace(/[^\d,.\-]/g, "");
    if (!s || !/\d/.test(s)) return NaN;
    var k = s.lastIndexOf(","), p = s.lastIndexOf(".");
    if (k > -1 && p > -1) s = k > p ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else if (k > -1) s = /,\d{3}$/.test(s) && (s.match(/,/g) || []).length > 1 ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
    else if (p > -1 && /\.\d{3}$/.test(s) && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
    var n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }
  function datumLesen(v) {
    if (v instanceof Date && !isNaN(v)) return v;
    if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5));
    var s = String(v == null ? "" : v).trim(), m;
    if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/))) {
      var j = +m[3]; if (j < 100) j += 2000;
      return gueltig(new Date(j, +m[2] - 1, +m[1]));
    }
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return gueltig(new Date(+m[1], +m[2] - 1, +m[3]));
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return gueltig(new Date(+m[3], +m[1] - 1, +m[2]));
    if (/^\d{5}$/.test(s)) return datumLesen(+s);
    return null;
  }
  function gueltig(d) { return d && !isNaN(d) && d.getFullYear() > 1990 && d.getFullYear() < 2100 ? d : null; }

  /* ---------- Spalten erkennen ---------- */
  var MUSTER = {
    datum: /datum|date|erstellt|angebot.*vom|^am$|tag/i,
    kunde: /kunde|name|firma|auftraggeber|empf|adressat|bauherr|ansprech/i,
    betrag: /netto|betrag|summe|gesamt|wert|brutto|preis|eur|€|total/i,
    status: /status|stand|ergebnis|zustand|phase|erledigt/i,
    titel: /betreff|titel|leistung|bezeich|projekt|vorhaben|objekt|gewerk|beschreib/i
  };
  function kopfZeile(tab) {
    for (var i = 0; i < Math.min(10, tab.length); i++) {
      var r = tab[i], text = r.filter(function (c) { return c !== "" && c != null && isNaN(zahlLesen(c)) && !datumLesen(c); }).length;
      if (text >= 2) return i;
    }
    return -1;
  }
  function zuordnen(kopf, daten) {
    var n = kopf.length, z = {}, frei = {};
    var anteil = function (i, f) { var ok = 0, tot = 0; daten.slice(0, 200).forEach(function (r) { if (r[i] !== "" && r[i] != null) { tot++; if (f(r[i])) ok++; } }); return tot ? ok / tot : 0; };
    ["datum", "betrag", "status", "kunde", "titel"].forEach(function (k) {
      var kand = [];
      for (var i = 0; i < n; i++) if (!frei[i] && MUSTER[k].test(kopf[i] || "")) kand.push(i);
      if (k === "betrag") {
        var netto = kand.filter(function (i) { return /netto/i.test(kopf[i]); });
        if (netto.length) kand = netto.concat(kand.filter(function (i) { return netto.indexOf(i) < 0; }));
        kand = kand.filter(function (i) { return anteil(i, function (v) { return isFinite(zahlLesen(v)); }) > .6; });
        if (!kand.length) for (var j = 0; j < n; j++) if (!frei[j] && anteil(j, function (v) { var x = zahlLesen(v); return isFinite(x) && x >= 50; }) > .7 && anteil(j, function (v) { return !!datumLesen(v); }) < .3) { kand.push(j); break; }
      }
      if (k === "datum") {
        kand = kand.filter(function (i) { return anteil(i, function (v) { return !!datumLesen(v); }) > .6; });
        if (!kand.length) for (var d = 0; d < n; d++) if (!frei[d] && anteil(d, function (v) { return !!datumLesen(v); }) > .7) { kand.push(d); break; }
      }
      z[k] = kand.length ? kand[0] : -1;
      if (z[k] > -1) frei[z[k]] = 1;
    });
    return z;
  }

  /* ---------- Status deuten ---------- */
  var GEWONNEN = /auftrag|angenommen|gewonnen|beauftragt|best[äa]tigt|erteilt|rechnung|abgerechnet|zusage|ausgef[üu]hrt|fertig|bezahlt/i;
  var VERLOREN = /abgelehnt|verloren|storn|abgesagt|kein interesse|absage|zur[üu]ckgezogen|ung[üu]ltig|verfallen|erledigt.*ohne|nicht beauftragt/i;
  function statusArt(v) {
    var s = String(v == null ? "" : v);
    if (!s.trim()) return "offen";
    if (/nicht beauftragt|kein auftrag|ohne auftrag/i.test(s)) return "verloren";
    if (VERLOREN.test(s)) return "verloren";
    if (GEWONNEN.test(s)) return "gewonnen";
    return "offen";
  }

  /* ---------- Zustand ---------- */
  var S = { tab: null, kopf: [], daten: [], z: null, quelle: "" };
  var GRUPPEN = [
    { k: "neu", t: "jünger als 1 Monat", q: 15, hint: "jetzt nachfassen, höchste Chance" },
    { k: "m3", t: "1 bis 3 Monate", q: 10, hint: "freundlich nachhaken" },
    { k: "m12", t: "3 bis 12 Monate", q: 5, hint: "mit neuem Anlass reaktivieren" },
    { k: "alt", t: "älter als 12 Monate", q: 0, hint: "im Check nicht mitgerechnet" },
    { k: "ohne", t: "ohne Datum", q: 5, hint: "Datum fehlt in der Liste" }
  ];

  /* ---------- Laden ---------- */
  function laden(tab, quelle) {
    tab = (tab || []).filter(function (r) { return r && r.some(function (c) { return String(c == null ? "" : c).trim() !== ""; }); });
    if (tab.length < 2) return fehler("In der Liste wurden keine Zeilen gefunden. Bitte prüfen Sie die Datei oder fügen Sie die Zeilen mit Überschrift ein.");
    var k = kopfZeile(tab);
    var kopf = k > -1 ? tab[k].map(function (c) { return String(c == null ? "" : c).trim(); }) : tab[0].map(function (_, i) { return "Spalte " + (i + 1); });
    var daten = tab.slice(k > -1 ? k + 1 : 0);
    var breite = Math.max.apply(null, [kopf.length].concat(daten.map(function (r) { return r.length; })));
    for (var i = kopf.length; i < breite; i++) kopf.push("Spalte " + (i + 1));
    S.tab = tab; S.kopf = kopf; S.daten = daten; S.quelle = quelle; S.z = zuordnen(kopf, daten);
    $("#ac-fehler").hidden = true;
    zeigeZuordnung();
    rechnen();
    $("#ac-schritt2").hidden = false; $("#ac-ergebnis").hidden = false;
    setTimeout(function () { $("#ac-ergebnis").scrollIntoView({ behavior: ruhig ? "auto" : "smooth", block: "start" }); }, 60);
  }
  function fehler(t) { var f = $("#ac-fehler"); f.textContent = t; f.hidden = false; }

  function dateiLaden(f) {
    if (!f) return;
    var name = f.name || "Datei";
    if (/\.(xlsx|xlsm|xls|ods)$/i.test(name)) {
      excelLaden(function (ok) {
        if (!ok) return fehler("Excel-Dateien konnten gerade nicht gelesen werden. Bitte speichern Sie die Liste in Excel als „CSV UTF-8“ oder kopieren Sie die Zeilen und fügen Sie sie unten ein.");
        var r = new FileReader();
        r.onload = function () {
          try {
            var wb = window.XLSX.read(new Uint8Array(r.result), { type: "array", cellDates: true });
            var ws = wb.Sheets[wb.SheetNames[0]];
            laden(window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" }), name);
          } catch (e) { fehler("Die Excel-Datei ließ sich nicht lesen. Bitte als CSV speichern oder die Zeilen einfügen."); }
        };
        r.readAsArrayBuffer(f);
      });
      return;
    }
    var r = new FileReader();
    r.onload = function () {
      var txt = String(r.result);
      if (/�/.test(txt)) { var r2 = new FileReader(); r2.onload = function () { laden(textZuTabelle(r2.result), name); }; r2.readAsText(f, "windows-1252"); return; }
      laden(textZuTabelle(txt), name);
    };
    r.readAsText(f, "utf-8");
  }
  var excelStatus = 0, excelWarte = [];
  function excelLaden(cb) {
    if (window.XLSX) return cb(true);
    excelWarte.push(cb); if (excelStatus) return; excelStatus = 1;
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = function () { excelWarte.splice(0).forEach(function (f) { f(!!window.XLSX); }); excelStatus = 0; };
    s.onerror = function () { excelWarte.splice(0).forEach(function (f) { f(false); }); excelStatus = 0; };
    document.head.appendChild(s);
  }

  /* ---------- Beispieldaten (erfunden) ---------- */
  function beispiel() {
    var namen = ["Familie Huber", "Brandl", "Wohnbau Fürth GmbH", "Schmitt", "Familie Meier", "Forster", "Hausverwaltung Kranz", "Wagner", "Neumann", "Familie Roth", "Kaiser", "Zahnarztpraxis Dr. Lang", "Familie Weber", "Bauer", "Hoffmann", "Becker", "Schulz", "Familie Koch", "Richter", "Klein"];
    var leist = ["Rollläden elektrisch, 4 Stück", "Fenstertausch EG, 6 Fenster", "Terrassendach mit Glas", "Markise 5 m", "Insektenschutz, 8 Rahmen", "Rollladen-Reparatur Gurt", "Smart-Home-Steuerung Rollläden", "Haustür mit Seitenteil", "Raffstores Südseite", "Wintergarten-Beschattung", "Fenster Dachgeschoss, 3 Stück", "Glasschiebewände Terrasse"];
    var basis = [2800, 6400, 14500, 3900, 1100, 380, 2100, 4800, 7200, 3300, 3600, 11800];
    var heute = new Date(), seed = 7;
    var zufall = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var tab = [["Angebotsnr.", "Datum", "Kunde", "Betreff", "Netto", "Status"]];
    for (var i = 0; i < 136; i++) {
      var tage = Math.floor(zufall() * 430), d = new Date(heute.getTime() - tage * 864e5);
      var li = Math.floor(zufall() * leist.length), wert = Math.round(basis[li] * (0.7 + zufall() * 0.7) / 10) * 10;
      var r = zufall(), st = r < 0.29 ? "Auftrag erteilt" : r < 0.43 ? "Abgelehnt" : r < 0.47 ? "Storniert" : "Offen";
      if (tage < 20 && st !== "Offen" && zufall() < 0.6) st = "Offen";
      tab.push(["AN-" + (2025000 + 136 - i), ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear(), namen[Math.floor(zufall() * namen.length)], leist[li], wert.toLocaleString("de-DE") + ",00", st]);
    }
    laden(tab, "Beispieldaten (erfunden)");
  }

  /* ---------- Zuordnung anzeigen ---------- */
  var FELDER = [["datum", "Datum"], ["kunde", "Kunde"], ["betrag", "Betrag (netto)"], ["status", "Status"], ["titel", "Betreff / Leistung"]];
  function zeigeZuordnung() {
    var box = $("#ac-zuordnung");
    var opts = function (sel) { return '<option value="-1">– nicht vorhanden –</option>' + S.kopf.map(function (k, i) { return '<option value="' + i + '"' + (i === sel ? " selected" : "") + ">" + esc(k || "Spalte " + (i + 1)) + "</option>"; }).join(""); };
    box.innerHTML = FELDER.map(function (f) { return '<label><span>' + f[1] + (f[0] === "betrag" ? ' <b class="ac-pflicht">nötig</b>' : "") + '</span><select data-feld="' + f[0] + '">' + opts(S.z[f[0]]) + "</select></label>"; }).join("");
    $$("select", box).forEach(function (s) { s.addEventListener("change", function () { S.z[s.getAttribute("data-feld")] = +s.value; rechnen(); }); });
    $("#ac-quelle").textContent = S.quelle + " · " + zahl(S.daten.length) + " Zeilen erkannt";
    var vorschau = S.daten.slice(0, 3);
    $("#ac-vorschau").innerHTML = "<thead><tr>" + S.kopf.map(function (k) { return "<th>" + esc(k) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      vorschau.map(function (r) { return "<tr>" + S.kopf.map(function (_, i) { var v = r[i]; if (v instanceof Date) v = v.toLocaleDateString("de-DE"); return "<td>" + esc(v) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";
  }

  /* ---------- Rechnen ---------- */
  function quoten() { var q = {}; GRUPPEN.forEach(function (g) { var el = $('#ac-q-' + g.k); q[g.k] = el ? Math.max(0, Math.min(60, +el.value || 0)) / 100 : g.q / 100; }); return q; }
  function gruppe(d, heute) {
    if (!d) return "ohne";
    var tage = (heute - d) / 864e5;
    return tage < 30 ? "neu" : tage < 91 ? "m3" : tage < 365 ? "m12" : "alt";
  }
  function rechnen() {
    var z = S.z, heute = new Date();
    if (z.betrag < 0) { $("#ac-ergebnis-inhalt").hidden = true; $("#ac-hinweis-betrag").hidden = false; return; }
    $("#ac-ergebnis-inhalt").hidden = false; $("#ac-hinweis-betrag").hidden = true;
    var mitStatus = z.status > -1;
    var rows = S.daten.map(function (r) {
      return { betrag: zahlLesen(r[z.betrag]), datum: z.datum > -1 ? datumLesen(r[z.datum]) : null, kunde: z.kunde > -1 ? r[z.kunde] : "", titel: z.titel > -1 ? r[z.titel] : "", art: mitStatus ? statusArt(r[z.status]) : "offen", statusText: mitStatus ? r[z.status] : "" };
    }).filter(function (r) { return isFinite(r.betrag) && r.betrag > 0; });
    if (!rows.length) { fehler("In der gewählten Betragsspalte stehen keine Zahlen. Bitte wählen Sie unten die richtige Spalte."); return; }
    $("#ac-fehler").hidden = true;

    var summe = function (a) { return a.reduce(function (s, r) { return s + r.betrag; }, 0); };
    var gew = rows.filter(function (r) { return r.art === "gewonnen"; }), ver = rows.filter(function (r) { return r.art === "verloren"; }), off = rows.filter(function (r) { return r.art === "offen"; });
    var quoteEl = $("#ac-quote-schaetz"), schaetz = Math.max(0, Math.min(90, +(quoteEl && quoteEl.value) || 30)) / 100;
    $("#ac-ohne-status").hidden = mitStatus;
    var faktorOffen = mitStatus ? 1 : (1 - schaetz);   // ohne Status: geschätzter Anteil offener Angebote
    var q = quoten(), grp = {};
    GRUPPEN.forEach(function (g) { grp[g.k] = { n: 0, wert: 0 }; });
    off.forEach(function (r) { var k = gruppe(r.datum, heute); grp[k].n++; grp[k].wert += r.betrag; });
    var potenzial = 0;
    GRUPPEN.forEach(function (g) { grp[g.k].n *= faktorOffen; grp[g.k].wert *= faktorOffen; grp[g.k].pot = grp[g.k].wert * q[g.k]; potenzial += grp[g.k].pot; });

    var offenWert = summe(off) * faktorOffen, offenN = off.length * faktorOffen;
    var entschieden = gew.length + ver.length;
    var abschluss = mitStatus && rows.length ? gew.length / rows.length : schaetz;
    var daten = rows.map(function (r) { return r.datum; }).filter(Boolean).sort(function (a, b) { return a - b; });
    var monate = daten.length > 1 ? Math.max(1, (daten[daten.length - 1] - daten[0]) / (864e5 * 30.4)) : null;

    setze("anzahl", zahl(rows.length)); setze("gesamt", euro(summe(rows)));
    setze("offenN", zahl(offenN)); setze("offenW", euro(offenWert));
    zaehle("pot", potenzial); setze("auftraege", zahl(potenzial / Math.max(1, summe(rows) / rows.length)));
    setze("quote", Math.round(abschluss * 100) + " %" + (mitStatus ? "" : " (Ihre Schätzung)"));
    setze("schnitt", euro(summe(rows) / rows.length));
    setze("promonat", monate ? zahl(rows.length / monate) : "–");
    setze("zeitraum", monate ? zahl(monate) + " Monate" : "–");
    setze("offenAnteil", rows.length ? Math.round(offenN / rows.length * 100) + " %" : "–");

    $("#ac-gruppen").innerHTML = GRUPPEN.filter(function (g) { return g.k !== "ohne" || grp.ohne.n > 0; }).map(function (g) {
      var G = grp[g.k], max = Math.max.apply(null, GRUPPEN.map(function (x) { return grp[x.k].wert; })) || 1;
      return '<tr><td><b>' + g.t + '</b><small>' + g.hint + '</small></td><td>' + zahl(G.n) + '</td><td><span class="ac-balken"><i style="width:' + Math.round(G.wert / max * 100) + '%"></i></span>' + euro(G.wert) + '</td><td><input id="ac-q-' + g.k + '" type="number" min="0" max="60" step="1" value="' + Math.round(q[g.k] * 100) + '" aria-label="Annahme Quote ' + g.t + '"> %</td><td><b>' + euro(G.pot) + '</b></td></tr>';
    }).join("");
    $$("#ac-gruppen input").forEach(function (i) { i.addEventListener("change", rechnen); });

    // zuerst nachfassen: offene Angebote 0–12 Monate, nach Wert
    var verdeckt = $("#ac-namen") && $("#ac-namen").checked;
    var top = off.filter(function (r) { var g = gruppe(r.datum, heute); return g !== "alt"; }).sort(function (a, b) { return b.betrag - a.betrag; }).slice(0, 10);
    $("#ac-top").innerHTML = top.length ? top.map(function (r, i) {
      var name = verdeckt ? "Kunde " + (i + 1) : (r.kunde || "–");
      return "<tr><td>" + esc(name) + (r.titel ? "<small>" + esc(r.titel) + "</small>" : "") + "</td><td>" + (r.datum ? r.datum.toLocaleDateString("de-DE") : "–") + "</td><td>" + euro(r.betrag) + "</td></tr>";
    }).join("") : '<tr><td colspan="3">Keine offenen Angebote der letzten 12 Monate gefunden.</td></tr>';
    $("#ac-top-hinweis").hidden = mitStatus;

    var monat = 721;
    $("#ac-fazit").innerHTML = potenzial > 0
      ? "In Ihren offenen Angeboten der letzten 12 Monate stecken <b>" + euro(offenWert - grp.alt.wert) + "</b>. Werden sie konsequent nachgefasst, sind nach den Annahmen oben rund <b>" + euro(potenzial) + " zusätzlicher Umsatz</b> realistisch – ohne eine einzige neue Anfrage. Zum Vergleich: Ein mittlerer Betrieb zahlt für das betreute Cockpit " + euro(monat) + " im Monat."
      : "Nach den Annahmen ergibt sich kein Potenzial. Prüfen Sie die Spaltenzuordnung oder die Quoten.";
    var s = $("#ac-status-info");
    if (mitStatus) {
      var ohne = rows.length - entschieden - off.length;
      s.textContent = "Status erkannt: " + gew.length + " gewonnen, " + ver.length + " abgelehnt oder storniert, " + off.length + " offen." + (ohne > 0 ? "" : "");
    } else s.textContent = "Keine Status-Spalte gewählt: Der Anteil offener Angebote wird aus Ihrer geschätzten Abschlussquote berechnet.";
  }
  function setze(k, v) { $$('[data-ac="' + k + '"]').forEach(function (el) { el.textContent = v; }); }
  function zaehle(k, ziel) {
    $$('[data-ac="' + k + '"]').forEach(function (el) {
      if (ruhig) { el.textContent = euro(ziel); return; }
      var start = +(el.getAttribute("data-wert") || 0), t0 = null;
      el.setAttribute("data-wert", ziel);
      (function schritt(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 3); el.textContent = euro(start + (ziel - start) * e); if (p < 1) requestAnimationFrame(schritt); })(performance.now());
    });
  }

  /* ---------- Bedienung ---------- */
  var drop = $("#ac-drop"), datei = $("#ac-datei");
  datei.addEventListener("change", function () { dateiLaden(datei.files[0]); datei.value = ""; });
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("ist-drueber"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("ist-drueber"); }); });
  drop.addEventListener("drop", function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; dateiLaden(f); });
  $("#ac-einfuegen-los").addEventListener("click", function () { var t = $("#ac-einfuegen").value; if (!t.trim()) return fehler("Bitte zuerst Zeilen aus Excel kopieren und in das Feld einfügen."); laden(textZuTabelle(t), "Eingefügte Zeilen"); });
  $("#ac-beispiel").addEventListener("click", beispiel);
  $("#ac-quote-schaetz").addEventListener("change", rechnen);
  $("#ac-namen").addEventListener("change", rechnen);
  $("#ac-drucken").addEventListener("click", function () { window.print(); });
  $("#ac-neu").addEventListener("click", function () {
    S = { tab: null, kopf: [], daten: [], z: null, quelle: "" };
    $("#ac-schritt2").hidden = true; $("#ac-ergebnis").hidden = true; $("#ac-einfuegen").value = "";
    $("#ac-app").scrollIntoView({ behavior: ruhig ? "auto" : "smooth" });
  });

  // für Tests
  window.ANGEBOTSCHECK = { zahlLesen: zahlLesen, datumLesen: datumLesen, statusArt: statusArt, textZuTabelle: textZuTabelle, laden: laden };
})();
