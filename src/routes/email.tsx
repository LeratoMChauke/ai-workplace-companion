import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { generateEmail } from "@/lib/ai/email.functions";
import { ModuleShell } from "@/components/module-shell";
import { OutputActions } from "@/components/output-actions";
import { RecentList } from "@/components/recent-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveHistory, type HistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      { name: "description", content: "Generate professional emails with tone control." },
    ],
  }),
  component: EmailPage,
});

type Tone = "formal" | "casual" | "persuasive" | "friendly";

function EmailPage() {
  const run = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!recipient || !purpose || !context) {
      toast.error("Please fill in recipient, purpose, and context.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { recipient, purpose, context, tone } });
      setOutput(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const onOpen = (e: HistoryEntry) => {
    const i = e.input as { recipient: string; purpose: string; context: string; tone: Tone };
    setRecipient(i.recipient);
    setPurpose(i.purpose);
    setContext(i.context);
    setTone(i.tone);
    setOutput(e.output as string);
  };

  return (
    <ModuleShell
      icon={<Mail className="h-5 w-5" />}
      title="Smart Email Generator"
      description="Generate polished emails for any purpose, in any tone."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-sm font-semibold">Inputs</h3>
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              placeholder="e.g. Sarah, my product manager"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              placeholder="e.g. Request a meeting next week"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Context / key points</Label>
            <Textarea
              id="context"
              rows={6}
              placeholder="Provide background, the message, and any details to include."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Generating…" : "Generate email"}
          </Button>
        </section>

        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Output (editable)</h3>
          </div>
          {loading ? (
            <div className="grid place-items-center rounded-lg border border-dashed py-16">
              <Shimmer>Drafting your email…</Shimmer>
            </div>
          ) : (
            <Textarea
              rows={16}
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Your generated email will appear here."
            />
          )}
          <OutputActions
            text={output}
            filename="email.md"
            onRegenerate={generate}
            regenerating={loading}
            onSave={() => {
              saveHistory({
                module: "email",
                title: purpose || "Untitled email",
                input: { recipient, purpose, context, tone },
                output,
              });
              toast.success("Saved to history");
            }}
          />
        </section>
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent emails
        </h3>
        <RecentList module="email" onOpen={onOpen} />
      </section>
    </ModuleShell>
  );
}