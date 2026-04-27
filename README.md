# Real Talk, Real Confidence: Korean Daily Helper

> **Implementation of the Daily Language Learning Model for International Students.**

This project is the technical implementation of the language learning model proposed in my PPT. Unlike traditional textbooks, this web app focuses on the gap between textbook Korean and the real-world slang, net-speak, and casual expressions used by young people in Korea.

## 🌟 Key Features

* **Example Mode (Contextual Prompting)**: Input any social scenario (e.g., "Ordering trendy dessert in Seongsu-dong") and get 3 natural, casual Korean sentences with English translations.
* **Dialogue Mode (Social Role-play)**: Practice back-and-forth social interactions. The AI generates context-aware replies to help build conversational muscle memory.
* **Integrated TTS**: Master the rhythm and intonation of casual expressions with real-time pronunciation.

## ⚙️ How to Configure and Run (For Grading)

The application requires an OpenAI-compatible API key to handle language generation. **For security reasons, all API keys have been removed from the source code.**

To test the interactive features, you must configure the settings after launching the app locally:

1. **Setup**: Run `npm install` and `npm run dev`. Open `localhost:5173`.
2. **Configure**: Click the **Settings (Gear icon ⚙️)** in the app header.
3. **Fill Credentials**:
   * **API URL**: Enter your endpoint (e.g., `https://models.inference.ai.azure.com`).
   * **API Key**: Enter your personal API key.
   * **Model**: Specify the model (e.g., `gpt-4o-mini`).
4. **Result**: The "isReady" status will activate, and language interaction will be enabled.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **AI Integration**: OpenAI-compatible API Interface

---
**Author**: Gangding Yu (20223309)  
**Submitted for**: Korean Language Learning Model Proposal Implementation.