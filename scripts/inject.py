import glob, os, re, shutil, subprocess
from pathlib import Path

src = Path("games/rhrf-bullseye")
out = src / ".friendsdk"

for f in ("favicon.svg", "site.webmanifest", "theme-boot.js"):
    shutil.copy(src / f, out / f)

for f in ("layout.css", "page-shell.js", "footer-music.js", "game-shell.css"):
    for cand in (src / f, Path(f)):
        if cand.exists():
            shutil.copy(cand, out / f)
            print("copied", cand, "->", out / f)
            break
    else:
        raise SystemExit(f"missing asset: {f}")

for f in ("8bit-loop.mp3",):
    for cand in (src / f, Path(f)):
        if cand.exists():
            shutil.copy(cand, out / f)
            print("copied", cand, "->", out / f)
            break

for legacy in ("footer-music.css", "frame-maintenance.js", "footer-autohide.js"):
    p = out / legacy
    if p.exists():
        p.unlink()
        print("removed legacy", p)

HEAD = (
    '<meta name="description" content="Defend the planet with your Generations NFT in this cyber archery minigame. '
    'Shoot moving targets, dodge ghosts, deflect asteroids and unlock legendary gear. Built on FriendSDK v0.1.4."/>'
    '<link rel="icon" type="image/svg+xml" href="./favicon.svg"/>'
    '<link rel="apple-touch-icon" href="./favicon.svg"/>'
    '<link rel="manifest" href="./site.webmanifest"/>'
    '<script src="./theme-boot.js"></script>'
)

PAGE_CSS = '<link rel="stylesheet" href="./layout.css">'
PAGE_JS = '<script src="./page-shell.js" defer></script>'
MUSIC_JS = '<script src="./footer-music.js" defer></script>'
GAME_CSS = '<link rel="stylesheet" href="./game-shell.css">'

FOOTER = Path("frame-footer.html").read_text(encoding="utf-8")

def clean_footer(t):
    t = re.sub(r"\s*<style\b[^>]*>[\s\S]*?</style>\s*", "\n", t, flags=re.I)
    t = re.sub(r"\s*<link\b[^>]*rel=[\"']?stylesheet[\"']?[^>]*>\s*", "\n", t, flags=re.I)
    t = re.sub(r"\s*<script\b[^>]*>[\s\S]*?</script>\s*", "\n", t, flags=re.I)
    t = re.sub(
        r"\s*<button\b[^>]*(?:class=\"[^\"]*\brf-fs-btn\b[^\"]*\"|id=\"rfFsBtn\")[^>]*>[\s\S]*?</button>\s*",
        "\n",
        t,
        flags=re.I,
    )
    t = re.sub(r"\s*style=\"position\s*:\s*relative\s*\"\s*", "", t, flags=re.I)
    return re.sub(r"\n{3,}", "\n", t).strip()

FOOTER = clean_footer(FOOTER)

def _ver():
    s = os.environ.get("GITHUB_SHA")
    if s:
        return s[:7]
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return ""

V = _ver()
TAG_RE = re.compile(r'(src|href)="(\./[^"]+)"')

def bust(t):
    if not V:
        return t

    def fix(m):
        attr, url = m.group(1), m.group(2)
        base = url.split("?")[0]
        if not re.search(r"\.(js|css)$", base):
            return m.group(0)
        return f'{attr}="{base}?v={V}"'

    return TAG_RE.sub(fix, t)

def strip_index(t):
    t = re.sub(r"\s*<link[^>]+(?:layout|footer-music|game-shell)\.css[^>]*>\s*", "\n", t, flags=re.I)
    t = re.sub(
        r"\s*<script[^>]+(?:page-shell|footer-music|frame-maintenance|footer-autohide)\.js[^>]*>[\s\S]*?</script>\s*",
        "\n",
        t,
        flags=re.I,
    )
    t = re.sub(r"\s*<style\b[^>]*>[\s\S]*?</style>\s*", "\n", t, flags=re.I)
    t = re.sub(r"\s*<div id=\"rfMaintenance\"[\s\S]*?</div>\s*</div>\s*", "\n", t, flags=re.I)
    t = re.sub(r"\s*<footer class=\"rf-site-footer\">[\s\S]*?</footer>\s*", "\n", t, flags=re.I)
    t = re.sub(
        r"\s*<button\b[^>]*(?:class=\"[^\"]*\brf-fs-btn\b[^\"]*\"|id=\"rfFsBtn\")[^>]*>[\s\S]*?</button>\s*",
        "\n",
        t,
        flags=re.I,
    )
    return re.sub(r"\n{3,}", "\n", t).strip()

def strip_game(t):
    t = re.sub(r"\s*<link[^>]+(?:layout|footer-music)\.css[^>]*>\s*", "\n", t, flags=re.I)
    t = re.sub(
        r"\s*<script[^>]+(?:page-shell|footer-music|frame-maintenance|footer-autohide)\.js[^>]*>[\s\S]*?</script>\s*",
        "\n",
        t,
        flags=re.I,
    )
    t = re.sub(r"\s*<div id=\"rfMaintenance\"[\s\S]*?</div>\s*</div>\s*", "\n", t, flags=re.I)
    t = re.sub(r"\s*<footer class=\"rf-site-footer\">[\s\S]*?</footer>\s*", "\n", t, flags=re.I)
    t = re.sub(r"\s*<style id=\"rf-no-select-page\">[\s\S]*?</style>\s*", "\n", t, flags=re.I)
    return re.sub(r"\n{3,}", "\n", t).strip()

changed = 0

for h in sorted(glob.glob(str(out / "*.html"))):
    p = Path(h)
    t = p.read_text(encoding="utf-8")
    before = t

    if p.name == "index.html":
        t = strip_index(t)

        if "favicon.svg" not in t:
            t = t.replace("</head>", HEAD + "\n</head>", 1)

        t = t.replace(
            "</head>",
            PAGE_CSS + "\n" + PAGE_JS + "\n" + MUSIC_JS + "\n</head>",
            1,
        )

        t = t.replace("</body>", FOOTER + "\n</body>", 1)

    elif p.name == "game.html":
        t = strip_game(t)

        if "game-shell.css" not in t:
            t = t.replace("</head>", GAME_CSS + "\n</head>", 1)

    t = bust(t)

    if t != before:
        p.write_text(t, encoding="utf-8")
        changed += 1
        print("injected", p)
    else:
        print("skipped", p)

print(">> files changed:", changed, "| cache-bust v=", V or "(off)")
