/* =====================================================================
   Kundario – Datenzugriff
   Zwei Wege mit derselben Schnittstelle:
   - Supabase (echter Betrieb): Anmeldung über /auth/v1, Daten über /rest/v1.
     Keine fremde Bibliothek nötig, nur fetch.
   - Testmodus (ohne Server): alles bleibt in diesem Browser. Nur zum Ausprobieren.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.KUNDARIO_CONFIG || {};
  var SITZUNG = "kundario-sitzung";
  var lies = function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  var schreib = function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat */ } };
  function Fehler(text, code) { var e = new Error(text); e.code = code; return e; }

  /* ---------------- Supabase über fetch ---------------- */
  function supabase(url, key) {
    url = url.replace(/\/+$/, "");
    var sitzung = lies(SITZUNG), horcher = [];
    function kopf(mitNutzer) {
      var h = { apikey: key, "Content-Type": "application/json" };
      if (mitNutzer && sitzung && sitzung.access_token) h.Authorization = "Bearer " + sitzung.access_token;
      else if (/^eyJ/.test(key)) h.Authorization = "Bearer " + key;   // alte anon-Schlüssel sind JWT
      return h;
    }
    function setze(s) {
      sitzung = s ? { access_token: s.access_token, refresh_token: s.refresh_token, ablauf: Date.now() + ((s.expires_in || 3600) - 60) * 1000, user: s.user } : null;
      schreib(SITZUNG, sitzung); horcher.forEach(function (f) { try { f(sitzung && sitzung.user); } catch (e) { /* weiter */ } });
    }
    async function antwort(r) {
      var t = await r.text(), d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
      if (!r.ok) {
        var m = (d && (d.msg || d.message || d.error_description || d.error)) || ("Fehler " + r.status);
        throw Fehler(uebersetze(m), d && (d.code || d.error_code) || r.status);
      }
      return d;
    }
    async function frisch() {
      if (!sitzung || !sitzung.refresh_token) return;
      if (Date.now() < sitzung.ablauf) return;
      try {
        var d = await antwort(await holen(url + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: kopf(false), body: JSON.stringify({ refresh_token: sitzung.refresh_token }) }));
        setze(d);
      } catch (e) { if (e.code === "offline") throw e; setze(null); throw Fehler("Bitte melden Sie sich erneut an.", "abgemeldet"); }
    }
    /* Offline: zuletzt geladene Listen bleiben auf dem Gerät lesbar, Schreiben braucht Netz */
    var CACHE = "kundario-offline", cache = lies(CACHE) || {}, cacheTimer;
    function merke(pfad, d) {
      var t = JSON.stringify(d); if (t.length > 400000) return;
      cache[pfad] = { t: Date.now(), d: d }; var k = Object.keys(cache);
      if (k.length > 160) k.sort(function (a, b) { return cache[a].t - cache[b].t; }).slice(0, k.length - 160).forEach(function (x) { delete cache[x]; });
      clearTimeout(cacheTimer); cacheTimer = setTimeout(function () { try { localStorage.setItem(CACHE, JSON.stringify(cache)); } catch (e) { cache = {}; schreib(CACHE, null); } }, 400);
    }
    var netzFehler = function (e) { return e && (e.name === "TypeError" || e.code === "offline"); };
    async function holen(adresse, opt) {
      try { return await fetch(adresse, opt); }
      catch (e) { throw Fehler("Keine Internetverbindung. Bitte später erneut versuchen.", "offline"); }
    }
    async function rest(methode, pfad, body, extra) {
      try { await frisch(); } catch (e) { if (!(netzFehler(e) && methode === "GET" && cache[pfad])) throw e; }
      var h = kopf(true); if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
      try {
        var d = await antwort(await holen(url + "/rest/v1/" + pfad, { method: methode, headers: h, body: body == null ? undefined : JSON.stringify(body) }));
        if (methode === "GET") merke(pfad, d); else api.offline = false;
        if (methode === "GET") api.offline = false;
        return d;
      } catch (e) {
        if (e.code === "offline" && methode === "GET" && cache[pfad]) { api.offline = true; return cache[pfad].d; }
        if (e.code === "offline") api.offline = true;
        throw e;
      }
    }
    function filter(f) {
      var q = [];
      Object.keys(f || {}).forEach(function (k) {
        var v = f[k];
        if (v === null) q.push(encodeURIComponent(k) + "=is.null");
        else if (Array.isArray(v)) q.push(encodeURIComponent(k) + "=in.(" + v.map(function (x) { return '"' + String(x).replace(/"/g, "") + '"'; }).join(",") + ")");
        else q.push(encodeURIComponent(k) + "=eq." + encodeURIComponent(v));
      });
      return q;
    }
    // Hash nach Bestätigungs- oder Passwort-Link auswerten
    (function () {
      var h = location.hash.replace(/^#/, ""); if (!/access_token=/.test(h)) return;
      var p = {}; h.split("&").forEach(function (x) { var i = x.indexOf("="); p[decodeURIComponent(x.slice(0, i))] = decodeURIComponent(x.slice(i + 1)); });
      sitzung = { access_token: p.access_token, refresh_token: p.refresh_token, ablauf: Date.now() + ((+p.expires_in || 3600) - 60) * 1000, user: null, typ: p.type };
      schreib(SITZUNG, sitzung); history.replaceState(null, "", location.pathname + location.search + (p.type === "recovery" ? "#passwort-neu" : ""));
    })();

    var api = {
      modus: "supabase", offline: false,
      auth: {
        nutzer: async function () {
          if (!sitzung) return null;
          if (sitzung.user && Date.now() < sitzung.ablauf) return sitzung.user;
          try { await frisch(); var u = await antwort(await holen(url + "/auth/v1/user", { headers: kopf(true) })); sitzung.user = u; schreib(SITZUNG, sitzung); return u; }
          catch (e) { if (e.code === "offline" && sitzung && sitzung.user) return sitzung.user; setze(null); return null; }   // ohne Netz angemeldet bleiben
        },
        registrieren: async function (email, passwort, name) {
          var d = await antwort(await fetch(url + "/auth/v1/signup?redirect_to=" + encodeURIComponent(location.origin + location.pathname), { method: "POST", headers: kopf(false), body: JSON.stringify({ email: email, password: passwort, data: { name: name } }) }));
          if (d && d.access_token) { setze(d); return { angemeldet: true }; }
          return { bestaetigen: true };
        },
        anmelden: async function (email, passwort) {
          setze(await antwort(await fetch(url + "/auth/v1/token?grant_type=password", { method: "POST", headers: kopf(false), body: JSON.stringify({ email: email, password: passwort }) })));
          return sitzung.user;
        },
        abmelden: async function () { try { await fetch(url + "/auth/v1/logout", { method: "POST", headers: kopf(true) }); } catch (e) { /* trotzdem */ } cache = {}; schreib(CACHE, null); schreib("kundario-warteschlange", null); setze(null); },
        passwortVergessen: async function (email) {
          await antwort(await fetch(url + "/auth/v1/recover?redirect_to=" + encodeURIComponent(location.origin + location.pathname), { method: "POST", headers: kopf(false), body: JSON.stringify({ email: email }) }));
        },
        passwortSetzen: async function (pw) { await frisch(); await antwort(await fetch(url + "/auth/v1/user", { method: "PUT", headers: kopf(true), body: JSON.stringify({ password: pw }) })); },
        beiAenderung: function (f) { horcher.push(f); }
      },
      liste: function (tabelle, o) {
        o = o || {}; var q = ["select=" + encodeURIComponent(o.select || "*")].concat(filter(o.wo));
        if (o.suche && o.suche.q) {   // Volltext light: jedes Wort muss in einem der Felder vorkommen
          String(o.suche.q).trim().split(/\s+/).slice(0, 5).forEach(function (w) {
            w = w.replace(/[(),*.:]/g, ""); if (!w) return;
            q.push("or=" + encodeURIComponent("(" + o.suche.felder.map(function (f) { return f + ".ilike.*" + w + "*"; }).join(",") + ")"));
          });
        }
        if (o.sortiere) q.push("order=" + encodeURIComponent(o.sortiere));
        if (o.limit) q.push("limit=" + o.limit);
        return rest("GET", tabelle + "?" + q.join("&"));
      },
      eins: async function (tabelle, id) { var d = await rest("GET", tabelle + "?select=*&id=eq." + encodeURIComponent(id)); return d && d[0] || null; },
      neu: async function (tabelle, obj) { var d = await rest("POST", tabelle, obj, { Prefer: "return=representation" }); return Array.isArray(d) ? d[0] : d; },
      melden: async function (tabelle, obj) { await rest("POST", tabelle, obj, { Prefer: "return=minimal" }); },
      viele: async function (tabelle, liste, konflikt, fortschritt) {   // in Paketen zu 500, bei gleichem Schlüssel aktualisieren
        for (var i = 0; i < liste.length; i += 500) {
          await rest("POST", tabelle + (konflikt ? "?on_conflict=" + konflikt : ""), liste.slice(i, i + 500), { Prefer: (konflikt ? "resolution=merge-duplicates," : "") + "return=minimal" });
          if (fortschritt) fortschritt(Math.min(liste.length, i + 500), liste.length);
        }
        return liste.length;
      },
      funktion: async function (name, daten) {   // Supabase Edge Function aufrufen (z. B. E-Mail-Versand)
        await frisch();
        return antwort(await holen(url + "/functions/v1/" + name, { method: "POST", headers: kopf(true), body: JSON.stringify(daten) }));
      },
      aendern: async function (tabelle, id, patch) { var d = await rest("PATCH", tabelle + "?id=eq." + encodeURIComponent(id), patch, { Prefer: "return=representation" }); if (!d || !d.length) throw Fehler("Keine Berechtigung oder Eintrag nicht gefunden."); return d[0]; },
      loeschen: async function (tabelle, id) { var d = await rest("DELETE", tabelle + "?id=eq." + encodeURIComponent(id), null, { Prefer: "return=representation" }); if (!d || !d.length) throw Fehler("Löschen ist nur für Geschäftsführung und Büro erlaubt."); },
      rpc: function (fn, args) { return rest("POST", "rpc/" + fn, args || {}); },
      mitgliedAendern: async function (b, u, patch) { var d = await rest("PATCH", "mitglieder?betrieb_id=eq." + encodeURIComponent(b) + "&user_id=eq." + encodeURIComponent(u), patch, { Prefer: "return=representation" }); if (!d || !d.length) throw Fehler("Nur die Geschäftsführung darf Rollen ändern."); return d[0]; },
      datei: {
        hoch: async function (pfad, file) {
          await frisch();
          var h = kopf(true); h["Content-Type"] = file.type || "application/octet-stream"; h["x-upsert"] = "false";
          await antwort(await fetch(url + "/storage/v1/object/dokumente/" + pfad.split("/").map(encodeURIComponent).join("/"), { method: "POST", headers: h, body: file }));
          return pfad;
        },
        link: async function (pfad) {
          var d = await antwort(await fetch(url + "/storage/v1/object/sign/dokumente/" + pfad.split("/").map(encodeURIComponent).join("/"), { method: "POST", headers: kopf(true), body: JSON.stringify({ expiresIn: 600 }) }));
          return url + "/storage/v1" + d.signedURL;
        }
      }
    };
    return api;
  }

  /* ---------------- Testmodus im Browser ---------------- */
  function lokal() {
    var DB = "kundario-testdaten", data = lies(DB) || { users: [], tabellen: {} }, horcher = [];
    var sitzung = lies(SITZUNG);
    var speichere = function () { schreib(DB, data); };
    var uuid = function () { return (crypto.randomUUID ? crypto.randomUUID() : "x" + Date.now().toString(16) + Math.random().toString(16).slice(2)); };
    var token = function () { var a = new Uint8Array(18); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); };
    var T = function (n) { return data.tabellen[n] || (data.tabellen[n] = []); };
    var ich = function () { return sitzung && sitzung.user; };
    function mitglied(b) { var u = ich(); return u && T("mitglieder").filter(function (m) { return m.betrieb_id === b && m.user_id === u.id && m.aktiv; })[0]; }
    var FIN = ["rechnungen", "uebergaben", "zahlungen", "nachrichten", "ablauf_laeufe", "ausgaben", "kontostaende", "kasse"], VERTR = ["angebote"];
    var istBetreiber = function () { var u = ich(); return !!u && (data.betreiber || []).indexOf(u.id) > -1; };
    var PARTNER_T = ["partner", "partner_meldungen", "vertraege"];
    function darfPartner(tabelle, zeile, aktion) {   // wie Update 011
      if (istBetreiber()) return true; var u = ich(); if (!u) return false;
      if (tabelle === "partner") return aktion === "lesen" && zeile.user_id === u.id;
      if (tabelle === "partner_meldungen") { var pa = T("partner").filter(function (x) { return x.id === zeile.partner_id && x.user_id === u.id; })[0]; if (!pa) return false; if (aktion === "lesen") return true; return aktion === "neu" && pa.aktiv && zeile.quelle === "meldung" && zeile.status === "offen" && !zeile.betrieb_id; }
      return false;
    }
    function darf(tabelle, zeile, aktion) {
      if (PARTNER_T.indexOf(tabelle) > -1) return darfPartner(tabelle, zeile, aktion);
      var bid = tabelle === "betriebe" ? zeile.id : zeile.betrieb_id, m = mitglied(bid); if (!m) return false;
      if (tabelle === "belege") return aktion === "neu" || m.rolle === "gf" || m.rolle === "buero";   // jeder darf einreichen, nur Büro sieht
      if (FIN.indexOf(tabelle) > -1) return m.rolle === "gf" || m.rolle === "buero";
      if (VERTR.indexOf(tabelle) > -1) return m.rolle !== "monteur";
      if (tabelle === "betriebe" || tabelle === "einladungen") return aktion === "lesen" || m.rolle === "gf";
      if (tabelle === "mitglieder") return aktion === "lesen" || m.rolle === "gf";
      if (aktion === "loeschen") return m.rolle === "gf" || m.rolle === "buero";
      return true;
    }
    var STANDARD = {
      betriebe: { stundensatz: 64, mwst: 19, zahlungsziel_tage: 14, angebot_gueltig_tage: 30, nachfass_tage: [3, 7, 14], nachfassen_automatisch: false, zaehler: {} },
      anfragen: { status: "neu", kanal: "telefon" }, kunden: { art: "privat", bewertung_ok: true, ansprechpartner_liste: [] },
      angebote: { status: "entwurf", positionen: [], mwst: 19, netto: 0, brutto: 0, erinnert: 0, steuerfall: "normal", portal_aktiv: true }, auftraege: { status: "geplant", wert_netto: 0, kalk: {}, portal_aktiv: true },
      termine: { art: "ausfuehrung", mitarbeiter: [], kunde_sichtbar: true }, aufgaben: { erledigt: false }, berichte: { status: "entwurf", stunden: 0, material: [], material_euro: 0, zusatzleistung: false, fotos: [] },
      rechnungen: { status: "entwurf", art: "rechnung", positionen: [], mwst: 19, netto: 0, brutto: 0, mahnstufe: 0, steuerfall: "normal", lohn_netto: 0, portal_aktiv: true }, material: { status: "warenkorb", einheit: "Stk.", menge: 1 },
      nachrichten: { status: "freigabe", kanal: "email" }, ablauf_laeufe: { status: "freigabe", versuche: 1, protokoll: [] }, dokumente: { kunde_sichtbar: false }, aufmasse: { daten: {} }, partner: { art: "vertrieb", aktiv: true }, partner_meldungen: { quelle: "meldung", status: "offen" }, vertraege: { tarif: "Grundpreis", einrichtung: 750, monatsbeitrag: 249, bezahlt: [] }, objekte: { einheiten: 1 }, anlagen: {}, fristen: { status: "offen", grundlage: "eigen" },
      artikel: { typ: "leistung", einheit: "Stk.", preis: 0, aktiv: true }, vorlagen: { positionen: [] }, zeiten: { pause_min: 0 }, wartungen: { intervall_monate: 12, aktiv: true }, protokolle: { werte: {} }, lager: { einheit: "Stk.", bestand: 0, ort: "Lager" }, ausgaben: { wiederholung: "einmalig" }, kontostaende: {}, belege: { status: "offen", netto: 0, ust: 0, brutto: 0, steuer13b: false }, kasse: { ust_satz: 0 }
    };
    function kasseNeu(r) {   // wie der Datenbank-Trigger: fortlaufend, nie negativ, Storno übernimmt Werte
      var alle = T("kasse").filter(function (x) { return x.betrieb_id === r.betrieb_id; });
      var lok = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
      if (r.datum && r.datum > lok) throw Fehler("Kassenbuchungen dürfen nicht in der Zukunft liegen.");
      if (r.storno_von) { var o = alle.filter(function (x) { return x.id === r.storno_von; })[0]; if (!o) throw Fehler("Zu stornierende Buchung nicht gefunden."); if (o.storno_von) throw Fehler("Eine Storno-Buchung kann nicht storniert werden."); if (alle.some(function (x) { return x.storno_von === o.id; })) throw Fehler("Diese Buchung ist schon storniert."); ["art", "betrag", "ust_satz", "kategorie", "rechnung_id"].forEach(function (k) { r[k] = o[k]; }); }
      var w = function (x) { return (x.storno_von ? -1 : 1) * (["einnahme", "einlage", "von_bank"].indexOf(x.art) > -1 ? +x.betrag : -x.betrag); };
      var bestand = alle.reduce(function (s, x) { return s + w(x); }, 0);
      if (Math.round((bestand + w(r)) * 100) < 0) throw Fehler("Der Kassenbestand darf nicht negativ werden (Bestand " + bestand.toFixed(2).replace(".", ",") + " €).");
      r.nr = alle.reduce(function (m, x) { return Math.max(m, x.nr); }, 0) + 1; r.datum = r.datum || lok; r.erstellt_von = ich().id;
    }
    var MIT_TOKEN = ["angebote", "auftraege", "rechnungen"];
    function passt(z, wo) { return Object.keys(wo || {}).every(function (k) { var v = wo[k]; if (v === null) return z[k] == null; if (Array.isArray(v)) return v.indexOf(z[k]) > -1; return String(z[k]) === String(v); }); }
    var heute = function () { return new Date().toISOString().slice(0, 10); };
    async function warte() { data = lies(DB) || data; return new Promise(function (r) { setTimeout(r, 0); }); }   // immer frisch lesen (mehrere Tabs)

    var api = {
      modus: "lokal",
      auth: {
        nutzer: async function () { return ich() || null; },
        registrieren: async function (email, pw, name) {
          email = String(email).toLowerCase().trim();
          if (data.users.some(function (u) { return u.email === email; })) throw Fehler("Diese E-Mail ist schon registriert.");
          if (String(pw).length < 8) throw Fehler("Das Passwort muss mindestens 8 Zeichen haben.");
          var u = { id: uuid(), email: email, pw: pw, user_metadata: { name: name } }; data.users.push(u); speichere();
          sitzung = { user: { id: u.id, email: u.email, user_metadata: u.user_metadata } }; schreib(SITZUNG, sitzung); horcher.forEach(function (f) { f(sitzung.user); });
          return { angemeldet: true };
        },
        anmelden: async function (email, pw) {
          email = String(email).toLowerCase().trim();
          var u = data.users.filter(function (x) { return x.email === email && x.pw === pw; })[0];
          if (!u) throw Fehler("E-Mail oder Passwort ist falsch.");
          sitzung = { user: { id: u.id, email: u.email, user_metadata: u.user_metadata } }; schreib(SITZUNG, sitzung); horcher.forEach(function (f) { f(sitzung.user); }); return sitzung.user;
        },
        abmelden: async function () { sitzung = null; schreib(SITZUNG, null); horcher.forEach(function (f) { f(null); }); },
        passwortVergessen: async function () { throw Fehler("Im Testmodus gibt es keinen E-Mail-Versand."); },
        passwortSetzen: async function (pw) { var u = data.users.filter(function (x) { return x.id === ich().id; })[0]; u.pw = pw; speichere(); },
        beiAenderung: function (f) { horcher.push(f); }
      },
      liste: async function (tabelle, o) {
        await warte(); o = o || {};
        var z = T(tabelle).filter(function (r) { return darf(tabelle, r, "lesen") && passt(r, o.wo); });
        if (o.suche && o.suche.q) { var ws = String(o.suche.q).toLowerCase().trim().split(/\s+/); z = z.filter(function (r) { return ws.every(function (w) { return o.suche.felder.some(function (f) { return String(r[f] || "").toLowerCase().indexOf(w) > -1; }); }); }); }
        if (o.sortiere) { var p = o.sortiere.split("."), f = p[0], ab = p[1] === "desc"; z = z.slice().sort(function (a, b) { var x = a[f], y = b[f]; if (x == null) return 1; if (y == null) return -1; return (x < y ? -1 : x > y ? 1 : 0) * (ab ? -1 : 1); }); }
        if (o.limit) z = z.slice(0, o.limit);
        return JSON.parse(JSON.stringify(z));
      },
      eins: async function (tabelle, id) { var r = (await api.liste(tabelle, { wo: { id: id } }))[0]; return r || null; },
      melden: async function (tabelle, obj) { return api.neu(tabelle, obj); },
      viele: async function (tabelle, liste, konflikt) {   // Massen-Import, bei gleichem Schlüssel aktualisieren
        var keys = konflikt ? konflikt.split(",") : null, n = 0;
        for (var i = 0; i < liste.length; i++) {
          var o = liste[i], alt = keys ? T(tabelle).filter(function (x) { return keys.every(function (k) { return x[k] != null && x[k] === o[k]; }); })[0] : null;
          if (alt) { if (!darf(tabelle, alt, "aendern")) throw Fehler("Keine Berechtigung."); Object.assign(alt, JSON.parse(JSON.stringify(o))); }
          else { var r = Object.assign({ id: uuid(), created_at: new Date().toISOString() }, JSON.parse(JSON.stringify(STANDARD[tabelle] || {})), o); if (!darf(tabelle, r, "neu")) throw Fehler("Keine Berechtigung."); T(tabelle).push(r); }
          n++;
        }
        speichere(); return n;
      },
      neu: async function (tabelle, obj) {
        await warte();
        var r = Object.assign({ id: uuid(), created_at: new Date().toISOString() }, JSON.parse(JSON.stringify(STANDARD[tabelle] || {})), obj);
        if (MIT_TOKEN.indexOf(tabelle) > -1 && !r.portal_token) r.portal_token = token();
        if (tabelle === "einladungen" && !r.token) r.token = token();
        if (!darf(tabelle, r, "neu")) throw Fehler("Keine Berechtigung.");
        if (tabelle === "kasse") kasseNeu(r);
        T(tabelle).push(r); speichere(); return JSON.parse(JSON.stringify(r));
      },
      aendern: async function (tabelle, id, patch) {
        await warte();
        if (tabelle === "kasse") throw Fehler("Kassenbuchungen können nicht geändert werden. Bitte stornieren.");
        var r = T(tabelle).filter(function (x) { return x.id === id; })[0];
        if (!r || !darf(tabelle, r, "aendern")) throw Fehler("Keine Berechtigung oder Eintrag nicht gefunden.");
        Object.assign(r, JSON.parse(JSON.stringify(patch))); speichere(); return JSON.parse(JSON.stringify(r));
      },
      loeschen: async function (tabelle, id) {
        await warte();
        if (tabelle === "kasse") throw Fehler("Kassenbuchungen können nicht gelöscht werden. Bitte stornieren.");
        var r = T(tabelle).filter(function (x) { return x.id === id; })[0];
        if (!r || !darf(tabelle, r, "loeschen")) throw Fehler("Löschen ist nur für Geschäftsführung und Büro erlaubt.");
        data.tabellen[tabelle] = T(tabelle).filter(function (x) { return x !== r; }); speichere();
      },
      rpc: async function (fn, a) {
        await warte(); a = a || {}; var u = ich();
        if (fn === "betrieb_anlegen") {
          if (!u) throw Fehler("Nicht angemeldet");
          if (T("mitglieder").some(function (m) { return m.user_id === u.id; })) throw Fehler("Sie gehören bereits zu einem Betrieb");
          var b = Object.assign({ id: uuid(), name: a.p_name, gewerk: a.p_gewerk, inhaber: a.p_inhaber, email: u.email, anfrage_token: token(), created_at: new Date().toISOString() }, JSON.parse(JSON.stringify(STANDARD.betriebe)));
          T("betriebe").push(b); T("mitglieder").push({ betrieb_id: b.id, user_id: u.id, rolle: "gf", name: a.p_inhaber || u.email, email: u.email, aktiv: true }); speichere(); return b.id;
        }
        if (fn === "portal_betrieb" || fn === "anfrage_einreichen") {   // wie in der Datenbank (Update 009)
          var bb = T("betriebe").filter(function (y) { return y.anfrage_token && y.anfrage_token === a.p_token && String(a.p_token).length >= 24 && y.gewerk !== "Hausverwaltung"; })[0];
          if (fn === "portal_betrieb") return bb ? { name: bb.name, gewerk: bb.gewerk, ort: bb.ort, telefon: bb.telefon, email: bb.email } : null;
          if (!bb) throw Fehler("Anfrage-Link ungültig");
          var tr = function (v) { return String(v == null ? "" : v).trim(); };
          if (!tr(a.p_name) || a.p_name.length > 120) throw Fehler("Bitte einen Namen angeben");
          if (!tr(a.p_email) && !tr(a.p_telefon)) throw Fehler("Bitte E-Mail oder Telefon angeben");
          if (tr(a.p_email) && (a.p_email.length > 200 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(tr(a.p_email)))) throw Fehler("E-Mail-Adresse prüfen");
          if (!tr(a.p_betreff) || a.p_betreff.length > 200 || tr(a.p_text).length > 5000 || tr(a.p_ort).length > 300 || tr(a.p_telefon).length > 50) throw Fehler("Angaben zu lang oder Betreff fehlt");
          var std = Date.now() - 36e5; if (T("anfragen").filter(function (y) { return y.betrieb_id === bb.id && y.kanal === "formular" && new Date(y.created_at).getTime() > std; }).length >= 20) throw Fehler("Gerade sind sehr viele Anfragen eingegangen. Bitte später erneut versuchen oder anrufen.");
          var kk = tr(a.p_email) ? T("kunden").filter(function (y) { return y.betrieb_id === bb.id && String(y.email || "").toLowerCase() === tr(a.p_email).toLowerCase(); })[0] : null;
          var adr = /^(.+?),\s*(\d{5})\s+(.+)$/.exec(tr(a.p_ort));
          if (!kk) { kk = Object.assign({ id: uuid(), created_at: new Date().toISOString() }, JSON.parse(JSON.stringify(STANDARD.kunden)), { betrieb_id: bb.id, art: ["privat", "firma", "hausverwaltung"].indexOf(a.p_art) > -1 ? a.p_art : "privat", name: tr(a.p_name), email: tr(a.p_email) || null, telefon: tr(a.p_telefon) || null, strasse: adr ? adr[1].trim() : null, plz: adr ? adr[2] : null, ort: adr ? adr[3].trim() : (tr(a.p_ort) || null), quelle: "Anfrage-Link" }); T("kunden").push(kk); }
          T("anfragen").push(Object.assign({ id: uuid(), created_at: new Date().toISOString() }, JSON.parse(JSON.stringify(STANDARD.anfragen)), { betrieb_id: bb.id, kunde_id: kk.id, kanal: "formular", betreff: tr(a.p_betreff), beschreibung: tr(a.p_text) || null, ort: tr(a.p_ort) || null, status: "neu" }));
          speichere(); return { betrieb: bb.name };
        }
        if (fn === "ist_betreiber") return istBetreiber();
        if (fn === "testbetreiber_werden") { if (!u) throw Fehler("Nicht angemeldet"); data.betreiber = (data.betreiber || []).concat([u.id]); speichere(); return true; }   // nur im Testmodus
        if (fn === "ich_partner") {
          if (!u) return null; T("partner").forEach(function (x) { if (!x.user_id && x.aktiv && String(x.email).toLowerCase() === String(u.email).toLowerCase()) x.user_id = u.id; }); speichere();
          var pp = T("partner").filter(function (x) { return x.user_id === u.id && x.aktiv; })[0]; return pp ? { id: pp.id, name: pp.name, code: pp.code, art: pp.art } : null;
        }
        if (fn === "partner_code_setzen") {
          var mm = mitglied(a.p_betrieb); if (!mm || mm.rolle !== "gf") throw Fehler("Nur die Geschäftsführung");
          var be = T("betriebe").filter(function (x) { return x.id === a.p_betrieb; })[0]; if (be.partner_code || Date.now() - new Date(be.created_at).getTime() > 7 * 864e5) return false;
          var pc = T("partner").filter(function (x) { return x.code === String(a.p_code || "").trim().toUpperCase() && x.aktiv; })[0]; if (!pc) return false;
          be.partner_code = pc.code; T("partner_meldungen").push(Object.assign({ id: uuid(), am: new Date().toISOString() }, { partner_id: pc.id, betrieb_name: be.name, ort: be.ort || null, quelle: "link", status: "offen", betrieb_id: be.id })); speichere(); return true;
        }
        if (fn === "partner_uebersicht") {
          var ich0 = T("partner").filter(function (x) { return u && x.user_id === u.id; })[0]; if (!ich0) return [];
          return T("partner_meldungen").filter(function (m) { return m.partner_id === ich0.id; }).sort(function (x, y) { return x.am < y.am ? 1 : -1; }).map(function (m) {
            var v = T("vertraege").filter(function (y) { return m.betrieb_id && y.betrieb_id === m.betrieb_id; })[0];
            return { id: m.id, betrieb_name: m.betrieb_name, ort: m.ort, quelle: m.quelle, am: m.am, status: m.status, grund: m.grund, vertrag: m.status === "angenommen" && v ? { beginn: v.beginn, einrichtung: v.einrichtung, monatsbeitrag: v.monatsbeitrag, gekuendigt_am: v.gekuendigt_am, bezahlt: (v.bezahlt || []).slice(0, 2), provision_bezahlt_am: v.provision_bezahlt_am } : null };
          });
        }
        if (fn === "betreiber_betriebe") { if (!istBetreiber()) throw Fehler("Nur für den Betreiber"); return T("betriebe").map(function (b0) { return { id: b0.id, name: b0.name, gewerk: b0.gewerk, ort: b0.ort, created_at: b0.created_at, partner_code: b0.partner_code || null }; }); }
        if (fn === "einladung_annehmen") {
          var i = T("einladungen").filter(function (x) { return x.token === a.p_token && !x.angenommen_at; })[0];
          if (!i) throw Fehler("Einladung ungültig oder schon verwendet");
          if (i.email.toLowerCase() !== u.email) throw Fehler("Die Einladung gilt für eine andere E-Mail-Adresse");
          T("mitglieder").push({ betrieb_id: i.betrieb_id, user_id: u.id, rolle: i.rolle, name: i.name, email: u.email, aktiv: true }); i.angenommen_at = new Date().toISOString(); speichere(); return i.betrieb_id;
        }
        if (fn === "naechste_nr") {
          if (!mitglied(a.p_betrieb)) throw Fehler("Kein Zugriff");
          var bb = T("betriebe").filter(function (x) { return x.id === a.p_betrieb; })[0], j = new Date().getFullYear(), s = a.p_art + "-" + j;
          bb.zaehler[s] = (bb.zaehler[s] || 0) + 1; speichere(); return s + "-" + ("000" + bb.zaehler[s]).slice(-4);
        }
        var betriebVon = function (id) { var x = T("betriebe").filter(function (y) { return y.id === id; })[0] || {}; return { name: x.name, telefon: x.telefon, email: x.email, strasse: x.strasse, plz: x.plz, ort: x.ort, ust_id: x.ust_id, steuernummer: x.steuernummer, bank: x.bank, iban: x.iban, bic: x.bic, logo: x.logo, kleinunternehmer: x.kleinunternehmer }; };
        var kundeVon = function (id) { var x = T("kunden").filter(function (y) { return y.id === id; })[0] || {}; return { name: x.name, strasse: x.strasse, plz: x.plz, ort: x.ort, ust_id: x.ust_id }; };
        if (fn === "portal_angebot") {
          var an = T("angebote").filter(function (x) { return x.portal_token === a.p_token && x.portal_aktiv !== false && ["gesendet", "angenommen", "abgelehnt"].indexOf(x.status) > -1; })[0]; if (!an) return null;
          return { angebot: an, kunde: kundeVon(an.kunde_id), betrieb: betriebVon(an.betrieb_id) };
        }
        if (fn === "portal_angebot_antwort") {
          var x = T("angebote").filter(function (y) { return y.portal_token === a.p_token && y.portal_aktiv !== false; })[0];
          if (!x) throw Fehler("Link ungültig"); if (x.status !== "gesendet") throw Fehler("Dieses Angebot wurde bereits beantwortet");
          if (x.gueltig_bis && x.gueltig_bis < heute()) throw Fehler("Das Angebot ist abgelaufen. Bitte melden Sie sich beim Betrieb.");
          if (a.p_annehmen) {
            if (!String(a.p_name || "").trim() || !a.p_unterschrift) throw Fehler("Bitte Name und Unterschrift angeben");
            Object.assign(x, { status: "angenommen", angenommen_at: new Date().toISOString(), angenommen_name: a.p_name.trim(), unterschrift: a.p_unterschrift });
            T("verlauf").push({ id: uuid(), betrieb_id: x.betrieb_id, bezug_typ: "angebot", bezug_id: x.id, text: "Angebot " + x.nr + " im Kundenportal angenommen von " + a.p_name.trim(), created_at: new Date().toISOString() });
            if (x.anfrage_id) { var aa = T("anfragen").filter(function (y) { return y.id === x.anfrage_id; })[0]; if (aa) aa.status = "gewonnen"; }
          } else {
            Object.assign(x, { status: "abgelehnt", ablehngrund: (a.p_grund || "").slice(0, 500) });
            T("verlauf").push({ id: uuid(), betrieb_id: x.betrieb_id, bezug_typ: "angebot", bezug_id: x.id, text: "Angebot " + x.nr + " im Kundenportal abgelehnt" + (a.p_grund ? ": " + a.p_grund.slice(0, 200) : ""), created_at: new Date().toISOString() });
          }
          speichere(); return x.status;
        }
        if (fn === "portal_auftrag") {
          var au = T("auftraege").filter(function (y) { return y.portal_token === a.p_token && y.portal_aktiv !== false; })[0]; if (!au) return null;
          return { auftrag: au, kunde: kundeVon(au.kunde_id), betrieb: betriebVon(au.betrieb_id),
            termine: T("termine").filter(function (t) { return t.auftrag_id === au.id && t.kunde_sichtbar; }),
            rechnungen: T("rechnungen").filter(function (r) { return r.auftrag_id === au.id && r.status !== "entwurf" && r.portal_aktiv !== false; }).map(function (r) { return { nr: r.nr, datum: r.datum, faellig: r.faellig, brutto: r.brutto, status: r.status, token: r.portal_token }; }),
            berichte: T("berichte").filter(function (r) { return r.auftrag_id === au.id && r.status !== "entwurf"; }) };
        }
        if (fn === "portal_rechnung") {
          var re = T("rechnungen").filter(function (y) { return y.portal_token === a.p_token && y.portal_aktiv !== false && y.status !== "entwurf"; })[0]; if (!re) return null;
          var bez = T("zahlungen").filter(function (z) { return z.rechnung_id === re.id; }).reduce(function (s, z) { return s + (+z.betrag); }, 0);
          return { rechnung: Object.assign({}, re, { bezahlt: bez }), kunde: kundeVon(re.kunde_id), betrieb: betriebVon(re.betrieb_id) };
        }
        throw Fehler("Unbekannte Funktion " + fn);
      },
      datei: {
        hoch: async function (pfad, file) {
          if (file.size > 3e6) throw Fehler("Im Testmodus höchstens 3 MB je Datei.");
          var url = await new Promise(function (ok, nein) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = nein; r.readAsDataURL(file); });
          data.dateien = data.dateien || {}; data.dateien[pfad] = url; speichere(); return pfad;
        },
        link: async function (pfad) { return (data.dateien || {})[pfad] || ""; }
      },
      mitgliedAendern: async function (b, u, patch) {
        var m = T("mitglieder").filter(function (x) { return x.betrieb_id === b && x.user_id === u; })[0], ich0 = mitglied(b);
        if (!m || !ich0 || ich0.rolle !== "gf") throw Fehler("Nur die Geschäftsführung darf Rollen ändern.");
        Object.assign(m, patch); speichere(); return m;
      },
      testdatenLoeschen: function () { localStorage.removeItem(DB); localStorage.removeItem(SITZUNG); }
    };
    return api;
  }

  function uebersetze(m) {
    var T = {
      "Invalid login credentials": "E-Mail oder Passwort ist falsch.",
      "Email not confirmed": "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse (Link in der E-Mail).",
      "User already registered": "Diese E-Mail ist schon registriert. Bitte melden Sie sich an.",
      "Password should be at least 6 characters.": "Das Passwort muss mindestens 8 Zeichen haben.",
      "Failed to fetch": "Keine Verbindung zum Server. Bitte Internet prüfen."
    };
    if (T[m]) return T[m];
    if (/rate limit/i.test(m)) return "Zu viele Versuche. Bitte warten Sie ein paar Minuten.";
    if (/JWT expired/i.test(m)) return "Bitte melden Sie sich erneut an.";
    if (/violates row-level security|permission denied/i.test(m)) return "Dafür fehlt Ihnen die Berechtigung.";
    if (/duplicate key/i.test(m)) return "Dieser Eintrag existiert schon.";
    return m;
  }

  var aktiv = CFG.supabaseUrl && CFG.supabaseKey ? supabase(CFG.supabaseUrl, CFG.supabaseKey) : lokal();
  window.KDB = aktiv;
})();
