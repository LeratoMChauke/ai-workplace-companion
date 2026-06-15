import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Mail, FileText, ListChecks, Search, MessageSquare, ArrowRight } from "lucide-react";
import { RecentList } from "@/components/recent-list";
import { ResponsibleAiBanner } from "@/components/responsible-ai-banner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      {
        name: "description",
        content: "Your AI-powered workplace dashboard. Email, notes, planning, research, and chat.",
      },
    ],
  }),
  component: Dashboard,
});

const modules = [
  { to: "/email", icon: Mail, title: "Smart Email Generator", desc: "Draft polished emails with tone control." },
  { to: "/notes", icon: FileText, title: "Meeting Notes Summarizer", desc: "Summarize transcripts into action items." },
  { to: "/planner", icon: ListChecks, title: "AI Task Planner", desc: "Turn goals into prioritized to-dos." },
  { to: "/research", icon: Search, title: "AI Research Assistant", desc: "Structured answers and key insights." },
  { to: "/chat", icon: MessageSquare, title: "AI Chat", desc: "Conversational workplace assistant." },
] as const;

function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-fuchsia-500/10 p-6 sm:p-8 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Your AI workplace assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Save time on email, meetings, planning, and research. Pick a tool to get started.
        </p>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground">
                <m.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">{m.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{m.desc}</p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent outputs
        </h2>
        <RecentList />
      </section>

      <div className="mt-8">
        <ResponsibleAiBanner />
      </div>
    </div>
  );
}
