// Scape Planner: the catalogue of placeable pieces. One entry per object; the
// palette, the spawn sizes, the rules and the tests all read from here.
// `mesh` names the GLB prefab (one @input per mesh in Main). Several species
// share a mesh and differ by tint and size; those are marked `variantOf`.
// Carpets are procedural tiles (no mesh), and the Base tab holds soil and sand
// mounds that reshape the substrate.

import { CarpetSpec } from "./ScapePlannerCarpet";
import { MoundMaterial } from "./ScapePlannerSubstrate";

export type PieceKind = "stone" | "wood" | "plant" | "substrate";
export type PlantForm = "carpet" | "midground" | "background" | "epiphyte" | "none";
export type Zone = "foreground" | "midground" | "background" | "anywhere" | "on-hardscape";
/** Palette tab a piece is listed under. */
export type Tab = "base" | "stone" | "wood" | "carpet" | "mid" | "back" | "epi";
/** How a piece is drawn: a GLB prefab, a procedural carpet tile, or a mound in the substrate. */
export type RenderKind = "mesh" | "carpet" | "mound" | "moss";

export interface CatalogEntry {
  id: string;
  /** Button label, 9 characters or fewer. */
  label: string;
  kind: PieceKind;
  form: PlantForm;
  tab: Tab;
  species: string;
  /** Prefab key, see Main's prefab inputs. */
  mesh: string;
  /** Optional base-colour multiplier for species that share a mesh. */
  tint: vec4 | null;
  /** Placed size in cm (width x height x depth) at scale 1. */
  widthCm: number;
  heightCm: number;
  depthCm: number;
  /** Mature height in the aquarium, used by the style rules (plants). */
  matureHeightCm: number;
  zone: Zone;
  broadLeaf: boolean;
  red: boolean;
  /** Size cycle for the Size button (fractions of the placed size). */
  sizeLadder: number[];
  /** Set when the model is a tinted or rescaled variant of another species' mesh. */
  variantOf: string | null;
  render: RenderKind;
  /** Blade or leaf settings for carpet tiles. */
  carpet: CarpetSpec | null;
  /** Soil or sand, for substrate mounds. */
  moundMaterial: MoundMaterial | null;
  /** Epiphytes: the height band on the host where they attach, as fractions of the host height (0 = foot, 1 = top). */
  attachBand: number[] | null;
}

export const STONE_LADDER = [1.0, 0.6, 0.4];
const ONE = [1.0];

function stone(id: string, label: string, species: string, mesh: string, w: number, h: number, d: number, tint: vec4 | null = null, variantOf: string | null = null): CatalogEntry {
  return { id, label, kind: "stone", form: "none", tab: "stone", species, mesh, tint, widthCm: w, heightCm: h, depthCm: d, matureHeightCm: h, zone: "anywhere", broadLeaf: false, red: false, sizeLadder: STONE_LADDER, variantOf, render: "mesh", carpet: null, moundMaterial: null, attachBand: null };
}
function wood(id: string, label: string, species: string, mesh: string, w: number, h: number, d: number, tint: vec4 | null = null, variantOf: string | null = null): CatalogEntry {
  return { id, label, kind: "wood", form: "none", tab: "wood", species, mesh, tint, widthCm: w, heightCm: h, depthCm: d, matureHeightCm: h, zone: "anywhere", broadLeaf: false, red: false, sizeLadder: [1.0, 0.7], variantOf, render: "mesh", carpet: null, moundMaterial: null, attachBand: null };
}
function plant(id: string, label: string, species: string, mesh: string, form: PlantForm, tab: Tab, zone: Zone, w: number, h: number, d: number, mature: number, opts: { tint?: vec4; broad?: boolean; red?: boolean; variantOf?: string; band?: number[] } = {}): CatalogEntry {
  return { id, label, kind: "plant", form, tab, species, mesh, tint: opts.tint || null, widthCm: w, heightCm: h, depthCm: d, matureHeightCm: mature, zone, broadLeaf: !!opts.broad, red: !!opts.red, sizeLadder: ONE, variantOf: opts.variantOf || null, render: "mesh", carpet: null, moundMaterial: null, attachBand: opts.band || null };
}

/** A carpet tile: tiles of tileCm x tileCm that the user lays edge to edge or overlapping. */
function carpet(id: string, label: string, species: string, tileCm: number, spec: CarpetSpec, mature: number): CatalogEntry {
  return { id, label, kind: "plant", form: "carpet", tab: "carpet", species, mesh: "", tint: null, widthCm: tileCm, heightCm: spec.heightCm, depthCm: tileCm,
    matureHeightCm: mature, zone: "foreground", broadLeaf: false, red: false, sizeLadder: ONE, variantOf: null, render: "carpet", carpet: spec, moundMaterial: null, attachBand: null };
}
/** A mound of soil or sand that raises the substrate; Bigger and Smaller scale it. */
function mound(id: string, label: string, material: MoundMaterial, radiusCm: number, heightCm: number, zone: Zone): CatalogEntry {
  return { id, label, kind: "substrate", form: "none", tab: "base", species: material === "sand" ? "Sand" : "Aqua soil", mesh: "", tint: null,
    widthCm: radiusCm * 2, heightCm, depthCm: radiusCm * 2, matureHeightCm: heightCm, zone, broadLeaf: false, red: false,
    sizeLadder: ONE, variantOf: null, render: "mound", carpet: null, moundMaterial: material, attachBand: null };
}

/** Moss is drawn as small leaves laid over the host's surface, not as a mesh. */
function mossOf(e: CatalogEntry): CatalogEntry {
  return { ...e, mesh: "", render: "moss", tint: null, widthCm: 8, depthCm: 8, heightCm: 1 };
}

const GREEN_LIGHT = new vec4(1.15, 1.2, 0.9, 1);
const GREEN_DARK = new vec4(0.7, 0.85, 0.7, 1);
const RED_DEEP = new vec4(1.2, 0.6, 0.6, 1);
const BRONZE = new vec4(1.1, 0.9, 0.7, 1);

export const CATALOG: CatalogEntry[] = [
  // ── substrate ──
  mound("soil", "Soil", "soil", 13, 6, "background"),
  mound("sand", "Sand", "sand", 11, 1.0, "foreground"),
  // ── stones ──
  stone("seiryu", "Seiryu", "Seiryu stone", "seiryu", 12.5, 22, 6.8, new vec4(0.38, 0.43, 0.5, 1)),
  stone("dragon", "Dragon", "Dragon stone", "dragon", 20, 17, 12),
  stone("lava", "Lava", "Lava rock", "lava", 14, 12, 12),
  stone("frodo", "Frodo", "Frodo stone", "frodo", 16, 18, 12),
  stone("elephant", "Elephant", "Elephant skin", "elephant", 20, 14, 14),
  stone("pagoda", "Pagoda", "Pagoda stone", "pagoda", 16, 18, 12),
  stone("slate", "Slate", "Dark slate (flat)", "slate", 16, 6, 10, new vec4(0.45, 0.48, 0.55, 1)),
  // ── wood ──
  wood("spiderwood", "Spider", "Spider wood", "spiderwood", 28, 18, 22),
  wood("manzanita", "Manzanita", "Manzanita", "manzanita", 30, 20, 14),
  wood("redmoor", "Redmoor", "Redmoor root", "redmoor", 26, 22, 20),
  wood("mopani", "Mopani", "Mopani wood", "mopani", 24, 12, 14),
  wood("bonsai", "Bonsai", "Bonsai driftwood", "bonsai", 24, 28, 18),
  wood("tallroot", "Tall root", "Redmoor root, tall", "tallroot", 14, 40, 12, new vec4(0.46, 0.3, 0.24, 1)),
  // ── carpets (foreground) ──
  carpet("carpet", "MonteCarl", "Monte Carlo", 10, { style: "leaves", heightCm: 2.2, density: 2.2, baseRgb: [0.16, 0.42, 0.12], tipRgb: [0.45, 0.8, 0.3] }, 3),
  carpet("hccuba", "HC Cuba", "Hemianthus Cuba", 10, { style: "leaves", heightCm: 1.6, density: 3.2, baseRgb: [0.2, 0.5, 0.14], tipRgb: [0.55, 0.9, 0.35] }, 2.5),
  carpet("glosso", "Glosso", "Glossostigma", 10, { style: "leaves", heightCm: 2.5, density: 1.8, baseRgb: [0.12, 0.38, 0.12], tipRgb: [0.4, 0.72, 0.3] }, 4),
  carpet("hairgrass", "Hairgrass", "Dwarf hairgrass", 10, { style: "blades", heightCm: 3.2, density: 11, baseRgb: [0.2, 0.46, 0.08], tipRgb: [0.6, 0.92, 0.28] }, 6),
  carpet("lilaeopsis", "Lilaeops", "Lilaeopsis", 10, { style: "blades", heightCm: 3.5, density: 4.5, baseRgb: [0.1, 0.32, 0.1], tipRgb: [0.42, 0.75, 0.28] }, 5),
  // ── midground ──
  plant("bush", "Crypt", "Cryptocoryne wendtii", "bush", "midground", "mid", "midground", 12, 12, 12, 15, { broad: true }),
  plant("cryptgreen", "CryptGrn", "Cryptocoryne green", "bush", "midground", "mid", "midground", 12, 10, 12, 12, { tint: GREEN_LIGHT, broad: true, variantOf: "bush" }),
  plant("cryptbrown", "CryptBrn", "Cryptocoryne brown", "bush", "midground", "mid", "midground", 14, 14, 14, 18, { tint: BRONZE, broad: true, variantOf: "bush" }),
  plant("staurogyne", "Stauro", "Staurogyne repens", "staurogyne", "midground", "mid", "midground", 10, 7, 10, 8),
  plant("blyxa", "Blyxa", "Blyxa japonica", "blyxa", "midground", "mid", "midground", 12, 12, 12, 15),
  plant("downoi", "Downoi", "Pogostemon helferi", "downoi", "midground", "mid", "midground", 10, 6, 10, 8),
  plant("lotus", "Red lotus", "Red tiger lotus", "lotus", "midground", "mid", "midground", 16, 14, 16, 20, { broad: true, red: true }),
  // ── background stems ──
  plant("stems", "Rotala", "Rotala rotundifolia", "stems", "background", "back", "background", 8, 25, 8, 35),
  plant("rotalagreen", "RotalaGrn", "Rotala green", "stems", "background", "back", "background", 8, 25, 8, 35, { tint: GREEN_LIGHT, variantOf: "stems" }),
  plant("limnophila", "Limnoph", "Limnophila", "stems", "background", "back", "background", 10, 28, 10, 40, { tint: GREEN_DARK, variantOf: "stems" }),
  plant("ludwigia", "Ludwigia", "Ludwigia red", "ludwigia", "background", "back", "background", 8, 22, 8, 30, { red: true }),
  plant("alternanth", "Altern", "Alternanthera", "ludwigia", "background", "back", "background", 9, 24, 9, 35, { tint: RED_DEEP, red: true, variantOf: "ludwigia" }),
  plant("hygrophila", "Hygro", "Hygrophila", "ludwigia", "background", "back", "background", 12, 28, 12, 40, { tint: new vec4(0.55, 1.45, 0.55, 1), broad: true, variantOf: "ludwigia" }),
  plant("bacopa", "Bacopa", "Bacopa", "ludwigia", "background", "back", "background", 8, 20, 8, 30, { tint: GREEN_DARK, variantOf: "ludwigia" }),
  plant("greenstems", "GreenStem", "Rotala green bush", "greenstems", "background", "back", "background", 12, 26, 12, 40),
  plant("vallisneria", "Vallis", "Vallisneria", "vallisneria", "background", "back", "background", 10, 30, 8, 45),
  plant("cyperus", "Cyperus", "Cyperus helferi", "vallisneria", "background", "back", "background", 12, 28, 10, 40, { tint: GREEN_DARK, variantOf: "vallisneria" }),
  plant("sword", "Sword", "Amazon sword", "sword", "background", "back", "background", 22, 26, 20, 40, { broad: true }),
  plant("swordred", "Red sword", "Echinodorus red", "sword", "background", "back", "background", 18, 22, 16, 35, { tint: RED_DEEP, broad: true, red: true, variantOf: "sword" }),
  // ── epiphytes and moss (on hardscape) ──
  plant("anubias", "Anubias", "Anubias nana", "anubias", "epiphyte", "epi", "on-hardscape", 6, 4, 5, 6, { band: [0.02, 0.3], broad: true }),
  plant("anubpetite", "AnubPetit", "Anubias petite", "anubias", "epiphyte", "epi", "on-hardscape", 4, 2.5, 3, 4, { band: [0.02, 0.3], tint: GREEN_DARK, broad: true, variantOf: "anubias" }),
  plant("anubbarteri", "AnubBart", "Anubias barteri", "anubias", "epiphyte", "epi", "on-hardscape", 10, 7, 8, 12, { band: [0.02, 0.3], broad: true, variantOf: "anubias" }),
  plant("javafern", "Java fern", "Java fern", "javafern", "epiphyte", "epi", "on-hardscape", 16, 20, 12, 25, { band: [0.05, 0.4], broad: true }),
  mossOf(plant("moss", "Xmas moss", "Christmas moss", "moss", "epiphyte", "epi", "on-hardscape", 4, 1.5, 3, 2, { band: [0.3, 0.65], tint: new vec4(0.55, 0.85, 0.5, 1) })),
  mossOf(plant("javamoss", "Java moss", "Java moss", "moss", "epiphyte", "epi", "on-hardscape", 4, 1.5, 3, 2, { band: [0.3, 0.65], tint: GREEN_DARK, variantOf: "moss" })),
  mossOf(plant("riccia", "Riccia", "Riccia", "moss", "epiphyte", "epi", "on-hardscape", 4, 1.5, 3, 2, { band: [0.3, 0.65], tint: GREEN_LIGHT, variantOf: "moss" })),
  plant("buce", "Buce", "Bucephalandra", "buce", "epiphyte", "epi", "on-hardscape", 5, 3, 4, 4, { band: [0.02, 0.3], broad: true }),
];

export function catalogEntry(id: string): CatalogEntry | null {
  for (const e of CATALOG) if (e.id === id) return e;
  return null;
}

export function entriesForTab(tab: Tab): CatalogEntry[] {
  return CATALOG.filter((e) => e.tab === tab);
}

/** Plants and moss that attach to stone or wood instead of standing on the substrate. */
export function isEpiphyte(entry: CatalogEntry): boolean {
  return entry.form === "epiphyte";
}

export function isHardscapeKind(kind: PieceKind): boolean {
  return kind === "stone" || kind === "wood";
}

/** Scene-object name used for a placed piece of this entry (LEAF finds pieces by this name). */
export function pieceObjectName(entry: CatalogEntry): string {
  return "Piece_" + entry.label;
}
