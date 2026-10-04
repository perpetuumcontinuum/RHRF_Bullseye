// Inventory of every letter-bearing literal still hardcoded in components.
// AST walk via the already-installed typescript (no new deps). Tier 1 = confident
// UI text (unwrap now). Tier 2 = grouped by context (prop:/call:/return:/var:) so
// css/data/flavor self-label instead of drowning the list. Templates-with-holes are
// listed separately (class 2 -> need {placeholders}). Read-only; exit 0 always.
import ts from "typescript";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../games/rhrf-bullseye");

const TEXT_ATTRS = new Set(["aria-label","title","placeholder","alt","label","tooltip","heading","subtitle"]);
const ALLOW_PROPS = new Set(["label","title","name","text","desc","description","heading","subtitle","caption","message","msg","hint","tip","tooltip","placeholder","cta","confirm","cancel","ok","close","save","loading","empty","error","success","warning","notice","banner","toast","dialog","modal","screen","page","tab","section","group","lines","phrases"]);
// only used to COLLAPSE obvious css buckets into one summary line (never to hide text)
const CSS_PROP = /^(position|top|right|bottom|left|inset|zIndex|display|flex|flexDirection|flexWrap|flexGrow|flexShrink|flexBasis|justifyContent|alignItems|alignSelf|alignContent|gap|rowGap|columnGap|order|grid.*|place.*|margin.*|padding.*|width|height|min.*|max.*|size|blockSize|inlineSize|overflow.*|overscrollBehavior|visibility|cursor|pointerEvents|userSelect|touchAction|resize|verticalAlign|color|background.*|opacity|boxShadow|textShadow|filter|backdropFilter|mixBlendMode|isolation|border.*|outline.*|boxSizing|appearance|font.*|lineHeight|letterSpacing|wordSpacing|text.*|whiteSpace|wordBreak|overflowWrap|hyphens|direction|unicodeBidi|writingMode|textOrientation|transform.*|transition.*|animation.*|content|quotes|counter.*|listStyle.*|tableLayout|captionSide|emptyCells|pageBreak.*|break.*|orphans|widows|willChange|backfaceVisibility|perspective.*|clipPath|mask.*|fill|stroke.*|paintOrder|dominantBaseline|textAnchor|stopColor|stopOpacity|offset|fillRule|vectorEffect|imageRendering|shapeRendering|textRendering|colorRendering|flood.*|lightingColor|kerning|spacing|marker.*|gradient.*|patternUnits|spreadMethod|baselineShift|colorInterpolationFilters|printColorAdjust|[Ww]ebkit.*|[Mm]s.*)$/;

const enSrc = readFileSync(path.join(root, "locales/en.ts"), "utf8");
const PAIR = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const enValues = new Set(); for (const m of enSrc.matchAll(PAIR)) enValues.add(m[2]);
const enKeyCount = enValues.size;

function isNoise(raw){
  const t = raw.trim();
  if (t.length < 2) return true;
  if (!/\p{L}/u.test(t)) return true;
  if (/^[A-Za-z]$/.test(t)) return true;
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return true;
  if (/^--[\w-]+$/.test(t)) return true;
  if (/^(https?:|\/\/|\.\/|\.\.\/|www\.)/.test(t)) return true;
  if (/^[MLCQTVASZmlcqtvasz][\d\s.,\-eEMLCQTVASZmlcqtvasz]*$/.test(t) && /\d/.test(t)) return true;
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(t)) return true;
  if (/^[a-z][\w]*(\.[\w]+)+$/.test(t)) return true;
  if (/^\d+(\.\d+)?(px|vh|vw|vmin|vmax|%|em|rem|ch|ex|s|ms|deg|fr|pt|pc|in|cm|mm|dvh|svh|lvh)?$/.test(t)) return true;
  if (/^(utf-?8|ascii|latin-?\d*|json|html?|css|js|jsx|ts|tsx|mjs|cjs|svg|png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp3|mp4|webm|ogg|wav|flac|pdf|zip|tar|gz|tgz|bz2|xz|csv|tsv|xml|ya?ml|toml|ini|env|lock|md|markdown|rst|txt|log|sh|bash|exe|dll|so|dylib|wasm|bin|dat)$/.test(t)) return true;
  if (/monospace|sans-serif|serif|Courier|ui-|system-ui/i.test(t)) return true;
  return false;
}
const keyName = (n, sf) => (ts.isIdentifier(n)||ts.isStringLiteral(n)||ts.isNumericLiteral(n)) ? n.text : n.getText(sf);

function ownerTag(node, sf){
  let cur = node, steps = 0;
  while (cur && steps++ < 6){
    const p = cur.parent;
    if (!p) break;
    if (ts.isPropertyAssignment(p)) return "prop:" + keyName(p.name, sf);
    if (ts.isJsxAttribute(p)) return "attr:" + p.name.getText(sf);
    if (ts.isCallExpression(p)) return "call";
    if (ts.isReturnStatement(p)) return "return";
    if (ts.isVariableDeclaration(p)) return "var";
    if (ts.isJsxExpression(p)){ const gp = p.parent; if (gp && (ts.isJsxElement(gp)||ts.isJsxFragment(gp))) return "jsxchild"; return "attrvalue"; }
    cur = p;
  }
  return "other";
}

const files = ["index.tsx", ...readdirSync(path.join(root,"engine")).filter(f=>/\.tsx?$/.test(f)).map(f=>"engine/"+f)];
const t1 = new Map();          // txt -> {locs:[], tag}
const t2 = new Map();          // tag -> {n, samples:Set}
const templates = [];          // {rel,line,holes,tag,text}
const order = new Map(); files.forEach((f,i)=>order.set(f,i));

for (const rel of files){
  const sf = ts.createSourceFile(rel, readFileSync(path.join(root,rel),"utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  (function visit(node, parent){
    node.parent = parent;
    if (ts.isTemplateExpression(node)){
      const raw = node.getText(sf);
      if (!isNoise(raw.replace(/\$\{[^{}]*\}/g,"ZZ"))){
        templates.push({ rel, line: lineOf(node), holes: node.templateSpans.length, tag: ownerTag(node,sf), text: raw.replace(/\$\{[^{}]*\}/g,"${…}") });
      }
    } else if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)){
      const txt = (node.text||"").trim();
      if (txt && !isNoise(txt)){
        const tag = ownerTag(node, sf);
        const loc = rel + ":" + lineOf(node);
        const isT1 = tag === "jsxchild"
          || (tag.startsWith("attr:") && TEXT_ATTRS.has(tag.slice(5)))
          || (tag.startsWith("prop:") && ALLOW_PROPS.has(tag.slice(5)));
        if (isT1){ if(!t1.has(txt)) t1.set(txt,{locs:[],tag}); t1.get(txt).locs.push(loc); }
        else { if(!t2.has(tag)) t2.set(tag,{n:0,samples:new Set()}); const b=t2.get(tag); b.n++; if(b.samples.size<4) b.samples.add(txt); }
      }
    }
    ts.forEachChild(node, c => visit(c, node));
  })(sf, undefined);
}

console.log("UI-TEXT INVENTORY  scanned: " + files.join(", "));
console.log("existing en.ts keys: " + enKeyCount + "\n");

const t1rows = [...t1.entries()].sort((a,b)=>{
  const fa=order.get(a[1].locs[0].split(":")[0])??99, fb=order.get(b[1].locs[0].split(":")[0])??99;
  if(fa!==fb) return fa-fb;
  return (+a[1].locs[0].split(":")[1]) - (+b[1].locs[0].split(":")[1]);
});
console.log("=== TIER 1 — unwrap now (" + t1rows.length + " unique) ===");
for (const [txt,info] of t1rows){
  const extra = info.locs.length>3 ? " +" + (info.locs.length-3) : "";
  console.log("  " + JSON.stringify(txt).padEnd(34) + " " + info.locs.slice(0,3).join(", ") + extra + (enValues.has(txt)?"   [en-has]":""));
}

console.log("\n=== TIER 2 — by context (review/promote; css collapsed) ===");
const cssHidden = [...t2.entries()].filter(([tag])=>tag.startsWith("prop:") && CSS_PROP.test(tag.slice(5)));
const cssN = cssHidden.reduce((s,[,b])=>s+b.n,0);
for (const [tag,b] of [...t2.entries()].filter(([tag])=>!(tag.startsWith("prop:") && CSS_PROP.test(tag.slice(5)))).sort((a,b)=>b[1].n-a[1].n||a[0].localeCompare(b[0]))){
  console.log("  " + tag.padEnd(22) + String(b.n).padStart(3) + "  e.g. " + [...b.samples].map(s=>JSON.stringify(s)).join(", "));
}
if (cssN) console.log("  (collapsed " + cssHidden.length + " css-prop buckets, " + cssN + " literals — not text)");

console.log("\n=== TEMPLATES WITH HOLES — class 2, need {placeholders} (" + templates.length + ") ===");
for (const t of templates.sort((a,b)=>(order.get(a.rel)-order.get(b.rel))||a.line-b.line))
  console.log("  " + (t.rel+":"+t.line).padEnd(26) + "holes=" + t.holes + "  [" + t.tag + "]  " + t.text.slice(0,90));

console.log("\nDONE");
