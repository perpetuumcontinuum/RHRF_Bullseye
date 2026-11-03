#!/usr/bin/env python3
import json, re, sys, shutil, time, os
from pathlib import Path

CSS = Path(os.environ.get("CSS_TARGET", "games/rhrf-bullseye/style.css"))
DEAD = Path("css_dead.json")
APPLY = "--apply" in sys.argv

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

def norm_media(media):
    return re.sub(r"\s+", " ", media or "").strip()

def norm_value(v):
    v = re.sub(r"/\*.*?\*/", " ", v, flags=re.S)
    v = re.sub(r"\s+", " ", v).strip()
    return v

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
    return prop, norm_value(val), imp

def scan(text, base=0):
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
                        "media": norm_media(media),
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

if not DEAD.exists():
    sys.exit("css_dead.json not found. Run css_live_gc.mjs first.")

data = json.loads(DEAD.read_text(encoding="utf-8"))
dead = set()
for x in data.get("removable", []):
    dead.add((
        clean_sel(x["sel"]),
        norm_media(x.get("media", "")),
        x["prop"].lower(),
        bool(x.get("important", False)),
    ))

src = CSS.read_text(encoding="utf-8")
if not balance_ok(src):
    sys.exit("ABORT: input unbalanced")

rules = scan(src)
edits = []
removed = 0

for r in rules:
    kept = []
    changed = False
    for d in split_decls(r["body"]):
        p = parse_decl(d)
        if not p:
            kept.append(d.strip())
            continue
        prop, val, imp = p
        key = (r["sel"], r["media"], prop, imp)
        if key in dead:
            changed = True
            removed += 1
            continue
        kept.append(d.strip())

    if not changed:
        continue

    if kept:
        new_block = r["sel_raw"].rstrip() + " {\n  " + ";\n  ".join(kept) + ";\n}"
    else:
        new_block = ""

    edits.append((r["start"], r["end"], new_block))

print(f"dead declarations matched: {removed}")

if not APPLY:
    print("Dry run. Add --apply to write.")
    sys.exit(0)

if not edits:
    print("Nothing to remove.")
    sys.exit(0)

shutil.copy(str(CSS), str(CSS) + f".pre-gc-{int(time.time())}")

edits.sort(key=lambda x: x[0], reverse=True)
for a, b, new in edits:
    src = src[:a] + new + src[b:]

src = re.sub(r"\n{3,}", "\n\n", src)

if not balance_ok(src):
    sys.exit("ABORT: brace balance broken, file not written")

CSS.write_text(src, encoding="utf-8")
print(f"APPLIED: removed {removed} dead declarations; backup created")
