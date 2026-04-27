export type DetectedLang = "zh" | "en" | "ko" | "unknown";

export function detectInputLang(text: string): DetectedLang {
  const trimmed = text.trim();
  if (!trimmed) return "unknown";

  const zhCount = (trimmed.match(/[\u4e00-\u9fff]/g) || []).length;
  const koCount = (trimmed.match(/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/g) || []).length;
  const enCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const total = trimmed.length;

  if (zhCount / total > 0.2) return "zh";
  if (koCount / total > 0.3) return "ko";
  if (enCount / total > 0.4) return "en";

  if (zhCount > enCount && zhCount > koCount) return "zh";
  if (enCount > zhCount && enCount > koCount) return "en";
  if (koCount > zhCount && koCount > enCount) return "ko";

  return "unknown";
}
