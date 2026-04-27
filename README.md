# Korean Daily Helper

A web app for learning everyday Korean slang, net-speak, and casual expressions used by young people in Seoul.

## What it does

- **Example Mode**: Describe a scene in any language, get 3 natural Korean sentences young people actually say. Each comes with an English translation.
- **Dialogue Mode**: Practice back-and-forth conversation. The AI sets a scene, shows a Korean dialogue, then suggests possible replies you could say next — with translations.
- **TTS**: Click the speaker icon next to any Korean sentence to hear it spoken aloud.
- **Favorites**: Save sentences you want to review later.

## Tech stack

React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Upload to GitHub

```bash
# Init repo
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit"

# Add your remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git push -u origin main
```

## Configure API

The app uses a generic OpenAI-compatible API endpoint. Open the settings gear icon in the app header and fill in:

- **API URL** — your endpoint, e.g. `https://models.inference.ai.azure.com`
- **API Key** — your key
- **Model** — e.g. `gpt-4o-mini`

If left empty, the app falls back to the browser's built-in `speechSynthesis` for Korean TTS.

## Supabase Edge Functions (optional)

Three Edge Functions live in `supabase/functions/`:

- `korean-chat` — proxies chat completions to your LLM API
- `speech-to-text` — STT proxy (replace `YOUR_API_GATEWAY` in the source)
- `text-to-speech` — TTS proxy (replace `YOUR_API_GATEWAY` in the source)

Deploy with the Supabase CLI after updating the placeholder URLs.

## License

MIT