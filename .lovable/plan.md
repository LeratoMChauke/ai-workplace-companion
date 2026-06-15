# AI Workplace Productivity Assistant — Build Plan

A modern SaaS-style dashboard with five AI modules, soft-blue Copilot-inspired theme, sidebar navigation, and localStorage-backed history. Chatbot supports multiple threads via dedicated routes.

## Stack & Foundations
- TanStack Start + React 19 + Tailwind v4 (existing template)
- Lovable AI Gateway via AI SDK (default model `google/gemini-3-flash-preview`), server boundary = TanStack server functions / chat route
- AI Elements for the chatbot UI (`conversation`, `message`, `prompt-input`, `shimmer`, `tool`)
- shadcn Sidebar for navigation
- localStorage for all history (no auth, no database)

## Design System
Update `src/styles.css` tokens to the soft-blue Copilot palette:
- background `#fafbff`, surface `#eef2ff`, foreground `#1f2937`, primary `#6366f1`
- Rounded-xl cards, soft shadows, generous spacing
- Inter font, accessible contrast, subtle transitions

## Routes (`src/routes/`)
```
__root.tsx              SidebarProvider + AppSidebar + header (app name, profile avatar, Responsible AI badge)
index.tsx               Dashboard: greeting, module cards, recent outputs
email.tsx               Smart Email Generator
notes.tsx               Meeting Notes Summarizer
planner.tsx             AI Task Planner
research.tsx            AI Research Assistant
chat.index.tsx          Chat landing → create/select thread
chat.$threadId.tsx      Threaded chatbot (keyed by threadId)
api/chat.ts             streamText server route for chatbot
```

## Server Functions (`src/lib/ai/*.functions.ts`)
One `createServerFn` per non-chat module, each calling `generateText` through the Lovable Gateway provider helper in `src/lib/ai-gateway.server.ts`:
- `generateEmail` — inputs: purpose, recipient, context, tone (formal/casual/persuasive/friendly)
- `summarizeNotes` — outputs structured summary, action items, decisions, deadlines (Output.object schema)
- `planTasks` — outputs prioritized task list with deadlines + tips (Output.object)
- `researchQuery` — outputs summary, key insights, bullets, with refine/expand mode
- Chat handled by streaming `api/chat.ts` route with `useChat` client

All server fns: zod input validation, surface 429/402 errors.

## Module UI Pattern
Each feature page is a card-based layout:
- Left card: structured inputs (selects, textareas)
- Right card: AI output area — editable textarea/rich result, loading shimmer, action bar (Copy, Download .txt/.md, Regenerate, Refine, Save to history)
- Bottom: Recent outputs strip (localStorage)

## Chatbot
- AI Elements composition: `Conversation` → `Message`/`MessageResponse`, `PromptInput` + `PromptInputTextarea` + `PromptInputFooter` + `PromptInputSubmit`, `Shimmer` "Thinking…"
- Sidebar sub-list of threads with new-thread button and delete
- Routes `/chat/$threadId`; threads + per-thread `UIMessage[]` stored in localStorage, keyed by threadId
- Idempotent bootstrap: on `/chat` create or pick most recent thread, navigate to `/chat/$threadId`
- Chat window keyed by `threadId`; passes `id: threadId` to `useChat`

## History (localStorage)
`src/lib/history.ts` — typed helpers per module:
- `{ id, module, title, input, output, createdAt }`
- Dashboard "Recent outputs" reads across modules
- Each module page lists its own history with re-open / delete

## Responsible AI
- Persistent footer banner + dismissible callout on each module: "AI outputs may be inaccurate — review before use. Do not share confidential data."
- Same disclaimer shown in chat empty state

## Components (`src/components/`)
- `app-sidebar.tsx` (icons: Mail, FileText, ListChecks, Search, MessageSquare)
- `app-header.tsx` (logo, avatar placeholder, theme)
- `module-shell.tsx` (title, description, two-column responsive layout)
- `output-actions.tsx` (copy/download/regenerate/save)
- `recent-list.tsx`
- `responsible-ai-banner.tsx`
- AI Elements installed into `src/components/ai-elements/`

## Responsive
- Sidebar collapses to icons on tablet, offcanvas trigger on mobile
- Module two-column grid stacks under `md`
- Header uses grid + min-w-0 pattern

## Acceptance
- All 5 modules generate via Lovable AI, with loading + editable outputs
- Chatbot supports multiple threads on dedicated URLs, persists in localStorage, restores on reload
- Recent outputs visible on dashboard and per module
- Responsible AI disclaimer always visible
- Works cleanly on desktop, tablet, mobile

## Technical notes
- `attachSupabaseAuth` not needed (no auth)
- AI key handled server-side only; never exposed to client
- Use `Output.object` schemas for summarizer/planner/research to get structured rendering
- `stepCountIs(50)` if any tool loops added later (none in v1)
