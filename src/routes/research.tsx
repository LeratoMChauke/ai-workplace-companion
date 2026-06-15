import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Sparkles, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { researchQuery, type ResearchResult } from "@/lib/ai/research.functions";
import { ModuleShell } from "@/components/module-shell";
import { OutputActions } from "@/components/output-actions";
import { RecentList } from "@/components/recent-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveHistory, type HistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace AI" },
      { name: "description", content: "Structured research answers with key insights." },
    ],
  }),
  component: ResearchPage,
});

function toMarkdown(r: ResearchResult) {
  return [
    `# Summary\n\n${r.summary}`,
    `\n## Key insights\n${r.insights.map((i) => `- ${i}`).join("\n")}`,
    `\n## Bullets\n${r.bullets.map((b) => `- ${b}`).join("\n")}`,
    `\n## Simple explanation\n${r.simpleExplanation}`,
  ].join("\n");
}

function ResearchPage() {
  const run = useServerFn(researchQuery);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (mode: "summary" | "refine" | "expand" = "summary") => {
    if (query.trim().length < 3) {
      toast.error("Enter a research question.");
      return;
    }
    setLoading(true);
    try {
      const previous = result ? toMarkdown(result) : undefined;
      setResult(await run({ data: { query, mode, previous } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to research");
    } finally {
      setLoading(false);
    }
  };

  const onOpen = (e: HistoryEntry) => {
    setQuery((e.input as { query: string }).query);
    setResult(e.output as ResearchResult);
  };

  return (
    <ModuleShell
      icon={<Search className="h-5 w-5" />}
      title="AI Research Assistant"
      description="Ask anything; get a structured summary with insights."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <Label htmlFor="query">Research question</Label>
          <Textarea
            id="query"
            rows={6}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What are best practices for remote onboarding?"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generate("summary")} disabled={loading}>
              {loading ? "Researching…" : "Research"}
            </Button>
            <Button
              variant="outline"
              onClick={() => generate("refine")}
              disabled={loading || !result}
            >
              Refine
            </Button>
            <Button
              variant="outline"
              onClick={() => generate("expand")}
              disabled={loading || !result}
            >
              Expand
            </Button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-sm font-semibold">Findings</h3>
          {loading ? (
            <div className="grid place-items-center rounded-lg border border-dashed py-16">
              <Shimmer>Researching…</Shimmer>
            </div>
          ) : result ? (
            <div className="space-y-4 text-sm">
              <p className="leading-relaxed">{result.summary}</p>
              <div>
                <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" /> Key insights
                </h4>
                <ul className="list-disc space-y-0.5 pl-5">
                  {result.insights.map((i, k) => (
                    <li key={k}>{i}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-semibold">Quick bullets</h4>
                <ul className="list-disc space-y-0.5 pl-5">
                  {result.bullets.map((b, k) => (
                    <li key={k}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border bg-accent/40 p-3">
                <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-primary" /> In simple terms
                </h4>
                <p>{result.simpleExplanation}</p>
              </div>
              <OutputActions
                text={toMarkdown(result)}
                filename="research.md"
                onRegenerate={() => generate("summary")}
                regenerating={loading}
                onSave={() => {
                  saveHistory({
                    module: "research",
                    title: query.slice(0, 80),
                    input: { query },
                    output: result,
                  });
                  toast.success("Saved to history");
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Findings will appear here.</p>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent research
        </h3>
        <RecentList module="research" onOpen={onOpen} />
      </section>
    </ModuleShell>
  );
}