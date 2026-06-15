import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "../ai-gateway.server";

const Input = z.object({
  purpose: z.string().min(1).max(500),
  recipient: z.string().min(1).max(200),
  context: z.string().min(1).max(4000),
  tone: z.enum(["formal", "casual", "persuasive", "friendly"]),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are a professional email writing assistant. Write a complete email with a Subject line on the first line (Subject: ...), then a blank line, then a polished body. Match the requested tone exactly. Be concise and clear. Do not include any commentary.",
      prompt: `Write an email.\n\nRecipient: ${data.recipient}\nPurpose: ${data.purpose}\nTone: ${data.tone}\n\nContext / key points to include:\n${data.context}`,
    });
    return { text };
  });