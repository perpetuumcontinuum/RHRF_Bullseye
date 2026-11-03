#!/usr/bin/env python3
# Merge top-level ".scene-container X" into existing top-level "X".
# Dry run by default. Use --apply to write.
import sys, re, shutil, time
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
apply = "--apply" in sys.argv
path = Path(args[0] if args else "games/rhrf-bullseye/style.css")

def _skip(text, i):
    c = text[i]; n = len(text)
    if c in "\"'":
        q = c; i += 1
        while i < n:
            if text[i] == "\\" and i + 1 < n:
                i += 2; continue
            if text[i] == q:
                return i + 1
            i += 1
        return i
    if text.startswith("/*", i):
        j = text.find("*/", i + 2)
        return j + 2 if j != -1 else n
    if text.startswith("url(", i):
        j = i + 4; d = 1
        while j < n and d:
            if text[j] == "(": d += 1
            elif text[j] == ")": d -= 1
            j += 1
        return j
    return None

def find_matching(text, open_idx):
    i = open_idx + 1; n = len(text); d = 1
    while i < n and d:
        sk = _skip(text, i)
        if sk is not None:
            i = sk; continue
        if text[i] == "{": d += 1
        elif text[i] == "}": d -= 1
        i += 1
    return i - 1

def split_selector_list(sel):
    parts = []; depth = 0; cur = []
    for ch in sel:
        if ch in "([": depth += 1
        elif ch in ")]": depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(cur)); cur = []
        else:
            cur.append(ch)
    if "".join(cur).strip(): parts.append("".join(cur))
    return [p.strip() for p in parts if p.strip()]

def clean_sel(sel):
    sel = re.sub(r"/\*.*?\*/", " ", sel, flags=re.S)
    sel = re.sub(r"\s+", " ", sel).strip()
    parts = split_selector_list(sel)
    if len(parts) > 1:
        return ",".join(sorted(parts))
    return sel

def split_decls(body):
    out = []; depth = 0; cur = []
    for ch in body:
        if ch == "(": depth += 1
        elif ch == ")": depth -= 1
        if ch == ";" and depth == 0:
            out.append("".join(cur)); cur = []
        else:
            cur.append(ch)
    if "".join(cur).strip(): out.append("".join(cur))
    return [x for x in out if x.strip()]

def parse_decl(raw):
    raw = raw.strip()
    if not raw or ":" not in raw:
        return None
    prop, val = raw.split(":", 1)
    prop = prop.strip().lower()
    val = val.strip()
    m = re.search(r"\s*!\s*important\s*$", val, re.I)
    imp = bool(m)
    if imp:
        val = val[:m.start()].strip()
    if not prop or not val:
        return None
    return prop, val, imp

def scan(text):
    rules = []
    def walk(s, base, media):
        i = 0; n = len(s); sel_begin = 0
        while i < n:
            sk = _skip(s, i)
            if sk is not None:
                if s[sel_begin:i].strip() == "":
                    sel_begin = sk
                i = sk; continue
            if s[i] == "{":
                sel = s[sel_begin:i].strip()
                close = find_matching(s, i)
                body = s[i + 1:close]
                if sel.startswith("@"):
                    kw = sel.split()[0].lower()
                    if kw in ("@media", "@supports", "@layer", "@container"):
                        cond = sel[len(kw):].strip()
                        walk(body, base + i + 1, (media + " and " if media else "") + cond)
                else:
                    rules.append({
                        "sel_raw": sel,
                        "sel": clean_sel(sel),
                        "media": media,
                        "body": body,
                        "start": base + sel_begin,
                        "end": base + close + 1,
                    })
                i = close + 1
                sel_begin = i
                continue
            i += 1
    walk(text, 0, "")
    return rules

def balance_ok(t):
    return t.count("{") == t.count("}")

src = path.read_text(encoding="utf-8")
if not balance_ok(src):
    sys.exit("ABORT: input unbalanced")

rules = scan(src)

base_map = {}
for r in rules:
    if r["media"] != "" or r["sel"].startswith("@"):
        continue
    base_map.setdefault(r["sel"], []).append(r)

GROUP_PREFIX = ".scene-container "
SKIP_BASE_PREFIXES = (
    "html", "body", "#root", ".rf-app", ".friendsdk-shell", ".game-shell",
)

groups = {}
for r in rules:
    if r["media"] != "" or r["sel"].startswith("@"):
        continue
    sel = r["sel"]
    if not sel.startswith(GROUP_PREFIX):
        continue
    base_sel = sel[len(GROUP_PREFIX):].strip()
    if not base_sel:
        continue
    if "," in base_sel or ":" in base_sel:
        continue
    if base_sel.startswith(SKIP_BASE_PREFIXES):
        continue
    bases = base_map.get(base_sel, [])
    if len(bases) != 1:
        continue
    groups.setdefault(base_sel, []).append(r)

print(f"# scope merge groups: {len(groups)}")

edits = []
for base_sel, scoped_rules in groups.items():
    base_r = base_map[base_sel][0]
    entries = []

    for d in split_decls(base_r["body"]):
        p = parse_decl(d)
        if p:
            entries.append(("base", *p))

    for sr in scoped_rules:
        for d in split_decls(sr["body"]):
            p = parse_decl(d)
            if p:
                entries.append(("scoped", *p))

    # Later same property+importance wins. Do not try to understand shorthand/longhand here.
    keep = []
    index = {}
    for i, e in enumerate(entries):
        _, prop, val, imp = e
        key = (prop, imp)
        if key in index:
            keep[index[key]] = None
        index[key] = i
        keep.append(e)

    decls = []
    for e in keep:
        if e is None:
            continue
        _, prop, val, imp = e
        suffix = " !important" if imp else ""
        decls.append(f"  {prop}: {val}{suffix};")

    if not decls:
        continue

    new_block = base_r["sel_raw"].rstrip() + " {\n" + "\n".join(decls) + "\n}"
    edits.append((base_r["start"], base_r["end"], new_block, base_sel, "replace"))
    for sr in scoped_rules:
        edits.append((sr["start"], sr["end"], "", base_sel, "delete"))

    print(f"\nMERGE {base_sel}")
    print(f"  scoped rules: {len(scoped_rules)}")
    print(f"  declarations after merge: {len(decls)}")

if not apply:
    print("\nDry run. Add --apply to write.")
    sys.exit(0)

if not edits:
    print("Nothing to merge.")
    sys.exit(0)

shutil.copy(str(path), str(path) + f".pre-scope-{int(time.time())}")

edits.sort(key=lambda x: x[0], reverse=True)
for start, end, new, _, _ in edits:
    src = src[:start] + new + src[end:]

src = re.sub(r"\n{3,}", "\n\n", src)

if not balance_ok(src):
    sys.exit("ABORT: brace balance broken, file not written")

path.write_text(src, encoding="utf-8")
print(f"APPLIED: merged {len(groups)} scoped groups; backup created")
