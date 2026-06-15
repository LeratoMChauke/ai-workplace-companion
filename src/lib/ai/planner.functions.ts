import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const Input = z.object({ goal: z.string().min(3).max(2000) });

const Schema = z.object({
  overview: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      estimate: z.string(),
      deadline: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  tips: z.array(z.string()),
});

export type PlannerResult = z.infer<typeof Schema>;

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are a productivity coach. Break a user goal into a prioritized, sequenced task list with realistic time estimates and suggested deadlines (relative phrasing like 'Today', 'This week' is fine). Include 2-4 short productivity tips.",
      prompt: `Goal: ${data.goal}`,
      experimental_output: Output.object({ schema: Schema }),
    });
    return output as PlannerResult;
  });