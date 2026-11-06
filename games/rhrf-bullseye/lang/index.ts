import type { ScenesMap } from "./types";

import en from "./en";
import ru from "./ru";
import cs from "./cs";
import uk from "./uk";
import pl from "./pl";
import es from "./es";
import pt from "./pt";
import fr from "./fr";
import it from "./it";
import de from "./de";
import nl from "./nl";
import sv from "./sv";
import da from "./da";
import no from "./no";
import fi from "./fi";
import hu from "./hu";
import ro from "./ro";
import el from "./el";
import tr from "./tr";
import ar from "./ar";
import hi from "./hi";
import id from "./id";
import vi from "./vi";
import th from "./th";
import ja from "./ja";
import ko from "./ko";
import zh from "./zh";

export type LangModule = { ui: Record<string, string>; skip: string; scenes: ScenesMap };

export const LANGS: Record<string, LangModule> = { en, ru, cs, uk, pl, es, pt, fr, it, de, nl, sv, da, no, fi, hu, ro, el, tr, ar, hi, id, vi, th, ja, ko, zh };

export const RTL_LANGS: ReadonlySet<string> = new Set(["ar", "he", "fa", "ur"]);
