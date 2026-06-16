import { useCallback, useState } from "react";

const CFG_KEY = "api_config";

export interface ApiConfig {
  url: string;
  key: string;
  model: string;
  systemPrompt: string;
  ttsUrl: string;
}

const defaults: ApiConfig = {
  url: "https://models.inference.ai.azure.com",
  key: "",
  model: "gpt-4o-mini",
  systemPrompt: "",
  ttsUrl: "",
};

function load(): ApiConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function useApiConfig() {
  const [cfg, setCfg] = useState<ApiConfig>(load);

  const save = useCallback((patch: Partial<ApiConfig>) => {
    setCfg((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(CFG_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const isReady = Boolean(cfg.url && cfg.key);

  return { cfg, save, isReady };
}

export function getApiConfig(): ApiConfig {
  return load();
}
