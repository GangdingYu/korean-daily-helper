import React, { useEffect, useState } from "react";
import { type ApiConfig, useApiConfig } from "@/hooks/useApiConfig";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ApiSettings: React.FC<Props> = ({ open, onClose }) => {
  const { cfg, save } = useApiConfig();
  const [form, setForm] = useState<ApiConfig>(cfg);

  useEffect(() => {
    if (open) setForm(cfg);
  }, [open, cfg]);

  const handleSave = () => {
    save(form);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-background border border-border rounded-sm shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">{t("apiSettings", "en")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        <div className="mb-3 px-3 py-2 bg-accent/30 rounded-sm text-xs text-muted-foreground leading-relaxed">
          Defaults to GitHub Models (gpt-4o-mini). You can also use any OpenAI-compatible API.
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("apiUrl", "en")}</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://models.inference.ai.azure.com"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-sm focus:outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("apiKey", "en")}</label>
            <input
              type="password"
              value={form.key}
              onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              placeholder="ghp_... or sk-..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-sm focus:outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("model", "en")}</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="gpt-4o-mini"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-sm focus:outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("systemPrompt", "en")}</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
              placeholder="(Optional) Custom system prompt"
              rows={3}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-sm focus:outline-none focus:border-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("ttsApiUrl", "en")}</label>
            <input
              type="text"
              value={form.ttsUrl}
              onChange={(e) => setForm((p) => ({ ...p, ttsUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-sm focus:outline-none focus:border-ring"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-sm hover:bg-accent transition-colors"
          >
            {t("close", "en")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              "px-4 py-1.5 text-xs rounded-sm text-white transition-colors",
              form.url && form.key
                ? "bg-primary hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            disabled={!form.url || !form.key}
          >
            {t("save", "en")}
          </button>
        </div>
      </div>
    </div>
  );
};
