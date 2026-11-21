// Ende-zu-Ende-Test: Aufmaß für Fenster, Türen, Rollläden, Sonnenschutz, Überdachung → Angebot. node tools/e2e_bauteile.js [bilder-ordner]
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/', BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/bt_${n}.png`, fullPage: true }); };
  const ev = (f, a) => p.evaluate(f, a);

  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Berta Fenster'); await p.fill('input[name=email]', 'fenster@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Fensterbau Test'); await p.selectOption('select[name=gewerk]', 'Fenster- und Türenbau'); await p.click('form[data-auth] button[type=submit]'); await warte(3500);

  // Rechenkern
  ok(await ev(() => K.mm('1.230') === 1230 && K.mm('1230') === 1230 && K.mm('1 230') === 1230 && K.mm('1,23') === 1230 && K.mm('') === 0), 'Millimeter lesen: 1.230 / 1230 / 1 230 / 1,23 m');
  ok(await ev(() => { const x = K.btRechnen({ art: 'Fenster', b: '1230', h: '1480', anzahl: '2' }); return x.flaeche === 1.82 && x.flaecheGesamt === 3.64 && x.fuge === 10.84; }), 'Fenster 1.230 × 1.480 mm, 2 Stk.: 1,82 m² je Stück, 3,64 m², Fuge 10,84 lfm');
  ok(await ev(() => K.btRechnen({ art: 'Rollladen', b: '1230', h: '1480', anzahl: '1' }).fuge === 0), 'Rollladen: keine Anschlussfuge');
  ok(await ev(() => K.btWarnung({ art: 'Fenster', b: '12300', h: '1480' }).join() === 'Breite' && K.btWarnung({ art: 'Fenster', b: '1230', h: '1480' }).length === 0 && K.btWarnung({ art: 'Terrassendach / Überdachung', b: '6000', h: '3500' }).length === 0), 'Unplausible Maße werden erkannt, Terrassendach bis 12 m erlaubt');
  ok(await ev(() => K.btText({ art: 'Markise', lage: 'Terrasse', b: '4000', h: '3000', aus: 'Kassette' }) === 'Markise, Terrasse, Breite 4.000 × Ausfall 3.000 mm, Kassette'), 'Positionstext Markise mit Ausfall');

  // Oberfläche
  await geh('aufmass/neu'); await warte(400);
  ok(await ev(() => !!document.querySelector('table.bt')), 'Aufmaß: Bereich Fenster/Türen/Sonnenschutz da');
  ok(await ev(() => { const bt = document.querySelector('.bt-bereich'), fz = document.querySelector('.fz-bereich'); return bt && fz && (bt.compareDocumentPosition(fz) & Node.DOCUMENT_POSITION_FOLLOWING); }), 'Reihenfolge: Bauteile vor den Formelzeilen');
  await p.fill('[name=bt_l_0]', 'Küche'); await p.fill('[name=bt_b_0]', '1230'); await p.fill('[name=bt_h_0]', '1480'); await p.fill('[name=bt_x_0]', 'Dreh-Kipp'); await p.fill('[name=bt_n_0]', '2'); await warte(100);
  ok((await p.textContent('tr[data-bt="0"] [data-bt-erg]')).trim() === '3,64 m²', 'Fläche sofort beim Tippen (3,64 m²)');
  await p.click('[data-a=btNeu]'); await p.selectOption('[name=bt_a_1]', 'Rollladen'); await p.fill('[name=bt_l_1]', 'Küche'); await p.fill('[name=bt_b_1]', '12300'); await p.fill('[name=bt_h_1]', '1480'); await warte(100);
  ok((await p.textContent('tr[data-bt="1"] [data-bt-erg]')).includes('Breite prüfen'), 'Tippfehler 12300 mm wird rot markiert');
  ok(await ev(() => [...document.querySelectorAll('#bt-aus-1 option')].some(o => o.value === 'Vorbau')), 'Vorschläge passen zur Art (Rollladen: Vorbau)');
  await p.fill('[name=bt_b_1]', '1230'); await p.fill('[name=bt_x_1]', 'Vorbau, Elektro'); await p.fill('[name=bt_n_1]', '2');
  await p.click('[data-a=btNeu]'); await p.selectOption('[name=bt_a_2]', 'Terrassendach / Überdachung'); await p.fill('[name=bt_l_2]', 'Garten'); await p.fill('[name=bt_b_2]', '6.000'); await p.fill('[name=bt_h_2]', '3.500'); await p.fill('[name=bt_x_2]', 'Alu, VSG-Glas');
  await p.click('#am-form button.btn-signal:not([type=button])'); await warte(800);
  const am = await ev(async () => (await K.liste('aufmasse'))[0]);
  ok(am.daten.bauteile.length === 3 && am.daten.bauteile[2].art === 'Terrassendach / Überdachung' && Array.isArray(am.daten.raeume) && Array.isArray(am.daten.zeilen), 'Bauteile gespeichert, Räume und Formelzeilen bleiben erhalten');
  const t = await text();
  ok(t.includes('Fenster · 2 Stk.') && t.includes('Rollladen · 2 Stk.') && t.includes('Terrassendach / Überdachung · 1 Stk.') && t.includes('Anschlussfuge Fenster und Türen · 10,84 lfm'), 'Zusammenfassung je Art und Fugenlänge');
  ok(await ev(() => document.querySelector('[name=bt_b_2]').value === '6.000'), 'Nach Neuladen stehen die Maße wieder im Formular');
  await shot('aufmass');
  // Formelzeile und Raum dürfen weiter funktionieren
  await p.fill('[name=fz_p_0]', 'Fensterbank innen'); await p.fill('[name=fz_f_0]', '2*1,23'); await p.fill('[name=fz_e_0]', 'm');
  await p.click('#am-form button.btn-signal:not([type=button])'); await warte(800);
  ok(await ev(async () => { const a = (await K.liste('aufmasse'))[0]; return a.daten.bauteile.length === 3 && a.daten.zeilen.length === 1; }), 'Formelzeile zusätzlich gespeichert, Bauteile unverändert');

  // Foto je Bauteil
  const bildPfad = require('path').join(require('os').tmpdir(), 'bt-test.png');
  require('fs').writeFileSync(bildPfad, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHUlEQVR4nGNgGAWjYBSMglEwCkbBKBgFo2AUjIJRAAAQEAABxF7ZPAAAAABJRU5ErkJggg==', 'base64'));
  await p.click('[data-a=btNeu]'); await p.setInputFiles('[data-btfoto="3"]', bildPfad); await warte(600);
  ok((await ev(() => (document.getElementById('toasts') || {}).innerText || '')).includes('Bitte zuerst Lage oder Maße'), 'Foto auf leerer Zeile: verständlicher Hinweis statt Fehler');
  await geh('aufmass/' + am.id);
  await p.setInputFiles('[data-btfoto="0"]', bildPfad); await warte(1500);
  ok(await ev(async () => { const a = (await K.liste('aufmasse'))[0]; return a.daten.bauteile[0].fotos.length === 1 && a.daten.bauteile[1].fotos.length === 0 && a.daten.bauteile.length === 3; }), 'Foto am richtigen Bauteil gespeichert');
  await p.setInputFiles('[data-btfoto="0"]', bildPfad); await warte(1500);
  ok(await ev(() => document.querySelectorAll('.bt-fotos img').length === 2 && [...document.querySelectorAll('.bt-fotos img')].every(i => i.src.startsWith('data:image/jpeg'))), 'Zwei Fotos als Vorschau, verkleinert als JPEG');
  ok(await ev(() => document.querySelector('[name=bt_b_0]').value === '1230' && document.querySelector('[name=bt_x_1]').value === 'Vorbau, Elektro'), 'Maße bleiben nach dem Foto erhalten');

  // Skizze
  await p.click('[data-a=skNeu]'); await warte(400);
  await dlgOk(); ok((await ev(() => (document.getElementById('toasts') || {}).innerText || '')).includes('Skizze ist leer') && await ev(async () => !((await K.liste('aufmasse'))[0].daten.skizzen || []).length), 'Leere Skizze wird nicht gespeichert, mit Hinweis');
  if (!(await ev(() => !!document.querySelector('dialog[open] #sk-pad')))) { await p.click('[data-a=skNeu]'); await warte(400); }
  await p.fill('dialog[open] [name=titel]', 'Grundriss Küche');
  { const r = await p.locator('#sk-pad').boundingBox(); await p.mouse.move(r.x + 20, r.y + 20); await p.mouse.down(); for (let i = 0; i < 10; i++) await p.mouse.move(r.x + 30 + i * 20, r.y + 30 + (i % 2) * 60); await p.mouse.up(); }
  await dlgOk(); await warte(1200);
  ok(await ev(async () => { const a = (await K.liste('aufmasse'))[0]; return a.daten.skizzen.length === 1 && a.daten.skizzen[0].titel === 'Grundriss Küche' && a.daten.bauteile[0].fotos.length === 2; }), 'Skizze gespeichert, Fotos bleiben erhalten');
  ok(await ev(() => { const i = document.querySelector('img[data-skpfad]'); return i && i.src.startsWith('data:image/png'); }), 'Skizze als Vorschau sichtbar');
  await shot('fotos_skizze');
  await p.click('[data-a=skZeigen]'); await warte(400); ok(await ev(() => !!document.querySelector('dialog[open] img.sk-gross')), 'Skizze groß ansehen'); await dlgOk(''); 

  // Ins Angebot
  await p.click('[data-a=aufmassAngebot]'); await warte();
  ok(await ev(() => !!document.querySelector('dialog[open] [name=bauteile]') && !!document.querySelector('dialog[open] [name=fuge]')), 'Dialog bietet Bauteile und Fuge an');
  await dlgOk(); await warte(900);
  const an = await ev(async () => (await K.liste('angebote'))[0]);
  ok(an && an.positionen.some(x => x.text === 'Fenster, Küche, 1.230 × 1.480 mm, Dreh-Kipp' && x.menge === 2 && x.einheit === 'Stk.'), 'Angebot: Fenster-Position mit Maßen und Anzahl');
  ok(an.positionen.some(x => x.text === 'Rollladen, Küche, 1.230 × 1.480 mm, Vorbau, Elektro' && x.menge === 2), 'Angebot: Rollladen-Position');
  ok(an.positionen.some(x => x.text === 'Terrassendach / Überdachung, Garten, Breite 6.000 × Tiefe 3.500 mm, Alu, VSG-Glas' && x.menge === 1), 'Angebot: Terrassendach mit Breite × Tiefe');
  ok(an.positionen.some(x => /^Anschlussfuge/.test(x.text) && x.menge === 10.84 && x.einheit === 'lfm'), 'Angebot: Anschlussfuge 10,84 lfm');
  ok(an.positionen.some(x => x.text === 'Fensterbank innen' && x.menge === 2.46), 'Angebot: Formelzeile weiterhin übernommen');
  ok(an.positionen.filter(x => x.typ === 'pos').every(x => x.preis === 0), 'Preise bleiben leer zum Eintragen');

  // Liste, Hilfe, Handy
  await geh('aufmass'); ok((await text()).includes('5 Bauteile'), 'Aufmaß-Liste zeigt Anzahl der Bauteile');
  await geh('hilfe/aufmass'); ok((await text()).includes('Terrassendächer'), 'Hilfe erklärt das Bauteil-Aufmaß');
  await p.setViewportSize({ width: 390, height: 844 }); await geh('aufmass/' + am.id);
  ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy: kein seitlicher Überlauf'); await shot('handy');
  ok(!/undefined|NaN/.test(await text()), 'Keine undefined/NaN in der Ansicht');
  ok(js.filter(m => !/zuerst Lage|Skizze ist leer/.test(m)).length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
