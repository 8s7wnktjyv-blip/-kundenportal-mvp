// Kundario – Rechnung als ENTWURF an Lexware Office oder sevDesk übergeben (Supabase Edge Function).
// Der API-Schlüssel des Betriebs liegt in der Tabelle „schnittstellen“ (Update 010) und wird nur hier mit dem Dienstschlüssel gelesen.
// Geheimnisse (Supabase → Edge Functions → Secrets): SUPABASE_SERVICE_ROLE_KEY stellt Supabase bereit.
// Optional UEBERGABE_ATTRAPPE=1: nichts senden, nur zeigen, was gesendet würde (zum Testen ohne Testkonto).
//
// Aufruf aus der App: POST /functions/v1/rechnung-uebergeben mit dem Anmelde-Token des Nutzers
//   { rechnung_id, anbieter: "lexware" | "sevdesk", probe?: true }
import "../_shared/uebergabe.js";
// deno-lint-ignore no-explicit-any
const UE = (globalThis as any).KUebergabe;

const KOPF = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Content-Type": "application/json" };
const antwort = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: KOPF });
const LEXWARE = "https://api.lexware.io/v1";
const SEVDESK = "https://my.sevdesk.de/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: KOPF });
  if (req.method !== "POST") return antwort(405, { fehler: "Nur POST" });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!token) return antwort(401, { fehler: "Nicht angemeldet" });
  let d: { rechnung_id?: string; anbieter?: string; probe?: boolean };
  try { d = await req.json(); } catch { return antwort(400, { fehler: "Ungültige Anfrage" }); }
  if (!d.rechnung_id || !["lexware", "sevdesk"].includes(String(d.anbieter))) return antwort(400, { fehler: "Rechnung und Rechnungsprogramm angeben" });

  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, dienst = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const alsNutzer = (pfad: string, init: RequestInit = {}) => fetch(`${url}/rest/v1/${pfad}`, { ...init, headers: { apikey: anon, authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  // Rechnung mit dem Token des Nutzers lesen: Zugriffsregeln gelten (nur Geschäftsführung und Büro sehen Rechnungen)
  const rr = await alsNutzer(`rechnungen?id=eq.${encodeURIComponent(d.rechnung_id)}&select=*`);
  const rechnungen = rr.ok ? await rr.json() : [];
  if (!rechnungen.length) return antwort(403, { fehler: "Kein Zugriff auf diese Rechnung" });
  const r = rechnungen[0];
  const kr = r.kunde_id ? await alsNutzer(`kunden?id=eq.${r.kunde_id}&select=*`) : null;
  const kunde = kr && kr.ok ? (await kr.json())[0] || {} : {};

  let nutzlast: unknown;
  try { nutzlast = d.anbieter === "lexware" ? UE.lexware(r, kunde) : UE.sevdesk(r, kunde, {}); } catch (e) { return antwort(400, { fehler: (e as Error).message }); }

  // Schlüssel mit dem Dienstschlüssel lesen (für Nutzer nie lesbar)
  const sr = await fetch(`${url}/rest/v1/schnittstellen?betrieb_id=eq.${r.betrieb_id}&anbieter=eq.${d.anbieter}&select=api_key`, { headers: { apikey: dienst, authorization: `Bearer ${dienst}` } });
  const schluessel = sr.ok ? ((await sr.json())[0] || {}).api_key : null;
  if (d.probe || Deno.env.get("UEBERGABE_ATTRAPPE") === "1") return antwort(200, { attrappe: true, verbunden: !!schluessel, nutzlast });
  if (!schluessel) return antwort(409, { fehler: `${UE.ANBIETER[d.anbieter!]} ist noch nicht verbunden (Einstellungen → Rechnungsprogramm).` });

  let externId = "";
  try {
    if (d.anbieter === "lexware") {
      const res = await fetch(`${LEXWARE}/invoices`, { method: "POST", headers: { authorization: `Bearer ${schluessel}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(nutzlast) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return antwort(502, { fehler: `Lexware Office meldet: ${j.message || res.status}`, details: j.details || null });
      externId = j.id;
    } else {
      const sd = (pfad: string, init: RequestInit = {}) => fetch(`${SEVDESK}/${pfad}`, { ...init, headers: { authorization: schluessel, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) } });
      const nutzer = await (await sd("SevUser")).json().catch(() => ({}));
      const sevUserId = nutzer.objects && nutzer.objects[0] && nutzer.objects[0].id;
      if (!sevUserId) return antwort(502, { fehler: "sevDesk: Benutzer nicht gefunden – Schlüssel prüfen" });
      const name = String(kunde.name || (r.dokument && r.dokument.empfaenger && r.dokument.empfaenger.name) || "Kunde");
      const such = await (await sd(`Contact?name=${encodeURIComponent(name)}&depth=1`)).json().catch(() => ({}));
      let contactId = such.objects && such.objects[0] && such.objects[0].id;
      if (!contactId) {
        const neu = await (await sd("Contact", { method: "POST", body: JSON.stringify({ name, category: { id: 3, objectName: "Category" } }) })).json().catch(() => ({}));
        contactId = neu.objects && neu.objects.id;
      }
      if (!contactId) return antwort(502, { fehler: "sevDesk: Kontakt konnte nicht angelegt werden" });
      const res = await sd("Invoice/Factory/saveInvoice", { method: "POST", body: JSON.stringify(UE.sevdesk(r, kunde, { contactId, sevUserId })) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return antwort(502, { fehler: `sevDesk meldet: ${(j.error && j.error.message) || res.status}` });
      externId = String(j.objects && j.objects.invoice && j.objects.invoice.id || "");
    }
  } catch (e) { return antwort(502, { fehler: "Rechnungsprogramm nicht erreichbar: " + (e as Error).message }); }

  // Übergabe vermerken (mit dem Token des Nutzers – Zugriffsregeln gelten)
  await alsNutzer("uebergaben", { method: "POST", body: JSON.stringify({ betrieb_id: r.betrieb_id, rechnung_id: r.id, anbieter: d.anbieter, extern_id: externId }) });
  return antwort(200, { ok: true, extern_id: externId });
});
