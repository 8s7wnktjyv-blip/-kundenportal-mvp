/* Kundario – Aufmaß mit Formeln, Nachkalkulation je Position, Stundensatz-Rechner */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;
  var rund = function (x) { return Math.round(x * 100) / 100; };

  /* ======================= Formeln im Aufmaß ======================= */
  // Erlaubt: Zahlen mit Komma, + − × ÷ * / x : und Klammern. Kein eval.
  K.formel = function (text) {
    var s = String(text || "").toLowerCase().replace(/\s+/g, "").replace(/[×x]/g, "*").replace(/[÷:]/g, "/").replace(/−|–/g, "-").replace(/(\d)\.(?=\d{3}(\D|$))/g, "$1").replace(/,/g, ".");
    if (!s) return null; var i = 0;
    function zahl() { var m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i)); if (!m) throw new Error("Zahl erwartet"); i += m[0].length; return parseFloat(m[0]); }
    function faktor() {
      if (s[i] === "-") { i++; return -faktor(); } if (s[i] === "+") { i++; return faktor(); }
      if (s[i] === "(") { i++; var v = summe(); if (s[i] !== ")") throw new Error("Klammer fehlt"); i++; return v; }
      return zahl();
    }
    function produkt() { var v = faktor(); while (s[i] === "*" || s[i] === "/") { var op = s[i++], w = faktor(); if (op === "/" && w === 0) throw new Error("Division durch 0"); v = op === "*" ? v * w : v / w; } return v; }
    function summe() { var v = produkt(); while (s[i] === "+" || s[i] === "-") { var op = s[i++], w = produkt(); v = op === "+" ? v + w : v - w; } return v; }
    var erg = summe(); if (i < s.length) throw new Error("Unerwartetes Zeichen „" + s[i] + "“"); return Math.round(erg * 1000) / 1000;
  };
  var formelSicher = function (t) { try { return K.formel(t); } catch (e) { return NaN; } };
  // Gesprochenes in eine Formel: „zwei Komma fünf mal drei minus eins“ → 2,5*3-1
  var ZAHLW = { null: 0, eins: 1, ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, "zwölf": 12, zwanzig: 20, "dreißig": 30, halb: 0.5 };
  K.spracheZuFormel = function (t) {
    return String(t || "").toLowerCase().replace(/geteilt durch|durch/g, " / ").replace(/\bmal\b/g, " * ").replace(/\bplus\b|\bund\b/g, " + ").replace(/\bminus\b|\babzüglich\b|\babzgl\.?/g, " - ")
      .replace(/klammer auf/g, " ( ").replace(/klammer zu/g, " ) ").replace(/\bkomma\b/g, ",").replace(/\bmeter\b|\bm\b|\bzentimeter\b/g, " ")
      .replace(/[a-zäöüß]+/g, function (w) { return ZAHLW[w] != null ? String(ZAHLW[w]).replace(".", ",") : " "; })
      .replace(/(\d)\s*,\s*(\d)/g, "$1,$2").replace(/\s+/g, "").replace(/\*+/g, "*");
  };
  var zeilenAus = function (d) { return (d && d.zeilen) || []; };
  K.amZeilenSummen = function (daten) {
    var g = [], idx = {};
    zeilenAus(daten).forEach(function (z) { var w = formelSicher(z.formel); if (isNaN(w) || w == null) return; var k = (z.pos || "").trim() || "Ohne Position"; if (idx[k] == null) { idx[k] = g.length; g.push({ pos: k, einheit: z.einheit || "", menge: 0, n: 0 }); } g[idx[k]].menge += w; g[idx[k]].n++; });
    g.forEach(function (x) { x.menge = rund(x.menge); }); return g;
  };
  K.amFormelPos = function (daten) { return K.amZeilenSummen(daten).filter(function (x) { return x.menge > 0; }).map(function (x) { return { id: U.uuid(), typ: "pos", text: x.pos, menge: x.menge, einheit: x.einheit || "Stk.", preis: 0 }; }); };
  K.amDaten = function (f, raeume) {
    var z = []; for (var i = 0; f.elements["fz_f_" + i]; i++) { var o = { pos: f.elements["fz_p_" + i].value.trim(), text: f.elements["fz_t_" + i].value.trim(), formel: f.elements["fz_f_" + i].value.trim(), einheit: f.elements["fz_e_" + i].value.trim() }; if (o.pos || o.text || o.formel) z.push(o); }
    return { raeume: raeume, zeilen: f.querySelector("[data-fz]") ? z : zeilenAus(K._aufmass && K._aufmass.daten) };
  };
  var fzZeile = function (z, i) {
    var w = formelSicher(z.formel), mic = K.spracheGeht && K.spracheGeht() ? '<button type="button" class="mini mic" data-a="diktat" data-formel="1" aria-label="Formel sprechen" title="Formel sprechen">' + K.MIC + "</button>" : "";
    return '<tr data-fz="' + i + '"><td><input name="fz_p_' + i + '" value="' + h(z.pos || "") + '" placeholder="z. B. Wandfläche streichen" list="fz-pos"></td><td><input name="fz_t_' + i + '" value="' + h(z.text || "") + '" placeholder="z. B. Küche Nordwand"></td>' +
      '<td><span class="fz-formel"><input name="fz_f_' + i + '" value="' + h(z.formel || "") + '" placeholder="z. B. 2*3,5-1,2*1,4" inputmode="text" autocomplete="off" data-fz-formel>' + mic + '</span></td><td><input name="fz_e_' + i + '" value="' + h(z.einheit || "m²") + '" list="einheiten"></td>' +
      '<td class="r" data-fz-erg>' + (z.formel ? (isNaN(w) ? '<span class="pill rot">Formel prüfen</span>' : U.zahlText(w)) : "") + '</td><td><button type="button" class="mini" data-a="fzWeg" data-i="' + i + '" aria-label="Zeile entfernen">×</button></td></tr>';
  };
  function formelBereich(daten) {
    var z = zeilenAus(daten).concat([{ einheit: (zeilenAus(daten).slice(-1)[0] || {}).einheit || "m²" }]), s = K.amZeilenSummen(daten);
    return '<section class="fz-bereich"><h3>Weitere Maße mit Formel</h3><p class="still">Für alles, was kein rechteckiger Raum ist: Treppen, Rohrleitungen, Dachflächen, Stückzahlen. Rechnen Sie mit + − * / und Klammern, Abzüge mit Minus. Gleiche Positionen werden zusammengezählt.</p>' +
      '<datalist id="fz-pos">' + s.map(function (x) { return '<option value="' + h(x.pos) + '">'; }).join("") + '</datalist><datalist id="einheiten"><option>m²</option><option>m</option><option>m³</option><option>Stk.</option><option>lfm</option><option>kg</option><option>Std.</option></datalist>' +
      '<div class="tabelle"><table class="am fz"><thead><tr><th>Position</th><th>Beschreibung</th><th>Formel</th><th>Einheit</th><th class="r">Ergebnis</th><th></th></tr></thead><tbody>' + z.map(fzZeile).join("") + "</tbody></table></div>" +
      '<div class="knoepfe links"><button type="button" class="btn btn-outline klein" data-a="fzNeu">+ Zeile</button></div>' +
      (s.length ? '<div class="fz-summen"><h3>Zusammengefasst</h3><ul class="liste">' + s.map(function (x) { return "<li><b>" + h(x.pos) + "</b> · " + U.zahlText(x.menge) + " " + h(x.einheit) + ' <small class="still">(' + x.n + " Zeilen)</small></li>"; }).join("") + "</ul></div>" : "") + "</section>";
  }
  var altAufmass = V.aufmass;
  V.aufmass = async function (id, extra) { return altAufmass(id, extra); };
  V.aufmass.danach = function (id) {
    var f = document.getElementById("am-form"); if (!f || !id || id === "neu") return;
    var k = f.querySelector(".knoepfe:last-of-type"); k.insertAdjacentHTML("beforebegin", formelBereich(K._aufmass.daten));
  };
  K.aktion.fzNeu = function () {
    var tb = document.querySelector("table.fz tbody"), i = tb.rows.length, letzte = tb.rows[i - 1];
    tb.insertAdjacentHTML("beforeend", fzZeile({ pos: letzte ? letzte.querySelector("[name^=fz_p_]").value : "", einheit: letzte ? letzte.querySelector("[name^=fz_e_]").value : "m²" }, i));
    tb.rows[i].querySelector("[name^=fz_t_]").focus();
  };
  K.aktion.fzWeg = function (el) { var tr = el.closest("tr"); tr.querySelectorAll("input").forEach(function (x) { x.value = ""; }); tr.hidden = true; };
  document.addEventListener("input", function (e) {
    var el = e.target; if (!el.matches || !el.matches("[data-fz-formel]")) return;
    var td = el.closest("tr").querySelector("[data-fz-erg]"), w = formelSicher(el.value);
    td.innerHTML = el.value.trim() ? (isNaN(w) || w == null ? '<span class="pill rot">Formel prüfen</span>' : U.zahlText(w)) : "";
  });

  /* ======================= Nachkalkulation je Position ======================= */
  K.sollStunden = function (p) { if (/^std|^h$|stunde/i.test(String(p.einheit || "").trim())) return +p.menge || 0; if (+p.minuten) return rund(+p.minuten * (+p.menge || 0) / 60); return null; };
  K.zeitStd = function (z) { return z.ende ? Math.max(0, (new Date(z.ende) - new Date(z.beginn)) / 36e5 - (+z.pause_min || 0) / 60) : 0; };
  // Zeiten aus der Zeiterfassung, für die es am selben Tag vom selben Mitarbeiter keinen Regiebericht gibt
  K.zeitenOhneBericht = function (zeiten, berichte) {
    var hat = {}; berichte.forEach(function (b) { hat[b.mitarbeiter + "|" + b.datum] = 1; });
    return zeiten.filter(function (z) { return z.ende && !hat[z.user_id + "|" + U.isoTag(z.beginn)]; }).map(function (z) { return { stunden: rund(K.zeitStd(z)), material_euro: 0, zusatzleistung: false, position_id: z.position_id || null, aus_zeit: true }; });
  };
  K.auftragPositionen = async function (au) {
    var ids = (au.angebot_id ? [au.angebot_id] : []).concat((((au.kalk || {}).nachtraege) || []).filter(function (x) { return x.uebernommen; }).map(function (x) { return x.id; }));
    if (!ids.length) return [];
    var an = await K.liste("angebote", { wo: { id: ids } }).catch(function () { return []; }), pos = [];
    ids.forEach(function (aid) { var a = an.filter(function (x) { return x.id === aid; })[0]; if (!a) return; (a.positionen || []).forEach(function (p) { if (p.typ === "pos" && !p.optional && p.id && String(p.text || "").trim()) pos.push(Object.assign({ quelle: a.nr }, p)); }); });
    return pos;
  };
  K.nachkalkulation = function (pos, eintraege) {
    var zeilen = pos.map(function (p) { return { id: p.id, text: p.text, quelle: p.quelle, soll: K.sollStunden(p), ist: 0, mat: 0, n: 0 }; }), idx = {}, ohne = { id: "", text: "Ohne Zuordnung", soll: null, ist: 0, mat: 0, n: 0 };
    zeilen.forEach(function (z) { idx[z.id] = z; });
    eintraege.forEach(function (b) { var z = idx[b.position_id] || ohne; z.ist += +b.stunden || 0; z.mat += +b.material_euro || 0; z.n++; });
    zeilen.concat([ohne]).forEach(function (z) { z.ist = rund(z.ist); z.mat = rund(z.mat); z.abw = z.soll == null ? null : rund(z.ist - z.soll); });
    return { zeilen: zeilen.filter(function (z) { return z.soll || z.n; }), ohne: ohne };
  };
  V.auftraege.danach = async function (id, tab) {
    if (!id || tab !== "rentabilitaet") return;
    var ziel = document.querySelector("#inhalt section.karte"); if (!ziel) return;
    var au = await DB.eins("auftraege", id), r = await Promise.all([K.auftragPositionen(au), K.liste("berichte", { wo: { auftrag_id: id } }), K.liste("zeiten", { wo: { auftrag_id: id } }).catch(function () { return []; })]);
    var eintraege = r[1].concat(K.zeitenOhneBericht(r[2], r[1])), nk = K.nachkalkulation(r[0], eintraege), satz = +((au.kalk || {}).satz) || K.kostenStd();
    if (!r[0].length && !eintraege.length) return;
    var balken = function (z) { if (!z.soll) return ""; var p = Math.min(150, Math.round(z.ist / z.soll * 100)); return '<span class="nk-balken' + (z.ist > z.soll ? " drueber" : "") + '"><i style="width:' + Math.min(100, p / 1.5) + '%"></i></span>'; };
    ziel.insertAdjacentHTML("afterend", '<section class="karte"><h2>Nachkalkulation je Position</h2><p class="still">Geplante Stunden aus dem Angebot (Stunden-Positionen und Minuten aus dem Katalog) gegen die erfassten Stunden. Stunden ordnen Ihre Leute im Regiebericht oder beim Kommen einer Position zu.</p>' +
      '<div class="tabelle"><table class="nk"><thead><tr><th>Position</th><th class="r">geplant</th><th class="r">tatsächlich</th><th class="r">Abweichung</th><th class="r">Mehrkosten</th><th></th></tr></thead><tbody>' +
      nk.zeilen.concat(nk.ohne.n ? [nk.ohne] : []).map(function (z) { return "<tr" + (z.abw > 0 ? ' class="nk-drueber"' : "") + "><td>" + h(z.text) + (z.quelle ? " <small>" + h(z.quelle) + "</small>" : "") + '</td><td class="r">' + (z.soll == null ? "–" : U.zahlText(z.soll) + " Std.") + '</td><td class="r">' + U.zahlText(z.ist) + ' Std.</td><td class="r">' + (z.abw == null ? "" : (z.abw > 0 ? "+" : "") + U.zahlText(z.abw) + " Std.") + '</td><td class="r">' + (z.abw > 0 ? U.eur(z.abw * satz) : "") + "</td><td>" + balken(z) + "</td></tr>"; }).join("") +
      "</tbody></table></div>" + (nk.ohne.n ? '<p class="still">' + nk.ohne.n + " Einträge ohne Position. Für genauere Zahlen beim Regiebericht die Position auswählen.</p>" : "") + "</section>");
    K.handyTabellen(ziel.nextElementSibling);
  };
  // Positionsauswahl im Regiebericht und bei „Kommen“
  async function positionsWahl(sel, auftragId, wert) {
    var feld = sel.form.querySelector("[name=position_id]"), au = auftragId ? await DB.eins("auftraege", auftragId) : null, pos = au ? await K.auftragPositionen(au) : [];
    if (!pos.length) { if (feld) feld.closest(".pw").remove(); return; }
    var html = '<option value="">– keine bestimmte –</option>' + pos.map(function (p) { return '<option value="' + h(p.id) + '"' + (p.id === wert ? " selected" : "") + ">" + h(String(p.text).slice(0, 70)) + "</option>"; }).join("");
    if (feld) { feld.innerHTML = html; return; }
    var wrap = sel.closest(".fld");
    if (wrap) wrap.insertAdjacentHTML("afterend", '<div class="fld pw"><label>Position aus dem Angebot</label><select name="position_id">' + html + "</select><small>Für die Nachkalkulation: Wofür waren die Stunden?</small></div>");
    else sel.insertAdjacentHTML("afterend", '<span class="pw"><select name="position_id" aria-label="Position">' + html + "</select></span>");
  }
  document.addEventListener("change", function (e) { var s = e.target; if (s.name === "auftrag_id" && s.form && (s.form.id === "ber-form" || s.form.dataset.f === "kommen")) positionsWahl(s, s.value, "").catch(U.fehler); });
  var altBerichteDanach = V.berichte.danach;
  V.berichte.danach = function (id, extra) {
    if (altBerichteDanach) altBerichteDanach(id, extra);
    var s = document.querySelector("#ber-form [name=auftrag_id]"); if (s && !s.disabled && !s.closest("fieldset[disabled]") && s.value) positionsWahl(s, s.value, (K._bericht || {}).position_id || "").catch(U.fehler);
  };
  V.zeiten.danach = function () { var s = document.querySelector("form[data-f=kommen] [name=auftrag_id]"); if (s && s.value) positionsWahl(s, s.value, "").catch(U.fehler); };

  /* ======================= Stundensatz-Rechner ======================= */
  K.KALK_STANDARD = { n: 2, lohn: 20, woche: 40, urlaub: 30, feiertage: 10, krank: 10, unproduktiv: 15, ag: 24, unternehmerlohn: 48000, wg: 10,
    gk: { "Miete, Werkstatt, Lager": 0, "Fahrzeuge": 0, "Versicherungen und Beiträge": 0, "Büro, Telefon, Software": 0, "Werkzeug und Maschinen": 0, "Werbung": 0, "Steuerberater": 0, "Sonstiges": 0 } };
  K.stundensatzRechnen = function (e) {
    var tage = Math.max(0, 260 - e.urlaub - e.feiertage - e.krank), std = tage * e.woche / 5, prod = std * (1 - e.unproduktiv / 100), alle = e.n * prod;
    var lohn = e.n * e.lohn * e.woche * 52 * (1 + e.ag / 100), gk = Object.keys(e.gk || {}).reduce(function (s, k) { return s + (+e.gk[k] || 0); }, 0) + (+e.unternehmerlohn || 0);
    if (!(alle > 0)) return null;
    var kosten = (lohn + gk) / alle;
    return { tage: tage, prodJeMa: rund(prod), prodAlle: Math.round(alle), lohnJahr: rund(lohn), gkJahr: rund(gk), lohnStd: rund(lohn / alle), gkStd: rund(gk / alle), kosten: rund(kosten), satz: rund(kosten * (1 + e.wg / 100)), empfehlung: Math.ceil(kosten * (1 + e.wg / 100) * 2) / 2 };
  };
  K.kostenStd = function () { var k = (K.ctx.betrieb || {}).kalkulation || {}; return +k.kosten_std || 42; };
  V.stundensatz = async function () {
    var e = Object.assign({}, K.KALK_STANDARD, (K.ctx.betrieb.kalkulation || {}).eingaben || {}); e.gk = Object.assign({}, K.KALK_STANDARD.gk, e.gk || {});
    var f = function (n, l, w, hilfe) { return U.feld(n, l, U.zahlText(w), { typ: "number", hilfe: hilfe }); };
    return K.kopf("Stundensatz berechnen", "Was kostet eine Stunde Ihres Betriebs wirklich – und was müssen Sie verlangen? Gerechnet wie in der Handwerkskalkulation: Mittellohn, Lohnnebenkosten, Gemeinkosten, Wagnis und Gewinn.") +
      '<form class="karte formular" data-f="stundensatz" id="ss-form"><div class="raster-2"><div><h2>Leute und Zeit</h2><div class="raster">' + f("n", "Produktive Mitarbeiter (mit Ihnen, wenn Sie mitarbeiten)", e.n) + f("lohn", "Mittellohn brutto € je Stunde", e.lohn, "Durchschnitt der Stundenlöhne") +
        f("woche", "Wochenstunden", e.woche) + f("urlaub", "Urlaubstage", e.urlaub) + f("feiertage", "Feiertage", e.feiertage) + f("krank", "Krankheitstage (Schnitt)", e.krank) +
        f("unproduktiv", "Nicht abrechenbare Zeit %", e.unproduktiv, "Fahrt, Lager, Aufräumen, Werkstatt") + f("ag", "Arbeitgeberanteil Sozialversicherung und BG %", e.ag) + "</div></div>" +
      "<div><h2>Gemeinkosten im Jahr</h2><div class=\"raster\">" + Object.keys(e.gk).map(function (k, i) { return U.feld("gk_" + i, k + " €", U.zahlText(e.gk[k]), { typ: "number", attr: ' data-gk="' + h(k) + '"' }); }).join("") +
        f("unternehmerlohn", "Unternehmerlohn im Jahr €", e.unternehmerlohn, "Was Sie selbst verdienen wollen (brutto)") + f("wg", "Wagnis und Gewinn %", e.wg) + "</div></div></div>" +
      '<div class="ss-ergebnis" data-ss-erg></div><div class="knoepfe"><button class="btn btn-outline" type="submit">Eingaben speichern</button><button class="btn btn-signal" type="button" data-a="ssUebernehmen">Als Stundensatz übernehmen</button></div></form>';
  };
  function ssLesen(form) {
    var e = { gk: {} }; ["n", "lohn", "woche", "urlaub", "feiertage", "krank", "unproduktiv", "ag", "unternehmerlohn", "wg"].forEach(function (k) { e[k] = U.zahl(form.elements[k].value); });
    form.querySelectorAll("[data-gk]").forEach(function (x) { e.gk[x.dataset.gk] = U.zahl(x.value); }); return e;
  }
  function ssZeigen(form) {
    var r = K.stundensatzRechnen(ssLesen(form)), z = form.querySelector("[data-ss-erg]"), b = K.ctx.betrieb; if (!z) return;
    if (!r) { z.innerHTML = '<p class="warn-box">Bitte Mitarbeiter und Arbeitszeit eintragen.</p>'; return; }
    z.innerHTML = '<div class="kpis"><div class="kpi"><span>Kosten je Stunde</span><b>' + U.eur(r.kosten) + '</b></div><div class="kpi"><span>Stundensatz netto</span><b>' + U.eur(r.satz) + '</b></div><div class="kpi"><span>Bisher in Kundario</span><b>' + U.eur(b.stundensatz) + "</b></div></div>" +
      '<p>' + r.tage + " Arbeitstage · " + U.zahlText(r.prodJeMa) + " abrechenbare Stunden je Mitarbeiter · " + U.zahlText(r.prodAlle) + " im Betrieb. Lohnkosten " + U.eur(r.lohnStd) + " + Gemeinkosten " + U.eur(r.gkStd) + " je Stunde.</p>" +
      (+b.stundensatz < r.kosten ? '<p class="warn-box"><b>Achtung:</b> Ihr jetziger Stundensatz deckt nicht einmal die Kosten. Jede verkaufte Stunde kostet Sie ' + U.eur(r.kosten - b.stundensatz) + ".</p>" : +b.stundensatz < r.satz ? '<p class="warn-box">Ihr jetziger Stundensatz deckt die Kosten, aber nicht den geplanten Gewinn. Vorschlag: ' + U.eur(r.empfehlung) + ".</p>" : '<p class="ok-box">Ihr Stundensatz deckt Kosten und Gewinn.</p>');
  }
  V.stundensatz.danach = function () { var f = document.getElementById("ss-form"); if (!f) return; ssZeigen(f); f.addEventListener("input", function () { ssZeigen(f); }); };
  async function ssSpeichern(f, uebernehmen) {
    var e = ssLesen(f), r = K.stundensatzRechnen(e), b = K.ctx.betrieb; if (!r) throw new Error("Bitte Mitarbeiter und Arbeitszeit eintragen.");
    var k = Object.assign({}, b.kalkulation || {}, { eingaben: e, kosten_std: r.kosten, satz_vorschlag: r.empfehlung, berechnet_am: U.isoTag() }), patch = { kalkulation: k };
    if (uebernehmen) patch.stundensatz = r.empfehlung;
    await DB.aendern("betriebe", b.id, patch); Object.assign(b, patch); return r;
  }
  K.formular.stundensatz = async function (d, f) { await ssSpeichern(f, false); U.toast("Gespeichert. Interne Kosten je Stunde werden jetzt in der Rentabilität verwendet."); K.neuLaden(); };
  K.aktion.ssUebernehmen = async function () {
    var f = document.getElementById("ss-form"), r = K.stundensatzRechnen(ssLesen(f));
    if (!r || !(await U.bestaetigen("Stundensatz von " + U.eur(K.ctx.betrieb.stundensatz) + " auf " + U.eur(r.empfehlung) + " netto ändern? Bestehende Angebote und Rechnungen bleiben unverändert.", "Übernehmen"))) return;
    await ssSpeichern(f, true); U.toast("Neuer Stundensatz: " + U.eur(r.empfehlung)); K.neuLaden();
  };
})();
