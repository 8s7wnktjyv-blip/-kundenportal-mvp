// Ende-zu-Ende-Test: Design 2026 – Morgenbericht „Heute entscheiden“, Seitenleiste Einfach/Alle, Anfragen-Pipeline mit nächstem Schritt, Fortschrittsleiste.
// node tools/e2e_design.js
const { chromium } = require('playwright');
const BASIS = (process.env.BASE || 'http://localhost:8765/') + 'app/';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage(), js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 400) => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
  const geh = async (h) => { await p.goto('about:blank'); await p.goto(BASIS + '?testmodus#/' + h); await warte(1400); };
  const text = () => ev(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));

  await p.goto(BASIS + '?testmodus'); await ev(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.goto('about:blank'); await p.goto(BASIS + '?testmodus#registrieren'); await warte(700);
  await p.fill('input[name=name]', 'Max Meister'); await p.fill('input[name=email]', 'design@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]');
  await p.click('form[data-auth] button[type=submit]'); await warte(900);
  await p.fill('input[name=name]', 'Meister Fensterbau'); await p.selectOption('select[name=gewerk]', 'Fenster- und Türenbau'); await p.click('form[data-auth] button[type=submit]'); await warte(2500);

  const ids = await ev(async () => {
    const t = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    const alt = (id, std) => { const d = JSON.parse(localStorage.getItem('kundario-testdaten')); d.tabellen.anfragen.forEach(x => { if (x.id === id) x.created_at = new Date(Date.now() - std * 36e5).toISOString(); }); localStorage.setItem('kundario-testdaten', JSON.stringify(d)); };
    const k = await K.neu('kunden', { name: 'Familie Berger', telefon: '0911 123456' }), k2 = await K.neu('kunden', { name: 'Petra Lang' });
    await K.neu('rechnungen', { nr: 'RE-41', kunde_id: k2.id, status: 'gestellt', brutto: 4284, netto: 3600, faellig: t(-9) });
    const a1 = await K.neu('anfragen', { betreff: 'Haustür tauschen', kunde_id: k.id, kanal: 'formular', status: 'neu', wert_geschaetzt: 8500 }); alt(a1.id, 30);
    const a2 = await K.neu('anfragen', { betreff: 'Rollladen klemmt', kunde_id: k2.id, kanal: 'telefon', status: 'neu' });
    const a3 = await K.neu('anfragen', { betreff: 'Wintergarten', kunde_id: k.id, kanal: 'email', status: 'besichtigung', wert_geschaetzt: 18000 }); alt(a3.id, 100);
    const an = await K.neu('angebote', { nr: 'AN-118', kunde_id: k2.id, anfrage_id: a2.id, titel: 'Rollladen', status: 'angenommen', netto: 1200, brutto: 1428, positionen: [] });
    const au = await K.neu('auftraege', { nr: 'AU-7', kunde_id: k2.id, angebot_id: an.id, titel: 'Rollladen', status: 'in_arbeit', wert_netto: 1200 });
    await K.neu('aufgaben', { titel: 'Glas reklamieren', faellig: t(-1) });
    const be = await K.neu('berichte', { nr: 'RB-1', auftrag_id: au.id, datum: t(0), stunden: 3.5, taetigkeit: 'Rollladen montiert', status: 'entwurf', material: [] });
    return { a1: a1.id, a2: a2.id, a3: a3.id, an: an.id, au: au.id, be: be.id };
  });

  // 1) Morgenbericht
  await geh('uebersicht');
  const heute = await ev(() => { const x = document.getElementById('heute'); return x ? [...x.querySelectorAll('.hz')].map(z => z.innerText.replace(/\s+/g, ' ')) : []; });
  ok(heute.length >= 3 && heute.length <= 7, '1a. Morgenbericht zeigt ' + heute.length + ' Punkte (höchstens 7)');
  ok(/Zahlung anmahnen.*RE-41/.test(heute[0] || ''), '1b. Überfällige Rechnung steht an erster Stelle');
  ok(heute.some(x => /Anfrage beantworten.*Haustür/.test(x)) && heute.some(x => /Erledigen.*Glas reklamieren/.test(x)), '1c. Alte Anfrage und überfällige Aufgabe im Bericht');
  ok(await ev(() => document.querySelector('.heute-geld b').innerText.includes('4.284,00')), '1d. „Geld, das auf Sie wartet“ ohne geschätzte Anfragewerte');
  ok(await ev(() => document.querySelector('#heute').compareDocumentPosition(document.querySelector('.kpis')) & Node.DOCUMENT_POSITION_FOLLOWING), '1e. Bericht steht über den Kennzahlen');
  await p.click('#heute .hz:first-child [data-a=mahnen]'); await warte(700);
  ok(await ev(() => /1\. Zahlungserinnerung/.test(document.querySelector('dialog[open]').innerText) && /RE-41/.test(document.querySelector('dialog[open] textarea').value)), '1g. „Mahnen“ öffnet direkt die fertige Zahlungserinnerung');
  await p.click('dialog[open] footer button[value=""]'); await warte(400);
  await p.click('#heute [data-a=aufgabeErledigt]'); await warte(1200);
  ok(!(await text()).includes('Glas reklamieren'), '1f. Aufgabe direkt aus dem Bericht erledigt');

  // 2) Seitenleiste Einfach / Alle
  const sichtbar = (v) => ev((v) => { const a = document.querySelector('.nav a[data-v=' + v + ']'); return !!a && a.offsetParent !== null; }, v);
  ok(await sichtbar('anfragen') && !(await sichtbar('lager')), '2a. „Einfach“: Anfragen sichtbar, Lager ausgeblendet');
  await p.click('[data-navmodus=alle]'); await warte(200);
  ok(await sichtbar('lager') && await sichtbar('kasse'), '2b. „Alle“ zeigt das ganze Menü');
  await p.reload(); await warte(1200); ok(await sichtbar('lager'), '2c. Auswahl bleibt nach Neuladen');
  await p.click('[data-navmodus=einfach]'); await geh('lager'); ok(await sichtbar('lager'), '2d. Aktive Seite bleibt im Menü sichtbar, auch in „Einfach“');

  // 3) Pipeline
  await geh('anfragen');
  ok(await ev(() => document.querySelectorAll('.pl-spalte').length === 4), '3a. Pipeline ist die Standardansicht');
  const karte = (id) => ev((id) => { const k = document.querySelector('[data-anf="' + id + '"]'); return k ? { cls: k.className, txt: k.innerText.replace(/\s+/g, ' '), weiter: (k.querySelector('.pl-weiter') || {}).outerHTML || '' } : null; }, id);
  const k1 = await karte(ids.a1), k3 = await karte(ids.a3);
  ok(k1 && /alt-heute/.test(k1.cls) && /seit 30 Std\./.test(k1.txt) && /tel:0911123456/.test(k1.weiter) && /btn-signal/.test(k1.weiter), '3b. Neue Anfrage: Ampel, Wartezeit, „Anrufen“ mit Telefonnummer');
  ok(k3 && /angebotAusAnfrage/.test(k3.weiter) && /Angebot schreiben/.test(k3.weiter), '3c. Nach der Besichtigung: „Angebot schreiben“');
  ok(await ev(() => document.querySelector('.pl-spalte[data-pl=neu] .pl-karte').dataset.anf) === ids.a1, '3d. Wichtigste Anfrage steht oben in der Spalte');
  await p.click(`[data-anf="${ids.a3}"] .pl-weiter`); await warte(1500);
  ok(await ev(async (a3) => { const id = location.hash.split('/')[2]; const an = id && await KDB.eins('angebote', id); return !!an && an.anfrage_id === a3; }, ids.a3), '3e. Knopf legt das Angebot aus der Anfrage an');

  // 4) Fortschrittsleiste
  const leiste = () => ev(() => { const x = document.querySelector('#inhalt .ablauf'); return x ? x.innerText.replace(/\s+/g, ' ') : ''; });
  await geh('anfragen/' + ids.a1); ok(/✓ Anfrage 2 Angebot/.test(await leiste()) && /Nächster Schritt: Angebot erstellen/.test(await leiste()), '4a. Anfrage: Station 1 erledigt, nächster Schritt Angebot');
  await geh('auftraege/' + ids.au); ok(/✓ Anfrage ✓ Angebot ✓ Angenommen ✓ Auftrag 5 Ausführung/.test(await leiste()), '4b. Auftrag: Kette Anfrage → Angebot → Auftrag erkannt');
  await p.click('.ablauf li:first-child a'); await warte(1400); ok(await ev((id) => location.hash === '#/anfragen/' + id, ids.a2), '4c. Station ist ein Link zur Anfrage');

  // 4d) Angebotsvorschlag aus Katalog und früheren Angeboten (regelbasiert)
  const vid = await ev(async () => {
    for (const [t, pr, k] of [['Kunststofffenster 3-fach verglast', 890, 'Fenster'], ['Demontage und Entsorgung Altfenster', 95, 'Fenster'], ['Gurtwickler tauschen', 45, 'Rollladen'], ['Anfahrt Pauschale', 39, 'Allgemein']]) await K.neu('artikel', { typ: 'leistung', text: t, einheit: 'Stk.', preis: pr, kategorie: k, aktiv: true });
    const k = (await K.liste('kunden'))[0]; return (await K.neu('anfragen', { betreff: 'Drei Fenster tauschen', beschreibung: 'Alte Fenster bitte entsorgen.', kunde_id: k.id, kanal: 'email', status: 'neu' })).id;
  });
  await geh('anfragen/' + vid); await p.click('[data-a=angebotVorschlag]'); await warte(800);
  const vs = await ev(() => [...document.querySelectorAll('dialog[open] .vs-zeile')].map(z => (z.querySelector('input').checked ? 'x ' : '- ') + z.innerText.replace(/\s+/g, ' ')));
  ok(vs.some(x => /^x Kunststofffenster.*3 Stk\. × 890,00 €/.test(x)) && vs.some(x => /^x Demontage.*3 Stk\./.test(x)) && !vs.some(x => /Anfahrt/.test(x)), '4d. Vorschlag: Fenster und Entsorgung mit Menge 3 aus dem Text, Unpassendes fehlt');
  await p.click('dialog[open] footer button[value=ok]'); await warte(1500);
  ok(await ev(async (vid) => { const an = await KDB.eins('angebote', location.hash.split('/')[2]); return !!an && an.status === 'entwurf' && an.anfrage_id === vid && an.positionen.length === 2 && an.positionen.every(x => x.preis > 0); }, vid), '4e. Entwurf mit den gewählten Positionen und Preisen angelegt');

  // 4f) Branchen-Startpaket im Katalog (Preise bleiben leer)
  await geh('katalog'); await p.click('[data-a=startpaket]'); await warte(700);
  ok(await ev(() => /Startpaket Fenster- und Türenbau/.test(document.querySelector('dialog[open]').innerText)), '4f. Startpaket passend zum Gewerk');
  await p.click('dialog[open] footer button[value=ok]'); await warte(2500);
  const kat = await ev(async () => (await K.liste('artikel')));
  ok(kat.length >= 25 && kat.some(a => /Rollladen-Aufsatzkasten/.test(a.text)) && kat.filter(a => /Kunststofffenster 3-fach verglast/.test(a.text)).length === 1 && kat.filter(a => !/Kunststofffenster 3-fach|Demontage|Gurtwickler|Anfahrt/.test(a.text)).every(a => +a.preis === 0), '4g. ' + kat.length + ' Einträge übernommen, keine erfundenen Preise, keine Doppelten');
  await p.click('[data-a=startpaket]'); await warte(500); ok((await ev(() => document.getElementById('toasts').innerText)).includes('schon'), '4h. Zweites Mal: nichts doppelt');

  // 4k) Preise nachtragen
  await geh('katalog'); const ohneVor = +(await ev(() => (document.querySelector('.hinweis-band b') || {}).innerText || '0').then(t => t)).match(/\d+/)[0];
  await p.click('[data-a=preiseNachtragen]'); await warte(700);
  await p.fill('dialog[open] [name=p0]', '119,50'); await p.fill('dialog[open] [name=p1]', '85'); await p.click('dialog[open] footer button[value=ok]'); await warte(1500);
  const ohneNach = +((await ev(() => (document.querySelector('.hinweis-band b') || {}).innerText || '0')).match(/\d+/)[0]);
  ok(ohneVor > 5 && ohneNach === ohneVor - 2 && await ev(async () => (await K.liste('artikel')).some(a => +a.preis === 119.5)), '4k. Preise nachtragen: ' + ohneVor + ' → ' + ohneNach + ' ohne Preis');

  // 4m) Einzelne Rechnung ohne Auftrag: keine Fortschrittsleiste
  const reEinzeln = await ev(async () => (await K.neu('rechnungen', { nr: 'RE-99', kunde_id: (await K.liste('kunden'))[0].id, status: 'gestellt', brutto: 119, netto: 100, faellig: U.plusTage(null, 14), positionen: [] })).id);
  await geh('rechnungen/' + reEinzeln); ok(await ev(() => !document.querySelector('#inhalt .ablauf')), '4m. Rechnung ohne Auftrag zeigt keine irreführende Fortschrittsleiste');

  // 4l) Einstellungen: Betriebsdaten oben, Hinweis auf fehlende Pflichtangaben
  await geh('einstellungen');
  ok(await ev(() => { const band = document.getElementById('pflicht-band'), f = document.querySelector('#inhalt form[data-f="betrieb"]'); return !!band && /IBAN/.test(band.innerText) && band.nextElementSibling === f; }), '4l. Einstellungen: Betriebsdaten zuerst, fehlende Pflichtangaben genannt');

  // 4i) Kalender: + an einem Tag legt den Termin für genau diesen Tag an
  await geh('kalender');
  const tagIso = await ev(() => document.querySelectorAll('.kal-plus')[10].dataset.tag);
  await p.click('.kal-plus[data-tag="' + tagIso + '"]'); await warte(700);
  ok(await ev((t) => document.querySelector('dialog[open] [name=tag]').value === t, tagIso) && /KW \d+ und \d+/.test(await text()), '4i. Kalender: KW-Anzeige, „+“ übernimmt das Datum');
  await p.fill('dialog[open] [name=titel]', 'Aufmaß Markise'); await p.click('dialog[open] footer button[value=ok]'); await warte(1200);
  ok(await ev(async (t) => (await K.liste('termine')).some(x => x.titel === 'Aufmaß Markise' && U.isoTag(x.beginn) === t), tagIso), '4j. Termin am gewählten Tag gespeichert');

  // 5) Handy
  await p.setViewportSize({ width: 390, height: 844 });
  for (const v of ['uebersicht', 'anfragen', 'auftraege/' + ids.au]) { await geh(v); ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), '5. Handy ' + v.split('/')[0] + ': kein seitlicher Überlauf'); }
  ok(await ev(() => parseFloat(getComputedStyle([...document.querySelectorAll('#inhalt input, #inhalt select')].find(e => e.offsetParent)).fontSize) >= 16), '5d. Handy: Eingabefelder 16 px (kein Zoom am iPhone)');

  await geh('berichte/' + ids.be);
  ok(await ev(() => { const s = document.querySelector('.ber-schritte'); return !!s && s.innerText.replace(/\s+/g, ' ').includes('✓ Arbeit & Material 2 Fotos 3 Unterschrift') && !!s.querySelector('.jetzt'); }), '6a. Regiebericht: drei Schritte, Fotos als nächster Schritt');
  ok(await ev(() => { const l = document.querySelector('.ber-leiste'); return !!l && getComputedStyle(l).position === 'sticky' && !!l.querySelector('[data-a=berichtUnterschrift]'); }), '6b. Handy: Knopfleiste mit „Kunde unterschreiben lassen“ klebt unten');
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 3)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
