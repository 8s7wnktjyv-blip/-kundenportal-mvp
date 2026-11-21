// Test: Bauteile per Sprache (Erkennung aus Text, ohne Mikrofon). node tools/e2e_sprache.js
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage(); const js = []; p.on('pageerror', e => js.push(e.message));
  const warte = (ms = 350) => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Sina Sprache'); await p.fill('input[name=email]', 'sprache@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Fensterbau Sprache'); await p.selectOption('select[name=gewerk]', 'Fenster- und Türenbau'); await p.click('form[data-auth] button[type=submit]'); await warte(2500);
  const S = (t) => ev((x) => K.btAusSprache(x), t);
  let e = await S('Fenster Küche 1230 mal 1480 zwei Stück Dreh-Kipp');
  ok(e.art === 'Fenster' && e.lage === 'Küche' && e.b === '1230' && e.h === '1480' && e.anzahl === '2' && e.aus === 'Dreh-Kipp', 'Fenster Küche 1230 × 1480, 2 Stück, Dreh-Kipp');
  e = await S('Rollladen für das Wohnzimmer 1,23 mal 1,48 Meter Vorbau Elektro');
  ok(e.art === 'Rollladen' && e.lage === 'Wohnzimmer' && e.b === '1230' && e.h === '1480' && e.anzahl === '1' && e.aus === 'Vorbau, Elektro', 'Rollladen in Metern, Ausführung Vorbau und Elektro, Anzahl 1');
  e = await S('Markise Terrasse 400 mal 300 Zentimeter Kassette');
  ok(e.art === 'Markise' && e.b === '4000' && e.h === '3000' && e.aus === 'Kassette', 'Markise in Zentimetern');
  e = await S('Haustür 1.100 x 2.150 Alu');
  ok(e.art === 'Haustür' && e.b === '1100' && e.h === '2150' && e.aus === 'Alu', 'Haustür mit Tausenderpunkt und „x“');
  e = await S('Fliegengitter Bad 600 mal 800 3 Stück Spannrahmen');
  ok(e.art === 'Insektenschutz' && e.lage === 'Bad' && e.anzahl === '3' && e.aus === 'Spannrahmen', 'Fliegengitter → Insektenschutz');
  e = await S('Terrassendach Garten 6 mal 3,5 Meter VSG-Glas');
  ok(e.art === 'Terrassendach / Überdachung' && e.b === '6000' && e.h === '3500' && e.aus === 'VSG-Glas', 'Terrassendach 6 × 3,5 m');
  // In die Tabelle schreiben
  await p.goto(BASIS + '?testmodus#/aufmass/neu'); await warte(900);
  await ev(() => K.btSprachText('Fenster Küche 1230 mal 1480 zwei Stück Dreh-Kipp')); await warte(200);
  await ev(() => K.btSprachText('Rollladen Küche 1230 mal 1480 zwei Stück Vorbau')); await warte(200);
  const zeilen = await ev(() => [...document.querySelectorAll('table.bt tbody tr')].filter(r => !r.hidden).map(r => ['a', 'l', 'b', 'h', 'n', 'x'].map(k => r.querySelector(`[name^=bt_${k}_]`).value).join('|')));
  ok(zeilen[0] === 'Fenster|Küche|1230|1480|2|Dreh-Kipp' && zeilen[1] === 'Rollladen|Küche|1230|1480|2|Vorbau' && zeilen.length === 2, 'Erste leere Zeile gefüllt, dann neue Zeile');
  ok((await ev(() => document.querySelector('tr[data-bt="0"] [data-bt-erg]').textContent)).includes('3,64'), 'Fläche sofort gerechnet');
  ok(await ev(() => [...document.querySelectorAll('#bt-aus-1 option')].some(o => o.value === 'Vorbau')), 'Vorschläge passend zur erkannten Art');
  await ev(() => K.btSprachText('Hallo wie geht es')); await warte(200);
  ok((await ev(() => document.getElementById('toasts').innerText)).includes('Nicht verstanden'), 'Unverständliches: Hinweis mit Beispiel');
  await p.click('#am-form button.btn-signal:not([type=button])'); await warte(800);
  ok(await ev(async () => (await K.liste('aufmasse'))[0].daten.bauteile.length === 2), 'Gesprochene Bauteile gespeichert');
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 3)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
