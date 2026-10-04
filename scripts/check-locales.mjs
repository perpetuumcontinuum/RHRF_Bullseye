// Locale parity + registry check. Exit 1 on drift.
import { readFileSync, readdirSync } from "node:fs";
const dir = new URL("../games/rhrf-bullseye/locales/", import.meta.url).pathname;
const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
const keysOf = (f) => [...readFileSync(dir + f, "utf8").matchAll(/^\s*"([^"]+)"\s*:/gm)].map((m) => m[1]);

// registry: every locale file must be imported in locales/index.ts
const reg = readFileSync(dir + "index.ts", "utf8");
const imported = new Set([...reg.matchAll(/import\s+\w+\s+from\s+"\.\/(\w+)"/g)].map((m) => m[1]));
const fileCodes = files.map((f) => f.replace(/\.ts$/, ""));
let bad = 0;
for (const c of fileCodes) if (!imported.has(c)) { console.log(`REGISTRY: locale "${c}.ts" not imported in index.ts`); bad++; }
for (const c of imported) if (!fileCodes.includes(c)) { console.log(`REGISTRY: import "./${c}" has no matching file`); bad++; }

const base = keysOf("en.ts");
for (const f of files) {
  if (f === "en.ts") continue;
  const keys = keysOf(f);
  const missing = base.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !base.includes(k));
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  console.log(`${f}: ${keys.length} keys`);
  if (missing.length) { console.log("  MISSING:", missing.join(", ")); bad++; }
  if (extra.length) { console.log("  EXTRA:", extra.join(", ")); bad++; }
  if (dup.length) { console.log("  DUPLICATE:", [...new Set(dup)].join(", ")); bad++; }
}
console.log(bad ? `\nFAIL: ${bad} issue(s)` : `\nOK: ${base.length} keys, registry in sync (${fileCodes.join(", ")})`);
process.exit(bad ? 1 : 0);
