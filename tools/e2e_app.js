// Ende-zu-Ende-Test der echten App im Testmodus (ohne Server): node tools/e2e_app.js [ordner-für-bilder]
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/';
const BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch();
  const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  p.on('dialog', d => d.accept());
  const warte = (ms = 350) => p.waitForTimeout(ms);
  const dlgOk = async (wert = 'ok') => { await p.click(`dialog[open] footer button[value="${wert}"]`); await warte(); };
  const zeichne = async (sel) => { const r = await p.locator(sel).boundingBox(); await p.mouse.move(r.x + 30, r.y + 60); await p.mouse.down(); for (let i = 0; i < 8; i++) await p.mouse.move(r.x + 40 + i * 25, r.y + 50 + (i % 2) * 40); await p.mouse.up(); };
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/app_${n}.png` }); };

  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Anna Chef'); await p.fill('input[name=email]', 'chef@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]');
  await p.click('form[data-auth] button[type=submit]'); await warte(600);
  ok(await p.locator('form[data-auth=betrieb]').count() === 1, 'Nach Registrierung: Betrieb anlegen');
  await p.fill('input[name=name]', 'Malerbetrieb Test'); await p.selectOption('select[name=gewerk]', 'Maler und Lackierer'); await p.click('form[data-auth] button[type=submit]'); await warte(800);
  ok(await p.locator('.nav a[data-v=anfragen]').count() === 1, 'Cockpit sichtbar'); await shot('1_uebersicht');

  // Einstellungen
  await p.goto(BASIS + '?testmodus#/einstellungen'); await warte(600);
  for (const [n, v] of [['strasse', 'Hauptstr. 1'], ['plz', '91080'], ['ort', 'Uttenreuth'], ['telefon', '09131 123'], ['steuernummer', '216/123/45678'], ['bank', 'Sparkasse'], ['iban', 'DE89 3704 0044 0532 0130 00']]) await p.fill(`form[data-f=betrieb] [name=${n}]`, v);
  await p.click('form[data-f=betrieb] button'); await warte(600);
  ok(await p.evaluate(() => K.ctx.betrieb.iban === 'DE89370400440532013000'), 'Betriebsdaten gespeichert');

  // Anfrage mit neuem Kunden
  await p.goto(BASIS + '?testmodus#/anfragen/neu'); await warte(600);
  await p.click('details.neu-kunde summary');
  for (const [n, v] of [['k_name', 'Familie Huber'], ['k_email', 'huber@example.org'], ['k_strasse', 'Lindenweg 4'], ['k_plz', '91054'], ['k_ort', 'Erlangen'], ['betreff', 'Wohnzimmer streichen']]) await p.fill(`[name=${n}]`, v);
  await p.click('form[data-f=anfrageNeu] button[type=submit]'); await warte(800);
  ok(await p.locator('h1', { hasText: 'Wohnzimmer streichen' }).count() === 1, 'Anfrage angelegt, Detail offen');
  await p.click('[data-a=besichtigung]'); await warte(); await dlgOk(); await warte(500);
  ok(await p.evaluate(() => document.body.innerText.includes('Besichtigung geplant')), 'Besichtigung im Verlauf');

  // Aufmaß und Angebot
  await p.click('[data-a=angebotAusAnfrage]'); await warte(900);
  ok(await p.locator('#ang-form').count() === 1, 'Angebot aus Anfrage angelegt');
  await p.fill('#ang-form tr[data-i="0"] [data-p=text]', 'Wände streichen, 2 Anstriche'); await p.fill('#ang-form tr[data-i="0"] [data-p=menge]', '45'); await p.selectOption; await p.fill('#ang-form tr[data-i="0"] [data-p=einheit]', 'm²'); await p.fill('#ang-form tr[data-i="0"] [data-p=preis]', '12,50');
  await p.click('[data-pe=std]'); await warte(200); await p.fill('#ang-form tr[data-i="1"] [data-p=menge]', '4');
  ok((await p.textContent('#s-netto')).includes('818,50'), 'Summe live: 45 × 12,50 + 4 × 64 = 818,50 € netto');
  await p.click('#ang-form button[type=submit]'); await warte(700); await shot('2_angebot');
  await p.click('[data-a=angebotSenden]'); await warte(); await dlgOk('link'); await warte(600);
  ok(await p.evaluate(() => document.body.innerText.includes('Gesendet')), 'Angebot gesendet');
  await p.goto(BASIS + '?testmodus#/nachfassen'); await warte(600);
  ok(await p.locator('.nf').count() === 1, 'Angebot steht beim Nachfassen');

  // Kundenportal: Kunde nimmt an
  const tok = await p.evaluate(() => JSON.parse(localStorage.getItem('kundario-testdaten')).tabellen.angebote[0].portal_token);
  const k = await ctx.newPage(); k.on('pageerror', e => js.push('Portal: ' + e.message)); k.on('dialog', d => d.accept());
  await k.goto(BASIS + 'portal.html?testmodus#angebot=' + tok); await k.waitForTimeout(700);
  ok((await k.textContent('body')).includes('974,02'), 'Portal zeigt Angebot mit Bruttosumme 974,02 €');
  const r = await k.locator('#sig').boundingBox(); await k.mouse.move(r.x + 20, r.y + 40); await k.mouse.down(); for (let i = 0; i < 8; i++) await k.mouse.move(r.x + 30 + i * 30, r.y + 40 + (i % 2) * 50); await k.mouse.up();
  await k.check('input[name=agb]'); await k.click('#annahme button[type=submit]'); await k.waitForTimeout(700);
  ok((await k.textContent('body')).includes('Vielen Dank'), 'Kunde hat im Portal angenommen'); if (BILD) await k.screenshot({ path: `${BILD}/app_3_portal.png` });
  await k.close();

  // Auftrag
  await p.goto(BASIS + '?testmodus#/angebote'); await warte(500); await p.click('.tabs [data-v=angenommen]'); await warte(700);
  await p.click('tbody tr[data-link] a'); await warte(600);
  ok(await p.evaluate(() => document.body.innerText.includes('angenommen von Familie Huber')), 'Annahme im Betrieb sichtbar');
  await p.click('[data-a=auftragAusAngebot]'); await warte(900);
  const auId = await p.evaluate(() => location.hash.split('/')[2]);
  ok(!!auId, 'Auftrag angelegt');
  await p.goto(BASIS + `?testmodus#/auftraege/${auId}/termine`); await warte(500); await p.click('[data-a=terminNeu]'); await warte(); await dlgOk(); await warte(400);
  const konflikt = await p.locator('dialog[open]').count(); ok(konflikt === 1, 'Überschneidung mit der Besichtigung wird gemeldet'); if (konflikt) await dlgOk(); await warte(500);
  ok(await p.locator('.karte .liste li').count() === 1, 'Termin am Auftrag');
  await p.goto(BASIS + `?testmodus#/auftraege/${auId}/aufgaben`); await warte(500); await p.fill('form[data-f=aufgabe] [name=titel]', 'Farbton mit Kunde klären'); await p.click('form[data-f=aufgabe] .btn'); await warte(500);
  ok(await p.evaluate(() => document.body.innerText.includes('Farbton mit Kunde klären')), 'Aufgabe angelegt');

  // Regiebericht mit Zusatzleistung und Unterschrift
  await p.goto(BASIS + `?testmodus#/berichte/neu/${auId}`); await warte(600);
  await p.fill('#ber-form [name=stunden]', '6,5'); await p.fill('#ber-form [name=taetigkeit]', 'Decke zusätzlich gestrichen'); await p.check('#ber-form [name=zusatzleistung]');
  await p.fill('#ber-form [name=mt_0]', 'Deckenfarbe 10 l'); await p.fill('#ber-form [name=mm_0]', '1'); await p.fill('#ber-form [name=mp_0]', '48');
  await p.click('#ber-form button[type=submit]'); await warte(800);
  ok(await p.evaluate(() => /RB-\d{4}-0001/.test(document.body.innerText)), 'Regiebericht mit Nummer gespeichert');
  await p.click('[data-a=berichtUnterschrift]'); await warte(500); await p.fill('dialog[open] [name=name]', 'Hans Huber'); await zeichne('dialog[open] #sig'); await dlgOk(); await warte(600);
  ok(await p.evaluate(() => document.body.innerText.includes('Unterschrieben')), 'Bericht unterschrieben'); await shot('4_bericht');

  // Schlussrechnung, stellen, Zahlung
  await p.goto(BASIS + `?testmodus#/auftraege/${auId}/rechnungen`); await warte(600);
  await p.click('[data-a=rechnungAusAuftrag][data-art=schluss]'); await warte(900);
  const netto = await p.textContent('#s-netto');
  ok(netto.includes('1.282,50'), 'Schlussrechnung: 818,50 + 6,5 Std × 64 + 48 Material = 1.282,50 € netto (' + netto + ')');
  await p.click('[data-a=rechnungStellen]'); await warte(); await dlgOk(); await warte(800);
  const offen = await p.evaluate(() => document.body.innerText);
  ok(/RE-\d{4}-0001/.test(offen), 'Rechnung gestellt mit fortlaufender Nummer');
  if (await p.locator('dialog[open]').count()) await dlgOk(''); await warte(300);
  await p.click('[data-a=zahlung]'); await warte(); await dlgOk(); await warte(700);
  ok(await p.evaluate(() => document.body.innerText.includes('Bezahlt')), 'Zahlung erfasst, Rechnung bezahlt'); await shot('5_rechnung');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('kundario-testdaten')).tabellen.berichte[0].status === 'abgerechnet'), 'Zusatzbericht als abgerechnet markiert');

  // Material, Aufmaß, Assistent, alle Ansichten
  await p.goto(BASIS + `?testmodus#/material/neu/${auId}`); await warte(500); await p.fill('form[data-f=material] [name=artikel]', 'Abdeckfolie'); await p.click('form[data-f=material] button.btn-signal:not([type=button])'); await warte(600);
  ok(await p.evaluate(() => document.body.innerText.includes('Abdeckfolie')), 'Material angefordert');
  await p.goto(BASIS + '?testmodus#/aufmass/neu'); await warte(900); await p.fill('#am-form [name=l_0]', '5'); await p.fill('#am-form [name=b_0]', '4'); await p.click('#am-form button.btn-signal:not([type=button])'); await warte(600);
  ok(await p.evaluate(() => document.body.innerText.includes('20') && document.body.innerText.includes('45')), 'Aufmaß: 20 m² Boden, 45 m² Wand');
  await p.goto(BASIS + '?testmodus#/assistent'); await warte(500); await p.fill('form[data-f=ki] [name=text]', 'Bestell 3 Eimer Tiefgrund für Huber'); await p.click('form[data-f=ki] button.btn-signal:not([type=button])'); await warte(600);
  await p.click('[data-a=kiOk]'); await warte(600);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('kundario-testdaten')).tabellen.material.some(m => m.artikel === 'Eimer Tiefgrund' && m.menge === 3)), 'Assistent: 3 × Eimer Tiefgrund angefordert');
  for (const v of ['uebersicht', 'anfragen', 'nachfassen', 'kunden', 'kalender', 'auftraege', 'berichte', 'aufmass', 'material', 'dokumente', 'angebote', 'rechnungen', 'ablaeufe', 'auswertungen', 'team', 'einstellungen']) {
    await p.goto(BASIS + '?testmodus#/' + v); await warte(450);
    const t = await p.textContent('#inhalt'); ok(!/Das hat nicht geklappt|undefined|NaN/.test(t), 'Ansicht ' + v + ' ohne Fehler');
  }
  await shot('6_auswertungen');
  // Mitarbeiter einladen und mit Rolle Montagekraft anmelden
  await p.goto(BASIS + '?testmodus#/team'); await warte(500); await p.click('[data-a=einladen]'); await warte();
  await p.fill('dialog[open] [name=name]', 'Max Monteur'); await p.fill('dialog[open] [name=email]', 'max@test.de'); await dlgOk(); await warte(500);
  const etok = await p.evaluate(() => JSON.parse(localStorage.getItem('kundario-testdaten')).tabellen.einladungen[0].token);
  await p.goto(BASIS + '?testmodus#/uebersicht'); await warte(400); await p.click('[data-abmelden]'); await warte(500);
  await p.goto(BASIS + '?testmodus&einladung=' + etok + '#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Max Monteur'); await p.fill('input[name=email]', 'max@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(1000);
  const nav = await p.evaluate(() => [...document.querySelectorAll('.nav a[data-v]')].map(a => a.dataset.v));
  ok(nav.includes('auftraege') && !nav.includes('rechnungen') && !nav.includes('angebote'), 'Montagekraft: Aufträge ja, Rechnungen und Angebote nein (' + nav.join(',') + ')');
  ok(await p.evaluate(async () => (await KDB.liste('rechnungen')).length === 0), 'Montagekraft kann Rechnungen auch über die Datenschicht nicht lesen');
  // Handy
  await p.setViewportSize({ width: 390, height: 844 }); await p.goto(BASIS + '?testmodus#/auftraege'); await warte(600);
  ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Handy: kein seitlicher Überlauf'); await shot('7_handy');
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js));
  console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN');
  await b.close(); process.exit(fehler.length ? 1 : 0);
})();
