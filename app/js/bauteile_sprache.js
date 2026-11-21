/* Kundario – Bauteile im Aufmaß per Sprache erfassen
   Beispiel: „Fenster Küche 1230 mal 1480 zwei Stück Dreh-Kipp“ → Art, Lage, Maße (mm), Anzahl, Ausführung.
   Maße ohne Einheit gelten als Millimeter; „1,23 mal 1,48“ oder „… Meter“ als Meter, „… Zentimeter“ als cm. Nutzt die Spracherkennung des Browsers. */
(function () {
  "use strict";
  var K = window.K, U = window.U, V = K.views, h = U.h;
  var ZAHL = { ein: 1, eins: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, "zwölf": 12 };
  var ART_WORT = [[/terrassen(dach|überdachung)|überdachung|carport/, "Terrassendach / Überdachung"], [/senkrecht ?markise|screen|zip/, "Senkrechtmarkise / Screen"], [/markise/, "Markise"], [/raffstore|jalousie/, "Raffstore"],
    [/roll(l)?aden/, "Rollladen"], [/insektenschutz|fliegengitter|insektengitter/, "Insektenschutz"], [/haus ?tür|eingangstür/, "Haustür"], [/balkon ?tür|fenster ?tür|terrassen ?tür/, "Fenstertür / Balkontür"], [/fenster/, "Fenster"]];
  var mmAus = function (zahl, einheit) {
    var z = parseFloat(String(zahl).replace(/\.(?=\d{3}\b)/g, "").replace(",", ".")); if (isNaN(z)) return "";
    if (/^(zentimeter|cm)$/.test(einheit || "")) z *= 10; else if (/^(meter|m)$/.test(einheit || "") || z < 10) z *= 1000;
    return String(Math.round(z));
  };
  K.btAusSprache = function (text) {
    var t = " " + String(text || "").toLowerCase().replace(/[.!?]+$/, "").replace(/(\d)\s*,\s*(\d)/g, "$1,$2") + " ", e = { anzahl: "1" };
    for (var i = 0; i < ART_WORT.length; i++) { var m = ART_WORT[i][0].exec(t); if (m) { e.art = ART_WORT[i][1]; e._artEnde = m.index + m[0].length; break; } }
    var EINH = "(millimeter|mm|zentimeter|cm|meter|m)?";
    var mass = new RegExp("(\\d[\\d.,]*)\\s*" + EINH + "\\s*(?:mal|x|×|auf)\\s*(\\d[\\d.,]*)\\s*" + EINH + "(?=\\s|$)").exec(t);
    if (mass) { var e2 = mass[4] || mass[2]; e.b = mmAus(mass[1], mass[2] || e2); e.h = mmAus(mass[3], e2); }
    var anz = /(?:anzahl\s+)?(\d+|ein|eins|eine|einen|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\s*(?:stück|stk|teile|elemente)\b/.exec(t) || /anzahl\s+(\d+|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)/.exec(t);
    if (anz) e.anzahl = String(ZAHL[anz[1]] || parseInt(anz[1], 10) || 1);
    // Lage: Wörter zwischen Art und Maß bzw. nach „im/in der/für“
    if (e.art != null) {
      var bis = mass ? mass.index : (anz ? anz.index : t.length), stueck = t.slice(e._artEnde, bis).replace(/\b(im|in der|in dem|in|für|beim|bei|am|an der|vom|von der|das|die|den|dem|der)\b/g, " ").replace(/\s+/g, " ").trim();
      if (stueck && stueck.length <= 40) e.lage = stueck.split(" ").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
    }
    // Ausführung: bekannte Vorschläge zur Art im Text finden
    if (e.art) {
      var such = " " + t.replace(/-/g, " ").replace(/\s+/g, " ") + " ", gef = [];
      K.btArt(e.art).aus.slice().sort(function (x, y) { return y.length - x.length; }).forEach(function (o) {   // längere zuerst: „Dreh-Kipp“ vor „Kipp“
        var w = " " + o.toLowerCase().replace(/-/g, " ") + " "; if (such.indexOf(w) > -1) { gef.push(o); such = such.replace(w, " "); } });
      gef.sort(function (x, y) { return t.indexOf(x.toLowerCase()) - t.indexOf(y.toLowerCase()); });
      if (gef.length) e.aus = gef.join(", ");
    }
    delete e._artEnde; return e;
  };
  // Erkanntes in eine neue (oder die erste leere) Bauteilzeile schreiben
  K.btSprachText = function (text) {
    var e = K.btAusSprache(text), tb = document.querySelector("table.bt tbody"); if (!tb) return null;
    if (!e.art && !e.b) { U.toast("Nicht verstanden. Beispiel: „Fenster Küche 1230 mal 1480 zwei Stück Dreh-Kipp“.", "fehler"); return e; }
    var leer = Array.prototype.filter.call(tb.rows, function (r) { return !r.hidden && !["l", "b", "h", "x"].some(function (k) { return r.querySelector("[name^=bt_" + k + "_]").value.trim(); }); })[0];
    if (!leer) { K.aktion.btNeu(); leer = tb.rows[tb.rows.length - 1]; }
    var i = leer.dataset.bt, setz = function (k, v) { if (v == null || v === "") return; var f = leer.querySelector("[name=bt_" + k + "_" + i + "]"); f.value = v; f.dispatchEvent(new Event(k === "a" ? "change" : "input", { bubbles: true })); };
    setz("a", e.art); setz("l", e.lage); setz("b", e.b); setz("h", e.h); setz("n", e.anzahl); setz("x", e.aus);
    U.toast("Erkannt: " + [e.art, e.lage, e.b && e.h ? e.b + " × " + e.h + " mm" : "", e.anzahl + " Stk.", e.aus].filter(Boolean).join(", ") + " – bitte prüfen und speichern.");
    return e;
  };
  // Mikrofon-Knopf neben „+ Bauteil“
  var altDanach = V.aufmass.danach;
  V.aufmass.danach = function (id, extra) {
    if (altDanach) altDanach(id, extra);
    var k = document.querySelector(".bt-bereich [data-a=btNeu]"); if (!k || !K.spracheGeht || !K.spracheGeht() || document.querySelector("[data-a=btSprechen]")) return;
    k.insertAdjacentHTML("afterend", ' <button type="button" class="btn btn-outline klein" data-a="btSprechen" title="z. B. „Fenster Küche 1230 mal 1480 zwei Stück Dreh-Kipp“">' + K.MIC + " Bauteil sprechen</button>");
  };
  K.aktion.btSprechen = async function (el) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
    var rec = new SR(); rec.lang = "de-DE"; rec.interimResults = false; rec.maxAlternatives = 1;
    el.classList.add("hoert"); U.toast("Ich höre zu … z. B. „Fenster Küche 1230 mal 1480 zwei Stück“");
    await new Promise(function (fertig) {
      rec.onresult = function (ev) { K.btSprachText(ev.results[0][0].transcript); };
      rec.onerror = function (ev) { U.toast(ev.error === "not-allowed" ? "Mikrofon ist nicht freigegeben. Bitte in den Einstellungen des Browsers erlauben." : "Nichts verstanden. Bitte noch einmal.", "fehler"); };
      rec.onend = function () { el.classList.remove("hoert"); fertig(); };
      try { rec.start(); } catch (x) { el.classList.remove("hoert"); fertig(); }
    });
  };
})();
