import type { ChatMode } from "@/types/types";

type ExamplesIntent = "scenario" | "slang" | "register";
type DialogueDomain = "friends" | "strangers" | "romance" | "workplace";

const EXAMPLES_KEYWORDS: Record<Exclude<ExamplesIntent, "scenario">, RegExp> = {
  slang: /slang|속어|俚语|internet|net.?speak|줄임/i,
  register: /반말|해요|합쇼|formal|informal|register|polite|敬语|语体/i,
};

const DIALOGUE_KEYWORDS: Record<DialogueDomain, RegExp> = {
  friends: /friend|hang out|친구|朋友|buddy|mate/i,
  strangers: /cafe|shop|order|store|market|陌生人|카페|주문|가게/i,
  romance: /date|crush|like someone|喜欢|恋爱|썸|데이트/i,
  workplace: /boss|meeting|colleague|work|office|同事|上司|회사|직장/i,
};

const REGISTER_BY_DOMAIN: Record<DialogueDomain, string> = {
  friends: "반말",
  strangers: "해요체",
  romance: "해요체 (close friends may use 반말)",
  workplace: "합쇼체 or polite 해요체",
};

function classifyExamplesIntent(input: string): ExamplesIntent {
  if (EXAMPLES_KEYWORDS.slang.test(input)) return "slang";
  if (EXAMPLES_KEYWORDS.register.test(input)) return "register";
  return "scenario";
}

function classifyDialogueDomain(input: string): DialogueDomain | null {
  for (const [domain, pattern] of Object.entries(DIALOGUE_KEYWORDS) as [DialogueDomain, RegExp][]) {
    if (pattern.test(input)) return domain;
  }
  return null;
}

export function buildRegisterHint(mode: ChatMode, input: string): string {
  if (mode === "examples") {
    const intent = classifyExamplesIntent(input);
    if (intent === "slang") {
      return "User is asking about slang. Keep lines colloquial; match 반말 or 해요체 to the scene.";
    }
    if (intent === "register") {
      return "User is asking about register. Pick 반말, 해요체, or 합쇼체 explicitly for the relationship described.";
    }
    return "Treat this as a scenario practice request. Pick register from the relationship in the scene.";
  }

  const domain = classifyDialogueDomain(input);
  if (!domain) {
    return "Pick register from the scene (반말 / 해요체 / 합쇼체).";
  }
  return `Scene fits “${domain}”. Prefer ${REGISTER_BY_DOMAIN[domain]}.`;
}
