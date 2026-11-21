/* Kundario – Rechnung in das Format von Lexware Office bzw. sevDesk umwandeln.
   Eine Quelle für beide: die App lädt die Datei für die Vorschau, die Server-Funktion rechnung-uebergeben zum Senden.
   Kundario legt dort nur einen ENTWURF an: Nummer vergibt und Abschluss macht das Rechnungsprogramm (keine doppelte Nummerierung).
   Quellen: developers.lexware.io (POST /v1/invoices), api.sevdesk.de (POST /Invoice/Factory/saveInvoice), Stand 11/2026. */
(function (g) {
  "use strict";
  var rund = function (x) { return Math.round((+x || 0) * 100) / 100; };
  var zahl = function (v) { if (typeof v === "number") return v; var n = parseFloat(String(v == null ? "" : v).replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); return isNaN(n) ? 0 : n; };
  var tage = function (von, bis) { if (!von || !bis) return null; return Math.max(0, Math.round((new Date(bis + "T12:00:00Z") - new Date(von + "T12:00:00Z")) / 864e5)); };
  var datumDE = function (d) { var t = String(d || "").slice(0, 10).split("-"); return t.length === 3 ? t[2] + "." + t[1] + "." + t[0] : ""; };
  var empfaenger = function (r, kunde) { var d = r.dokument || {}; return d.empfaenger || kunde || {}; };
  var positionen = function (r) { return (r.positionen || []).filter(function (p) { return !p.optional && (p.typ === "titel" || p.typ === "text" || (p.typ === "pos" && String(p.text || "").trim())); }); };
  var satz = function (r) { return r.steuerfall === "13b" || r.steuerfall === "kleinunternehmer" ? 0 : zahl(r.mwst); };

  /* ---------- Lexware Office ---------- */
  var LX_STEUER = { normal: "net", "13b": "constructionService13b", kleinunternehmer: "vatfree" };
  function lexware(r, kunde) {
    if (!r || r.status === "entwurf") throw new Error("Nur gestellte Rechnungen können übergeben werden.");
    var k = empfaenger(r, kunde), s = satz(r), ziel = tage(r.datum, r.faellig);
    var lx = {
      archived: false,
      voucherDate: String(r.datum).slice(0, 10) + "T00:00:00.000+01:00",
      address: { name: String(k.name || "").slice(0, 255) || "Kunde", street: k.strasse || undefined, zip: k.plz || undefined, city: k.ort || undefined, countryCode: "DE" },
      lineItems: positionen(r).map(function (p) {
        if (p.typ !== "pos") return { type: "text", name: String(p.text || "").slice(0, 255) || " ", description: p.langtext || undefined };
        return { type: "custom", name: String(p.text).slice(0, 255), description: p.langtext || undefined, quantity: zahl(p.menge), unitName: String(p.einheit || "Stück").slice(0, 50),
          unitPrice: { currency: "EUR", netAmount: rund(zahl(p.preis)), taxRatePercentage: s }, discountPercentage: zahl(p.rabatt) || 0 };
      }),
      totalPrice: { currency: "EUR" },
      taxConditions: { taxType: LX_STEUER[r.steuerfall] || "net" },
      paymentConditions: ziel != null ? Object.assign({ paymentTermLabel: "Zahlbar bis " + datumDE(r.faellig) + " ohne Abzug", paymentTermDuration: ziel },
        r.skonto_prozent ? { paymentDiscountConditions: { discountPercentage: zahl(r.skonto_prozent), discountRange: +r.skonto_tage || 0 } } : {}) : undefined,
      shippingConditions: { shippingDate: String(r.leistungsdatum || r.datum).slice(0, 10) + "T00:00:00.000+01:00", shippingType: "service" },
      title: r.art === "abschlag" ? "Abschlagsrechnung" : "Rechnung",
      introduction: "Kundario-Rechnung " + (r.nr || "") + (r.leistungszeitraum ? " · Leistungszeitraum: " + r.leistungszeitraum : ""),
      remark: r.steuerfall === "13b" ? "Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG)." : r.steuerfall === "kleinunternehmer" ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." : undefined
    };
    if (!lx.lineItems.some(function (x) { return x.type === "custom"; })) throw new Error("Die Rechnung hat keine Positionen.");
    return JSON.parse(JSON.stringify(lx));   // undefined-Felder entfernen
  }

  /* ---------- sevDesk ----------
     Steuerregeln (taxRule) laut sevDesk-Update 2.0: 1 = umsatzsteuerpflichtig, 5 = Reverse Charge § 13b, 11 = Kleinunternehmer § 19.
     Beim ersten Test mit dem Testkonto prüfen. contactId und sevUserId ermittelt die Server-Funktion. */
  var SD_REGEL = { normal: "1", "13b": "5", kleinunternehmer: "11" };
  function sevdesk(r, kunde, ids) {
    if (!r || r.status === "entwurf") throw new Error("Nur gestellte Rechnungen können übergeben werden.");
    ids = ids || {}; var k = empfaenger(r, kunde), s = satz(r), pos = positionen(r).filter(function (p) { return p.typ === "pos"; });
    if (!pos.length) throw new Error("Die Rechnung hat keine Positionen.");
    return {
      invoice: { id: null, objectName: "Invoice", contact: { id: ids.contactId || 0, objectName: "Contact" }, contactPerson: { id: ids.sevUserId || 0, objectName: "SevUser" },
        invoiceDate: datumDE(r.datum), deliveryDate: datumDE(r.leistungsdatum || r.datum), header: (r.art === "abschlag" ? "Abschlagsrechnung " : "Rechnung ") + (r.nr || ""),
        headText: "Kundario-Rechnung " + (r.nr || "") + (r.leistungszeitraum ? " · Leistungszeitraum: " + r.leistungszeitraum : ""),
        footText: r.steuerfall === "13b" ? "Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG)." : r.steuerfall === "kleinunternehmer" ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." : "",
        timeToPay: tage(r.datum, r.faellig) || 14, discount: 0, address: [k.name, k.strasse, [k.plz, k.ort].filter(Boolean).join(" ")].filter(Boolean).join("\n"),
        addressCountry: { id: 1, objectName: "StaticCountry" }, status: "100", taxRate: 0, taxRule: { id: SD_REGEL[r.steuerfall] || "1", objectName: "TaxRule" }, taxType: "default",
        currency: "EUR", showNet: "1", invoiceType: "RE", mapAll: true },
      invoicePosSave: pos.map(function (p, i) { return { id: null, objectName: "InvoicePos", mapAll: true, quantity: zahl(p.menge), price: rund(zahl(p.preis)), name: String(p.text).slice(0, 255), text: p.langtext || "",
        unity: { id: 1, objectName: "Unity" }, positionNumber: i, discount: zahl(p.rabatt) || 0, taxRate: s }; }),
      invoicePosDelete: null, discountSave: null, discountDelete: null
    };
  }
  // Kontrollsumme: was Kundario erwartet (zum Abgleich mit der Antwort des Rechnungsprogramms)
  function netto(r) { return rund(positionen(r).filter(function (p) { return p.typ === "pos"; }).reduce(function (s, p) { return s + rund(zahl(p.menge) * zahl(p.preis) * (1 - zahl(p.rabatt) / 100)); }, 0)); }

  g.KUebergabe = { lexware: lexware, sevdesk: sevdesk, netto: netto, ANBIETER: { lexware: "Lexware Office", sevdesk: "sevDesk" } };
})(typeof window !== "undefined" ? window : globalThis);
