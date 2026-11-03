#!/usr/bin/env python3
# Exact duplicate CSS selector deduper.
# Usage:
#   python3 scripts/css_dedupe.py games/rhrf-bullseye/style.css
#   python3 scripts/css_dedupe.py games/rhrf-bullseye/style.css --fix
import sys, re, shutil, time
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
fix = "--fix" in sys.argv
path = Path(args[0] if args else "games/rhrf-bullseye/style.css")

def _skip(text, i):
    c = text[i]
    n = len(text)

    if c in "\"'":
        q = c
        i += 1
        while i < n:
            if text[i] == "\\" and i + 1 < n:
                i += 2
                continue
            if text[i] == q:
                return i + 1
            i += 1
        return i

    if text.startswith("/*", i):
        j = text.find("*/", i + 2)
        return j + 2 if j != -1 else n

    if text.startswith("url(", i):
        j = i + 4
        d = 1
        while j < n and d:
            if text[j] == "(":
                d += 1
            elif text[j] == ")":
                d -= 1
            j += 1
        return j

    return None

def find_matching(text, open_idx):
    i = open_idx + 1
    n = len(text)
    d = 1
    while i < n and d:
        sk = _skip(text, i)
        if sk is not None:
            i = sk
            continue
        if text[i] == "{":
            d += 1
        elif text[i] == "}":
            d -= 1
        i += 1
    return i - 1

def split_selector_list(sel):
    parts = []
    depth = 0
    cur = []
    for ch in sel:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1

        if ch == "," and depth == 0:
            parts.append("".join(cur))
            cur = []
        else:
            cur.append(ch)

    if "".join(cur).strip():
        parts.append("".join(cur))

    return [p.strip() for p in parts if p.strip()]

def clean_sel(sel):
    sel = re.sub(r"/\*.*?\*/", " ", sel, flags=re.S)
    sel = re.sub(r"\s+", " ", sel).strip()
    parts = split_selector_list(sel)
    if len(parts) > 1:
        return ",".join(sorted(parts))
    return sel

def split_decls(body):
    out = []
    depth = 0
    cur = []
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1

        if ch == ";" and depth == 0:
            out.append("".join(cur))
            cur = []
        else:
            cur.append(ch)

    if "".join(cur).strip():
        out.append("".join(cur))

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

    return prop, val, imp, raw

def parse(text):
    rules = []

    def walk(s, base, media):
        i = 0
        n = len(s)
        sel_begin = 0

        while i < n:
            sk = _skip(s, i)
            if sk is not None:
                if s[sel_begin:i].strip() == "":
                    sel_begin = sk
                i = sk
                continue

            if s[i] == "{":
                sel = s[sel_begin:i].strip()
                close = find_matching(s, i)
                body = s[i + 1:close]

                if sel.startswith("@"):
                    kw = sel.split()[0].lower()
                    if kw in ("@media", "@supports", "@layer", "@container"):
                        cond = sel[len(kw):].strip()
                        walk(body, base + i + 1, (media + " " if media else "") + cond)
                else:
                    rules.append({
                        "sel_raw": sel,
                        "sel": clean_sel(sel),
                        "body": body,
                        "start": base + sel_begin,
                        "end": base + close + 1,
                        "media": media,
                    })

                i = close + 1
                sel_begin = i
                continue

            i += 1

    walk(text, 0, "")
    return rules

def line_of(text, pos):
    return text.count("\n", 0, pos) + 1

def balance_ok(t):
    return t.count("{") == t.count("}")

text = path.read_text(encoding="utf-8")
if not balance_ok(text):
    sys.exit("ABORT: input unbalanced")

rules = parse(text)

groups = {}
for r in rules:
    if not r["sel"] or r["sel"].startswith("@"):
        continue
    key = (r["media"], r["sel"])
    groups.setdefault(key, []).append(r)

for k in groups:
    groups[k].sort(key=lambda x: x["start"])

dup_groups = {k: v for k, v in groups.items() if len(v) > 1}

print(f"# exact duplicate groups: {len(dup_groups)}")

edits = []

for (media, sel), members in dup_groups.items():
    entries = []
    seq = 0

    for gi, r in enumerate(members):
        rline = line_of(text, r["start"])
        for d in split_decls(r["body"]):
            p = parse_decl(d)
            if not p:
                continue
            prop, val, imp, raw = p
            seq += 1
            entries.append({
                "gi": gi,
                "seq": seq,
                "prop": prop,
                "val": val,
                "imp": imp,
                "line": rline,
                "raw": raw,
            })

    winners = {}
    for e in entries:
        prop = e["prop"]
        if prop not in winners:
            winners[prop] = e
        else:
            w = winners[prop]
            if (e["imp"], e["seq"]) > (w["imp"], w["seq"]):
                winners[prop] = e

    ordered_props = sorted(winners.keys(), key=lambda p: winners[p]["seq"])

    dead_total = 0
    for prop in ordered_props:
        w = winners[prop]
        dead = [e["line"] for e in entries if e["prop"] == prop and e["seq"] != w["seq"]]
        if dead:
            dead_total += len(dead)

    print(f"\n[{media or 'top'}] {sel}")
    for gi, r in enumerate(members):
        print(f"  rule #{gi + 1} L{line_of(text, r['start'])}")

    if not dead_total:
        print("  no dead declarations, only duplicate selector blocks")

    for prop in ordered_props:
        w = winners[prop]
        dead = [e["line"] for e in entries if e["prop"] == prop and e["seq"] != w["seq"]]
        if dead:
            imp = " !important" if w["imp"] else ""
            print(f"  {prop}: winner L{w['line']}{imp} = {w['val']}; dead L{', L'.join(map(str, dead))}")

    if fix:
        decls = []
        for prop in ordered_props:
            w = winners[prop]
            imp = " !important" if w["imp"] else ""
            decls.append(f"  {prop}: {w['val']}{imp};")

        sel_out = re.sub(r"\s+", " ", members[0]["sel_raw"]).strip()
        block = sel_out + " {\n" + "\n".join(decls) + "\n}"

        edits.append((members[0]["start"], members[0]["end"], block))
        for r in members[1:]:
            edits.append((r["start"], r["end"], ""))

if fix:
    shutil.copy(str(path), str(path) + f".pre-dedupe-{int(time.time())}")
    edits.sort(key=lambda x: x[0], reverse=True)

    for start, end, new in edits:
        text = text[:start] + new + text[end:]

    text = re.sub(r"\n{3,}", "\n\n", text)

    if not balance_ok(text):
        sys.exit("ABORT: brace balance broken, file not written")

    path.write_text(text, encoding="utf-8")
    print(f"\nFIXED: merged {len(dup_groups)} exact duplicate groups")
else:
    print("\nRead-only. Add --fix to merge exact duplicates safely.")
