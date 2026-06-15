import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ChatThreadsRail } from "@/components/chat-threads-rail";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Workplace AI" },
      { name: "description", content: "Conversational workplace AI assistant." },
    ],
  }),
  component: ChatLayout,
});

function ChatLayout() {
  return (
    <div className="flex h-[calc(100dvh-3.25rem)] min-h-0">
      <ChatThreadsRail />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}