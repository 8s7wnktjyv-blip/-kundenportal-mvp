"""
EIGENE 3D-MODELLE FÜR DIE AR-ANSICHT (Demo)
---------------------------------------------------------------------
Erzeugt schlichte, selbst erstellte Modelle in echten Maßen (Meter) als
.glb-Dateien im Ordner models/. Keine Herstellermodelle – frei nutzbar.
Ursprung = Boden, y zeigt nach oben, damit die Modelle in der AR-Ansicht
richtig auf dem Boden stehen.

Aufruf (im Projektordner):  python3 tools/modelle.py
Benötigt: Python 3 mit numpy.
"""
import json, os, struct
import numpy as np

HIER = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(os.path.dirname(HIER), "models")


class Modell:
    def __init__(self, name):
        self.name = name; self.teile = []; self.materialien = []; self.mat_index = {}

    def material(self, name, farbe, metall=0.0, rau=0.6, alpha=1.0):
        if name not in self.mat_index:
            m = {"name": name, "doubleSided": True, "pbrMetallicRoughness": {"baseColorFactor": list(farbe) + [alpha], "metallicFactor": metall, "roughnessFactor": rau}}
            if alpha < 1: m["alphaMode"] = "BLEND"
            self.mat_index[name] = len(self.materialien); self.materialien.append(m)
        return self.mat_index[name]

    def box(self, mat, x0, x1, y0, y1, z0, z1):
        p, n, idx = [], [], []
        flaechen = [((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]),
                    ((-1, 0, 0), [(x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (x0, y0, z0)]),
                    ((0, 1, 0), [(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)]),
                    ((0, -1, 0), [(x0, y0, z1), (x0, y0, z0), (x1, y0, z0), (x1, y0, z1)]),
                    ((0, 0, 1), [(x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (x0, y0, z1)]),
                    ((0, 0, -1), [(x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0)])]
        for normale, ecken in flaechen:
            b = len(p); p += ecken; n += [normale] * 4
            idx += [b, b + 1, b + 2, b, b + 2, b + 3]
        self.teile.append((mat, np.array(p, "f4"), np.array(n, "f4"), np.array(idx, "u4")))

    def zylinder(self, mat, cx, cy, cz, r, h, achse="y", seg=32):
        """Zylinder mit Mittelpunkt der Grundfläche (cx, cy, cz) entlang der Achse."""
        p, n, idx = [], [], []
        def v(a, t):   # a = Winkel, t = Höhe → Punkt im lokalen System (y = Achse)
            return (r * np.cos(a), t, r * np.sin(a))
        for i in range(seg):   # Mantel
            a0, a1 = 2 * np.pi * i / seg, 2 * np.pi * (i + 1) / seg
            b = len(p)
            p += [v(a0, 0), v(a0, h), v(a1, h), v(a1, 0)]
            n += [(np.cos(a0), 0, np.sin(a0))] * 2 + [(np.cos(a1), 0, np.sin(a1))] * 2
            idx += [b, b + 2, b + 1, b, b + 3, b + 2]
        for t, ny in ((h, 1), (0, -1)):   # Deckel
            mitte = len(p); p.append((0, t, 0)); n.append((0, ny, 0))
            for i in range(seg):
                a0, a1 = 2 * np.pi * i / seg, 2 * np.pi * (i + 1) / seg
                b = len(p); p += [v(a0, t), v(a1, t)]; n += [(0, ny, 0)] * 2
                idx += [mitte, b + 1, b] if ny > 0 else [mitte, b, b + 1]
        p = np.array(p, "f4"); n = np.array(n, "f4")
        if achse == "z":   # y-Achse auf z-Achse drehen
            p = p[:, [0, 2, 1]] * np.array([1, 1, 1], "f4"); n = n[:, [0, 2, 1]]
            idx = [x for tri in zip(idx[0::3], idx[2::3], idx[1::3]) for x in tri]   # Umlaufsinn bleibt außen
        elif achse == "x":
            p = p[:, [1, 0, 2]]; n = n[:, [1, 0, 2]]
            idx = [x for tri in zip(idx[0::3], idx[2::3], idx[1::3]) for x in tri]
        p = p + np.array([cx, cy, cz], "f4")
        self.teile.append((mat, p, n, np.array(idx, "u4")))

    def speichern(self):
        binaer = bytearray(); views = []; accs = []; meshes = []; nodes = []
        def anhaengen(daten, ziel):
            while len(binaer) % 4: binaer.append(0)
            off = len(binaer); binaer.extend(daten.tobytes())
            views.append({"buffer": 0, "byteOffset": off, "byteLength": daten.nbytes, "target": ziel}); return len(views) - 1
        for mat, p, n, idx in self.teile:
            vp = anhaengen(p, 34962); vn = anhaengen(n, 34962); vi = anhaengen(idx, 34963)
            accs.append({"bufferView": vp, "componentType": 5126, "count": len(p), "type": "VEC3", "min": p.min(0).tolist(), "max": p.max(0).tolist()})
            accs.append({"bufferView": vn, "componentType": 5126, "count": len(n), "type": "VEC3"})
            accs.append({"bufferView": vi, "componentType": 5125, "count": len(idx), "type": "SCALAR"})
            meshes.append({"primitives": [{"attributes": {"POSITION": len(accs) - 3, "NORMAL": len(accs) - 2}, "indices": len(accs) - 1, "material": mat}]})
            nodes.append({"mesh": len(meshes) - 1})
        while len(binaer) % 4: binaer.append(0)
        gltf = {"asset": {"version": "2.0", "generator": "Auftragsassistent Demo-Modelle (eigene Erstellung)"},
                "scene": 0, "scenes": [{"name": self.name, "nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes,
                "materials": self.materialien, "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(binaer)}]}
        js = json.dumps(gltf, separators=(",", ":")).encode()
        js += b" " * ((4 - len(js) % 4) % 4)
        inhalt = struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(binaer), b"BIN\x00") + bytes(binaer)
        os.makedirs(ZIEL, exist_ok=True)
        pfad = os.path.join(ZIEL, self.name + ".glb")
        with open(pfad, "wb") as f: f.write(struct.pack("<4sII", b"glTF", 2, 12 + len(inhalt)) + inhalt)
        return pfad, 12 + len(inhalt)


WEISS = (0.95, 0.95, 0.94); CHROM = (0.8, 0.82, 0.85); GLAS = (0.80, 0.90, 0.95); DUNKEL = (0.15, 0.16, 0.18)

def dusche():   # Walk-in-Dusche 90 × 90 cm, Glas 2,0 m hoch
    m = Modell("dusche"); w = m.material("Keramik", WEISS, rau=0.3); g = m.material("Glas", GLAS, rau=0.05, alpha=0.28); c = m.material("Chrom", CHROM, metall=1.0, rau=0.2)
    m.box(w, -0.45, 0.45, 0, 0.04, -0.45, 0.45)                     # Duschfläche
    m.box(g, -0.45, 0.15, 0.04, 2.0, 0.44, 0.452)                   # Glaswand vorne
    pr = m.material("Farbe", CHROM, metall=1.0, rau=0.2)              # Profile: Farbe wählbar
    m.box(pr, -0.45, 0.15, 1.98, 2.0, 0.438, 0.454)                 # Profil oben
    m.box(pr, 0.13, 0.15, 0.04, 2.0, 0.438, 0.454)                  # Profil Kante
    m.zylinder(c, 0.15, 1.97, 0.20, 0.008, 0.25, achse="z")         # Stabilisator zur Wand
    m.zylinder(c, -0.38, 0.9, -0.42, 0.012, 1.1)                    # Duschstange
    m.zylinder(c, -0.38, 2.0, -0.30, 0.008, 0.12, achse="z")        # Arm
    m.zylinder(c, -0.38, 1.99, -0.18, 0.12, 0.012)                  # Kopfbrause
    m.box(c, -0.42, -0.34, 1.05, 1.13, -0.45, -0.40)                # Armatur
    m.box(m.material("Ablauf", DUNKEL, metall=0.6, rau=0.4), -0.35, 0.35, 0.041, 0.043, -0.42, -0.36)   # Rinne
    return m

def heizkoerper():   # Flachheizkörper 100 × 60 cm, mit Standfüßen
    m = Modell("heizkoerper"); w = m.material("Farbe", WEISS, rau=0.45); c = m.material("Chrom", CHROM, metall=1.0, rau=0.2); d = m.material("Fuß", (0.7, 0.7, 0.72), metall=0.3, rau=0.5)
    m.box(w, -0.5, 0.5, 0.15, 0.75, -0.05, 0.05)
    for i in range(20):
        x = -0.475 + i * 0.05
        m.box(w, x, x + 0.03, 0.17, 0.73, 0.05, 0.056)
    m.box(w, -0.5, 0.5, 0.74, 0.75, -0.055, 0.055)                  # Abdeckung
    for x in (-0.38, 0.38):
        m.box(d, x - 0.02, x + 0.02, 0, 0.15, -0.03, 0.03); m.box(d, x - 0.03, x + 0.03, 0, 0.01, -0.08, 0.08)
    m.zylinder(c, 0.46, 0.08, 0.0, 0.015, 0.07)                     # Ventil
    m.zylinder(c, 0.46, 0.15, 0.0, 0.02, 0.0001)
    return m

def waschtisch():   # Waschtisch 80 cm mit Unterschrank, Oberkante 88 cm
    m = Modell("waschtisch"); h = m.material("Farbe", (0.62, 0.48, 0.34), rau=0.7); w = m.material("Keramik", WEISS, rau=0.25); b = m.material("Becken", (0.86, 0.87, 0.88), rau=0.2)
    c = m.material("Chrom", CHROM, metall=1.0, rau=0.2); f = m.material("Fuge", (0.45, 0.35, 0.25), rau=0.8)
    m.box(h, -0.4, 0.4, 0.36, 0.82, -0.23, 0.23)
    m.box(f, -0.39, 0.39, 0.585, 0.595, 0.23, 0.232)                # Schubladenfuge
    m.box(c, -0.1, 0.1, 0.70, 0.71, 0.232, 0.245); m.box(c, -0.1, 0.1, 0.47, 0.48, 0.232, 0.245)   # Griffe
    m.box(w, -0.41, 0.41, 0.82, 0.88, -0.24, 0.25)                  # Waschtischplatte
    m.box(b, -0.25, 0.25, 0.86, 0.881, -0.12, 0.16)                 # Becken (angedeutet)
    m.zylinder(c, 0.0, 0.88, -0.19, 0.022, 0.18)                    # Armatur
    m.zylinder(c, 0.0, 1.04, -0.19, 0.012, 0.13, achse="z")
    m.box(m.material("o_spiegel", (0.75, 0.82, 0.86), metall=0.9, rau=0.05), -0.4, 0.4, 1.05, 1.75, -0.25, -0.24)   # Spiegel
    m.box(m.material("o_spiegelschrank", (0.75, 0.82, 0.86), metall=0.9, rau=0.05), -0.4, 0.4, 1.05, 1.75, -0.25, -0.1)   # Spiegelschrank
    m.box(c, -0.02, 0.02, 0.36, 0.82, -0.2, -0.16)                  # Ablaufrohr hinter dem Schrank
    unsichtbar = m.material("Bodenmarke", (1, 1, 1), alpha=0.0)       # damit die AR-Ansicht die echte Höhe über dem Boden zeigt
    m.box(unsichtbar, -0.01, 0.01, 0.0, 0.001, -0.01, 0.01)
    return m

def waermepumpe():   # Außengerät 110 × 85 × 45 cm auf Sockelfüßen
    m = Modell("waermepumpe"); g = m.material("Farbe", (0.86, 0.87, 0.88), metall=0.2, rau=0.5); d = m.material("Gitter", DUNKEL, metall=0.3, rau=0.6)
    s = m.material("Seite", (0.55, 0.57, 0.6), metall=0.3, rau=0.5); fu = m.material("Fuß", (0.25, 0.26, 0.28), rau=0.8)
    m.box(g, -0.55, 0.55, 0.12, 0.97, -0.225, 0.225)
    m.box(s, 0.32, 0.55, 0.12, 0.97, 0.225, 0.228)                  # Servicedeckel
    m.zylinder(d, -0.12, 0.545, 0.226, 0.33, 0.01, achse="z")       # Lüfter
    m.zylinder(g, -0.12, 0.545, 0.237, 0.06, 0.008, achse="z")      # Nabe
    for r in (0.12, 0.2, 0.28):
        m.zylinder(s, -0.12, 0.545 + r, 0.236, 0.006, 0.004, achse="z")
    for x in (-0.45, 0.45):
        m.box(fu, x - 0.05, x + 0.05, 0, 0.12, -0.25, 0.25)
    m.box(m.material("o_sockel", (0.7, 0.69, 0.66), rau=0.9), -0.65, 0.65, -0.001, 0.0, -0.4, 0.4)   # Betonsockel (flach)
    return m

ANTHRAZIT = (0.22, 0.23, 0.25); HOLZ = (0.55, 0.40, 0.27); STOFF = (0.78, 0.74, 0.66)

def bodenmarke(m):   # unsichtbarer Punkt am Boden: Wandgeräte schweben in der AR-Ansicht in echter Höhe
    m.box(m.material("Bodenmarke", (1, 1, 1), alpha=0.0), -0.01, 0.01, 0.0, 0.001, -0.01, 0.01)

def terrassendach():   # 4,00 m breit, 3,00 m tief, Wandanschluss 2,60 m, Stützen 2,20 m
    """Grundmodell plus Ausstattung. Jede Ausstattung hat ein eigenes Material (Name beginnt mit o_),
    die AR-Ansicht blendet sie je nach Konfiguration ein oder aus. Materialien mit _r am Ende
    bekommen die gewählte Gestellfarbe."""
    m = Modell("terrassendach"); f = m.material("Farbe", ANTHRAZIT, metall=0.4, rau=0.45); g = m.material("Glas", GLAS, rau=0.05, alpha=0.3)
    B, T, HW, HS = 4.0, 3.0, 2.6, 2.2
    def y(z): return HW - (HW - HS) * (z / T)
    m.box(f, -B / 2, B / 2, HW - 0.12, HW + 0.02, -0.02, 0.08)       # Wandanschlussprofil
    m.box(f, -B / 2, B / 2, HS - 0.2, HS, T - 0.12, T)                # Rinne vorne
    for x in (-B / 2 + 0.06, B / 2 - 0.06):                           # Stützen
        m.box(f, x - 0.06, x + 0.06, 0, HS - 0.2, T - 0.12, T)
    n = 5
    for i in range(n + 1):                                            # Sparren
        x = -B / 2 + 0.04 + i * (B - 0.08) / n
        for k in range(10):
            z0, z1 = T * k / 10, T * (k + 1) / 10
            m.box(f, x - 0.04, x + 0.04, min(y(z0), y(z1)) - 0.1, max(y(z0), y(z1)) + 0.01, z0, z1)
    for k in range(10):                                               # Eindeckung
        z0, z1 = T * k / 10, T * (k + 1) / 10
        m.box(g, -B / 2 + 0.04, B / 2 - 0.04, min(y(z0), y(z1)), min(y(z0), y(z1)) + 0.012, z0, z1)
    # Ausstattung vorne: Glasschiebewand oder Senkrechtmarkise
    fg = m.material("o_front_glas", GLAS, rau=0.05, alpha=0.32); fr = m.material("o_front_glas_r", ANTHRAZIT, metall=0.4, rau=0.45)
    m.box(fr, -B / 2 + 0.12, B / 2 - 0.12, 0, 0.04, T - 0.1, T - 0.02)
    for i in range(5):
        x0 = -B / 2 + 0.12 + i * (B - 0.24) / 5; x1 = x0 + (B - 0.24) / 5
        m.box(fg, x0 + 0.02, x1 - 0.02, 0.04, HS - 0.24, T - 0.08 + (i % 2) * 0.03, T - 0.07 + (i % 2) * 0.03)
        m.box(fr, x0, x0 + 0.03, 0.04, HS - 0.22, T - 0.09 + (i % 2) * 0.03, T - 0.05 + (i % 2) * 0.03)
    fm = m.material("o_front_markise", (0.62, 0.6, 0.56), rau=0.9)
    m.box(fm, -B / 2 + 0.13, B / 2 - 0.13, 0.1, HS - 0.2, T - 0.06, T - 0.055)
    m.box(m.material("o_front_markise_r", ANTHRAZIT, metall=0.4, rau=0.45), -B / 2 + 0.13, B / 2 - 0.13, 0.06, 0.12, T - 0.08, T - 0.03)
    # Seiten: Keile oder komplette Glaswände
    sk = m.material("o_seite_keil", GLAS, rau=0.05, alpha=0.32); sg = m.material("o_seite_glas", GLAS, rau=0.05, alpha=0.32); sr = m.material("o_seite_glas_r", ANTHRAZIT, metall=0.4, rau=0.45)
    for x in (-B / 2 + 0.01, B / 2 - 0.03):
        for k in range(10):
            z0, z1 = T * k / 10, T * (k + 1) / 10
            m.box(sk, x, x + 0.02, HS - 0.2, y(z1) - 0.05, z0, z1)
            m.box(sg, x, x + 0.02, 0.04, y(z1) - 0.05, z0, z1)
        m.box(sr, x - 0.01, x + 0.03, 0, 0.04, 0.05, T - 0.1)
        m.box(sr, x - 0.01, x + 0.03, 0.04, HW - 0.1, T / 2 - 0.02, T / 2 + 0.02)
    # Beschattung: Unterdach- oder Aufdachmarkise
    ud = m.material("o_unterdach", (0.86, 0.83, 0.76), rau=0.9)
    for k in range(10):
        z0, z1 = T * k / 10 + 0.1, T * (k + 1) / 10 - 0.1 if k == 9 else T * (k + 1) / 10 + 0.1
        m.box(ud, -B / 2 + 0.1, B / 2 - 0.1, min(y(z0), y(min(z1, T))) - 0.2, min(y(z0), y(min(z1, T))) - 0.19, z0, min(z1, T - 0.15))
    ad = m.material("o_aufdach", (0.86, 0.83, 0.76), rau=0.9); ar = m.material("o_aufdach_r", ANTHRAZIT, metall=0.4, rau=0.45)
    m.box(ar, -B / 2, B / 2, HW + 0.02, HW + 0.2, 0.0, 0.22)
    for k in range(10):
        z0, z1 = T * k / 10, T * (k + 1) / 10
        m.box(ad, -B / 2 + 0.06, B / 2 - 0.06, max(y(z0), y(z1)) + 0.12, max(y(z0), y(z1)) + 0.13, max(z0, 0.2), z1)
    led = m.material("o_led", (1.0, 0.95, 0.7), rau=0.2)
    for i in range(1, n):
        x = -B / 2 + 0.04 + i * (B - 0.08) / n
        for z in (T * 0.3, T * 0.7):
            m.zylinder(led, x, y(z) - 0.115, z, 0.025, 0.006)
    hz = m.material("o_heiz", (0.3, 0.3, 0.32), metall=0.5, rau=0.4); hg = m.material("o_heiz_glut", (1.0, 0.45, 0.15), rau=0.6)
    m.box(hz, -0.4, 0.4, HW - 0.42, HW - 0.3, 0.02, 0.16); m.box(hg, -0.35, 0.35, HW - 0.43, HW - 0.42, 0.04, 0.14)
    return m

def markise():   # Kassettenmarkise 4,00 m, Ausfall 3,00 m, Montage 2,50 m
    m = Modell("markise"); f = m.material("Farbe", ANTHRAZIT, metall=0.4, rau=0.45); t = m.material("Tuch", STOFF, rau=0.9)
    B, A, H = 4.0, 3.0, 2.5
    m.box(f, -B / 2, B / 2, H - 0.14, H + 0.06, 0, 0.24)              # Kassette
    neig = 0.6
    for k in range(12):
        z0, z1 = 0.2 + A * k / 12, 0.2 + A * (k + 1) / 12
        y0 = H - 0.12 - neig * (z0 - 0.2) / A
        m.box(t, -B / 2 + 0.05, B / 2 - 0.05, y0 - 0.02, y0, z0, z1)
    m.box(f, -B / 2 + 0.03, B / 2 - 0.03, H - 0.12 - neig - 0.08, H - 0.12 - neig + 0.02, A + 0.15, A + 0.25)   # Ausfallprofil
    for x in (-B / 2 + 0.3, B / 2 - 0.3):                             # Gelenkarme
        for k in range(8):
            z0 = 0.2 + A * 0.96 * k / 8
            m.box(f, x - 0.03, x + 0.03, H - 0.2 - neig * k / 8, H - 0.16 - neig * k / 8, z0, z0 + A * 0.12)
    m.box(m.material("o_volant", STOFF, rau=0.9), -B / 2 + 0.05, B / 2 - 0.05, H - 0.12 - neig - 0.9, H - 0.12 - neig - 0.08, A + 0.2, A + 0.21)   # Volant-Rollo
    m.box(m.material("o_sensor", WEISS, rau=0.4), B / 2 + 0.1, B / 2 + 0.22, H - 0.05, H + 0.12, 0, 0.1)          # Wind- und Sonnensensor
    m.box(m.material("o_motor", (0.3, 0.6, 0.9), rau=0.3), -B / 2 - 0.02, -B / 2 + 0.02, H - 0.06, H - 0.02, 0.2, 0.24)   # Motor-Kontrollleuchte
    bodenmarke(m)
    return m

def haustuer():   # Haustür 1,10 × 2,10 m, wahlweise mit Seitenteil und Lichtausschnitt
    m = Modell("haustuer"); f = m.material("Farbe", ANTHRAZIT, metall=0.3, rau=0.5); r = m.material("Rahmen", (0.3, 0.31, 0.33), metall=0.4, rau=0.5)
    c = m.material("Edelstahl", CHROM, metall=1.0, rau=0.25)
    m.box(r, -0.55, 0.55, 0, 2.1, -0.04, 0.04)                        # Rahmen
    m.box(f, -0.48, 0.48, 0.03, 2.03, 0.04, 0.1)                      # Türblatt
    m.box(m.material("o_glasstreifen", GLAS, rau=0.05, alpha=0.55), -0.32, -0.2, 0.35, 1.8, 0.1, 0.105)
    g3 = m.material("o_glas3", GLAS, rau=0.05, alpha=0.55)
    for y in (0.55, 1.05, 1.55): m.box(g3, -0.3, -0.12, y, y + 0.3, 0.1, 0.105)
    m.box(m.material("o_seitenteil_r", (0.3, 0.31, 0.33), metall=0.4, rau=0.5), 0.55, 1.0, 0, 2.1, -0.04, 0.04)
    m.box(m.material("o_seitenteil", GLAS, rau=0.05, alpha=0.5), 0.6, 0.95, 0.1, 2.0, 0.04, 0.05)
    m.zylinder(c, 0.36, 0.7, 0.16, 0.017, 1.0)                        # Stoßgriff
    m.box(c, 0.34, 0.38, 0.75, 0.79, 0.1, 0.16); m.box(c, 0.34, 0.38, 1.6, 1.64, 0.1, 0.16)
    return m

def klimageraet():   # Split-Innengerät 80 × 30 × 20 cm, Montage auf 2,10 m
    m = Modell("klimageraet"); f = m.material("Farbe", WEISS, rau=0.35); d = m.material("Lamelle", (0.7, 0.71, 0.72), rau=0.5)
    m.box(f, -0.4, 0.4, 2.0, 2.3, -0.1, 0.1)
    m.box(d, -0.36, 0.36, 2.02, 2.06, 0.1, 0.105)
    m.box(m.material("Anzeige", (0.3, 0.6, 0.9), rau=0.3), 0.25, 0.3, 2.1, 2.12, 0.1, 0.104)
    bodenmarke(m)
    return m

def kaminofen():   # Kaminofen 50 × 110 × 45 cm mit Sichtfenster und Rohr
    m = Modell("kaminofen"); f = m.material("Farbe", ANTHRAZIT, metall=0.5, rau=0.55); g = m.material("Scheibe", (0.12, 0.1, 0.09), metall=0.2, rau=0.1)
    o = m.material("Flamme", (0.95, 0.5, 0.15), rau=0.9); s = m.material("Stein", (0.75, 0.73, 0.7), rau=0.85)
    m.box(s, -0.35, 0.35, 0, 0.02, -0.35, 0.5)                        # Bodenplatte (Funkenschutz)
    m.box(f, -0.25, 0.25, 0.02, 1.1, -0.22, 0.22)
    m.box(g, -0.18, 0.18, 0.42, 0.85, 0.22, 0.225)
    m.box(o, -0.1, 0.1, 0.45, 0.6, 0.2, 0.221)
    m.box(m.material("Holzfach", (0.08, 0.08, 0.09), rau=0.8), -0.2, 0.2, 0.08, 0.34, 0.22, 0.223)
    m.box(m.material("o_speicher", (0.6, 0.58, 0.55), rau=0.85), -0.25, 0.25, 1.1, 1.38, -0.22, 0.22)   # Speichersteine-Aufsatz
    m.box(m.material("o_seitenglas", (0.12, 0.1, 0.09), metall=0.2, rau=0.1), 0.25, 0.252, 0.45, 0.82, -0.12, 0.12)
    m.zylinder(f, 0, 1.1, 0, 0.075, 0.9)                              # Rauchrohr
    return m

def wallbox():   # Wallbox 30 × 40 × 15 cm, Montage auf 1,20 m, mit Kabel
    m = Modell("wallbox"); f = m.material("Farbe", WEISS, rau=0.35); d = m.material("Front", DUNKEL, rau=0.4); l = m.material("LED", (0.2, 0.8, 0.45), rau=0.3)
    m.box(f, -0.15, 0.15, 1.0, 1.4, -0.075, 0.075)
    m.box(d, -0.12, 0.12, 1.05, 1.36, 0.075, 0.08)
    m.box(l, -0.06, 0.06, 1.3, 1.31, 0.08, 0.082)
    kb = m.material("o_kabel", DUNKEL, rau=0.5)
    for k in range(8):                                                # Ladekabel
        m.zylinder(kb, 0.17, 1.15 - k * 0.07, 0.0, 0.012, 0.07)
    m.box(m.material("o_dose", (0.35, 0.36, 0.38), rau=0.4), -0.05, 0.05, 1.08, 1.16, 0.08, 0.1)   # Steckdose Typ 2
    sa = m.material("o_saeule", (0.55, 0.57, 0.6), metall=0.4, rau=0.5)
    m.box(sa, -0.1, 0.1, 0, 1.0, -0.12, -0.075); m.box(sa, -0.2, 0.2, 0, 0.02, -0.25, 0.1)          # Standsäule
    bodenmarke(m)
    return m

def stromspeicher():   # Batteriespeicher 60 × 120 × 25 cm (bodenstehend)
    m = Modell("stromspeicher"); f = m.material("Farbe", WEISS, rau=0.35); d = m.material("Akzent", DUNKEL, rau=0.4); l = m.material("LED", (0.2, 0.8, 0.45), rau=0.3)
    m.box(f, -0.3, 0.3, 0.05, 1.2, -0.125, 0.125)
    for k in range(3): m.box(d, -0.3, 0.3, 0.42 + k * 0.38, 0.425 + k * 0.38, 0.125, 0.128)
    m.box(l, -0.08, 0.08, 1.12, 1.13, 0.125, 0.129)
    m.box(d, -0.28, 0.28, 0, 0.05, -0.1, 0.1)
    return m


if __name__ == "__main__":
    for bau in (dusche, heizkoerper, waschtisch, waermepumpe, terrassendach, markise, haustuer, klimageraet, kaminofen, wallbox, stromspeicher):
        pfad, groesse = bau().speichern()
        print("%-40s %6.1f KB" % (os.path.relpath(pfad), groesse / 1024))
