import { useSyncExternalStore } from "react";
import { LANGS, RTL_LANGS } from "../lang";

const REGISTRY: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(LANGS).map(([k, v]) => [k, v.ui]),
);
const FALLBACK = "en";
const LANG_CODES: string[] = Object.keys(REGISTRY);

const GLOBAL_KEY = "rhrf-bullseye:lang";
let storageKey = GLOBAL_KEY;

const read = (): string => {
  try {
    const v = window.localStorage.getItem(storageKey);
    if (v && REGISTRY[v]) return v;
  } catch {}
  const nav = typeof navigator !== "undefined" ? navigator.language.slice(0, 2).toLowerCase() : "";
  return REGISTRY[nav] ? nav : FALLBACK;
};

let current = typeof window === "undefined" ? FALLBACK : read();
const listeners = new Set<() => void>();

export function initI18n(perUserKey?: string) {
  if (perUserKey) storageKey = perUserKey;
  current = read();
  listeners.forEach((f) => f());
}

export function setLang(code: string) {
  if (!REGISTRY[code]) return;
  current = code;
  try { window.localStorage.setItem(storageKey, code); } catch {}
  listeners.forEach((f) => f());
}

export function getLang() { return current; }
export function langs() { return LANG_CODES; }

const sub = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

export function useLang(): string {
  return useSyncExternalStore(sub, () => current, () => current);
}

export function translate(lang: string, key: string, params?: Record<string, string | number>, fallback?: string): string {
  const raw = (REGISTRY[lang] && REGISTRY[lang][key]) || REGISTRY[FALLBACK][key] || fallback || key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, p) => (p in params ? String(params[p]) : `{${p}}`));
}

export function useT() {
  const lang = useLang();
  return (key: string, params?: Record<string, string | number>, fallback?: string) => translate(lang, key, params, fallback);
}

export function isRTL(lang: string = current): boolean {
  return RTL_LANGS.has(lang);
}
