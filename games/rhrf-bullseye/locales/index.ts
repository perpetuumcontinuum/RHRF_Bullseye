import en from "./en";
import ru from "./ru";

// Add a language: drop locales/<code>.ts, then one import + one entry below.
export const REGISTRY: Record<string, Record<string, string>> = { en, ru };
export const FALLBACK = "en";
export const LANG_CODES: string[] = Object.keys(REGISTRY);
