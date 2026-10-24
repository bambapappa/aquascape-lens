// Scape Planner: procedural carpet tiles. A carpet is laid as square tiles that can
// sit edge to edge or overlap; each tile is a mesh of grass blades (hairgrass,
// Lilaeopsis) or small round leaves (Monte Carlo, HC Cuba, Glossostigma) whose
// bases follow the substrate surface. Blades fray past the tile edge so neighbouring
// tiles merge into one lawn. A seeded random keeps a tile identical when rebuilt.

export type CarpetStyle = "blades" | "leaves";

export interface CarpetSpec {
  style: CarpetStyle;
  /** Typical blade or leaf-mat height in cm. */
  heightCm: number;
  /** Blades or leaves per square cm. */
  density: number;
  baseRgb: number[];
  tipRgb: number[];
}

/** How far blades may stand outside the tile, as a fraction of the tile size. */
const FRAY = 0.12;
const BLADE_SEGMENTS = 2;

/** Small deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fill a MeshBuilder (position 3, normal 3, color 4; triangles, UInt16) with one tile.
 * groundAt(x, z) returns the surface height in the tile's local frame (tile centre at x = z = 0).
 */
export function buildCarpetMesh(builder: MeshBuilder, spec: CarpetSpec, widthCm: number, depthCm: number, seed: number,
  groundAt: (x: number, z: number) => number, blocked: (x: number, z: number) => boolean = () => false): void {
  const rand = seededRandom(seed);
  const verts: number[] = [];
  const idx: number[] = [];
  const count = Math.round(widthCm * depthCm * spec.density);
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * widthCm * (1 + 2 * FRAY);
    const z = (rand() - 0.5) * depthCm * (1 + 2 * FRAY);
    // Thin out the frayed margin so a lone tile has a soft edge.
    const edge = Math.max(Math.abs(x) / (widthCm / 2), Math.abs(z) / (depthCm / 2));
    if (edge > 1 && rand() < (edge - 1) / FRAY) continue;
    if (blocked(x, z)) continue;
    const y = groundAt(x, z) - 0.15;
    if (spec.style === "blades") addBlade(verts, idx, spec, x, y, z, rand);
    else addLeaf(verts, idx, spec, x, y, z, rand);
    if (verts.length / 10 > 60000) break; // UInt16 index limit
  }
  builder.appendVerticesInterleaved(verts);
  builder.appendIndices(idx);
}

function addBlade(verts: number[], idx: number[], spec: CarpetSpec, x: number, y: number, z: number, rand: () => number): void {
  const h = spec.heightCm * (0.75 + 0.4 * rand());
  const width = 0.08 + 0.06 * rand();
  const dir = rand() * Math.PI * 2;
  const bend = (0.05 + 0.2 * rand()) * h;
  const bx = Math.cos(dir);
  const bz = Math.sin(dir);
  // The blade's flat side faces sideways to the bend so it reads from most angles.
  const px = -bz;
  const pz = bx;
  const shade = 0.85 + 0.25 * rand();
  const start = verts.length / 10;
  for (let s = 0; s <= BLADE_SEGMENTS; s++) {
    const t = s / BLADE_SEGMENTS;
    const cx = x + bx * bend * t * t;
    const cz = z + bz * bend * t * t;
    const cy = y + h * t;
    const half = (width / 2) * (1 - 0.85 * t);
    const c = mix(spec.baseRgb, spec.tipRgb, t).map((v) => Math.min(1, v * shade));
    verts.push(cx - px * half, cy, cz - pz * half, 0, 1, 0, c[0], c[1], c[2], 1);
    verts.push(cx + px * half, cy, cz + pz * half, 0, 1, 0, c[0], c[1], c[2], 1);
  }
  for (let s = 0; s < BLADE_SEGMENTS; s++) {
    const a = start + 2 * s;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
}

function addLeaf(verts: number[], idx: number[], spec: CarpetSpec, x: number, y: number, z: number, rand: () => number): void {
  const r = 0.22 + 0.2 * rand();
  const lift = spec.heightCm * (0.2 + 0.8 * rand());
  const yaw = rand() * Math.PI * 2;
  const tilt = 0.35 * (rand() - 0.5);
  const shade = 0.7 + 0.35 * rand();
  const c = mix(spec.baseRgb, spec.tipRgb, lift / Math.max(0.1, spec.heightCm)).map((v) => Math.min(1, v * shade));
  const cy = y + lift;
  const start = verts.length / 10;
  // A six-sided round leaf: centre plus a ring, slightly tilted.
  verts.push(x, cy, z, 0, 1, 0, c[0], c[1], c[2], 1);
  const ring = 6;
  for (let k = 0; k < ring; k++) {
    const a = yaw + (k / ring) * Math.PI * 2;
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r * 0.85;
    verts.push(x + ox, cy + ox * tilt, z + oz, 0, 1, 0, c[0] * 0.92, c[1] * 0.92, c[2] * 0.92, 1);
  }
  for (let k = 0; k < ring; k++) idx.push(start, start + 1 + ((k + 1) % ring), start + 1 + k);
}

function mix(a: number[], b: number[], t: number): number[] {
  return [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * Math.max(0, Math.min(1, t)));
}
