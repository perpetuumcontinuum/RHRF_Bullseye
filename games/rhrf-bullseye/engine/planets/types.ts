export type PlanetOrientation = "floor" | "ceiling";
export type PlanetDirection = "ltr" | "rtl";

export interface PlanetPalette {
  skyTop: string;
  skyBottom: string;
  platform: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  frame: string;
}

export interface PlanetConfig {
  id: string;
  slug: string;
  title: string;
  orientation: PlanetOrientation;
  direction: PlanetDirection;
  speedMultiplier: number;
  rhythmOffset: number;
  palette: PlanetPalette;
  notes?: string;
}
