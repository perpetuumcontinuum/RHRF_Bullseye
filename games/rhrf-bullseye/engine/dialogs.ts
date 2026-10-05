import en from "./dialogs/en";
import ru from "./dialogs/ru";
import es from "./dialogs/es";
import zh from "./dialogs/zh";
import hi from "./dialogs/hi";
import ar from "./dialogs/ar";
import pt from "./dialogs/pt";
import ja from "./dialogs/ja";
import ko from "./dialogs/ko";
import fr from "./dialogs/fr";
import tr from "./dialogs/tr";
import vi from "./dialogs/vi";
import it from "./dialogs/it";
import id from "./dialogs/id";
import pl from "./dialogs/pl";
import uk from "./dialogs/uk";
import th from "./dialogs/th";
import nl from "./dialogs/nl";
import ro from "./dialogs/ro";
import el from "./dialogs/el";
import cs from "./dialogs/cs";
import sv from "./dialogs/sv";
import fi from "./dialogs/fi";
import no from "./dialogs/no";
import da from "./dialogs/da";
import hu from "./dialogs/hu";

type DialogPages = { intro: string[][] };

const DIALOGS: Record<string, DialogPages> = {
  en,,
  ru,,
  es,,
  zh,,
  hi,,
  ar,,
  pt,,
  ja,,
  ko,,
  fr,,
  tr,,
  vi,,
  it,,
  id,,
  pl,,
  uk,,
  th,,
  nl,,
  ro,,
  el,,
  cs,,
  sv,,
  fi,,
  no,,
  da,,
  hu,
};

export type DialogKey = keyof DialogPages;

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
  const mod = DIALOGS[normalize(lang)] || en;
  return mod[key] || en[key] || [["..."]];
}
