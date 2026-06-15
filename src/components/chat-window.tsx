import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { upsertThread, type ChatThread } from "@/lib/history";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export function ChatWindow({ thread }: { thread: ChatThread }) {
  const { messages, sendMessage, status, stop } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message || "Chat error"),
  });
  const isLoading = status === "submitted" || status === "streaming";

  // Persist messages and title as they change
  const lastSerialized = useRef<string>("");
  useEffect(() => {
    const ser = JSON.stringify(messages);
    if (ser === lastSerialized.current) return;
    lastSerialized.current = ser;
    const firstUser = messages.find((m) => m.role === "user");
    const firstText =
      firstUser?.parts.find((p) => p.type === "text")?.text?.slice(0, 60) ?? "New chat";
    upsertThread({
      ...thread,
      title: firstUser ? firstText : thread.title,
      messages: messages as UIMessage[],
      updatedAt: Date.now(),
    });
  }, [messages, thread]);

  const handleSubmit = async (msg: PromptInputMessage) => {
    const text = msg.text.trim();
    if (!text || isLoading) return;
    await sendMessage({ text });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<img src={logo} alt="" className="h-12 w-12" width={48} height={48} />}
              title="How can I help with your work today?"
              description="Ask me to draft, summarize, plan, or research. I'll remember context in this chat."
            />
          ) : (
            messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {m.role === "assistant" ? (
                      <MessageResponse>{text}</MessageResponse>
                    ) : (
                      <p className="whitespace-pre-wrap">{text}</p>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t bg-background/80 p-3 backdrop-blur sm:p-4">
        <PromptInput onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <PromptInputTextarea placeholder="Message your AI assistant…" autoFocus />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={() => stop()} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
          Responsible AI: outputs may be inaccurate. Don't share confidential data.
        </p>
      </div>
    </div>
  );
}