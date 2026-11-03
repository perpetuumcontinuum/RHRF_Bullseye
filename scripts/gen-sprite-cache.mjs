// Пул id + детерминированный выбор. Смена состава = правка pool.json + --from-pool (без скана).
// node scripts/gen-sprite-cache.mjs --survey [--start 1] [--max-scan 8000] [--conc 25]
// node scripts/gen-sprite-cache.mjs --from-pool [--gen1 3] [--others 18] [--lock]
// node scripts/gen-sprite-cache.mjs --ids 157,487,489,3,4,... [--gen1 3] [--others 18] [--lock]
import { createFriendPublicClient } from "@rarefriends/friendsdk/wallet";
import { GENERATION_SPRITE_MANIFEST, FAMILIES_REGISTRY_ABI } from "@rarefriends/friendsdk/sprites";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ERC721_ABI = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "generation", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "uint8" }] },
];

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(k);

const SURVEY = flag("--survey");
const FROM_POOL = flag("--from-pool");
const START = BigInt(opt("--start", "1"));
const MAX_SCAN = parseInt(opt("--max-scan", "8000"), 10);
const NEED_GEN1 = parseInt(opt("--gen1", "3"), 10);
const NEED_OTHERS = parseInt(opt("--others", "18"), 10);
const CONC = Math.max(1, parseInt(opt("--conc", "25"), 10));
const LOCK = flag("--lock");
const IDS_ARG = opt("--ids", "");

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..");
const CACHE_TS = resolve(ROOT, "games/rhrf-bullseye/engine/sprite-cache.ts");
const LOCK_JSON = resolve(ROOT, "games/rhrf-bullseye/engine/sprite-cache.ids.json");
const POOL_JSON = resolve(ROOT, "games/rhrf-bullseye/engine/sprite-cache.pool.json");

const client = createFriendPublicClient();
const REG = GENERATION_SPRITE_MANIFEST.registry;
const GEN_ADDR = GENERATION_SPRITE_MANIFEST.generations
  || GENERATION_SPRITE_MANIFEST.token
  || GENERATION_SPRITE_MANIFEST.nft;
if (!GEN_ADDR) { console.error("Нет адреса Generations. Ключи:", Object.keys(GENERATION_SPRITE_MANIFEST)); process.exit(3); }

const readReg = (fn, args) => client.readContract({ address: REG, abi: FAMILIES_REGISTRY_ABI, functionName: fn, args });
const readGen = (fn, args) => client.readContract({ address: GEN_ADDR, abi: ERC721_ABI, functionName: fn, args });

async function chunkMap(items, fn, label) {
  const out = [];
  for (let i = 0; i < items.length; i += CONC) {
    const slice = items.slice(i, i + CONC);
    const res = await Promise.all(slice.map(async (x) => {
      try { return { ok: true, value: await fn(x) }; } catch (e) { return { ok: false, error: e }; }
    }));
    out.push(...res);
    if (label) process.stderr.write(`${label}: ${Math.min(i + CONC, items.length)}/${items.length}\r`);
  }
  if (label) process.stderr.write("\n");
  return out;
}

// полный рид арта по id (для --from-pool / --ids). Пулу доверяем, ownerOf не проверяем.
async function artFor(id) {
  const g = Number(await readGen("generation", [id]));
  const familyId = await readReg("familyOf", [id]);
  const seed = await readReg("seedOf", [id]);
  const frames = await readReg("frames", [familyId, seed]);
  if (!Array.isArray(frames) || frames.length !== 64) throw new Error(`frames.length=${frames?.length}`);
  return { familyId, seed, generation: g, frames: frames.map((f) => "0x" + BigInt(f).toString(16)) };
}

// ===== 0. SURVEY: скан -> pool.json (id+поколение, без frames) =====
if (SURVEY) {
  const ids = [];
  for (let i = 0n; i < BigInt(MAX_SCAN); i++) ids.push(START + i);
  const alive = await chunkMap(ids, (id) => readGen("ownerOf", [id]), "ownerOf");
  const live = [];
  for (let i = 0; i < ids.length; i++) if (alive[i].ok) live.push(ids[i]);
  console.log(`живых: ${live.length}/${ids.length}`);
  if (!live.length) { console.error("!! ни одного живого."); process.exit(2); }

  const gens = await chunkMap(live, (id) => readGen("generation", [id]), "generation");
  const HIST = {}, GEN1 = [], OTHERS = [];
  for (let i = 0; i < live.length; i++) {
    if (!gens[i].ok) continue;
    const g = Number(gens[i].value);
    HIST[g] = (HIST[g] || 0) + 1;
    (g === 1 ? GEN1 : OTHERS).push({ id: live[i].toString(), generation: g });
  }
  console.log("гистограмма:", JSON.stringify(HIST));
  console.log(`gen1: ${GEN1.length}, не-gen1: ${OTHERS.length}`);
  if (GEN1.length < NEED_GEN1) { console.error(`!! gen1 ${GEN1.length} < ${NEED_GEN1}. Увеличь --max-scan.`); process.exit(2); }

  writeFileSync(POOL_JSON, JSON.stringify({ gen1: GEN1, others: OTHERS }, null, 2), "utf-8");
  console.log("POOL записан:", POOL_JSON);
  console.log(`Далее: node scripts/gen-sprite-cache.mjs --from-pool --gen1 ${NEED_GEN1} --others ${NEED_OTHERS} --lock`);
  process.exit(0);
}

// ===== 1. Список id: --ids / --from-pool / lock =====
let pickedGen1 = [], pickedOthers = [];
if (IDS_ARG) {
  const all = IDS_ARG.split(",").map((s) => s.trim()).filter(Boolean);
  // сортируем по поколению, чтобы 3 gen1 были первыми независимо от порядка ввода
  const withGen = await chunkMap(all.map(BigInt), (id) => readGen("generation", [id]), "gen");
  for (let i = 0; i < all.length; i++) {
    if (!withGen[i].ok) { console.error(`FAIL ${all[i]}: не читается`); continue; }
    (Number(withGen[i].value) === 1 ? pickedGen1 : pickedOthers).push(all[i]);
  }
} else if (FROM_POOL) {
  if (!existsSync(POOL_JSON)) { console.error("!! Нет pool.json. Сначала --survey."); process.exit(1); }
  const pool = JSON.parse(readFileSync(POOL_JSON, "utf-8"));
  pickedGen1 = (pool.gen1 || []).slice(0, NEED_GEN1).map((x) => String(x.id));
  pickedOthers = (pool.others || []).slice(0, NEED_OTHERS).map((x) => String(x.id));
  console.log(`from-pool: gen1 ${pickedGen1.length}, others ${pickedOthers.length}`);
} else if (existsSync(LOCK_JSON)) {
  const lock = JSON.parse(readFileSync(LOCK_JSON, "utf-8"));
  const withGen = await chunkMap(lock.map(BigInt), (id) => readGen("generation", [id]), "gen");
  for (let i = 0; i < lock.length; i++) {
    if (!withGen[i].ok) continue;
    (Number(withGen[i].value) === 1 ? pickedGen1 : pickedOthers).push(lock[i]);
  }
  console.log("LOCK: id из файла:", lock.length);
} else {
  console.error("!! Укажи --survey | --from-pool | --ids | (lock-файл).");
  process.exit(1);
}

const candidates = [...pickedGen1, ...pickedOthers].map(BigInt);
if (pickedGen1.length < NEED_GEN1 || pickedOthers.length < NEED_OTHERS) {
  console.error(`!! Мало: gen1=${pickedGen1.length}/${NEED_GEN1}, others=${pickedOthers.length}/${NEED_OTHERS}.`);
  process.exit(2);
}

// ===== 2. Рид арта только по выбранным =====
const out = {};
let g1 = 0, go = 0;
for (const id of candidates) {
  const key = id.toString();
  try {
    const a = await artFor(id);
    if (a.generation === 1) g1++; else go++;
    out[key] = a;
    console.log(`ok ${key} gen=${a.generation} family=${a.familyId}`);
  } catch (e) { console.error(`FAIL ${key}: ${e.message}`); }
}
if (g1 < NEED_GEN1 || go < NEED_OTHERS) {
  console.error(`\n!! Состав не сошёлся: gen1=${g1}/${NEED_GEN1}, others=${go}/${NEED_OTHERS}. Кэш НЕ записан.`);
  process.exit(2);
}

// ===== 3. Запись кэша + lock =====
const body =
  "// Генерируется scripts/gen-sprite-cache.mjs. Не редактировать вручную.\n" +
  "// {familyId, seed, generation, frames}. Арт независим от существования токена.\n" +
  "export const SPRITE_CACHE: Record<string, { familyId: number; seed: number; generation: number; frames: string[] }> = " +
  JSON.stringify(out, null, 2) + ";\n";
writeFileSync(CACHE_TS, body, "utf-8");
if (LOCK) writeFileSync(LOCK_JSON, JSON.stringify(candidates.map(String), null, 2), "utf-8");
console.log(`\nWROTE ${CACHE_TS}: ${Object.keys(out).length} tokens (gen1=${g1}, others=${go})`);
