// Scape Planner: the catalogue of placeable pieces. One entry per object; the
// palette, the spawn sizes, the rules and the tests all read from here, so
// adding a piece means adding one line and one prefab input in Main.

export type PieceKind = "stone" | "wood" | "plant";
export type PlantForm = "carpet" | "midground" | "background" | "epiphyte" | "none";
export type Zone = "foreground" | "midground" | "background" | "anywhere" | "on-hardscape";

export interface CatalogEntry {
  id: string;
  /** Button label, 9 characters or fewer. */
  label: string;
  kind: PieceKind;
  form: PlantForm;
  species: string;
  /** Placed size in cm (width x height x depth) at scale 1. */
  widthCm: number;
  heightCm: number;
  depthCm: number;
  /** Mature height in the aquarium, used by the style rules (plants). */
  matureHeightCm: number;
  zone: Zone;
  /** Broad-leaved plant (Anubias, Cryptocoryne) for the jungle rule. */
  broadLeaf: boolean;
  /** Red plant (Ludwigia) for the Dutch focal-group rule. */
  red: boolean;
  /** Stone sizes cycle through this ladder as more of the same stone are placed (fractions of heightCm). */
  sizeLadder: number[];
}

export const STONE_LADDER = [1.0, 0.6, 0.4];

export const CATALOG: CatalogEntry[] = [
  { id: "seiryu", label: "Seiryu", kind: "stone", form: "none", species: "Seiryu stone", widthCm: 12.5, heightCm: 22, depthCm: 6.8, matureHeightCm: 22, zone: "anywhere", broadLeaf: false, red: false, sizeLadder: STONE_LADDER },
  { id: "dragon", label: "Dragon", kind: "stone", form: "none", species: "Dragon stone", widthCm: 20, heightCm: 17, depthCm: 12, matureHeightCm: 17, zone: "anywhere", broadLeaf: false, red: false, sizeLadder: STONE_LADDER },
  { id: "spiderwood", label: "Spider", kind: "wood", form: "none", species: "Spider wood", widthCm: 28, heightCm: 18, depthCm: 22, matureHeightCm: 18, zone: "anywhere", broadLeaf: false, red: false, sizeLadder: [1.0] },
  { id: "manzanita", label: "Manzanita", kind: "wood", form: "none", species: "Manzanita", widthCm: 30, heightCm: 20, depthCm: 14, matureHeightCm: 20, zone: "anywhere", broadLeaf: false, red: false, sizeLadder: [1.0] },
  { id: "carpet", label: "Carpet", kind: "plant", form: "carpet", species: "Monte Carlo", widthCm: 12, heightCm: 3, depthCm: 12, matureHeightCm: 4, zone: "foreground", broadLeaf: false, red: false, sizeLadder: [1.0] },
  { id: "hairgrass", label: "Hairgrass", kind: "plant", form: "carpet", species: "Dwarf hairgrass", widthCm: 12, heightCm: 4, depthCm: 12, matureHeightCm: 6, zone: "foreground", broadLeaf: false, red: false, sizeLadder: [1.0] },
  { id: "bush", label: "Crypt", kind: "plant", form: "midground", species: "Cryptocoryne", widthCm: 12, heightCm: 12, depthCm: 12, matureHeightCm: 15, zone: "midground", broadLeaf: true, red: false, sizeLadder: [1.0] },
  { id: "anubias", label: "Anubias", kind: "plant", form: "epiphyte", species: "Anubias nana", widthCm: 12, heightCm: 8, depthCm: 10, matureHeightCm: 10, zone: "on-hardscape", broadLeaf: true, red: false, sizeLadder: [1.0] },
  { id: "stems", label: "Rotala", kind: "plant", form: "background", species: "Rotala", widthCm: 8, heightCm: 25, depthCm: 8, matureHeightCm: 35, zone: "background", broadLeaf: false, red: false, sizeLadder: [1.0] },
  { id: "ludwigia", label: "Ludwigia", kind: "plant", form: "background", species: "Ludwigia red", widthCm: 8, heightCm: 22, depthCm: 8, matureHeightCm: 30, zone: "background", broadLeaf: false, red: true, sizeLadder: [1.0] },
];

export function catalogEntry(id: string): CatalogEntry | null {
  for (const e of CATALOG) if (e.id === id) return e;
  return null;
}

export function isHardscapeKind(kind: PieceKind): boolean {
  return kind === "stone" || kind === "wood";
}

/** Scene-object name used for a placed piece of this entry (LEAF finds pieces by this name). */
export function pieceObjectName(entry: CatalogEntry): string {
  return "Piece_" + entry.label;
}
