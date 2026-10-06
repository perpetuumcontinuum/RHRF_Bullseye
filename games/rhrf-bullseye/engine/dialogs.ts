import ar from "./dialogs/ar";
import cs from "./dialogs/cs";
import da from "./dialogs/da";
import el from "./dialogs/el";
import en from "./dialogs/en";
import es from "./dialogs/es";
import fi from "./dialogs/fi";
import fr from "./dialogs/fr";
import hi from "./dialogs/hi";
import hu from "./dialogs/hu";
import id from "./dialogs/id";
import it from "./dialogs/it";
import ja from "./dialogs/ja";
import ko from "./dialogs/ko";
import nl from "./dialogs/nl";
import no from "./dialogs/no";
import pl from "./dialogs/pl";
import pt from "./dialogs/pt";
import ro from "./dialogs/ro";
import ru from "./dialogs/ru";
import sv from "./dialogs/sv";
import th from "./dialogs/th";
import tr from "./dialogs/tr";
import uk from "./dialogs/uk";
import vi from "./dialogs/vi";
import zh from "./dialogs/zh";

type DialogModule = { intro: string[][]; skip: string };

const DIALOGS: Record<string, DialogModule> = {
  ar,
  cs,
  da,
  el,
  en,
  es,
  fi,
  fr,
  hi,
  hu,
  id,
  it,
  ja,
  ko,
  nl,
  no,
  pl,
  pt,
  ro,
  ru,
  sv,
  th,
  tr,
  uk,
  vi,
  zh,
};

export type DialogKey = "intro";

function normalize(lang?: string): string {
  const docLang =
    typeof document !== "undefined" && document.documentElement
      ? document.documentElement.lang
      : "";
  const navLang = typeof navigator !== "undefined" ? navigator.language : "";
  const raw = String(lang || docLang || navLang || "en").toLowerCase();
  const base = raw.split("-")[0];
  if (base === "nb" || base === "nn") return "no";
  return DIALOGS[base] ? base : "en";
}

export function getDialogPages(key: DialogKey, lang?: string): string[][] {
  const mod = DIALOGS[normalize(lang)] || DIALOGS.en;
  return mod[key] || DIALOGS.en[key] || [["..."]];
}

export function getDialogSkip(lang?: string): string {
  const mod = DIALOGS[normalize(lang)] || DIALOGS.en;
  return mod.skip || DIALOGS.en.skip || "SKIP";
}