import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const Input = z.object({
  query: z.string().min(3).max(2000),
  mode: z.enum(["summary", "refine", "expand"]).default("summary"),
  previous: z.string().max(20000).optional(),
});

const Schema = z.object({
  summary: z.string().default(""),
  insights: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
  simpleExplanation: z.string().default(""),
});

export type ResearchResult = z.infer<typeof Schema>;

export const researchQuery = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const modeInstruction =
      data.mode === "refine"
        ? "Refine and tighten the previous answer below. Improve clarity and remove fluff."
        : data.mode === "expand"
          ? "Expand on the previous answer below with more depth, examples, and nuance."
          : "Produce a fresh structured research answer.";
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system:
          'You are a research assistant. Provide structured, accurate answers. If you are unsure, say so. Avoid fabricating citations. Always return ALL fields of the JSON schema: "summary" (string), "insights" (string[]), "bullets" (string[]), "simpleExplanation" (string). Use empty arrays/strings if you have nothing to add, never omit a field.',
        prompt: `${modeInstruction}\n\nQuery: ${data.query}${data.previous ? `\n\nPrevious answer:\n${data.previous}` : ""}`,
        experimental_output: Output.object({ schema: Schema }),
      });
      return output as ResearchResult;
    } catch (err) {
      // Fallback: ask for plain JSON and parse manually if structured-output parsing failed
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system:
          'You are a research assistant. Respond with ONLY a JSON object, no markdown fences, with keys: summary (string), insights (string[]), bullets (string[]), simpleExplanation (string).',
        prompt: `${modeInstruction}\n\nQuery: ${data.query}${data.previous ? `\n\nPrevious answer:\n${data.previous}` : ""}`,
      });
      const cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const start = cleaned.search(/[\{]/);
      const end = cleaned.lastIndexOf("}");
      if (start === -1 || end === -1) throw err;
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return Schema.parse(parsed);
    }
  });