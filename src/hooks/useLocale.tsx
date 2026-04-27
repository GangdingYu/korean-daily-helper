import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const STORAGE_KEY = "app_lang";

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en") return saved;
  } catch { /* ignore */ }
  return "en";
}

interface LocaleCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const toggleLang = useCallback(() => {
    setLang("en");
  }, []);

  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  return (
    <Ctx.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be inside LocaleProvider");
  return ctx;
}
