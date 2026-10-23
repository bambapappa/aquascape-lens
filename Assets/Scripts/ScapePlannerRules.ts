// Scape Planner: the general composition rules behind the coach card.
// Pure functions, no Lens Studio API. Sources: Green Aqua's design rules
// (GA-03 focal point, GA-05/GA-18 odd count, GA-07 hardscape height, GA-13
// front gap) and the common foreground / midground / background zones.

import { PieceKind, PlantForm, isHardscapeKind } from "./ScapePlannerCatalog";

export interface PieceInfo {
  id: string;
  kind: PieceKind;
  form: PlantForm;
  species: string;
  /** Local x inside the tank, 0 at the centre, in cm. */
  x: number;
  /** Local z inside the tank, 0 at the centre, +z toward the front glass, in cm. */
  z: number;
  /** Footprint and exposed height in cm, after rotation and lean. */
  width: number;
  depth: number;
  height: number;
  matureHeight: number;
  yawDeg: number;
  leanDeg: number;
  broadLeaf: boolean;
  red: boolean;
}

export interface TankDims {
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

export type CheckState = "ok" | "warn" | "neutral";

export interface CheckResult {
  id: string;
  state: CheckState;
  message: string;
}

export const FOCAL_MIN = 0.28;
export const FOCAL_MAX = 0.45;
export const FRONT_GAP_CM = 3;
export const HEIGHT_RATIO_MIN = 0.4;

export function hardscape(pieces: PieceInfo[]): PieceInfo[] {
  return pieces.filter((p) => isHardscapeKind(p.kind));
}

export function plants(pieces: PieceInfo[]): PieceInfo[] {
  return pieces.filter((p) => p.kind === "plant");
}

/** Distance from the front glass to the piece's front face, in cm. */
export function frontGap(p: PieceInfo, tank: TankDims): number {
  return tank.depthCm / 2 - (p.z + p.depth / 2);
}

/** Fraction of the tank width, 0 at the left glass. */
export function widthFraction(p: PieceInfo, tank: TankDims): number {
  return (p.x + tank.widthCm / 2) / tank.widthCm;
}

export function onThird(frac: number, min: number = FOCAL_MIN, max: number = FOCAL_MAX): boolean {
  return (frac >= min && frac <= max) || (frac >= 1 - max && frac <= 1 - min);
}

export function tallest(list: PieceInfo[]): PieceInfo | null {
  let best: PieceInfo | null = null;
  for (const p of list) if (!best || p.height > best.height) best = p;
  return best;
}

export type Zone3 = "foreground" | "midground" | "background";

/** Zone of a piece by thirds of the tank depth, front third first. */
export function zoneOf(p: PieceInfo, tank: TankDims): Zone3 {
  const d = tank.depthCm / 2 - p.z;
  const third = tank.depthCm / 3;
  if (d < third) return "foreground";
  if (d < third * 2) return "midground";
  return "background";
}

export function checkFocal(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const main = tallest(hardscape(pieces));
  if (!main) return { id: "focal", state: "neutral", message: "Place a stone or wood as the focal point" };
  const what = main.kind === "wood" ? "Main wood" : "Main stone";
  return onThird(widthFraction(main, tank))
    ? { id: "focal", state: "ok", message: what + " sits on a third" }
    : { id: "focal", state: "warn", message: what + ": move it to a third" };
}

export function checkOddCount(pieces: PieceInfo[]): CheckResult {
  const n = hardscape(pieces).length;
  if (n === 0) return { id: "odd", state: "neutral", message: "Odd number of pieces: 3, 5 or 7" };
  return n % 2 === 1
    ? { id: "odd", state: "ok", message: "Odd number of pieces (" + n + ")" }
    : { id: "odd", state: "warn", message: "Even count: add one or remove one" };
}

export function checkFrontGap(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const hard = hardscape(pieces);
  if (hard.length === 0) return { id: "gap", state: "neutral", message: "Keep 3 cm free at the front glass" };
  let tooClose = false;
  for (const p of hard) if (frontGap(p, tank) < FRONT_GAP_CM) tooClose = true;
  return tooClose
    ? { id: "gap", state: "warn", message: "Pull hardscape 3 cm off the front glass" }
    : { id: "gap", state: "ok", message: "Front glass gap kept" };
}

export function checkHeight(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const main = tallest(hardscape(pieces));
  if (!main) return { id: "height", state: "neutral", message: "Hardscape should reach 40% of height" };
  return main.height >= tank.heightCm * HEIGHT_RATIO_MIN
    ? { id: "height", state: "ok", message: "Hardscape reaches 40% of tank height" }
    : { id: "height", state: "warn", message: "Hardscape too low: the top stays empty" };
}

const FORM_ZONE: { [form: string]: Zone3 } = { carpet: "foreground", midground: "midground", background: "background" };

export function checkZones(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const list = plants(pieces).filter((p) => FORM_ZONE[p.form] !== undefined);
  if (list.length === 0) return { id: "zones", state: "neutral", message: "Carpet front, bush middle, stems back" };
  for (const p of list) {
    const wanted = FORM_ZONE[p.form];
    if (zoneOf(p, tank) !== wanted) return { id: "zones", state: "warn", message: p.species + " belongs in the " + wanted };
  }
  return { id: "zones", state: "ok", message: "Plants sit in their zones" };
}

/** The five general checks, in the order the coach card shows them. */
export function evaluateLayout(pieces: PieceInfo[], tank: TankDims): CheckResult[] {
  return [checkFocal(pieces, tank), checkOddCount(pieces), checkFrontGap(pieces, tank), checkHeight(pieces, tank), checkZones(pieces, tank)];
}
