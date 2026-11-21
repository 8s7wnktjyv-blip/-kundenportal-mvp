/* Kundario – Handwerk: Katalog mit Kalkulation, Datanorm-Import, GAEB-Ausschreibungen */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;
  var rund = function (x) { return Math.round((+x || 0) * 100) / 100; };
  var satz = function () { return +K.ctx.betrieb.stundensatz || 0; };
  var TYP = { leistung: "Leistung", material: "Material", lohn: "Lohn", text: "Textbaustein" };

  /* ======================= Kalkulation ======================= */
  // Preis = Lohnminuten × Stundensatz + Material-EK × (1 + Zuschlag)  – bei Material: EK × (1 + Zuschlag)
  K.kalkPreis = function (a) {
    if (a.typ === "leistung" && (a.minuten != null || a.material_ek != null)) return rund((+a.minuten || 0) / 60 * satz() + (+a.material_ek || 0) * (1 + (+a.material_zuschlag || 0) / 100));
    if (a.ek != null && a.zuschlag != null) return rund(+a.ek * (1 + +a.zuschlag / 100));
    return rund(a.preis);
  };
  K.lohnAnteil = function (a) { return a.typ === "leistung" && +a.minuten > 0 ? rund(+a.minuten / 60 * satz()) : 0; };

  /* ======================= Katalog (mit Suche auf dem Server, auch für große Großhändler-Listen) ======================= */
  var FELDER = ["text", "nr", "ean", "kategorie", "warengruppe"];
  V.katalog = async function () {
    var q = sessionStorage.getItem("kat-suche") || "", lf = sessionStorage.getItem("kat-lief") || "";
    var wo = { aktiv: true }; if (lf === "-") wo.lieferant = null; else if (lf) wo.lieferant = lf;
    var l = await K.liste("artikel", { wo: wo, suche: { q: q, felder: FELDER }, sortiere: "text.asc", limit: 201 });
    var liefs = Object.keys(K.ctx.betrieb.rabatte || {}); try { (await K.liste("artikel", { select: "lieferant", wo: { aktiv: true }, limit: 5000 })).forEach(function (a) { if (a.lieferant && liefs.indexOf(a.lieferant) < 0) liefs.push(a.lieferant); }); } catch (e) { /* egal */ }
    var mehr = l.length > 200; l = l.slice(0, 200);
    return K.kopf("Katalog", "Leistungen mit Kalkulation, Material vom Großhändler und Textbausteine – mit einem Tipp im Angebot.",
        '<button class="btn btn-outline" data-a="datanorm">Datanorm einlesen</button><button class="btn btn-outline" data-a="katImport">CSV importieren</button><button class="btn btn-signal" data-a="katNeu">Neuer Eintrag</button>') +
      '<div class="zeile-form"><input class="suche" type="search" placeholder="Bezeichnung, Artikelnummer oder EAN …" value="' + h(q) + '" data-suche="kat-suche">' +
      (liefs.length ? '<select data-a-change="katLief"><option value="">Alle Quellen</option><option value="-"' + (lf === "-" ? " selected" : "") + '>Eigene Einträge</option>' + liefs.sort().map(function (x) { return '<option value="' + h(x) + '"' + (x === lf ? " selected" : "") + ">" + h(x) + "</option>"; }).join("") + "</select>" : "") + "</div>" +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Bezeichnung</th><th>Art</th><th>Einheit</th><th class="r">Kalkulation</th><th class="r">Preis</th><th></th></tr></thead><tbody>' + l.map(function (a) {
        var kalk = a.typ === "leistung" && (a.minuten || a.material_ek) ? U.zahlText(a.minuten || 0) + " Min." + (a.material_ek ? " + Mat. " + U.eur(a.material_ek) : "") :
          a.ek != null ? "EK " + U.eur(a.ek) + (a.zuschlag != null ? " + " + U.zahlText(a.zuschlag) + " %" : "") + (a.listenpreis ? "<br><small>Liste " + U.eur(a.listenpreis) + (a.rabattgruppe ? " · RG " + h(a.rabattgruppe) : "") + "</small>" : "") : "";
        return "<tr><td><b>" + h(a.text) + "</b>" + (a.nr ? " <small>" + h(a.nr) + "</small>" : "") + (a.lieferant ? "<br><small>" + h(a.lieferant) + "</small>" : "") + (a.langtext ? "<br><small>" + h(a.langtext.slice(0, 100)) + "</small>" : "") + "</td><td>" + h(TYP[a.typ]) + "</td><td>" + h(a.einheit) + '</td><td class="r"><small>' + kalk + '</small></td><td class="r">' + (a.typ === "text" ? "" : "<b>" + U.eur(a.preis) + "</b>") + '</td><td><button class="mini" data-a="katBearb" data-id="' + a.id + '" aria-label="bearbeiten">✎</button></td></tr>';
      }).join("") + "</tbody></table></div>" + (mehr ? '<p class="still">Es gibt mehr Treffer. Bitte die Suche genauer machen.</p>' : "") :
      K.leer(q ? "Nichts gefunden." : "Noch leer. Legen Sie Ihre häufigsten Leistungen an, lesen Sie die Datanorm-Datei Ihres Großhändlers ein oder importieren Sie eine Preisliste (CSV)."));
  };
  K.aktion.katLief = function (el) { sessionStorage.setItem("kat-lief", el.value); K.neuLaden(); };

  async function katDialog(a) {
    a = a || { typ: "leistung", einheit: "Stk." };
    var r = await U.dialog(a.id ? "Eintrag bearbeiten" : "Neuer Eintrag", '<div class="raster">' + U.feld("typ", "Art", a.typ, { optionen: Object.keys(TYP).map(function (k) { return [k, TYP[k]]; }) }) + U.feld("nr", "Artikelnr. (optional)", a.nr) +
      U.feld("text", "Bezeichnung", a.text, { pflicht: true, breit: true }) + U.feld("langtext", "Beschreibung / Text", a.langtext, { typ: "textarea", breit: true }) + U.feld("einheit", "Einheit", a.einheit) + U.feld("kategorie", "Kategorie", a.kategorie) + "</div>" +
      '<fieldset class="kalk" data-kalk="leistung"><legend>Kalkulation Leistung</legend><div class="raster">' + U.feld("minuten", "Lohn: Minuten je Einheit", a.minuten != null ? U.zahlText(a.minuten) : "", { typ: "number" }) + U.feld("material_ek", "Material: Einkauf je Einheit €", a.material_ek != null ? U.zahlText(a.material_ek, 2) : "", { typ: "number" }) +
        U.feld("material_zuschlag", "Materialzuschlag %", a.material_zuschlag != null ? U.zahlText(a.material_zuschlag) : "", { typ: "number" }) + '</div><p class="still">Stundensatz aus den Einstellungen: ' + U.eur(satz()) + '. Der Lohnanteil kommt automatisch auf die Rechnung (§ 35a).</p></fieldset>' +
      '<fieldset class="kalk" data-kalk="material"><legend>Kalkulation Material</legend><div class="raster">' + U.feld("ek", "Einkaufspreis €", a.ek != null ? U.zahlText(a.ek, 2) : "", { typ: "number" }) + U.feld("zuschlag", "Zuschlag %", a.zuschlag != null ? U.zahlText(a.zuschlag) : "", { typ: "number" }) + "</div></fieldset>" +
      '<div class="raster">' + U.feld("preis", "Verkaufspreis € netto", a.preis != null ? U.zahlText(a.preis, 2) : "", { typ: "number", hilfe: "Wird aus der Kalkulation berechnet, wenn ausgefüllt." }) + '</div><p class="kalk-ergebnis" data-kalk-ergebnis></p>',
      [{ wert: "", text: "Abbrechen" }].concat(a.id ? [{ wert: "weg", text: "Löschen", gefahr: true }] : []).concat([{ wert: "ok", text: "Speichern", primaer: true }]));
    if (!r) return;
    if (r.wert === "weg") { await DB.aendern("artikel", a.id, { aktiv: false }); return K.neuLaden(); }
    var d = r.daten, z = function (k) { return d[k] !== "" && d[k] != null ? U.zahl(d[k]) : null; };
    var obj = { typ: d.typ, nr: d.nr || null, text: d.text.trim(), langtext: d.langtext || null, einheit: d.einheit || "Stk.", kategorie: d.kategorie || null,
      minuten: d.typ === "leistung" ? z("minuten") : null, material_ek: d.typ === "leistung" ? z("material_ek") : null, material_zuschlag: d.typ === "leistung" ? z("material_zuschlag") : null,
      ek: d.typ !== "leistung" ? z("ek") : null, zuschlag: d.typ !== "leistung" ? z("zuschlag") : null, preis: z("preis") || 0 };
    var kalk = K.kalkPreis(obj); if ((obj.minuten != null || obj.material_ek != null || (obj.ek != null && obj.zuschlag != null)) && kalk) obj.preis = kalk;
    if (a.id) await DB.aendern("artikel", a.id, obj); else await K.neu("artikel", obj);
    U.toast("Gespeichert. Preis " + U.eur(obj.preis) + (K.lohnAnteil(obj) ? ", davon Lohn " + U.eur(K.lohnAnteil(obj)) : "") + "."); K.neuLaden();
  }
  // Kalkulation im Dialog live anzeigen
  function kalkLive(f) {
    if (!f || !f.elements.typ) return; var t = f.elements.typ.value;
    f.querySelectorAll("[data-kalk]").forEach(function (fs) { fs.hidden = !(fs.dataset.kalk === t || (fs.dataset.kalk === "material" && t === "lohn")); });
    var o = { typ: t }; ["minuten", "material_ek", "material_zuschlag", "ek", "zuschlag", "preis"].forEach(function (k) { var v = f.elements[k] && f.elements[k].value; o[k] = v !== "" && v != null ? U.zahl(v) : null; });
    var p = K.kalkPreis(o), e = f.querySelector("[data-kalk-ergebnis]"); if (!e) return;
    e.innerHTML = (t === "leistung" && (o.minuten != null || o.material_ek != null)) || (t !== "leistung" && o.ek != null && o.zuschlag != null) ? "Kalkulierter Preis: <b>" + U.eur(p) + "</b>" + (K.lohnAnteil(o) ? " · Lohn " + U.eur(K.lohnAnteil(o)) + " · Material " + U.eur(p - K.lohnAnteil(o)) : "") : "";
  }
  document.addEventListener("input", function (e) { var f = e.target.closest("dialog form"); if (f && f.querySelector("[data-kalk-ergebnis]")) kalkLive(f); });
  document.addEventListener("change", function (e) { var f = e.target.closest("dialog form"); if (f && f.querySelector("[data-kalk-ergebnis]")) kalkLive(f); });
  new MutationObserver(function () { var f = document.querySelector("dialog[open] form [data-kalk-ergebnis]"); if (f && !f.dataset.init) { f.dataset.init = 1; kalkLive(f.closest("form")); } }).observe(document.body, { childList: true, subtree: true });
  K.aktion.katNeu = function () { return katDialog(); };
  K.aktion.katBearb = async function (el) { return katDialog(await DB.eins("artikel", el.dataset.id)); };

  // Auswahl im Positionseditor – Suche läuft auf dem Server, damit auch 100.000 Artikel gehen
  K.katalogPos = function (a) {
    if (a.typ === "text") return { id: U.uuid(), typ: "text", text: a.langtext || a.text };
    var p = { id: U.uuid(), typ: "pos", text: a.text, langtext: a.langtext || "", menge: 1, einheit: a.einheit, preis: +a.preis, artikel_id: a.id };
    if (a.typ === "lohn") p.lohn = true; if (a.typ === "material") p.lohn = false;
    var la = K.lohnAnteil(a); if (la) { p.lohn_anteil = la; p.lohn = false; }
    if (a.ek != null || a.material_ek != null) p.ek = a.typ === "leistung" ? rund(+a.material_ek || 0) : +a.ek;
    return p;
  };
  K.katalogWahl = async function () {
    var gewaehlt = {};
    var suche = async function (q) { return K.liste("artikel", { wo: { aktiv: true }, suche: { q: q, felder: FELDER }, sortiere: "text.asc", limit: 60 }); };
    var zeile = function (a) { return '<label class="chk"><input type="checkbox" data-kat-id="' + a.id + '"' + (gewaehlt[a.id] ? " checked" : "") + "> <span><b>" + h(a.text) + "</b> <small>" + (a.nr ? h(a.nr) + " · " : "") + (a.typ === "text" ? "Textbaustein" : U.eur(a.preis) + " / " + h(a.einheit)) + (a.lieferant ? " · " + h(a.lieferant) : "") + "</small></span></label>"; };
    var start = await suche("");
    if (!start.length) { if (await U.bestaetigen("Ihr Katalog ist noch leer. Jetzt Einträge anlegen? Nicht gespeicherte Änderungen gehen dabei verloren.", "Zum Katalog")) K.go("katalog"); return []; }
    var cache = {}; start.forEach(function (a) { cache[a.id] = a; });
    var p = U.dialog("Aus dem Katalog", '<input type="search" class="suche" placeholder="Bezeichnung, Artikelnummer oder EAN …" data-kat-q><div class="kat-wahl" data-kat-liste>' + start.map(zeile).join("") + "</div><p class=\"still\" data-kat-info></p>", [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Einfügen", primaer: true }]);
    setTimeout(function () {
      var dlg = document.querySelector("dialog[open]"); if (!dlg) return; var inp = dlg.querySelector("[data-kat-q]"), liste = dlg.querySelector("[data-kat-liste]"), t;
      liste.addEventListener("change", function (e) { var c = e.target.closest("[data-kat-id]"); if (c) gewaehlt[c.dataset.katId] = c.checked; dlg.querySelector("[data-kat-info]").textContent = Object.keys(gewaehlt).filter(function (k) { return gewaehlt[k]; }).length + " ausgewählt"; });
      inp.addEventListener("input", function () { clearTimeout(t); t = setTimeout(async function () { var l = await suche(inp.value); l.forEach(function (a) { cache[a.id] = a; }); liste.innerHTML = l.length ? l.map(zeile).join("") : '<p class="still">Nichts gefunden.</p>'; }, 250); });
      inp.focus();
    }, 30);
    var r = await p; if (!r) return [];
    return Object.keys(gewaehlt).filter(function (k) { return gewaehlt[k] && cache[k]; }).map(function (k) { return K.katalogPos(cache[k]); });
  };

  /* ======================= Datanorm ======================= */
  var CP850 = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ ";
  K.textAusBytes = function (buf) {   // UTF-8, sonst DOS (CP850) oder Windows (1252) – je nachdem, welche Umlaute vorkommen
    var b = new Uint8Array(buf), utf = new TextDecoder("utf-8").decode(b); if (utf.indexOf("�") < 0) return utf;
    var dos = 0, win = 0; for (var i = 0; i < b.length; i++) { var c = b[i]; if (c === 0x84 || c === 0x94 || c === 0x81 || c === 0x8e || c === 0x99 || c === 0x9a || c === 0xe1) dos++; if (c === 0xe4 || c === 0xf6 || c === 0xfc || c === 0xdf || c === 0xc4 || c === 0xd6 || c === 0xdc) win++; }
    if (dos > win) { var s = ""; for (var j = 0; j < b.length; j++) s += b[j] < 128 ? String.fromCharCode(b[j]) : CP850[b[j] - 128]; return s; }
    return new TextDecoder("windows-1252").decode(b);
  };
  var EINHEIT = { ST: "Stk.", STK: "Stk.", STCK: "Stk.", "STÜCK": "Stk.", M: "m", MTR: "m", LFM: "m", M2: "m²", QM: "m²", M3: "m³", KG: "kg", L: "l", LTR: "l", PAK: "Pack.", PCK: "Pack.", PAC: "Pack.", RLL: "Rolle", ROL: "Rolle", KRT: "Karton", SAT: "Satz", SATZ: "Satz", PAA: "Paar", PAR: "Paar", STD: "Std.", H: "Std.", T: "t", DS: "Dose", EI: "Eimer", SCK: "Sack", SA: "Sack", BTL: "Beutel" };
  var PE = { 0: 1, 1: 10, 2: 100, 3: 1000 };
  var preisZahl = function (s) { s = String(s || "").trim(); if (!s) return null; if (/[.,]/.test(s)) return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0; return (parseInt(s, 10) || 0) / 100; };
  K.datanormLesen = function (text) {
    var zeilen = text.replace(/\r/g, "").split("\n"), art = {}, reihe = [], version = "", geloescht = 0;
    if (!zeilen.some(function (z) { return z.indexOf(";") > -1; })) throw new Error("Das sieht nach Datanorm 3 (ohne Semikolons) aus. Bitte beim Großhändler die Datei im Format Datanorm 4 oder 5 anfordern.");
    zeilen.forEach(function (z) {
      var f = z.split(";"), s = (f[0] || "").trim().toUpperCase();
      if (s === "V") { version = (f[1] || "").trim(); return; }
      if (s === "A") {
        var nr = (f[2] || "").trim(); if (!nr) return;
        if ((f[1] || "").trim().toUpperCase() === "L") { geloescht++; art[nr] = { nr: nr, loeschen: true }; return; }
        var pe = PE[(f[7] || "0").trim()] || 1, preis = preisZahl(f[9]); var me = (f[8] || "").trim().toUpperCase();
        var a = art[nr] || {}; if (!art[nr]) reihe.push(nr);
        art[nr] = Object.assign(a, { nr: nr, text: [f[4], f[5]].map(function (x) { return (x || "").trim(); }).filter(Boolean).join(" "), pk: (f[6] || "1").trim(), preis: preis != null ? preis / pe : null, einheit: EINHEIT[me] || (me ? me.charAt(0) + me.slice(1).toLowerCase() : "Stk."), rg: (f[10] || "").trim(), wg: (f[11] || "").trim() });
        return;
      }
      if (s === "B") { var n2 = (f[2] || "").trim(); if (!art[n2]) return; var ean = (f[8] || "").trim(); if (/^\d{8,14}$/.test(ean)) art[n2].ean = ean; if ((f[10] || "").trim()) art[n2].wg = (f[10] || "").trim(); return; }
      if (s === "P") {   // Preisänderungssatz: bis zu drei Artikel je Zeile
        for (var i = 2; i + 2 < f.length; i += 9) { var n3 = (f[i] || "").trim(), p = preisZahl(f[i + 2]); if (n3 && art[n3] && p != null && /^\s*\d+([.,]\d+)?\s*$/.test(f[i + 2] || "")) { art[n3].pk = (f[i + 1] || art[n3].pk).trim(); art[n3].preis = p; } }
      }
    });
    var liste = reihe.map(function (n) { return art[n]; }).filter(function (a) { return a && !a.loeschen && a.text && a.preis != null; });
    var gruppen = {}; liste.forEach(function (a) { if (a.pk === "1") gruppen[a.rg || "–"] = (gruppen[a.rg || "–"] || 0) + 1; });
    return { version: version, artikel: liste, rabattgruppen: gruppen, geloescht: Object.keys(art).filter(function (k) { return art[k].loeschen; }) };
  };
  K.datanormArtikel = function (dn, lieferant, rabatte, zuschlag) {   // Listenpreis − Rabatt = EK, EK + Zuschlag = Verkaufspreis
    return dn.artikel.map(function (a) {
      var liste = a.pk === "1" ? a.preis : null, rabatt = liste != null ? +(rabatte[a.rg || "–"] || 0) : 0, ek = rund(liste != null ? liste * (1 - rabatt / 100) : a.preis);
      return { betrieb_id: K.bid(), typ: "material", lieferant: lieferant, nr: a.nr, text: a.text.slice(0, 300), einheit: a.einheit, listenpreis: liste, rabattgruppe: a.rg || null, warengruppe: a.wg || null, ean: a.ean || null,
        ek: ek, zuschlag: zuschlag, preis: rund(ek * (1 + zuschlag / 100)), aktiv: true };
    });
  };
  K.aktion.datanorm = async function () {
    var r = await U.dialog("Datanorm-Datei einlesen", "<p>Ihr Großhändler stellt die Preisliste als Datanorm-Datei bereit, meist im Kundenportal unter Downloads oder auf Anfrage. Gängig sind Dateinamen wie <code>DATANORM.001</code>.</p>" +
      '<div class="raster">' + U.feld("lieferant", "Großhändler", "", { pflicht: true, ph: "z. B. Name Ihres Großhändlers" }) + U.feld("zuschlag", "Ihr Materialzuschlag %", "", { typ: "number", pflicht: true, hilfe: "Auf den Einkaufspreis, ergibt den Verkaufspreis." }) + "</div>" +
      '<input type="file" name="datei" required>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Weiter", primaer: true }]);
    if (!r) return; var f = r.dlg.querySelector("input[type=file]").files[0]; if (!f) return;
    var lief = r.daten.lieferant.trim(), zu = U.zahl(r.daten.zuschlag) || 0;
    var dn = K.datanormLesen(K.textAusBytes(await f.arrayBuffer()));
    if (!dn.artikel.length) throw new Error("In der Datei wurden keine Artikel gefunden (A-Sätze).");
    var alt = ((K.ctx.betrieb.rabatte || {})[lief]) || {}, rg = Object.keys(dn.rabattgruppen).sort();
    var d = await U.dialog("Rabatte von " + lief, "<p><b>" + dn.artikel.length.toLocaleString("de-DE") + " Artikel</b> gelesen" + (dn.version ? " (Datanorm " + h(dn.version) + ")" : "") + ". " +
      (rg.length ? "Bei Listenpreisen ziehen Sie Ihren Rabatt je Rabattgruppe ab. Die Werte stehen in Ihren Konditionen beim Großhändler.</p>" : "Alle Preise sind schon Ihre Nettopreise.</p>") +
      (rg.length ? '<div class="raster rabatt-raster">' + rg.slice(0, 80).map(function (g) { return U.feld("rg_" + g, "Rabattgruppe " + g + " (" + dn.rabattgruppen[g] + ")", alt[g] != null ? U.zahlText(alt[g]) : "", { typ: "number", ph: "Rabatt %" }); }).join("") + "</div>" : "") +
      '<p class="still">Gleiche Artikelnummern werden aktualisiert, nicht doppelt angelegt.</p>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Importieren", primaer: true }]);
    if (!d) return;
    var rab = {}; rg.forEach(function (g) { var v = d.daten["rg_" + g]; if (v !== "" && v != null) rab[g] = U.zahl(v); });
    var liste = K.datanormArtikel(dn, lief, rab, zu);
    var info = document.createElement("div"); info.className = "toast"; info.textContent = "Import läuft …"; (document.getElementById("toasts") || document.body).appendChild(info);
    try { await DB.viele("artikel", liste, "betrieb_id,lieferant,nr", function (n, gesamt) { info.textContent = "Import läuft … " + n.toLocaleString("de-DE") + " von " + gesamt.toLocaleString("de-DE"); }); }
    finally { info.remove(); }
    if (dn.geloescht.length) { var weg = await K.liste("artikel", { wo: { lieferant: lief, nr: dn.geloescht.slice(0, 200) } }); for (var i = 0; i < weg.length; i++) await DB.aendern("artikel", weg[i].id, { aktiv: false }); }
    if (K.ctx.ich.rolle === "gf") { var alle = Object.assign({}, K.ctx.betrieb.rabatte || {}); alle[lief] = rab; try { K.ctx.betrieb = await DB.aendern("betriebe", K.ctx.betrieb.id, { rabatte: alle }); } catch (e) { /* nur Geschäftsführung */ } }
    sessionStorage.setItem("kat-lief", lief); sessionStorage.setItem("kat-suche", "");
    U.toast(liste.length.toLocaleString("de-DE") + " Artikel von " + lief + " im Katalog."); K.neuLaden();
  };

  /* ======================= GAEB (Ausschreibungen) ======================= */
  var kinder = function (el, name) { return Array.prototype.filter.call(el.children, function (c) { return c.localName === name; }); };
  var kind = function (el, name) { return el && kinder(el, name)[0] || null; };
  var tief = function (el, name) { return el ? el.getElementsByTagNameNS("*", name)[0] || null : null; };
  var txt = function (el) { if (!el) return ""; var s = ""; (function lauf(n) { n.childNodes.forEach(function (c) { if (c.nodeType === 3) s += c.nodeValue; else if (c.nodeType === 1) { if (c.localName === "br") s += "\n"; lauf(c); if (c.localName === "p") s += "\n"; } }); })(el); return s.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim(); };
  var EH = { m2: "m²", m3: "m³", qm: "m²", lfm: "m", m: "m", st: "Stk.", stk: "Stk.", "stck": "Stk.", psch: "psch", pa: "psch", h: "Std.", std: "Std.", kg: "kg", t: "t", l: "l" };
  K.gaebLesen = function (xmlText) {
    var doc = new DOMParser().parseFromString(xmlText, "application/xml");
    if (doc.getElementsByTagName("parsererror").length || doc.documentElement.localName !== "GAEB") throw new Error("Keine GAEB-XML-Datei. Unterstützt wird GAEB DA XML (Dateiendung .x83, .x84, .x86, .x81). Ältere GAEB-90/2000-Dateien bitte als XML anfordern.");
    var dp = txt(tief(doc, "DP")), prj = tief(doc, "PrjInfo"), boq = tief(doc, "BoQ"); if (!boq) throw new Error("Die Datei enthält kein Leistungsverzeichnis.");
    var pos = [];
    (function body(b, oz, ebene) {
      if (!b) return;
      kinder(b, "BoQCtgy").forEach(function (c) {
        var nr = oz.concat([c.getAttribute("RNoPart") || ""]);
        pos.push({ id: U.uuid(), typ: "titel", text: nr.join(".") + " " + txt(kind(c, "LblTx")).split("\n")[0], gaeb: { oz: nr.join("."), ebene: ebene, art: "titel", gid: c.getAttribute("ID") } });
        body(kind(c, "BoQBody"), nr, ebene + 1);
      });
      kinder(b, "Itemlist").forEach(function (il) {
        kinder(il, "Item").forEach(function (it) {
          var nr = oz.concat([it.getAttribute("RNoPart") || ""]), kurz = txt(tief(it, "TextOutlTxt") || tief(it, "OutlineText")), lang = txt(tief(it, "DetailTxt"));
          var qu = txt(kind(it, "QU")), q = parseFloat(txt(kind(it, "Qty")).replace(",", ".")) || 0;
          var zusatz = !!kind(it, "ProvisIndic"), alt = !!kind(it, "ALNGroupNo") && !!kind(it, "ALNSerNo");
          if (!kurz && lang) kurz = lang.split("\n")[0].slice(0, 120);
          pos.push({ id: U.uuid(), typ: "pos", text: nr.join(".") + " " + (kurz || "Position"), langtext: lang && lang !== kurz ? lang : "", menge: q, einheit: EH[qu.toLowerCase().replace(/[^a-z0-9]/g, "")] || qu || "psch", preis: 0, optional: zusatz || alt,
            gaeb: { oz: nr.join("."), teile: nr, gid: it.getAttribute("ID"), qu: qu, art: zusatz ? "bedarf" : alt ? "alternativ" : "normal" } });
        });
      });
    })(kind(boq, "BoQBody"), [], 1);
    return { dp: dp, projekt: txt(tief(prj, "NamePrj")) || txt(tief(prj, "LblPrj")), lv: txt(tief(kind(boq, "BoQInfo"), "Name")) || txt(tief(kind(boq, "BoQInfo"), "LblTx")), auftraggeber: txt(tief(tief(doc, "OWN"), "Name1")), positionen: pos };
  };
  K.aktion.gaebImport = async function () {
    var r = await U.dialog("Ausschreibung einlesen (GAEB)", "<p>Wählen Sie die GAEB-Datei aus der Ausschreibung, meist mit der Endung <code>.x83</code>. Daraus entsteht ein Angebot mit allen Positionen und Ordnungszahlen. Sie tragen die Preise ein, auch aus dem Katalog, und geben das Angebot als GAEB-Datei (<code>.x84</code>) zurück.</p>" +
      '<div class="raster">' + (await K.kundeWahl("kunde_id", "", false)) + "</div>" + '<input type="file" name="datei" accept=".x83,.x81,.x86,.x84,.xml" required>', [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Einlesen", primaer: true }]);
    if (!r) return; var f = r.dlg.querySelector("input[type=file]").files[0]; if (!f) return;
    var g = K.gaebLesen(K.textAusBytes(await f.arrayBuffer())); if (!g.positionen.some(function (p) { return p.typ === "pos"; })) throw new Error("Keine Positionen im Leistungsverzeichnis gefunden.");
    var kid = r.daten.kunde_id; if (!kid && g.auftraggeber) { var k = await K.neu("kunden", { name: g.auftraggeber, art: "firma", notiz: "Aus GAEB-Ausschreibung" }); kid = k.id; }
    var a = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: kid || null, titel: (g.projekt || g.lv || "Ausschreibung").slice(0, 200), einleitung: "Angebot zur Ausschreibung " + (g.lv || g.projekt || "") + ". Grundlage ist das Leistungsverzeichnis des Auftraggebers.", mwst: K.mwst(), steuerfall: K.reStandard().steuerfall, positionen: g.positionen });
    U.toast(g.positionen.filter(function (p) { return p.typ === "pos"; }).length + " Positionen übernommen. Jetzt Preise eintragen."); K.go("angebote/" + a.id);
  };
  var xe = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]; }); };
  var z3 = function (x) { return (Math.round(x * 1000) / 1000).toFixed(3); }, z2 = function (x) { return rund(x).toFixed(2); };
  K.gaebAngebot = function (a, betrieb) {   // GAEB DA XML 3.3, Phase 84 (Angebotsabgabe)
    var root = { kinder: [], items: [] }, stapel = [root];
    a.positionen.forEach(function (p) {
      if (!p.gaeb) return;
      if (p.gaeb.art === "titel") { var e = p.gaeb.ebene; while (stapel.length > e) stapel.pop(); var t = { p: p, kinder: [], items: [] }; stapel[stapel.length - 1].kinder.push(t); stapel.push(t); return; }
      stapel[stapel.length - 1].items.push(p);
    });
    var summe = function (n) { return n.items.reduce(function (s, p) { return s + (p.optional ? 0 : U.posNetto(p)); }, 0) + n.kinder.reduce(function (s, k) { return s + summe(k); }, 0); };
    var ctgy = function (n) {
      var nr = n.p.gaeb.oz.split(".").pop();
      return '<BoQCtgy ID="' + xe(n.p.gaeb.gid || "T" + n.p.id.slice(0, 8)) + '" RNoPart="' + xe(nr) + '"><LblTx><p><span>' + xe(n.p.text.replace(/^[\d.]+\s*/, "")) + "</span></p></LblTx><BoQBody>" + inhalt(n) + "</BoQBody><Totals><Total>" + z2(summe(n)) + "</Total></Totals></BoQCtgy>";
    };
    var inhalt = function (n) {
      return n.kinder.map(ctgy).join("") + (n.items.length ? "<Itemlist>" + n.items.map(function (p) {
        var nr = p.gaeb.teile ? p.gaeb.teile[p.gaeb.teile.length - 1] : p.gaeb.oz.split(".").pop(), up = U.zahl(p.preis) * (1 - U.zahl(p.rabatt) / 100);
        return '<Item ID="' + xe(p.gaeb.gid || "P" + p.id.slice(0, 8)) + '" RNoPart="' + xe(nr) + '"><Qty>' + z3(U.zahl(p.menge)) + "</Qty><QU>" + xe(p.gaeb.qu || p.einheit) + "</QU><UP>" + z2(up) + "</UP><IT>" + z2(U.posNetto(p)) + "</IT>" +
          "<Description><CompleteText><OutlineText><OutlTxt><TextOutlTxt><p><span>" + xe(p.text.replace(/^[\d.]+\s*/, "")) + "</span></p></TextOutlTxt></OutlTxt></OutlineText></CompleteText></Description></Item>";
      }).join("") + "</Itemlist>" : "");
    };
    var jetzt = new Date();
    return '<?xml version="1.0" encoding="UTF-8"?>\n<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/DA84/3.3"><GAEBInfo><Version>3.3</Version><VersDate>2021-05</VersDate><Date>' + U.isoTag(jetzt) + "</Date><Time>" + jetzt.toTimeString().slice(0, 8) + "</Time><ProgSystem>Kundario</ProgSystem></GAEBInfo>" +
      "<PrjInfo><NamePrj>" + xe(a.titel) + "</NamePrj></PrjInfo><Award><DP>84</DP><AwardInfo><Cur>EUR</Cur></AwardInfo>" +
      "<CTR><Address><Name1>" + xe(betrieb.name) + "</Name1><Street>" + xe(betrieb.strasse) + "</Street><PCode>" + xe(betrieb.plz) + "</PCode><City>" + xe(betrieb.ort) + "</City><Phone>" + xe(betrieb.telefon) + "</Phone><Email>" + xe(betrieb.email) + "</Email></Address></CTR>" +
      '<BoQ ID="LV1"><BoQInfo><Name>' + xe(a.nr) + "</Name><LblTx><p><span>" + xe(a.titel) + "</span></p></LblTx></BoQInfo><BoQBody>" + inhalt(root) + "</BoQBody><Totals><Total>" + z2(summe(root)) + "</Total><VAT>" + z2(a.mwst) + "</VAT><TotAftDisc>" + z2(summe(root)) + "</TotAftDisc></Totals></BoQ></Award></GAEB>";
  };
  K.aktion.gaebExport = async function (el) {
    if (K.angebotSpeichernFallsOffen) await K.angebotSpeichernFallsOffen();
    var a = await DB.eins("angebote", el.dataset.id), ohne = a.positionen.filter(function (p) { return p.typ === "pos" && p.gaeb && !p.optional && !(U.zahl(p.preis) > 0); });
    if (ohne.length && !(await U.bestaetigen(ohne.length + " Positionen haben noch keinen Preis (z. B. " + ohne[0].text.slice(0, 60) + "). Trotzdem exportieren?", "Trotzdem"))) return;
    var x = K.gaebAngebot(a, K.ctx.betrieb), b = document.createElement("a"); b.href = URL.createObjectURL(new Blob([x], { type: "application/xml" })); b.download = (a.nr || "angebot") + ".x84"; document.body.appendChild(b); b.click(); b.remove();
    await K.verlauf("angebot", a.id, "GAEB-Angebot (.x84) erstellt"); U.toast("GAEB-Datei gespeichert. Vor der Abgabe einmal im Vergabeportal oder einem GAEB-Prüfprogramm öffnen.");
  };
})();
