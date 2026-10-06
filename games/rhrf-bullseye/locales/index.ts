import en from "./en";
import zh from "./zh";
import es from "./es";
import ar from "./ar";
import pt from "./pt";
import id from "./id";
import ja from "./ja";
import ru from "./ru";
import de from "./de";
import fr from "./fr";
import tr from "./tr";
import vi from "./vi";
import ko from "./ko";
import pl from "./pl";
import it from "./it";
import nl from "./nl";
import th from "./th";
import ro from "./ro";
import el from "./el";
import cs from "./cs";
import sv from "./sv";
import da from "./da";
import no from "./no";
import fi from "./fi";
import uk from "./uk";
import hi from "./hi";
import hu from "./hu";

// Add a language: drop locales/<code>.ts, then one import + one entry below.
// scripts/check-locales.mjs fails the build if a file is missing here.
export const REGISTRY: Record<string, Record<string, string>> = {
  en, zh, es, ar, pt, id, ja, ru, de, fr, tr, vi, ko, pl, it, nl, th, ro, el,
  cs, sv, da, no, fi, uk, hi, hu,
};
export const FALLBACK = "en";
export const LANG_CODES: string[] = Object.keys(REGISTRY);

// RTL languages — index.tsx applies dir to the scene container
export const RTL_LANGS: ReadonlySet<string> = new Set(["ar", "he", "fa", "ur"]);