import glob, shutil
from pathlib import Path

src = Path("games/rhrf-bullseye")
out = src / ".friendsdk"

for f in ("favicon.svg", "site.webmanifest", "theme-boot.js"):
    shutil.copy(src / f, out / f)

HEAD = (
    '<meta name="description" content="Defend the planet with your Generations NFT in this cyber archery minigame. '
    'Shoot moving targets, dodge ghosts, deflect asteroids and unlock legendary gear. Built on FriendSDK v0.1.4."/>'
    '<link rel="icon" type="image/svg+xml" href="./favicon.svg"/>'
    '<link rel="apple-touch-icon" href="./favicon.svg"/>'
    '<link rel="manifest" href="./site.webmanifest"/>'
    '<script src="./theme-boot.js"></script>'
)

WIDGET = Path("frame-widget.html").read_text(encoding="utf-8")

for h in sorted(glob.glob(str(out / "*.html"))):
    t = Path(h).read_text(encoding="utf-8")
    if "favicon.svg" not in t:
        t = t.replace("</head>", HEAD + "</head>", 1)
    if "rf-theme-switch" not in t:
        t = t.replace("</body>", WIDGET + "</body>", 1)
    Path(h).write_text(t, encoding="utf-8")
    print("injected", h)
