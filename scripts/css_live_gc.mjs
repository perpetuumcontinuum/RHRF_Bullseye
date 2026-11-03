import { chromium } from "playwright";
import fs from "node:fs";
import readline from "node:readline";

const CDP = process.env.UI_CDP || "http://localhost:9222";
const MATCH = process.env.UI_MATCH || "4173";
const GAME_FRAME = process.env.UI_GAME_FRAME || "index.html";
const INTERVAL = +(process.env.UI_INTERVAL || 1200);
const OUT = process.env.UI_OUT || "css_dead.json";

const PROPS = (process.env.UI_PROPS || [
  "box-sizing","display","position","top","right","bottom","left","transform","z-index",
  "align-items","justify-content","flex","flex-grow","flex-shrink","flex-basis","gap",
  "height","min-height","max-height","width","min-width","max-width",
  "padding","padding-top","padding-right","padding-bottom","padding-left",
  "border","border-width","border-style","border-color","border-radius",
  "font","font-family","font-size","font-weight","letter-spacing","line-height",
  "text-transform","text-align","white-space","overflow","text-overflow",
  "color","background","background-color","cursor","transition","animation",
].join(",")).split(",").map(s => s.trim()).filter(Boolean);

const collect = (frame) => frame.evaluate((props) => {
  const propSet = new Set(props);
  const rules = [];
  let order = 0;

  const cleanSel = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\s+/g, " ").trim();
  const normVal = (v) => String(v || "").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\s+/g, " ").trim();

  const spec = (sel) => {
    const s = sel.replace(/\[[^\]]+\]/g, ".attr");
    const ids = (s.match(/#[A-Za-z_-][\w-]*/g) || []).length;
    const classes = (s.match(/\.[A-Za-z_-][\w-]*/g) || []).length;
    const pseudoClasses = (s.match(/:(?!:)[A-Za-z-]+(?:\([^)]*\))?/g) || []).length;
    const elements = (s.match(/(?:^|[\s>+~])(?:[A-Za-z][\w-]*|\*)/g) || []).length;
    const pseudoElements = (s.match(/::[A-Za-z-]+/g) || []).length;
    return [ids, classes + pseudoClasses, elements + pseudoElements];
  };

  const cmp = (a, b) => {
    const ai = a.d.important ? 1 : 0;
    const bi = b.d.important ? 1 : 0;
    if (ai !== bi) return ai - bi;

    const sa = spec(a.r.sel);
    const sb = spec(b.r.sel);
    for (let i = 0; i < 3; i++) {
      if (sa[i] !== sb[i]) return sa[i] - sb[i];
    }

    return a.d.order - b.d.order;
  };

  const walk = (list, media) => {
    for (const r of list) {
      try {
        if (r.type === 1 && r.selectorText) {
          const decls = [];
          for (const p of r.style) {
            const prop = String(p).trim();
            if (!prop || prop.startsWith("--") || !propSet.has(prop)) continue;
            const value = normVal(r.style.getPropertyValue(prop));
            const important = r.style.getPropertyPriority(prop) === "important";
            decls.push({ prop, value, important, order: ++order });
          }
          if (decls.length) {
            rules.push({ sel: cleanSel(r.selectorText), media, decls });
          }
        } else if (r.type === 4) {
          const cond = r.conditionText || "";
          if (matchMedia(cond).matches) {
            walk(r.cssRules, media ? `${media} and ${cond}` : cond);
          }
        } else if (r.type === 12) {
          const cond = r.conditionText || "";
          if (CSS.supports(cond)) {
            walk(r.cssRules, media ? `${media} and ${cond}` : cond);
          }
        }
      } catch {}
    }
  };

  for (const ss of document.styleSheets) {
    try { walk(ss.cssRules, ""); } catch {}
  }

  const lost = new Map();
  const won = new Map();
  const key = (o) => JSON.stringify([o.sel, o.media, o.prop, o.important]);
  const obj = (r, d) => ({ sel: r.sel, media: r.media, prop: d.prop, value: d.value, important: d.important });

  const all = document.querySelectorAll("*");

  for (const el of all) {
    const byProp = new Map();

    for (const r of rules) {
      let m = false;
      try { m = el.matches(r.sel); } catch {}
      if (!m) continue;

      for (const d of r.decls) {
        // Не считаем мёртвыми то, что сейчас перебито inline-стилем:
        // inline может быть динамическим, а базовый стиль нужен без него.
        if (el.style.getPropertyValue(d.prop)) continue;

        if (!byProp.has(d.prop)) byProp.set(d.prop, []);
        byProp.get(d.prop).push({ r, d });
      }
    }

    for (const [, cand] of byProp) {
      if (cand.length === 1) {
        const w = cand[0];
        won.set(key(obj(w.r, w.d)), obj(w.r, w.d));
        continue;
      }

      cand.sort(cmp);
      const winner = cand[cand.length - 1];
      const wk = obj(winner.r, winner.d);
      won.set(key(wk), wk);

      for (const c of cand) {
        if (c === winner) continue;
        const lk = obj(c.r, c.d);
        lost.set(key(lk), lk);
      }
    }
  }

  return {
    elements: all.length,
    rules: rules.length,
    lost: [...lost.values()],
    won: [...won.values()],
  };
}, PROPS);

const browser = await chromium.connectOverCDP(CDP);
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes(MATCH)) || ctx.pages().at(-1);

if (!page) {
  console.error("No page matching", MATCH);
  process.exit(1);
}

await page.bringToFront().catch(() => {});

console.log(">>> Live cascade GC подключён к Brave.");
console.log(">>> Открой/покажи все состояния: база, Shop, Guide, Profile, Missions, pause, mobile.");
console.log(">>> Скрипт сам сканирует все элементы в iframe index.html.");
console.log(">>> q или Ctrl+C — остановить и записать css_dead.json\n");

let stop = false;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", l => { if (l.trim().toLowerCase() === "q") stop = true; });
process.on("SIGINT", () => { stop = true; });

const lost = new Map();
const won = new Map();
let scans = 0;

while (!stop) {
  const frames = page.frames().filter(f => f.url().includes(GAME_FRAME));

  if (!frames.length) {
    console.log("iframe index.html ещё не найден; открой игру в Brave...");
  }

  for (const f of frames) {
    const r = await collect(f).catch(() => null);
    if (!r) continue;

    scans++;
    for (const x of r.lost) lost.set(JSON.stringify([x.sel, x.media, x.prop, x.important]), x);
    for (const x of r.won) won.set(JSON.stringify([x.sel, x.media, x.prop, x.important]), x);

    console.log(`scan ${scans}: elements=${r.elements}, rules=${r.rules}, lost=${r.lost.length}, won=${r.won.length}`);
  }

  await new Promise(res => setTimeout(res, INTERVAL));
}

const removable = [...lost.values()].filter(x => !won.has(JSON.stringify([x.sel, x.media, x.prop, x.important])));

fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  scans,
  lostTotal: lost.size,
  wonTotal: won.size,
  removable,
}, null, 2));

console.log(`\n>>> Стоп. Записано: ${OUT}`);
console.log(`>>> scans=${scans}, lost=${lost.size}, won=${won.size}, removable=${removable.length}`);

rl.close();
await browser.close().catch(() => {});
