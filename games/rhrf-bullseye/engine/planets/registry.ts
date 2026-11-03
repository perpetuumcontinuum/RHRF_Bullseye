import type { PlanetConfig } from "./types";

export const CYBER_HUB: PlanetConfig = {
  id: "cyber-hub",
  slug: "cyber-hub",
  title: "Cyber Hub",
  orientation: "floor",
  direction: "ltr",
  speedMultiplier: 1,
  rhythmOffset: 0,
  palette: {
    skyTop: "#12002a",
    skyBottom: "#050015",
    platform: "#1a0044",
    primary: "#ff00ff",
    secondary: "#00ffff",
    accent: "#ccff00",
    glow: "rgba(255,0,255,0.28)",
    frame: "rgba(0,255,255,0.35)",
  },
  notes: "Existing base map.",
};

export const NFT_PLANET: PlanetConfig = {
  id: "nft-planet",
  slug: "nft-planet",
  title: "NFT Planet",
  orientation: "ceiling",
  direction: "rtl",
  speedMultiplier: 1.08,
  rhythmOffset: 0.12,
  palette: {
    skyTop: "#1b0033",
    skyBottom: "#04000f",
    platform: "#2a0050",
    primary: "#cc00ff",
    secondary: "#00ffff",
    accent: "#ff2bd6",
    glow: "rgba(204,0,255,0.32)",
    frame: "rgba(0,255,255,0.55)",
  },
  notes: "Ceiling map, right-to-left, holographic collectibles.",
};

export const PLANETS = {
  cyberHub: CYBER_HUB,
  nftPlanet: NFT_PLANET,
};

export type PlanetId = keyof typeof PLANETS;
