import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ListChecks, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { planTasks, type PlannerResult } from "@/lib/ai/planner.functions";
import { ModuleShell } from "@/components/module-shell";
import { OutputActions } from "@/components/output-actions";
import { RecentList } from "@/components/recent-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveHistory, type HistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      { name: "description", content: "Turn goals into a structured, prioritized plan." },
    ],
  }),
  component: PlannerPage,
});

const priorityColor = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
} as const;

function toMarkdown(r: PlannerResult) {
  return [
    `# Plan\n\n${r.overview}`,
    `\n## Tasks\n${r.tasks
      .map(
        (t) =>
          `- **[${t.priority.toUpperCase()}]** ${t.title} — ${t.estimate}${t.deadline ? ` (by ${t.deadline})` : ""}${t.notes ? `\n  - ${t.notes}` : ""}`,
      )
      .join("\n")}`,
    `\n## Tips\n${r.tips.map((t) => `- ${t}`).join("\n")}`,
  ].join("\n");
}

function PlannerPage() {
  const run = useServerFn(planTasks);
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (goal.trim().length < 3) {
      toast.error("Describe your goal first.");
      return;
    }
    setLoading(true);
    try {
      setResult(await run({ data: { goal } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan");
    } finally {
      setLoading(false);
    }
  };

  const onOpen = (e: HistoryEntry) => {
    setGoal((e.input as { goal: string }).goal);
    setResult(e.output as PlannerResult);
  };

  return (
    <ModuleShell
      icon={<ListChecks className="h-5 w-5" />}
      title="AI Task Planner"
      description="Convert goals into a prioritized to-do list with deadlines."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <Label htmlFor="goal">Your goal or task</Label>
          <Textarea
            id="goal"
            rows={10}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Launch a customer feedback survey by end of month"
          />
          <Button onClick={generate} disabled={loading}>
            {loading ? "Planning…" : "Generate plan"}
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-sm font-semibold">Plan</h3>
          {loading ? (
            <div className="grid place-items-center rounded-lg border border-dashed py-16">
              <Shimmer>Building your plan…</Shimmer>
            </div>
          ) : result ? (
            <div className="space-y-4 text-sm">
              <p className="leading-relaxed">{result.overview}</p>
              <ol className="space-y-2">
                {result.tasks.map((t, i) => (
                  <li key={i} className="rounded-lg border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityColor[t.priority]}`}
                      >
                        {t.priority}
                      </span>
                      <p className="min-w-0 flex-1 font-medium">{t.title}</p>
                      <span className="text-xs text-muted-foreground">{t.estimate}</span>
                    </div>
                    {(t.deadline || t.notes) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.deadline ? `Due: ${t.deadline}` : ""}
                        {t.notes ? `${t.deadline ? " • " : ""}${t.notes}` : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              {result.tips.length > 0 && (
                <div className="rounded-lg border bg-accent/40 p-3">
                  <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb className="h-4 w-4 text-primary" /> Productivity tips
                  </h4>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {result.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              <OutputActions
                text={toMarkdown(result)}
                filename="plan.md"
                onRegenerate={generate}
                regenerating={loading}
                onSave={() => {
                  saveHistory({
                    module: "planner",
                    title: goal.slice(0, 80),
                    input: { goal },
                    output: result,
                  });
                  toast.success("Saved to history");
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Your plan will appear here.</p>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent plans
        </h3>
        <RecentList module="planner" onOpen={onOpen} />
      </section>
    </ModuleShell>
  );
}