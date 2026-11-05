#!/usr/bin/env python3
import re, sys, glob

MULT = {"rare": 2, "epic": 3, "legendary": 4}
RELOAD = {
 "en":"reload","ru":"перезарядка","uk":"перезарядка","de":"Nachladen","fr":"rechargement",
 "es":"recarga","it":"ricarica","pt":"recarga","nl":"herladen","sv":"omladdning","no":"omlading",
 "da":"genopladning","fi":"lataus","pl":"przeładowanie","cs":"nabíjení","hu":"újratöltés",
 "tr":"yeniden yükleme","el":"επαναγέμιση","ar":"إعادة تلقيم","hi":"रीलोड","id":"muat ulang",
 "th":"บรรจุใหม่","vi":"nạp đạn","ja":"リロード","ko":"재장전","zh":"装弹","ro":"reîncărcare",
}
SHOTS = {
 "en":"shots","ru":"выстрелов","uk":"пострілів","de":"Schüsse","fr":"tirs","es":"disparos",
 "it":"colpi","pt":"tiros","nl":"schoten","sv":"skott","no":"skudd","da":"skud","fi":"laukausta",
 "pl":"strzały","cs":"výstřely","hu":"lövés","tr":"atış","el":"βολές","ar":"طلقات","hi":"शॉट",
 "id":"tembakan","th":"นัด","vi":"lượt bắn","ja":"発","ko":"발","zh":"发","ro":"împușcături",
}
APPLY = "--apply" in sys.argv

def new_text(lang, cat, rar):
    w = RELOAD[lang] if cat == "bow" else SHOTS[lang]
    return f"x{MULT[rar]} {w}"

# 1) catalog.ts (английский fallback в поле description)
cat_path = "games/rhrf-bullseye/engine/catalog.ts"
src = open(cat_path, encoding="utf-8").read()
pat_cat = re.compile(r'(\{ id: "(bow|energy)_(rare|epic|legendary)".*?description: ")([^"]*)(")')
def fix_cat(m):
    return m.group(1) + new_text("en", m.group(2), m.group(3)) + m.group(5)
src2 = pat_cat.sub(fix_cat, src)
if src2 != src:
    print("catalog.ts: updated")
    if APPLY: open(cat_path, "w", encoding="utf-8").write(src2)

# 2) lang/*.ts (локализованные ключи item.<cat>_<rar>.desc)
for path in sorted(glob.glob("games/rhrf-bullseye/lang/*.ts")):
    lang = path.split("/")[-1].replace(".ts", "")
    if lang not in RELOAD:
        print(f"skip {lang} (no dict)"); continue
    txt = open(path, encoding="utf-8").read()
    pat_lang = re.compile(r'("item\.(bow|energy)_(rare|epic|legendary)\.desc":\s*")([^"]*)(")')
    def fix_lang(m):
        return m.group(1) + new_text(lang, m.group(2), m.group(3)) + m.group(5)
    txt2 = pat_lang.sub(fix_lang, txt)
    if txt2 != txt:
        n = len(pat_lang.findall(txt))
        print(f"{lang}: {n} keys")
        if APPLY: open(path, "w", encoding="utf-8").write(txt2)

print("DRY-RUN (добавь --apply для записи)" if not APPLY else "APPLIED")
