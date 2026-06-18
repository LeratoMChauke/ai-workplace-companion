# Voice + Translation for Meeting Notes Summarizer

Add audio transcription and bidirectional translation to `/notes`. All AI work runs through the existing Lovable AI Gateway (Gemini multimodal). No new dependencies.

## UX changes (src/routes/notes.tsx)

Input card gains a tabbed input:
- **Text** tab — existing textarea.
- **Audio** tab — drag-and-drop / file picker for `.mp3`, `.wav`, `.m4a`, `.webm`, `.ogg` (max ~20 MB). Shows filename + size, a "Transcribe" button, and a Shimmer while running. After transcription, the resulting text drops into the textarea (editable) and an inline badge shows the detected language (e.g. "Detected: Spanish"). The user can then click **Summarize** as today.

Output card gains a language toggle above the summary:
- Two pill buttons: **English** | **Original ({lang})**, disabled when detected language is already English.
- Switching toggles between two cached summary objects; missing one triggers a translate call and caches the result on the same history entry.

Recent summaries now store both `detectedLanguage`, `summary_en`, and `summary_original` so re-opening restores the toggle state.

## Server functions (new)

### `src/lib/ai/transcribe.functions.ts`
- Input: `{ audioBase64: string, mimeType: string }` (validated with zod, size cap ~20 MB pre-encoded).
- Calls Gemini multimodal via raw fetch to `https://ai.gateway.lovable.dev/v1/chat/completions` (the AI SDK's openai-compatible adapter rejects non-wav/mp3 audio parts; per `ai-multimodal-input` knowledge we POST the chat-completions body directly with `Lovable-API-Key`). Body uses `{ type: "input_audio", input_audio: { data, format } }`.
- System prompt: "Transcribe the audio verbatim. Detect the spoken language. Return JSON `{ transcript, languageCode (BCP-47), languageName }`." Uses `response_format: { type: "json_object" }`.
- Returns parsed JSON. Surfaces 402/429 errors clearly.

### `src/lib/ai/translate.functions.ts`
- Input: `{ text: string, targetLanguage: "en" | string }`.
- Uses existing AI SDK + `createLovableAiGatewayProvider` with `generateText` + `Output.object({ schema: z.object({ translated: z.string() }) })`.
- Returns `{ translated }`.

### `src/lib/ai/notes.functions.ts` (updated)
- Adds optional `language` input; system prompt instructs Gemini to write the summary fields in that language.
- Adds `detectedLanguage` field to the returned schema (defaults to "en" / "English").
- Returns `NotesSummary` unchanged in shape aside from added optional `detectedLanguage`.

## Client flow

1. User picks Audio tab → uploads file → `transcribeAudio({ audioBase64, mimeType })` → fills textarea, stores `detectedLanguage`.
2. User clicks **Summarize** → `summarizeNotes({ notes, language: "en" })` produces `summary_en`. If detected language ≠ English, also (lazily on toggle click) call `summarizeNotes({ notes, language: detectedLanguageName })` for `summary_original`.
3. Toggle swaps between cached summaries; "Copy / Download / Save" act on the currently-displayed one. Markdown filename includes language suffix.
4. `saveHistory` stores `{ notes, detectedLanguage, summaryEn, summaryOriginal }`. `RecentList` re-open restores everything.

## File reading helper

Small client util `src/lib/audio.ts`:
- `fileToBase64(file)` → reads as data URL, splits off `data:...;base64,`.
- `mimeToFormat(mime)` → maps `audio/webm` → `webm`, `audio/mp4`/`audio/x-m4a` → `m4a`, `audio/mpeg` → `mp3`, `audio/wav`/`audio/x-wav` → `wav`, `audio/ogg` → `ogg`, fallback `webm`.
- 20 MB guard with toast error.

## Responsible AI

Existing banner stays. Add a line in the Audio tab's helper text: "Audio is sent to Lovable AI for transcription and is not stored by the app."

## Out of scope

- In-browser recording (per user choice: upload-only).
- Speaker diarization / timestamps.
- Streaming transcription.
- Translating arbitrary user-picked target languages (only EN ↔ detected).
