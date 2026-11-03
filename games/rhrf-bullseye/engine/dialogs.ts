import { LANGS } from "../lang";
import type { SceneKey, SceneLine } from "../lang/types";

export type { SceneWho, SceneAction, SceneLine, SceneKey, ScenesMap } from "../lang/types";

function normalize(lang?: string): string {
  const docLang =
    typeof document !== "undefined" && document.documentElement
      ? document.documentElement.lang
      : "";
  const navLang = typeof navigator !== "undefined" ? navigator.language : "";
  const raw = String(lang || docLang || navLang || "en").toLowerCase();
  const base = raw.split("-")[0];
  if (base === "nb" || base === "nn") return "no";
  return LANGS[base] ? base : "en";
}

export function getSceneLines(key: SceneKey, lang?: string): SceneLine[] {
  const mod = LANGS[normalize(lang)] || LANGS.en;
  return mod.scenes?.[key] || LANGS.en.scenes?.[key] || [];
}

export function getDialogSkip(lang?: string): string {
  const mod = LANGS[normalize(lang)] || LANGS.en;
  return mod.skip || LANGS.en.skip || "SKIP";
}
