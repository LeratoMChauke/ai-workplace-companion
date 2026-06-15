import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const Input = z.object({ notes: z.string().min(10).max(20000) });

const Schema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string().optional(),
      deadline: z.string().optional(),
    }),
  ),
  deadlines: z.array(z.string()),
});

export type NotesSummary = z.infer<typeof Schema>;

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You summarize meeting notes/transcripts. Return a concise summary, key points, decisions, action items with owners and deadlines when available, and any important deadlines mentioned. If something is not present, return an empty array.",
      prompt: data.notes,
      experimental_output: Output.object({ schema: Schema }),
    });
    return output as NotesSummary;
  });