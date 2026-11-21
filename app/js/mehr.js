/* Kundario – Material, Aufmaß, Dokumente, Abläufe, Auswertungen, Assistent, Team, Einstellungen */
(function () {
  "use strict";
  var DB = window.KDB, h = U.h, V = K.views;

  /* ---------- Material ---------- */
  V.material = async function (id, extra) {
    if (id === "neu") return materialForm(extra);
    var l = await K.liste("material", { sortiere: "created_at.desc" }), au = {}; (await K.liste("auftraege", { select: "id,nr,titel" })).forEach(function (a) { au[a.id] = a; });
    var gruppen = ["warenkorb", "freigabe", "bestellt", "geliefert"], darfFrei = K.ctx.ich.rolle === "gf" || K.ctx.ich.rolle === "buero";
    return K.kopf("Material", "Von der Baustelle angefordert, im Büro freigegeben und bestellt.", '<a class="btn btn-signal" href="#/material/neu">Material anfordern</a>') +
      (l.length ? gruppen.map(function (g) {
        var x = l.filter(function (m) { return m.status === g; }); if (!x.length) return "";
        return '<section class="karte"><div class="kopf-zeile"><h2>' + K.MATST[g][0] + " (" + x.length + ")</h2>" + (g === "freigabe" && darfFrei ? '<button class="btn btn-signal klein" data-a="bestellMail">Bestellung per E-Mail</button>' : "") + '</div><ul class="liste">' + x.map(function (m) {
          var weiter = g === "warenkorb" ? ["freigabe", "Zur Freigabe"] : g === "freigabe" && darfFrei ? ["bestellt", "Als bestellt markieren"] : g === "bestellt" ? ["geliefert", "Geliefert"] : null;
          return "<li><b>" + U.zahlText(m.menge) + " " + h(m.einheit) + " " + h(m.artikel) + "</b> " + (m.auftrag_id && au[m.auftrag_id] ? '<a href="#/auftraege/' + m.auftrag_id + '/material">' + h(au[m.auftrag_id].nr) + "</a>" : "Lager") + (m.lieferant ? " · " + h(m.lieferant) : "") + (m.preis ? " · " + U.eur(m.preis * m.menge) : "") + " <small>" + h(K.mitgliedName(m.erstellt_von)) + ", " + h(U.relativ(m.created_at)) + "</small> " +
            (weiter ? '<button class="btn btn-outline klein" data-a="matStatus" data-id="' + m.id + '" data-s="' + weiter[0] + '">' + weiter[1] + "</button>" : "") + (darfFrei ? ' <button class="mini" data-a="matWeg" data-id="' + m.id + '" aria-label="entfernen">×</button>' : "") + "</li>";
        }).join("") + "</ul></section>";
      }).join("") : K.leer("Noch kein Material angefordert."));
  };
  async function materialForm(auftragId) {
    var au = await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit", "pausiert"] }, sortiere: "nr.desc" });
    return K.kopf("Material anfordern") + '<form class="karte formular" data-f="material"><div class="raster">' + U.feld("artikel", "Artikel", "", { pflicht: true, ph: "z. B. Kupferrohr 15 mm, 5 m" }) + U.feld("menge", "Menge", "1", { typ: "number", pflicht: true }) + U.feld("einheit", "Einheit", "Stk.", { attr: ' list="einheiten"' }) +
      U.feld("auftrag_id", "Für Auftrag", auftragId || "", { optionen: [["", "Lager / ohne Auftrag"]].concat(au.map(function (a) { return [a.id, a.nr + " · " + a.titel]; })) }) + U.feld("lieferant", "Lieferant", "") + U.feld("preis", "Preis je Einheit (€, falls bekannt)", "", { typ: "number" }) + "</div>" +
      '<datalist id="einheiten"><option>Stk.</option><option>m</option><option>m²</option><option>kg</option><option>l</option><option>Pck.</option><option>Rolle</option></datalist>' + U.feld("sofort", "Gleich zur Freigabe ans Büro", true, { typ: "checkbox" }) + '<div class="knoepfe"><a class="btn btn-outline" href="#/material">Abbrechen</a><button class="btn btn-signal">Speichern</button></div></form>';
  }
  K.formular.material = async function (d) {
    var m = await K.neu("material", { artikel: d.artikel.trim(), menge: U.zahl(d.menge) || 1, einheit: d.einheit || "Stk.", auftrag_id: d.auftrag_id || null, lieferant: d.lieferant || null, preis: d.preis ? U.zahl(d.preis) : null, status: d.sofort ? "freigabe" : "warenkorb", erstellt_von: K.ctx.user.id });
    if (m.auftrag_id) await K.verlauf("auftrag", m.auftrag_id, "Material angefordert: " + U.zahlText(m.menge) + " " + m.einheit + " " + m.artikel);
    U.toast(d.sofort ? "Ans Büro zur Freigabe geschickt." : "Im Warenkorb."); K.go("material");
  };
  K.aktion.matStatus = async function (el) { await DB.aendern("material", el.dataset.id, { status: el.dataset.s }); K.neuLaden(); };
  K.aktion.matWeg = async function (el) { await DB.loeschen("material", el.dataset.id); K.neuLaden(); };
  K.aktion.bestellMail = async function () {
    var l = await K.liste("material", { wo: { status: "freigabe" } }), au = {}; (await K.liste("auftraege", { select: "id,nr" })).forEach(function (a) { au[a.id] = a; });
    var r = await U.dialog("Bestellung per E-Mail", U.feld("an", "An (Lieferant)", "", { typ: "email", pflicht: true }) + U.feld("text", "Bestellung", "Guten Tag,\n\nbitte liefern Sie folgende Artikel:\n\n" + l.map(function (m) { return "- " + U.zahlText(m.menge) + " " + m.einheit + " " + m.artikel + (m.auftrag_id && au[m.auftrag_id] ? " (Kommission " + au[m.auftrag_id].nr + ")" : ""); }).join("\n") + "\n\nLieferadresse: " + [K.ctx.betrieb.strasse, K.ctx.betrieb.plz, K.ctx.betrieb.ort].filter(Boolean).join(", ") + "\n\nMit freundlichen Grüßen\n" + K.ctx.ich.name + "\n" + K.ctx.betrieb.name, { typ: "textarea", zeilen: 12, breit: true }) + U.feld("markieren", "Artikel danach als bestellt markieren", true, { typ: "checkbox" }), [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "E-Mail öffnen", primaer: true }]);
    if (!r) return; if (r.daten.markieren) for (var i = 0; i < l.length; i++) await DB.aendern("material", l[i].id, { status: "bestellt", lieferant: l[i].lieferant || r.daten.an });
    U.mail(r.daten.an, "Bestellung " + K.ctx.betrieb.name, r.daten.text); K.neuLaden();
  };

  /* ---------- Aufmaß ---------- */
  V.aufmass = async function (id, extra) {
    if (id === "neu") { var a = await K.neu("aufmasse", { titel: "Aufmaß " + U.datum(new Date()), anfrage_id: extra || null, daten: { raeume: [{ name: "Raum 1", l: "", b: "", h: "2,5", abzug: "" }] } }); location.replace("#/aufmass/" + a.id); return ""; }
    if (id) return aufmassEditor(id);
    var l = await K.liste("aufmasse", { sortiere: "created_at.desc" });
    return K.kopf("Aufmaß", "Räume, Fenster, Türen und Sonnenschutz vermessen. Flächen werden sofort berechnet und lassen sich ins Angebot übernehmen.", '<a class="btn btn-signal" href="#/aufmass/neu">Neues Aufmaß</a>') +
      (l.length ? '<ul class="liste karte">' + l.map(function (a) { var s = flaechen(a.daten); return '<li><a href="#/aufmass/' + a.id + '"><b>' + h(a.titel) + "</b> · " + (a.daten.raeume || []).length + " Räume · Boden " + U.zahlText(s.boden) + " m² · Wand " + U.zahlText(s.wand) + " m²" + (K.btSummen && K.btSummen(a.daten).stueck ? " · " + K.btSummen(a.daten).stueck + " Bauteile" : "") + "</a></li>"; }).join("") + "</ul>" : K.leer("Noch kein Aufmaß."));
  };
  function raum(r) { var l = U.zahl(r.l), b = U.zahl(r.b), hh = U.zahl(r.h), ab = U.zahl(r.abzug); return { boden: Math.round(l * b * 100) / 100, umfang: Math.round(2 * (l + b) * 100) / 100, wand: Math.max(0, Math.round((2 * (l + b) * hh - ab) * 100) / 100) }; }
  function flaechen(d) { return (d.raeume || []).reduce(function (s, r) { var x = raum(r); s.boden += x.boden; s.wand += x.wand; s.umfang += x.umfang; return s; }, { boden: 0, wand: 0, umfang: 0 }); }
  async function aufmassEditor(id) {
    var a = await DB.eins("aufmasse", id); if (!a) return K.leer("Aufmaß nicht gefunden."); K._aufmass = a;
    var s = flaechen(a.daten);
    return K.kopf(a.titel, "Maße in Metern, Abzüge (Fenster, Türen) in m².", '<a class="btn btn-outline" href="#/aufmass">Zurück</a>' + (K.darf("angebote") ? '<button class="btn btn-signal" data-a="aufmassAngebot" data-id="' + id + '">Ins Angebot übernehmen</button>' : "")) +
      '<form class="karte formular" data-f="aufmass" data-id="' + id + '" id="am-form">' + U.feld("titel", "Bezeichnung", a.titel, { pflicht: true }) + '<div class="tabelle"><table class="am"><thead><tr><th>Raum</th><th>Länge</th><th>Breite</th><th>Höhe</th><th>Abzüge m²</th><th class="r">Boden m²</th><th class="r">Wand m²</th><th></th></tr></thead><tbody>' +
        (a.daten.raeume || []).map(function (r, i) { var x = raum(r); return '<tr data-i="' + i + '"><td><input name="n_' + i + '" value="' + h(r.name) + '"></td><td><input name="l_' + i + '" inputmode="decimal" value="' + h(r.l) + '"></td><td><input name="b_' + i + '" inputmode="decimal" value="' + h(r.b) + '"></td><td><input name="h_' + i + '" inputmode="decimal" value="' + h(r.h) + '"></td><td><input name="a_' + i + '" inputmode="decimal" value="' + h(r.abzug) + '"></td><td class="r">' + U.zahlText(x.boden) + '</td><td class="r">' + U.zahlText(x.wand) + '</td><td><button type="button" class="mini" data-a="amWeg" data-i="' + i + '">×</button></td></tr>'; }).join("") +
        '</tbody><tfoot><tr><th colspan="5">Summe</th><th class="r">' + U.zahlText(s.boden) + '</th><th class="r">' + U.zahlText(s.wand) + "</th><th></th></tr></tfoot></table></div>" +
        '<div class="knoepfe"><button type="button" class="btn btn-outline" data-a="amNeu">+ Raum</button><button class="btn btn-signal">Speichern und rechnen</button></div></form>';
  }
  K.amDaten = function (f, raeume) { return { raeume: raeume }; };   // wird in profi.js um Formelzeilen ergänzt
  function amLesen(f) { var r = []; for (var i = 0; f.elements["n_" + i]; i++) r.push({ name: f.elements["n_" + i].value, l: f.elements["l_" + i].value, b: f.elements["b_" + i].value, h: f.elements["h_" + i].value, abzug: f.elements["a_" + i].value }); return r; }
  K.formular.aufmass = async function (d, f) { await DB.aendern("aufmasse", f.dataset.id, { titel: d.titel, daten: K.amDaten(f, amLesen(f)) }); U.toast("Gespeichert."); K.neuLaden(); };
  K.aktion.amNeu = async function () { var f = document.getElementById("am-form"), r = amLesen(f); r.push({ name: "Raum " + (r.length + 1), l: "", b: "", h: r.length ? r[r.length - 1].h : "2,5", abzug: "" }); await DB.aendern("aufmasse", f.dataset.id, { daten: K.amDaten(f, r) }); K.neuLaden(); };
  K.aktion.amWeg = async function (el) { var f = document.getElementById("am-form"), r = amLesen(f); r.splice(+el.dataset.i, 1); await DB.aendern("aufmasse", f.dataset.id, { daten: K.amDaten(f, r) }); K.neuLaden(); };
  K.aktion.aufmassAngebot = async function (el) {
    var f = document.getElementById("am-form"); await DB.aendern("aufmasse", el.dataset.id, { titel: f.elements.titel.value, daten: K.amDaten(f, amLesen(f)) });
    var a = await DB.eins("aufmasse", el.dataset.id), s = flaechen(a.daten);
    var offen = (await K.liste("angebote", { wo: { status: "entwurf" }, sortiere: "created_at.desc" }));
    var r = await U.dialog("Ins Angebot übernehmen", U.feld("ziel", "Angebot", offen[0] ? offen[0].id : "", { optionen: [["", "Neues Angebot"]].concat(offen.map(function (x) { return [x.id, x.nr + " · " + x.titel]; })) }) +
      U.feld("boden", "Bodenfläche " + U.zahlText(s.boden) + " m² übernehmen", s.boden > 0, { typ: "checkbox" }) + U.feld("wand", "Wandfläche " + U.zahlText(s.wand) + " m² übernehmen", s.wand > 0, { typ: "checkbox" }) + U.feld("decke", "Deckenfläche " + U.zahlText(s.boden) + " m² übernehmen", false, { typ: "checkbox" }) + U.feld("sockel", "Sockelleisten " + U.zahlText(s.umfang) + " m übernehmen", false, { typ: "checkbox" }) + U.feld("raeume", "Je Raum eine eigene Position", false, { typ: "checkbox" }) + (K.amFormelPos && (a.daten.zeilen || []).length ? U.feld("formeln", "Positionen aus den Formelzeilen übernehmen", true, { typ: "checkbox" }) : "") +
      (K.amBauteilPos && K.btSummen(a.daten).stueck ? U.feld("bauteile", "Fenster, Türen, Sonnenschutz: je Bauteil eine Position (" + K.btSummen(a.daten).stueck + " Stk.)", true, { typ: "checkbox" }) + (K.btSummen(a.daten).fuge ? U.feld("fuge", "Anschlussfuge " + U.zahlText(K.btSummen(a.daten).fuge) + " lfm übernehmen", true, { typ: "checkbox" }) : "") + (K.btMontageDa && K.btMontageDa(a.daten) ? U.feld("montage", "Montage je Bauteil-Art als eigene Position (Preise aus „Bauteil-Preise“)", true, { typ: "checkbox" }) : "") : ""));
    if (!r) return;
    var pos = [], P = function (t, m, e) { pos.push({ id: U.uuid(), typ: "pos", text: t, menge: Math.round(m * 100) / 100, einheit: e, preis: 0 }); };
    var liste = r.daten.raeume ? a.daten.raeume.map(function (x) { return { n: x.name + ": ", s: raum(x) }; }) : [{ n: "", s: { boden: s.boden, wand: s.wand, umfang: s.umfang } }];
    liste.forEach(function (x) { if (r.daten.boden) P(x.n + "Bodenfläche", x.s.boden, "m²"); if (r.daten.wand) P(x.n + "Wandfläche", x.s.wand, "m²"); if (r.daten.decke) P(x.n + "Deckenfläche", x.s.boden, "m²"); if (r.daten.sockel) P(x.n + "Sockelleiste", x.s.umfang, "m"); });
    if (r.daten.formeln) pos = pos.concat(K.amFormelPos(a.daten));
    if (r.daten.bauteile) pos = pos.concat(K.amBauteilPos(a.daten, r.daten.fuge, r.daten.montage));
    var ziel;
    if (r.daten.ziel) { ziel = await DB.eins("angebote", r.daten.ziel); await DB.aendern("angebote", ziel.id, { positionen: ziel.positionen.filter(function (p) { return p.typ !== "pos" || String(p.text).trim(); }).concat(pos) }); }
    else { var an = a.anfrage_id ? await DB.eins("anfragen", a.anfrage_id) : null; ziel = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: an ? an.kunde_id : null, anfrage_id: a.anfrage_id, titel: an ? an.betreff : a.titel, mwst: K.mwst(), positionen: pos }); }
    U.toast(pos.some(function (x) { return !x.preis; }) ? "Übernommen – bitte fehlende Preise eintragen." : "Übernommen – Preise aus Ihren Bauteil-Preisen."); K.go("angebote/" + ziel.id);
  };

  /* ---------- Dokumente ---------- */
  V.dokumente = async function () {
    var l = await K.liste("dokumente", { sortiere: "created_at.desc" }), km = await K.kundenMap(), au = {}; (await K.liste("auftraege", { select: "id,nr" })).forEach(function (a) { au[a.id] = a; });
    var aus = await K.liste("auftraege", { wo: { status: ["geplant", "in_arbeit", "pausiert"] }, sortiere: "nr.desc" });
    return K.kopf("Dokumente", "Pläne, Fotos, Lieferscheine, Verträge – sicher abgelegt.") +
      '<form class="karte zeile-form" data-f="dokHoch"><input type="file" name="datei" required><select name="auftrag_id"><option value="">ohne Auftrag</option>' + aus.map(function (a) { return '<option value="' + a.id + '">' + h(a.nr + " · " + a.titel) + "</option>"; }).join("") + '</select><button class="btn btn-signal klein">Hochladen</button></form>' +
      (l.length ? '<div class="tabelle"><table><thead><tr><th>Name</th><th>Auftrag</th><th>Kunde</th><th>Datum</th><th>Größe</th><th></th></tr></thead><tbody>' + l.map(function (d) { return "<tr><td><a href=\"#\" data-a=\"dokOeffnen\" data-pfad=\"" + h(d.pfad) + '">' + h(d.name) + "</a></td><td>" + h(d.auftrag_id && au[d.auftrag_id] ? au[d.auftrag_id].nr : "") + "</td><td>" + h(d.kunde_id && km[d.kunde_id] ? km[d.kunde_id].name : "") + "</td><td>" + U.datum(d.created_at) + "</td><td>" + (d.groesse ? Math.max(1, Math.round(d.groesse / 1024)) + " KB" : "") + "</td><td>" + (K.darf("rechnungen") ? '<button class="mini" data-a="dokWeg" data-id="' + d.id + '" aria-label="löschen">×</button>' : "") + "</td></tr>"; }).join("") + "</tbody></table></div>" : K.leer("Noch keine Dokumente."));
  };
  K.formular.dokHoch = async function (d, f) {
    var file = f.elements.datei.files[0]; if (!file) return; if (file.size > 20e6) throw new Error("Höchstens 20 MB je Datei.");
    var sauber = file.name.replace(/[^\w.\-äöüÄÖÜß ]/g, "_").slice(-80), pfad = K.bid() + "/dokumente/" + U.uuid() + "-" + sauber;
    await DB.datei.hoch(pfad, file);
    var au = d.auftrag_id ? await DB.eins("auftraege", d.auftrag_id) : null;
    await K.neu("dokumente", { name: file.name, pfad: pfad, typ: file.type, groesse: file.size, auftrag_id: d.auftrag_id || null, kunde_id: au ? au.kunde_id : null });
    U.toast("Hochgeladen."); K.neuLaden();
  };
  K.aktion.dokOeffnen = async function (el) { var u = await DB.datei.link(el.dataset.pfad); if (!u) throw new Error("Datei nicht gefunden."); var w = window.open(); if (w) { w.opener = null; w.location = u; } else location.href = u; };
  K.aktion.dokWeg = async function (el) { if (!(await U.bestaetigen("Dokument aus der Liste löschen?", "Löschen", true))) return; await DB.loeschen("dokumente", el.dataset.id); K.neuLaden(); };

  /* ---------- Abläufe ---------- */
  var AST = { ok: ["erfolgreich", "ok"], freigabe: ["wartet auf Freigabe", "warn"], fehler: ["fehlgeschlagen", "rot"], manuell: ["manuelle Bearbeitung", "warn"], aus: ["deaktiviert", "aus"] };
  V.ablaeufe = async function () {
    var l = await K.liste("ablauf_laeufe", { sortiere: "created_at.desc", limit: 100 }), b = K.ctx.betrieb;
    var ang = await K.liste("angebote", { wo: { status: "gesendet" } }), faellig = ang.filter(function (a) { return K.nachfassFaellig(a).faellig; }).length;
    var re = await K.liste("rechnungen", { wo: { status: ["gestellt", "teilbezahlt"] } }), ueber = re.filter(function (r) { return r.faellig && r.faellig < U.isoTag(); }).length;
    return K.kopf("Abläufe", "Was Kundario für Sie vorbereitet – und was davon ausgeführt wurde.") +
      '<div class="karten"><article class="karte"><h2>Nachfassen</h2><p>Erinnerung nach ' + b.nachfass_tage.join(", ") + " Tagen, danach Anruf-Hinweis. Jede Erinnerung geht erst nach Ihrer Freigabe raus.</p><p><b>" + faellig + "</b> heute fällig.</p><a class=\"btn btn-signal klein\" href=\"#/nachfassen\">Ansehen</a></article>" +
      '<article class="karte"><h2>Zahlungserinnerung</h2><p>Überfällige Rechnungen werden markiert, die Erinnerung bereitet Kundario vor.</p><p><b>' + ueber + '</b> überfällig.</p><a class="btn btn-signal klein" href="#/rechnungen">Ansehen</a></article>' +
      '<article class="karte"><h2>Regiebericht → Rechnung</h2><p>Zusatzleistungen aus unterschriebenen Berichten landen automatisch in der Schlussrechnung.</p></article></div>' +
      '<section class="karte"><h2>Protokoll</h2>' + (l.length ? '<ul class="liste">' + l.map(function (x) { return "<li>" + K.status(x.status, AST) + " <b>" + h(x.titel) + "</b> <small>" + U.datumZeit(x.created_at) + "</small>" + (x.grund ? "<br><small>" + h(x.grund) + "</small>" : "") + "</li>"; }).join("") + "</ul>" : '<p class="still">Noch keine Ausführungen.</p>') +
      '<p class="still">Automatischer Versand ohne Freigabe (z. B. E-Mails über einen Versanddienst) ist vorbereitet und wird eingeschaltet, sobald der E-Mail-Versand eingerichtet ist.</p></section>';
  };

  /* ---------- Auswertungen und wirtschaftlicher Nutzen ---------- */
  V.auswertungen = async function () {
    var r = await Promise.all([K.liste("anfragen"), K.liste("angebote"), K.liste("rechnungen"), K.liste("zahlungen"), K.liste("berichte"), K.liste("auftraege"), K.liste("material")]);
    var anf = r[0], ang = r[1], re = r[2].filter(function (x) { return x.status !== "entwurf" && x.status !== "storniert"; }), za = r[3], ber = r[4], au = r[5], mat = r[6];
    var monate = []; for (var i = 5; i >= 0; i--) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); monate.push(d.toISOString().slice(0, 7)); }
    var balken = function (titel, werte, fmt) { var max = Math.max.apply(null, werte.concat([1])); return '<section class="karte"><h2>' + h(titel) + '</h2><div class="balken">' + werte.map(function (w, i) { return '<div><span style="height:' + Math.round(w / max * 100) + '%" title="' + h(fmt(w)) + '"></span><b>' + h(fmt(w)) + "</b><small>" + new Date(monate[i] + "-15").toLocaleDateString("de-DE", { month: "short" }) + "</small></div>"; }).join("") + "</div></section>"; };
    var umsatz = monate.map(function (m) { return re.filter(function (x) { return String(x.datum).slice(0, 7) === m; }).reduce(function (s, x) { return s + (+x.netto); }, 0); });
    var eingang = monate.map(function (m) { return za.filter(function (x) { return String(x.datum).slice(0, 7) === m; }).reduce(function (s, x) { return s + (+x.betrag); }, 0); });
    var anfM = monate.map(function (m) { return anf.filter(function (x) { return String(x.created_at).slice(0, 7) === m; }).length; });
    var entschieden = ang.filter(function (a) { return a.status === "angenommen" || a.status === "abgelehnt"; }), quote = entschieden.length ? Math.round(entschieden.filter(function (a) { return a.status === "angenommen"; }).length / entschieden.length * 100) : null;
    var nachErinnerung = ang.filter(function (a) { return a.status === "angenommen" && a.erinnert > 0; });
    var offenAng = ang.filter(function (a) { return a.status === "gesendet"; });
    var bez = {}; za.forEach(function (z) { bez[z.rechnung_id] = (bez[z.rechnung_id] || 0) + (+z.betrag); });
    var forderung = re.filter(function (x) { return x.status === "gestellt" || x.status === "teilbezahlt"; }).reduce(function (s, x) { return s + (+x.brutto) - (bez[x.id] || 0); }, 0);
    var ueber = re.filter(function (x) { return (x.status === "gestellt" || x.status === "teilbezahlt") && x.faellig < U.isoTag(); });
    var nichtAbg = ber.filter(function (b) { return b.zusatzleistung && b.status !== "abgerechnet"; }).reduce(function (s, b) { return s + (+b.stunden) * (+K.ctx.betrieb.stundensatz) + (+b.material_euro); }, 0);
    var abgOhneRe = au.filter(function (a) { return a.status === "abgeschlossen" && !re.some(function (x) { return x.auftrag_id === a.id; }); });
    var mitIst = au.map(function (a) { return { a: a, k: K.kalk(a, ber.filter(function (b) { return b.auftrag_id === a.id; }), mat.filter(function (m) { return m.auftrag_id === a.id; })) }; }).filter(function (x) { return x.k.istStd > 0; });
    var gruende = {}; anf.filter(function (a) { return a.status === "verloren" && a.verlustgrund; }).forEach(function (a) { gruende[a.verlustgrund] = (gruende[a.verlustgrund] || 0) + 1; });
    var karte = function (t, art, wert, text) { return '<article class="karte nz"><span class="pill">' + art + "</span><h3>" + h(t) + "</h3><b>" + wert + "</b><small>" + text + "</small></article>"; };
    return K.kopf("Auswertungen", "Ihre Zahlen – jede mit Rechenweg. Volumen ist kein Umsatz, Umsatz ist kein Zahlungseingang.") +
      '<div class="karten">' +
        karte("Offene Angebote", "Volumen", U.eur(offenAng.reduce(function (s, a) { return s + (+a.netto); }, 0)), offenAng.length + " gesendete Angebote ohne Antwort, netto") +
        karte("Nach Erinnerung angenommen", "Volumen", U.eur(nachErinnerung.reduce(function (s, a) { return s + (+a.netto); }, 0)), nachErinnerung.length + " Angebote wurden nach mindestens einer Erinnerung angenommen (netto). Ob sie ohne Erinnerung gekommen wären, weiß niemand.") +
        karte("Gewinnquote", "Anzahl", quote == null ? "–" : quote + " %", "angenommen von allen entschiedenen Angeboten (" + entschieden.length + ")") +
        karte("Offene Forderungen", "Zahlung", U.eur(forderung), ueber.length + " Rechnungen überfällig") +
        karte("Nicht abgerechnet", "Umsatz", U.eur(nichtAbg), "Zusatzleistungen aus Regieberichten ohne Rechnung (Stunden × " + U.eur(K.ctx.betrieb.stundensatz) + " + Material)" + (abgOhneRe.length ? ", dazu " + abgOhneRe.length + " abgeschlossene Aufträge ohne Rechnung" : "")) +
        karte("Deckungsbeitrag", "Deckungsbeitrag", mitIst.length ? U.eur(mitIst.reduce(function (s, x) { return s + x.k.dbIst; }, 0)) : "fehlt", mitIst.length ? mitIst.length + " Aufträge mit erfassten Stunden" : "Noch keine Stunden in Regieberichten") +
      "</div>" + '<div class="raster-2">' + balken("Umsatz (gestellte Rechnungen, netto)", umsatz, U.eur) + balken("Zahlungseingang", eingang, U.eur) + balken("Anfragen je Monat", anfM, String) +
      '<section class="karte"><h2>Warum Anfragen verloren gehen</h2>' + (Object.keys(gruende).length ? '<ul class="liste">' + Object.keys(gruende).sort(function (a, b) { return gruende[b] - gruende[a]; }).map(function (g) { return "<li>" + h(g) + ": <b>" + gruende[g] + "</b></li>"; }).join("") + "</ul>" : '<p class="still">Noch keine verlorenen Anfragen mit Grund.</p>') + "</section></div>";
  };

  /* ---------- Assistent (Regel-Erkennung, keine KI) ---------- */
  var ZW = { ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, zwölf: 12 }, WT = ["sonntag", "montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag"];
  V.assistent = async function () {
    var verl = K._kiVerlauf || (K._kiVerlauf = []);
    return K.kopf("Assistent", "Sagen oder schreiben Sie, was zu tun ist. Kundario macht einen Vorschlag, erst nach „Passt“ wird etwas geändert.") +
      '<section class="karte ki"><div class="ki-log" id="ki-log">' + (verl.length ? verl.map(function (m) { return '<div class="ki-msg ' + m.wer + '"><div class="ki-blase">' + m.html + "</div></div>"; }).join("") : '<div class="ki-msg ki"><div class="ki-blase">Beispiele:<ul><li>Bestell 3 Kupferrohre 15 mm für Huber</li><li>Bei Huber muss die Steckdose versetzt werden</li><li>Huber kann erst am Donnerstag um 9 Uhr</li><li>Was ist heute offen?</li></ul></div></div>') + "</div>" +
      '<form class="ki-eingabe" data-f="ki"><button type="button" class="ki-mic" data-a="kiMic" aria-label="Sprechen">🎤</button><input name="text" autocomplete="off" placeholder="Was soll ich tun?" required><button class="btn btn-signal">Senden</button></form>' +
      '<p class="still">Erkennt einfache Sätze wie die Beispiele (Regel-Erkennung, keine KI). Spracheingabe nutzt die Spracherkennung Ihres Browsers; dabei kann der Browser die Aufnahme an seinen Anbieter senden.</p></section>';
  };
  V.assistent.danach = function () { var l = document.getElementById("ki-log"); if (l) l.scrollTop = l.scrollHeight; };
  async function kundeIn(t) { var ks = await K.liste("kunden", { select: "id,name" }), best = null; ks.forEach(function (k) { k.name.toLowerCase().replace(/^(familie|herr|frau|firma)\s+/, "").split(/[\s,]+/).filter(function (w) { return w.length >= 4; }).forEach(function (w) { if (new RegExp("(^|[^a-zäöüß])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-zäöüß]|$)").test(t) && (!best || w.length > best.l)) best = { k: k, l: w.length }; }); }); return best && best.k; }
  async function auftragVon(k) { if (!k) return null; return (await K.liste("auftraege", { wo: { kunde_id: k.id, status: ["geplant", "in_arbeit", "pausiert"] }, sortiere: "created_at.desc" }))[0] || null; }
  function tagIn(t) { var d = new Date(); d.setHours(12, 0, 0, 0);
    if (/übermorgen/.test(t)) { d.setDate(d.getDate() + 2); return d; } if (/\bmorgen\b/.test(t)) { d.setDate(d.getDate() + 1); return d; } if (/\bheute\b/.test(t)) return d;
    var m = t.match(/(\d{1,2})\.\s?(\d{1,2})\./); if (m) { var x = new Date(d.getFullYear(), +m[2] - 1, +m[1], 12); if (x < d) x.setFullYear(x.getFullYear() + 1); return x; }
    for (var i = 0; i < 7; i++) if (new RegExp("\\b" + WT[i]).test(t)) { var o = (i - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + o); return d; } return null; }
  function zeitIn(t) { var m = t.match(/\bum (\d{1,2})(?:[:.](\d{2}))?/) || t.match(/\b(\d{1,2})(?:[:.](\d{2}))? uhr/); return m ? ("0" + m[1]).slice(-2) + ":" + (m[2] || "00") : null; }
  function sag(wer, html) { (K._kiVerlauf = K._kiVerlauf || []).push({ wer: wer, html: html }); }
  K.formular.ki = async function (d) {
    var text = d.text.trim(), t = text.toLowerCase(); sag("ich", h(text)); K._kiVorschlag = null;
    var k = await kundeIn(t), v = null;
    if (/was (ist|steht)|offen\b|meine aufgaben/.test(t) && !/bestell/.test(t)) {
      var ter = (await K.liste("termine", { sortiere: "beginn.asc" })).filter(function (x) { return U.isoTag(x.beginn) === U.isoTag() && (x.mitarbeiter || []).indexOf(K.ctx.user.id) > -1; });
      var auf = (await K.liste("aufgaben", { wo: { erledigt: false } })).filter(function (x) { return !x.zugewiesen_an || x.zugewiesen_an === K.ctx.user.id; });
      sag("ki", "<b>Heute</b>" + (ter.length ? "<ul>" + ter.map(function (x) { return "<li>" + U.zeit(x.beginn) + " " + h(x.titel) + "</li>"; }).join("") + "</ul>" : "<p>Keine Termine.</p>") + "<b>Offene Aufgaben</b>" + (auf.length ? "<ul>" + auf.slice(0, 8).map(function (x) { return "<li>" + h(x.titel) + "</li>"; }).join("") + "</ul>" : "<p>Keine.</p>"));
    } else if (/bestell|besorg|brauch/.test(t)) {
      var w = t.replace(/,/g, " ").split(/\s+/), menge = 1, st = 0, tr = w.findIndex(function (x) { return /bestell|besorg|brauch/.test(x); });
      for (var i = tr + 1; i < w.length; i++) { var z = /^\d+([.,]\d+)?$/.test(w[i]) ? U.zahl(w[i]) : ZW[w[i]]; if (z != null && !/^(mm|cm|m|meter)$/.test(w[i + 1] || "")) { menge = z; st = i + 1; break; } }
      if (!st) st = tr + 1;
      var art = w.slice(st).join(" ").split(/\s(?:für|an|ans|bei|beim|und)\s/)[0].replace(/^(mir|uns|bitte|noch|mal|x|stück)\s+/, "").replace(/\s(mal|stück)\b/, "").trim();
      var pos = text.toLowerCase().indexOf(art); if (pos > -1) art = text.substr(pos, art.length);
      if (!art) sag("ki", "Was soll ich bestellen?"); else { var au = await auftragVon(k); v = { art: "bestellung", menge: menge, artikel: art.charAt(0).toUpperCase() + art.slice(1), auftrag: au }; sag("ki", "<b>Bestellung</b><ul><li>" + U.zahlText(menge) + " × " + h(v.artikel) + "</li><li>Für: " + (au ? h(au.nr + " · " + au.titel) : "Lager") + "</li><li>Geht ans Büro zur Freigabe</li></ul>"); }
    } else if (k && tagIn(t)) {
      var tag = tagIn(t), zeit = zeitIn(t), alt = (await K.liste("termine", { wo: { kunde_id: k.id }, sortiere: "beginn.asc" })).filter(function (x) { return new Date(x.beginn) >= new Date(Date.now() - 864e5); })[0];
      v = { art: "termin", k: k, tag: tag, zeit: zeit || (alt ? U.zeit(alt.beginn) : "08:00"), alt: alt };
      sag("ki", "<b>Termin " + (alt ? "verschieben" : "anlegen") + "</b><ul><li>" + h(k.name) + "</li>" + (alt ? "<li>Bisher: " + U.datumZeit(alt.beginn) + "</li>" : "") + "<li>Neu: " + tag.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "numeric" }) + " um " + v.zeit + " Uhr</li></ul>");
    } else if (k && /muss|soll|änder|nachtrag|zusätzlich|versetz|tausch|kaputt|möchte|wünscht/.test(t)) {
      var au2 = await auftragVon(k); v = { art: "aenderung", k: k, auftrag: au2, was: text };
      sag("ki", "<b>Änderung melden</b><ul><li>" + h(k.name) + (au2 ? " (" + h(au2.nr) + ")" : "") + "</li><li>" + h(text) + "</li><li>Wird Aufgabe fürs Büro, Nachtrag prüfen</li></ul>");
    } else { var ki = K.kiFrage ? await K.kiFrage(text) : null;
      sag("ki", ki ? h(ki).replace(/\n/g, "<br>") : k ? "Was soll ich bei " + h(k.name) + " tun? Bestellen, Termin ändern oder eine Änderung melden?" : "Das habe ich nicht verstanden. Nennen Sie bitte den Kunden mit Nachnamen und was zu tun ist."); }
    if (v) { K._kiVorschlag = v; sag("ki", '<div class="ki-knoepfe"><button class="btn btn-signal klein" data-a="kiOk">Passt</button><button class="btn btn-outline klein" data-a="kiNein">Abbrechen</button></div>'); }
    K.neuLaden();
  };
  K.aktion.kiNein = function () { K._kiVorschlag = null; sag("ki", "Abgebrochen, nichts geändert."); K.neuLaden(); };
  K.aktion.kiOk = async function () {
    var v = K._kiVorschlag; if (!v) return; K._kiVorschlag = null;
    if (v.art === "bestellung") { await K.neu("material", { artikel: v.artikel, menge: v.menge, auftrag_id: v.auftrag ? v.auftrag.id : null, status: "freigabe", erstellt_von: K.ctx.user.id }); if (v.auftrag) await K.verlauf("auftrag", v.auftrag.id, "Material per Assistent angefordert: " + v.menge + " × " + v.artikel); sag("ki", "Erledigt: steht unter Material zur Freigabe."); }
    if (v.art === "termin") { var b = new Date(U.isoTag(v.tag) + "T" + v.zeit); if (v.alt) { var dauer = v.alt.ende ? new Date(v.alt.ende) - new Date(v.alt.beginn) : 36e5; await DB.aendern("termine", v.alt.id, { beginn: b.toISOString(), ende: new Date(b.getTime() + dauer).toISOString() }); } else await K.neu("termine", { titel: "Termin " + v.k.name, kunde_id: v.k.id, beginn: b.toISOString(), mitarbeiter: [K.ctx.user.id], art: "sonstiges" }); await K.verlauf("kunde", v.k.id, "Termin per Assistent auf " + U.datumZeit(b) + " gelegt"); sag("ki", "Erledigt: Termin steht im Kalender. Den Kunden informieren Sie im Termin über „Kunde informieren“."); }
    if (v.art === "aenderung") { if (v.auftrag) await K.neu("aufgaben", { auftrag_id: v.auftrag.id, titel: "Änderung: " + v.was }); await K.verlauf(v.auftrag ? "auftrag" : "kunde", v.auftrag ? v.auftrag.id : v.k.id, "Änderung gemeldet: " + v.was); sag("ki", "Erledigt: " + (v.auftrag ? "Aufgabe im Auftrag " + h(v.auftrag.nr) : "im Verlauf des Kunden") + " vermerkt."); }
    K.neuLaden();
  };
  K.aktion.kiMic = function (el) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) throw new Error("Spracheingabe geht in diesem Browser nicht – bitte tippen (Chrome oder Safari).");
    var e = new SR(), f = document.querySelector('[data-f="ki"]'); e.lang = "de-DE"; e.interimResults = true;
    e.onresult = function (ev) { var t = ""; for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript; f.elements.text.value = t; if (ev.results[ev.results.length - 1].isFinal) f.requestSubmit(); };
    e.onerror = function () { U.toast("Nichts verstanden – bitte noch einmal.", "fehler"); }; el.classList.add("hoert"); e.onend = function () { el.classList.remove("hoert"); }; e.start();
  };

  /* ---------- Team ---------- */
  V.team = async function () {
    var ein = K.ctx.ich.rolle === "gf" ? await K.liste("einladungen", { wo: { angenommen_at: null }, sortiere: "created_at.desc" }) : [];
    K.ctx.team = await DB.liste("mitglieder", { wo: { betrieb_id: K.bid() }, sortiere: "name.asc" });
    var gf = K.ctx.ich.rolle === "gf";
    return K.kopf("Team", "Wer sieht was: Geschäftsführung alles, Büro alles außer Einstellungen, Außendienst ohne Rechnungen, Montagekraft nur Baustelle.", gf ? '<button class="btn btn-signal" data-a="einladen">Mitarbeiter einladen</button>' : "") +
      '<div class="tabelle"><table><thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Aktiv</th></tr></thead><tbody>' + K.ctx.team.map(function (m) {
        var ich = m.user_id === K.ctx.user.id;
        return "<tr><td>" + h(m.name) + (ich ? " (Sie)" : "") + "</td><td>" + h(m.email || "") + "</td><td>" + (gf && !ich ? '<select data-a-change="rolle" data-u="' + m.user_id + '">' + Object.keys(K.rolleName).map(function (r) { return '<option value="' + r + '"' + (r === m.rolle ? " selected" : "") + ">" + K.rolleName[r] + "</option>"; }).join("") + "</select>" : h(K.rolleName[m.rolle])) + "</td><td>" + (gf && !ich ? '<input type="checkbox" data-a-change="aktiv" data-u="' + m.user_id + '"' + (m.aktiv ? " checked" : "") + ">" : (m.aktiv ? "ja" : "nein")) + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      (ein.length ? '<section class="karte"><h2>Offene Einladungen</h2><ul class="liste">' + ein.map(function (e) { return "<li>" + h(e.name) + " · " + h(e.email) + " · " + h(K.rolleName[e.rolle]) + ' <button class="btn btn-outline klein" data-a="einLink" data-t="' + h(e.token) + '">Link kopieren</button> <button class="mini" data-a="einWeg" data-id="' + e.id + '">×</button></li>'; }).join("") + "</ul></section>" : "");
  };
  K.aktion.einladen = async function () {
    var r = await U.dialog("Mitarbeiter einladen", U.feld("name", "Name", "", { pflicht: true }) + U.feld("email", "E-Mail", "", { typ: "email", pflicht: true }) + U.feld("rolle", "Rolle", "monteur", { optionen: Object.keys(K.rolleName).map(function (x) { return [x, K.rolleName[x]]; }) })); if (!r) return;
    var e = await K.neu("einladungen", { name: r.daten.name, email: r.daten.email.toLowerCase().trim(), rolle: r.daten.rolle });
    var link = location.origin + location.pathname + "?einladung=" + e.token;
    U.mail(e.email, "Einladung zu Kundario – " + K.ctx.betrieb.name, "Hallo " + e.name + ",\n\nich habe dich zu Kundario eingeladen. Leg über diesen Link ein Konto mit dieser E-Mail-Adresse an:\n" + link + "\n\nViele Grüße\n" + K.ctx.ich.name);
    U.toast("Einladung erstellt."); K.neuLaden();
  };
  K.aktion.einLink = function (el) { U.kopieren(location.origin + location.pathname + "?einladung=" + el.dataset.t); };
  K.aktion.einWeg = async function (el) { await DB.loeschen("einladungen", el.dataset.id).catch(function () {}); K.neuLaden(); };
  K.aktion.rolle = async function (el) { await K.mitgliedAendern(el.dataset.u, { rolle: el.value }); U.toast("Rolle geändert."); };
  K.aktion.aktiv = async function (el) { await K.mitgliedAendern(el.dataset.u, { aktiv: el.checked }); U.toast(el.checked ? "Aktiviert." : "Deaktiviert – kein Zugriff mehr."); };
  K.mitgliedAendern = function (uid, patch) { return DB.mitgliedAendern(K.bid(), uid, patch); };

  /* ---------- Einstellungen ---------- */
  V.einstellungen = async function () {
    var b = K.ctx.betrieb = await DB.eins("betriebe", K.bid());
    return K.kopf("Einstellungen", "Diese Angaben stehen auf Angeboten und Rechnungen.") +
      '<form class="karte formular" data-f="betrieb"><h2>Betrieb</h2><div class="raster">' + U.feld("name", "Name", b.name, { pflicht: true }) + U.feld("inhaber", "Inhaber", b.inhaber) + U.feld("gewerk", K.istVerwaltung && K.istVerwaltung() ? "Art" : "Gewerk", b.gewerk, K.istVerwaltung && K.istVerwaltung() ? { attr: " readonly", hilfe: "Hausverwaltung – wird von Kundario festgelegt." } : {}) +
        U.feld("strasse", "Straße und Nr.", b.strasse) + U.feld("plz", "PLZ", b.plz) + U.feld("ort", "Ort", b.ort) + U.feld("telefon", "Telefon", b.telefon, { typ: "tel" }) + U.feld("email", "E-Mail", b.email, { typ: "email" }) + U.feld("website", "Website", b.website) + "</div>" +
        '<h2>Steuer und Bank</h2><div class="raster">' + U.feld("steuernummer", "Steuernummer", b.steuernummer) + U.feld("ust_id", "USt-IdNr.", b.ust_id) + U.feld("mwst", "Umsatzsteuer %", U.zahlText(b.mwst), { typ: "number" }) + U.feld("kleinunternehmer", "Kleinunternehmer (§ 19 UStG) – keine Umsatzsteuer", b.kleinunternehmer, { typ: "checkbox" }) + U.feld("bank", "Bank", b.bank) + U.feld("iban", "IBAN", b.iban) + U.feld("bic", "BIC", b.bic) + "</div>" +
        '<h2>Abläufe</h2><div class="raster">' + U.feld("stundensatz", "Stundensatz für Kunden (€ netto)", U.zahlText(b.stundensatz, 2), { typ: "number" }) + U.feld("zahlungsziel_tage", "Zahlungsziel (Tage)", b.zahlungsziel_tage, { typ: "number" }) + U.feld("angebot_gueltig_tage", "Angebote gültig (Tage)", b.angebot_gueltig_tage, { typ: "number" }) + U.feld("nachfass_tage", "Nachfassen nach … Tagen", (b.nachfass_tage || []).join(", "), { hilfe: "z. B. 3, 7, 14" }) +
          U.feld("skonto_prozent", "Skonto % (Standard, optional)", b.skonto_prozent ? U.zahlText(b.skonto_prozent) : "", { typ: "number" }) + U.feld("skonto_tage", "Skonto innerhalb Tagen", b.skonto_tage || "", { typ: "number" }) + "</div>" +
        '<h2>Logo</h2><div class="logo-zeile">' + (b.logo ? '<img class="logo-vorschau" src="' + h(b.logo) + '" alt="Ihr Logo">' : '<p class="still">Noch kein Logo. Es erscheint auf Angeboten, Rechnungen und im Kundenportal.</p>') +
          '<label class="btn btn-outline klein">Logo wählen<input type="file" accept="image/png,image/jpeg,image/svg+xml" hidden data-logo></label>' + (b.logo ? '<button type="button" class="btn btn-ghost klein" data-a="logoWeg">Entfernen</button>' : "") + "</div>" +
        '<div class="knoepfe"><button class="btn btn-signal">Speichern</button></div></form>' +
      '<section class="karte"><h2>Darstellung</h2><p>Nur für dieses Gerät.</p>' + U.feld("dunkel", "Dunkles Design verwenden", document.documentElement.getAttribute("data-theme") === "dark", { typ: "checkbox", attr: ' data-a-change="design"' }) + "</section>" +
      '<section class="karte"><h2>Daten</h2><p>Alle Daten Ihres Betriebs als Datei herunterladen (z. B. für Ihren Steuerberater oder zur Sicherung).</p><button class="btn btn-outline" data-a="export">Daten herunterladen</button> <button class="btn btn-outline" data-a="beispiel">Beispieldaten anlegen</button> <a class="btn btn-ghost" href="#/fehler">Fehlerprotokoll</a></p><h3>Steuerberater</h3><p>Rechnungsausgangsbuch oder DATEV-Buchungsstapel für Ihren Steuerberater.</p><p><button class="btn btn-outline" data-a="steuerExport">Export für den Steuerberater</button> <button class="btn btn-outline" data-a="datevEinst">Konten und Beraternummer</button>' + (DB.modus === "lokal" ? ' <button class="btn btn-ghost gefahr" data-a="testReset">Testdaten löschen</button>' : "") + "</section>";
  };
  K.formular.betrieb = async function (d) {
    var tage = String(d.nachfass_tage).split(/[,; ]+/).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x > 0 && x < 100; }).sort(function (a, b) { return a - b; });
    if (d.iban && !/^[A-Z]{2}\d{2}[A-Z0-9 ]{10,30}$/i.test(d.iban.trim())) throw new Error("Die IBAN sieht nicht richtig aus.");
    K.ctx.betrieb = await DB.aendern("betriebe", K.bid(), { name: d.name.trim(), inhaber: d.inhaber, gewerk: d.gewerk, strasse: d.strasse, plz: d.plz, ort: d.ort, telefon: d.telefon, email: d.email, website: d.website, steuernummer: d.steuernummer, ust_id: d.ust_id, mwst: U.zahl(d.mwst), kleinunternehmer: !!d.kleinunternehmer, skonto_prozent: d.skonto_prozent ? U.zahl(d.skonto_prozent) : null, skonto_tage: parseInt(d.skonto_tage, 10) || null, bank: d.bank, iban: d.iban ? d.iban.replace(/\s/g, "").toUpperCase() : null, bic: d.bic, stundensatz: U.zahl(d.stundensatz), zahlungsziel_tage: parseInt(d.zahlungsziel_tage, 10) || 14, angebot_gueltig_tage: parseInt(d.angebot_gueltig_tage, 10) || 30, nachfass_tage: tage.length ? tage : [3, 7, 14] });
    U.toast("Gespeichert."); K.neuLaden();
  };
  K.aktion.design = function (el) { try { localStorage.setItem("kundario-design", el.checked ? "dunkel" : "hell"); } catch (e) { /* privat */ } document.documentElement.setAttribute("data-theme", el.checked ? "dark" : "light"); U.toast(el.checked ? "Dunkles Design an." : "Helles Design an."); };
  document.addEventListener("change", function (e) {
    var inp = e.target.closest("[data-logo]"); if (!inp || !inp.files.length) return;
    var f = inp.files[0]; if (f.size > 5e6) return U.toast("Das Bild ist zu groß (höchstens 5 MB).", "fehler");
    var img = new Image(), url = URL.createObjectURL(f);
    img.onload = async function () {
      var s = Math.min(1, 600 / img.width, 240 / img.height), c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      var daten = c.toDataURL("image/png"); if (daten.length > 250000) daten = c.toDataURL("image/jpeg", 0.85);
      try { K.ctx.betrieb = await DB.aendern("betriebe", K.bid(), { logo: daten }); U.toast("Logo gespeichert."); K.neuLaden(); } catch (x) { U.fehler(x); }
    };
    img.onerror = function () { U.toast("Das Bild konnte nicht gelesen werden.", "fehler"); }; img.src = url;
  });
  K.aktion.logoWeg = async function () { K.ctx.betrieb = await DB.aendern("betriebe", K.bid(), { logo: null }); K.neuLaden(); };
  K.aktion.export = async function () {
    var T = ["kunden", "anfragen", "angebote", "auftraege", "termine", "aufgaben", "berichte", "rechnungen", "zahlungen", "material", "aufmasse", "dokumente", "verlauf", "artikel", "vorlagen", "zeiten", "wartungen", "protokolle", "lager", "ausgaben", "kontostaende", "belege", "kasse"], out = { betrieb: K.ctx.betrieb, exportiert: new Date().toISOString() };
    for (var i = 0; i < T.length; i++) out[T[i]] = await K.liste(T[i]).catch(function () { return []; });
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = "kundario-export-" + U.isoTag() + ".json"; a.click();
  };
  K.aktion.testReset = async function () { if (!(await U.bestaetigen("Alle Testdaten in diesem Browser löschen?", "Löschen", true))) return; DB.testdatenLoeschen(); location.reload(); };
})();
