"""Tests für den Pflichten-Check und die Fristen in der Demo. Aufruf: python3 tools/e2e_pflichtcheck.py [basis-url]"""
import sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
erg = []
def ok(name, bed, info=''):
    erg.append(('OK ' if bed else 'FEHLER ') + name + (' – ' + info if info else ''))

with sync_playwright() as p:
    b = p.chromium.launch()
    for breite in (390, 1400):
        pg = b.new_page(viewport={'width': breite, 'height': 900}); fehler = []
        pg.on('pageerror', lambda e: fehler.append(str(e)))
        pg.goto(BASE + 'hausverwaltungen.html'); pg.wait_for_timeout(300)
        res = lambda: pg.inner_text('#pc-ergebnis')
        ok(f'[{breite}] Einbaujahr anfangs versteckt', not pg.is_visible('#pc-jahr'))
        pg.select_option('#pc-einheiten', 'klein'); pg.select_option('#pc-art', 'kessel'); pg.select_option('#pc-jahr', 'alt')
        ok(f'[{breite}] 1–5 Einheiten → keine Pflicht', 'Keine Heizungsprüfung' in res())
        pg.select_option('#pc-einheiten', 'gross')
        ok(f'[{breite}] vor 10/2009 → 30.09.2027', '30.09.2027' in res())
        pg.select_option('#pc-jahr', '2009')
        ok(f'[{breite}] 2009 → überfällig', 'überfällig' in res())
        pg.select_option('#pc-jahr', '2020')
        ok(f'[{breite}] 2020 → fällig 2036', '2036' in res())
        pg.select_option('#pc-art', 'wp')
        ok(f'[{breite}] Wärmepumpe → § 60a, Jahr versteckt', '60a' in res() and not pg.is_visible('#pc-jahr'))
        pg.select_option('#pc-art', 'unklar')
        ok(f'[{breite}] Heizart unklar → Gespräch', 'gemeinsam' in res())
        sw = pg.evaluate('document.documentElement.scrollWidth')
        ok(f'[{breite}] kein seitliches Scrollen', sw <= breite, f'scrollWidth {sw}')
        pg.locator('#pflichtcheck').screenshot(path=f'/tmp/claude-0/-home-claude/a6550012-8a3f-5203-85fd-47046b7fcb1e/scratchpad/check_{breite}.png')
        for seite in ('preise.html', 'gewerk-shk.html', 'demo-hausverwaltung.html'):
            pg.goto(BASE + seite); pg.wait_for_timeout(400)
        ok(f'[{breite}] keine JS-Fehler', not fehler, '; '.join(fehler))
        pg.close()
    pg = b.new_page(viewport={'width': 1400, 'height': 1000}); pg.goto(BASE + 'demo-hausverwaltung.html'); pg.wait_for_timeout(500)
    pg.click('[data-view=fristen]'); pg.wait_for_timeout(300)
    t = pg.inner_text('body')
    ok('Demo: § 60b-Fristen sichtbar', t.count('60b') >= 2)
    ok('Demo: Zähler-Frist sichtbar', 'Heizkostenzähler' in t)
    b.close()
print('\n'.join(erg))
sys.exit(0 if all(e.startswith('OK') for e in erg) else 1)
