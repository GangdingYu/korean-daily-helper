import { FORMAT_INSTRUCTIONS } from "@/lib/outputFormat";
import { buildRegisterHint } from "@/lib/registerHint";
import type { ChatMode } from "@/types/types";

const REASONING_NOTE =
  "Decide scene, relationship, register, and tone first. Do not print that reasoning—only Korean lines and translations.";

const DIVERSITY_NOTE = [
  "Give three sentences that differ in opening, ending, and tone.",
  "Avoid the same frame with only the last word changed (e.g. three lines like “진짜 너무 ___”).",
  "Example of variety:",
  "- excited: 아 진짜 오늘 너무 좋았어 ㅋㅋ",
  "- casual: 오늘 그냥 괜찮았어",
  "- low-key: 오늘 나쁘지 않았어, 또 가고 싶다",
].join("\n");

export function buildSystemPrompt(mode: ChatMode, userInput: string, customPrompt?: string): string {
  if (customPrompt?.trim()) return customPrompt.trim();

  const registerHint = buildRegisterHint(mode, userInput);

  if (mode === "dialogue") {
    return [
      "Korean conversation practice partner. Stay in the scene.",
      registerHint,
      REASONING_NOTE,
      "Reply as the other person in Korean, then offer 2–3 short reply options the user could say next.",
      "Sound like spoken Korean: fillers (아, 음), particles (ㅋㅋ, ㅠㅠ) where natural.",
      FORMAT_INSTRUCTIONS,
      "No grammar lectures or extra commentary.",
    ].join("\n");
  }

  return [
    "Help learners with everyday Korean young people actually use.",
    registerHint,
    REASONING_NOTE,
    "Give exactly 3 natural Korean sentences for the user's scene, each with a translation.",
    DIVERSITY_NOTE,
    FORMAT_INSTRUCTIONS,
    "No grammar lectures or extra commentary.",
  ].join("\n");
}
