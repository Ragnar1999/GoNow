import { useState, useEffect, useCallback } from 'react';
import type { PlayerSummary } from '../api/client';

const STORAGE_KEY = 'gonow_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<PlayerSummary[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((player: PlayerSummary) => {
    setFavorites(prev => {
      if (prev.some(p => p.pin === player.pin)) return prev;
      return [...prev, player];
    });
  }, []);

  const removeFavorite = useCallback((pin: number) => {
    setFavorites(prev => prev.filter(p => p.pin !== pin));
  }, []);

  const isFavorite = useCallback(
    (pin: number) => favorites.some(p => p.pin === pin),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (player: PlayerSummary) => {
      if (isFavorite(player.pin)) {
        removeFavorite(player.pin);
      } else {
        addFavorite(player);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
