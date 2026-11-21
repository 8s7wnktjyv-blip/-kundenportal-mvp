// Test: Eingänge von der Website in die App (Selbst ausprobieren, Testmodus). node tools/e2e_eingang.js
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage(); const js = []; p.on('pageerror', e => js.push(e.message));
  const anlegen = async (mail) => { await p.fill('input[name=name]', 'Test Person'); await p.fill('input[name=email]', mail); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await p.waitForTimeout(700); };
  await p.goto(BASE + 'betriebe.html'); await p.evaluate(() => localStorage.clear());
  await p.click('a[href="app/?testmodus#registrieren"]'); await p.waitForTimeout(900);
  ok(p.url().includes('app/?testmodus#registrieren') && await p.locator('form[data-auth=registrieren]').count() === 1, 'Betriebe: „Selbst ausprobieren“ öffnet die Registrierung im Testmodus');
  await anlegen('eingang1@test.de'); ok(await p.inputValue('select[name=gewerk]') === '', 'Handwerksbetrieb: Gewerk nicht vorbelegt');
  await p.goto(BASE + 'hausverwaltungen.html'); await p.evaluate(() => localStorage.clear());
  ok(await p.locator('a[href="app/?testmodus&art=hausverwaltung#registrieren"]').count() === 2, 'Hausverwaltungen: zwei Knöpfe „Fristen-Service selbst ausprobieren“');
  await p.locator('a[href="app/?testmodus&art=hausverwaltung#registrieren"]').first().click(); await p.waitForTimeout(900);
  await anlegen('eingang2@test.de'); ok(await p.inputValue('select[name=gewerk]') === 'Hausverwaltung', 'Hausverwaltung: Art vorbelegt');
  await p.fill('input[name=name]', 'HV Eingang'); await p.click('form[data-auth] button[type=submit]'); await p.waitForTimeout(2000);
  ok(await p.evaluate(() => K.istVerwaltung() && !!document.querySelector('.nav a[data-v=objekte]')), 'Direkt im Fristen-Service');
  for (const s of ['betriebe.html', 'hausverwaltungen.html']) { await p.setViewportSize({ width: 390, height: 844 }); await p.goto(BASE + s); await p.waitForTimeout(400); ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), s + ' am Handy ohne Überlauf'); }
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 3)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
