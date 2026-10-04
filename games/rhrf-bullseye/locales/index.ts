import en from "./en";
import ru from "./ru";
import es from "./es";
import zh from "./zh";
import hi from "./hi";
import ar from "./ar";
import pt from "./pt";
import ja from "./ja";
import de from "./de";
import ko from "./ko";
import fr from "./fr";
import tr from "./tr";
import vi from "./vi";
import it from "./it";
import id from "./id";
import pl from "./pl";
import uk from "./uk";
import th from "./th";
import nl from "./nl";
import ro from "./ro";
import el from "./el";
import cs from "./cs";
import sv from "./sv";
import fi from "./fi";
import no from "./no";
import da from "./da";
import hu from "./hu";

// Add a language: drop locales/<code>.ts, then one import + one entry below.
// scripts/check-locales.mjs fails the build if a file is missing here.
export const REGISTRY: Record<string, Record<string, string>> = {
  en, ru, es, zh, hi, ar, pt, ja, de, ko, fr, tr, vi, it, id,
  pl, uk, th, nl, ro, el, cs, sv, fi, no, da, hu,
};
export const FALLBACK = "en";
export const LANG_CODES: string[] = Object.keys(REGISTRY);

// RTL languages — index.tsx applies dir to the scene container
export const RTL_LANGS: ReadonlySet<string> = new Set(["ar", "he", "fa", "ur"]);
