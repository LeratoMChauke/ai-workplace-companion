import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { createThread, loadThreads, upsertThread } from "@/lib/history";

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = [...loadThreads()].sort((a, b) => b.updatedAt - a.updatedAt);
    const target = existing[0] ?? (() => {
      const t = createThread();
      upsertThread(t);
      return t;
    })();
    navigate({ to: "/chat/$threadId", params: { threadId: target.id }, replace: true });
  }, [navigate]);
  return (
    <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">
      Loading chat…
    </div>
  );
}