#!/usr/bin/env python3
import re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent / "games" / "rhrf-bullseye"
LANG = ROOT / "lang"
REF = ROOT / "i18n" / "REFERENCE.md"
SRC = {"ru": "эталон", "en": "ru", "cs": "ru", "uk": "ru", "pl": "ru"}
ORDER = ["ru", "en", "cs", "uk", "pl", "es", "pt", "fr", "it"]
rest = sorted(p.stem for p in LANG.glob("*.ts")
              if p.stem not in ("index", "types", "names") and p.stem not in ORDER)
rows, bad = [], []
for code in ORDER + rest:
    f = LANG / f"{code}.ts"
    if not f.exists():
        bad.append(code); continue
    t = f.read_text(encoding="utf-8")
    scenes = len(re.findall(r"^  [a-zA-Z]+: \[", t, re.M))
    repl = len(re.findall(r'who: "', t))
    ui = len(re.findall(r'^  "[^"]+": "', t, re.M))
    if repl == 97 and scenes == 16 and ui >= 200:
        arc, st = "DONE 97/97", "DONE"
    elif repl == 0:
        arc, st = "TODO", ("DONE" if ui >= 200 else "TODO")
    else:
        arc, st = f"WIP {scenes}/16", ("DONE" if ui >= 200 else "TODO")
    rows.append((code, arc, st, ui, SRC.get(code, "en")))
table = ["| Язык | Аркада (16 сцен) | UI | Ключей UI | Источник |", "|---|---|---|---|---|"]
for c, a, s, u, src in rows:
    table.append(f"| {c} | {a} | {s} | {u} | {src} |")
body = "\n".join(table)
txt = REF.read_text(encoding="utf-8")
B, E = "<!-- COVERAGE:BEGIN -->", "<!-- COVERAGE:END -->"
if B in txt and E in txt:
    head, _, rest_txt = txt.partition(B); _, _, tail = rest_txt.partition(E)
    txt = head + B + "\n" + body + "\n" + E + tail
else:
    txt = txt.rstrip() + "\n\n" + B + "\n" + body + "\n" + E + "\n"
REF.write_text(txt, encoding="utf-8")
done = sum(1 for r in rows if r[1].startswith("DONE"))
print(f"i18n_status: языков={len(rows)} DONE={done} TODO={len(rows)-done} missing={bad}")
sys.exit(1 if bad else 0)
