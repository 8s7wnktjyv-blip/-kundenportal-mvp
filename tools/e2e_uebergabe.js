// Test: Rechnungsübergabe an Lexware Office / sevDesk – Umwandlung (ohne Browser) und App im Testmodus. node tools/e2e_uebergabe.js
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/';
const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
require('../supabase/functions/_shared/uebergabe.js'); const UE = globalThis.KUebergabe;

// 1) Umwandlung
const RE = { nr: 'RE-2026-0007', status: 'gestellt', art: 'rechnung', datum: '2026-11-20', faellig: '2026-12-04', mwst: 19, steuerfall: 'normal', skonto_prozent: 2, skonto_tage: 7, leistungszeitraum: '10.–14.11.2026',
  dokument: { empfaenger: { name: 'Familie Huber', strasse: 'Ringstraße 10', plz: '90402', ort: 'Nürnberg' } },
  positionen: [{ typ: 'titel', text: 'Fenster' }, { typ: 'pos', text: 'Fenster Küche 1.230 × 1.480 mm', menge: 2, einheit: 'Stk.', preis: 819.18 }, { typ: 'pos', text: 'Montage', menge: '3', einheit: 'Stk.', preis: '120,00', rabatt: 10 },
    { typ: 'pos', text: 'Optionale Fensterbank', menge: 1, preis: 50, optional: true }, { typ: 'text', text: 'Entsorgung inklusive' }, { typ: 'pos', text: '  ', menge: 1, preis: 0 }] };
const lx = UE.lexware(RE, {});
ok(lx.voucherDate.startsWith('2026-11-20') && lx.address.name === 'Familie Huber' && lx.address.zip === '90402' && lx.address.countryCode === 'DE', 'Lexware: Datum und Anschrift aus dem festgeschriebenen Dokument');
ok(lx.lineItems.length === 4 && lx.lineItems[0].type === 'text' && lx.lineItems[1].type === 'custom' && lx.lineItems[1].unitPrice.netAmount === 819.18 && lx.lineItems[1].unitPrice.taxRatePercentage === 19, 'Lexware: Titel/Text als Text, Positionen mit Netto und 19 %');
ok(lx.lineItems[2].quantity === 3 && lx.lineItems[2].unitPrice.netAmount === 120 && lx.lineItems[2].discountPercentage === 10, 'Lexware: Zahlen mit Komma, Rabatt übernommen');
ok(!JSON.stringify(lx).includes('Optionale Fensterbank') && !lx.lineItems.some(x => x.name === '  '), 'Lexware: optionale und leere Positionen nicht übergeben');
ok(lx.taxConditions.taxType === 'net' && lx.paymentConditions.paymentTermDuration === 14 && lx.paymentConditions.paymentDiscountConditions.discountPercentage === 2 && lx.paymentConditions.paymentDiscountConditions.discountRange === 7, 'Lexware: Zahlungsziel 14 Tage, 2 % Skonto in 7 Tagen');
ok(lx.introduction.includes('RE-2026-0007') && lx.introduction.includes('Leistungszeitraum') && lx.shippingConditions.shippingType === 'service', 'Lexware: Kundario-Nummer und Leistungszeitraum im Text');
const lx13 = UE.lexware(Object.assign({}, RE, { steuerfall: '13b' }), {}), lx19 = UE.lexware(Object.assign({}, RE, { steuerfall: 'kleinunternehmer' }), {});
ok(lx13.taxConditions.taxType === 'constructionService13b' && lx13.lineItems[1].unitPrice.taxRatePercentage === 0 && lx13.remark.includes('13b'), 'Lexware: § 13b als Bauleistung, 0 %, Hinweis');
ok(lx19.taxConditions.taxType === 'vatfree' && lx19.remark.includes('§ 19'), 'Lexware: Kleinunternehmer steuerfrei mit Hinweis');
ok((() => { try { UE.lexware(Object.assign({}, RE, { status: 'entwurf' }), {}); return false; } catch (e) { return /gestellte/.test(e.message); } })(), 'Entwurf wird nicht übergeben');
ok(UE.netto(RE) === 1962.36, 'Kontrollsumme netto 1.962,36 € (2 × 819,18 + 3 × 120 − 10 %)');
const sd = UE.sevdesk(RE, {}, { contactId: 42, sevUserId: 7 });
ok(sd.invoice.invoiceDate === '20.11.2026' && sd.invoice.status === '100' && sd.invoice.contact.id === 42 && sd.invoice.contactPerson.id === 7 && sd.invoice.timeToPay === 14, 'sevDesk: Entwurf (100), Datum TT.MM.JJJJ, Kontakt und Benutzer');
ok(sd.invoicePosSave.length === 2 && sd.invoicePosSave[1].price === 120 && sd.invoicePosSave[1].taxRate === 19 && sd.invoice.address.startsWith('Familie Huber\nRingstraße 10\n90402 Nürnberg'), 'sevDesk: Positionen und Anschrift');
ok(UE.sevdesk(Object.assign({}, RE, { steuerfall: '13b' }), {}).invoice.taxRule.id === '5' && UE.sevdesk(Object.assign({}, RE, { steuerfall: 'kleinunternehmer' }), {}).invoice.taxRule.id === '11', 'sevDesk: Steuerregeln § 13b und § 19');

// 2) App im Testmodus
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, ev = (f, a) => p.evaluate(f, a);
  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Rudi Rechnung'); await p.fill('input[name=email]', 're@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Fensterbau Rechnung Test'); await p.selectOption('select[name=gewerk]', 'Fenster- und Türenbau'); await p.click('form[data-auth] button[type=submit]'); await warte(3000);
  const rid = await ev(async (re) => { const k = await K.neu('kunden', { name: 'Familie Huber', strasse: 'Ringstraße 10', plz: '90402', ort: 'Nürnberg' }); const r = await K.neu('rechnungen', Object.assign({}, re, { kunde_id: k.id, netto: 1962.36, brutto: 2335.21 })); return r.id; }, RE);
  await geh('rechnungen/' + rid);
  ok(await ev(() => !!document.querySelector('[data-a=rechnungUebergeben]')), 'Rechnung: Knopf „An Lexware/sevDesk“');
  await p.click('[data-a=rechnungUebergeben]'); await warte(400);
  ok((await ev(() => document.querySelector('dialog[open]').innerText)).includes('Entwurf') && (await ev(() => document.querySelector('dialog[open]').innerText)).includes('Testmodus'), 'Dialog erklärt Entwurf und Testmodus');
  await dlgOk(); await warte(400);
  const vor = await ev(() => document.querySelector('dialog[open] .uebergabe-json').textContent);
  ok(vor.includes('"taxType": "net"') && vor.includes('Fenster Küche'), 'Vorschau zeigt die Lexware-Daten');
  const dl = p.waitForEvent('download'); await dlgOk('datei'); const datei = await dl; const inhalt = JSON.parse(require('fs').readFileSync(await datei.path(), 'utf8'));
  ok(datei.suggestedFilename() === 'Rechnung_RE-2026-0007_lexware.json' && inhalt.lineItems.length === 4, 'Als Datei gespeichert');
  await warte(700); ok((await ev(() => document.getElementById('inhalt').innerText)).includes('übergeben'), 'Rechnung zeigt „übergeben“');
  await p.click('[data-a=rechnungUebergeben]'); await warte(400);
  ok((await ev(() => document.querySelector('dialog[open]').innerText)).includes('schon übergeben'), 'Warnung bei erneuter Übergabe');
  await p.selectOption('dialog[open] [name=anbieter]', 'sevdesk'); await dlgOk(); await warte(400);
  ok((await ev(() => document.querySelector('dialog[open] .uebergabe-json').textContent)).includes('"invoicePosSave"'), 'sevDesk-Vorschau');
  await dlgOk('');
  await geh('einstellungen'); await warte(500); ok(await ev(() => !!document.getElementById('re-programm') && !!document.getElementById('anfrage-link')), 'Einstellungen: Rechnungsprogramm und Anfrage-Link');
  ok(await ev(() => { const r0 = K.ctx.ich.rolle; K.ctx.ich.rolle = 'monteur'; const d = K.darf('rechnungen'); K.ctx.ich.rolle = r0; return !d; }), 'Montagekraft hat keinen Zugriff auf Rechnungen');
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
