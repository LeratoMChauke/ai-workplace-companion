import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createThread,
  deleteThread,
  loadThreads,
  upsertThread,
  type ChatThread,
} from "@/lib/history";

export function ChatThreadsRail() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };

  useEffect(() => {
    const refresh = () =>
      setThreads([...loadThreads()].sort((a, b) => b.updatedAt - a.updatedAt));
    refresh();
    window.addEventListener("awpa:threads", refresh);
    return () => window.removeEventListener("awpa:threads", refresh);
  }, []);

  const newChat = () => {
    const t = createThread();
    upsertThread(t);
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  const remove = (id: string) => {
    deleteThread(id);
    if (params.threadId === id) navigate({ to: "/chat" });
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar/40 md:flex">
      <div className="p-3">
        <Button onClick={newChat} className="w-full justify-start gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {threads.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">No chats yet.</p>
        ) : (
          <ul className="space-y-1">
            {threads.map((t) => {
              const active = params.threadId === t.id;
              return (
                <li
                  key={t.id}
                  className={`group flex items-center gap-1 rounded-md px-1 ${active ? "bg-accent" : "hover:bg-accent/60"}`}
                >
                  <Link
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    className="min-w-0 flex-1 truncate px-2 py-2 text-sm"
                    title={t.title}
                  >
                    {t.title || "New chat"}
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete chat"
                    onClick={() => remove(t.id)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}