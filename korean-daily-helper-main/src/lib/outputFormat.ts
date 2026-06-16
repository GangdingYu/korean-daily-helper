export const MARKER_SUGGESTIONS = "💡";
export const PREFIX_TRANSLATION_EN = "「Translation」";
export const PREFIX_TRANSLATION_ZH = "「译」";

export function isTranslationLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith(PREFIX_TRANSLATION_EN) || trimmed.startsWith(PREFIX_TRANSLATION_ZH);
}

export function stripTranslationPrefix(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith(PREFIX_TRANSLATION_EN)) {
    return trimmed.slice(PREFIX_TRANSLATION_EN.length).trim();
  }
  if (trimmed.startsWith(PREFIX_TRANSLATION_ZH)) {
    return trimmed.slice(PREFIX_TRANSLATION_ZH.length).trim();
  }
  return trimmed;
}

export const FORMAT_INSTRUCTIONS = [
  "Format:",
  "- One Korean sentence per line.",
  `- Translation on the next line. English: ${PREFIX_TRANSLATION_EN} … Chinese: ${PREFIX_TRANSLATION_ZH} …`,
  `- Dialogue mode: end with a line starting with ${MARKER_SUGGESTIONS}, then 2–3 reply options (Korean + translation each).`,
].join("\n");
