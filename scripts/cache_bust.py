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

for h in sorted(glob.glob("games/rhrf-bullseye/.friendsdk/*.html")):
    t = Path(h).read_text(encoding="utf-8")
    n = 0
    def rep(m):
        global n; n += 1; return fix(m)
    t2 = TAG.sub(rep, t)
    if t2 != t:
        Path(h).write_text(t2, encoding="utf-8")
    print(h, "->", n, "assets busted")
