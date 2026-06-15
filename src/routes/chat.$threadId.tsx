import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChatWindow } from "@/components/chat-window";
import { createThread, loadThreads, upsertThread, type ChatThread } from "@/lib/history";

export const Route = createFileRoute("/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState<ChatThread | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const all = loadThreads();
    const found = all.find((t) => t.id === threadId);
    if (found) {
      setThread(found);
    } else {
      // Unknown thread id from a stale URL: create a fresh one and replace
      const t = createThread();
      t.id = threadId;
      upsertThread(t);
      setThread(t);
    }
  }, [threadId, navigate]);

  if (!thread) {
    return (
      <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">
        Loading chat…
      </div>
    );
  }
  return <ChatWindow key={thread.id} thread={thread} />;
}