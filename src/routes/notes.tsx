import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileText, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { summarizeNotes, type NotesSummary } from "@/lib/ai/notes.functions";
import { ModuleShell } from "@/components/module-shell";
import { OutputActions } from "@/components/output-actions";
import { RecentList } from "@/components/recent-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveHistory, type HistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Workplace AI" },
      { name: "description", content: "Summarize meeting notes into action items and decisions." },
    ],
  }),
  component: NotesPage,
});

function summaryToMarkdown(s: NotesSummary) {
  const lines = [
    `# Meeting summary\n\n${s.summary}`,
    `\n## Key points\n${s.keyPoints.map((k) => `- ${k}`).join("\n")}`,
    `\n## Decisions\n${s.decisions.map((d) => `- ${d}`).join("\n")}`,
    `\n## Action items\n${s.actionItems
      .map(
        (a) =>
          `- ${a.task}${a.owner ? ` — _${a.owner}_` : ""}${a.deadline ? ` (due ${a.deadline})` : ""}`,
      )
      .join("\n")}`,
    `\n## Deadlines\n${s.deadlines.map((d) => `- ${d}`).join("\n")}`,
  ];
  return lines.join("\n");
}

function NotesPage() {
  const run = useServerFn(summarizeNotes);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<NotesSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (notes.trim().length < 10) {
      toast.error("Please paste meeting notes (at least 10 characters).");
      return;
    }
    setLoading(true);
    try {
      setResult(await run({ data: { notes } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  const onOpen = (e: HistoryEntry) => {
    setNotes((e.input as { notes: string }).notes);
    setResult(e.output as NotesSummary);
  };

  return (
    <ModuleShell
      icon={<FileText className="h-5 w-5" />}
      title="Meeting Notes Summarizer"
      description="Paste raw notes or a transcript; get structured highlights."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <Label htmlFor="notes">Raw meeting notes / transcript</Label>
          <Textarea
            id="notes"
            rows={18}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your notes here…"
          />
          <Button onClick={generate} disabled={loading}>
            {loading ? "Summarizing…" : "Summarize"}
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h3 className="text-sm font-semibold">Summary</h3>
          {loading ? (
            <div className="grid place-items-center rounded-lg border border-dashed py-16">
              <Shimmer>Reading your notes…</Shimmer>
            </div>
          ) : result ? (
            <div className="space-y-4 text-sm">
              <p className="leading-relaxed">{result.summary}</p>
              <Section title="Key points" icon={<CheckCircle2 className="h-4 w-4 text-primary" />}>
                {result.keyPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </Section>
              <Section title="Decisions" icon={<AlertCircle className="h-4 w-4 text-primary" />}>
                {result.decisions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </Section>
              <div>
                <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Action items
                </h4>
                <ul className="space-y-1">
                  {result.actionItems.map((a, i) => (
                    <li key={i} className="rounded-md border bg-background p-2">
                      <p className="font-medium">{a.task}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.owner ? `Owner: ${a.owner}` : "No owner"}
                        {a.deadline ? ` • Due ${a.deadline}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <Section title="Deadlines" icon={<Calendar className="h-4 w-4 text-primary" />}>
                {result.deadlines.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </Section>
              <OutputActions
                text={summaryToMarkdown(result)}
                filename="meeting-summary.md"
                onRegenerate={generate}
                regenerating={loading}
                onSave={() => {
                  saveHistory({
                    module: "notes",
                    title: result.summary.slice(0, 80),
                    input: { notes },
                    output: result,
                  });
                  toast.success("Saved to history");
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your structured summary will appear here.
            </p>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent summaries
        </h3>
        <RecentList module="notes" onOpen={onOpen} />
      </section>
    </ModuleShell>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </h4>
      <ul className="list-disc space-y-1 pl-5 text-sm">{children}</ul>
    </div>
  );
}