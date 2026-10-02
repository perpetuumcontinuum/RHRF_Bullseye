#!/usr/bin/env python3
import argparse
import re
from pathlib import Path

TARGET = "#ccff00"
TARGET_NORM = "ccff00"
HEX_RE = re.compile(r"#([0-9a-fA-F]{3,8})\b")
EXTS = {".css", ".tsx", ".ts", ".html", ".json"}
SKIP = {".friendsdk", "node_modules", ".git"}

CSS_RULE_RE = re.compile(r"(?P<sel>[^{};]*\brare\b[^{};]*?)\{(?P<body>[^{}]*)\}", re.I)
LINE_RARE_RE = re.compile(r"\brare\b", re.I)


def norm_color(h: str) -> str:
    h = h.lower()
    if len(h) == 3:
        return "".join(c * 2 for c in h)
    if len(h) == 4:
        return "".join(c * 2 for c in h[:3])
    if len(h) >= 6:
        return h[:6]
    return h


def is_target(hexstr: str) -> bool:
    return norm_color(hexstr.lstrip("#")) == TARGET_NORM


def target_like(hexstr: str) -> str:
    h = hexstr.lstrip("#")
    if len(h) == 8:
        return TARGET + h[6:]
    if len(h) == 4:
        return TARGET + h[3] * 2
    return TARGET


def normalize_shorthand(text: str) -> str:
    def repl(m):
        h = m.group(1)
        if len(h) in (3, 4) and norm_color(h) == TARGET_NORM:
            alpha = h[3] if len(h) == 4 else ""
            return TARGET + (alpha * 2 if alpha else "")
        return m.group(0)

    return HEX_RE.sub(repl, text)


def record_normalize(path: Path, text: str, changes: list):
    for m in HEX_RE.finditer(text):
        h = m.group(1)
        if len(h) in (3, 4) and norm_color(h) == TARGET_NORM:
            old = m.group(0)
            changes.append((str(path), "normalize", old, target_like(old)))


def process_css_rules(path: Path, text: str, changes: list, apply: bool) -> str:
    def rule_repl(m):
        sel = m.group("sel")
        body = m.group("body")
        low = sel.lower()

        if "epic" in low or "legendary" in low:
            return m.group(0)

        def hex_repl(hm):
            old = hm.group(0)
            if is_target(old):
                return old
            new = target_like(old)
            changes.append((str(path), "css-rule", old, new))
            return new if apply else old

        return sel + "{" + HEX_RE.sub(hex_repl, body) + "}"

    return CSS_RULE_RE.sub(rule_repl, text)


def process_lines(path: Path, text: str, changes: list, apply: bool) -> str:
    out = []

    for i, line in enumerate(text.split("\n"), 1):
        low = line.lower()

        if LINE_RARE_RE.search(low) and "epic" not in low and "legendary" not in low:
            def hex_repl(m):
                old = m.group(0)
                if is_target(old):
                    return old
                new = target_like(old)
                changes.append((str(path), i, old, new))
                return new if apply else old

            line = HEX_RE.sub(hex_repl, line)

        out.append(line)

    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--root", default="games/rhrf-bullseye")
    args = ap.parse_args()

    root = Path(args.root)
    changes = []

    for f in root.rglob("*"):
        if not f.is_file() or f.suffix not in EXTS:
            continue
        if any(part in SKIP for part in f.parts):
            continue

        original = f.read_text(encoding="utf-8")
        text = normalize_shorthand(original)

        if text != original:
            record_normalize(f, original, changes)

        if f.suffix == ".css":
            text = process_css_rules(f, text, changes, args.apply)
        else:
            text = process_lines(f, text, changes, args.apply)

        if args.apply and text != original:
            f.write_text(text, encoding="utf-8")

    if not changes:
        print(">> уже чисто")
        return

    print(f">> {'заменено' if args.apply else 'найдено'}: {len(changes)}")
    for path, loc, old, new in changes:
        print(f"  {path}:{loc}  {old} -> {new}")

    if not args.apply:
        print(">> dry-run. Применить: python3 scripts/rare-color-fix.py --apply")


if __name__ == "__main__":
    main()
