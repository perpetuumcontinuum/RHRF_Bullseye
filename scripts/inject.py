import glob, os, re, shutil, subprocess
from pathlib import Path

src = Path("games/rhrf-bullseye")
out = src / ".friendsdk"

for f in ("favicon.svg", "site.webmanifest", "theme-boot.js"):
    shutil.copy(src / f, out / f)

# выносим инлайн-скрипт frame-maintenance.html во внешний JS, чтобы не нарушать CSP SDK
maint_html = Path("frame-maintenance.html").read_text(encoding="utf-8")
m = re.search(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", maint_html, re.S | re.I)
if m:
    js = m.group(1).lstrip("\n")
    (out / "frame-maintenance.js").write_text(js, encoding="utf-8")
    maint_html = maint_html[:m.start()] + '<script src="./frame-maintenance.js"></script>' + maint_html[m.end():]
    Path("frame-maintenance.html").write_text(maint_html, encoding="utf-8")
    print("extracted inline maintenance script -> out/frame-maintenance.js")

HEAD = (
    '<meta name="description" content="Defend the planet with your Generations NFT in this cyber archery minigame. '
    'Shoot moving targets, dodge ghosts, deflect asteroids and unlock legendary gear. Built on FriendSDK v0.1.4."/>'
    '<link rel="icon" type="image/svg+xml" href="./favicon.svg"/>'
    '<link rel="apple-touch-icon" href="./favicon.svg"/>'
    '<link rel="manifest" href="./site.webmanifest"/>'
    '<script src="./theme-boot.js"></script>'
)

WIDGET = Path("frame-widget.html").read_text(encoding="utf-8")
FOOTER = Path("frame-footer.html").read_text(encoding="utf-8")
MAINT = Path("frame-maintenance.html").read_text(encoding="utf-8")
assert "<script" not in MAINT or "src=" in MAINT, "maintenance HTML still contains inline script"

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

total = 0
for h in sorted(glob.glob(str(out / "*.html"))):
    t = Path(h).read_text(encoding="utf-8")
    before = t
    if "favicon.svg" not in t:
        t = t.replace("</head>", HEAD + "</head>", 1)
    if "rfMaintenance" not in t:
        t = t.replace("</body>", MAINT + "</body>", 1)
    if "rf-site-footer" not in t:
        t = t.replace("</body>", FOOTER + "</body>", 1)
    t = bust(t)
    if t != before:
        Path(h).write_text(t, encoding="utf-8")
        total += 1
        print("injected", h)
    else:
        print("skipped (already injected)", h)
print(">> files changed:", total, "| cache-bust v=", V or "(off)")
