// Ende-zu-Ende-Test: Kassenbuch, Umsatzsteuer, Aufmaß-Formeln, Nachkalkulation, Stundensatz, Plantafel, Pipeline. node tools/e2e_profi.js [bilder-ordner]
const { chromium } = require('playwright');
const BASIS = process.env.BASIS || 'http://localhost:8765/app/', BILD = process.argv[2] || '';
(async () => {
  const b = await chromium.launch(); const fehler = [], ok = (bed, was) => { console.log((bed ? 'OK  ' : 'FEHLER ') + was); if (!bed) fehler.push(was); };
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const js = [];
  p.on('pageerror', e => js.push(e.message)); p.on('console', m => { if (m.type() === 'error') js.push(m.text()); });
  await p.addInitScript(() => { window.print = () => {}; window.open = (u) => { window.__geoeffnet = u; }; });
  const warte = (ms = 350) => p.waitForTimeout(ms), dlgOk = async (w = 'ok') => { await p.waitForSelector(`dialog[open] footer button[value="${w}"]`); await p.click(`dialog[open] footer button[value="${w}"]`); await warte(); };
  const geh = async (h) => { await p.goto(BASIS + '?testmodus#/' + h); await warte(700); }, text = () => p.evaluate(() => document.getElementById('inhalt').innerText.replace(/\s+/g, ' '));
  const shot = async (n) => { if (BILD) await p.screenshot({ path: `${BILD}/pr_${n}.png`, fullPage: true }); };
  const lade = async (klick) => { const dl = p.waitForEvent('download'); await klick(); const f = await dl; return require('fs').readFileSync(await f.path()); };
  const ev = (f, a) => p.evaluate(f, a);

  await p.goto(BASIS + '?testmodus#registrieren'); await p.evaluate(() => localStorage.clear()); await p.goto(BASIS + '?testmodus#registrieren'); await warte(600);
  await p.fill('input[name=name]', 'Anna Chef'); await p.fill('input[name=email]', 'chef@test.de'); await p.fill('input[name=pw]', 'geheim123'); await p.check('input[name=agb]'); await p.click('form[data-auth] button[type=submit]'); await warte(600);
  await p.fill('input[name=name]', 'Maler Test'); await p.selectOption('select[name=gewerk]', { index: 1 }); await p.click('form[data-auth] button[type=submit]'); await warte(3500);
  const heute = await ev(() => U.isoTag()), monat = heute.slice(0, 7);

  // Rechenkern
  ok(await ev(() => K.formel('2*3,5-1,2*1,4') === 5.32 && K.formel('(4+2)*2,5') === 15 && K.formel('1.250,5') === 1250.5 && K.formel('3 x 2') === 6 && K.formel('-2+5') === 3), 'Formel: Punkt vor Strich, Klammern, Komma, x als Mal');
  ok(await ev(() => { try { K.formel('2*(3'); return false; } catch (e) { return true; } }) && await ev(() => { try { K.formel('alert(1)'); return false; } catch (e) { return true; } }), 'Formel: Fehler und fremder Code werden abgelehnt');
  ok(await ev(() => K.spracheZuFormel('2 Komma 5 mal 3 minus 1') === '2,5*3-1' && K.spracheZuFormel('vier mal drei Komma zwei') === '4*3,2'), 'Sprache: gesprochene Maße werden zur Formel');
  const ss = await ev(() => K.stundensatzRechnen(Object.assign({}, K.KALK_STANDARD, { gk: { Miete: 12000 } })));
  ok(ss.tage === 210 && ss.prodAlle === 2856 && Math.abs(ss.kosten - 57.13) < 0.01 && ss.empfehlung === 63, 'Stundensatz: 210 Tage, 2.856 Std., Kosten 57,13 €, Vorschlag 63,00 €');
  const ust = await ev(() => {
    const re = [{ id: 'a', status: 'bezahlt', art: 'rechnung', mwst: 19, netto: 1000, brutto: 1190, datum: '2026-09-28', steuerfall: 'normal' }, { id: 'b', status: 'gestellt', art: 'rechnung', mwst: 7, netto: 100, brutto: 107, datum: '2026-10-05' }, { id: 'c', status: 'gestellt', art: 'rechnung', mwst: 0, netto: 500, brutto: 500, datum: '2026-10-07', steuerfall: '13b' }, { id: 'd', status: 'bezahlt', art: 'abschlag', mwst: 19, netto: 200, brutto: 238, datum: '2026-09-01' }];
    const za = [{ rechnung_id: 'a', betrag: 1190, datum: '2026-10-02', art: 'ueberweisung' }, { rechnung_id: 'd', betrag: 238, datum: '2026-10-03', art: 'ueberweisung' }, { rechnung_id: 'b', betrag: 2, datum: '2026-10-09', art: 'skonto' }];
    const be = [{ datum: '2026-10-10', ust: 19, netto: 100, status: 'offen' }, { datum: '2026-10-11', ust: 0, netto: 400, steuer13b: true, status: 'bezahlt', bezahlt_am: '2026-10-12', kategorie: 'Fremdleistung' }];
    const ka = [{ datum: '2026-10-15', art: 'ausgabe', betrag: 11.9, ust_satz: 19, nr: 1 }, { datum: '2026-10-16', art: 'einnahme', betrag: 107, ust_satz: 7, nr: 2 }];
    const zr = K.zeitraum('2026-10'), q = { rechnungen: re, zahlungen: za, belege: be, kasse: ka };
    return { ist: K.ustVa(q, zr, 'ist'), soll: K.ustVa(q, zr, 'soll'), euer: K.euer(q, zr), q4: K.zeitraum('2026-Q4') };
  });
  ok(ust.ist.kz[81] === 1200 && ust.ist.kz[86] === 100 && ust.ist.kz[60] === 0 && ust.ist.kz[84] === 400 && ust.ist.kz[85] === 76 && ust.ist.kz[67] === 76 && ust.ist.kz[66] === 20.9, 'UStVA Ist: Zahlungen 1.000 + Abschlag 200 (Kz 81), Bareinnahme 100 (Kz 86), § 13b-Eingang 400 (Kz 84/85/67), Vorsteuer 19 + 1,90');
  ok(ust.ist.zahllast === Math.round((228 + 7 + 76 - 20.9 - 76) * 100) / 100, 'UStVA Ist: Zahllast 214,10 €');
  ok(ust.soll.kz[81] === 200 && Math.abs(ust.soll.kz[86] - (100 - 2 / 1.07 + 100)) < 0.01 && ust.soll.kz[60] === 500, 'UStVA Soll: Rechnung vom September zählt nicht, Abschlag mit Zahlung, Skonto mindert, § 13b-Ausgang Kz 60');
  ok(ust.euer.ein.netto === 1300 && ust.euer.aus.Fremdleistung === 400 && ust.euer.aus.Sonstiges === 10 && ust.euer.ueberschuss === 890, 'Überschuss: Einnahmen 1.300, Ausgaben 410, Überschuss 890');
  ok(ust.q4.von === '2026-10-01' && ust.q4.bis === '2026-12-31', 'Zeitraum Quartal');

  // Kassenbuch
  await geh('kasse'); ok((await text()).includes('Privateinlage'), 'Kasse: leer mit Hinweis auf Anfangsbestand');
  const buche = async (art, betrag, txt, satz) => { await p.click('[data-a=kasseBuchen]'); await warte(); await p.selectOption('dialog[open] [name=art]', art); await p.fill('dialog[open] [name=betrag]', betrag); await p.fill('dialog[open] [name=text]', txt); if (satz) await p.selectOption('dialog[open] [name=ust_satz]', satz); await dlgOk(); await warte(500); };
  await buche('einlage', '300', 'Anfangsbestand'); await buche('ausgabe', '59,50', 'Farbe Baumarkt', '19');
  await buche('ausgabe', '1000', 'Zu viel'); ok(await ev(() => !!document.querySelector('.toast.fehler') && /negativ/.test(document.querySelector('.toast.fehler').innerText)), 'Kasse: Bestand kann nicht negativ werden');
  ok(await ev(async () => { const l = await K.liste('kasse', { sortiere: 'nr.asc' }); return l.length === 2 && l[0].nr === 1 && l[1].nr === 2 && l[1].ust_satz === 19; }), 'Kasse: fortlaufende Nummern 1 und 2');
  ok(await ev(async () => { try { await KDB.aendern('kasse', (await K.liste('kasse'))[0].id, { betrag: 1 }); return false; } catch (e) { return /storn/i.test(e.message); } }), 'Kasse: Buchung kann nicht geändert werden');
  await geh('kasse'); ok((await text()).includes('240,50'), 'Kasse: Bestand 240,50 €');
  await p.click('tr:has-text("Farbe Baumarkt") [data-a=kasseStorno]'); await warte(); await p.fill('dialog[open] [name=grund]', 'Doppelt erfasst'); await dlgOk('ok'); await warte(500);
  ok((await text()).includes('300,00') && await ev(async () => (await K.liste('kasse')).some(x => x.nr === 3 && x.storno_von)), 'Kasse: Storno als Buchung Nr. 3, Bestand wieder 300,00 €');
  ok(await p.locator('tr:has-text("Farbe Baumarkt") [data-a=kasseStorno]').count() === 0, 'Kasse: stornierte Buchung nicht nochmal stornierbar');
  const csv = (await lade(() => p.click('[data-a=kasseCsv]'))).toString('utf8'); ok(/Nr\.";"Datum/.test(csv) && /Storno Nr\. 2/.test(csv), 'Kasse: CSV mit Storno');
  await shot('kasse');

  // Barzahlung einer Rechnung landet in der Kasse
  const reId = await ev(async () => (await K.neu('rechnungen', { nr: 'RE-2026-0001', status: 'gestellt', mwst: 19, netto: 100, brutto: 119, datum: U.isoTag(), positionen: [{ id: 'p', typ: 'pos', text: 'Streichen', menge: 1, einheit: 'pausch.', preis: 100 }] })).id);
  await geh('rechnungen/' + reId); await p.click('[data-a=zahlung]'); await warte(); await p.selectOption('dialog[open] [name=art]', 'bar'); await dlgOk(); await warte(600);
  ok(await ev(async (id) => (await K.liste('kasse')).some(x => x.rechnung_id === id && x.betrag === 119 && x.art === 'einnahme'), reId), 'Barzahlung: automatisch ins Kassenbuch');

  // Umsatzsteuer-Ansicht
  await ev(() => K.neu('belege', { lieferant: 'Sub GmbH', datum: U.isoTag(), netto: 500, ust: 0, brutto: 500, steuer13b: true, kategorie: 'Fremdleistung' }));
  await ev((m) => sessionStorage.setItem('ust-zr', m), monat); await geh('steuer'); const st = await text();
  ok(/81 Umsätze zu 19 % 100 €/.test(st) && /84 \/ 85/.test(st) && /Kz\. 66|66 Vorsteuer/.test(st), 'Umsatzsteuer: Kz 81 aus Barzahlung, Kz 84/85 aus § 13b-Beleg');
  ok(/Verbleibende Vorauszahlung|Überschuss/.test(st) && /Einnahmen und Ausgaben/.test(st), 'Umsatzsteuer: Zahllast und Überschuss-Übersicht');
  await p.click('[data-a=versteuerung]'); await warte(); await p.selectOption('dialog[open] [name=v]', 'soll'); await dlgOk(); await warte(600);
  ok((await text()).includes('Soll-Versteuerung') || (await text()).includes('vereinbarten Entgelten'), 'Umsatzsteuer: Umstellung auf Soll-Versteuerung');
  await shot('steuer');

  // Aufmaß mit Formeln
  await geh('aufmass/neu'); await warte(400);
  ok(await ev(() => !!document.querySelector('table.fz')), 'Aufmaß: Bereich für Formeln da');
  await p.fill('[name=fz_p_0]', 'Wandfläche streichen'); await p.fill('[name=fz_t_0]', 'Küche'); await p.fill('[name=fz_f_0]', '2*(3,5+4)*2,5'); await warte(100);
  ok((await p.textContent('tr[data-fz="0"] [data-fz-erg]')).trim() === '37,5', 'Aufmaß: Ergebnis sofort beim Tippen (37,5)');
  await p.click('[data-a=fzNeu]'); await p.fill('[name=fz_t_1]', 'abzgl. Fenster'); await p.fill('[name=fz_f_1]', '-1,2*1,4'); await p.click('[data-a=fzNeu]'); await p.fill('[name=fz_p_2]', 'Sockelleiste'); await p.fill('[name=fz_f_2]', '2*(3,5+4)-0,9'); await p.fill('[name=fz_e_2]', 'm');
  await p.click('#am-form button.btn-signal:not([data-a])'); await warte(600);
  const am = await ev(async () => (await K.liste('aufmasse'))[0]);
  ok(am.daten.zeilen.length === 3 && am.daten.zeilen[1].pos === 'Wandfläche streichen' && am.daten.raeume.length === 1, 'Aufmaß: Formelzeilen und Räume gespeichert, Position übernommen');
  ok((await text()).includes('Wandfläche streichen · 35,82 m²') && (await text()).includes('Sockelleiste · 14,1 m'), 'Aufmaß: gleiche Positionen zusammengezählt (37,5 − 1,68 = 35,82 m²)');
  await p.click('[data-a=aufmassAngebot]'); await warte(); await dlgOk(); await warte(900);
  ok(await ev(async () => { const a = (await K.liste('angebote'))[0]; return a && a.positionen.some(x => x.text === 'Wandfläche streichen' && x.menge === 35.82 && x.einheit === 'm²') && a.positionen.some(x => x.text === 'Sockelleiste' && x.menge === 14.1); }), 'Aufmaß: Formel-Positionen ins Angebot übernommen');
  await shot('aufmass');

  // Nachkalkulation je Position
  const nk = await ev(async () => {
    const an = await K.neu('angebote', { nr: 'AN-9', titel: 'Wohnung streichen', status: 'angenommen', positionen: [{ id: 'p1', typ: 'pos', text: 'Malerarbeiten', menge: 10, einheit: 'Std.', preis: 60 }, { id: 'p2', typ: 'pos', text: 'Steckdosen tauschen', menge: 4, einheit: 'Stk.', preis: 40, minuten: 30 }, { id: 'p3', typ: 'pos', text: 'Material', menge: 1, einheit: 'pausch.', preis: 200 }] });
    const au = await K.neu('auftraege', { nr: 'AU-9', titel: 'Wohnung streichen', angebot_id: an.id, wert_netto: 960, status: 'in_arbeit', kalk: { satz: 50 } });
    const gestern = new Date(Date.now() - 864e5);
    await K.neu('berichte', { nr: 'RB-1', auftrag_id: au.id, datum: U.isoTag(), stunden: 12, taetigkeit: 'Streichen', mitarbeiter: K.ctx.user.id, position_id: 'p1' });
    await K.neu('zeiten', { user_id: K.ctx.user.id, auftrag_id: au.id, position_id: 'p2', beginn: new Date(gestern.setHours(7, 0, 0, 0)).toISOString(), ende: new Date(gestern.setHours(9, 30, 0, 0)).toISOString(), pause_min: 0 });
    await K.neu('zeiten', { user_id: K.ctx.user.id, auftrag_id: au.id, beginn: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(), ende: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(), pause_min: 0 });
    return au.id;
  });
  await geh('auftraege/' + nk + '/rentabilitaet'); await warte(600); const nkT = await text();
  ok(/Nachkalkulation je Position/.test(nkT) && /Malerarbeiten AN-9 10 Std\. 12 Std\. \+2 Std\. 100,00/.test(nkT), 'Nachkalkulation: Malerarbeiten 10 geplant, 12 tatsächlich, +2 Std. = 100 € Mehrkosten');
  ok(/Steckdosen tauschen AN-9 2 Std\. 2,5 Std\./.test(nkT), 'Nachkalkulation: Minuten aus dem Katalog (4 × 30 Min. = 2 Std.), Zeiterfassung 2,5 Std. zugeordnet');
  ok(/14,5 Std\. aus Regieberichten und Zeiterfassung/.test(nkT), 'Rentabilität: Zeiterfassung ohne Bericht am selben Tag wird mitgezählt (12 + 2,5), doppelte Tage nicht');
  await geh('berichte/neu/' + nk); await warte(500);
  ok(await ev(() => { const s = document.querySelector('#ber-form [name=position_id]'); return s && s.options.length === 4; }), 'Regiebericht: Position aus dem Angebot wählbar');
  await p.selectOption('#ber-form [name=position_id]', 'p2'); await p.fill('#ber-form [name=stunden]', '1'); await p.fill('#ber-form [name=taetigkeit]', 'Dosen'); await p.click('#ber-form button[type=submit]'); await warte(700);
  ok(await ev(async () => (await K.liste('berichte')).some(b => b.taetigkeit === 'Dosen' && b.position_id === 'p2')), 'Regiebericht: Position gespeichert');
  await shot('nachkalkulation');

  // Stundensatz
  await geh('stundensatz'); await p.fill('#ss-form [data-gk="Miete, Werkstatt, Lager"]', '12000'); await warte(200);
  ok(/57,13/.test(await p.textContent('[data-ss-erg]')) && /62,84/.test(await p.textContent('[data-ss-erg]')), 'Stundensatz: live 57,13 € Kosten, 62,84 € Satz');
  await p.click('[data-a=ssUebernehmen]'); await warte(); await dlgOk('ok'); await warte(600);
  ok(await ev(() => K.ctx.betrieb.stundensatz === 63 && Math.abs(K.ctx.betrieb.kalkulation.kosten_std - 57.13) < 0.01 && K.kostenStd() > 57), 'Stundensatz: 63 € übernommen, interne Kosten gespeichert');
  await shot('stundensatz');

  // Plantafel
  const pt = await ev(async () => {
    const au = await K.neu('auftraege', { nr: 'AU-10', titel: 'Fassade', status: 'geplant', wert_netto: 5000 });
    const t = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
    await K.neu('termine', { titel: 'Besichtigung A', art: 'besichtigung', beginn: t(9, 0), ende: t(10, 0), mitarbeiter: [K.ctx.user.id] });
    await K.neu('termine', { titel: 'Besichtigung B', art: 'besichtigung', beginn: t(9, 30), ende: t(11, 0), mitarbeiter: [K.ctx.user.id] });
    return au.id;
  });
  if (new Date().getDay() === 0) await ev(() => sessionStorage.setItem('pt-woche', '1')); else await ev(() => sessionStorage.removeItem('pt-woche'));
  await geh('plantafel');
  ok(new Date().getDay() === 0 || await ev(() => document.querySelectorAll('.pt-t.pt-konf').length === 2), 'Plantafel: Überschneidung wird markiert');
  ok((await text()).includes('Noch nicht eingeplant') && (await text()).includes('Fassade'), 'Plantafel: Aufträge ohne Termin werden angezeigt');
  await p.click('[data-a=ptModus]'); await warte(500); await p.click('.pt-auftraege li[data-au]'); await warte(500);
  const zielTag = await ev(() => document.querySelectorAll('td[data-drop]')[1].dataset.tag);
  await p.click('td[data-drop] >> nth=1'); await warte(800);
  ok(await ev(async (id) => (await K.liste('termine')).some(t => t.auftrag_id === id && (t.mitarbeiter || []).length === 1), pt), 'Plantafel: Auftrag per Tippen eingeplant (Handy-tauglich)');
  ok(await ev(async (tag) => (await K.liste('termine')).some(t => t.titel === 'Fassade' && U.isoTag(t.beginn) === tag), zielTag), 'Plantafel: am gewählten Tag');
  await p.click('[data-a=ptModus]'); await warte(400);
  await p.click('[data-a=ptAbwesend]'); await warte(); await p.selectOption('dialog[open] [name=art]', 'Urlaub'); await p.fill('dialog[open] [name=von]', zielTag); await p.fill('dialog[open] [name=bis]', zielTag); await dlgOk(); await warte(700);
  ok(await ev(() => !!document.querySelector('td.abwesend') && !!document.querySelector('td.abwesend.konflikt')), 'Plantafel: Urlaub eingetragen und Konflikt mit dem Einsatz markiert');
  await shot('plantafel');

  // Anfragen-Pipeline
  await ev(async () => { for (const [b, s, w] of [['Bad streichen', 'neu', 1200], ['Treppenhaus', 'besichtigung', 4000], ['Altbau komplett', 'angebot', 15000], ['Zaun lasieren', 'gewonnen', 800], ['Garage', 'verloren', 600]]) await K.neu('anfragen', { betreff: b, status: s, wert_geschaetzt: w, kanal: 'telefon' }); });
  await geh('anfragen'); await p.click('[data-a=anfAnsicht][data-v=board]'); await warte(700);
  const pl = await text();
  ok(/Offen in der Pipeline 20\.200,00/.test(pl) && /Abschlussquote \(12 Monate\) 50 %/.test(pl), 'Pipeline: offener Wert 20.200 €, Abschlussquote 50 %');
  ok(await ev(() => document.querySelectorAll('.pl-spalte').length === 4 && document.querySelector('.pl-spalte[data-pl=angebot]').innerText.includes('Altbau komplett')), 'Pipeline: vier Spalten, Karten richtig einsortiert');
  await p.selectOption('article:has-text("Bad streichen") select', 'verloren'); await warte(); await p.selectOption('dialog[open] [name=grund]', 'Preis zu hoch'); await dlgOk(); await warte(600);
  ok(await ev(async () => (await K.liste('anfragen')).some(a => a.betreff === 'Bad streichen' && a.status === 'verloren' && a.verlustgrund === 'Preis zu hoch')), 'Pipeline: verloren mit Grund');
  await p.click('article:has-text("Treppenhaus") [data-a=plWv]'); await warte(); await p.fill('dialog[open] [name=am]', heute); await p.fill('dialog[open] [name=notiz]', 'Kunde anrufen'); await dlgOk(); await warte(600);
  ok((await text()).includes('Heute nachfassen 1'), 'Pipeline: Wiedervorlage heute zählt');
  await shot('pipeline');
  await geh('uebersicht'); await warte(500); ok(await ev(() => !!document.getElementById('wv-karte') && document.getElementById('wv-karte').innerText.includes('Treppenhaus')), 'Übersicht: fällige Wiedervorlage oben');
  await ev(() => sessionStorage.setItem('anf-ansicht', 'liste')); await geh('anfragen'); ok(await ev(() => !!document.querySelector('.ansicht-wahl') && !!document.querySelector('.tabs')), 'Anfragen: Listenansicht bleibt erhalten');

  // Handy
  await p.setViewportSize({ width: 390, height: 844 });
  for (const v of ['kasse', 'steuer', 'stundensatz', 'plantafel', 'anfragen', 'aufmass/' + am.id, 'auftraege/' + nk + '/rentabilitaet']) {
    if (v === 'anfragen') await ev(() => sessionStorage.setItem('anf-ansicht', 'board'));
    await geh(v); ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Handy ' + v.split('/')[0] + ': kein seitlicher Überlauf');
    if (v === 'anfragen') await shot('handy_pipeline'); if (v.startsWith('aufmass')) await shot('handy_aufmass'); if (v === 'steuer') await shot('handy_steuer');
  }
  for (const v of ['kasse', 'steuer', 'stundensatz', 'hilfe/kasse', 'hilfe/umsatzsteuer', 'hilfe/stundensatz', 'hilfe/pipeline']) { await geh(v); ok(!/undefined|NaN/.test(await text()), 'Ansicht ' + v + ' ohne Fehler'); }
  const echt = js.filter(m => !/Kassenbestand darf nicht negativ/.test(m)); ok(echt.length === 0, 'Keine JavaScript-Fehler ' + JSON.stringify(echt.slice(0, 5)));
  await b.close(); console.log(fehler.length ? `\n${fehler.length} FEHLER` : '\nALLE PRÜFUNGEN BESTANDEN'); process.exit(fehler.length ? 1 : 0);
})();
