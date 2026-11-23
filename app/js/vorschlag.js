/* Kundario – Angebotsvorschlag aus der Anfrage (regelbasiert, ohne KI-Dienst, ohne Datenweitergabe).
   Quellen: 1) Aufmaß zur Anfrage (Bauteile mit Bauteil-Preisen), 2) eigener Katalog (Wörter aus Betreff/Beschreibung),
   3) ähnliche frühere Angebote (angenommen zählt mehr). Alles landet als ENTWURF; jede Position zeigt ihre Herkunft. */
(function () {
  var V = K.views, DB = window.KDB, h = U.h;
  var STOPP = "bitte,eine,einen,einer,eines,und,oder,der,die,das,den,dem,des,mit,ohne,für,fuer,von,bei,auf,aus,ist,sind,wir,ich,sie,ihr,uns,neu,neue,neuen,alte,alten,altes,haus,wohnung,gerne,hallo,guten,tag,danke,angebot,anfrage,brauche,brauchen,möchte,möchten,würde,wäre,haben,hätte,kosten,preis,termin,stück,stk,etwa,ca,circa,noch,auch,schon,sehr,mehr,ganz,alle,alles,dass,wenn,dann,nach,über,unter,zum,zur,im,in,am,an,es,ein,tauschen,austauschen,erneuern,reparieren,reparatur,montieren,montage,einbauen,ausbauen,wechseln,machen,klemmt,defekt,kaputt,geht,funktioniert,nicht,wohnzimmer,küche,kueche,schlafzimmer,kinderzimmer,keller,garten,erdgeschoss,obergeschoss".split(",");
  var ZAHLWORT = { ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, zwölf: 12 };
  // einfacher Wortstamm: Fenster/Fensters, Rollladen/Rollläden, Markise/Markisen, Tür/Türen
  var stamm = function (w) { w = w.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss"); return w.replace(/(ern|en|er|es|e|n|s)$/, ""); };
  var woerter = function (t) { return String(t || "").toLowerCase().split(/[^a-zäöüß0-9]+/).filter(function (w) { return w.length >= 4 && STOPP.indexOf(w) < 0 && !/^\d+$/.test(w); }); };
  K.vsWoerter = woerter; K.vsStamm = stamm;

  // Menge aus dem Text: „3 Fenster“, „drei Rollläden“, „2x Markise“ → { fenst: 3, rolllad: 3, markis: 2 }
  K.vsMengen = function (text) {
    var m = {}, re = /(\d+(?:[.,]\d+)?|ein|eine|einen|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|zwölf)\s*(?:x|stk\.?|stück)?\s+(?:neue[nrs]?\s+|alte[nrs]?\s+|große[nrs]?\s+|kleine[nrs]?\s+)?([a-zäöüß-]{4,})/gi, x;
    while ((x = re.exec(String(text || "")))) { var z = ZAHLWORT[x[1].toLowerCase()] || U.zahl(x[1]); if (z > 0 && z < 1000) m[stamm(x[2])] = z; }
    return m;
  };

  // Katalog-Treffer: Anteil der Stämme aus der Anfrage, die im Artikeltext vorkommen
  K.vsKatalog = function (anfrageText, artikel) {
    var st = woerter(anfrageText).map(stamm), mengen = K.vsMengen(anfrageText); if (!st.length) return [];
    return artikel.map(function (a) {
      var passt = function (l) { return function (s) { return l.some(function (w) { return w === s || (s.length >= 5 && w.length >= 5 && (w.indexOf(s) > -1 || s.indexOf(w) === 0)); }); }; };
      var aw = woerter(a.text).map(stamm), ak = woerter(a.kategorie || "").map(stamm), einmal = st.filter(function (s, i) { return st.indexOf(s) === i; });
      var treffer = einmal.filter(passt(aw)), nurKat = einmal.filter(function (s) { return treffer.indexOf(s) < 0 && passt(ak)(s); });
      var menge = 1; treffer.concat(nurKat).forEach(function (s) { Object.keys(mengen).forEach(function (k) { if (k === s || k.indexOf(s) === 0 || s.indexOf(k) === 0) menge = mengen[k]; }); });
      return { a: a, punkte: treffer.length + nurKat.length * 0.5, menge: menge, treffer: treffer };
    }).filter(function (x) { return x.punkte > 0; }).sort(function (x, y) { return y.punkte - x.punkte || String(x.a.text).localeCompare(String(y.a.text)); }).slice(0, 8);
  };

  // Ähnliche frühere Angebote: gemeinsame Stämme im Titel, angenommen zählt doppelt
  K.vsAehnlich = function (anfrageText, angebote) {
    var st = woerter(anfrageText).map(stamm);
    return angebote.filter(function (x) { return x.status !== "entwurf" && (x.positionen || []).some(function (p) { return p.typ === "pos" && +p.preis > 0; }); }).map(function (x) {
      var tw = woerter(x.titel).map(stamm), gem = st.filter(function (s, i) { return st.indexOf(s) === i && tw.indexOf(s) > -1; }).length;
      return { an: x, punkte: gem * (x.status === "angenommen" ? 2 : 1) };
    }).filter(function (x) { return x.punkte > 0; }).sort(function (x, y) { return y.punkte - x.punkte; }).slice(0, 2);
  };

  K.aktion.angebotVorschlag = async function (el) {
    var a = await DB.eins("anfragen", el.dataset.id); if (!a) return;
    if (!a.kunde_id) throw new Error("Bitte der Anfrage zuerst einen Kunden zuordnen.");
    var text = [a.betreff, a.beschreibung].join(" ");
    var r = await Promise.all([K.liste("artikel", { wo: { aktiv: true } }).catch(function () { return []; }), K.liste("angebote", { sortiere: "created_at.desc", limit: 200 }).catch(function () { return []; }), K.liste("aufmasse", { wo: { anfrage_id: a.id } }).catch(function () { return []; })]);
    var vor = [], neu = function (p, quelle, an) { vor.push({ p: Object.assign({ id: U.uuid(), typ: "pos" }, p), quelle: quelle, an: an !== false }); };
    // 1) Aufmaß
    r[2].forEach(function (am) { if (K.amBauteilPos && K.btSummen && K.btSummen(am.daten || {}).stueck) K.amBauteilPos(am.daten, true, true).forEach(function (p) { neu(p, "Aufmaß " + (am.titel || "")); }); });
    var ausAufmass = vor.length;
    // 2) Katalog
    K.vsKatalog(text, r[0]).forEach(function (x, i) { neu({ text: x.a.text, langtext: x.a.langtext || "", menge: x.menge, einheit: x.a.einheit || "Stk.", preis: +x.a.preis || 0, artikel_id: x.a.id }, "Katalog", !ausAufmass && (x.punkte >= 2 || i < 3)); });
    // 3) Ähnliche Angebote
    K.vsAehnlich(text, r[1]).forEach(function (x, j) { (x.an.positionen || []).filter(function (p) { return p.typ === "pos" && String(p.text).trim(); }).slice(0, 8).forEach(function (p) {
      if (vor.some(function (v) { return String(v.p.text).toLowerCase() === String(p.text).toLowerCase(); })) return;
      neu({ text: p.text, langtext: p.langtext || "", menge: +p.menge || 1, einheit: p.einheit || "Stk.", preis: +p.preis || 0, artikel_id: p.artikel_id || null }, "wie " + x.an.nr + (x.an.status === "angenommen" ? " ✓" : ""), !ausAufmass && j === 0 && !r[0].length);
    }); });
    if (!vor.length) {
      var w = await U.dialog("Angebot vorschlagen", "<p>Für „" + h(a.betreff) + "“ gibt es noch nichts Passendes in Ihrem Katalog, in früheren Angeboten oder in einem Aufmaß.</p><p class=\"still\">Tipp: Legen Sie häufige Leistungen im Katalog an oder machen Sie ein Aufmaß – dann schlägt Kundario beim nächsten Mal die Positionen mit Ihren Preisen vor.</p>", [{ wert: "", text: "Schließen" }, { wert: "leer", text: "Leeres Angebot anlegen", primaer: true }]);
      if (w && w.wert === "leer") return K.aktion.angebotAusAnfrage(el); return;
    }
    var liste = '<p class="still">Aus Ihren eigenen Daten zusammengestellt – nichts davon geht ohne Ihre Prüfung an den Kunden.</p><div class="vs-liste">' + vor.map(function (v, i) {
      return '<label class="vs-zeile"><input type="checkbox" name="v' + i + '"' + (v.an ? " checked" : "") + '><span class="vs-text"><b>' + h(v.p.text) + "</b><small>" + U.zahlText(v.p.menge) + " " + h(v.p.einheit) + " × " + (v.p.preis ? U.eur(v.p.preis) : '<span class="t-kritisch">Preis fehlt</span>') + '</small></span><span class="vs-quelle">' + h(v.quelle) + "</span></label>";
    }).join("") + "</div>";
    var d = await U.dialog("Angebot vorschlagen: " + a.betreff, liste, [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Entwurf anlegen", primaer: true }]); if (!d || d.wert !== "ok") return;
    var pos = vor.filter(function (v, i) { return d.daten["v" + i]; }).map(function (v) { return v.p; });
    if (!pos.length) throw new Error("Bitte mindestens eine Position auswählen.");
    var an = await K.neu("angebote", { nr: await K.nr("AN"), kunde_id: a.kunde_id, anfrage_id: a.id, titel: a.betreff, mwst: K.mwst(), einleitung: "vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen folgende Leistungen an:", positionen: pos });
    await K.verlauf("anfrage", a.id, "Angebot " + an.nr + " als Vorschlag angelegt (" + pos.length + " Positionen)");
    U.toast(pos.some(function (p) { return !p.preis; }) ? "Entwurf angelegt – bitte fehlende Preise eintragen und prüfen." : "Entwurf angelegt – bitte prüfen und senden."); K.go("angebote/" + an.id);
  };

  // Knopf in der Anfrage neben „Angebot erstellen“
  var alt = V.anfragen.danach;
  V.anfragen.danach = async function (id, extra) {
    if (alt) await alt(id, extra);
    var k = document.querySelector('#inhalt [data-a="angebotAusAnfrage"][data-id="' + id + '"]');
    if (k && !document.querySelector('#inhalt [data-a="angebotVorschlag"]')) k.insertAdjacentHTML("beforebegin", '<button class="btn btn-signal" data-a="angebotVorschlag" data-id="' + h(id) + '">✦ Angebot vorschlagen</button>');
    if (k) { k.classList.remove("btn-signal"); k.classList.add("btn-outline"); k.textContent = "Leeres Angebot"; }
  };
})();
