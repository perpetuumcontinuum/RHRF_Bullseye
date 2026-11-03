#!/usr/bin/env python3
# Deterministic CSS cleaner for the control layer. Idempotent.
import sys, re, shutil, time, os
from pathlib import Path

CSS = Path(os.environ.get("CSS_TARGET", "games/rhrf-bullseye/style.css"))

EPOCH_MARKERS = [
    "/* ===== Equalize button rows",
    "/* ===== Unified UI system: one brick",
    "/* ===== Unified UI system v1",
    "/* ===== UI unification hotfix: MISSION",
    "/* ===== UI unification hotfix v2",
    "/* ===== UI unification v3",
    "/* ===== Bottom controls: beat legacy",
    "/* ===== top bar fit: one line",
    "/* ===== rf-ui: single clean control brick",
    "/* ===== rf-ui CANON",
]

BRICK = {
    "box-sizing","display","flex-direction","align-items","justify-content",
    "height","min-height","max-height","width","min-width","max-width",
    "padding","padding-top","padding-right","padding-bottom","padding-left",
    "border","border-top","border-right","border-bottom","border-left",
    "border-width","border-style","border-color","border-radius",
    "font","font-family","font-size","font-weight","font-style","font-variant",
    "letter-spacing","line-height","text-transform","text-align",
    "white-space","overflow","text-overflow",
    "flex","flex-grow","flex-shrink","flex-basis","gap",
    "position","top","right","bottom","left","transform",
    "box-shadow","text-shadow","background","background-image","background-color",
    "cursor","outline","-webkit-tap-highlight-color","user-select","text-decoration",
    "isolation",
}

def norm(s): return re.sub(r"\s+", " ", s).strip()

def is_geom(sel):
    s = norm(sel)
    if "rf-ui-item" in s: return False
    if re.search(r"\.rf-top-bar__score(?![\w-])", s): return True
    if re.search(r"\.rf-top-bar__btn\b", s): return True
    if re.search(r"\.rf-top-bar__rf(?![\w-])", s): return True
    if "controls-row" in s and ("button" in s or re.search(r"\.(?:shot|fire-tower|jump)-btn", s)): return True
    if re.search(r"\.rf-missions__toggle\b", s): return True
    if s == ".rf-missions": return True
    return False

def _skip(text, i):
    """If text[i] starts a string/comment/url, return index after it, else None."""
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
        if sk is not None:
            i = sk; continue
        if text[i] == "{": d += 1
        elif text[i] == "}": d -= 1
        i += 1
    return i - 1  # index of matching }

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

def balance_ok(t): return t.count("{") == t.count("}")

def main():
    src = CSS.read_text(encoding="utf-8")
    if not balance_ok(src): sys.exit("ABORT: input unbalanced")
    shutil.copy(str(CSS), str(CSS) + f".pre-clean-{int(time.time())}")

    cut = min((src.find(m) for m in EPOCH_MARKERS if src.find(m) != -1), default=-1)
    if cut != -1:
        src = src[:cut].rstrip() + "\n"; print(f"(a) tail cut at {cut}")
    else:
        print("(a) no epoch tail found")

    rules = scan(src)
    edits = []
    for sel, body, a, b in rules:
        if not is_geom(sel): continue
        kept = []
        for d in split_decls(body):
            if ":" not in d: continue
            prop = d.split(":", 1)[0].strip().lower()
            if prop in BRICK: continue
            kept.append(d.strip())
        if kept:
            edits.append((a, b, sel.rstrip() + "{\n  " + ";\n  ".join(kept) + ";\n}"))
        else:
            edits.append((a, b, ""))
    edits.sort(key=lambda x: x[0], reverse=True)
    for a, b, new in edits:
        src = src[:a] + new + src[b:]
    print(f"(b) cleaned/removed {len(edits)} legacy geom rules")

    if not balance_ok(src): sys.exit("ABORT: unbalanced after (b)")

    canon = r'''
/* ===== rf-ui CANON (geometry+type live here only; legacy = color/shadow/cursor) ===== */
:root{
  --rf-ui-h: clamp(30px, 5.4vmin, 40px);
  --rf-ui-font-size: clamp(12px, 2.6vh, 22px);
  --rf-ui-pad-x: clamp(6px, 1.5vmin, 11px);
  --rf-ui-gap: clamp(5px, 1.3vmin, 9px);
  --rf-ui-radius: .5em;
  --rf-ui-border-w: .13em;
  --rf-digits: 13;
}
.rf-ui-item{
  box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center;
  height:var(--rf-ui-h); min-height:var(--rf-ui-h); max-height:var(--rf-ui-h);
  flex:0 1 auto; width:auto; min-width:0; padding:0 var(--rf-ui-pad-x);
  border:var(--rf-ui-border-w) solid currentColor; border-radius:var(--rf-ui-radius);
  background:rgba(0,0,0,.55); font:800 var(--rf-ui-font-size)/1 monospace;
  letter-spacing:.06em; text-transform:uppercase; white-space:nowrap;
  overflow:visible; text-overflow:clip; cursor:pointer; gap:.4em;
  text-decoration:none; -webkit-tap-highlight-color:transparent; user-select:none;
}
.rf-ui-item:hover:not(:disabled), .rf-ui-item:focus-visible{
  background:rgba(10,0,24,.72);
  box-shadow:0 0 .7em color-mix(in srgb, currentColor 45%, transparent); outline:none;
}
.rf-ui-item:disabled{ opacity:.5; cursor:not-allowed; box-shadow:none; }

.scene-container .rf-top-bar{ width:69%; max-width:none; flex-wrap:nowrap; align-items:center; display:flex; gap:var(--rf-ui-gap); }
.scene-container .controls-row{ width:auto; max-width:100%; align-items:center; display:flex; gap:var(--rf-ui-gap); }
.scene-container .rf-top-bar > *, .scene-container .controls-row > *{ flex:0 1 auto; width:auto; min-width:0; }
.scene-container .rf-top-bar .rf-ui-item--score{ flex:0 0 auto; cursor:default; min-width:calc(var(--rf-digits) * 1ch + 2 * var(--rf-ui-pad-x)); }
.scene-container .rf-top-bar .rf-ui-item--rf{ flex:0 0 auto; cursor:default; color:#fff; min-width:calc(var(--rf-digits) * 1ch + 1.7em + 2 * var(--rf-ui-pad-x)); }
.rf-ui-item--fire{ color:#ff00ff; }
.rf-ui-item--shot{ color:#ff2b2b; }
.rf-ui-item--jump{ color:#00ff88; }

.scene-container .rf-missions{ position:relative; left:auto; right:auto; bottom:auto; transform:none; display:flex; align-items:center; justify-content:center; width:auto; min-width:0; height:var(--rf-ui-h); overflow:visible; z-index:50; font-size:var(--rf-ui-font-size); }
.scene-container .rf-missions .rf-missions__toggle{ width:100%; height:100%; min-width:0; justify-content:space-between; }
.scene-container .rf-missions .rf-missions__panel{ position:absolute; width:max-content; min-width:0; max-width:min(86vw,22rem); left:0; right:auto; bottom:calc(100% + var(--rf-ui-gap)); transform-origin:bottom left; font-size:var(--rf-ui-font-size); margin:0; }
.scene-container .rf-missions.open .rf-missions__panel{ max-height:min(52vh,24rem); opacity:1; transform:none; margin:0; }

@media (max-width:760px){ .scene-container .rf-top-bar{ width:94%; } }
@media (max-width:560px){ :root{ --rf-ui-h:clamp(26px,7vmin,32px); --rf-ui-font-size:clamp(9px,2.7vmin,12px); --rf-digits:7; } }
'''
    src = src.rstrip() + "\n" + canon
    if not balance_ok(src): sys.exit("ABORT: unbalanced after canon")
    CSS.write_text(src, encoding="utf-8")
    print("(d) canon written; file balanced OK")

if __name__ == "__main__":
    main()
