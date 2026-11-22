// Ende-zu-Ende-Test: Partnerbereich – Betreiber legt Partner an, Betrieb kommt über den Partner-Link, Partner meldet, Betreiber prüft, Vertrag, Provision.
// node tools/e2e_partner.js
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765/', BASIS = BASE + 'app/';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 400) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const ev = (f, a) => p.evaluate(f, a), body = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  const tage = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }, de = (iso) => iso.split('-').reverse().join('.');
  const registrieren = async (url, name, mail) => { await p.goto('about:blank'); await p.goto(url); await warte(700); await p.fill('input[name=name]', name); await p.fill('input[name=email]', mail); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(900); };
  const betrieb = async (firma, gewerk) => { await p.fill('input[name=name]', firma); await p.selectOption('select[name=gewerk]', gewerk); await p.click('form[data-auth] button[type=submit]'); await warte(2500); };
  const abmelden = async () => { await ev(async () => { await KDB.auth.abmelden(); }); await p.goto('about:blank'); };
  const anmelden = async (mail, hash) => { await p.goto(BASIS + '?testmodus#anmelden'); await warte(500); await p.fill('input[name=email]', mail); await p.fill('input[name=pw]', 'geheim123'); await p.click('form[data-auth] button[type=submit]'); await warte(1500); if (hash) { await p.goto('about:blank'); await p.goto(BASIS + '?testmodus' + hash); await warte(1500); } };

  // 1) Betreiber (im Testmodus per ?betreiber) legt einen Partner an
  await p.goto(BASIS + '?testmodus'); await p.evaluate(() => localStorage.clear());
  await registrieren(BASIS + '?testmodus&betreiber#registrieren', 'Dora Betreiberin', 'betreiber@kundario.test'); await warte(1200);
  ok(await ev(() => KDB.rpc('ist_betreiber')), '1a. Betreiber erkannt (ohne eigenen Betrieb direkt im Partnerbereich)');
  ok((await body()).includes('Partnerbereich') && (await body()).includes('Noch keine Partner'), '1c. Betreiber-Ansicht im eigenen Rahmen');
  await p.click('[data-a=partnerNeu]'); await warte(); await p.fill('dialog[open] [name=name]', 'Paul Partner'); await p.fill('dialog[open] [name=email]', 'Partner@Test.de'); await dlgOk(); await warte(800);
  const code = await ev(async () => (await KDB.liste('partner'))[0].code);
  ok(/^PAULPA\d{2}$/.test(code) && (await body()).includes('betriebe.html?p=' + code), '1d. Partner angelegt, Code ' + code + ' und Link');
  await p.click('[data-a=partnerNeu]'); await warte(); await p.fill('dialog[open] [name=name]', 'Doppelt'); await p.fill('dialog[open] [name=email]', 'd@test.de'); await p.fill('dialog[open] [name=code]', code); await dlgOk(); await warte(500);
  ok((await ev(() => document.getElementById('toasts').innerText)).includes('gibt es schon'), '1e. Doppelter Code abgelehnt'); if (await p.locator('dialog[open]').count()) await dlgOk('');
  await abmelden();

  // 2) Betrieb kommt über den Partner-Link der Website
  await p.goto(BASE + 'betriebe.html?p=' + code.toLowerCase()); await warte(500);
  const ziel = await ev(() => document.querySelector('a[href^="app/"]').getAttribute('href'));
  ok(ziel === 'app/?testmodus&p=' + code + '#registrieren', '2a. Website gibt den Code an „Selbst ausprobieren“ weiter (ohne Speicherung)');
  await registrieren(BASE + ziel, 'Hans Huber', 'huber@test.de');
  ok(await p.inputValue('input[name=partner_code]') === code, '2b. Partner-Code bei der Registrierung vorbelegt');
  await betrieb('Rollladen Huber', 'Fenster- und Türenbau');
  ok(await ev(async () => (await KDB.liste('partner_meldungen')).length === 0 && (await KDB.liste('partner')).length === 0), '2c. Betrieb sieht nichts vom Partnerbereich');
  await abmelden();

  // 3) Partner meldet sich an (ohne eigenen Betrieb) und meldet einen weiteren Betrieb
  await registrieren(BASIS + '?testmodus#registrieren', 'Paul Partner', 'partner@test.de'); await warte(800);
  ok((await body()).includes('Ihr Partnerbereich') && (await body()).includes('Rollladen Huber') && (await body()).includes('in Prüfung'), '3a. Partner sieht seinen Bereich und die Meldung über den Link');
  ok(!(await body()).includes('huber@test.de') && !(await body()).includes('Hans Huber'), '3b. Keine Kundendaten des Betriebs sichtbar');
  await p.fill('#partner-melden [name=betrieb_name]', 'Fensterbau Meier'); await p.fill('#partner-melden [name=ort]', 'Fürth'); await p.click('#partner-melden button.btn-signal'); await warte(800);
  ok((await body()).includes('Fensterbau Meier'), '3c. Betrieb gemeldet');
  ok(await ev(async () => { try { await KDB.neu('partner_meldungen', { partner_id: (await KDB.rpc('ich_partner')).id, betrieb_name: 'Schummel', quelle: 'meldung', status: 'angenommen' }); return false; } catch (e) { return true; } }), '3d. Partner kann sich nichts selbst genehmigen');
  await abmelden();

  // 4) Betreiber prüft Meldungen, legt Vertrag an, Provision wird fällig
  await anmelden('betreiber@kundario.test', '#/betreiber/meldungen');
  ok((await body()).includes('Rollladen Huber') && (await body()).includes('Link (Registrierung)') && (await body()).includes('Fensterbau Meier'), '4a. Betreiber sieht beide Meldungen');
  const mLink = await ev(async () => (await KDB.liste('partner_meldungen')).find(m => m.quelle === 'link').id), mMeier = await ev(async () => (await KDB.liste('partner_meldungen')).find(m => m.betrieb_name === 'Fensterbau Meier').id);
  await p.click(`[data-a=meldungAnnehmen][data-id="${mLink}"]`); await warte(); await dlgOk(); await warte(700);
  await p.click(`[data-a=meldungAblehnen][data-id="${mMeier}"]`); await warte(); await p.fill('dialog[open] [name=grund]', 'War schon bei uns in Bearbeitung'); await dlgOk(); await warte(700);
  // Testdaten in die richtige Reihenfolge: Meldung vor 80 Tagen, Vertrag vor 70 Tagen
  await ev((vor) => { const d = JSON.parse(localStorage.getItem('kundario-testdaten')); d.tabellen.partner_meldungen.forEach(m => { if (m.quelle === 'link') m.am = vor; }); localStorage.setItem('kundario-testdaten', JSON.stringify(d)); }, tage(-80) + 'T09:00:00.000Z');
  await p.goto('about:blank'); await p.goto(BASIS + '?testmodus#/betreiber/vertraege'); await warte(1500);
  const hid = await ev(async () => (await KDB.rpc('betreiber_betriebe')).find(x => x.name === 'Rollladen Huber').id);
  await p.click(`[data-a=vertragBearb][data-betrieb="${hid}"]`); await warte();
  await p.fill('dialog[open] [name=beginn]', tage(-70)); await p.fill('dialog[open] [name=bezahlt]', de(tage(-65)) + '\n' + de(tage(-35))); await dlgOk(); await warte(800);
  ok((await body()).includes('Grundpreis seit'), '4b. Vertrag angelegt');
  await p.click(`[data-a=vertragBearb][data-betrieb="${hid}"]`); await warte(); await p.fill('dialog[open] [name=bezahlt]', 'gestern'); await dlgOk(); await warte(500);
  ok((await ev(() => document.getElementById('toasts').innerText)).includes('TT.MM.JJJJ'), '4c. Falsches Datum bei bezahlten Monaten wird gemeldet'); if (await p.locator('dialog[open]').count()) await dlgOk('');
  await p.goto('about:blank'); await p.goto(BASIS + '?testmodus#/betreiber/provisionen'); await warte(1500);
  ok((await body()).includes('Paul Partner') && (await body()).includes('624,00 €') && (await body()).includes('fällig'), '4d. Provision 375 + 249 = 624 € fällig');
  const dl = p.waitForEvent('download'); await p.click('[data-a=provisionCsv]'); const csv = require('fs').readFileSync(await (await dl).path(), 'utf8');
  ok(csv.includes('"Paul Partner";"Partner@Test.de";"Rollladen Huber";"624,00"'), '4e. CSV für die Auszahlung');
  await p.click('[data-a=provisionBezahlt]'); await warte(); await dlgOk(); await warte(800);
  ok((await body()).includes('ausgezahlt'), '4f. Provision als ausgezahlt markiert');
  await abmelden();

  // 5) Partner sieht Ergebnis
  await anmelden('partner@test.de'); await warte(800);
  ok((await body()).includes('angenommen') && (await body()).includes('ausgezahlt') && (await body()).includes('War schon bei uns in Bearbeitung'), '5a. Partner sieht Annahme, Auszahlung und Ablehnungsgrund');
  await abmelden();

  // 6) Normaler Betrieb kommt nicht in den Betreiberbereich
  await anmelden('huber@test.de', '#/betreiber'); ok(!(await body()).includes('Partnerbereich') && await ev(async () => !(await KDB.rpc('ist_betreiber'))), '6. Betrieb kommt nicht in den Betreiberbereich');
  await p.setViewportSize({ width: 390, height: 844 }); await abmelden(); await anmelden('partner@test.de'); await warte(800);
  ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), '7. Partnerbereich am Handy ohne Überlauf');
  ok(js.filter(m => !/gibt es schon|TT\.MM\.JJJJ/.test(m)).length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 4)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
