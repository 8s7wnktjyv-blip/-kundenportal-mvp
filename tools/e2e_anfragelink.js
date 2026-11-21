// Ende-zu-Ende-Test: Anfrage-Link je Betrieb – Website-Anfrage ohne Anmeldung, Beauftragung durch eine Hausverwaltung. node tools/e2e_anfragelink.js
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const toast = () => p.evaluate(() => (document.getElementById('toasts') || {}).innerText || '');
  const ev = (f, a) => p.evaluate(f, a);
  const konto = async (name, mail, firma, gewerk) => {
    await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
    await p.fill('input[name=name]', name); await p.fill('input[name=email]', mail); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
    await p.fill('input[name=name]', firma); await p.selectOption('select[name=gewerk]', gewerk); await p.click('form[data-auth] button[type=submit]'); await warte(2500);
  };
  const abmelden = async () => { await ev(async () => { await KDB.auth.abmelden(); }); await p.goto('about:blank'); };
  const anmelden = async (mail) => { await p.goto(BASIS + '?testmodus#anmelden'); await warte(500); await p.fill('input[name=email]', mail); await p.fill('input[name=pw]', 'geheim123'); await p.click('form[data-auth] button[type=submit]'); await warte(2000); };

  // 1) Handwerksbetrieb: Link in den Einstellungen
  await p.goto(BASIS + '?testmodus'); await p.evaluate(() => localStorage.clear());
  await konto('Hans Heizung', 'shk@test.de', 'Heizungsbau Muster', 'SHK');
  ok(await ev(() => K.tokenAusLink('https://x.de/app/portal.html?testmodus#anfrage=' + 'a'.repeat(36) + '&betreff=x') === 'a'.repeat(36) && K.tokenAusLink('quatsch') === ''), 'Token aus eingefügtem Link gelesen');
  await geh('einstellungen'); await warte(500);
  const link = await ev(() => { const i = document.querySelector('#anfrage-link input'); return i ? i.value : ''; });
  ok(/portal\.html\?testmodus#anfrage=[0-9a-f]{36}$/.test(link), 'Einstellungen: eigener Anfrage-Link');
  ok(await ev(() => document.getElementById('anfrage-link').textContent.includes('Jetzt Anfrage senden')), 'Code für den Website-Knopf angezeigt');
  await abmelden();

  // 2) Öffentliche Anfrage ohne Anmeldung (mit Vorbelegung aus der Website)
  const k = await ctx.newPage(); const kjs = []; k.on('pageerror', e => kjs.push(e.message));
  await k.goto(link + '&betreff=' + encodeURIComponent('Bad sanieren')); await k.waitForTimeout(800);
  ok((await k.innerText('body')).includes('Heizungsbau Muster') && await k.inputValue('#anfrage [name=betreff]') === 'Bad sanieren', 'Anfrageseite zeigt Betrieb, Betreff vorbelegt');
  await k.fill('#anfrage [name=name]', 'Petra Privat'); await k.check('#anfrage [name=ok]'); await k.click('#anfrage button[type=submit]'); await k.waitForTimeout(500);
  ok((await k.innerText('body')).includes('E-Mail oder Telefon'), 'Ohne E-Mail und Telefon: Hinweis, nichts gesendet');
  await k.fill('#anfrage [name=telefon]', '0911 123456'); await k.fill('#anfrage [name=ort]', 'Fürth'); await k.fill('#anfrage [name=text]', 'Wanne raus, Dusche rein'); await k.click('#anfrage button[type=submit]'); await k.waitForTimeout(800);
  ok((await k.innerText('body')).includes('Danke, Ihre Anfrage ist angekommen'), 'Anfrage gesendet, Danke-Seite');
  await k.goto(link.replace(/anfrage=[0-9a-f]+/, 'anfrage=' + 'f'.repeat(36))); await k.waitForTimeout(600);
  ok((await k.innerText('body')).includes('Link ungültig'), 'Falscher Link: „Link ungültig“');
  await k.goto(link); await k.waitForTimeout(600); await k.fill('#anfrage [name=name]', 'Bot'); await k.fill('#anfrage [name=email]', 'bot@example.org'); await k.fill('#anfrage [name=betreff]', 'Spam');
  await k.evaluate(() => { document.querySelector('#anfrage [name=website]').value = 'http://spam'; }); await k.check('#anfrage [name=ok]'); await k.click('#anfrage button[type=submit]'); await k.waitForTimeout(600);
  ok((await k.innerText('body')).includes('Danke!'), 'Spam-Falle: Bot bekommt „Danke“, Anfrage wird nicht angelegt');
  ok(kjs.length === 0, 'Anfrageseite ohne JavaScript-Fehler');

  // 3) Hausverwaltung beauftragt über den Link
  await konto('Vera Verwalterin', 'hv@test.de', 'Hausverwaltung Nord', 'Hausverwaltung');
  await ev(async () => { const o = await K.neu('objekte', { name: 'Ringstraße 10', strasse: 'Ringstraße 10', plz: '90402', ort: 'Nürnberg', einheiten: 8, eigentuemer: 'WEG Ringstraße' }); await K.neu('anlagen', { objekt_id: o.id, art: 'heizkessel', bezeichnung: 'Gaskessel Keller', einbau_jahr: 2005 }); await K.fristen60bAbgleichen(o.id);
    const o2 = await K.neu('objekte', { name: 'Mühlgasse 7', einheiten: 14 }); await K.neu('anlagen', { objekt_id: o2.id, art: 'heizkessel', einbau_jahr: 2012, einbau_monat: 5 }); await K.fristen60bAbgleichen(o2.id); });
  await geh('fristen');
  const f1 = await ev(async () => (await K.liste('fristen')).find(f => f.faellig === '2027-09-30').id);
  await p.click(`[data-a=fristAnfrage][data-id="${f1}"]`); await warte(400);
  ok((await ev(() => document.querySelector('dialog[open] [name=text]').value)).includes('Wohnungen/Einheiten: 8') && (await ev(() => document.querySelector('dialog[open] [name=text]').value)).includes('Heizkessel (Gaskessel Keller), eingebaut 2005'), 'Nachricht enthält Objektdaten und Anlage');
  await p.fill('dialog[open] [name=link]', 'https://falsch.de/portal.html#anfrage=' + 'e'.repeat(36)); await dlgOk(); await warte(600);
  ok((await toast()).includes('ungültig'), 'Ungültiger Link wird abgelehnt');
  if (await ev(() => !!document.querySelector('dialog[open]'))) await dlgOk('');
  await p.click(`[data-a=fristAnfrage][data-id="${f1}"]`); await warte(400); await p.fill('dialog[open] [name=link]', link); await p.fill('dialog[open] [name=telefon]', '0911 999'); await dlgOk(); await warte(1000);
  ok(await ev(async (id) => { const f = await KDB.eins('fristen', id); return f.status === 'beauftragt' && f.fachbetrieb === 'Heizungsbau Muster'; }, f1), 'Frist „beauftragt“ mit Fachbetrieb');
  ok(await ev(() => (K.ctx.betrieb.kalkulation.fachbetriebe || []).some(x => x.name === 'Heizungsbau Muster')), 'Fachbetrieb für später gemerkt');
  const f2 = await ev(async () => (await K.liste('fristen')).find(f => f.status === 'offen').id);
  await geh('fristen'); await p.click(`[data-a=fristAnfrage][data-id="${f2}"]`); await warte(400);
  ok(await ev(() => { const s = document.querySelector('dialog[open] [name=bekannt]'); return s && s.selectedOptions[0].text === 'Heizungsbau Muster'; }), 'Zweite Anfrage: bekannter Betrieb zur Auswahl');
  await dlgOk(); await warte(1000);
  ok(await ev(async (id) => (await KDB.eins('fristen', id)).status === 'beauftragt', f2), 'Zweite Frist über bekannten Betrieb angefragt');
  const hvTok = await ev(() => K.ctx.betrieb.anfrage_token || '');
  await abmelden();

  // 4) Betrieb sieht die Anfragen
  await anmelden('shk@test.de'); await geh('anfragen');
  const an = await ev(async () => { const a = await K.liste('anfragen'); const km = {}; (await K.liste('kunden')).forEach(x => km[x.id] = x); return a.map(x => [x.betreff, x.kanal, x.status, (km[x.kunde_id] || {}).name, (km[x.kunde_id] || {}).art]); });
  ok(an.length === 3 && an.every(x => x[1] === 'formular' && x[2] === 'neu'), 'Drei neue Anfragen mit Kanal „Formular“ (eine Website, zwei Verwaltung)');
  ok(an.some(x => x[0] === 'Bad sanieren' && x[3] === 'Petra Privat' && x[4] === 'privat') && an.filter(x => x[3] === 'Hausverwaltung Nord' && x[4] === 'hausverwaltung').length === 2, 'Kunden richtig zugeordnet, Hausverwaltung nur einmal angelegt');
  ok((await ev(async () => (await K.liste('kunden')).length)) === 2, 'Keine doppelten Kunden');
  // Hausverwaltungen haben keinen öffentlichen Anfrage-Link
  if (hvTok) { await k.goto(link.replace(/anfrage=[0-9a-f]+/, 'anfrage=' + hvTok)); await k.waitForTimeout(600); ok((await k.innerText('body')).includes('Link ungültig'), 'Link einer Hausverwaltung nimmt keine Anfragen an'); }
  // Grenze je Stunde
  await ev(async () => { const d = JSON.parse(localStorage.getItem('kundario-testdaten')); const bid = K.bid(); for (let i = 0; i < 20; i++) d.tabellen.anfragen.push({ id: 'x' + i, betrieb_id: bid, kanal: 'formular', betreff: 'Last', status: 'neu', created_at: new Date().toISOString() }); localStorage.setItem('kundario-testdaten', JSON.stringify(d)); });
  await k.goto(link); await k.waitForTimeout(600); await k.fill('#anfrage [name=name]', 'Viel'); await k.fill('#anfrage [name=email]', 'viel@example.org'); await k.fill('#anfrage [name=betreff]', 'Noch eine'); await k.check('#anfrage [name=ok]'); await k.click('#anfrage button[type=submit]'); await k.waitForTimeout(600);
  ok((await k.innerText('body')).includes('sehr viele Anfragen'), 'Mehr als 20 Anfragen je Stunde werden gebremst');
  await k.setViewportSize({ width: 390, height: 844 }); await k.goto(link); await k.waitForTimeout(600); ok(await k.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Anfrageseite am Handy ohne Überlauf');
  ok(js.filter(m => !/ungültig/.test(m)).length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(js.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
