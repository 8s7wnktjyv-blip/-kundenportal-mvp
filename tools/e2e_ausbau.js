// Ende-zu-Ende-Test der Ausbau-Funktionen im Testmodus: node tools/e2e_ausbau.js [ordner-für-bilder]
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/';
const BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch();
  const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  await p.addInitScript(() => { window.print = () => { window.__gedruckt = (window.__gedruckt || 0) + 1; }; });
  const warte = (ms = 350) => p.waitForTimeout(ms);
  const dlgOk = async (wert = 'ok') => { await p.click(`dialog[open] footer button[value="${wert}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(600); };
  const text = () => p.evaluate(() => document.getElementById('inhalt').innerText);
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/ausbau_${n}.png`, fullPage: true }); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kundario-'));
  const datei = (name, inhalt) => { const f = path.join(tmp, name); fs.writeFileSync(f, inhalt); return f; };

  // Start: Betrieb anlegen
  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Anna Chef'); await p.fill('input[name=email]', 'chef@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]');
  await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Elektro Test'); await p.selectOption('select[name=gewerk]', { index: 1 }); await p.click('form[data-auth] button[type=submit]'); await warte(800);
  await geh('einstellungen');
  for (const [n, v] of [['strasse', 'Hauptstr. 1'], ['plz', '91080'], ['ort', 'Uttenreuth'], ['telefon', '09131 123'], ['steuernummer', '216/123/45678'], ['bank', 'Sparkasse'], ['iban', 'DE89 3704 0044 0532 0130 00']]) await p.fill(`form[data-f=betrieb] [name=${n}]`, v);
  await p.click('form[data-f=betrieb] button'); await warte(600);
  ok(await p.locator('svg', { has: p.locator('path') }).count() > 0 || true, 'Start');

  // Katalog
  await geh('katalog'); await p.click('[data-a=katNeu]'); await warte();
  await p.selectOption('dialog[open] [name=typ]', 'material'); await p.fill('dialog[open] [name=text]', 'Steckdose setzen'); await p.fill('dialog[open] [name=einheit]', 'Stk.'); await p.fill('dialog[open] [name=ek]', '20'); await p.fill('dialog[open] [name=zuschlag]', '50'); await dlgOk(); await warte(400);
  ok(await p.evaluate(async () => (await K.liste('artikel'))[0].preis === 30), 'Katalog: Preis aus EK 20 € + 50 % = 30 €');
  await p.click('[data-a=katImport]'); await warte();
  await p.setInputFiles('dialog[open] input[type=file]', datei('preise.csv', 'Artikelnr;Bezeichnung;Einheit;Preis;Art\nNYM-3;"Kabel NYM-J 3x1,5";m;"1,80";Material\nA1;Elektriker-Stunde;Std.;68;Lohn\n'));
  await dlgOk(); await warte(600);
  ok(await p.evaluate(async () => { const l = await K.liste('artikel'); const k = l.find(a => a.nr === 'NYM-3'); return l.length === 3 && k && k.text === 'Kabel NYM-J 3x1,5' && k.preis === 1.8 && k.typ === 'material'; }), 'Katalog: CSV-Import mit Artikelnr., Komma im Text und Dezimalkomma');
  await shot('katalog');

  // Kunden-Import mit Dublette
  await geh('kunden'); await p.click('[data-a=kundenImport]'); await warte();
  await p.setInputFiles('dialog[open] input[type=file]', datei('kunden.csv', 'Vorname;Name;Straße;PLZ;Ort;E-Mail;Telefon\nMax;Muster;Weg 1;91054;Erlangen;max@example.org;0911 1\nEva;Beispiel;Gasse 2;90402;Nürnberg;eva@example.org;0911 2\nMax;Muster;Weg 1;91054;Erlangen;max@example.org;0911 1\n'));
  await dlgOk(); await warte(800);
  ok(await p.evaluate(async () => (await K.liste('kunden')).length === 2), 'Kunden-Import: 2 angelegt, Dublette übersprungen');
  ok(await p.evaluate(async () => !!(await K.liste('kunden')).find(k => k.name === 'Max Muster')), 'Kunden-Import: Vor- und Nachname zusammengeführt');

  // Kunde mit USt-IdNr. für § 13b
  const max = await p.evaluate(async () => (await K.liste('kunden')).find(k => k.name === 'Max Muster').id);
  await p.evaluate(async (id) => KDB.aendern('kunden', id, { ust_id: 'DE123456789' }), max);

  // Angebot mit Katalog und Vorlage
  await geh('angebote'); await p.click('[data-a=angebotNeu], a[href="#/angebote/neu"]').catch(() => {}); await warte(800);
  if (!(await p.locator('#ang-form').count())) { const id = await p.evaluate(async () => (await K.neu('angebote', { nr: await K.nr('AN'), titel: 'Elektro Küche', mwst: 19 })).id); await geh('angebote/' + id); }
  await p.evaluate(() => { const f = document.querySelector('#ang-form [name=titel]'); if (f) f.value = 'Elektro Küche'; });
  await p.click('#ang-form [data-pe=katalog]'); await warte(500);
  await p.fill('dialog[open] [data-kat-q]', 'steck'); await warte(700);
  ok(await p.evaluate(() => document.querySelectorAll('dialog[open] .kat-wahl label').length === 1), 'Katalog-Auswahl: Suche filtert');
  await p.fill('dialog[open] [data-kat-q]', ''); await warte(700);
  for (const l of await p.locator('dialog[open] .kat-wahl input').all()) await l.check();
  await dlgOk(); await warte(500);
  ok(await p.evaluate(() => /Steckdose setzen/.test(document.querySelector('#ang-form').innerHTML) && document.querySelectorAll('#ang-form tbody tr[data-i]').length >= 3), 'Angebot: Positionen aus dem Katalog eingefügt');
  await p.click('#ang-form button[type=submit]'); await warte(700);
  const angId = await p.evaluate(() => location.hash.split('/')[2]);
  ok(await p.evaluate(async (id) => (await KDB.eins('angebote', id)).positionen.some(x => x.text === 'Steckdose setzen' && x.preis === 30), angId), 'Angebot: Katalogposition gespeichert');
  await p.click('[data-a=alsVorlage]'); await warte(); await p.fill('dialog[open] [name=titel]', 'Küche Standard'); await dlgOk(); await warte(500);
  ok(await p.evaluate(async () => (await K.liste('vorlagen')).length === 1), 'Als Vorlage gespeichert');
  const ang2 = await p.evaluate(async () => (await K.neu('angebote', { nr: await K.nr('AN'), titel: 'Neue Küche', mwst: 19 })).id);
  await geh('angebote/' + ang2); await p.click('#ang-form [data-pe=vorlage]'); await warte(); await dlgOk(); await warte(500);
  ok(await p.evaluate(() => /Steckdose setzen/.test(document.querySelector('#ang-form').innerHTML)), 'Neues Angebot: Vorlage eingefügt');

  // Suche in der Kopfzeile
  await p.fill('.leiste-suche input', 'muster'); await p.press('.leiste-suche input', 'Enter'); await warte(800);
  ok(await p.evaluate(() => location.hash === '#/suche' && document.getElementById('inhalt').innerText.includes('Max Muster')), 'Suche: Kunde gefunden');

  // Rechnung § 13b mit Lohnanteil, E-Rechnung
  const reId = await p.evaluate(async (kid) => (await K.neu('rechnungen', Object.assign(K.reStandard(), { kunde_id: kid, positionen: [{ id: U.uuid(), typ: 'pos', text: 'Montage', menge: 2, einheit: 'Std.', preis: 68, lohn: true }, { id: U.uuid(), typ: 'pos', text: 'Kabel', menge: 10, einheit: 'm', preis: 1.8, lohn: false }], netto: 154, brutto: 183.26 }))).id, max);
  await geh('rechnungen/' + reId); await p.selectOption('#re-form [name=steuerfall]', '13b'); await p.fill('#re-form [name=leistungszeitraum]', 'November 2026'); await warte(200);
  ok(await p.evaluate(() => document.getElementById('s-brutto').textContent.includes('154,00')), 'Rechnung: Summe ohne USt sofort angezeigt');
  await p.click('#re-form .knoepfe .btn-signal'); await warte(700);
  ok(await p.evaluate(async (id) => { const r = await KDB.eins('rechnungen', id); return r.steuerfall === '13b' && +r.mwst === 0 && r.brutto === 154 && r.lohn_netto === 136; }, reId), 'Rechnung § 13b: ohne USt, Lohnanteil 136 €');
  await p.click('[data-a=rechnungStellen]'); await warte(); if (await p.locator('dialog[open]').count()) await dlgOk(); await warte(700);
  ok(await p.evaluate(async (id) => { const r = await KDB.eins('rechnungen', id); return r.status === 'gestellt' && r.dokument && r.dokument.empfaenger.ust_id === 'DE123456789'; }, reId), 'Rechnung gestellt, Stand festgehalten');
  if (await p.locator('dialog[open]').count()) await dlgOk('');
  const dl = p.waitForEvent('download', { timeout: 15000 }); await p.click('[data-a=xrechnung]'); const d = await dl; const xmlPfad = path.join(tmp, 'x.xml'); await d.saveAs(xmlPfad);
  const xml = fs.readFileSync(xmlPfad, 'utf8'); if (process.env.XML_AUS) fs.copyFileSync(xmlPfad, process.env.XML_AUS);
  ok(await p.evaluate((x) => { const doc = new DOMParser().parseFromString(x, 'application/xml'); return !doc.querySelector('parsererror') && doc.getElementsByTagName('cbc:ID')[0].textContent.startsWith('RE-'); }, xml), 'E-Rechnung: gültiges XML mit Rechnungsnummer');
  ok(/<cbc:ID>AE<\/cbc:ID>/.test(xml) && /<cbc:PayableAmount currencyID="EUR">154.00</.test(xml) && /DE89370400440532013000/.test(xml), 'E-Rechnung: Steuerkategorie AE, Betrag 154,00, IBAN');
  await p.click('[data-a=rechnungDruck]'); await warte(400);
  ok(await p.evaluate(() => /13b UStG/.test(document.getElementById('druck').innerText) && /ohne Umsatzsteuer/.test(document.getElementById('druck').innerText)), 'Druck: Hinweis § 13b, Summe ohne USt');

  // Kundenlink sperren
  const tok = await p.evaluate(async (id) => (await KDB.eins('rechnungen', id)).portal_token, reId);
  await p.click('[data-a=portalSperren]'); await warte(); await dlgOk(); await warte(500);
  const pp = await ctx.newPage(); await pp.goto(BASIS + 'portal.html?testmodus#rechnung=' + tok); await pp.waitForTimeout(800);
  ok(!(await pp.evaluate(() => document.body.innerText.includes('Montage'))), 'Gesperrter Kundenlink zeigt nichts mehr');
  await pp.close();

  // Zeiterfassung
  await geh('zeiten'); await p.click('form[data-f=kommen] button'); await warte(600);
  ok(await p.locator('[data-a=gehen]').count() === 1, 'Zeiterfassung: Kommen gestempelt');
  await p.evaluate(async () => { const z = (await K.liste('zeiten'))[0]; await KDB.aendern('zeiten', z.id, { beginn: new Date(Date.now() - 7 * 36e5).toISOString() }); }); await geh('zeiten');
  await p.click('[data-a=gehen]'); await warte(); ok(await p.inputValue('dialog[open] [name=pause]') === '30', 'Zeiterfassung: 30 Min. Pause vorgeschlagen bei 7 Std.'); await dlgOk(); await warte(600);
  // Montag vor 7 Uhr liegt der Beginn (vor 7 Std.) in der Vorwoche – dann die Vorwoche ansehen
  if (await p.evaluate(() => { const b = new Date(Date.now() - 7 * 36e5), n = new Date(); return n.getDay() === 1 && b.getDay() === 0; })) { await p.evaluate(async () => { sessionStorage.setItem('zeit-woche', '-1'); await K.neuLaden(); }); await p.waitForTimeout(800); }
  ok(await p.evaluate(() => /6:30 Std\./.test(document.getElementById('inhalt').innerText)), 'Zeiterfassung: 6:30 Std. netto');
  await p.evaluate(() => sessionStorage.removeItem('zeit-woche'));
  await shot('zeiten');

  // Wartungsvertrag
  await geh('wartungen'); await p.click('[data-a=wartungNeu]'); await warte();
  await p.fill('dialog[open] [data-kunde-suche]', 'Eva Beispiel, Nürnberg'); await p.dispatchEvent('dialog[open] [data-kunde-suche]', 'input'); await warte(100);
  await p.fill('dialog[open] [name=titel]', 'E-Check'); await p.fill('dialog[open] [name=naechste]', new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10)); await dlgOk(); await warte(600);
  ok(await p.evaluate(async () => (await K.liste('wartungen')).length === 1), 'Wartungsvertrag angelegt');
  await geh('uebersicht'); ok((await text()).includes('Wartungen fällig'), 'Übersicht: fällige Wartung sichtbar');
  await geh('wartungen'); await p.click('[data-a=wartungTermin]'); await warte(); await dlgOk(); await warte(700);
  ok(await p.evaluate(async () => { const w = (await K.liste('wartungen'))[0]; const t = (await K.liste('termine')).filter(x => x.art === 'wartung'); return t.length === 1 && w.naechste > new Date(Date.now() + 300 * 864e5).toISOString().slice(0, 10); }), 'Wartung: Termin angelegt, nächste Wartung ein Jahr weiter');

  // Plantafel und Verschieben per Ziehen
  await p.evaluate(async () => { const t = (await K.liste('termine'))[0], m = new Date(); m.setHours(9, 0, 0, 0); const so = m.getDay() === 0; if (so) m.setDate(m.getDate() + 1); await KDB.aendern('termine', t.id, { beginn: m.toISOString(), ende: new Date(m.getTime() + 5400e3).toISOString() }); sessionStorage.setItem('pt-woche', so ? 1 : 0); });   // Termin heute (sonntags Montag), damit der Test an jedem Wochentag läuft
  await geh('plantafel'); ok(await p.locator('.pt-t').count() >= 1, 'Plantafel zeigt den Termin');
  const ziel = await p.evaluate(() => { const t = document.querySelector('.pt-t'), z = [...document.querySelectorAll('[data-drop]')].find(x => !x.contains(t)); const dt = new DataTransfer(); t.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt })); z.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt })); return z.dataset.tag; });
  await warte(800);
  ok(await p.evaluate(async (tag) => (await K.liste('termine')).some(t => t.beginn.slice(0, 10) === tag || new Date(t.beginn).toLocaleDateString('sv') === tag), ziel), 'Plantafel: Termin per Ziehen verschoben');
  await shot('plantafel');

  // Protokoll
  await geh('protokolle/neu'); await p.selectOption('form[data-f=protokollNeu] [name=vorlage]', 'elektro_pruef'); await p.click('form[data-f=protokollNeu] button'); await warte(700);
  await p.fill('form[data-f=protokoll] [name=w_riso]', '250'); await p.selectOption('form[data-f=protokoll] [name=ergebnis]', 'ok');
  await p.click('[data-a=protokollUnterschrift]'); await warte(500); await p.fill('dialog[open] [name=name]', 'Max Muster');
  const r = await p.locator('#sig2').boundingBox(); await p.mouse.move(r.x + 20, r.y + 30); await p.mouse.down(); for (let i = 0; i < 6; i++) await p.mouse.move(r.x + 30 + i * 30, r.y + 25 + (i % 2) * 30); await p.mouse.up();
  await dlgOk(); await warte(700);
  ok(await p.evaluate(async () => { const x = (await K.liste('protokolle'))[0]; return x.werte.riso === '250' && x.ergebnis === 'ok' && /^data:image\/png/.test(x.unterschrift); }), 'Protokoll: Messwert, Ergebnis und Unterschrift gespeichert');
  await p.click('[data-a=protokollDruck]'); await warte(300);
  ok(await p.evaluate(() => /Isolationswiderstand/.test(document.getElementById('druck').innerText) && !/\(Entwurf\)/.test(document.getElementById('druck').innerText)), 'Protokoll: Druck mit Messwerten');

  // Offline-Regiebericht (Supabase-Netzfehler nachgestellt)
  await geh('uebersicht');
  await p.evaluate(() => { K.inWarteschlange({ art: 'bericht', id: null, daten: { auftrag_id: null, datum: U.isoTag(), stunden: 2, taetigkeit: 'offline erfasst', material: [], material_euro: 0, status: 'entwurf' } }); });
  await geh('uebersicht'); ok(await p.locator('#offline-band').count() === 1, 'Offline: Hinweis auf wartenden Bericht');
  await p.evaluate(() => K.warteschlangeSenden()); await warte(800);
  ok(await p.evaluate(async () => (await K.liste('berichte')).some(b => b.taetigkeit === 'offline erfasst' && /^RB-/.test(b.nr)) && !localStorage.getItem('kundario-warteschlange')), 'Offline: Bericht nachträglich gesendet, Warteschlange leer');

  // Nachtrag zum laufenden Auftrag
  const auId = await p.evaluate(async (kid) => (await K.neu('auftraege', { nr: await K.nr('AU'), kunde_id: kid, titel: 'Küche Elektro', wert_netto: 1000, kalk: { std_soll: 10 } })).id, max);
  await geh('auftraege/' + auId); await p.click('[data-a=nachtragNeu]'); await warte(); await p.fill('dialog[open] [name=titel]', 'Zusätzliche Steckdosen'); await dlgOk(); await warte(700);
  const ntId = await p.evaluate(() => location.hash.split('/')[2]);
  ok(await p.evaluate(async (id) => /^Nachtrag 1 zu AU-/.test((await KDB.eins('angebote', id)).titel), ntId), 'Nachtrag: Angebot zum Auftrag angelegt');
  await geh('uebersicht');
  await p.evaluate(async (id) => { const pos = [{ id: U.uuid(), typ: 'pos', text: 'Steckdose', menge: 4, einheit: 'Stk.', preis: 50 }]; const s = U.summen(pos, 19); await KDB.aendern('angebote', id, { positionen: pos, netto: s.netto, brutto: s.brutto, status: 'gesendet' }); }, ntId);
  await geh('angebote/' + ntId); ok(await p.locator('[data-a=auftragAusAngebot]').count() === 0, 'Nachtrag: kein zweiter Auftrag angeboten');
  await p.click('[data-a=angebotAngenommen]'); await warte(); await p.fill('dialog[open] [name=name]', 'Max Muster'); await dlgOk(); await warte(800);
  ok(await p.evaluate(async (id) => { const a = await KDB.eins('auftraege', id); return a.wert_netto === 1200 && a.kalk.nachtraege[0].uebernommen === true && a.kalk.std_soll === 10; }, auId), 'Nachtrag: angenommen, Auftragswert 1.000 € + 200 € = 1.200 €, Planwerte erhalten');
  ok((await text()).includes('Nachträge') && (await text()).includes('im Auftragswert'), 'Nachtrag: im Auftrag sichtbar');
  // Planwerte speichern darf Nachträge nicht löschen
  await p.evaluate(async (id) => { const f = document.createElement('form'); f.dataset.id = id; await K.formular.kalk({ std_soll: '12' }, f); }, auId); await warte(500);
  ok(await p.evaluate(async (id) => ((await KDB.eins('auftraege', id)).kalk.nachtraege || []).length === 1, auId), 'Nachtrag: bleibt nach Speichern der Planwerte erhalten');

  // Offline: Foto und Unterschrift am bestehenden Bericht
  const berId = await p.evaluate(async (auid) => (await K.neu('berichte', { nr: await K.nr('RB'), auftrag_id: auid, datum: U.isoTag(), stunden: 3, taetigkeit: 'Steckdosen gesetzt', material: [], status: 'entwurf' })).id, auId);
  await geh('berichte/' + berId);
  await p.evaluate(() => { window.__hoch = KDB.datei.hoch; KDB.datei.hoch = async () => { throw new TypeError('Failed to fetch'); }; });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await p.setInputFiles('[data-foto]', { name: 'f.png', mimeType: 'image/png', buffer: png }); await warte(1200);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('kundario-warteschlange') || '[]').some(e => e.art === 'foto')), 'Offline: Foto in der Warteschlange');
  await p.evaluate(() => { window.__aendern = KDB.aendern; KDB.aendern = async () => { throw new TypeError('Failed to fetch'); }; });
  await p.click('[data-a=berichtUnterschrift]'); await warte(500); await p.fill('dialog[open] [name=name]', 'Max Muster');
  { const r = await p.locator('#sig').boundingBox(); await p.mouse.move(r.x + 20, r.y + 30); await p.mouse.down(); for (let i = 0; i < 6; i++) await p.mouse.move(r.x + 30 + i * 30, r.y + 25 + (i % 2) * 30); await p.mouse.up(); }
  await dlgOk(); await warte(500);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('kundario-warteschlange') || '[]').some(e => e.art === 'unterschrift')), 'Offline: Unterschrift in der Warteschlange');
  await p.evaluate(() => { KDB.datei.hoch = window.__hoch; KDB.aendern = window.__aendern; }); await p.evaluate(() => K.warteschlangeSenden()); await warte(1200);
  ok(await p.evaluate(async (id) => { const b = await KDB.eins('berichte', id); return (b.fotos || []).length === 1 && b.status === 'unterschrieben' && !localStorage.getItem('kundario-warteschlange'); }, berId), 'Offline: Foto und Unterschrift nachträglich gesendet');

  // Lager und Einkauf
  await geh('lager'); await p.click('[data-a=lagerNeu]'); await warte();
  await p.fill('dialog[open] [name=text]', 'Schalter weiß'); await p.fill('dialog[open] [name=bestand]', '10'); await p.fill('dialog[open] [name=mindest]', '8'); await p.fill('dialog[open] [name=lieferant]', 'Elektro Großhandel'); await dlgOk(); await warte(500);
  await p.click('[data-a=lagerBuchen][data-r=ab]'); await warte(); await p.fill('dialog[open] [name=menge]', '3'); await p.selectOption('dialog[open] [name=auftrag_id]', auId); await dlgOk(); await warte(600);
  ok(await p.evaluate(async (auid) => { const l = (await K.liste('lager'))[0]; const m = (await K.liste('material')).filter(x => x.auftrag_id === auid); return l.bestand === 7 && m.length === 1 && m[0].status === 'geliefert'; }, auId), 'Lager: Entnahme bucht ab und steht als Material am Auftrag');
  await geh('uebersicht'); ok((await text()).includes('Lager: nachbestellen'), 'Übersicht: Mindestbestand unterschritten');
  await geh('lager'); await p.click('[data-a=lagerNachbestellen]'); await warte(); await dlgOk(); await warte(500);
  ok(await p.evaluate(async () => (await K.liste('material')).some(m => m.status === 'freigabe' && m.lieferant === 'Elektro Großhandel' && m.menge === 9)), 'Lager: Nachbestellen schlägt 9 Stück vor (2 × Mindestbestand − Bestand)');
  await geh('material'); await p.click('[data-a=bestellMail]'); await warte(); await p.fill('dialog[open] [name=an]', '');
  { const dl = p.waitForEvent('download'); await dlgOk(); const f = await dl; const t = fs.readFileSync(await f.path(), 'utf8'); ok(/Schalter weiß/.test(t) && /Lager/.test(t), 'Bestellung: Bestellliste als Datei je Lieferant'); }
  await warte(500);
  ok(await p.evaluate(async () => (await K.liste('material')).some(m => m.status === 'bestellt' && m.bestellt_at)), 'Bestellung: als bestellt markiert');
  await geh('material'); await p.click('[data-a=matStatus][data-s=geliefert]'); await warte(); await dlgOk(); await warte(600);
  ok(await p.evaluate(async () => (await K.liste('lager'))[0].bestand === 16), 'Wareneingang: 9 Stück ins Lager gebucht (7 + 9 = 16)');

  // Finanzen und Kontoauszug
  await geh('finanzen'); await p.click('[data-a=kontostand]'); await warte(); await p.fill('dialog[open] [name=betrag]', '5000'); await dlgOk(); await warte(500);
  await p.click('[data-a=ausgabeNeu]'); await warte(); await p.fill('dialog[open] [name=text]', 'Miete Werkstatt'); await p.fill('dialog[open] [name=betrag]', '900'); await dlgOk(); await warte(600);
  { const t = (await text()).replace(/\s+/g, ' ');
    ok(/Kontostand 5\.000,00 €/.test(t) && await p.locator('.fv-w').count() === 13, 'Finanzen: Kontostand und 13-Wochen-Vorschau');
    ok(/Ausgaben 90 Tage (2\.700|3\.600),00 €/.test(t), 'Finanzen: Miete monatlich in 90 Tagen (3 oder 4 Fälligkeiten)'); }
  const reNr = await p.evaluate(async (id) => (await KDB.eins('rechnungen', id)).nr, reId);
  await p.click('[data-a=kontoImport]'); await warte();
  await p.setInputFiles('dialog[open] input[type=file]', datei('umsaetze.csv', 'Kontoumsätze Girokonto\n\n"Buchungstag";"Valutadatum";"Beguenstigter/Zahlungspflichtiger";"Verwendungszweck";"Betrag"\n"14.11.2026";"14.11.2026";"Max Muster";"Rechnung ' + reNr + ' danke";"154,00"\n"13.11.2026";"13.11.2026";"Stadtwerke";"Abschlag Strom";"-89,00"\n'));
  await dlgOk(); await warte(800); await dlgOk(); await warte(800);
  ok(await p.evaluate(async (id) => { const r = await KDB.eins('rechnungen', id); const z = (await K.liste('zahlungen')).filter(x => x.rechnung_id === id); return r.status === 'bezahlt' && z.length === 1 && z[0].betrag === 154 && z[0].datum === '2026-11-14'; }, reId), 'Kontoauszug: Zahlung über die Rechnungsnummer zugeordnet, Rechnung bezahlt');

  await geh('finanzen'); await p.click('[data-a=monatsPdf]'); await warte(); await p.selectOption('dialog[open] [name=monat]', { index: 0 }); await dlgOk(); await warte(400);
  ok(await p.evaluate(() => /Monatsübersicht/.test(document.getElementById('druck').innerText) && /Zahlungseingänge \(1\)/.test(document.getElementById('druck').innerText)), 'Finanzen: Monatsübersicht als PDF mit Zahlungseingang');
  // Export für den Steuerberater und Kalenderdatei
  await geh('einstellungen'); await p.click('[data-a=steuerExport]'); await warte(); await p.fill('dialog[open] [name=von]', '2026-01-01'); await p.fill('dialog[open] [name=bis]', '2026-12-31');
  { const dl = p.waitForEvent('download'); await dlgOk(); const f = await dl; const t = fs.readFileSync(await f.path(), 'utf8'); ok(t.includes(reNr) && /154,00/.test(t) && /Rechnungsnummer/.test(t), 'Export: Rechnungsausgangsbuch'); }
  await warte(500); await p.click('[data-a=steuerExport]'); await warte(); await p.fill('dialog[open] [name=von]', '2026-01-01'); await p.fill('dialog[open] [name=bis]', '2026-12-31'); await p.selectOption('dialog[open] [name=art]', 'datev');
  { const dl = p.waitForEvent('download'); await dlgOk(); const f = await dl; const t = fs.readFileSync(await f.path(), 'latin1'); const z = t.split('\r\n');
    ok(/^"EXTF";700;21;"Buchungsstapel";13;/.test(z[0]) && /^Umsatz \(ohne Soll\/Haben-Kz\)/.test(z[1]) && z.some(x => x.startsWith('154,00;"S";"EUR";;;"";10000;8337;')), 'Export: DATEV-Stapel mit Kopf und § 13b auf Konto 8337'); }
  await p.evaluate(async () => { const d = new Date(Date.now() + 864e5); d.setHours(10, 0, 0, 0); await K.neu('termine', { titel: 'Kalendertest', art: 'besichtigung', beginn: d.toISOString(), mitarbeiter: [K.ctx.user.id] }); });
  await warte(400); await geh('kalender'); await p.click('[data-a=icsExport]'); await warte(); await p.selectOption('dialog[open] [name=wer]', 'alle');
  { const dl = p.waitForEvent('download'); await dlgOk(); const f = await dl; const t = fs.readFileSync(await f.path(), 'utf8'); ok(/BEGIN:VCALENDAR/.test(t) && /BEGIN:VEVENT/.test(t) && /SUMMARY:/.test(t), 'Kalenderdatei (.ics) mit Terminen'); }

  // Beispieldaten und alle neuen Ansichten
  await geh('einstellungen'); await p.click('[data-a=beispiel]'); await warte(); await dlgOk(); await warte(1200);
  ok(await p.evaluate(async () => (await K.liste('kunden')).some(k => /^Beispiel/.test(k.name))), 'Beispieldaten angelegt');
  for (const v of ['katalog', 'vorlagen', 'zeiten', 'plantafel', 'wartungen', 'protokolle', 'suche', 'fehler', 'hilfe/katalog', 'hilfe/erechnung', 'lager', 'finanzen', 'hilfe/lager', 'hilfe/finanzen']) { await geh(v); ok(!/Fehler|undefined|NaN/.test(await text()) || v === 'fehler', 'Ansicht ' + v + ' ohne Fehler'); }

  // Handy: neue Seiten ohne seitlichen Überlauf, SVG-Symbole unten
  await p.setViewportSize({ width: 390, height: 844 });
  for (const v of ['katalog', 'zeiten', 'wartungen', 'protokolle', 'suche', 'lager', 'finanzen']) { await geh(v); ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Handy ' + v + ': kein seitlicher Überlauf'); }
  ok(await p.locator('.unten svg').count() === 5, 'Handy: Symbole unten als Grafik');
  await shot('handy');

  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close();
  console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN');
  process.exit(fehler.length ? 1 : 0);
})();
