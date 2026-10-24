// Scape Planner: the substrate as a height field. The base is the classic slope
// (low at the front glass, high at the back); soil and sand mounds pile on top of
// it with a smooth cosine falloff. The field is pure math (testable without the
// scene); buildSubstrateMesh turns it into a MeshBuilder mesh whose vertex colours
// carry both the material (soil or sand) and a baked light, because the vertex
// colour material is unlit.
//
// Local frame: the tank's. Origin at the centre of the tank floor, +z toward the front glass.

export type MoundMaterial = "soil" | "sand";

export interface Mound {
  x: number;
  z: number;
  radiusCm: number;
  heightCm: number;
  material: MoundMaterial;
}

const SOIL_RGB = [0.42, 0.3, 0.2];
const SAND_RGB = [0.86, 0.78, 0.6];
/** Below this much sand on top, a vertex reads as soil. */
const SAND_VISIBLE_CM = 0.25;
/** Grid spacing of the mesh, in cm. */
const CELL_CM = 1.0;
/** Surface roughness: grain everywhere, plus a little more on mounds so hills look heaped. */
const GRAIN_CM = 0.22;
const MOUND_ROUGHNESS = 0.08;
/** Colour grain of the soil: share of brightness variation at two scales. */
const COLOR_GRAIN_COARSE = 0.18;
const COLOR_GRAIN_FINE = 0.12;
const LIGHT_DIR = normalize3([-0.35, 0.85, 0.4]);
const AMBIENT = 0.45;

export class SubstrateField {
  readonly widthCm: number;
  readonly depthCm: number;
  readonly frontCm: number;
  readonly backCm: number;
  private mounds: Mound[] = [];

  constructor(widthCm: number, depthCm: number, frontCm: number, backCm: number) {
    this.widthCm = widthCm;
    this.depthCm = depthCm;
    this.frontCm = frontCm;
    this.backCm = backCm;
  }

  setMounds(mounds: Mound[]): void {
    this.mounds = mounds.slice();
  }

  /** The sloped base without any mounds. */
  baseAt(z: number): number {
    const t = clamp01((this.depthCm / 2 - z) / this.depthCm); // 0 at the front glass, 1 at the back
    return this.frontCm + (this.backCm - this.frontCm) * t;
  }

  /** Surface height above the tank floor at (x, z), mounds and surface grain included. */
  heightAt(x: number, z: number): number {
    let piled = 0;
    for (const m of this.mounds) piled += bump(m, x, z);
    const grain = (valueNoise(x / 3.5, z / 3.5) - 0.5) * 2 * (GRAIN_CM + MOUND_ROUGHNESS * piled);
    return this.baseAt(z) + piled + grain;
  }

  /** Centimetres of sand on top at (x, z): sand mounds count, soil piled over them hides them. */
  sandDepthAt(x: number, z: number): number {
    let sand = 0;
    let soil = 0;
    for (const m of this.mounds) {
      const b = bump(m, x, z);
      if (m.material === "sand") sand += b;
      else soil += b;
    }
    return Math.max(0, sand - soil);
  }
}

/** Height a single mound adds at (x, z): a cosine bell that reaches zero at its radius. */
export function bump(m: Mound, x: number, z: number): number {
  const dx = x - m.x;
  const dz = z - m.z;
  const r = Math.sqrt(dx * dx + dz * dz) / Math.max(0.1, m.radiusCm);
  if (r >= 1) return 0;
  return m.heightCm * (0.5 + 0.5 * Math.cos(Math.PI * r));
}

/**
 * Fill a MeshBuilder (layout: position 3, normal 3, color 4; triangles, UInt16) with the
 * substrate surface plus vertical skirts down to the tank floor on all four sides.
 */
export function buildSubstrateMesh(builder: MeshBuilder, field: SubstrateField, insetCm: number, zoneTint: boolean): void {
  const w = field.widthCm - 2 * insetCm;
  const d = field.depthCm - 2 * insetCm;
  const nx = Math.max(2, Math.ceil(w / CELL_CM) + 1);
  const nz = Math.max(2, Math.ceil(d / CELL_CM) + 1);
  const verts: number[] = [];
  const idx: number[] = [];
  const xAt = (i: number) => -w / 2 + (w * i) / (nx - 1);
  const zAt = (j: number) => -d / 2 + (d * j) / (nz - 1);

  // Top surface.
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xAt(i);
      const z = zAt(j);
      const y = field.heightAt(x, z);
      const e = 0.5;
      const n = normalize3([field.heightAt(x - e, z) - field.heightAt(x + e, z), 2 * e, field.heightAt(x, z - e) - field.heightAt(x, z + e)]);
      let c = surfaceColor(field.sandDepthAt(x, z), n, x, z);
      if (zoneTint) c = tintByZone(c, z, field.depthCm);
      verts.push(x, y, z, n[0], n[1], n[2], c[0], c[1], c[2], 1);
    }
  }
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const dd = c + 1;
      idx.push(a, c, b, b, c, dd);
    }
  }

  // Skirts: the cut face of the substrate seen through the glass.
  const edges: { pts: number[][]; out: number[] }[] = [
    { pts: range(nx).map((i) => [xAt(i), d / 2]), out: [0, 0, 1] },
    { pts: range(nx).map((i) => [xAt(nx - 1 - i), -d / 2]), out: [0, 0, -1] },
    { pts: range(nz).map((j) => [-w / 2, zAt(nz - 1 - j)]), out: [-1, 0, 0] },
    { pts: range(nz).map((j) => [w / 2, zAt(j)]), out: [1, 0, 0] },
  ];
  for (const edge of edges) {
    const start = verts.length / 10;
    const shade = lightOf(edge.out) * 0.8;
    for (const p of edge.pts) {
      const top = field.heightAt(p[0], p[1]);
      const sandTop = field.sandDepthAt(p[0], p[1]) > SAND_VISIBLE_CM;
      const ct = (sandTop ? SAND_RGB : SOIL_RGB).map((v) => v * shade * (0.9 + 0.2 * hash2(Math.round(p[0] * 2), Math.round(p[1] * 2))));
      const cb = SOIL_RGB.map((v) => v * shade * 0.55);
      verts.push(p[0], top, p[1], edge.out[0], edge.out[1], edge.out[2], ct[0], ct[1], ct[2], 1);
      verts.push(p[0], 0, p[1], edge.out[0], edge.out[1], edge.out[2], cb[0], cb[1], cb[2], 1);
    }
    for (let k = 0; k < edge.pts.length - 1; k++) {
      const t0 = start + 2 * k;
      const b0 = t0 + 1;
      const t1 = t0 + 2;
      const b1 = t0 + 3;
      idx.push(t0, b0, t1, t1, b0, b1);
    }
  }
  builder.appendVerticesInterleaved(verts);
  builder.appendIndices(idx);
}

/** Foreground, midground and background thirds, tinted softly when the guides are on. */
const ZONE_TINTS = [[0.55, 1.0, 0.6], [1.0, 0.95, 0.55], [1.0, 0.7, 0.55]];
const ZONE_TINT_SHARE = 0.35;

function tintByZone(c: number[], z: number, depthCm: number): number[] {
  const fromFront = depthCm / 2 - z;
  const zone = Math.min(2, Math.max(0, Math.floor((fromFront / depthCm) * 3)));
  const tint = ZONE_TINTS[zone];
  return [0, 1, 2].map((k) => Math.min(1, c[k] * (1 - ZONE_TINT_SHARE + ZONE_TINT_SHARE * tint[k] * 1.4)));
}

function surfaceColor(sandCm: number, n: number[], x: number, z: number): number[] {
  const t = clamp01((sandCm - SAND_VISIBLE_CM) / 0.6);
  const base = [0, 1, 2].map((k) => SOIL_RGB[k] + (SAND_RGB[k] - SOIL_RGB[k]) * t);
  const grain = 1 + COLOR_GRAIN_COARSE * (valueNoise(x / 2.2 + 17, z / 2.2) - 0.5) * 2
    + COLOR_GRAIN_FINE * (hash2(Math.round(x * 1.7), Math.round(z * 1.7)) - 0.5) * 2;
  const l = lightOf(n);
  return base.map((v) => Math.min(1, v * l * grain));
}

/** Deterministic hash of two integers into [0, 1). */
function hash2(i: number, j: number): number {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1), interpolated between integer lattice points. */
function valueNoise(x: number, z: number): number {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fx = x - i;
  const fz = z - j;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hash2(i, j) + (hash2(i + 1, j) - hash2(i, j)) * sx;
  const b = hash2(i, j + 1) + (hash2(i + 1, j + 1) - hash2(i, j + 1)) * sx;
  return a + (b - a) * sz;
}

function lightOf(n: number[]): number {
  const dot = n[0] * LIGHT_DIR[0] + n[1] * LIGHT_DIR[1] + n[2] * LIGHT_DIR[2];
  return AMBIENT + (1 - AMBIENT) * Math.max(0, dot);
}

function normalize3(v: number[]): number[] {
  const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function range(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i);
  return out;
}
