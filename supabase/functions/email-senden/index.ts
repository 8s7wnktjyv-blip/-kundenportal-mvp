// Kundario – E-Mails direkt aus der App senden (Supabase Edge Function).
// NOCH NICHT AKTIV. Wird erst eingeschaltet, wenn ein E-Mail-Anbieter mit Server in der EU
// und Auftragsverarbeitungsvertrag gewählt ist. Funktioniert mit jedem Anbieter, der SMTP anbietet.
//
// Geheimnisse (nur in Supabase → Edge Functions → Secrets, nie in der App):
//   SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, ABSENDER (z. B. "Kundario <post@ihre-domain.de>")
// SUPABASE_URL und SUPABASE_ANON_KEY stellt Supabase automatisch bereit.
//
// Aufruf aus der App: POST /functions/v1/email-senden mit dem Anmelde-Token des Nutzers
//   { betrieb_id, an, betreff, text, antwort_an? }
import nodemailer from "npm:nodemailer@6.9.16";

const KOPF = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Content-Type": "application/json" };
const antwort = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: KOPF });
const emailOk = (s: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s);
const TAGES_GRENZE = 200;   // E-Mails je Betrieb und Tag, gegen Missbrauch
const zaehler = new Map<string, { tag: string; n: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: KOPF });
  if (req.method !== "POST") return antwort(405, { fehler: "Nur POST" });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!token) return antwort(401, { fehler: "Nicht angemeldet" });

  let d: { betrieb_id?: string; an?: string; betreff?: string; text?: string; antwort_an?: string };
  try { d = await req.json(); } catch { return antwort(400, { fehler: "Ungültige Anfrage" }); }
  const an = String(d.an || "").trim(), betreff = String(d.betreff || "").trim().slice(0, 200), text = String(d.text || "").slice(0, 20000);
  if (!d.betrieb_id || !emailOk(an) || !betreff || !text) return antwort(400, { fehler: "Empfänger, Betreff und Text angeben" });

  // Prüfen, ob der Nutzer Mitglied des Betriebs ist – mit seinem eigenen Token, also unter den normalen Zugriffsregeln
  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const r = await fetch(`${url}/rest/v1/betriebe?id=eq.${encodeURIComponent(d.betrieb_id)}&select=id,name,email`, { headers: { apikey: anon, authorization: `Bearer ${token}` } });
  const betriebe = r.ok ? await r.json() : [];
  if (!betriebe.length) return antwort(403, { fehler: "Kein Zugriff auf diesen Betrieb" });
  const betrieb = betriebe[0];

  const heute = new Date().toISOString().slice(0, 10), z = zaehler.get(betrieb.id);
  if (z && z.tag === heute && z.n >= TAGES_GRENZE) return antwort(429, { fehler: "Tagesgrenze für E-Mails erreicht" });
  zaehler.set(betrieb.id, { tag: heute, n: z && z.tag === heute ? z.n + 1 : 1 });

  const port = Number(Deno.env.get("SMTP_PORT") || 587);
  const post = nodemailer.createTransport({ host: Deno.env.get("SMTP_HOST"), port, secure: port === 465, auth: { user: Deno.env.get("SMTP_USER"), pass: Deno.env.get("SMTP_PASS") } });
  const antwortAn = emailOk(String(d.antwort_an || "")) ? d.antwort_an : (emailOk(String(betrieb.email || "")) ? betrieb.email : undefined);
  try {
    // Absender bleibt die eigene Domain (SPF/DKIM), der Betrieb steht im Namen, Antworten gehen an den Betrieb
    const abs = Deno.env.get("ABSENDER")!, adr = (abs.match(/<([^>]+)>/) || [, abs])[1];
    await post.sendMail({ from: { name: String(betrieb.name).slice(0, 80), address: adr }, to: an, replyTo: antwortAn, subject: betreff, text });
    return antwort(200, { ok: true });
  } catch (e) {
    console.error("Versand fehlgeschlagen", e instanceof Error ? e.message : e);
    return antwort(502, { fehler: "Versand fehlgeschlagen" });
  }
});
