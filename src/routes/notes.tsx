import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileText, CheckCircle2, AlertCircle, Calendar, Upload, Languages } from "lucide-react";
import { toast } from "sonner";
import { summarizeNotes, type NotesSummary } from "@/lib/ai/notes.functions";
import { transcribeAudio } from "@/lib/ai/transcribe.functions";
import { ModuleShell } from "@/components/module-shell";
import { OutputActions } from "@/components/output-actions";
import { RecentList } from "@/components/recent-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { saveHistory, type HistoryEntry } from "@/lib/history";
import { fileToBase64, formatBytes, mimeToFormat, MAX_AUDIO_BYTES } from "@/lib/audio";

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

interface DetectedLanguage {
  code: string;
  name: string;
}

interface NotesHistoryPayload {
  notes: string;
  detectedLanguage: DetectedLanguage;
  summaryEn: NotesSummary | null;
  summaryOriginal: NotesSummary | null;
}

function NotesPage() {
  const run = useServerFn(summarizeNotes);
  const transcribe = useServerFn(transcribeAudio);
  const [notes, setNotes] = useState("");
  const [summaryEn, setSummaryEn] = useState<NotesSummary | null>(null);
  const [summaryOriginal, setSummaryOriginal] = useState<NotesSummary | null>(null);
  const [detected, setDetected] = useState<DetectedLanguage>({ code: "en", name: "English" });
  const [view, setView] = useState<"en" | "original">("en");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEnglish = detected.code.toLowerCase().startsWith("en");
  const result = view === "original" && summaryOriginal ? summaryOriginal : summaryEn;

  const generate = async () => {
    if (notes.trim().length < 10) {
      toast.error("Please paste meeting notes (at least 10 characters).");
      return;
    }
    setLoading(true);
    try {
      const en = await run({ data: { notes, language: "English" } });
      setSummaryEn(en);
      setSummaryOriginal(null);
      setView("en");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  const switchToOriginal = async () => {
    if (isEnglish) return;
    if (summaryOriginal) {
      setView("original");
      return;
    }
    if (!notes.trim()) return;
    setTranslating(true);
    try {
      const orig = await run({ data: { notes, language: detected.name } });
      setSummaryOriginal(orig);
      setView("original");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to translate summary");
    } finally {
      setTranslating(false);
    }
  };

  const onPickAudio = async (file: File) => {
    if (file.size > MAX_AUDIO_BYTES) {
      toast.error("Audio file too large (max 20 MB).");
      return;
    }
    setAudioFile(file);
    setTranscribing(true);
    try {
      const audioBase64 = await fileToBase64(file);
      const format = mimeToFormat(file.type || file.name.split(".").pop() || "");
      const res = await transcribe({
        data: { audioBase64, mimeType: file.type || "audio/webm", format },
      });
      setNotes(res.transcript);
      setDetected({ code: res.languageCode, name: res.languageName });
      setSummaryEn(null);
      setSummaryOriginal(null);
      toast.success(`Transcribed (${res.languageName})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to transcribe");
    } finally {
      setTranscribing(false);
    }
  };

  const onOpen = (e: HistoryEntry) => {
    const out = e.output as NotesSummary | NotesHistoryPayload;
    if (out && typeof out === "object" && "summaryEn" in out) {
      const p = out as NotesHistoryPayload;
      setNotes(p.notes);
      setDetected(p.detectedLanguage);
      setSummaryEn(p.summaryEn);
      setSummaryOriginal(p.summaryOriginal);
      setView(p.summaryEn ? "en" : "original");
    } else {
      setNotes((e.input as { notes: string }).notes);
      setSummaryEn(out as NotesSummary);
      setSummaryOriginal(null);
      setDetected({ code: "en", name: "English" });
      setView("en");
    }
  };

  return (
    <ModuleShell
      icon={<FileText className="h-5 w-5" />}
      title="Meeting Notes Summarizer"
      description="Paste raw notes or a transcript; get structured highlights."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-3 space-y-2">
              <Label htmlFor="notes">Raw meeting notes / transcript</Label>
              <Textarea
                id="notes"
                rows={16}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your notes here…"
              />
            </TabsContent>
            <TabsContent value="audio" className="mt-3 space-y-3">
              <Label>Upload a voice recording</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-6 text-sm transition-colors hover:bg-accent/40"
              >
                <Upload className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {audioFile ? audioFile.name : "Click to choose an audio file"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {audioFile
                    ? formatBytes(audioFile.size)
                    : "MP3, WAV, M4A, WEBM, OGG · up to 20 MB"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onPickAudio(f);
                  e.target.value = "";
                }}
              />
              {transcribing ? (
                <Shimmer>Transcribing & detecting language…</Shimmer>
              ) : notes && audioFile ? (
                <div className="rounded-lg border bg-background p-3 text-xs">
                  <p className="mb-1 flex items-center gap-1 font-semibold text-primary">
                    <Languages className="h-3.5 w-3.5" /> Detected: {detected.name}
                  </p>
                  <p className="line-clamp-4 text-muted-foreground">{notes}</p>
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Audio is sent to Lovable AI for transcription and is not stored by the app.
              </p>
            </TabsContent>
          </Tabs>

          <Button onClick={generate} disabled={loading || transcribing} className="w-full">
            {loading ? "Summarizing…" : "Summarize"}
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Summary</h3>
            {summaryEn && !isEnglish ? (
              <div className="inline-flex rounded-full border bg-background p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setView("en")}
                  className={`rounded-full px-3 py-1 transition-colors ${view === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={switchToOriginal}
                  disabled={translating}
                  className={`rounded-full px-3 py-1 transition-colors ${view === "original" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {translating ? "Translating…" : detected.name}
                </button>
              </div>
            ) : null}
          </div>
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
                filename={`meeting-summary-${view === "original" ? detected.code : "en"}.md`}
                onRegenerate={generate}
                regenerating={loading}
                onSave={() => {
                  const payload: NotesHistoryPayload = {
                    notes,
                    detectedLanguage: detected,
                    summaryEn,
                    summaryOriginal,
                  };
                  saveHistory({
                    module: "notes",
                    title: result.summary.slice(0, 80),
                    input: { notes },
                    output: payload,
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