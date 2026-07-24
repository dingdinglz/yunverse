const STORAGE_KEY = "ring_favorites";

export interface RingFavorite {
  address: string;
  name?: string;
}

export function loadFavorites(): RingFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favs: RingFavorite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export function isFavorite(address: string): boolean {
  return loadFavorites().some((f) => f.address === address);
}

export function addFavorite(fav: RingFavorite) {
  const favs = loadFavorites();
  if (!favs.some((f) => f.address === fav.address)) {
    favs.push(fav);
    saveFavorites(favs);
  }
}

export function removeFavorite(address: string) {
  const favs = loadFavorites().filter((f) => f.address !== address);
  saveFavorites(favs);
}
