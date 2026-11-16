// Kundario – KI-Antworten im Assistenten (Supabase Edge Function).
// NOCH NICHT AKTIV. Braucht ein Konto bei einem KI-Anbieter und einen Auftragsverarbeitungsvertrag.
// Vorbereitet für die Anthropic-API (Claude). Es wird nur die Frage geschickt, keine Kundendaten.
//
// Geheimnisse (Supabase → Edge Functions → Secrets): KI_SCHLUESSEL, optional KI_MODELL
// Aufruf aus der App: POST /functions/v1/ki-assistent  { betrieb_id, frage }
const KOPF = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Content-Type": "application/json" };
const antwort = (status: number, daten: unknown) => new Response(JSON.stringify(daten), { status, headers: KOPF });
const GRENZE = 100;   // Fragen je Betrieb und Tag
const zaehler = new Map<string, { tag: string; n: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: KOPF });
  if (req.method !== "POST") return antwort(405, { fehler: "Nur POST" });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  let d: { betrieb_id?: string; frage?: string };
  try { d = await req.json(); } catch { return antwort(400, { fehler: "Ungültige Anfrage" }); }
  const frage = String(d.frage || "").trim().slice(0, 2000);
  if (!token || !d.betrieb_id || !frage) return antwort(400, { fehler: "Frage fehlt" });

  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const r = await fetch(`${url}/rest/v1/betriebe?id=eq.${encodeURIComponent(d.betrieb_id)}&select=id,gewerk`, { headers: { apikey: anon, authorization: `Bearer ${token}` } });
  const b = r.ok ? await r.json() : [];
  if (!b.length) return antwort(403, { fehler: "Kein Zugriff" });
  const heute = new Date().toISOString().slice(0, 10), z = zaehler.get(b[0].id);
  if (z && z.tag === heute && z.n >= GRENZE) return antwort(429, { fehler: "Tagesgrenze erreicht" });
  zaehler.set(b[0].id, { tag: heute, n: z && z.tag === heute ? z.n + 1 : 1 });

  const ki = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": Deno.env.get("KI_SCHLUESSEL")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("KI_MODELL") || "claude-haiku-4-5-20251001", max_tokens: 600,
      system: "Du hilfst Mitarbeitern eines Handwerksbetriebs (Gewerk: " + (b[0].gewerk || "Handwerk") + ") bei Fragen zur Arbeit und zur Software Kundario. Antworte auf Deutsch, kurz und praktisch, in der Sie-Form. Bei Recht, Steuern und Sicherheit nur allgemeine Hinweise geben und auf Fachleute verweisen. Erfinde keine Zahlen, Normen oder Preise.",
      messages: [{ role: "user", content: frage }],
    }),
  });
  if (!ki.ok) { console.error("KI-Fehler", ki.status, await ki.text()); return antwort(502, { fehler: "KI nicht erreichbar" }); }
  const j = await ki.json();
  return antwort(200, { antwort: (j.content || []).map((c: { text?: string }) => c.text || "").join("").trim() });
});
