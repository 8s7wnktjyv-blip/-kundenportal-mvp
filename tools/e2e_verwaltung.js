// Ende-zu-Ende-Test: Fristen-Service für Hausverwaltungen (Objekte, Anlagen, § 60b, eigene Fristen). node tools/e2e_verwaltung.js [bilder-ordner]
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/', BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  p.on('dialog', d => d.accept());
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const toast = () => p.evaluate(() => (document.getElementById('toasts') || {}).innerText || '');
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/hv_${n}.png`, fullPage: true }); };
  const ev = (f, a) => p.evaluate(f, a);
  const plus = (t) => { const d = new Date(); d.setDate(d.getDate() + t); return d.toISOString().slice(0, 10); };

  // Registrieren als Hausverwaltung
  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Vera Verwalterin'); await p.fill('input[name=email]', 'hv@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  ok(await ev(() => [...document.querySelectorAll('select[name=gewerk] option')].some(o => o.value === 'Hausverwaltung')), 'Registrierung: Auswahl „Hausverwaltung (Fristen-Service)“');
  await p.fill('input[name=name]', 'Hausverwaltung Test Nord'); await p.selectOption('select[name=gewerk]', 'Hausverwaltung'); await p.click('form[data-auth] button[type=submit]'); await warte(2500);
  ok(await ev(() => K.istVerwaltung()), 'Als Hausverwaltung angemeldet');
  const nav = await ev(() => [...document.querySelectorAll('.nav a[data-v]')].map(a => a.dataset.v));
  ok(nav.includes('objekte') && nav.includes('fristen') && !nav.includes('anfragen') && !nav.includes('rechnungen') && !nav.includes('aufmass'), 'Eigenes Menü: Objekte und Fristen, keine Handwerker-Bereiche');
  ok((await text()).includes('Erstes Objekt anlegen'), 'Start: Anleitung „Erstes Objekt anlegen“');
  await shot('start');
  await geh('rechnungen'); ok(await ev(() => K.aktView === 'rechnungen') && (await text()).includes('Erstes Objekt'), 'Handwerker-Seite per Adresse gesperrt, Übersicht statt Rechnungen');

  // § 60b – Rechenregeln
  const r = await ev(() => {
    const o8 = { einheiten: 8 }, o5 = { einheiten: 5 }, k = (j, m) => ({ art: 'heizkessel', einbau_jahr: j, einbau_monat: m });
    return {
      a: K.frist60b(o8, k(2005)).faellig, b: K.frist60b(o8, k(2009, 9)).faellig, c: K.frist60b(o8, k(2009, 10)).faellig, d: K.frist60b(o8, k(2012, 5)).faellig,
      e: K.frist60b(o8, k(2012)), f: K.frist60b(o5, k(2005)).betroffen, g: K.frist60b(o8, { art: 'waermepumpe', einbau_jahr: 2005 }).betroffen,
      hh: K.frist60b(o8, { art: 'heizkessel' }), i: K.frist60b(o8, k(2009)).faellig, j: K.frist60b({ einheiten: 6 }, k(2000)).faellig
    };
  });
  ok(r.a === '2027-09-30' && r.b === '2027-09-30', '§ 60b: Einbau vor 01.10.2009 → bis 30.09.2027');
  ok(r.c === '2025-10-31' && r.d === '2028-05-31', '§ 60b: Einbau ab 01.10.2009 → 15 Jahre + 1 Jahr (10/2009 → 31.10.2025, 05/2012 → 31.05.2028)');
  ok(r.e.faellig === '2028-01-31' && r.e.monatFehlt, '§ 60b: ohne Einbaumonat vorsichtig frühester Termin (Januar)');
  ok(r.i === '2025-10-31', '§ 60b: Einbau 2009 ohne Monat → vorsichtig Oktober 2009');
  ok(r.f === false && r.g === false && r.j === '2027-09-30', '§ 60b: unter 6 Einheiten und Wärmepumpe nicht betroffen, genau 6 betroffen');
  ok(r.hh.betroffen && r.hh.faellig === null, '§ 60b: ohne Einbaujahr betroffen, Frist erst nach Ergänzung');

  // Objekt und Anlagen
  await geh('objekte/neu'); await warte(400);
  await p.fill('dialog[open] [name=name]', 'Ringstraße 10'); await p.fill('dialog[open] [name=einheiten]', '8'); await p.fill('dialog[open] [name=strasse]', 'Ringstraße 10'); await p.fill('dialog[open] [name=plz]', '90402'); await p.fill('dialog[open] [name=ort]', 'Nürnberg');
  await dlgOk(); await warte(900);
  ok((await text()).includes('Ringstraße 10') && (await text()).includes('8 Wohnungen/Einheiten'), 'Objekt angelegt, Objektseite offen');
  await p.click('[data-a=anlageNeu]'); await warte(400);
  await p.fill('dialog[open] [name=bezeichnung]', 'Gaskessel Keller'); await p.fill('dialog[open] [name=einbau_jahr]', '2005'); await dlgOk(); await warte(1000);
  ok((await toast()).includes('Heizungsprüfung bis 30.09.2027'), 'Anlage gespeichert: Meldung mit Frist 30.09.2027');
  await p.click('[data-a=anlageNeu]'); await warte(400);
  await p.fill('dialog[open] [name=bezeichnung]', 'Pelletkessel Hinterhaus'); await p.fill('dialog[open] [name=einbau_jahr]', '2009'); await p.selectOption('dialog[open] [name=einbau_monat]', '10'); await dlgOk(); await warte(1000);
  let fr = await ev(async () => (await K.liste('fristen')).map(f => [f.titel, f.faellig, f.grundlage, f.status]));
  ok(fr.length === 2 && fr.some(f => f[0] === 'Heizungsprüfung § 60b – Gaskessel Keller' && f[1] === '2027-09-30') && fr.some(f => f[1] === '2025-10-31'), 'Zwei Fristen nach § 60b automatisch angelegt');
  ok((await text()).includes('überfällig'), 'Überfällige Prüfung (31.10.2025) rot markiert');
  await p.click('[data-a=anlageNeu]'); await warte(400); await p.selectOption('dialog[open] [name=art]', 'waermepumpe'); await p.fill('dialog[open] [name=einbau_jahr]', '2020'); await dlgOk(); await warte(900);
  ok((await ev(async () => (await K.liste('fristen')).length)) === 2 && (await text()).includes('nicht betroffen'), 'Wärmepumpe: keine § 60b-Frist, Hinweis „nicht betroffen“');
  await shot('objekt');
  const oid = await ev(async () => (await K.liste('objekte'))[0].id);

  // Einheiten ändern → Fristen werden angepasst
  await p.click('[data-a=objektBearb]'); await warte(400); await p.fill('dialog[open] [name=einheiten]', '4'); await dlgOk(); await warte(1000);
  ok((await ev(async () => (await K.liste('fristen')).length)) === 0, 'Unter 6 Einheiten: offene § 60b-Fristen entfernt');
  await p.click('[data-a=objektBearb]'); await warte(400); await p.fill('dialog[open] [name=einheiten]', '8'); await dlgOk(); await warte(1000);
  ok((await ev(async () => (await K.liste('fristen')).length)) === 2, 'Wieder 8 Einheiten: Fristen wieder da');
  await p.click('[data-a=objektBearb]'); await warte(400); await p.fill('dialog[open] [name=einheiten]', '0'); await dlgOk(); await warte(500);
  ok((await toast()).includes('mindestens 1'), 'Ungültige Einheiten werden abgelehnt');
  if (await ev(() => !!document.querySelector('dialog[open]'))) await dlgOk('');

  // Eigene Frist, wiederkehrend
  await geh('objekte/' + oid);
  await p.click('[data-a=fristNeu]'); await warte(400);
  await p.fill('dialog[open] [name=titel]', 'Rauchwarnmelder prüfen lassen'); await p.fill('dialog[open] [name=faellig]', plus(10)); await p.fill('dialog[open] [name=intervall_monate]', '12'); await dlgOk(); await warte(900);
  ok((await text()).includes('Rauchwarnmelder prüfen lassen') && (await text()).includes('wiederkehrend alle 12 Monate'), 'Eigene wiederkehrende Frist angelegt');

  // Übersicht
  await geh('uebersicht');
  const kpi = await ev(() => [...document.querySelectorAll('.kpi b')].map(x => x.textContent.trim()));
  ok(kpi.join('|') === '1|1|1|2', 'Übersicht: 1 Objekt, 1 überfällig, 1 in 90 Tagen, 2 Heizungsprüfungen offen (' + kpi.join('|') + ')');
  ok((await text()).includes('Jetzt kümmern') && (await text()).includes('Rauchwarnmelder'), 'Übersicht listet, worum man sich jetzt kümmern muss');
  await shot('uebersicht');

  // Beauftragt und erledigt
  await geh('fristen');
  const f2027 = await ev(async () => (await K.liste('fristen')).find(f => f.faellig === '2027-09-30').id);
  await p.click(`[data-a=fristBeauftragt][data-id="${f2027}"]`); await warte(400); await p.fill('dialog[open] [name=fachbetrieb]', 'Heizungsbau Muster GmbH'); await dlgOk(); await warte(900);
  ok(await ev(async (id) => { const f = await KDB.eins('fristen', id); return f.status === 'beauftragt' && f.fachbetrieb === 'Heizungsbau Muster GmbH'; }, f2027), 'Frist als beauftragt markiert, Fachbetrieb gespeichert');
  ok((await text()).includes('Fachbetrieb: Heizungsbau Muster GmbH'), 'Fachbetrieb in der Liste sichtbar');
  const fRw = await ev(async () => (await K.liste('fristen')).find(f => f.grundlage === 'eigen').id);
  const pdf = require('path').join(require('os').tmpdir(), 'pruefbericht.pdf'); require('fs').writeFileSync(pdf, '%PDF-1.4\n% Testbericht\n');
  await p.click(`[data-a=fristErledigt][data-id="${fRw}"]`); await warte(400); await p.setInputFiles('dialog[open] input[name=datei]', pdf); await dlgOk(); await warte(1200);
  const nach = await ev(async () => (await K.liste('fristen', { wo: { grundlage: 'eigen' } })).map(f => [f.status, f.faellig, !!f.nachweis]));
  ok(nach.length === 2 && nach.some(f => f[0] === 'erledigt' && f[2]) && nach.some(f => f[0] === 'offen' && f[1] > plus(300)), 'Erledigt mit Nachweis, nächste Frist in 12 Monaten angelegt');
  await p.click(`[data-a=fristErledigt][data-id="${f2027}"]`); await warte(400); await p.fill('dialog[open] [name=erledigt_am]', plus(5)); await dlgOk(); await warte(500);
  ok((await toast()).includes('Zukunft'), 'Erledigt-Datum in der Zukunft wird abgelehnt');
  if (await ev(() => !!document.querySelector('dialog[open]'))) await dlgOk('');
  await p.click(`[data-a=fristErledigt][data-id="${f2027}"]`); await warte(400); await dlgOk(); await warte(1000);
  // Anlage nachträglich ändern: erledigte Prüfung wird nicht neu angelegt
  await geh('objekte/' + oid);
  const aid = await ev(async () => (await K.liste('anlagen')).find(a => a.bezeichnung === 'Gaskessel Keller').id);
  await p.click(`[data-a=anlageBearb][data-id="${aid}"]`); await warte(400); await p.fill('dialog[open] [name=hersteller]', 'Musterkessel 24'); await dlgOk(); await warte(1000);
  ok(await ev(async (id) => { const l = await K.liste('fristen', { wo: { anlage_id: id } }); return l.length === 1 && l[0].status === 'erledigt'; }, aid), 'Erledigte § 60b-Prüfung bleibt erledigt, keine doppelte Frist');
  await geh('fristen/erledigt'); ok((await ev(() => document.querySelectorAll('table.fristen tbody tr').length)) === 2 && (await ev(() => !!document.querySelector('[data-a=fristNachweis]'))), 'Reiter „Erledigt“ mit Nachweis-Knopf');
  await geh('hilfe/fristen'); ok((await text()).includes('Fristen (Hausverwaltung)') && !(await text()).includes('Regieberichte'), 'Hilfe zeigt nur Themen der Hausverwaltung');

  // Einstellungen speichern ändert die Art nicht
  await geh('einstellungen'); ok(await ev(() => document.querySelector('[name=gewerk]').readOnly), 'Einstellungen: Art „Hausverwaltung“ nicht änderbar');
  await p.click('#inhalt form button.btn-signal'); await warte(900); await geh('uebersicht');
  ok(await ev(() => K.istVerwaltung() && !!document.querySelector('.nav a[data-v=objekte]')), 'Nach dem Speichern der Einstellungen weiter Hausverwaltung');

  // Handy
  await p.setViewportSize({ width: 390, height: 844 });
  for (const v of ['uebersicht', 'objekte', 'objekte/' + oid, 'fristen/alle']) { await geh(v); ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy ' + v.split('/')[0] + ': kein seitlicher Überlauf'); ok(!/undefined|NaN/.test(await text()), 'Ansicht ' + v + ' ohne undefined/NaN'); }
  ok(await ev(() => [...document.querySelectorAll('.unten a')].map(a => a.dataset.v).join() === 'uebersicht,objekte,fristen,dokumente'), 'Handy-Leiste: Heute, Objekte, Fristen, Dokumente');
  await shot('handy');

  // Handwerksbetrieb sieht den Fristen-Service nicht
  const ctx2 = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p2 = await ctx2.newPage();
  await p2.goto(BASIS + '?testmodus#registrieren'); await p2.waitForTimeout(600);
  await p2.fill('input[name=name]', 'Max Maler'); await p2.fill('input[name=email]', 'maler@test.de'); await p2.fill('input[name=pw]', 'geheim123'); await p2.check('input[name=agb]'); await p2.click('form[data-auth] button[type=submit]'); await p2.waitForTimeout(600);
  await p2.fill('input[name=name]', 'Maler Test'); await p2.selectOption('select[name=gewerk]', 'Maler und Lackierer'); await p2.click('form[data-auth] button[type=submit]'); await p2.waitForTimeout(2500);
  const nav2 = await p2.evaluate(() => [...document.querySelectorAll('.nav a[data-v]')].map(a => a.dataset.v));
  await p2.goto(BASIS + '?testmodus#/objekte'); await p2.waitForTimeout(700);
  ok(!nav2.includes('objekte') && nav2.includes('anfragen') && await p2.evaluate(() => !K.darf('fristen') && !document.querySelector('table.anlagen')), 'Handwerksbetrieb: kein Fristen-Service im Menü, Seite gesperrt');
  await ctx2.close();

  ok(js.filter(m => !/mindestens 1|Zukunft/.test(m)).length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
