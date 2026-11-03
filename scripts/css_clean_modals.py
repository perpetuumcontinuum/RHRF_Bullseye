#!/usr/bin/env python3
# Merge conflicting duplicate rules (same normalized selector, non-media) into
# one owner by cascade winner; strip !important in the merged block. Idempotent.
import sys, re, shutil, time, os
from pathlib import Path

CSS = Path(os.environ.get("CSS_TARGET", "games/rhrf-bullseye/style.css"))

def _skip(text, i):
    c = text[i]; n = len(text)
    if c in "\"'":
        q = c; i += 1
        while i < n:
            if text[i] == "\\" and i+1 < n: i += 2; continue
            if text[i] == q: return i+1
            i += 1
        return i
    if text.startswith("/*", i):
        j = text.find("*/", i+2); return (j+2) if j != -1 else n
    if text.startswith("url(", i):
        j = i+4; d = 1
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
        if sk is not None: i = sk; continue
        if text[i] == "{": d += 1
        elif text[i] == "}": d -= 1
        i += 1
    return i - 1

def scan(text, base=0):
    rules = []; i = 0; n = len(text); sel_begin = 0
    while i < n:
        sk = _skip(text, i)
        if sk is not None:
            if text[sel_begin:i].strip() == "": sel_begin = sk
            i = sk; continue
        if text[i] == "{":
            sel = text[sel_begin:i].strip()
            close = find_matching(text, i)
            body = text[i+1:close]
            if sel.startswith("@"):
                kw = sel.split()[0].lower()
                if kw in ("@media","@supports","@layer","@container"):
                    rules.extend(scan(body, base + i + 1))
            else:
                rules.append((sel, body, base + sel_begin, base + close + 1))
            i = close + 1; sel_begin = i; continue
        i += 1
    return rules

def split_decls(body):
    out, d, cur = [], 0, []
    for ch in body:
        if ch == "(": d += 1
        elif ch == ")": d -= 1
        if ch == ";" and d == 0: out.append("".join(cur)); cur = []
        else: cur.append(ch)
    if "".join(cur).strip(): out.append("".join(cur))
    return [x for x in out if x.strip()]

def norm(s): return re.sub(r"\s+", " ", s).strip()

def mergeable(sel):
    s = norm(sel)
    if not s or s.startswith("@"): return False
    if ":" in s: return False          # pseudo-states / webkit — never merge
    if "[class*=" in s: return False   # scrollbar hacks — never merge
    if s == ":root": return False      # tokens — intentional repeats
    return True

def balance_ok(t): return t.count("{") == t.count("}")

def main():
    src = CSS.read_text(encoding="utf-8")
    if not balance_ok(src): sys.exit("ABORT: input unbalanced")
    shutil.copy(str(CSS), str(CSS) + f".pre-modals-{int(time.time())}")

    rules = scan(src)
    groups = {}
    for idx, (sel, body, a, b) in enumerate(rules):
        if not mergeable(sel): continue
        groups.setdefault(norm(sel), []).append((idx, sel, body, a, b))

    edits = []   # (start, end, replacement)
    merged_count = 0
    for sel_norm, members in groups.items():
        if len(members) < 2: continue
        # cascade winner per property: higher (important, order) wins; order = member index
        final = {}     # prop -> (value, important, order)
        order = []     # prop first-appearance order
        for mi, (_, _, body, _, _) in enumerate(members):
            for d in split_decls(body):
                if ":" not in d: continue
                prop, val = d.split(":", 1)
                prop = prop.strip().lower(); val = val.strip()
                imp = "!important" in val
                val = val.replace("!important", "").strip()
                if prop not in final:
                    final[prop] = (val, imp, mi); order.append(prop)
                else:
                    pv, pi, po = final[prop]
                    if (imp, mi) > (pi, po):
                        final[prop] = (val, imp, mi)
        # serialize in first-appearance order, drop !important (single owner now)
        decl_lines = [f"  {p}: {final[p][0]}; " for p in order]
        block = members[0][1].rstrip() + "{\n" + "\n".join(decl_lines) + "}"
        # replace first member with merged block, blank the rest
        edits.append((members[0][3], members[0][4], block))
        for (_, _, _, a, b) in members[1:]:
            edits.append((a, b, ""))
        merged_count += 1

    edits.sort(key=lambda x: x[0], reverse=True)
    for a, b, new in edits:
        src = src[:a] + new + src[b:]
    # collapse leftover blank lines from removed blocks
    src = re.sub(r"\n{3,}", "\n\n", src)

    if not balance_ok(src): sys.exit("ABORT: unbalanced after merge, not written")
    CSS.write_text(src, encoding="utf-8")
    print(f"(merge) collapsed {merged_count} conflict-groups into single owners; !important stripped in merged blocks")

if __name__ == "__main__":
    main()
