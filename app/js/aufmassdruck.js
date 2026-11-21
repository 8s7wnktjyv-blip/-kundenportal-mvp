/* Kundario – Aufmaßprotokoll zum Drucken bzw. „Als PDF speichern“ (für Werkstatt, Bestellung und Montage)
   Enthält Räume, Bauteile mit Maßen, Checklisten, Fotos, Skizzen, Checkliste vor Ort und Unterschriftsfelder. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h;

  var altDanach = V.aufmass.danach;
  V.aufmass.danach = function (id, extra) {
    if (altDanach) altDanach(id, extra);
    if (!id || id === "neu") return;
    var k = document.querySelector("#inhalt .kopf-knoepfe"); if (!k || k.querySelector("[data-a=aufmassDruck]")) return;
    k.insertAdjacentHTML("afterbegin", '<button class="btn btn-outline" data-a="aufmassDruck" data-id="' + h(id) + '">Protokoll / PDF</button>');
  };
  var links = async function (pfade) { return Promise.all((pfade || []).map(function (p) { return DB.datei.link(p).catch(function () { return ""; }); })); };
  var wert = function (v, e) { return h(v) + (e ? " " + h(e) : ""); };

  K.aufmassProtokollHtml = async function (a) {
    var d = a.daten || {}, an = a.anfrage_id ? await DB.eins("anfragen", a.anfrage_id) : null, kunde = an && an.kunde_id ? await DB.eins("kunden", an.kunde_id) : {};
    var teile = [];
    var raeume = (d.raeume || []).filter(function (r) { return U.zahl(r.l) || U.zahl(r.b); });
    if (raeume.length) teile.push("<h3>Räume</h3><table class=\"d-pos\"><thead><tr><th>Raum</th><th class=\"r\">Länge</th><th class=\"r\">Breite</th><th class=\"r\">Höhe</th><th class=\"r\">Abzüge m²</th></tr></thead><tbody>" +
      raeume.map(function (r) { return "<tr><td>" + h(r.name) + '</td><td class="r">' + h(r.l) + ' m</td><td class="r">' + h(r.b) + ' m</td><td class="r">' + h(r.h) + ' m</td><td class="r">' + h(r.abzug || "") + "</td></tr>"; }).join("") + "</tbody></table>");
    var bt = (d.bauteile || []).filter(function (b) { return K.btRechnen(b).anzahl > 0 || b.lage || b.b; });
    if (bt.length) {
      var zeilen = [];
      for (var i = 0; i < bt.length; i++) {
        var b = bt[i], x = K.btRechnen(b), c = b.check || {}, cl = K.btCheckliste ? K.btCheckliste(b.art).filter(function (f) { return String(c[f.k] == null ? "" : c[f.k]).trim(); }) : [];
        var fotos = await links(b.fotos), warn = K.btWarnung(b);
        zeilen.push("<tr><td>" + (i + 1) + "</td><td><b>" + h(b.art) + "</b>" + (b.lage ? "<br>" + h(b.lage) : "") + "</td><td class=\"r\">" + h(K.mm(b.b) ? K.mm(b.b).toLocaleString("de-DE") : "–") + " × " + h(K.mm(b.h) ? K.mm(b.h).toLocaleString("de-DE") : "–") + " mm" + (warn.length ? '<br><b>prüfen: ' + h(warn.join(", ")) + "</b>" : "") + "</td><td>" + h(b.aus || "") + '</td><td class="r">' + x.anzahl + "</td></tr>" +
          (cl.length || fotos.some(Boolean) ? '<tr class="d-unter"><td></td><td colspan="4">' + (cl.length ? cl.map(function (f) { return h(f.l) + ": <b>" + wert(c[f.k], f.e) + "</b>"; }).join(" · ") : "") +
            (fotos.some(Boolean) ? '<div class="d-fotos">' + fotos.filter(Boolean).map(function (u) { return '<img src="' + h(u) + '" alt="Foto">'; }).join("") + "</div>" : "") + "</td></tr>" : ""));
      }
      var s = K.btSummen(d);
      teile.push('<h3>Fenster, Türen, Sonnenschutz, Überdachung</h3><table class="d-pos"><thead><tr><th>Nr.</th><th>Art / Lage</th><th class="r">Breite × Höhe</th><th>Ausführung</th><th class="r">Stk.</th></tr></thead><tbody>' + zeilen.join("") + "</tbody></table>" +
        "<p>" + Object.keys(s.arten).map(function (n) { return h(n) + ": " + s.arten[n] + " Stk."; }).join(" · ") + " · Fläche gesamt " + U.zahlText(s.flaeche) + " m²" + (s.fuge ? " · Anschlussfuge " + U.zahlText(s.fuge) + " lfm" : "") + "</p>");
    }
    var zs = K.amZeilenSummen ? K.amZeilenSummen(d) : [];
    if (zs.length) teile.push('<h3>Weitere Maße</h3><table class="d-pos"><tbody>' + zs.map(function (z) { return "<tr><td>" + h(z.pos) + '</td><td class="r">' + U.zahlText(z.menge) + " " + h(z.einheit) + "</td></tr>"; }).join("") + "</tbody></table>");
    if (d.vorort && K.voListe) {
      var l = K.voListe(d.vorort), w = d.vorort.werte || {}, erl = l.felder.filter(function (f) { return String(w[f.k] == null ? "" : w[f.k]).trim(); }), offen = l.felder.filter(function (f) { return !String(w[f.k] == null ? "" : w[f.k]).trim(); });
      teile.push("<h3>Checkliste vor Ort</h3>" + (erl.length ? '<table class="d-pos"><tbody>' + erl.map(function (f) { return "<tr><td>" + h(f.l) + '</td><td class="r">' + wert(w[f.k], f.e) + "</td></tr>"; }).join("") + "</tbody></table>" : "") +
        (offen.length ? "<p><b>Noch offen:</b> " + offen.map(function (f) { return h(f.l); }).join(" · ") + "</p>" : ""));
    }
    var sk = d.skizzen || [];
    if (sk.length) { var su = await links(sk.map(function (x) { return x.pfad; })); teile.push('<h3>Skizzen</h3><div class="d-skizzen">' + sk.map(function (x, j) { return su[j] ? '<figure><img src="' + h(su[j]) + '" alt=""><figcaption>' + h(x.titel || "") + "</figcaption></figure>" : ""; }).join("") + "</div>"); }
    teile.push('<div class="d-zwei"><p class="d-sigfeld">Aufgenommen von</p><p class="d-sigfeld">Kunde</p></div>');
    var css = "<style>.d-unter td{border-top:0;font-size:12px;color:#444}.d-fotos{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}.d-fotos img{width:90px;height:68px;object-fit:cover;border-radius:4px}.d-skizzen{display:flex;gap:12px;flex-wrap:wrap}.d-skizzen figure{margin:0}.d-skizzen img{width:250px;border:1px solid #ccc;border-radius:6px;background:#fff}.d-skizzen figcaption{font-size:12px}.d-zwei{display:flex;gap:40px;margin-top:28px}.d-zwei p{flex:1}h3{margin:18px 0 6px;font-size:14px}</style>";
    return U.dokument({ betrieb: K.ctx.betrieb, kunde: kunde || {}, titelArt: "Aufmaßprotokoll", nr: "", meta: [["Datum", U.datum(a.created_at || new Date())], ["Bezeichnung", a.titel]].concat(an && an.betreff ? [["Anfrage", an.betreff]] : []), zusatz: css + teile.join("") });
  };
  K.aktion.aufmassDruck = async function (el) {
    var f = document.getElementById("am-form");
    if (f) { var d = K.amDaten(f, (function () { var r = []; for (var i = 0; f.elements["n_" + i]; i++) r.push({ name: f.elements["n_" + i].value, l: f.elements["l_" + i].value, b: f.elements["b_" + i].value, h: f.elements["h_" + i].value, abzug: f.elements["a_" + i].value }); return r; })()); await DB.aendern("aufmasse", el.dataset.id, { titel: f.elements.titel.value, daten: d }); }
    var a = await DB.eins("aufmasse", el.dataset.id);
    U.drucken(await K.aufmassProtokollHtml(a), "Aufmaßprotokoll " + a.titel);
  };
})();
