// Ende-zu-Ende-Test: Bauteil-Preise (je m², Preistabelle Breite × Höhe, Montage) → Richtpreis im Aufmaß → Angebot. node tools/e2e_preise.js [bilder-ordner]
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/', BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const js = [];
  await p.addInitScript(() => { window.open = (u) => { window.__geoeffnet = u; return null; }; });
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const toast = () => p.evaluate(() => (document.getElementById('toasts') || {}).innerText || '');
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/pr_${n}.png`, fullPage: true }); };
  const ev = (f, a) => p.evaluate(f, a);

  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Rita Rollladen'); await p.fill('input[name=email]', 'rts@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Rollladen und Fenster Test'); await p.selectOption('select[name=gewerk]', 'Fenster- und Türenbau'); await p.click('form[data-auth] button[type=submit]'); await warte(3000);

  // Rechenkern
  const CSV = 'H/B;1000;1250;1500\n1000;210;235;260\n1250;230;258;286\n1500;250;281;312';
  ok(await ev((c) => { const t = K.preistabelleLesen(c); return t.breiten.join() === '1000,1250,1500' && t.hoehen.length === 3 && t.preise[2][1] === 281; }, CSV), 'Preistabelle lesen (Semikolon, mm)');
  ok(await ev((c) => { const t = K.preistabelleLesen(c); return K.preistabelleSuchen(t, 1230, 1480) === 281 && K.preistabelleSuchen(t, 1000, 1000) === 210 && K.preistabelleSuchen(t, 1600, 1000) === null; }, CSV), 'Auf nächste Stufe aufrunden, außerhalb → kein Preis');
  ok(await ev(() => K.preistabelleLesen('H/B\t1.000\t1.250\n1.000\t210,50\t235').preise[0][0] === 210.5), 'Auch Tabulator und Tausenderpunkt aus Excel');
  ok(await ev(() => { try { K.preistabelleLesen('H/B;1250;1000\n1000;1;2'); return false; } catch (e) { return /aufsteigend/.test(e.message); } }), 'Unsortierte Tabelle wird mit Hinweis abgelehnt');
  ok(await ev(() => { try { K.preistabelleLesen('H/B;1000;1250\n1000;1'); return false; } catch (e) { return /erwartet 2/.test(e.message); } }), 'Fehlende Preise in einer Zeile werden gemeldet');

  // Preise einrichten
  await geh('bauteilpreise');
  ok(await ev(() => !!document.querySelector('.nav a[data-v=bauteilpreise]')) && (await text()).includes('Terrassendach / Überdachung'), 'Menü „Bauteil-Preise“ mit allen Arten');
  await p.click('[data-a=btpBearb][data-art="Fenster"]'); await warte(400);
  await p.selectOption('dialog[open] [name=modus]', 'm2'); await p.fill('dialog[open] [name=preis_m2]', '450'); await p.fill('dialog[open] [name=mindest_m2]', '1'); await p.fill('dialog[open] [name=montage]', '120'); await dlgOk(); await warte(900);
  ok((await text()).includes('450,00 € je m², mind. 1 m²'), 'Fenster: 450 € je m², Mindestfläche 1 m², Montage 120 €');
  await p.click('[data-a=btpBearb][data-art="Rollladen"]'); await warte(400);
  await p.selectOption('dialog[open] [name=modus]', 'tabelle'); await p.fill('dialog[open] [name=tabelle]', 'H/B;1000;1250\n1000;1'); await dlgOk(); await warte(500);
  ok((await toast()).includes('erwartet'), 'Fehlerhafte Tabelle wird beim Speichern abgelehnt');
  if (await ev(() => !!document.querySelector('dialog[open]'))) await dlgOk('');
  await p.click('[data-a=btpBearb][data-art="Rollladen"]'); await warte(400);
  const csvDatei = require('path').join(require('os').tmpdir(), 'rollladen.csv'); require('fs').writeFileSync(csvDatei, CSV);
  await p.setInputFiles('dialog[open] [data-btp-csv]', csvDatei); await warte(300);
  ok(await ev(() => document.querySelector('dialog[open] [name=modus]').value === 'tabelle' && document.querySelector('dialog[open] [name=tabelle]').value.startsWith('H/B;1000')), 'CSV-Datei eingelesen, Art „Preistabelle“ gesetzt');
  await p.fill('dialog[open] [name=grund]', '150'); await p.fill('dialog[open] [name=montage]', '80'); await dlgOk(); await warte(900);
  ok((await text()).includes('Tabelle 3 × 3 Stufen, bis 1500 × 1500 mm'), 'Rollladen: Preistabelle gespeichert');
  await shot('einstellungen');

  // Aufmaß mit Richtpreis
  await geh('aufmass/neu'); await warte(400);
  const zeile = async (i, art, lage, br, ho, n) => { if (i) await p.click('[data-a=btNeu]'); await p.selectOption(`[name=bt_a_${i}]`, art); await p.fill(`[name=bt_l_${i}]`, lage); await p.fill(`[name=bt_b_${i}]`, br); await p.fill(`[name=bt_h_${i}]`, ho); await p.fill(`[name=bt_n_${i}]`, n); };
  await zeile(0, 'Fenster', 'Küche', '1230', '1480', '2'); await zeile(1, 'Fenster', 'WC', '500', '600', '1'); await zeile(2, 'Rollladen', 'Küche', '1230', '1480', '2'); await zeile(3, 'Markise', 'Terrasse', '4000', '3000', '1');
  await p.click('#am-form button.btn-signal:not([type=button])'); await warte(900);
  ok(await ev(async () => { const a = (await K.liste('aufmasse'))[0]; const pr = a.daten.bauteile.map(b => K.btPreis(b)); return pr[0].stueck === 819.18 && pr[1].stueck === 450 && pr[2].stueck === 431 && pr[3] === null; }), 'Preise: 1,82 m² × 450 = 819,18 €; Mindestfläche → 450 €; Tabelle 281 + 150 = 431 €; Markise ohne Preis');
  ok((await text()).includes('Richtpreis netto · 3.470,36 €') && (await text()).includes('1 Bauteil(e) ohne Preis'), 'Richtpreis im Aufmaß: 3.470,36 € netto inkl. Montage, Hinweis auf fehlenden Preis');
  await shot('aufmass');

  // Ins Angebot
  await p.click('[data-a=aufmassAngebot]'); await warte();
  ok(await ev(() => !!document.querySelector('dialog[open] [name=montage]')), 'Dialog bietet Montage-Positionen an');
  await dlgOk(); await warte(900);
  ok((await toast()).includes('fehlende Preise'), 'Hinweis: fehlende Preise eintragen');
  const an = await ev(async () => (await K.liste('angebote'))[0].positionen.map(x => [x.text, x.menge, x.preis]));
  const hat = (t, m, pr) => an.some(x => x[0].startsWith(t) && x[1] === m && x[2] === pr);
  ok(hat('Fenster, Küche', 2, 819.18) && hat('Fenster, WC', 1, 450) && hat('Rollladen, Küche', 2, 431) && hat('Markise, Terrasse', 1, 0), 'Angebot: Preise je Bauteil eingesetzt, Markise leer');
  ok(hat('Montage Fenster', 3, 120) && hat('Montage Rollladen', 2, 80) && !an.some(x => x[0] === 'Montage Markise'), 'Angebot: Montage je Art zusammengefasst (3 × 120 €, 2 × 80 €)');
  ok(await ev(async () => { const l = (await K.liste('angebote'))[0].positionen; return l.filter(x => /^Montage/.test(x.text)).every(x => U.istLohn(x)) && !U.istLohn(l[0]); }), 'Montage als Lohn markiert (§ 35a), Bauteile nicht');
  await shot('angebot');

  // Vor Ort unterschreiben
  const anId = await ev(async () => (await K.liste('angebote'))[0].id);
  await geh('angebote/' + anId); await p.click('[data-a=angebotVorOrt]'); await warte(600);
  ok((await toast()).includes('Kunden wählen'), 'Vor Ort: ohne Kunde verständlicher Hinweis');
  await geh('uebersicht');
  await ev(async (id) => { const k = await K.neu('kunden', { name: 'Familie Testmann', email: 'test@example.org' }); await KDB.aendern('angebote', id, { kunde_id: k.id }); }, anId);
  await geh('angebote/' + anId); await p.click('[data-a=angebotVorOrt]'); await warte(600); await dlgOk(); await warte(900);
  const vo = await ev(async (id) => ({ a: await KDB.eins('angebote', id), u: window.__geoeffnet || '' }), anId);
  ok(vo.a.status === 'gesendet' && vo.u.includes('portal.html?testmodus#angebot=' + vo.a.portal_token), 'Vor Ort: Angebot übergeben, Kundenseite geöffnet');
  const p3 = await ctx.newPage(); await p3.goto(vo.u); await p3.waitForTimeout(900);
  { const r = await p3.locator('#sig').boundingBox(); await p3.mouse.move(r.x + 20, r.y + 30); await p3.mouse.down(); for (let i = 0; i < 8; i++) await p3.mouse.move(r.x + 30 + i * 25, r.y + 40 + (i % 2) * 30); await p3.mouse.up(); }
  await p3.check('#annahme [name=agb]'); await p3.click('#annahme button[type=submit]'); await p3.waitForTimeout(900);
  ok((await p3.innerText('body')).includes('Vielen Dank'), 'Kunde unterschreibt auf dem Gerät: angenommen'); await p3.close();
  ok(await ev(async (id) => { const a = await KDB.eins('angebote', id); return a.status === 'angenommen' && !!a.unterschrift; }, anId), 'Angebot im Büro als angenommen mit Unterschrift');

  // Hilfe, Rechte, Handy
  await geh('hilfe/bauteilpreise'); ok((await text()).includes('nächste Stufe auf'), 'Hilfe erklärt die Preistabelle');
  ok(await ev(() => { const r = K.ctx.ich.rolle; K.ctx.ich.rolle = 'aussen'; const a = K.darf('bauteilpreise'); K.ctx.ich.rolle = 'monteur'; const m = K.darf('bauteilpreise'); K.ctx.ich.rolle = r; return !a && !m && K.darf('bauteilpreise'); }), 'Nur die Geschäftsführung ändert Bauteil-Preise');
  await p.setViewportSize({ width: 390, height: 844 }); await geh('bauteilpreise');
  ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy: kein seitlicher Überlauf'); await shot('handy');
  ok(!/undefined|NaN/.test(await text()), 'Keine undefined/NaN');
  ok(js.filter(m => !/erwartet|Kunden wählen/.test(m)).length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
