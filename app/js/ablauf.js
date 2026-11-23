/* Kundario – Prozess-Fortschrittsleiste: Anfrage → Angebot → Angenommen → Auftrag → Ausführung → Rechnung → Bezahlt.
   Erscheint oben in Anfrage, Angebot, Auftrag und Rechnung; jede Station ist ein Link, die aktuelle zeigt den nächsten Schritt. */
(function () {
  var V = K.views, DB = window.KDB, h = U.h, istId = function (id) { return id && /^[0-9a-f-]{20,}$/i.test(id); };
  var sicher = function (p) { return p.catch(function () { return []; }); };
  var erstes = function (l) { return (l || []).slice().sort(function (a, b) { return String(b.created_at || "").localeCompare(String(a.created_at || "")); })[0] || null; };

  K.ablaufKette = async function (typ, id) {
    var k = { anfrage: null, angebot: null, auftrag: null, berichte: [], rechnung: null }, ang = K.darf("angebote"), fin = K.darf("rechnungen");
    var eins = function (t, i) { return i ? DB.eins(t, i).catch(function () { return null; }) : Promise.resolve(null); };
    if (typ === "rechnung") { k.rechnung = await eins("rechnungen", id); if (k.rechnung) k.auftrag = await eins("auftraege", k.rechnung.auftrag_id); }
    if (typ === "auftrag") k.auftrag = await eins("auftraege", id);
    if (k.auftrag && ang) k.angebot = await eins("angebote", k.auftrag.angebot_id);
    if (typ === "angebot") k.angebot = await eins("angebote", id);
    if (k.angebot) k.anfrage = await eins("anfragen", k.angebot.anfrage_id);
    if (typ === "anfrage") { k.anfrage = await eins("anfragen", id); if (k.anfrage && ang) k.angebot = erstes((await sicher(K.liste("angebote", { wo: { anfrage_id: id } }))).filter(function (a) { return a.status !== "abgelehnt"; })); }
    if (k.angebot && !k.auftrag) k.auftrag = erstes(await sicher(K.liste("auftraege", { wo: { angebot_id: k.angebot.id } })));
    if (k.auftrag) {
      k.berichte = K.darf("berichte") ? await sicher(K.liste("berichte", { wo: { auftrag_id: k.auftrag.id } })) : [];
      if (!k.rechnung && fin) k.rechnung = erstes((await sicher(K.liste("rechnungen", { wo: { auftrag_id: k.auftrag.id } }))).filter(function (r) { return r.status !== "storniert"; }));
    }
    return k;
  };

  K.ablaufStationen = function (k) {
    var an = k.angebot, au = k.auftrag, re = k.rechnung, ber = k.berichte || [];
    var angenommen = !!(an && an.status === "angenommen") || !!au;
    return [
      { n: "Anfrage", fertig: !!(k.anfrage || an || au), link: k.anfrage ? "#/anfragen/" + k.anfrage.id : null },
      { n: "Angebot", fertig: !!(an && an.status !== "entwurf") || !!au, link: an ? "#/angebote/" + an.id : null, tun: k.anfrage && !an ? "Angebot erstellen" : an && an.status === "entwurf" ? "Angebot senden" : null },
      { n: "Angenommen", fertig: angenommen, link: an ? "#/angebote/" + an.id : null, tun: an && an.status === "gesendet" ? "Nachfassen" : null },
      { n: "Auftrag", fertig: !!au, link: au ? "#/auftraege/" + au.id : null, tun: angenommen && !au ? "Auftrag anlegen" : null },
      { n: "Ausführung", fertig: !!au && (au.status === "abgeschlossen" || ber.some(function (b) { return b.status !== "entwurf"; }) || !!re), link: au ? "#/auftraege/" + au.id + (ber.length ? "/berichte" : "") : null, tun: au ? "Ausführen und Bericht unterschreiben lassen" : null },
      { n: "Rechnung", fertig: !!(re && re.status !== "entwurf"), link: re ? "#/rechnungen/" + re.id : au ? "#/auftraege/" + au.id : null, tun: au && !re ? "Rechnung stellen" : re && re.status === "entwurf" ? "Rechnung stellen" : null },
      { n: "Bezahlt", fertig: !!(re && re.status === "bezahlt"), link: re ? "#/rechnungen/" + re.id : null, tun: re && (re.status === "gestellt" || re.status === "teilbezahlt") ? "Zahlung prüfen" : null }
    ];
  };

  K.ablaufHtml = function (k, aktivTyp) {
    var st = K.ablaufStationen(k), jetzt = -1; st.forEach(function (s, i) { if (jetzt < 0 && !s.fertig) jetzt = i; });
    var ende = k.anfrage && k.anfrage.status === "verloren" ? "Anfrage verloren" : k.angebot && (k.angebot.status === "abgelehnt" || k.angebot.status === "abgelaufen") ? "Angebot " + (k.angebot.status === "abgelehnt" ? "abgelehnt" : "abgelaufen") : "";
    var hier = { anfrage: 0, angebot: 1, auftrag: 3, rechnung: 5 }[aktivTyp];
    return '<nav class="ablauf" aria-label="Fortschritt"><ol>' + st.map(function (s, i) {
      var cls = s.fertig ? "fertig" : i === jetzt ? "jetzt" : "", inhalt = '<span class="ab-punkt">' + (s.fertig ? "✓" : i + 1) + '</span><span class="ab-name">' + h(s.n) + "</span>";
      return '<li class="' + cls + (i === hier ? " hier" : "") + '">' + (s.link ? '<a href="' + s.link + '">' + inhalt + "</a>" : "<span>" + inhalt + "</span>") + "</li>";
    }).join("") + "</ol>" +
      (ende ? '<p class="ab-weiter ab-ende">' + h(ende) + "</p>" : jetzt > -1 && st[jetzt].tun ? '<p class="ab-weiter">Nächster Schritt: <b>' + h(st[jetzt].tun) + "</b></p>" : jetzt < 0 ? '<p class="ab-weiter ab-fertig">Abgeschlossen und bezahlt.</p>' : "") + "</nav>";
  };

  var einhaengen = function (view, typ) {
    var v = V[view]; if (!v) return; var alt = v.danach;
    v.danach = async function (id, extra) {
      if (alt) await alt(id, extra);
      if (!istId(id) || K.istVerwaltung()) return;
      try {
        var k = await K.ablaufKette(typ, id), kopf = document.querySelector("#inhalt .seite-kopf");
        if (!kopf || document.querySelector("#inhalt .ablauf") || location.hash.indexOf(id) < 0) return;
        if (!k.anfrage && !k.angebot && !k.auftrag) return; // einzelne Rechnung ohne Auftrag: kein Ablauf
        kopf.insertAdjacentHTML("afterend", K.ablaufHtml(k, typ));
        var leiste = document.querySelector("#inhalt .ablauf ol"), j = leiste && leiste.querySelector("li.jetzt"); if (j && leiste.scrollWidth > leiste.clientWidth) leiste.scrollLeft = Math.max(0, j.offsetLeft - leiste.clientWidth / 2 + j.offsetWidth / 2);
      } catch (e) { console.warn("Ablauf", e); }
    };
  };
  einhaengen("anfragen", "anfrage"); einhaengen("angebote", "angebot"); einhaengen("auftraege", "auftrag"); einhaengen("rechnungen", "rechnung");
})();

/* Regiebericht in 3 Schritten: 1 Arbeit & Material · 2 Fotos · 3 Unterschrift. Am Handy klebt die Knopfleiste unten. */
(function () {
  var V = K.views, h = U.h; if (!V.berichte) return; var alt = V.berichte.danach;
  V.berichte.danach = async function (id, extra) {
    if (alt) await alt(id, extra);
    var f = document.getElementById("ber-form"), b = K._bericht; if (!f || !b || f.querySelector(".ber-schritte")) return;
    var fotosH = [].slice.call(f.querySelectorAll("h3")).filter(function (x) { return x.textContent === "Fotos"; })[0]; if (fotosH) fotosH.id = "ber-fotos";
    var kn = f.querySelector(".knoepfe"); if (kn) { kn.id = "ber-unterschrift"; kn.classList.add("ber-leiste"); }
    var s = [
      { n: "Arbeit & Material", fertig: !!(b.id && b.taetigkeit), ziel: "#ber-form" },
      { n: "Fotos", fertig: (b.fotos || []).length > 0, ziel: "#ber-fotos" },
      { n: "Unterschrift", fertig: !!b.unterschrift || b.status !== "entwurf", ziel: "#ber-unterschrift" }
    ], jetzt = -1; s.forEach(function (x, i) { if (jetzt < 0 && !x.fertig) jetzt = i; });
    f.insertAdjacentHTML("afterbegin", '<ol class="ber-schritte">' + s.map(function (x, i) {
      return '<li class="' + (x.fertig ? "fertig" : i === jetzt ? "jetzt" : "") + '"><button type="button" data-ziel="' + x.ziel + '"><span>' + (x.fertig ? "✓" : i + 1) + "</span>" + h(x.n) + "</button></li>"; }).join("") + "</ol>");
  };
  document.addEventListener("click", function (e) { var z = e.target.closest && e.target.closest("[data-ziel]"); if (!z) return; var el = document.querySelector(z.dataset.ziel); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
})();
