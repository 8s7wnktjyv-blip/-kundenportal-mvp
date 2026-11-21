// Ende-zu-Ende-Test (Bauplan Schritt 9): ein erfundener Fensterbaubetrieb und eine erfundene Hausverwaltung – von der Anfrage bis zur Zahlung.
// node tools/e2e_gesamt.js [bilder-ordner]
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/', BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const js = [];
  await p.addInitScript(() => { window.print = () => { window.__gedruckt = (window.__gedruckt || 0) + 1; }; window.open = (u) => { window.__geoeffnet = u; return null; }; });
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { if (p.url().endsWith('#/' + h)) await p.goto('about:blank'); await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, ev = (f, a) => p.evaluate(f, a), body = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/ges_${n}.png`, fullPage: true }); };
  const konto = async (name, mail, firma, gewerk) => {
    await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
    await p.fill('input[name=name]', name); await p.fill('input[name=email]', mail); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
    await p.fill('input[name=name]', firma); await p.selectOption('select[name=gewerk]', gewerk); await p.click('form[data-auth] button[type=submit]'); await warte(2500);
  };
  const wechsel = async (mail) => { await ev(async () => { await KDB.auth.abmelden(); }); await p.goto('about:blank'); await p.goto(BASIS + '?testmodus#anmelden'); await warte(500); await p.fill('input[name=email]', mail); await p.fill('input[name=pw]', 'geheim123'); await p.click('form[data-auth] button[type=submit]'); await warte(2000); };
  const zeichne = async (seite, sel) => { const r = await seite.locator(sel).boundingBox(); await seite.mouse.move(r.x + 20, r.y + 30); await seite.mouse.down(); for (let i = 0; i < 8; i++) await seite.mouse.move(r.x + 30 + i * 25, r.y + 40 + (i % 2) * 30); await seite.mouse.up(); };

  // 1) Betrieb richtet sich ein
  await p.goto(BASIS + '?testmodus'); await p.evaluate(() => localStorage.clear());
  await konto('Frank Fenster', 'fenster@beispiel.test', 'Fensterbau Beispiel (Test)', 'Fenster- und Türenbau');
  await ev(async () => { const kal = Object.assign({}, K.ctx.betrieb.kalkulation || {}, { bauteilpreise: { 'Fenster': { modus: 'm2', preis_m2: 450, mindest_m2: 1, montage: 120 }, 'Rollladen': { modus: 'm2', preis_m2: 220, mindest_m2: 1, grund: 150, montage: 80 } } });
    K.ctx.betrieb = await KDB.aendern('betriebe', K.bid(), { kalkulation: kal, strasse: 'Werkstraße 1', plz: '91054', ort: 'Erlangen', telefon: '09131 000000', email: 'fenster@beispiel.test', iban: 'DE02120300000000202051', steuernummer: '216/000/00000' }); });
  await geh('einstellungen'); await warte(400);
  const link = await ev(() => document.querySelector('#anfrage-link input').value);
  ok(/anfrage=[0-9a-f]{36}/.test(link), '1. Betrieb eingerichtet: Bauteil-Preise und Anfrage-Link');

  // 2) Privatkundin fragt über die Website an
  const k = await ctx.newPage();
  await k.goto(link + '&betreff=' + encodeURIComponent('3 Fenster und 2 Rollläden tauschen')); await k.waitForTimeout(700);
  await k.fill('#anfrage [name=name]', 'Erika Beispiel'); await k.fill('#anfrage [name=email]', 'erika@beispiel.test'); await k.fill('#anfrage [name=strasse]', 'Gartenweg 3'); await k.fill('#anfrage [name=plz]', '91052'); await k.fill('#anfrage [name=ort]', 'Erlangen'); await k.fill('#anfrage [name=text]', 'Altbau, Holzfenster von 1985');
  await k.check('#anfrage [name=ok]'); await k.click('#anfrage button[type=submit]'); await k.waitForTimeout(700);
  ok((await k.innerText('body')).includes('Danke'), '2. Kundin hat über den Anfrage-Link angefragt');

  // 3) Aufmaß aus der Anfrage, Preise nach Maß, Angebot
  await geh('anfragen'); const anf = await ev(async () => (await K.liste('anfragen'))[0]);
  ok(anf.kanal === 'formular' && anf.betreff === '3 Fenster und 2 Rollläden tauschen' && await ev(async (id) => { const k = await KDB.eins('kunden', id); return k.strasse === 'Gartenweg 3' && k.plz === '91052' && k.ort === 'Erlangen'; }, anf.kunde_id), '3a. Anfrage angekommen, Kundin mit vollständiger Anschrift');
  await geh('aufmass/neu/' + anf.id); await warte(500);
  const z = async (i, art, lage, br, ho, n, aus) => { if (i) await p.click('[data-a=btNeu]'); await p.selectOption(`[name=bt_a_${i}]`, art); await p.fill(`[name=bt_l_${i}]`, lage); await p.fill(`[name=bt_b_${i}]`, br); await p.fill(`[name=bt_h_${i}]`, ho); await p.fill(`[name=bt_n_${i}]`, n); if (aus) await p.fill(`[name=bt_x_${i}]`, aus); };
  await z(0, 'Fenster', 'Wohnzimmer', '1230', '1480', '2', 'Dreh-Kipp, Kunststoff'); await z(1, 'Fenster', 'Bad', '600', '800', '1', 'Kipp'); await z(2, 'Rollladen', 'Wohnzimmer', '1230', '1480', '2', 'Vorbau, Elektro');
  await p.click('#am-form button.btn-signal:not([type=button])'); await warte(900);
  const amId = await ev(async () => (await K.liste('aufmasse'))[0].id);
  ok((await body()).includes('Richtpreis netto'), '3b. Aufmaß mit Richtpreis');
  await p.click('[data-a=aufmassDruck]'); await warte(1000);
  ok((await ev(() => document.getElementById('druck').innerText)).includes('Aufmaßprotokoll'), '3c. Aufmaßprotokoll gedruckt');
  await p.click('[data-a=aufmassAngebot]'); await warte(); await dlgOk(); await warte(1000);
  const ang = await ev(async () => (await K.liste('angebote'))[0]);
  ok(ang.kunde_id === anf.kunde_id && ang.anfrage_id === anf.id && ang.positionen.some(x => x.text.startsWith('Fenster, Wohnzimmer') && x.preis === 819.18) && ang.positionen.some(x => x.text === 'Montage Fenster' && x.menge === 3), '3d. Angebot mit Kundin, Preisen und Montage');
  await shot('angebot');

  // 4) Vor Ort unterschreiben → Auftrag
  await geh('angebote/' + ang.id); await p.click('[data-a=angebotVorOrt]'); await warte(400); await dlgOk(); await warte(900);
  const portal = await ev(() => window.__geoeffnet || '');
  const t = await ctx.newPage(); await t.goto(portal); await t.waitForTimeout(800); await zeichne(t, '#sig'); await t.check('#annahme [name=agb]'); await t.click('#annahme button[type=submit]'); await t.waitForTimeout(800);
  ok((await t.innerText('body')).includes('Vielen Dank'), '4a. Kundin unterschreibt auf dem Tablet'); await t.close();
  await geh('uebersicht'); await geh('angebote/' + ang.id); await p.click('[data-a=auftragAusAngebot]'); await warte(900);
  const auId = await ev(() => location.hash.split('/')[2]); ok(!!auId, '4b. Auftrag angelegt');

  // 5) Rechnung, Übergabe-Vorschau, Zahlung
  await geh(`auftraege/${auId}/rechnungen`); await p.click('[data-a=rechnungAusAuftrag][data-art=schluss]'); await warte(900);
  await p.fill('#re-form [name=leistungszeitraum]', '10.–14.11.2026'); await p.click('[data-a=rechnungStellen]'); await warte(800); await dlgOk(); await warte(800); if (await p.locator('dialog[open]').count()) await dlgOk(''); await warte(300);
  const re = await ev(async () => (await K.liste('rechnungen'))[0]);
  ok(re.status !== 'entwurf' && /RE-\d{4}-0001/.test(re.nr) && re.netto === 3709.34 && await ev(async (id) => (await KDB.eins('angebote', id)).netto === 3709.34, ang.id), '5a. Schlussrechnung gestellt: 3.709,34 € netto wie Angebot (Fenster nach m², Mindestfläche, Rollladen mit Zuschlag, Montage)');
  await geh('rechnungen/' + re.id); await p.click('[data-a=rechnungUebergeben]'); await warte(400); await dlgOk(); await warte(400);
  ok((await ev(() => document.querySelector('dialog[open] .uebergabe-json').textContent)).includes('Montage Fenster'), '5b. Vorschau der Übergabe an Lexware Office'); await dlgOk('');
  await p.click('[data-a=zahlung]'); await warte(); await dlgOk(); await warte(700);
  ok((await body()).includes('Bezahlt'), '5c. Zahlung erfasst');

  // 6) Hausverwaltung beauftragt denselben Betrieb über eine eigene Frist
  await ev(async () => { await KDB.auth.abmelden(); }); await p.goto('about:blank');
  await konto('Helga Haus', 'hv@beispiel.test', 'Hausverwaltung Beispiel (Test)', 'Hausverwaltung');
  await ev(async () => { const o = await K.neu('objekte', { name: 'Lindenstraße 5', strasse: 'Lindenstraße 5', plz: '90762', ort: 'Fürth', einheiten: 10 }); await K.neu('anlagen', { objekt_id: o.id, art: 'heizkessel', einbau_jahr: 2001 }); await K.fristen60bAbgleichen(o.id);
    await K.neu('fristen', { objekt_id: o.id, titel: 'Fenster Treppenhaus prüfen lassen', grundlage: 'eigen', faellig: U.plusTage(null, 20), intervall_monate: 24, status: 'offen' }); });
  await geh('uebersicht'); ok((await body()).includes('Fenster Treppenhaus') && (await body()).includes('Heizungsprüfungen offen'), '6a. Verwaltung sieht § 60b-Prüfung und eigene Frist');
  const fid = await ev(async () => (await K.liste('fristen')).find(f => f.grundlage === 'eigen').id);
  await geh('fristen'); await p.click(`[data-a=fristAnfrage][data-id="${fid}"]`); await warte(400); await p.fill('dialog[open] [name=link]', link); await dlgOk(); await warte(1000);
  ok(await ev(async (id) => (await KDB.eins('fristen', id)).fachbetrieb === 'Fensterbau Beispiel (Test)', fid), '6b. Fensterbau über den Anfrage-Link beauftragt');
  await wechsel('fenster@beispiel.test');
  ok(await ev(async () => (await K.liste('anfragen')).some(a => a.betreff.startsWith('Fenster Treppenhaus') && (a.beschreibung || '').includes('Lindenstraße 5'))), '6c. Betrieb hat die Anfrage mit Objektdaten');
  await wechsel('hv@beispiel.test');
  const pdf = require('path').join(require('os').tmpdir(), 'pruefbericht_fenster.pdf'); require('fs').writeFileSync(pdf, '%PDF-1.4\n% Bericht\n');
  await geh('fristen'); await p.click(`[data-a=fristErledigt][data-id="${fid}"]`); await warte(400); await p.setInputFiles('dialog[open] input[name=datei]', pdf); await dlgOk(); await warte(1000);
  ok(await ev(async () => { const l = await K.liste('fristen', { wo: { grundlage: 'eigen' } }); return l.some(f => f.status === 'erledigt' && f.nachweis) && l.some(f => f.status === 'offen'); }), '6d. Frist erledigt mit Nachweis, nächste in 24 Monaten angelegt');
  await shot('verwaltung');

  // 7) Am Handy ohne Überlauf, keine Fehler
  await p.setViewportSize({ width: 390, height: 844 }); for (const v of ['uebersicht', 'objekte', 'fristen/alle']) { await geh(v); ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), '7. Handy ' + v + ' ohne Überlauf'); }
  ok(js.length === 0, 'Keine JavaScript-Fehler im ganzen Durchlauf ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
