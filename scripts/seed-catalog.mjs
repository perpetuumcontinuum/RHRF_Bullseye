// Emit item.<id>.name / item.<id>.desc into en.ts from catalog.ts object literals.
// Same single-source-of-truth rule as badge keys: ids live in data, never retyped.
// Conflicting values for one id are reported, not silently overwritten.
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __ = path.dirname(fileURLToPath(import.meta.url));
const G = path.resolve(__, "../games/rhrf-bullseye");
const src = readFileSync(path.join(G, "engine/catalog.ts"), "utf8");
const sf = ts.createSourceFile("catalog.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const lit = (n) => (n && ts.isStringLiteral(n) ? n.text : null);
const pname = (p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null);

const out = new Map(); const conflicts = [];
(function visit(node) {
  if (ts.isObjectLiteralExpression(node)) {
    let id = null, name = null, desc = null;
    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const k = pname(p);
      if (k === "id") id = lit(p.initializer);
      else if (k === "name") name = lit(p.initializer);
      else if (k === "description" || k === "desc") desc = lit(p.initializer);
    }
    if (id && name) {
      for (const [sfx, val] of [["name", name], ["desc", desc]]) {
        if (val == null) continue;
        const key = `item.${id}.${sfx}`;
        if (out.has(key) && out.get(key) !== val) conflicts.push(key);
        out.set(key, val);
      }
    }
  }
  ts.forEachChild(node, visit);
})(sf);

const p = path.join(G, "locales/en.ts");
let s = readFileSync(p, "utf8");
const miss = [...out.entries()].filter(([k]) => !s.includes('"%s"' % k));
if (miss.length) {
  const add = miss.map(([k, v]) => "  " + JSON.stringify(k) + ": " + JSON.stringify(v) + ",").join("\n") + "\n";
  const i = s.lastIndexOf("};");
  writeFileSync(p, s.slice(0, i) + add + s.slice(i));
}
console.log("catalog: %d item keys (%d new)%s", out.size, miss.length,
  conflicts.length ? " | CONFLICTS: " + [...new Set(conflicts)].join(", ") : "");
