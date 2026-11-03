import glob, os, re
from pathlib import Path

sha = os.environ.get("GITHUB_SHA", "")[:8]
# ловит href="..." / src="..." + необязательный мусор ?v= СНАРУЖИ кавычки
TAG = re.compile(r'((?:href|src)=")([^"]+)(")(\?v=[0-9a-f]+)?')
ASSET = re.compile(r'\.(css|js)$')

def fix(m):
    url = re.sub(r'\?v=[0-9a-f]+$', '', m.group(2))   # strip старый bust внутри
    if not ASSET.search(url):
        return m.group(1) + url + m.group(3)           # не ассет — вернуть чисто, без мусора
    return m.group(1) + url + '?v=' + sha + '"'        # ассет — bust ВНУТРИ кавычки

FRAME = re.compile(r'(["\'])(\./game\.html)\1')
for j in sorted(glob.glob("games/rhrf-bullseye/.friendsdk/*.js")):
    t = Path(j).read_text(encoding="utf-8")
    t2 = FRAME.sub(lambda m: m.group(1) + m.group(2) + "?v=" + sha + m.group(1), t)
    if t2 != t:
        Path(j).write_text(t2, encoding="utf-8")
    print(j, "-> frameUrl busted" if t2 != t else j, "-> frameUrl ok")

for h in sorted(glob.glob("games/rhrf-bullseye/.friendsdk/*.html")):
    t = Path(h).read_text(encoding="utf-8")
    n = 0
    def rep(m):
        global n; n += 1; return fix(m)
    t2 = TAG.sub(rep, t)
    if t2 != t:
        Path(h).write_text(t2, encoding="utf-8")
    print(h, "->", n, "assets busted")

# CDN-лаг: HTML всегда свежий, ассеты bust-ятся по sha
HEADERS = "/\n  Cache-Control: no-cache, must-revalidate\n/*.html\n  Cache-Control: no-cache, must-revalidate\n"
out = Path("games/rhrf-bullseye/.friendsdk/_headers")
out.write_text(HEADERS, encoding="utf-8")
print(out, "-> _headers written")
