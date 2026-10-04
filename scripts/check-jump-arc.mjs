// Guard: engine/jump.ts JUMP_ARC_MS must equal the CSS archerJumpSpin360 duration.
// The 1200ms-vs-1155ms drift made the player "visually airborne but vulnerable".
// Static, no browser/wallet. Exit 1 on drift.
import { readFileSync } from "node:fs";
const jump = readFileSync("games/rhrf-bullseye/engine/jump.ts", "utf8");
const css  = readFileSync("games/rhrf-bullseye/style.css", "utf8");

const ms = Number((jump.match(/JUMP_ARC_MS\s*=\s*(\d+)/) || [])[1]);
const start = Number((jump.match(/JUMP_SAFE_START_MS\s*=\s*(\d+)/) || [])[1]);
const endExpr = (jump.match(/JUMP_SAFE_END_MS\s*=\s*JUMP_ARC_MS\s*-\s*JUMP_SAFE_START_MS/) ? "derived" : null);
const sec = (css.match(/archerJumpSpin360\s+([\d.]+)s/) || [])[1];

let bad = 0;
if (!ms || !start || !sec) { console.log("PARSE FAIL", { ms, start, sec }); process.exit(1); }
const cssMs = Math.round(parseFloat(sec) * 1000);
if (cssMs !== ms) { console.log(`DRIFT: CSS ${cssMs}ms != JUMP_ARC_MS ${ms}ms`); bad++; }
if (!endExpr) { console.log("SAFE END not derived from arc — hardcoded, will drift"); bad++; }
else if (!(start > 0 && start * 2 < ms)) { console.log(`SAFE WINDOW not symmetric/valid: start=${start} arc=${ms}`); bad++; }

console.log(bad ? `FAIL (${bad})` : `OK: arc ${ms}ms == CSS ${cssMs}ms, safe window ${start}..${ms - start}ms symmetric`);
process.exit(bad ? 1 : 0);
