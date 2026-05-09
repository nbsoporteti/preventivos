const KEY = 'preventivos_resource_favorites_v1';
const MAX = 60;

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* ignore quota */
  }
}

/** @returns {{ id: string, title: string, category: string, fileType: string, savedAt: string }[]} */
export function getFavoriteEntries() {
  return readRaw();
}

export function getFavoriteIds() {
  return new Set(readRaw().map((x) => x.id));
}

export function isFavorite(id) {
  return readRaw().some((x) => x.id === id);
}

/** @param {{ id: string, title: string, category: string, fileType: string }} rec */
export function addFavorite(rec) {
  const items = readRaw().filter((x) => x.id !== rec.id);
  items.unshift({
    id: rec.id,
    title: rec.title,
    category: rec.category,
    fileType: rec.fileType || 'PDF',
    savedAt: new Date().toISOString(),
  });
  writeRaw(items);
}

export function removeFavorite(id) {
  writeRaw(readRaw().filter((x) => x.id !== id));
}

export function toggleFavorite(rec) {
  if (isFavorite(rec.id)) {
    removeFavorite(rec.id);
    return false;
  }
  addFavorite(rec);
  return true;
}
