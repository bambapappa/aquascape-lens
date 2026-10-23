// Scape Planner: style-fit assessment. Each aquascaping style is a set of
// weighted rules over the placed pieces; the score is the weighted share of
// applicable rules that pass. Pure functions, no Lens Studio API.
// Rule thresholds follow ADA / Green Aqua guidance for Iwagumi and Nature,
// NBAT / AGA guidance for Dutch, and common hobby guidance for Jungle.

import { PieceInfo, TankDims, hardscape, plants, tallest, widthFraction, onThird, zoneOf } from "./ScapePlannerRules";

/** true = pass, false = fail, null = not applicable with the pieces placed so far. */
export type RuleTest = (pieces: PieceInfo[], tank: TankDims) => boolean | null;

export interface StyleRule {
  id: string;
  label: string;
  weight: number;
  test: RuleTest;
}

export interface StyleProfile {
  id: string;
  name: string;
  rules: StyleRule[];
}

export interface RuleResult {
  rule: StyleRule;
  pass: boolean | null;
}

export interface StyleScore {
  style: StyleProfile;
  /** 0 to 100 over the applicable rules; 0 when nothing is applicable yet. */
  score: number;
  applicable: number;
  results: RuleResult[];
}

// ── helpers ──────────────────────────────────────────────────────────────

function area(p: PieceInfo): number {
  return p.width * p.depth;
}

function plantedFraction(pieces: PieceInfo[], tank: TankDims): number {
  let sum = 0;
  for (const p of plants(pieces)) sum += area(p);
  return Math.min(1, sum / (tank.widthCm * tank.depthCm));
}

function speciesCount(pieces: PieceInfo[]): number {
  const seen: { [s: string]: boolean } = {};
  let n = 0;
  for (const p of plants(pieces)) if (!seen[p.species]) { seen[p.species] = true; n++; }
  return n;
}

function count(pieces: PieceInfo[], kind: string): number {
  return pieces.filter((p) => p.kind === kind).length;
}

function sortedHeightsDesc(list: PieceInfo[]): number[] {
  return list.map((p) => p.height).sort((a, b) => b - a);
}

/** Shortest gap between two footprints in cm (0 when they overlap). */
function footprintGap(a: PieceInfo, b: PieceInfo): number {
  const dx = Math.max(0, Math.abs(a.x - b.x) - (a.width + b.width) / 2);
  const dz = Math.max(0, Math.abs(a.z - b.z) - (a.depth + b.depth) / 2);
  return Math.sqrt(dx * dx + dz * dz);
}

function meanMatureHeightInZone(pieces: PieceInfo[], tank: TankDims, zone: string): number | null {
  const list = plants(pieces).filter((p) => zoneOf(p, tank) === zone);
  if (list.length === 0) return null;
  let sum = 0;
  for (const p of list) sum += p.matureHeight;
  return sum / list.length;
}

const NA = null;

// ── Iwagumi ──────────────────────────────────────────────────────────────

const IWAGUMI: StyleProfile = { id: "iwagumi", name: "Iwagumi", rules: [
  { id: "iwa-wood", label: "Stones only, no wood", weight: 3, test: (p) => hardscape(p).length === 0 ? NA : count(p, "wood") === 0 },
  { id: "iwa-odd", label: "Odd number of stones, at least 3", weight: 2, test: (p) => { const n = count(p, "stone"); return n === 0 ? NA : n >= 3 && n % 2 === 1; } },
  { id: "iwa-main-height", label: "Main stone 55 to 75% of tank height", weight: 3, test: (p, t) => { const m = tallest(p.filter((q) => q.kind === "stone")); if (!m) return NA; const r = m.height / t.heightCm; return r >= 0.55 && r <= 0.75; } },
  { id: "iwa-lean", label: "Main stone leans 10 to 20 degrees", weight: 2, test: (p) => { const m = tallest(p.filter((q) => q.kind === "stone")); return m ? m.leanDeg >= 10 && m.leanDeg <= 20 : NA; } },
  { id: "iwa-third", label: "Main stone on a golden third", weight: 3, test: (p, t) => { const m = tallest(p.filter((q) => q.kind === "stone")); return m ? onThird(widthFraction(m, t), 0.3, 0.42) : NA; } },
  { id: "iwa-ladder", label: "Second stone 50 to 70% of the main", weight: 2, test: (p) => { const h = sortedHeightsDesc(p.filter((q) => q.kind === "stone")); if (h.length < 2) return NA; const r = h[1] / h[0]; return r >= 0.5 && r <= 0.7; } },
  { id: "iwa-material", label: "One stone type only", weight: 2, test: (p) => { const s = p.filter((q) => q.kind === "stone"); if (s.length < 2) return NA; return s.every((q) => q.species === s[0].species); } },
  { id: "iwa-plants", label: "Few species, mostly carpet", weight: 2, test: (p) => { const pl = plants(p); if (pl.length === 0) return NA; const carpet = pl.filter((q) => q.form === "carpet").length; return speciesCount(p) <= 2 && carpet / pl.length >= 0.8; } },
] };

// ── Nature (Amano) ───────────────────────────────────────────────────────

const NATURE: StyleProfile = { id: "nature", name: "Nature", rules: [
  { id: "nat-dominant", label: "One material dominates (70%+)", weight: 3, test: (p) => { const h = hardscape(p); if (h.length < 2) return NA; const s = count(p, "stone"); return Math.max(s, h.length - s) / h.length >= 0.7; } },
  { id: "nat-focal", label: "Focal piece on a third", weight: 3, test: (p, t) => { const m = tallest(hardscape(p)); return m ? onThird(widthFraction(m, t), 0.3, 0.42) : NA; } },
  { id: "nat-height", label: "Hardscape at least 40% of height", weight: 2, test: (p, t) => { const m = tallest(hardscape(p)); return m ? m.height / t.heightCm >= 0.4 : NA; } },
  { id: "nat-open", label: "30 to 50% of the floor left open", weight: 2, test: (p, t) => { if (p.length === 0) return NA; let sum = 0; for (const q of p) sum += area(q); const open = 1 - Math.min(1, sum / (t.widthCm * t.depthCm)); return open >= 0.3 && open <= 0.5; } },
  { id: "nat-depth", label: "Taller hardscape toward the back", weight: 1, test: (p, t) => { const h = hardscape(p); if (h.length < 2) return NA; const m = tallest(h); return m !== null && m.z <= 0.1 * t.depthCm; } },
  { id: "nat-species", label: "2 to 6 plant species", weight: 2, test: (p) => { const n = speciesCount(p); return n === 0 ? NA : n >= 2 && n <= 6; } },
  { id: "nat-zones", label: "Carpets front, stems back", weight: 2, test: (p, t) => { const pl = plants(p).filter((q) => q.form === "carpet" || q.form === "background"); if (pl.length === 0) return NA; let ok = 0; for (const q of pl) { const z = zoneOf(q, t); if ((q.form === "carpet" && z !== "background") || (q.form === "background" && z !== "foreground")) ok++; } return ok / pl.length >= 0.8; } },
] };

// ── Dutch (NBAT) ─────────────────────────────────────────────────────────

const DUTCH: StyleProfile = { id: "dutch", name: "Dutch", rules: [
  { id: "dut-nohard", label: "No visible hardscape", weight: 3, test: (p) => p.length === 0 ? NA : hardscape(p).length === 0 },
  { id: "dut-planted", label: "At least 70% of the floor planted", weight: 3, test: (p, t) => plants(p).length === 0 ? NA : plantedFraction(p, t) >= 0.7 },
  { id: "dut-species", label: "One species per 10 cm of width", weight: 3, test: (p, t) => { const n = speciesCount(p); if (n === 0) return NA; const target = Math.floor(t.widthCm / 10); return n >= target - 1 && n <= target + 2; } },
  { id: "dut-streets", label: "Heights rise front to back", weight: 2, test: (p, t) => { const f = meanMatureHeightInZone(p, t, "foreground"); const m = meanMatureHeightInZone(p, t, "midground"); const b = meanMatureHeightInZone(p, t, "background"); if (f === null || m === null || b === null) return NA; return f < m && m < b; } },
  { id: "dut-focal", label: "One red group near a third", weight: 2, test: (p, t) => { const reds = plants(p).filter((q) => q.red); if (plants(p).length === 0) return NA; if (reds.length === 0) return false; return reds.some((q) => onThird(widthFraction(q, t), 0.26, 0.42)); } },
  { id: "dut-contrast", label: "Neighbours differ in height", weight: 2, test: (p) => { const pl = plants(p); if (pl.length < 2) return NA; let pairs = 0, good = 0; for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) { if (footprintGap(pl[i], pl[j]) <= 6) { pairs++; if (Math.abs(pl[i].matureHeight - pl[j].matureHeight) >= 5 || pl[i].species === pl[j].species) good++; } } return pairs === 0 ? NA : good / pairs >= 0.8; } },
] };

// ── Jungle ───────────────────────────────────────────────────────────────

const JUNGLE: StyleProfile = { id: "jungle", name: "Jungle", rules: [
  { id: "jun-tall", label: "Tallest plant reaches 90% of height", weight: 3, test: (p, t) => { const pl = plants(p); if (pl.length === 0) return NA; let h = 0; for (const q of pl) if (q.matureHeight > h) h = q.matureHeight; return h / t.heightCm >= 0.9; } },
  { id: "jun-planted", label: "At least 80% of the floor planted", weight: 3, test: (p, t) => plants(p).length === 0 ? NA : plantedFraction(p, t) >= 0.8 },
  { id: "jun-covered", label: "Plants grow on the hardscape", weight: 2, test: (p) => { const h = hardscape(p); const pl = plants(p); if (h.length === 0 || pl.length === 0) return NA; let covered = 0; for (const q of h) if (pl.some((r) => footprintGap(q, r) <= 5)) covered++; return covered / h.length >= 0.7; } },
  { id: "jun-wood", label: "Wood-led: 1 to 3 wood, at most 1 stone", weight: 1, test: (p) => hardscape(p).length === 0 ? NA : count(p, "wood") >= 1 && count(p, "wood") <= 3 && count(p, "stone") <= 1 },
  { id: "jun-species", label: "4 to 8 species with a broad leaf", weight: 2, test: (p) => { const n = speciesCount(p); if (n === 0) return NA; return n >= 4 && n <= 8 && plants(p).some((q) => q.broadLeaf); } },
  { id: "jun-bands", label: "Low, middle and tall plants", weight: 1, test: (p) => { const pl = plants(p); if (pl.length === 0) return NA; return pl.some((q) => q.matureHeight <= 5) && pl.some((q) => q.matureHeight > 5 && q.matureHeight < 20) && pl.some((q) => q.matureHeight >= 20); } },
] };

export const STYLES: StyleProfile[] = [IWAGUMI, NATURE, DUTCH, JUNGLE];

export function scoreStyle(style: StyleProfile, pieces: PieceInfo[], tank: TankDims): StyleScore {
  const results: RuleResult[] = style.rules.map((rule) => ({ rule, pass: rule.test(pieces, tank) }));
  let total = 0;
  let passed = 0;
  let applicable = 0;
  for (const r of results) {
    if (r.pass === null) continue;
    applicable++;
    total += r.rule.weight;
    if (r.pass) passed += r.rule.weight;
  }
  const score = total > 0 ? Math.round((100 * passed) / total) : 0;
  return { style, score, applicable, results };
}

export function scoreAllStyles(pieces: PieceInfo[], tank: TankDims): StyleScore[] {
  return STYLES.map((s) => scoreStyle(s, pieces, tank));
}

/** The rules worth showing: failing ones first, then not-yet-applicable, then passing. */
export function rulesToShow(score: StyleScore, max: number): RuleResult[] {
  const order = (r: RuleResult) => (r.pass === false ? 0 : r.pass === null ? 1 : 2);
  return score.results.slice().sort((a, b) => order(a) - order(b)).slice(0, max);
}
