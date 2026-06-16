# Korean Daily Helper

A small web app for learning everyday Korean—slang, casual speech, and scene-based dialogue. Built as the implementation companion to my term project iteration report.

**Live demo:** [korean-helper-chi.vercel.app](https://korean-helper-chi.vercel.app)

Configure your own API key in the app (gear icon in the header) before chatting.

If you use Supabase voice features, set the following environment variables in your Edge Functions:
- `INTEGRATIONS_API_KEY`
- `CHAT_GATEWAY_URL` (for `korean-chat`)
- `TTS_GATEWAY_URL` and `STT_GATEWAY_URL` (for `text-to-speech` and `speech-to-text`)

## Features

- **Examples** — Describe a situation; get three natural Korean lines with translations.
- **Dialogue** — Role-play a scene; tap suggested replies to continue.
- **Favorites & TTS** — Save lines and hear them with browser speech.

## Prompt design (iteration report)

The system prompt is built in `src/lib/prompts.ts` and matches the report in plain terms:

1. **Register from context** — Keyword hints in `registerHint.ts` nudge 반말 / 해요체 / 합쇼체 from the scene (friends, strangers, romance, workplace).
2. **Less repetition** — Three examples must vary in opening, ending, and tone; a short contrast block shows what to avoid.
3. **Reasoning kept internal** — The model is told to decide scene and register first, without printing that analysis.

Output markers (`💡`, `「Translation」`, `「译」`) live in `outputFormat.ts` and are shared with the message parser.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints, then set **API URL**, **API Key**, and **Model** (e.g. `gpt-4o-mini`) under Settings. Works with any OpenAI-compatible endpoint.

```bash
pnpm build   # production build
pnpm lint    # biome + tsc
```

## Stack

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui. Deployed on Vercel.

## Author

Gangding Yu (20223309) — Term Project #2, Korean Daily Helper.

![Screenshot](./screenshot.png)
