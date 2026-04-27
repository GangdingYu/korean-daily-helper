import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { FavoriteItem, FavoriteSource } from "@/types/types";

const STORAGE_KEY = "korean_favorites_v1";

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  isFavorited: (korean: string) => boolean;
  addFavorite: (korean: string, translation: string, source: FavoriteSource) => void;
  removeFavorite: (korean: string) => void;
  toggleFavorite: (korean: string, translation: string, source: FavoriteSource) => void;
  clearAll: () => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as FavoriteItem[];
      return parsed.map((item) => ({
        ...item,
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
    }
  }, [favorites]);

  const isFavorited = useCallback(
    (korean: string) => favorites.some((f) => f.korean === korean),
    [favorites]
  );

  const addFavorite = useCallback(
    (korean: string, translation: string, source: FavoriteSource) => {
      if (!korean.trim()) return;
      setFavorites((prev) => {
        if (prev.some((f) => f.korean === korean)) return prev;
        const item: FavoriteItem = {
          id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          korean,
          translation,
          savedAt: new Date().toISOString(),
          source,
        };
        return [item, ...prev];
      });
    },
    []
  );

  const removeFavorite = useCallback((korean: string) => {
    setFavorites((prev) => prev.filter((f) => f.korean !== korean));
  }, []);

  const toggleFavorite = useCallback(
    (korean: string, translation: string, source: FavoriteSource) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.korean === korean);
        if (exists) return prev.filter((f) => f.korean !== korean);
        const item: FavoriteItem = {
          id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          korean,
          translation,
          savedAt: new Date().toISOString(),
          source,
        };
        return [item, ...prev];
      });
    },
    []
  );

  const clearAll = useCallback(() => setFavorites([]), []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorited,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearAll,
        count: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
