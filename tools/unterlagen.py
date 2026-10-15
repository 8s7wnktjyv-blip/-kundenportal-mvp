"""
PARTNER-UNTERLAGEN NEU ERZEUGEN
---------------------------------------------------------------------
Erzeugt die QR-Codes (img/qr/*.svg) und die Druck-PDFs
(downloads/flyer.pdf, downloads/aufsteller.pdf).

Wann ausführen? Nach jeder Änderung von Firmenname, Domain, Telefon
oder E-Mail in config.js – sonst zeigen die QR-Codes auf die alte Adresse.

Aufruf (im Projektordner):   python3 tools/unterlagen.py
Benötigt: Python mit reportlab und playwright (Chromium).
"""
import os, re, sys

HIER = os.path.dirname(os.path.abspath(__file__))
W = os.path.dirname(HIER)

# ---- Einstellungen aus config.js lesen ------------------------------
cfg = open(os.path.join(W, 'config.js'), encoding='utf-8').read()
def wert(k):
    m = re.search(r'\b' + k + r':\s*"([^"]*)"', cfg)
    return m.group(1) if m else ''
NAME, DOMAIN, TEL, MAIL = wert('name'), wert('domain'), wert('phone'), wert('email')
# Solange keine eigene Domain eingetragen ist, zeigen die Codes auf die Testseite
BASE = ('https://' + DOMAIN.strip('/') + '/') if DOMAIN and not DOMAIN.startswith('[') else 'https://8s7wnktjyv-blip.github.io/-kundenportal-mvp/'

BRANCHEN = [('shk', 'SHK & Heizung'), ('maler', 'Maler & Lackierer'), ('elektro', 'Elektro'), ('dach', 'Dach, Fenster, Rollladen'),
            ('reinigung', 'Gebäudereinigung'), ('it', 'IT-Service'), ('hausmeister', 'Hausmeister & GaLaBau'), ('sicherheit', 'Sicherheits- & Klimatechnik')]

def link(key=None):
    return BASE + 'demo.html' + ('' if key in (None, 'shk') else '?branche=' + key)

def qr_svg(daten, datei):
    """Schlanker QR-Code als SVG (ein Pfad, 4 Module Rand)."""
    from reportlab.graphics.barcode import qrencoder
    q = qrencoder.QRCode(None, qrencoder.QRErrorCorrectLevel.M)
    q.addData(daten); q.make()
    n = q.getModuleCount(); r = 4; g = n + 2 * r
    d = ''.join('M%d %dh1v1h-1z' % (c + r, z + r) for z in range(n) for c in range(n) if q.isDark(z, c))
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" shape-rendering="crispEdges" role="img" aria-label="QR-Code: %s">'
           '<rect width="%d" height="%d" fill="#fff"/><path d="%s" fill="#000"/></svg>') % (g, g, daten, g, g, d)
    open(datei, 'w', encoding='utf-8').write(svg)

os.makedirs(os.path.join(W, 'img', 'qr'), exist_ok=True)
qr_svg(link(), os.path.join(W, 'img', 'qr', 'demo.svg'))
for k, _ in BRANCHEN:
    qr_svg(link(k), os.path.join(W, 'img', 'qr', 'demo-%s.svg' % k))
print('QR-Codes für', BASE)

# ---- Druckvorlagen --------------------------------------------------
STIL = '''<style>
@page { margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, "Inter", "Helvetica Neue", Arial, sans-serif; color: #1D1D1F; }
.seite { page-break-after: always; position: relative; overflow: hidden; }
.seite:last-child { page-break-after: auto; }
.marke { display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: -.02em; }
.zeichen { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(150deg,#2C2C2E,#000); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 19px; position: relative; }
.zeichen::after { content: ""; position: absolute; right: 4px; bottom: 8px; width: 5px; height: 5px; border-radius: 50%; background: #2997FF; }
h1 { letter-spacing: -.035em; line-height: 1.05; margin: 0; }
.blau { color: #0066CC; }
.qr img { display: block; width: 100%; height: auto; }
ul { padding: 0; margin: 0; list-style: none; }
li { padding-left: 26px; position: relative; }
li::before { content: ""; position: absolute; left: 0; top: .45em; width: 14px; height: 14px; border-radius: 50%; background: #0071E3; }
.klein { color: #6E6E73; }
li.minus::before { background: #AEAEB2; width: 10px; height: 2px; border-radius: 1px; top: .65em; left: 2px; }
</style>'''

def marke():
    return '<div class="marke"><span class="zeichen">%s</span>%s</div>' % (NAME[:1].lower(), NAME)

def aufsteller():
    seiten = []
    for k, n in BRANCHEN:
        seiten.append('''<section class="seite" style="width:148mm;height:210mm;padding:14mm 13mm;display:flex;flex-direction:column">
  %s
  <h1 style="font-size:36px;margin-top:16mm">Weniger Büro am Abend.<br><span class="blau">Kein Auftrag geht verloren.</span></h1>
  <ul style="margin-top:12mm;font-size:15px;line-height:1.45;display:grid;gap:10px">
    <li>Alle Anfragen an einem Ort – Telefon, WhatsApp, E-Mail</li>
    <li>Angebote werden automatisch nachgefasst</li>
    <li>Kalender und App für das ganze Team</li>
    <li>Eingerichtet und betreut – ohne Technik-Stress</li>
  </ul>
  <div style="margin-top:auto;display:flex;gap:9mm;align-items:flex-end">
    <div class="qr" style="width:58mm;flex:none"><img src="file://%s"></div>
    <div style="font-size:14px;line-height:1.4"><b style="font-size:17px">Demo für %s</b><br>QR-Code scannen und selbst ausprobieren – ohne Anmeldung.<br><br><span class="klein">%s · %s</span></div>
  </div>
</section>''' % (marke(), os.path.join(W, 'img', 'qr', 'demo-%s.svg' % k), n, TEL, MAIL))
    return '<!doctype html><html lang="de"><head><meta charset="utf-8">' + STIL + '</head><body>' + ''.join(seiten) + '</body></html>'

def flyer():
    zeilen = ''.join('<tr><td style="padding:3px 0">%s</td><td class="klein" style="padding:3px 0 3px 12px">%s</td></tr>' % (n, link(k).replace('https://', '')) for k, n in BRANCHEN)
    return '''<!doctype html><html lang="de"><head><meta charset="utf-8">''' + STIL + '''</head><body>
<section class="seite" style="width:210mm;height:297mm;padding:18mm 17mm;display:flex;flex-direction:column">
  ''' + marke() + '''
  <h1 style="font-size:44px;margin-top:14mm">Weniger Büro am Abend.<br><span class="blau">Kein Auftrag geht verloren.</span></h1>
  <p style="font-size:16px;line-height:1.5;margin:7mm 0 0;max-width:150mm">Anfragen kommen per Telefon, WhatsApp und E-Mail, Angebote bleiben liegen, und niemand fasst nach. Das kostet viele Betriebe jeden Monat Aufträge. ''' + NAME + ''' richtet Ihnen ein Auftrags-Cockpit ein und betreut es – Sie müssen keine Software lernen.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:10mm;font-size:13.5px;line-height:1.45">
    <div style="background:#F5F5F7;border-radius:14px;padding:6mm"><b>Vorher</b><ul style="margin-top:3mm;display:grid;gap:5px"><li class="minus">Zettel, Anrufliste, Postfach</li><li class="minus">Angebote ohne Nachfassen</li><li class="minus">Termine im Kopf</li><li class="minus">Rechnungen am Wochenende</li></ul></div>
    <div style="background:#E8F2FD;border-radius:14px;padding:6mm"><b>Mit dem Cockpit</b><ul style="margin-top:3mm;display:grid;gap:5px"><li>Alle Anfragen an einem Ort</li><li>Automatische Erinnerung zum Nachfassen</li><li>Kalender und Montage-App fürs Team</li><li>Rechnung direkt aus dem Bericht</li></ul></div>
  </div>
  <div style="display:flex;gap:10mm;align-items:center;margin-top:12mm">
    <div class="qr" style="width:48mm;flex:none"><img src="file://''' + os.path.join(W, 'img', 'qr', 'demo.svg') + '''"></div>
    <div style="font-size:15px;line-height:1.45"><b style="font-size:20px">Selbst ausprobieren</b><br>QR-Code scannen: Die Demo zeigt das Cockpit mit Beispieldaten – oben lässt sich Ihre Branche wählen.<br><br><b>Kostenloser Angebots-Check</b>, 20 Minuten: Wir schauen gemeinsam, wo bei Ihnen Aufträge verloren gehen.</div>
  </div>
  <table style="margin-top:9mm;font-size:12px;border-collapse:collapse"><tr><td colspan="2" style="padding-bottom:4px"><b>Demo direkt für Ihre Branche</b></td></tr>''' + zeilen + '''</table>
  <div style="margin-top:auto;border-top:1px solid #D2D2D7;padding-top:5mm;display:flex;justify-content:space-between;font-size:13px"><span><b>''' + NAME + '''</b> · Dominik Böhm</span><span>''' + TEL + ''' · ''' + MAIL + '''</span></div>
</section></body></html>'''

os.makedirs(os.path.join(W, 'downloads'), exist_ok=True)
tmp_a = os.path.join(HIER, '_aufsteller.html'); tmp_f = os.path.join(HIER, '_flyer.html')
open(tmp_a, 'w', encoding='utf-8').write(aufsteller())
open(tmp_f, 'w', encoding='utf-8').write(flyer())
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto('file://' + tmp_a); pg.wait_for_timeout(300)
    pg.pdf(path=os.path.join(W, 'downloads', 'aufsteller.pdf'), width='148mm', height='210mm', print_background=True)
    pg.goto('file://' + tmp_f); pg.wait_for_timeout(300)
    pg.pdf(path=os.path.join(W, 'downloads', 'flyer.pdf'), format='A4', print_background=True)
    b.close()
os.remove(tmp_a); os.remove(tmp_f)
print('PDFs erstellt: downloads/flyer.pdf, downloads/aufsteller.pdf')
