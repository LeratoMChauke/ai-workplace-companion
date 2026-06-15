import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { deleteHistory, listHistory, type HistoryEntry, type HistoryModule } from "@/lib/history";

const labels: Record<HistoryModule, string> = {
  email: "Email",
  notes: "Notes",
  planner: "Plan",
  research: "Research",
};

export function RecentList({
  module,
  onOpen,
  empty = "No saved outputs yet.",
}: {
  module?: HistoryModule;
  onOpen?: (entry: HistoryEntry) => void;
  empty?: string;
}) {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    const refresh = () => setItems(listHistory(module));
    refresh();
    const handler = () => refresh();
    window.addEventListener("awpa:history", handler);
    return () => window.removeEventListener("awpa:history", handler);
  }, [module]);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {items.slice(0, 8).map((e) => (
        <li key={e.id} className="flex items-center gap-3 p-3">
          <span className="inline-flex shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
            {labels[e.module]}
          </span>
          <button
            onClick={() => onOpen?.(e)}
            className="min-w-0 flex-1 text-left"
            type="button"
          >
            <p className="truncate text-sm font-medium">{e.title}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(e.createdAt).toLocaleString()}
            </p>
          </button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => deleteHistory(e.id)}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}