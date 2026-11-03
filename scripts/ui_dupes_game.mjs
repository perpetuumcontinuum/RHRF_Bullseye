import { chromium } from "playwright";
import readline from "node:readline";

const CDP = process.env.UI_CDP || "http://localhost:9222";
const GAME = process.env.UI_GAME || "http://localhost:4173/game.html";
const INTERVAL = +(process.env.UI_INTERVAL || 1200);

const PROPS = new Set((process.env.UI_PROPS || [
  "box-sizing","display","align-items","justify-content","flex","flex-grow","flex-shrink","flex-basis","gap",
  "height","min-height","max-height","width","min-width","max-width","padding","padding-top","padding-right","padding-bottom","padding-left",
  "border","border-width","border-style","border-color","border-radius",
  "font","font-family","font-size","font-weight","letter-spacing","line-height","text-transform","text-align","white-space","overflow","text-overflow",
  "color","background","background-color","cursor","transition","animation",
].join(",")).split(",").map(s=>s.trim()).filter(Boolean));

const scanDoc = (page) => page.evaluate((propsArr) => {
  const props = new Set(propsArr);
  const rules = [];
  const walk = (list) => {
    for (const r of list) {
      try {
        if (r.type === 4) { if (matchMedia(r.conditionText).matches) walk(r.cssRules); }
        else if (r.type === 12) { if (CSS.supports(r.conditionText)) walk(r.cssRules); }
        else if (r.type === 1 && r.selectorText) {
          const decls = {};
          for (const p of r.style) {
            const n = p.trim();
            if (!n || n.startsWith("--") || !props.has(n)) continue;
            decls[n] = r.style.getPropertyValue(n) + (r.style.getPropertyPriority(n) ? " !important" : "");
          }
          if (Object.keys(decls).length) {
            const sheet = r.parentStyleSheet?.href || r.parentStyleSheet?.ownerNode?.tagName || "";
            rules.push({ key: sheet + "|" + r.selectorText, sel: r.selectorText, decls });
          }
        }
      } catch {}
    }
  };
  for (const ss of document.styleSheets) { try { walk(ss.cssRules); } catch {} }

  const open = [];
  for (const sel of [".rf-shop-overlay",".rf-guide-overlay",".rf-profile-overlay",".rf-lang-overlay",".rf-missions.open",".rf-paused-root",".rf-overlay-open"]) {
    if (document.querySelector(sel)) open.push(sel.replace(/^\./,""));
  }
  const vp = window.innerWidth + "x" + window.innerHeight;

  const out = [];
  for (const el of document.querySelectorAll("*")) {
    const counts = {};
    for (const r of rules) {
      let m = false; try { m = el.matches(r.sel); } catch {}
      if (!m) continue;
      for (const [p, v] of Object.entries(r.decls)) (counts[p] ||= new Map()).set(r.key, { sel: r.sel, v });
    }
    const dups = Object.entries(counts).filter(([, mm]) => mm.size > 1);
    if (!dups.length) continue;
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const cls = (el.className || "").toString().trim().split(/\s+/).filter(Boolean).map(x => "." + x).join("");
    out.push({ label: `${tag}${id}${cls}`, dups: dups.map(([p, mm]) => [p, [...mm.values()]]) });
  }
  return { vp, open, items: out, hash: JSON.stringify(out) + "|" + vp + "|" + open.join(",") };
}, [...PROPS]);

const browser = await chromium.connectOverCDP(CDP);
const ctx = browser.contexts()[0];
let page = ctx.pages().find(p => p.url().includes("game.html")) || await ctx.newPage();
if (!page.url().includes("game.html")) await page.goto(GAME, { waitUntil: "domcontentloaded" });
await page.bringToFront().catch(() => {});

console.log(">>> Скан game.html напрямую. Делай в игре что угодно — ловит уникальные состояния.");
console.log(">>> q или Ctrl+C — стоп, файл готов.\n");

let stop = false;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", l => { if (l.trim().toLowerCase() === "q") stop = true; });
process.on("SIGINT", () => { stop = true; });

let prev = "", n = 0; const t0 = Date.now();
while (!stop) {
  const r = await scanDoc(page).catch(() => null);
  if (r && r.hash !== prev) {
    prev = r.hash; n++;
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n[${sec}s] vp=${r.vp} open=[${r.open.join(",")}]  (уник.: ${n}, групп дублей: ${r.items.length})`);
    for (const it of r.items) {
      console.log(`\n${it.label}`);
      for (const [p, srcs] of it.dups) { console.log(`  ${p}: ${srcs.length} sources`); for (const s of srcs) console.log(`    ${s.sel} -> ${s.v}`); }
    }
  }
  await new Promise(res => setTimeout(res, INTERVAL));
}
rl.close();
console.log(`\n>>> Стоп. Уник. состояний: ${n}. Файл: ui_dupes_game.txt`);
await browser.close().catch(() => {});
