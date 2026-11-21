// Ende-zu-Ende-Test: Fristen-Service – Objekte aus Excel/CSV importieren, Fristenliste drucken. node tools/e2e_verwaltung_import.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const js = [];
  await p.addInitScript(() => { window.print = () => { window.__gedruckt = (window.__gedruckt || 0) + 1; }; });
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const ev = (f, a) => p.evaluate(f, a);

  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Ina Import'); await p.fill('input[name=email]', 'import@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Verwaltung Import Test'); await p.selectOption('select[name=gewerk]', 'Hausverwaltung'); await p.click('form[data-auth] button[type=submit]'); await warte(2500);

  // Rechenkern
  ok(await ev(() => K.heizungsArt('Gas-Brennwertkessel') === 'heizkessel' && K.heizungsArt('Öl') === 'heizkessel' && K.heizungsArt('Luft-Wärmepumpe') === 'waermepumpe' && K.heizungsArt('Fernwärme') === 'fernwaerme' && K.heizungsArt('') === null && K.heizungsArt('Nachtspeicher') === 'sonstige'), 'Heizungsart aus freiem Text erkannt');
  ok(await ev(() => { const l = K.objekteCsvLesen('Liegenschaft\tWohnungen\tHeizungsart\tBaujahr Heizung\nA-Str. 1\t12\tÖl\t1999'); return l.length === 1 && l[0].name === 'A-Str. 1' && l[0].einheiten === 12 && l[0].art === 'heizkessel' && l[0].einbau_jahr === 1999; }), 'Andere Spaltennamen und Tabulator werden erkannt');
  ok(await ev(() => { try { K.objekteCsvLesen('Straße;Ort\nx;y'); return false; } catch (e) { return /Objekt/.test(e.message); } }), 'Fehlende Spalte „Objekt“ verständlich gemeldet');
  ok(await ev(() => { const l = K.objekteCsvLesen('Objekt;Einheiten;Einbaujahr;Einbaumonat\n;8;2005;\nB;0;2005;\nC;8;1800;13'); return l[0].fehler.includes('Objektname fehlt') && l[1].fehler.includes('Einheiten fehlen') && l[2].fehler.length === 2; }), 'Fehler je Zeile erkannt');

  // Import über die Oberfläche (Excel-CSV in Windows-1252 mit Umlauten)
  const csv = 'Objekt;Straße;PLZ;Ort;Einheiten;Eigentümer;Heizung;Einbaujahr;Einbaumonat\nRingstraße 10;Ringstraße 10;90402;Nürnberg;8;WEG Ringstraße;Gas-Brennwertkessel;2005;\nGartenweg 3;Gartenweg 3;90763;Fürth;6;;Wärmepumpe;2021;\nHauptstraße 1;;;;;;Öl;1998;\nMühlgasse 7;Mühlgasse 7;91052;Erlangen;14;WEG Mühlgasse;Pellets;2012;5\n';
  const datei = path.join(os.tmpdir(), 'objekte.csv'); fs.writeFileSync(datei, Buffer.from(csv, 'latin1'));
  await geh('objekte'); ok(await ev(() => !!document.querySelector('[data-a=objekteImport]')), 'Knopf „Aus Excel/CSV importieren“');
  await p.click('[data-a=objekteImport]'); await warte(400); await p.setInputFiles('dialog[open] input[name=datei]', datei); await dlgOk(); await warte(600);
  const vor = await ev(() => document.querySelector('dialog[open]').innerText.replace(/\s+/g, ' '));
  ok(vor.includes('3 von 4 Objekten') && vor.includes('Einheiten fehlen') && vor.includes('Ringstraße 10'), 'Vorschau: 3 von 4 Objekten, fehlerhafte Zeile markiert, Umlaute korrekt');
  await dlgOk(); await warte(1500);
  const r = await ev(async () => ({ o: (await K.liste('objekte')).map(o => o.name).sort(), f: (await K.liste('fristen')).map(f => f.faellig).sort() }));
  ok(r.o.join('|') === 'Gartenweg 3|Mühlgasse 7|Ringstraße 10', 'Drei Objekte angelegt');
  ok(r.f.join('|') === '2027-09-30|2028-05-31', 'Fristen nach § 60b berechnet (Kessel 2005 → 30.09.2027, Pellets 05/2012 → 31.05.2028, Wärmepumpe keine)');
  // Zweiter Import: gleiche Namen werden übersprungen
  await geh('objekte'); await p.click('[data-a=objekteImport]'); await warte(400); await p.setInputFiles('dialog[open] input[name=datei]', datei); await dlgOk(); await warte(600);
  ok((await ev(() => document.querySelector('dialog[open]').innerText)).includes('gibt es schon') && (await ev(() => document.querySelector('dialog[open]').innerText)).includes('0 von 4'), 'Zweiter Import: vorhandene Objekte werden übersprungen');
  await dlgOk(''); ok((await ev(async () => (await K.liste('objekte')).length)) === 3, 'Keine doppelten Objekte');

  // Fristenliste drucken
  await geh('fristen'); ok(await ev(() => !!document.querySelector('[data-a=fristenDruck]')), 'Knopf „Fristenliste drucken“');
  await p.click('[data-a=fristenDruck]'); await warte(800);
  const dr = await ev(() => ({ t: document.getElementById('druck').innerText.replace(/\s+/g, ' '), n: window.__gedruckt || 0 }));
  ok(dr.n === 1 && dr.t.includes('Fristenliste') && dr.t.includes('Ringstraße 10') && dr.t.includes('Mühlgasse 7') && !dr.t.includes('Gartenweg 3') && dr.t.includes('WEG Mühlgasse'), 'Fristenliste: nur Objekte mit offenen Fristen, mit Eigentümer');
  await geh('hilfe/objekte'); ok((await text()).includes('CSV'), 'Hilfe erklärt den Import');
  await p.setViewportSize({ width: 390, height: 844 }); await geh('fristen'); ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy: kein seitlicher Überlauf');
  ok(js.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
