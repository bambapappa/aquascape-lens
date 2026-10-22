// Scape Planner: the composition rules behind the coach card.
// Pure functions, no Lens Studio API, so they can be reasoned about and
// tested without the scene. Sources: Green Aqua's design rules (GA-03 focal
// point, GA-05/GA-18 odd count, GA-07 hardscape height, GA-13 front gap) and
// the common foreground / midground / background planting zones.

export type PieceKind = "stone" | "wood" | "carpet" | "bush" | "stems";

export interface PieceInfo {
  kind: PieceKind;
  /** Local x inside the tank, 0 at the centre, in cm. */
  x: number;
  /** Local z inside the tank, 0 at the centre, +z toward the front glass, in cm. */
  z: number;
  /** Piece height in cm. */
  height: number;
}

export interface TankDims {
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

export type CheckState = "ok" | "warn" | "neutral";

export interface CheckResult {
  id: "focal" | "odd" | "gap" | "height" | "zones";
  state: CheckState;
  message: string;
}

export const FOCAL_MIN = 0.28;
export const FOCAL_MAX = 0.45;
export const FRONT_GAP_CM = 3;
export const HEIGHT_RATIO_MIN = 0.4;
export const ZONE_DEPTH_CM = 10;

const HARDSCAPE: PieceKind[] = ["stone", "wood"];

function isHardscape(p: PieceInfo): boolean {
  return HARDSCAPE.indexOf(p.kind) >= 0;
}

/** Distance from the front glass to the piece centre, in cm. */
export function depthFromFront(p: PieceInfo, tank: TankDims): number {
  return tank.depthCm / 2 - p.z;
}

export function checkFocal(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const stones = pieces.filter((p) => p.kind === "stone");
  if (stones.length === 0) {
    return { id: "focal", state: "neutral", message: "Place a stone to set the focal point" };
  }
  let main = stones[0];
  for (const s of stones) {
    if (s.height > main.height) main = s;
  }
  const frac = (main.x + tank.widthCm / 2) / tank.widthCm;
  const onThird =
    (frac >= FOCAL_MIN && frac <= FOCAL_MAX) || (frac >= 1 - FOCAL_MAX && frac <= 1 - FOCAL_MIN);
  return onThird
    ? { id: "focal", state: "ok", message: "Main stone sits on a third" }
    : { id: "focal", state: "warn", message: "Main stone: move it to a third" };
}

export function checkOddCount(pieces: PieceInfo[]): CheckResult {
  const n = pieces.filter(isHardscape).length;
  if (n === 0) {
    return { id: "odd", state: "neutral", message: "Odd number of pieces: 3, 5 or 7" };
  }
  return n % 2 === 1
    ? { id: "odd", state: "ok", message: "Odd number of pieces (" + n + ")" }
    : { id: "odd", state: "warn", message: "Odd number of pieces: add one or remove one" };
}

export function checkFrontGap(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const hard = pieces.filter(isHardscape);
  if (hard.length === 0) {
    return { id: "gap", state: "neutral", message: "Keep 3 cm free at the front glass" };
  }
  let tooClose = false;
  for (const p of hard) {
    if (depthFromFront(p, tank) < FRONT_GAP_CM) tooClose = true;
  }
  return tooClose
    ? { id: "gap", state: "warn", message: "Pull hardscape 3 cm back from the front glass" }
    : { id: "gap", state: "ok", message: "Front glass gap kept" };
}

export function checkHeight(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const hard = pieces.filter(isHardscape);
  if (hard.length === 0) {
    return { id: "height", state: "neutral", message: "Hardscape should reach 40% of the height" };
  }
  let tallest = 0;
  for (const p of hard) {
    if (p.height > tallest) tallest = p.height;
  }
  return tallest >= tank.heightCm * HEIGHT_RATIO_MIN
    ? { id: "height", state: "ok", message: "Hardscape reaches 40% of the tank height" }
    : { id: "height", state: "warn", message: "Hardscape too low: the top of the tank stays empty" };
}

type Zone = "foreground" | "midground" | "background";

function zoneOf(p: PieceInfo, tank: TankDims): Zone {
  const d = depthFromFront(p, tank);
  if (d <= ZONE_DEPTH_CM) return "foreground";
  if (d <= ZONE_DEPTH_CM * 2) return "midground";
  return "background";
}

const PLANT_ZONE: { [kind: string]: Zone } = {
  carpet: "foreground",
  bush: "midground",
  stems: "background",
};

const PLANT_NAME: { [kind: string]: string } = {
  carpet: "Monte Carlo",
  bush: "Cryptocoryne",
  stems: "Rotala",
};

export function checkZones(pieces: PieceInfo[], tank: TankDims): CheckResult {
  const plants = pieces.filter((p) => !isHardscape(p));
  if (plants.length === 0) {
    return { id: "zones", state: "neutral", message: "Carpet front, bush middle, stems back" };
  }
  for (const p of plants) {
    const wanted = PLANT_ZONE[p.kind];
    if (wanted && zoneOf(p, tank) !== wanted) {
      return { id: "zones", state: "warn", message: PLANT_NAME[p.kind] + " belongs in the " + wanted };
    }
  }
  return { id: "zones", state: "ok", message: "Plants sit in their zones" };
}

/** All five checks, in the order the coach card shows them. */
export function evaluateLayout(pieces: PieceInfo[], tank: TankDims): CheckResult[] {
  return [
    checkFocal(pieces, tank),
    checkOddCount(pieces),
    checkFrontGap(pieces, tank),
    checkHeight(pieces, tank),
    checkZones(pieces, tank),
  ];
}
