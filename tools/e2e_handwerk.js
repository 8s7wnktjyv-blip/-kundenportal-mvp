// Ende-zu-Ende-Test: Datanorm, Kalkulation, GAEB, Eingangsrechnungen, E-Rechnung empfangen, Datenübernahme. node tools/e2e_handwerk.js [bilder-ordner]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/', TD = path.join(__dirname, 'testdaten'), BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  await p.addInitScript(() => { window.print = () => {}; window.open = (u) => { window.__geoeffnet = u; }; });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(600); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/hw_${n}.png`, fullPage: true }); };
  const lade = async (klick) => { const dl = p.waitForEvent('download'); await klick(); const f = await dl; return fs.readFileSync(await f.path()); };

  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Anna Chef'); await p.fill('input[name=email]', 'chef@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Elektro Test'); await p.selectOption('select[name=gewerk]', { index: 1 }); await p.click('form[data-auth] button[type=submit]'); await warte(3500);

  // Datanorm
  await geh('katalog'); await p.click('[data-a=datanorm]'); await warte();
  await p.fill('dialog[open] [name=lieferant]', 'Elektro Großhandel Süd'); await p.fill('dialog[open] [name=zuschlag]', '20'); await p.setInputFiles('dialog[open] input[type=file]', path.join(TD, 'DATANORM.001')); await dlgOk(); await warte(500);
  ok(await p.evaluate(() => /3 Artikel/.test(document.querySelector('dialog[open]').innerText) && !!document.querySelector('dialog[open] [name=rg_K1]') && !!document.querySelector('dialog[open] [name=rg_S2]')), 'Datanorm: 3 Artikel, Rabattgruppen K1 und S2 erkannt');
  await p.fill('dialog[open] [name=rg_K1]', '40'); await p.fill('dialog[open] [name=rg_S2]', '50'); await dlgOk(); await warte(800);
  const art = await p.evaluate(async () => (await K.liste('artikel')).reduce((m, a) => (m[a.nr] = a, m), {}));
  ok(art['1001001'] && art['1001001'].text === 'Kabel NYM-J 3x1,5 Ring 100m' && art['1001001'].einheit === 'm' && art['1001001'].listenpreis === 0.895 && art['1001001'].ek === 0.54 && art['1001001'].preis === 0.65, 'Datanorm: Kabel je 100 m, Liste 0,895 €, −40 % = EK 0,54 €, +20 % = 0,65 €/m');
  ok(art['1001002'] && art['1001002'].text === 'Steckdose Schuko reinweiß' && art['1001002'].ek === 3.45 && art['1001002'].preis === 4.14 && art['1001002'].ean === '4011377123456', 'Datanorm: Umlaut aus DOS-Zeichensatz, Rabatt 50 %, EAN aus B-Satz');
  ok(art['1001003'] && art['1001003'].ek === 2.45 && art['1001003'].listenpreis == null, 'Datanorm: Nettopreis ohne Rabatt übernommen');
  ok(!art['9999999'], 'Datanorm: Löschsatz nicht angelegt');
  await p.click('[data-a=datanorm]'); await warte(); await p.fill('dialog[open] [name=lieferant]', 'Elektro Großhandel Süd'); await p.fill('dialog[open] [name=zuschlag]', '25'); await p.setInputFiles('dialog[open] input[type=file]', path.join(TD, 'DATANORM.001')); await dlgOk(); await warte(400);
  ok(await p.inputValue('dialog[open] [name=rg_K1]') === '40', 'Datanorm: Rabatte beim zweiten Mal vorbelegt'); await dlgOk(); await warte(800);
  ok(await p.evaluate(async () => { const l = await K.liste('artikel'); return l.length === 3 && l.find(a => a.nr === '1001003').preis === 3.06; }), 'Datanorm: erneuter Import aktualisiert statt doppelt (neuer Zuschlag 25 %)');
  await p.fill('input[data-suche=kat-suche]', '4011377123456'); await warte(900);
  ok((await text()).includes('Steckdose Schuko reinweiß') && !(await text()).includes('Abzweigdose'), 'Katalog: Suche nach EAN');
  await shot('katalog');

  // Kalkulation
  await p.evaluate(() => sessionStorage.clear()); await geh('katalog'); await p.click('[data-a=katNeu]'); await warte();
  await p.fill('dialog[open] [name=text]', 'Steckdose setzen komplett'); await p.fill('dialog[open] [name=minuten]', '30'); await p.fill('dialog[open] [name=material_ek]', '10'); await p.fill('dialog[open] [name=material_zuschlag]', '20'); await warte(200);
  ok(await p.evaluate(() => /44,00/.test(document.querySelector('[data-kalk-ergebnis]').innerText) && /Lohn 32,00/.test(document.querySelector('[data-kalk-ergebnis]').innerText)), 'Kalkulation live: 30 Min. × 64 €/Std. + 10 € × 1,2 = 44,00 €, Lohn 32,00 €');
  await dlgOk(); await warte(500);
  ok(await p.evaluate(async () => (await K.liste('artikel')).find(a => a.text === 'Steckdose setzen komplett').preis === 44), 'Kalkulation gespeichert');
  const kid = await p.evaluate(async () => (await K.neu('kunden', { name: 'Familie Sommer', email: 'sommer@example.org' })).id);
  const ang = await p.evaluate(async (k) => (await K.neu('angebote', { nr: await K.nr('AN'), kunde_id: k, titel: 'Küche', mwst: 19 })).id, kid);
  await geh('angebote/' + ang); await p.click('#ang-form [data-pe=katalog]'); await warte(500); await p.fill('dialog[open] [data-kat-q]', 'steckdose setzen'); await warte(700);
  await p.check('dialog[open] .kat-wahl input'); await dlgOk(); await warte(500);
  ok(await p.evaluate(() => /davon Lohn 32,00/.test(document.querySelector('#ang-form').innerText)), 'Angebot: Lohnanteil der kalkulierten Position sichtbar');
  await p.click('#ang-form button[type=submit]'); await warte(600);
  ok(await p.evaluate(async (id) => { const a = await KDB.eins('angebote', id); const pz = a.positionen.find(x => x.text === 'Steckdose setzen komplett'); return pz && pz.lohn_anteil === 32 && U.lohnNetto(a.positionen) === 32; }, ang), 'Angebot: Lohnanteil gespeichert, § 35a-Summe 32 €');

  // GAEB
  await geh('angebote'); await p.click('[data-a=gaebImport]'); await warte(); await p.setInputFiles('dialog[open] input[type=file]', path.join(TD, 'ausschreibung.x83')); await dlgOk(); await warte(900);
  const gId = await p.evaluate(() => location.hash.split('/')[2]);
  const g = await p.evaluate(async (id) => { const a = await KDB.eins('angebote', id); const k = await KDB.eins('kunden', a.kunde_id); return { a, k }; }, gId);
  ok(g.a.titel === 'Grundschule Uttenreuth Elektro' && g.k.name === 'Gemeinde Uttenreuth', 'GAEB: Projekt und Auftraggeber übernommen');
  const gp = g.a.positionen;
  ok(gp.length === 5 && gp[0].typ === 'titel' && gp[0].text === '01 Installation' && gp[1].text === '01.0010 Leitung NYM-J 3x1,5' && gp[1].menge === 120 && gp[1].einheit === 'm' && /auf Putz mit Schellen/.test(gp[1].langtext), 'GAEB: Titel, OZ, Menge, Einheit und Langtext');
  ok(gp[4].optional === true && gp[4].einheit === 'Std.' && gp[4].gaeb.art === 'bedarf', 'GAEB: Bedarfsposition als optional');
  await p.evaluate(async (id) => { const a = await KDB.eins('angebote', id); a.positionen[1].preis = 3.2; a.positionen[2].preis = 45; a.positionen[4].preis = 64; await KDB.aendern('angebote', id, { positionen: a.positionen }); }, gId);
  await geh('uebersicht'); await geh('angebote/' + gId);
  const x84 = (await lade(() => p.click('[data-a=gaebExport]'))).toString('utf8');
  const chk = await p.evaluate((x) => { const d = new DOMParser().parseFromString(x, 'application/xml'); if (d.getElementsByTagName('parsererror').length) return 'XML-Fehler'; const it = [...d.getElementsByTagNameNS('*', 'Item')]; const tot = d.getElementsByTagNameNS('*', 'BoQ')[0].getElementsByTagNameNS('*', 'Totals'); return { dp: d.getElementsByTagNameNS('*', 'DP')[0].textContent, n: it.length, up: it.map(i => i.getElementsByTagNameNS('*', 'UP')[0].textContent), it: it.map(i => i.getElementsByTagNameNS('*', 'IT')[0].textContent), rno: it.map(i => i.getAttribute('RNoPart')), id: it.map(i => i.getAttribute('ID')), total: tot[tot.length - 1].getElementsByTagNameNS('*', 'Total')[0].textContent, ns: d.documentElement.namespaceURI }; }, x84);
  ok(chk.dp === '84' && chk.n === 3 && chk.up.join() === '3.20,45.00,64.00' && chk.it.join() === '384.00,1080.00,640.00' && chk.rno.join() === '0010,0020,0010' && chk.id.join() === 'I1,I2,I3', 'GAEB X84: Preise, Gesamtbeträge, Ordnungszahlen und IDs');
  ok(chk.total === '1464.00' && /DA84\/3\.3$/.test(chk.ns), 'GAEB X84: Summe ohne Bedarfsposition 1.464,00 €, Namensraum DA84');
  fs.writeFileSync(require('path').join(require('os').tmpdir(),'test.x84'), x84);

  // Eingangsrechnungen
  await geh('belege'); await p.click('[data-a=eRechnungEin]'); await warte(); await p.setInputFiles('dialog[open] input[type=file]', path.join(TD, 'lieferant-xrechnung.xml')); await dlgOk(); await p.waitForSelector('dialog[open] [name=lieferant]');
  ok(await p.inputValue('dialog[open] [name=lieferant]') === 'Elektro Großhandel Süd GmbH' && await p.inputValue('dialog[open] [name=nr]') === 'GH-778812' && await p.inputValue('dialog[open] [name=faellig]') === '2026-11-24' && await p.inputValue('dialog[open] [name=brutto]') === '297,50', 'XRechnung eingelesen: Lieferant, Nummer, Fälligkeit, Betrag');
  await p.selectOption('dialog[open] [name=kategorie]', 'Material'); await dlgOk(); await warte(600);
  await p.click('[data-a=eRechnungEin]'); await warte(); await p.setInputFiles('dialog[open] input[type=file]', path.join(TD, 'lieferant-zugferd.pdf')); await dlgOk(); await p.waitForSelector('dialog[open] [name=lieferant]');
  ok(await p.inputValue('dialog[open] [name=lieferant]') === 'Werkzeugverleih Franken' && await p.inputValue('dialog[open] [name=nr]') === 'WR-2026-5531' && await p.inputValue('dialog[open] [name=datum]') === '2026-11-12' && await p.inputValue('dialog[open] [name=brutto]') === '95,20', 'ZUGFeRD-PDF: eingebettete Daten ausgelesen');
  await p.selectOption('dialog[open] [name=kategorie]', 'Werkzeug und Geräte'); await p.selectOption('dialog[open] [name=auftrag_id]', { index: 0 }); await dlgOk(); await warte(600);
  const bel = await p.evaluate(async () => (await K.liste('belege')).map(x => ({ l: x.lieferant, n: x.netto, u: x.ust, q: x.quelle, iban: x.daten && x.daten.iban })));
  ok(bel.length === 2 && bel.some(x => x.n === 250 && x.u === 47.5 && x.q === 'xrechnung' && x.iban === 'DE02120300000000202051') && bel.some(x => x.n === 80 && x.u === 15.2 && x.q === 'zugferd'), 'Belege: Netto, Vorsteuer, Quelle und IBAN gespeichert');
  await p.click('[data-a=belegNeu]'); await p.waitForSelector('dialog[open] [name=lieferant]'); await p.fill('dialog[open] [name=lieferant]', 'Tankstelle'); await p.fill('dialog[open] [name=brutto]', '119'); await dlgOk(); await warte(500);
  ok(await p.evaluate(async () => { const t = (await K.liste('belege')).find(x => x.lieferant === 'Tankstelle'); return t.netto === 100 && t.ust === 19; }), 'Beleg von Hand: 119 € brutto = 100 € netto + 19 € USt.');
  await shot('belege');

  // Finanzen: Vorsteuer, Zahllast, offene Belege, Kontoauszug mit Abbuchung
  await geh('finanzen'); const ft = await text();
  ok(/Vorsteuer aus Eingangsrechnungen: (81,70|0,00) €/.test(ft) && /3 offene Eingangsrechnungen/.test(ft), 'Finanzen: Vorsteuer und offene Eingangsrechnungen in der Vorschau');
  await p.click('[data-a=kontoImport]'); await warte();
  fs.writeFileSync(require('path').join(require('os').tmpdir(),'auszug.csv'), '"Buchungstag";"Beguenstigter/Zahlungspflichtiger";"Verwendungszweck";"Betrag"\n"15.11.2026";"Elektro Grosshandel Sued";"RG GH-778812 Kd 4711";"-297,50"\n"16.11.2026";"Werkzeugverleih Franken";"Miete";"-95,20"\n');
  await p.setInputFiles('dialog[open] input[type=file]', require('path').join(require('os').tmpdir(),'auszug.csv')); await dlgOk(); await warte(700);
  ok(await p.evaluate(() => /2 Abbuchungen zu offenen Eingangsrechnungen/.test(document.querySelector('dialog[open]').innerText)), 'Kontoauszug: Abbuchungen zu Belegen gefunden (Nummer, Betrag + Name)');
  await dlgOk(); await warte(700);
  ok(await p.evaluate(async () => { const l = await K.liste('belege'); return l.filter(x => x.status === 'bezahlt').length === 2 && l.find(x => x.nr === 'GH-778812').bezahlt_am === '2026-11-15'; }), 'Kontoauszug: beide Belege bezahlt mit Datum');

  // DATEV Eingang
  await geh('einstellungen'); await p.click('[data-a=steuerExport]'); await warte(); await p.fill('dialog[open] [name=von]', '2026-01-01'); await p.fill('dialog[open] [name=bis]', '2026-12-31'); await p.selectOption('dialog[open] [name=art]', 'datev_ein');
  const de = (await lade(() => dlgOk())).toString('latin1').split('\r\n');
  ok(/^"EXTF";700;21;"Buchungsstapel";13;/.test(de[0]) && /Eingangsrechnungen Kundario/.test(de[0]) && de.some(z => z.startsWith('297,50;"H";"EUR";;;"";70000;3200;"9";1011;"GH-778812"')) && de.some(z => z.startsWith('95,20;"H";"EUR";;;"";70000;4985;"9";1211;')), 'DATEV Eingang: Kreditor 70000, Konten 3200/4985, BU 9, Belegdatum TTMM');
  await warte(400); await p.click('[data-a=steuerExport]'); await warte(); await p.fill('dialog[open] [name=von]', '2026-01-01'); await p.fill('dialog[open] [name=bis]', '2026-12-31'); await p.selectOption('dialog[open] [name=art]', 'ein');
  const reb = (await lade(() => dlgOk())).toString('utf8'); ok(/Rechnungseingangsbuch|Belegdatum/.test(reb) && /GH-778812/.test(reb) && /47,50/.test(reb), 'Rechnungseingangsbuch (CSV)');
  await warte(400); await p.click('[data-a=datevEinst]'); await warte(); await p.selectOption('dialog[open] [name=skr]', '04'); await p.click('dialog[open] [data-a=datevVorschlag]'); await warte(200);
  ok(await p.inputValue('dialog[open] [name=erl19]') === '4400' && await p.inputValue('dialog[open] [name=k_material]') === '5200', 'DATEV: Konten für SKR 04 vorgeschlagen'); await dlgOk('');

  // Datenübernahme aus Lexware
  await geh('kunden'); await p.click('[data-a=kundenImport]'); await warte(); await p.setInputFiles('dialog[open] input[type=file]', path.join(TD, 'lexware-kontakte.csv')); await dlgOk(); await warte(800);
  ok(await p.evaluate(async () => { const l = await K.liste('kunden'); const w = l.find(k => k.name === 'Bauträger Weiß GmbH'), j = l.find(k => k.name === 'Jonas Bergmann'); return w && w.art === 'firma' && w.ust_id === 'DE123123123' && /Ansprechpartner: Petra Weiß/.test(w.notiz) && /Kundennr. alt: 10001/.test(w.notiz) && j && j.art === 'privat' && j.ort === 'Uttenreuth'; }), 'Lexware-Kontakte: Firma, Person, USt-IdNr., alte Kundennummer');

  // Ansichten und Handy
  for (const v of ['katalog', 'belege', 'finanzen', 'hilfe/datanorm', 'hilfe/gaeb', 'hilfe/belege', 'hilfe/kalkulation', 'hilfe/app-installieren']) { await geh(v); ok(!/undefined|NaN/.test(await text()), 'Ansicht ' + v + ' ohne Fehler'); }
  await p.setViewportSize({ width: 390, height: 844 });
  for (const v of ['katalog', 'belege', 'angebote/' + gId]) { await geh(v); ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy ' + v.split('/')[0] + ': kein seitlicher Überlauf'); }
  await shot('handy_belege');
  ok(await p.evaluate(async () => { const r = await fetch('manifest.webmanifest'); const m = await r.json(); return m.display === 'standalone' && m.icons.length === 3; }), 'App-Manifest zum Installieren');
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
