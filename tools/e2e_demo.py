"""End-to-End-Tests der Demo (Testplan 1–6). Aufruf: python3 e2e.py [basis-url]"""
import sys, re
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
S = '/tmp/'
erg = []
def ok(name, bed, info=''):
    erg.append(('OK ' if bed else 'FEHLER ') + name + (' – ' + info if info else ''))
def geld(txt):
    m = re.findall(r'(-?[\d.]+,\d{2})\s*€', txt)
    return [float(x.replace('.', '').replace(',', '.')) for x in m]

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1400, 'height': 1000})
    pg = ctx.new_page(); fehler = []
    pg.on('pageerror', lambda e: fehler.append(str(e)))
    dialoge = []
    pg.on('dialog', lambda d: (dialoge.append(d.message), d.accept(d.default_value if d.type == 'prompt' else None)))
    pg.goto(BASE + 'demo.html'); pg.evaluate('localStorage.clear(); localStorage.setItem("auftragscockpit-gewerke", JSON.stringify({haupt: "shk", gesehen: 1}))'); pg.reload(); pg.wait_for_timeout(500)
    pg.click('[data-menue=alle]'); pg.wait_for_timeout(200)   # alle Bereiche im Menü

    # ---------- Test 1: Anfrage bis Auftrag ----------
    pg.click('.side-nav [data-view=anfragen]'); pg.wait_for_timeout(300)
    pg.click('[data-anfrage-neu]'); pg.wait_for_timeout(200)
    pg.click('.cr-form button[type=submit]'); pg.wait_for_timeout(150)
    ok('T6 Pflichtfelder leer → Fehlermeldung', pg.is_visible('[data-fehler]') and 'Namen' in pg.inner_text('[data-fehler]'))
    pg.fill('[name=name]', 'Kim Testmann'); pg.fill('[name=ort]', 'Erlangen'); pg.fill('[name=betreff]', 'Badsanierung Testbad'); pg.fill('[name=wert]', 'abc')
    pg.click('.cr-form button[type=submit]'); pg.wait_for_timeout(150)
    ok('T6 ungültiger Betrag → Fehlermeldung', 'Zahl' in pg.inner_text('[data-fehler]'))
    pg.fill('[name=wert]', '10000'); pg.fill('[name=mail]', 'kim@beispiel.de')
    pg.click('.cr-form button[type=submit]'); pg.wait_for_timeout(400)
    ok('T1.1 Anfrage angelegt und geöffnet', pg.locator('.drawer h2:has-text("Kim Testmann")').count() == 1)
    # Dublette
    pg.evaluate("document.querySelectorAll('.drawer,.drawer-backdrop').forEach(e=>e.remove())")
    pg.click('[data-anfrage-neu]'); pg.fill('[name=name]', 'Kim Testmann'); pg.fill('[name=ort]', 'Fürth'); pg.fill('[name=betreff]', 'Nochmal')
    pg.click('.cr-form button[type=submit]'); pg.wait_for_timeout(200)
    ok('T6 Dublette erkannt', pg.is_visible('[data-dub]') and 'gleicher Name' in pg.inner_text('[data-dub]'))
    pg.click('.drawer [data-close] >> nth=0'); pg.wait_for_timeout(150)
    # Angebot erstellen
    pg.click('.lead:has-text("Kim Testmann")'); pg.wait_for_timeout(1300)
    pg.click('[data-do=angebot-erstellen]'); pg.wait_for_timeout(500)
    ok('T1.3 Angebotseditor offen', 'Angebot AN-' in pg.inner_text('h1'))
    sum0 = geld(pg.inner_text('.an-summe'))
    ok('T1.3 Startsumme netto 10.000 €', abs(sum0[0] - 10000) < 0.01, str(sum0[:3]))
    # Position bearbeiten: Menge der ersten Position auf 2 → Summe ändert sich
    pg.fill('[data-pos="0"][data-f="ep"]', '1500'); pg.wait_for_timeout(200)
    pg.fill('[data-pos="0"][data-f="rabatt"]', '10'); pg.wait_for_timeout(200)
    pg.click('[data-pos-neu]'); pg.wait_for_timeout(200)
    n = pg.locator('.an-tab tbody tr').count()
    pg.fill(f'[data-pos="{n-1}"][data-f="ep"]', '200'); pg.fill(f'[data-pos="{n-1}"][data-f="menge"]', '2'); pg.wait_for_timeout(200)
    s = geld(pg.inner_text('.an-summe'))
    # Erwartung: Pos0 = 1*1500*0,9 = 1350 statt 1200 → netto = 10000 - 1200 + 1350 + 400 = 10550
    ok('T1.4 Summen nach Bearbeitung korrekt', abs(s[0] - 10550) < 0.01 and abs(s[-1] - round(10550 * 1.19, 2)) < 0.01, str(s))
    pg.fill('[data-pos="1"][data-f="menge"]', '-3'); pg.wait_for_timeout(200)
    ok('T6 ungültige Menge markiert, Senden gesperrt', pg.locator('.fehler-box').count() >= 1 and pg.is_disabled('[data-an-senden]'))
    pg.fill('[data-pos="1"][data-f="menge"]', '1'); pg.wait_for_timeout(200)
    pg.click('[data-an-senden]'); pg.wait_for_timeout(1500)
    pg.click('.mv [data-mv=senden]'); pg.wait_for_timeout(1600)
    ok('T1 Angebot gesendet (Demo)', 'gesendet' in pg.inner_text('.an-summe ~ *, main') )
    pg.click('[data-an-annehmen]'); pg.wait_for_timeout(300)
    pg.click('[data-an-annehmen]') if pg.locator('[data-an-annehmen]').count() else None   # zweiter Klick darf nichts doppeln
    auftr = pg.evaluate("JSON.parse(localStorage.getItem('auftragscockpit-demo-v1')||'{}')")
    pg.wait_for_timeout(500)
    st = pg.evaluate("(function(){var d=JSON.parse(localStorage.getItem('auftragscockpit-demo-v1'));return d.state.auftraege.filter(function(a){return a.kunde==='Kim Testmann'}).length})()")
    ok('T1.6 genau ein Auftrag entstanden', st == 1, str(st))
    pg.click('.side-nav [data-view=uebersicht]'); pg.wait_for_timeout(1200)
    if not pg.locator('#kpis').count(): pg.click('[data-mehr-zahlen]'); pg.wait_for_timeout(300)
    ok('T1.7 Übersicht zeigt Aufträge inkl. neuem', 'Aufträge' in pg.inner_text('#kpis'))
    pg.click('.side-nav [data-view=kunden]'); pg.wait_for_timeout(300); pg.fill('#ksuche', 'Kim'); pg.wait_for_timeout(300)
    pg.click('[data-akte-open="Kim Testmann"] >> nth=0'); pg.wait_for_timeout(500); pg.click('[data-ka-tab=alles]'); pg.wait_for_timeout(300)
    akt = pg.inner_text('#kundenakte')
    ok('T1.7 Kundenhistorie zeigt Angebot und Auftrag', 'Angebot AN-' in akt and 'Auftrag AU-' in akt)

    # ---------- Test 2: Auftrag bis Rechnung ----------
    pg.click('.side-nav [data-view=auftraege]'); pg.wait_for_timeout(300)
    pg.click('.row:has-text("Kim Testmann") [data-au-open]'); pg.wait_for_timeout(400)
    ok('T2.1 Auftrag geöffnet', 'Auftrag AU-' in pg.inner_text('h1'))
    pg.fill('[data-au-termin] [name=datum]', '2026-10-21'); pg.click('[data-au-termin] button'); pg.wait_for_timeout(300)
    ok('T2.2 Termin eingetragen', 'Ausführung' in pg.inner_text('main'))
    pg.fill('[data-au-regie] [name=stunden]', '3,5'); pg.fill('[data-au-regie] [name=taetigkeit]', 'Zusätzliche Leitung verlegt'); pg.fill('[data-au-regie] [name=material]', 'Kupferrohr'); pg.fill('[data-au-regie] [name=materialEuro]', '80'); pg.check('[data-au-regie] [name=zusatz]')
    pg.click('[data-au-regie] button[type=submit]'); pg.wait_for_timeout(300)
    ok('T2.3/4 Regiebericht mit Zeit und Material', 'Zusatzleistung' in pg.inner_text('main') and '3,5 Std.' in pg.inner_text('main'))
    pg.click('[data-rb-sign]'); pg.wait_for_timeout(200)
    pg.click('[data-re-vorbereiten]'); pg.wait_for_timeout(400)
    re_s = geld(pg.inner_text('.re-drawer .beleg-summe'))
    erw = round(10550 + 3.5 * 64 + 80, 2)
    ok('T2.5/6 Rechnungsbetrag = Angebot + Zusatzleistungen', abs(re_s[0] - erw) < 0.01 and abs(re_s[-1] - round(erw * 1.19, 2)) < 0.02, str(re_s) + ' erwartet netto ' + str(erw))
    pg.click('[data-re-stellen]'); pg.wait_for_timeout(500)
    brutto = round(erw * 1.19, 2)
    pg.click('main [data-re-open] >> nth=0'); pg.wait_for_timeout(300)
    pg.fill('[data-zahlung] [name=betrag]', '99999'); pg.click('[data-zahlung] button'); pg.wait_for_timeout(200)
    ok('T6 Zahlung über Restbetrag abgelehnt', 'höher als der Restbetrag' in pg.inner_text('.drawer'))
    pg.fill('[data-zahlung] [name=betrag]', '5000'); pg.click('[data-zahlung] button'); pg.wait_for_timeout(300)
    t = pg.inner_text('.drawer')
    rest = round(brutto - 5000, 2)
    ok('T2.7/8 Teilzahlung: Restbetrag und Status', ('teilweise bezahlt' in t) and (f'{rest:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.') in t), 'Rest erwartet ' + str(rest))
    pg.fill('[data-zahlung] [name=betrag]', f'{rest}'.replace('.', ',')); pg.click('[data-zahlung] button'); pg.wait_for_timeout(300)
    ok('T2.8 vollständig bezahlt', 'bezahlt' in pg.inner_text('.drawer') and pg.locator('[data-zahlung]').count() == 0)
    pg.click('.drawer [data-close]'); pg.wait_for_timeout(200)

    # ---------- Test 3: Angebotsnachverfolgung ----------
    pg.click('.side-nav [data-view=nachfassen]'); pg.wait_for_timeout(400)
    ok('T3.1 offene Angebote sichtbar', pg.locator('[data-act=nachfassen]').count() > 0)
    # Erinnerung planen, Vorschau, Demo-Versand, Verlauf
    row = pg.locator('#nachfass-liste .row').first
    name3 = row.locator('strong').inner_text().split(' · ')[0]
    row.locator('[data-er-plan]').click(); pg.wait_for_timeout(200)
    pg.fill('.cr-form [name=datum]', '2020-01-01'); pg.click('.cr-form button[type=submit]'); pg.wait_for_timeout(150)
    ok('T6 Erinnerung in der Vergangenheit abgelehnt', 'Vergangenheit' in pg.inner_text('[data-fehler]'))
    pg.click('[data-er-tag] >> nth=1'); pg.fill('.cr-form [name=notiz]', 'Testnotiz Rückruf'); pg.click('.cr-form button[type=submit]'); pg.wait_for_timeout(400)
    ok('T3.2 Erinnerung terminiert', 'Testnotiz Rückruf' in pg.inner_text('#nachfass-liste'))
    pg.locator('#nachfass-liste .row').first.locator('[data-act=nachfassen]').click(); pg.wait_for_timeout(1500)
    mv = pg.inner_text('.drawer .mv')
    ok('T3.3 Nachrichtenvorschau mit Empfänger/Betreff/Inhalt', ('An' in mv or 'WhatsApp' in mv) and name3.split(' ')[-1] in mv and 'verschickt wird erst nach Ihrer Freigabe' in mv)
    pg.click('.drawer .mv [data-mv=senden]'); pg.wait_for_timeout(1500)
    ok('T3.4 Demo-Versand ist gekennzeichnet', pg.locator('.toast:has-text("Demo")').count() >= 1 or 'nichts verschickt' in pg.inner_text('body'))
    pg.evaluate("document.querySelectorAll('.drawer,.drawer-backdrop').forEach(e=>e.remove())")
    pg.click('.side-nav [data-view=kunden]'); pg.wait_for_timeout(300); pg.fill('#ksuche', name3.split(' ')[-1]); pg.wait_for_timeout(300)
    pg.click('[data-akte-open="' + name3 + '"] >> nth=0'); pg.wait_for_timeout(500); pg.click('[data-ka-tab=alles]'); pg.wait_for_timeout(300)
    akt3 = pg.inner_text('#kundenakte')
    ok('T3.5 Aktivität im Kundenverlauf', 'Erinnerung geplant' in akt3 and 'Erinnerung' in akt3 and 'gesendet' in akt3, name3)

    # ---------- Test 4: Rollen und Navigation ----------
    sicht = {}
    for r in ['gf', 'buero', 'monteur']:
        pg.select_option('#rolle', r); pg.wait_for_timeout(300)
        sicht[r] = pg.evaluate("[...document.querySelectorAll('#side-nav [data-view]')].map(b=>b.dataset.view)")
        for v in sicht[r]:
            pg.evaluate("document.querySelector('#side-nav [data-view=%s]').click()" % v); pg.wait_for_timeout(100)
    ok('T4 Geschäftsführung sieht Finanzen, Büro ja, Montage nur App', 'finanzen' in sicht['gf'] and 'finanzen' in sicht['buero'] and sicht['monteur'] == ['monteure'] and pg.locator('.mapp, .phone').count() > 0, str({k: len(v) for k, v in sicht.items()}))
    pg.select_option('#rolle', 'aussen'); pg.wait_for_timeout(200)
    pg.click('.side-nav [data-view=anfragen]'); pg.wait_for_timeout(300); pg.click('.lead >> nth=0'); pg.wait_for_timeout(400)
    if pg.locator('.drawer [data-do=anfrage-loeschen]').count():
        pg.click('.drawer [data-do=anfrage-loeschen]'); pg.wait_for_timeout(200)
        ok('T4 Außendienst darf nicht löschen (Erklärung)', pg.locator('.toast:has-text("nicht erlaubt")').count() >= 1)
    else:
        ok('T4 Außendienst ohne Löschknopf', True)
    pg.evaluate("document.querySelectorAll('.drawer,.drawer-backdrop').forEach(e=>e.remove())")
    pg.select_option('#rolle', 'gf'); pg.wait_for_timeout(200)
    pg.click('.side-nav [data-view=einstellungen]'); pg.wait_for_timeout(300)
    txt4 = pg.inner_text('main')
    ok('T4 Rollen-Simulation gekennzeichnet', 'Rollen-Simulation' in txt4 and 'noch nicht' in txt4, txt4[:120].replace(chr(10), ' '))

    # ---------- Test 5: Persistenz ----------
    pg.click('.side-nav [data-view=anfragen]'); pg.wait_for_timeout(300)
    pg.click('[data-anfrage-neu]'); pg.fill('[name=name]', 'Persistenz Test'); pg.fill('[name=ort]', 'Nürnberg'); pg.fill('[name=betreff]', 'Speichertest'); pg.click('.cr-form button[type=submit]'); pg.wait_for_timeout(600)
    pg.evaluate("document.querySelectorAll('.drawer,.drawer-backdrop').forEach(e=>e.remove())")
    pg.click('.side-nav [data-view=rechnungen]'); pg.wait_for_timeout(200); pg.click('.side-nav [data-view=anfragen]'); pg.wait_for_timeout(200)
    pg.wait_for_timeout(1200); pg.reload(); pg.wait_for_timeout(800)
    pg.click('.side-nav [data-view=anfragen]'); pg.wait_for_timeout(300)
    ok('T5.1-4 Änderung bleibt nach Neuladen erhalten', pg.locator('.lead:has-text("Persistenz Test")').count() == 1 and pg.locator('.lead:has-text("Kim Testmann")').count() == 1)
    pg.click('#reset'); pg.wait_for_timeout(800)
    ok('T5.5-6 Zurücksetzen stellt Ausgangsdaten her', pg.locator('.lead:has-text("Persistenz Test")').count() == 0 and pg.locator('.lead:has-text("Kim Testmann")').count() == 0)
    pg.reload(); pg.wait_for_timeout(600); pg.click('.side-nav [data-view=anfragen]'); pg.wait_for_timeout(300)
    ok('T5 Ausgangsdaten auch nach erneutem Laden', pg.locator('.lead:has-text("Kim Testmann")').count() == 0 and pg.locator('.lead').count() > 5)

    # ---------- Test 6: Fehlerfälle ----------
    pg.fill('#suche', 'gibtsnichtxyz'); pg.wait_for_timeout(300)
    ok('T6 Suche ohne Treffer zeigt Hinweis', 'Keine Anfrage gefunden' in pg.inner_text('main'))
    pg.fill('#suche', ''); pg.wait_for_timeout(200)
    # Verknüpften Kunden löschen
    pg.click('.side-nav [data-view=kunden]'); pg.wait_for_timeout(300); pg.fill('#ksuche', 'Brandl'); pg.wait_for_timeout(300)
    pg.click('[data-akte-open="Familie Brandl"] >> nth=0'); pg.wait_for_timeout(400)
    if pg.locator('[data-kunde-del]').count():
        pg.click('[data-kunde-del]'); pg.wait_for_timeout(300)
        ok('T6 verknüpfter Kunde wird nicht gelöscht', any('kann nicht gelöscht' in d for d in dialoge) and pg.locator('[data-akte-open="Familie Brandl"], h1:has-text("Familie Brandl")').count() > 0, dialoge[-1] if dialoge else '')
    else:
        ok('T6 Löschknopf für Kunden vorhanden', False)
    # Mehrfachklick: Ausschreibung übernehmen
    pg.click('.side-nav [data-view=ausschreibungen]'); pg.wait_for_timeout(300)
    pg.evaluate("var b=document.querySelector('[data-aus-ueber]'); b.click(); b.click();"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelectorAll('.drawer,.drawer-backdrop').forEach(e=>e.remove())")
    n = pg.evaluate("JSON.parse(localStorage.getItem('auftragscockpit-demo-v1')||'{\"state\":{\"leads\":[]}}').state.leads.filter(function(l){return l.kanal==='ausschreibung'}).length")
    pg.wait_for_timeout(1200)
    n = pg.evaluate("(function(){var d=JSON.parse(localStorage.getItem('auftragscockpit-demo-v1'));return d.state.leads.filter(function(l){return l.kanal==='ausschreibung'}).length})()")
    ok('T6 Doppelklick erzeugt keine doppelte Übernahme', n == 1, str(n))
    # Leere Daten: Auswertung mit Filter ohne Treffer
    pg.click('.side-nav [data-view=auswertungen]'); pg.wait_for_timeout(300); pg.select_option('[data-ausw=gewerk]', 'Dach'); pg.wait_for_timeout(200)
    ok('T6 Leerzustand in Auswertungen', 'noch keine Daten' in pg.inner_text('main'))
    pg.screenshot(path=S + 'e2e_ende.png')

    # Kleines Handy: alle Bereiche ohne Überlauf
    m = ctx.new_page(); m.set_viewport_size({'width': 360, 'height': 700}); m.on('pageerror', lambda e: fehler.append('handy:' + str(e)))
    m.goto(BASE + 'demo.html'); m.wait_for_timeout(500)
    m.evaluate("document.querySelector('[data-menue=alle]') && document.querySelector('[data-menue=alle]').click()"); m.wait_for_timeout(200)
    ueber = []
    for v in m.evaluate("[...document.querySelectorAll('#side-nav [data-view]')].map(b=>b.dataset.view)"):
        m.evaluate("document.querySelector('#side-nav [data-view=%s]').click()" % v); m.wait_for_timeout(120)
        if m.evaluate("document.documentElement.scrollWidth") > 362: ueber.append(v)
    ok('T6 360 px: kein seitlicher Überlauf', not ueber, str(ueber))
    print('\n'.join(erg)); print('JS-Fehler:', fehler)
    b.close()
