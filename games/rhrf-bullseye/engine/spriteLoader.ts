import {
  decodeGenerationSprites,
  createFriendReader,
  spriteFrame,
  type GenerationSprites,
  type SpriteFacing,
} from "@rarefriends/friendsdk/sprites";
import { SPRITE_CACHE } from "./sprite-cache";
import { LEADER_TOKEN } from "./residentTokens";

const DEFAULT_TOKEN = LEADER_TOKEN;

type CacheRec = { familyId: number; seed: number; generation?: number; frames: string[] };
const _cache = SPRITE_CACHE as Record<string, CacheRec>;

const _ready = new Map<string, GenerationSprites>();
const _pending = new Map<string, Promise<GenerationSprites>>();
let _reader: ReturnType<typeof createFriendReader> | null = null;

function fromCache(key: string): GenerationSprites | null {
  const rec = _cache[key];
  if (!rec) return null;
  try {
    return decodeGenerationSprites(
      BigInt(key),
      rec.familyId,
      rec.seed,
      rec.frames.map(BigInt),
    );
  } catch {
    return null;
  }
}

/** Синхронно: уже готовый спрайт, если есть. Иначе null. */
export function peekSprites(tokenId: bigint): GenerationSprites | null {
  const key = tokenId.toString();
  return _ready.get(key) ?? fromCache(key) ?? null;
}

export function loadSprites(tokenId: bigint): Promise<GenerationSprites> {
  const key = tokenId.toString();
  const done = _ready.get(key);
  if (done) return Promise.resolve(done);

  const cached = fromCache(key);
  if (cached) {
    _ready.set(key, cached);
    return Promise.resolve(cached);
  }

  let p = _pending.get(key);
  if (!p) {
    p = (async () => {
      _reader = _reader || createFriendReader();
      const v = await _reader.read(tokenId);
      _ready.set(key, v);
      return v;
    })();
    _pending.set(key, p);
    p.catch(() => _pending.delete(key));
  }
  return p;
}

export function preloadNpcSprites(tokenId: bigint = DEFAULT_TOKEN): Promise<GenerationSprites> {
  return loadSprites(tokenId);
}

export { spriteFrame, DEFAULT_TOKEN, type GenerationSprites, type SpriteFacing };
