import { chromium } from "playwright";

const rootUrl = process.env.UI_URL || "http://localhost:4174/";
const PROPS = new Set((process.env.UI_PROPS || [
  "box-sizing","display","align-items","justify-content","flex","flex-grow","flex-shrink","flex-basis","gap",
  "height","min-height","max-height","width","min-width","max-width","padding","padding-top","padding-right","padding-bottom","padding-left",
  "border","border-width","border-style","border-color","border-radius",
  "font","font-family","font-size","font-weight","letter-spacing","line-height","text-transform","text-align","white-space","overflow","text-overflow",
  "color","background","background-color","cursor","transition","animation",
].join(",")).split(",").map(s=>s.trim()).filter(Boolean));

const collect = (frame) => frame.evaluate((propsArr) => {
  const props = new Set(propsArr);
  const rules = [];

  const walk = (list) => {
    for (const r of list) {
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
    }
  };

  for (const ss of document.styleSheets) { try { walk(ss.cssRules); } catch {} }

  const out = [];
  for (const el of document.querySelectorAll("*")) {
    const counts = {};
    for (const r of rules) {
      let m = false;
      try { m = el.matches(r.sel); } catch {}
      if (!m) continue;
      for (const [p, v] of Object.entries(r.decls)) {
        (counts[p] ||= new Map()).set(r.key, { sel: r.sel, v });
      }
    }
    const dups = Object.entries(counts).filter(([, m]) => m.size > 1);
    if (!dups.length) continue;

    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const cls = (el.className || "").toString().trim().split(/\s+/).filter(Boolean).map(x => "." + x).join("");
    out.push({
      label: `${tag}${id}${cls}`,
      dups: dups.map(([p, m]) => [p, [...m.values()]]),
    });
  }
  return out;
}, [...PROPS]);

const scanFrames = async (page, tag, results) => {
  for (const f of page.frames()) {
    const items = await collect(f).catch(() => []);
    if (items.length) results.push({ tag, url: f.url(), items });
  }
};

const prepare = async (page) => {
  await page.goto(rootUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  const friend = page.locator(".rf-frame-friends button").first();
  if (await friend.isVisible().catch(() => false)) {
    await friend.click().catch(() => {});
  }

  let game = null;
  for (let i = 0; i < 100; i++) {
    game = page.frames().find((f) => f.url().includes("game.html"));
    if (game) break;
    await page.waitForTimeout(250);
  }
  game = game || page.mainFrame();

  await page.waitForTimeout(1200);

  const lang = game.locator(".rf-entry-lang").first();
  if (await lang.isVisible().catch(() => false)) {
    await lang.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  const mode = game.locator(".rf-entry-mode:not(.rf-entry-mode--plateau)").first();
  if (await mode.isVisible().catch(() => false)) {
    await mode.click().catch(() => {});
  }

  await game.waitForSelector(".scene-container, .rf-ui-item, .controls-row, .rf-top-bar", { timeout: 20000 }).catch(() => {});
  return game;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const results = [];

let game = await prepare(page);
await scanFrames(page, "desktop-base", results);

const overlays = [
  ["shop", ".rf-top-bar__btn--shop", ".rf-shop-close"],
  ["guide", ".rf-top-bar__btn--guide", ".rf-guide-close"],
  ["profile", ".rf-top-bar__btn--profile", ".rf-profile-close"],
  ["missions", ".rf-missions__toggle", null],
];

for (const [name, openSel, closeSel] of overlays) {
  const btn = game.locator(openSel).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(700);
    await scanFrames(page, "desktop-open:" + name, results);
    if (closeSel) await game.locator(closeSel).first().click().catch(() => {});
    else await btn.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

await page.setViewportSize({ width: 390, height: 844 });
game = await prepare(page);
await scanFrames(page, "mobile-base", results);

const mBtn = game.locator(".rf-missions__toggle").first();
if (await mBtn.isVisible().catch(() => false)) {
  await mBtn.click().catch(() => {});
  await page.waitForTimeout(700);
  await scanFrames(page, "mobile-open:missions", results);
  await mBtn.click().catch(() => {});
}

await browser.close();

for (const g of results) {
  console.log(`\n===== [${g.tag}] ${g.url} =====`);
  for (const it of g.items) {
    console.log(`\n${it.label}`);
    for (const [p, srcs] of it.dups) {
      console.log(`  ${p}: ${srcs.length} sources`);
      for (const s of srcs) console.log(`    ${s.sel} -> ${s.v}`);
    }
  }
}

console.log(`\nGroups scanned: ${results.length}`);
