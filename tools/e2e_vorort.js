// Ende-zu-Ende-Test: Checkliste vor Ort im Aufmaß (alle Gewerke). node tools/e2e_vorort.js [bilder-ordner]
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/', BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const toast = () => p.evaluate(() => (document.getElementById('toasts') || {}).innerText || '');
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/vo_${n}.png`, fullPage: true }); };
  const ev = (f, a) => p.evaluate(f, a);

  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Sven Sanitär'); await p.fill('input[name=email]', 'shk@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Bad und Heizung Test'); await p.selectOption('select[name=gewerk]', 'SHK'); await p.click('form[data-auth] button[type=submit]'); await warte(3500);

  // Daten
  ok(await ev(() => Object.keys(window.K_CHECKLISTEN).length === 14), '14 Checklisten (alle Gewerke der Demo plus Allgemein)');
  ok(await ev(() => K.voListe({ gewerk: 'fenster', art: 'Haustür' }).felder.some(f => f.k === 'dinr') && K.voListe({ gewerk: 'maler', art: 'Fassade' }).felder.length === 7 && K.voListe({ gewerk: 'gibtsnicht' }).gewerk === 'allgemein'), 'Arten je Gewerk, Unbekanntes fällt auf Allgemein zurück');
  ok(await ev(() => K.voListe({ gewerk: 'shk' }).felder.every(f => f.l && ['n', 's', 't'].includes(f.t) && (f.t !== 's' || f.o.length))), 'Alle Punkte vollständig (Bezeichnung, Typ, Auswahl)');
  ok(await ev(() => K.voPruefe({ t: 'n', l: 'Abstand', e: 'm', min: 0.1, max: 15 }, '50') !== '' && K.voPruefe({ t: 'n', l: 'Abstand', e: 'm', min: 0.1, max: 15 }, '1,8') === ''), 'Unübliche Zahl wird erkannt, übliche nicht');

  // Oberfläche
  await geh('aufmass/neu'); await warte(400);
  ok(await ev(() => document.querySelector('[data-vo-gewerk]').value === 'shk'), 'Vorschlag passend zum Betrieb (SHK → Bad und Sanitär)');
  ok(await ev(() => { const v = document.querySelector('.vo-bereich'), bt = document.querySelector('.bt-bereich'); return v && bt && (v.compareDocumentPosition(bt) & Node.DOCUMENT_POSITION_FOLLOWING); }), 'Checkliste steht vor den Bauteilen');
  await p.fill('[name=n_0]', 'Bad OG'); await p.fill('[name=l_0]', '2,85'); await p.fill('[name=b_0]', '2,92');
  await p.click('[data-a=voAusfuellen]'); await warte(500);
  ok(await ev(() => document.querySelector('dialog[open]').innerText.includes('Gefälle')), 'Dialog mit den SHK-Punkten und Hinweisen');
  await p.fill('dialog[open] [name=v_aufbau]', '14'); await p.fill('dialog[open] [name=v_fallrohr]', '50'); await p.selectOption('dialog[open] [name=v_decke]', 'Holzbalkendecke'); await p.fill('dialog[open] [name=v_zugang]', '2. OG, kein Aufzug');
  await dlgOk(); await warte(900);
  ok((await toast()).includes('Abstand Ablauf bis Fallrohr'), 'Unüblicher Wert (50 m) wird gemeldet');
  const am = await ev(async () => (await K.liste('aufmasse'))[0]);
  ok(am.daten.vorort.gewerk === 'shk' && am.daten.vorort.werte.aufbau === '14' && am.daten.vorort.werte.decke === 'Holzbalkendecke' && am.daten.raeume[0].name === 'Bad OG' && am.daten.raeume[0].l === '2,85', 'Antworten gespeichert, Raummaße dabei nicht verloren');
  const t = await text();
  ok(t.includes('Checkliste ausfüllen · 4/12') && t.includes('Decke unter dem Bad · Holzbalkendecke') && t.includes('Bitte prüfen'), 'Fortschritt, Antworten und Prüfhinweis sichtbar');
  await shot('shk');

  // Gewerk wechseln: Art-Auswahl erscheint, Antworten bleiben gespeichert
  await p.selectOption('[data-vo-gewerk]', 'maler'); await warte(900);
  ok(await ev(() => !!document.querySelector('[data-vo-art]') && document.querySelector('[data-vo-art]').value === 'Innenraum'), 'Maler: Auswahl Innenraum / Fassade');
  await p.selectOption('[data-vo-art]', 'Fassade'); await warte(900);
  ok(await ev(async () => { const a = (await K.liste('aufmasse'))[0]; return a.daten.vorort.gewerk === 'maler' && a.daten.vorort.art === 'Fassade' && a.daten.vorort.werte.aufbau === '14'; }), 'Wechsel gespeichert, frühere Antworten gehen nicht verloren');
  ok((await text()).includes('Zugang, Parken, Stockwerk · 2. OG, kein Aufzug'), 'Gemeinsame Punkte (Zugang) werden übernommen');
  await p.selectOption('[data-vo-gewerk]', 'shk'); await warte(900);
  ok((await text()).includes('Decke unter dem Bad · Holzbalkendecke'), 'Zurück zu SHK: Antworten wieder da');

  // Zusammenspiel mit Bauteilen und Formeln
  await p.fill('[name=fz_p_0]', 'Wandfliesen'); await p.fill('[name=fz_f_0]', '2*(2,85+2,92)*2,5'); await p.click('#am-form button.btn-signal:not([type=button])'); await warte(800);
  ok(await ev(async () => { const a = (await K.liste('aufmasse'))[0]; return a.daten.zeilen.length === 1 && a.daten.vorort.werte.decke === 'Holzbalkendecke'; }), 'Speichern der Formeln lässt die Checkliste unverändert');
  await geh('hilfe/aufmass'); ok((await text()).includes('Checkliste vor Ort'), 'Hilfe erklärt die Checkliste');

  // Handy
  await p.setViewportSize({ width: 390, height: 844 }); await geh('aufmass/' + am.id);
  ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy: kein seitlicher Überlauf'); await shot('handy');
  ok(!/undefined|NaN/.test(await text()), 'Keine undefined/NaN in der Ansicht');
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
