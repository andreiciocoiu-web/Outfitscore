import type { Config } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

// Genereaza o versiune editata a pozei utilizatorului, cu recomandarile aplicate.
// Claude nu genereaza imagini, asa ca folosim un model Gemini de editare prin Netlify AI Gateway.
// Modelul se poate schimba din variabila IMAGE_MODEL (ex: gemini-2.5-flash-image, mai ieftin).
const MODEL = Netlify.env.get("IMAGE_MODEL") || "gemini-3.1-flash-image";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const clean = (v: unknown, max = 400) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").slice(0, max).trim() : "";

const jsonError = (message: string, status: number) => Response.json({ eroare: message }, { status });

export default async (req: Request) => {
  if (!Netlify.env.get("GEMINI_API_KEY") && !Netlify.env.get("GOOGLE_GEMINI_BASE_URL")) {
    return jsonError("Generarea de imagini nu este activa (AI Gateway Netlify pentru Gemini nu este disponibil).", 503);
  }

  let body: any;
  try { body = await req.json(); } catch { return jsonError("Cerere invalida.", 400); }

  const data = typeof body?.image?.data === "string" ? body.image.data.replace(/^data:[^,]+,/, "") : "";
  const mediaType = ALLOWED_TYPES.includes(body?.image?.mediaType) ? body.image.mediaType : "image/jpeg";
  if (!data) return jsonError("Lipseste poza.", 400);
  if (data.length * 0.75 > MAX_IMAGE_BYTES) return jsonError("Poza este prea mare.", 413);

  const modificari: string[] = (Array.isArray(body?.modificari) ? body.modificari : [])
    .slice(0, 6).map((m: unknown) => clean(m)).filter(Boolean);
  if (!modificari.length) return jsonError("Alege cel putin o recomandare.", 400);

  const prompt = `Edit this photo of a real person. Apply ONLY the following styling changes (written in Romanian):
${modificari.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Strict rules:
- Keep the same person: identical face, facial features, skin tone, body shape, hair color (unless a change above explicitly concerns hair styling), age and expression.
- Keep the same pose, framing, camera angle, background and lighting.
- Change only the clothing, accessories, shoes, makeup or hairstyle elements listed above. Do not beautify, slim, reshape or retouch the person.
- Photorealistic result, natural fabric and makeup textures, no text, no watermarks.`;

  try {
    const ai = new GoogleGenAI({}); // AI Gateway injecteaza GEMINI_API_KEY si GOOGLE_GEMINI_BASE_URL
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: mediaType, data } }, { text: prompt }] }],
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });
    const parts = res.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: any) => p.inlineData?.data);
    if (!imgPart?.inlineData?.data) {
      const reason = res.candidates?.[0]?.finishReason;
      console.error("imagine: no image", reason, parts.map((p: any) => p.text).filter(Boolean).join(" ").slice(0, 300));
      return jsonError("Modelul nu a generat o imagine pentru aceasta poza (posibil refuz de siguranta). Incearca alta poza sau alte recomandari.", 422);
    }
    return Response.json({
      image: imgPart.inlineData.data,
      mediaType: imgPart.inlineData.mimeType || "image/png",
      model: MODEL,
    }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    const status = e?.status ?? e?.code;
    console.error("imagine error", status, e?.message);
    if (status === 429) return jsonError("Prea multe cereri. Asteapta un minut.", 429);
    if (status === 402) return jsonError("Creditele AI Netlify s-au epuizat.", 402);
    return jsonError("Generarea imaginii a esuat. Incearca din nou.", 502);
  }
};

export const config: Config = {
  path: "/api/imagine",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 4 },
};
