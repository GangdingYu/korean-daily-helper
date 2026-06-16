import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTTS } from "@/hooks/useTTS";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FavoriteItem } from "@/types/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const PlayBtn: React.FC<{ state: "idle" | "loading" | "playing"; onClick: () => void }> = ({
  state, onClick,
}) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    title={state === "playing" ? "Stop" : "Play"}
    className={cn(
      "w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors",
      state === "playing" ? "bg-accent text-ring" : "text-muted-foreground hover:text-ring hover:bg-accent"
    )}
  >
    {state === "loading" ? (
      <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
    ) : state === "playing" ? (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <rect x="1.5" y="1" width="2.5" height="8" rx="0.5" />
        <rect x="6" y="1" width="2.5" height="8" rx="0.5" />
      </svg>
    ) : (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M2 1.5l7 3.5-7 3.5V1.5z" />
      </svg>
    )}
  </button>
);

const FavoriteCard: React.FC<{
  item: FavoriteItem;
  selected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onRemove: () => void;
  ttsState: "idle" | "loading" | "playing";
  onPlay: () => void;
}> = ({ item, selected, selectionMode, onSelect, onRemove, ttsState, onPlay }) => (
  <div
    className={cn(
      "flex items-start gap-3 px-4 py-3 border-b border-border/60",
      "transition-colors duration-100",
      selected ? "bg-accent/40" : "hover:bg-muted/30",
      selectionMode && "cursor-pointer"
    )}
    onClick={selectionMode ? onSelect : undefined}
  >
    {selectionMode && (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          "w-5 h-5 rounded-sm border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all",
          selected ? "bg-primary border-primary" : "border-border bg-background hover:border-primary/50"
        )}
      >
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4l3 3 5-6" />
          </svg>
        )}
      </button>
    )}

    <div className="flex-1 min-w-0">
      <p className="korean-text text-sm text-foreground leading-snug">{item.korean}</p>
      {item.translation && (
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.translation}</p>
      )}
      <div className="flex items-center gap-2 mt-1.5">
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-sm font-medium",
          item.source === "dialogue"
            ? "bg-primary/10 text-primary"
            : "bg-accent text-accent-foreground"
        )}>
          {item.source === "dialogue" ? t("sourceDialogue", "en") : t("sourceExamples", "en")}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
          EN
        </span>
        <span className="text-[10px] text-muted-foreground">{formatDate(item.savedAt)}</span>
      </div>
    </div>

    {!selectionMode && (
      <div className="flex items-center gap-1 flex-shrink-0">
        <PlayBtn state={ttsState} onClick={onPlay} />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title={t("delete", "en")}
          className="w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3" />
          </svg>
        </button>
      </div>
    )}
  </div>
);

const EmptyState: React.FC<{ isSearch: boolean }> = ({ isSearch }) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
    <div className="w-12 h-12 rounded-sm bg-accent flex items-center justify-center mb-4">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
        <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.25l-4.33 2.25.83-4.82L3 7.27l4.91-.71z" />
      </svg>
    </div>
    <p className="text-sm font-medium text-foreground mb-1">
      {isSearch ? t("emptySearch", "en") : t("emptyFavorites", "en")}
    </p>
    <p className="text-xs text-muted-foreground">
      {isSearch ? t("emptySearchDesc", "en") : t("emptyFavoritesDesc", "en")}
    </p>
  </div>
);

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const { speak, getState } = useTTS();

  const [query, setQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter(
      (f) => f.korean.toLowerCase().includes(q) || f.translation.toLowerCase().includes(q)
    );
  }, [favorites, query]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((f) => f.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const item = favorites.find((f) => f.id === id);
      if (item) removeFavorite(item.korean);
    });
    toast.success(`${t("deleted", "en")} ${selectedIds.size}`);
    exitSelectionMode();
  };

  const handleSingleDelete = (item: FavoriteItem) => {
    removeFavorite(item.korean);
    toast.success(t("removedFromFavorites", "en"));
  };

  const handlePlay = (item: FavoriteItem) => {
    speak(item.id, item.korean);
  };

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-foreground">{t("favorites", "en")}</h1>
          <p className="text-xs text-muted-foreground">{t("total", "en")} {favorites.length} {t("totalFav", "en")}</p>
        </div>
        {!selectionMode ? (
          <button
            type="button"
            onClick={() => setSelectionMode(true)}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-sm hover:bg-accent transition-colors"
            disabled={favorites.length === 0}
          >
            {t("batchManage", "en")}
          </button>
        ) : (
          <button
            type="button"
            onClick={exitSelectionMode}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-sm hover:bg-accent transition-colors"
          >
            {t("cancel", "en")}
          </button>
        )}
      </header>

      {selectionMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-accent/30 border-b border-border shrink-0">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors"
          >
            <div className={cn(
              "w-4 h-4 rounded-sm border flex items-center justify-center transition-all",
              allSelected ? "bg-primary border-primary" : "border-border bg-background"
            )}>
              {allSelected && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3.5l2.5 2.5 4.5-5" />
                </svg>
              )}
            </div>
            {t("selectAll", "en")}（{filtered.length}）
          </button>
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={selectedIds.size === 0}
            className={cn(
              "text-xs px-3 py-1 rounded-sm transition-colors",
              selectedIds.size > 0
                ? "bg-destructive/90 text-white hover:bg-destructive"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {t("delete", "en")} {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>
        </div>
      )}

      <div className="px-4 py-2.5 border-b border-border shrink-0 bg-card">
        <div className="relative">
          <svg
            width="13" height="13"
            viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          >
            <circle cx="5.5" cy="5.5" r="4" />
            <path d="M8.5 8.5l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search", "en")}
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-background border border-border rounded-sm focus:outline-none focus:border-ring transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState isSearch={query.trim().length > 0} />
        ) : (
          filtered.map((item) => (
            <FavoriteCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              selectionMode={selectionMode}
              onSelect={() => toggleSelect(item.id)}
              onRemove={() => handleSingleDelete(item)}
              ttsState={getState(item.id)}
              onPlay={() => handlePlay(item)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Favorites;
