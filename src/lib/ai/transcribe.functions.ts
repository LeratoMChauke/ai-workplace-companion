import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1),
  format: z.enum(["mp3", "wav", "m4a", "webm", "ogg"]),
});

export interface TranscriptionResult {
  transcript: string;
  languageCode: string;
  languageName: string;
}

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<TranscriptionResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const body = {
      model: "google/gemini-3-flash-preview",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Transcribe the provided audio verbatim and detect the spoken language. Respond with ONLY a JSON object: {"transcript": string, "languageCode": BCP-47 string (e.g. "en", "es", "fr"), "languageName": English name of the language}. No commentary.',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe this audio and detect the language." },
            {
              type: "input_audio",
              input_audio: { data: data.audioBase64, format: data.format },
            },
          ],
        },
      ],
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Add credits in your Lovable workspace billing.");
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Transcription failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    let parsed: TranscriptionResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Transcription returned unexpected response");
    }
    return {
      transcript: parsed.transcript ?? "",
      languageCode: parsed.languageCode ?? "en",
      languageName: parsed.languageName ?? "English",
    };
  });