/* Kundario – Rechnung an Lexware Office / sevDesk übergeben (App-Seite)
   Mit Server: Server-Funktion rechnung-uebergeben (Schlüssel bleibt auf dem Server). Im Testmodus: Vorschau und Datei. */
(function () {
  "use strict";
  var K = window.K, U = window.U, DB = window.KDB, V = K.views, h = U.h, UE = window.KUebergabe;
  var NAME = UE ? UE.ANBIETER : { lexware: "Lexware Office", sevdesk: "sevDesk" };
  var testmodus = function () { return DB.modus === "lokal"; };

  var altDanach = V.rechnungen.danach;
  V.rechnungen.danach = async function (id, extra) {
    if (altDanach) altDanach(id, extra);
    var r = K._rechnung; if (!id || !r || r.status === "entwurf" || !K.darf("rechnungen")) return;
    var k = document.querySelector("#inhalt .kopf-knoepfe"); if (!k || k.querySelector("[data-a=rechnungUebergeben]")) return;
    k.insertAdjacentHTML("beforeend", '<button class="btn btn-outline" data-a="rechnungUebergeben" data-id="' + h(id) + '" title="Als Entwurf an Ihr Rechnungsprogramm">An Lexware/sevDesk</button>');
    var l = await K.liste("uebergaben", { wo: { rechnung_id: id }, sortiere: "created_at.desc" }).catch(function () { return []; });
    if (l.length) k.closest(".seite-kopf").insertAdjacentHTML("afterend", '<p class="hinweis-zeile"><span class="pill ok">übergeben</span> ' + l.map(function (u) { return h(NAME[u.anbieter] || "Datei") + " am " + U.datumZeit(u.created_at) + (u.extern_id && u.extern_id !== "Testmodus" ? " (Nr. dort: " + h(u.extern_id) + ")" : ""); }).join(" · ") + "</p>");
  };

  K.aktion.rechnungUebergeben = async function (el) {
    if (!UE) throw new Error("Übergabe-Baustein nicht geladen.");
    var r = await DB.eins("rechnungen", el.dataset.id), k = r.kunde_id ? await DB.eins("kunden", r.kunde_id) : {};
    var bisher = await K.liste("uebergaben", { wo: { rechnung_id: r.id } }).catch(function () { return []; });
    var wahl = await U.dialog("An Rechnungsprogramm übergeben", (bisher.length ? '<p class="warn-box">Diese Rechnung wurde schon übergeben (' + bisher.map(function (u) { return h(NAME[u.anbieter] || u.anbieter); }).join(", ") + "). Bitte nur erneut senden, wenn sie dort gelöscht wurde.</p>" : "") +
      U.feld("anbieter", "Rechnungsprogramm", ((K.ctx.betrieb.kalkulation || {}).rechnungsprogramm) || "lexware", { optionen: [["lexware", "Lexware Office"], ["sevdesk", "sevDesk"]] }) +
      "<p>Kundario legt die Rechnung dort als <b>Entwurf</b> an. Die Rechnungsnummer vergibt Ihr Rechnungsprogramm beim Abschließen – so gibt es keine doppelte Nummerierung.</p>" +
      (testmodus() ? '<p class="still">Testmodus: Es wird nichts gesendet. Sie sehen, was übergeben würde, und können es als Datei speichern.</p>' : ""),
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: testmodus() ? "Vorschau" : "Entwurf anlegen", primaer: true }]);
    if (!wahl) return;
    var an = wahl.daten.anbieter, nutz = an === "lexware" ? UE.lexware(r, k) : UE.sevdesk(r, k, {});
    if (testmodus()) {
      var r2 = await U.dialog("Vorschau: " + NAME[an], "<p>So würde Kundario die Rechnung " + h(r.nr) + " an " + h(NAME[an]) + " schicken (" + (nutz.lineItems || nutz.invoicePosSave).length + " Positionen, netto " + U.eur(UE.netto(r)) + "):</p><pre class=\"btp-bsp uebergabe-json\">" + h(JSON.stringify(nutz, null, 2)) + "</pre>",
        [{ wert: "", text: "Schließen" }, { wert: "datei", text: "Als Datei speichern", primaer: true }]);
      if (r2 && r2.wert === "datei") {
        var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(nutz, null, 2)], { type: "application/json" })); a.download = "Rechnung_" + String(r.nr || "").replace(/[^\w-]/g, "_") + "_" + an + ".json"; document.body.appendChild(a); a.click(); a.remove();
        await K.neu("uebergaben", { rechnung_id: r.id, anbieter: "datei", extern_id: "Testmodus" }); U.toast("Datei gespeichert."); K.neuLaden();
      }
      return;
    }
    var erg = await DB.funktion("rechnung-uebergeben", { rechnung_id: r.id, anbieter: an });
    if (erg && erg.attrappe) { U.dialog("Vorschau (Testbetrieb des Servers)", '<pre class="btp-bsp uebergabe-json">' + h(JSON.stringify(erg.nutzlast, null, 2)) + "</pre>", [{ wert: "", text: "Schließen", primaer: true }]); return; }
    try { var kal = Object.assign({}, K.ctx.betrieb.kalkulation || {}, { rechnungsprogramm: an }); if (K.ctx.ich.rolle === "gf") K.ctx.betrieb = await DB.aendern("betriebe", K.bid(), { kalkulation: kal }); } catch (x) { /* Merken ist optional */ }
    U.toast("Entwurf in " + NAME[an] + " angelegt. Dort prüfen und abschließen."); K.neuLaden();
  };

  /* ---------- Einstellungen: Rechnungsprogramm verbinden ---------- */
  var altEinstDanach = V.einstellungen.danach;
  V.einstellungen.danach = async function (id, extra) {
    if (altEinstDanach) await altEinstDanach(id, extra);
    if (K.istVerwaltung() || K.ctx.ich.rolle !== "gf" || document.getElementById("re-programm")) return;
    var ziel = document.querySelector("#inhalt .seite-kopf"); if (!ziel) return;
    var status = testmodus() ? [] : await DB.rpc("schnittstellen_status", { p_betrieb: K.bid() }).catch(function () { return []; });
    var zeile = function (an) { var s = (status || []).filter(function (x) { return x.anbieter === an; })[0]; return "<li><b>" + NAME[an] + "</b> · " + (s ? '<span class="pill ok">verbunden</span> Schlüssel …' + h(s.ende) : '<span class="pill aus">nicht verbunden</span>') + ' <button type="button" class="btn btn-outline klein" data-a="reProgramm" data-an="' + an + '">' + (s ? "Ändern" : "Verbinden") + "</button></li>"; };
    ziel.insertAdjacentHTML("afterend", '<section class="karte" id="re-programm"><h2>Rechnungsprogramm</h2><p>Gestellte Rechnungen als Entwurf an Lexware Office oder sevDesk übergeben – dort abschließen, buchen, an den Steuerberater.</p>' +
      (testmodus() ? '<p class="still">Im Testmodus wird nichts verbunden; „An Lexware/sevDesk“ zeigt eine Vorschau.</p>' : '<ul class="liste">' + zeile("lexware") + zeile("sevdesk") + "</ul>") + "</section>");
  };
  K.aktion.reProgramm = async function (el) {
    var an = el.dataset.an;
    var r = await U.dialog(NAME[an] + " verbinden", (an === "lexware" ? "<p>In Lexware Office: <b>Einstellungen → Öffentliche API</b> (bzw. app.lexware.de/addons/public-api) einen API-Schlüssel erzeugen und hier einfügen.</p>" : "<p>In sevDesk: <b>Einstellungen → Benutzer → Ihr Benutzer → API-Token</b> kopieren und hier einfügen.</p>") +
      U.feld("key", "API-Schlüssel", "", { typ: "password", attr: ' autocomplete="off"', hilfe: "Wird nur auf dem Server gespeichert, ist für niemanden in der App lesbar und wird nie wieder angezeigt. Leer lassen und speichern trennt die Verbindung." }),
      [{ wert: "", text: "Abbrechen" }, { wert: "ok", text: "Speichern", primaer: true }]);
    if (!r) return; await DB.rpc("schnittstelle_setzen", { p_betrieb: K.bid(), p_anbieter: an, p_key: r.daten.key || "" });
    U.toast(r.daten.key ? NAME[an] + " verbunden." : "Verbindung getrennt."); K.neuLaden();
  };
})();
