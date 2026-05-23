const LOCATIONS_KEY = "tip-tracker-locations";
const TOUR_TYPES_KEY = "tip-tracker-tour-types";

const DEFAULT_LOCATIONS = [
  "Universal Studios Florida & Islands of Adventure",
  "Epic Universe",
  "All Parks",
];

const DEFAULT_TOUR_TYPES = ["VIP", "Standard", "Corporate", "Mixed"];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable or full
  }
}

export function getCustomLocations(): string[] {
  const stored = readJson<string[]>(LOCATIONS_KEY, []);
  return stored.length > 0 ? stored : [...DEFAULT_LOCATIONS];
}

export function addCustomLocation(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const current = getCustomLocations();
  if (current.includes(trimmed)) return;
  writeJson(LOCATIONS_KEY, [...current, trimmed]);
}

export function removeCustomLocation(name: string): void {
  const current = getCustomLocations();
  const filtered = current.filter((loc) => loc !== name);
  writeJson(LOCATIONS_KEY, filtered);
}

export function getCustomTourTypes(): string[] {
  const stored = readJson<string[]>(TOUR_TYPES_KEY, []);
  return stored.length > 0 ? stored : [...DEFAULT_TOUR_TYPES];
}

export function addCustomTourType(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const current = getCustomTourTypes();
  if (current.includes(trimmed)) return;
  writeJson(TOUR_TYPES_KEY, [...current, trimmed]);
}

export function removeCustomTourType(name: string): void {
  const current = getCustomTourTypes();
  const filtered = current.filter((type) => type !== name);
  writeJson(TOUR_TYPES_KEY, filtered);
}

export function resetToDefaults(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCATIONS_KEY);
    localStorage.removeItem(TOUR_TYPES_KEY);
  } catch {
    // localStorage unavailable
  }
}
