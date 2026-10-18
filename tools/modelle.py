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
    m.box(c, -0.45, 0.15, 1.98, 2.0, 0.438, 0.454)                  # Profil oben
    m.box(c, 0.13, 0.15, 0.04, 2.0, 0.438, 0.454)                   # Profil Kante
    m.zylinder(c, 0.15, 1.97, 0.20, 0.008, 0.25, achse="z")         # Stabilisator zur Wand
    m.zylinder(c, -0.38, 0.9, -0.42, 0.012, 1.1)                    # Duschstange
    m.zylinder(c, -0.38, 2.0, -0.30, 0.008, 0.12, achse="z")        # Arm
    m.zylinder(c, -0.38, 1.99, -0.18, 0.12, 0.012)                  # Kopfbrause
    m.box(c, -0.42, -0.34, 1.05, 1.13, -0.45, -0.40)                # Armatur
    m.box(m.material("Ablauf", DUNKEL, metall=0.6, rau=0.4), -0.35, 0.35, 0.041, 0.043, -0.42, -0.36)   # Rinne
    return m

def heizkoerper():   # Flachheizkörper 100 × 60 cm, mit Standfüßen
    m = Modell("heizkoerper"); w = m.material("Lack weiß", WEISS, rau=0.45); c = m.material("Chrom", CHROM, metall=1.0, rau=0.2); d = m.material("Fuß", (0.7, 0.7, 0.72), metall=0.3, rau=0.5)
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
    m = Modell("waschtisch"); h = m.material("Holz", (0.62, 0.48, 0.34), rau=0.7); w = m.material("Keramik", WEISS, rau=0.25); b = m.material("Becken", (0.86, 0.87, 0.88), rau=0.2)
    c = m.material("Chrom", CHROM, metall=1.0, rau=0.2); f = m.material("Fuge", (0.45, 0.35, 0.25), rau=0.8); s = m.material("Spiegel", (0.75, 0.82, 0.86), metall=0.9, rau=0.05)
    m.box(h, -0.4, 0.4, 0.36, 0.82, -0.23, 0.23)
    m.box(f, -0.39, 0.39, 0.585, 0.595, 0.23, 0.232)                # Schubladenfuge
    m.box(c, -0.1, 0.1, 0.70, 0.71, 0.232, 0.245); m.box(c, -0.1, 0.1, 0.47, 0.48, 0.232, 0.245)   # Griffe
    m.box(w, -0.41, 0.41, 0.82, 0.88, -0.24, 0.25)                  # Waschtischplatte
    m.box(b, -0.25, 0.25, 0.86, 0.881, -0.12, 0.16)                 # Becken (angedeutet)
    m.zylinder(c, 0.0, 0.88, -0.19, 0.022, 0.18)                    # Armatur
    m.zylinder(c, 0.0, 1.04, -0.19, 0.012, 0.13, achse="z")
    m.box(s, -0.4, 0.4, 1.05, 1.75, -0.25, -0.24)                   # Spiegel an der Wand
    m.box(c, -0.02, 0.02, 0.36, 0.82, -0.2, -0.16)                  # Ablaufrohr hinter dem Schrank
    unsichtbar = m.material("Bodenmarke", (1, 1, 1), alpha=0.0)       # damit die AR-Ansicht die echte Höhe über dem Boden zeigt
    m.box(unsichtbar, -0.01, 0.01, 0.0, 0.001, -0.01, 0.01)
    return m

def waermepumpe():   # Außengerät 110 × 85 × 45 cm auf Sockelfüßen
    m = Modell("waermepumpe"); g = m.material("Gehäuse", (0.86, 0.87, 0.88), metall=0.2, rau=0.5); d = m.material("Gitter", DUNKEL, metall=0.3, rau=0.6)
    s = m.material("Seite", (0.55, 0.57, 0.6), metall=0.3, rau=0.5); fu = m.material("Fuß", (0.25, 0.26, 0.28), rau=0.8)
    m.box(g, -0.55, 0.55, 0.12, 0.97, -0.225, 0.225)
    m.box(s, 0.32, 0.55, 0.12, 0.97, 0.225, 0.228)                  # Servicedeckel
    m.zylinder(d, -0.12, 0.545, 0.226, 0.33, 0.01, achse="z")       # Lüfter
    m.zylinder(g, -0.12, 0.545, 0.237, 0.06, 0.008, achse="z")      # Nabe
    for r in (0.12, 0.2, 0.28):
        m.zylinder(s, -0.12, 0.545 + r, 0.236, 0.006, 0.004, achse="z")
    for x in (-0.45, 0.45):
        m.box(fu, x - 0.05, x + 0.05, 0, 0.12, -0.25, 0.25)
    return m


if __name__ == "__main__":
    for bau in (dusche, heizkoerper, waschtisch, waermepumpe):
        pfad, groesse = bau().speichern()
        print("%-40s %6.1f KB" % (os.path.relpath(pfad), groesse / 1024))
