export type HistoryModule = "email" | "notes" | "planner" | "research";

export interface HistoryEntry<TInput = unknown, TOutput = unknown> {
  id: string;
  module: HistoryModule;
  title: string;
  input: TInput;
  output: TOutput;
  createdAt: number;
}

const KEY = "awpa.history.v1";
const MAX = 50;

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  window.dispatchEvent(new CustomEvent("awpa:history"));
}

export function listHistory(module?: HistoryModule): HistoryEntry[] {
  const all = read().sort((a, b) => b.createdAt - a.createdAt);
  return module ? all.filter((e) => e.module === module) : all;
}

export function saveHistory<TInput, TOutput>(
  entry: Omit<HistoryEntry<TInput, TOutput>, "id" | "createdAt">,
) {
  const next: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  write([next, ...read()]);
  return next;
}

export function deleteHistory(id: string) {
  write(read().filter((e) => e.id !== id));
}

export function clearHistory(module?: HistoryModule) {
  write(module ? read().filter((e) => e.module !== module) : []);
}

/* Chat threads */
import type { UIMessage } from "ai";

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const THREADS_KEY = "awpa.chat.threads.v1";

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatThread[]) : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  window.dispatchEvent(new CustomEvent("awpa:threads"));
}

export function upsertThread(thread: ChatThread) {
  const all = loadThreads();
  const idx = all.findIndex((t) => t.id === thread.id);
  if (idx >= 0) all[idx] = thread;
  else all.unshift(thread);
  saveThreads(all);
}

export function deleteThread(id: string) {
  saveThreads(loadThreads().filter((t) => t.id !== id));
}

export function createThread(): ChatThread {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    updatedAt: Date.now(),
    messages: [],
  };
}