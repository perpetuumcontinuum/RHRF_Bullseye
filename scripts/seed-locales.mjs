// Fill every locale with any en.ts key it lacks, using the EN value as a
// placeholder. Parity always holds; untranslated keys render English (same as
// runtime fallback) but are now editable lines per language. Idempotent.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const dir = new URL("../games/rhrf-bullseye/locales/", import.meta.url).pathname;
const PAIR = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const parse = (f) => { const o = {}; for (const m of readFileSync(dir + f, "utf8").matchAll(PAIR)) o[m[1]] = m[2]; return o; };
const en = parse("en.ts");
let touched = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts") && x !== "index.ts" && x !== "en.ts")) {
  const cur = parse(f);
  const src = readFileSync(dir + f, "utf8");
  const miss = Object.keys(en).filter((k) => !(k in cur));
  if (!miss.length) continue;
  const add = miss.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(en[k])},`).join("\n");
  const i = src.lastIndexOf("};");
  writeFileSync(dir + f, src.slice(0, i) + add + "\n" + src.slice(i));
  console.log(`${f}: +${miss.length} seeded`);
  touched++;
}
console.log(touched ? `seeded ${touched} locale(s)` : "all locales in sync with en.ts");
