// Scape Planner: one placed piece inside the tank. A unit-scale wrapper SceneObject
// carries the collider, the SIK Interactable and the InteractableManipulation; a
// Pivot child takes size, mirror, yaw and lean. What hangs under the pivot depends
// on the catalogue entry's render kind:
//   mesh   - a GLB prefab instance, fitted to the entry height and centred;
//   carpet - a procedural tile of blades or leaves that follows the substrate;
//   mound  - nothing visible: the mound shapes the substrate itself.
// Epiphytes (moss, Anubias, Buce, Java fern) can hang on a stone or wood host: the
// wrapper is then parented to the host's pivot and follows it.

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { CatalogEntry, pieceObjectName } from "./ScapePlannerCatalog";
import { buildCarpetMesh } from "./ScapePlannerCarpet";
import { PieceInfo } from "./ScapePlannerRules";
import { Mound } from "./ScapePlannerSubstrate";
import { ScapePlannerTank } from "./ScapePlannerTank";

const WALL_MARGIN_CM = 0.6;
const TARGETING_DIRECT_AND_INDIRECT = 3;
const DEG = Math.PI / 180;
const RING_COLOR = new vec4(0.3, 0.95, 1.0, 0.9);
export const MAX_LEAN_DEG = 40;
/** Hardscape sinks this share of its height into the substrate (capped), so it looks set, not perched. */
const EMBED_SHARE = 0.08;
const EMBED_MAX_CM = 1.5;
/** Most surface points kept per hardscape piece for epiphyte placement. */
const MAX_SURFACE_POINTS = 1500;
/** Epiphytes look for host surface points within this radius (cm, host space) of the drop point. */
const ATTACH_SEARCH_CM = 4;

export interface PieceVisualAssets {
  ringMesh: RenderMesh;
  ringMaterial: Material;
}

/** Axis-aligned extents of a w x h x d box after lean (about its own x) then yaw (about y). */
export function rotatedExtents(w: number, h: number, d: number, yawDeg: number, leanDeg: number): vec3 {
  const cl = Math.abs(Math.cos(leanDeg * DEG));
  const sl = Math.abs(Math.sin(leanDeg * DEG));
  const hx0 = w / 2;
  const hy = (h / 2) * cl + (d / 2) * sl;
  const hz0 = (h / 2) * sl + (d / 2) * cl;
  const cy = Math.abs(Math.cos(yawDeg * DEG));
  const sy = Math.abs(Math.sin(yawDeg * DEG));
  const hx = hx0 * cy + hz0 * sy;
  const hz = hx0 * sy + hz0 * cy;
  return new vec3(hx * 2, hy * 2, hz * 2);
}

export class ScapePlannerPiece {
  readonly entry: CatalogEntry;
  readonly root: SceneObject;
  readonly pivot: SceneObject;
  readonly onMoved: Event<void> = new Event<void>();
  readonly onGrabbed: Event<void> = new Event<void>();

  private readonly tank: ScapePlannerTank;
  private readonly collider: ColliderComponent;
  private readonly manipulation: InteractableManipulation;
  private readonly ring: SceneObject | null;
  private readonly seed: number = Math.floor(Math.random() * 1e9);
  private carpetObject: SceneObject | null = null;
  /** Hardscape surface points in pivot space (cm, before size/mirror/yaw/lean). */
  private surfacePoints: vec3[] = [];
  private sizeScale = 1;
  private _mirrored = false;
  private _yawDeg = 0;
  private _leanDeg = 0;
  private _host: ScapePlannerPiece | null = null;
  private bound = false;

  constructor(prefab: ObjectPrefab | null, entry: CatalogEntry, sizeScale: number, tank: ScapePlannerTank, xLocal: number, zLocal: number, assets: PieceVisualAssets | null) {
    this.entry = entry;
    this.tank = tank;
    this.sizeScale = sizeScale;

    this.root = global.scene.createSceneObject(pieceObjectName(entry));
    this.root.setParent(tank.getSceneObject());
    this.pivot = global.scene.createSceneObject("Pivot");
    this.pivot.setParent(this.root);

    if (entry.render === "mesh" && prefab) {
      const visual = prefab.instantiate(this.pivot);
      this.fitVisual(visual, entry.heightCm);
      if (entry.tint) this.applyTint(visual, entry.tint);
      if (entry.kind === "stone" || entry.kind === "wood") this.surfacePoints = this.collectSurfacePoints(visual);
    }

    this.collider = this.root.createComponent("Physics.ColliderComponent") as ColliderComponent;
    this.collider.shape = Shape.createBoxShape();
    const interactable = this.root.createComponent(Interactable.getTypeName()) as Interactable;
    interactable.targetingMode = TARGETING_DIRECT_AND_INDIRECT;
    this.manipulation = this.root.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
    this.manipulation.setCanRotate(false);
    this.manipulation.setCanScale(false);
    this.manipulation.setCanTranslate(true);

    this.ring = assets ? this.buildRing(assets) : null;
    this.applyShape();
    this.setLocal(xLocal, zLocal);
  }

  /** Subscribe to SIK events; call once after construction. */
  bindEvents(): void {
    if (this.bound) return;
    this.bound = true;
    this.manipulation.onManipulationStart.add(() => this.onGrabbed.invoke());
    this.manipulation.onManipulationUpdate.add(() => {
      if (!this._host) this.clampToTank();
    });
    this.manipulation.onManipulationEnd.add(() => {
      if (!this._host) this.clampToTank();
      this.onMoved.invoke();
    });
  }

  get kind() { return this.entry.kind; }
  get yawDeg(): number { return this._yawDeg; }
  get leanDeg(): number { return this._leanDeg; }
  get scale(): number { return this.sizeScale; }
  get mirrored(): boolean { return this._mirrored; }
  get host(): ScapePlannerPiece | null { return this._host; }
  get isHardscape(): boolean { return this.entry.kind === "stone" || this.entry.kind === "wood"; }

  /** Current footprint and height in cm after size, yaw and lean. */
  get extents(): vec3 {
    const s = this.sizeScale;
    return rotatedExtents(this.entry.widthCm * s, this.entry.heightCm * s, this.entry.depthCm * s, this._yawDeg, this._leanDeg);
  }

  /** Position in the tank's local frame, whether or not the piece hangs on a host. */
  get tankLocal(): vec3 {
    const world = this.root.getTransform().getWorldPosition();
    return this.tank.getTransform().getInvertedWorldTransform().multiplyPoint(world);
  }
  get xLocal(): number { return this.tankLocal.x; }
  get zLocal(): number { return this.tankLocal.z; }

  setYaw(deg: number): void {
    this._yawDeg = ((deg % 360) + 360) % 360;
    this.applyShape();
    this.reseat();
  }

  /** Lean the top over, 0 to MAX_LEAN_DEG; the lean direction turns with the yaw. */
  setLean(deg: number): void {
    this._leanDeg = Math.max(0, Math.min(MAX_LEAN_DEG, deg));
    this.applyShape();
    this.reseat();
  }

  setSizeScale(scale: number): void {
    this.sizeScale = scale;
    this.applyShape();
    if (this.entry.render === "carpet") this.rebuildCarpet();
    this.reseat();
  }

  setMirrored(on: boolean): void {
    this._mirrored = on;
    this.applyShape();
  }

  setSelected(on: boolean): void {
    if (this.ring) this.ring.enabled = on;
  }

  /** Put the piece at tank-local (x, z), inside the glass and on the substrate. */
  setLocal(x: number, z: number): void {
    const e = this.extents;
    const p = this.clampXZ(x, z, e);
    this.root.getTransform().setLocalPosition(new vec3(p.x, this.seatY(p.x, p.z, e), p.z));
    if (this.entry.render === "carpet") this.rebuildCarpet();
  }

  /** Sit again on the substrate (after the substrate or the shape changed). */
  reseat(): void {
    if (this._host) return;
    const lp = this.root.getTransform().getLocalPosition();
    this.setLocal(lp.x, lp.z);
  }

  /** The mound this piece adds to the substrate (mound pieces only). */
  mound(): Mound | null {
    if (this.entry.render !== "mound" || !this.entry.moundMaterial) return null;
    const lp = this.root.getTransform().getLocalPosition();
    return { x: lp.x, z: lp.z, radiusCm: (this.entry.widthCm / 2) * this.sizeScale, heightCm: this.entry.heightCm * this.sizeScale,
      material: this.entry.moundMaterial };
  }

  /**
   * The highest surface point of this hardscape piece near a world position, as a
   * pivot-space point, or null when the position is not over the piece.
   */
  surfacePointNear(world: vec3): vec3 | null {
    if (this.surfacePoints.length === 0) return null;
    const local = this.pivot.getTransform().getInvertedWorldTransform().multiplyPoint(world);
    const scale = Math.max(0.01, this.sizeScale);
    const radius = ATTACH_SEARCH_CM / scale;
    let best: vec3 | null = null;
    for (const p of this.surfacePoints) {
      const dx = p.x - local.x;
      const dz = p.z - local.z;
      if (dx * dx + dz * dz > radius * radius) continue;
      if (!best || p.y > best.y) best = p;
    }
    return best;
  }

  /** The highest point near the top-front of the piece, for a fresh epiphyte. */
  defaultAttachPoint(): vec3 | null {
    if (this.surfacePoints.length === 0) return null;
    let top = -Infinity;
    for (const p of this.surfacePoints) top = Math.max(top, p.y);
    let best: vec3 | null = null;
    for (const p of this.surfacePoints) {
      if (p.y < top - 0.35 * this.entry.heightCm) continue;
      if (!best || p.z > best.z) best = p;
    }
    return best;
  }

  /** Hang this piece on a host at a pivot-space point of the host; its size is kept. */
  attachTo(host: ScapePlannerPiece, pointOnHost: vec3): void {
    this._host = host;
    this.root.setParent(host.pivot);
    const t = this.root.getTransform();
    const hs = host.scale;
    t.setLocalScale(new vec3((host.mirrored ? -1 : 1) / hs, 1 / hs, 1 / hs));
    t.setLocalRotation(quat.quatIdentity());
    // Sit on top of the point: half the piece height above it, in host pivot units.
    const e = this.extents;
    t.setLocalPosition(new vec3(pointOnHost.x, pointOnHost.y + (e.y * 0.35) / hs, pointOnHost.z));
  }

  /** Leave the host and stand on the substrate at the current spot. */
  detach(): void {
    if (!this._host) return;
    const local = this.tankLocal;
    this._host = null;
    this.root.setParent(this.tank.getSceneObject());
    const t = this.root.getTransform();
    t.setLocalScale(new vec3(1, 1, 1));
    t.setLocalRotation(quat.quatIdentity());
    this.setLocal(local.x, local.z);
  }

  info(): PieceInfo {
    const e = this.extents;
    const c = this.entry;
    const p = this.tankLocal;
    return { id: c.id, kind: c.kind, form: c.form, species: c.species, x: p.x, z: p.z, width: e.x, depth: e.z, height: e.y,
      matureHeight: Math.max(e.y, c.matureHeightCm * this.sizeScale), yawDeg: this._yawDeg, leanDeg: this._leanDeg, broadLeaf: c.broadLeaf, red: c.red };
  }

  destroy(): void {
    this.root.destroy();
  }

  // ── internals ────────────────────────────────────────────────────────

  private seatY(x: number, z: number, e: vec3): number {
    switch (this.entry.render) {
      case "carpet":
        return this.tank.surfaceAt(x, z);
      case "mound":
        return this.tank.substrateTopAt(z) + e.y / 2;
      default: {
        // A leaning stone's bounding box hangs a corner below the rounded stone; sink it by that much.
        const leanSink = this.isHardscape ? 0.5 * this.entry.depthCm * this.sizeScale * Math.sin(this._leanDeg * DEG) : 0;
        const embed = this.isHardscape ? Math.min(EMBED_MAX_CM, EMBED_SHARE * e.y) + leanSink : 0.3;
        return this.tank.surfaceAt(x, z) + e.y / 2 - embed;
      }
    }
  }

  /** Apply size, mirror, yaw and lean to the pivot, resize the collider and the ring. */
  private applyShape(): void {
    const t = this.pivot.getTransform();
    const s = this.entry.render === "carpet" ? 1 : this.sizeScale;
    t.setLocalScale(new vec3(this._mirrored ? -s : s, s, s));
    const yaw = quat.angleAxis(this._yawDeg * DEG, new vec3(0, 1, 0));
    const lean = quat.angleAxis(this._leanDeg * DEG, new vec3(1, 0, 0));
    t.setLocalRotation(yaw.multiply(lean));
    const e = this.extents;
    const shape = this.collider.shape as BoxShape;
    shape.size = new vec3(e.x, Math.max(1.5, e.y), e.z);
    this.collider.shape = shape;
    if (this.ring) {
      const rt = this.ring.getTransform();
      const ringY = this.entry.render === "carpet" ? 0.3 : -e.y / 2 + 0.2;
      rt.setLocalPosition(new vec3(0, ringY, 0));
      rt.setLocalScale(new vec3(e.x + 3, 0.3, e.z + 3));
    }
  }

  /** Rebuild the carpet tile so its blades stand on the substrate under it. */
  private rebuildCarpet(): void {
    const spec = this.entry.carpet;
    if (!spec || !this.tank.vertexColorMaterial) return;
    if (this.carpetObject) this.carpetObject.destroy();
    const lp = this.root.getTransform().getLocalPosition();
    const w = this.entry.widthCm * this.sizeScale;
    const d = this.entry.depthCm * this.sizeScale;
    const builder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ]);
    builder.topology = MeshTopology.Triangles;
    builder.indexType = MeshIndexType.UInt16;
    buildCarpetMesh(builder, spec, w, d, this.seed, (x, z) => this.tank.surfaceAt(lp.x + x, lp.z + z) - lp.y);
    if (!builder.isValid()) return;
    builder.updateMesh();
    const so = global.scene.createSceneObject("Carpet");
    so.setParent(this.pivot);
    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    rmv.mesh = builder.getMesh();
    const mat = this.tank.vertexColorMaterial.clone();
    mat.mainPass.twoSided = true;
    rmv.clearMaterials();
    rmv.addMaterial(mat);
    this.carpetObject = so;
  }

  private buildRing(assets: PieceVisualAssets): SceneObject {
    const ring = global.scene.createSceneObject("SelectRing");
    ring.setParent(this.root);
    const inner = global.scene.createSceneObject("RingMesh");
    inner.setParent(ring);
    const size = assets.ringMesh.aabbMax.sub(assets.ringMesh.aabbMin);
    inner.getTransform().setLocalScale(new vec3(
      size.x > 0.0001 ? 1 / size.x : 1, size.y > 0.0001 ? 1 / size.y : 1, size.z > 0.0001 ? 1 / size.z : 1));
    const rmv = inner.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    rmv.mesh = assets.ringMesh;
    const mat = assets.ringMaterial.clone();
    rmv.clearMaterials();
    rmv.addMaterial(mat);
    mat.mainPass.baseColor = RING_COLOR;
    ring.enabled = false;
    return ring;
  }

  private clampToTank(): void {
    const lp = this.root.getTransform().getLocalPosition();
    this.setLocal(lp.x, lp.z);
  }

  private clampXZ(x: number, z: number, e: vec3): { x: number; z: number } {
    const maxX = Math.max(0, this.tank.halfWidth - e.x / 2 - WALL_MARGIN_CM);
    const maxZ = Math.max(0, this.tank.halfDepth - e.z / 2 - WALL_MARGIN_CM);
    return { x: Math.max(-maxX, Math.min(maxX, x)), z: Math.max(-maxZ, Math.min(maxZ, z)) };
  }

  /** Scale the prefab instance so its bounding-box height equals heightCm, and centre it on the wrapper. */
  private fitVisual(visual: SceneObject, heightCm: number): void {
    const visuals: RenderMeshVisual[] = [];
    this.collectVisuals(visual, visuals);
    if (visuals.length === 0) {
      print("ScapePlannerPiece: prefab has no RenderMeshVisual: " + this.entry.label);
      return;
    }
    const toWrapper = this.root.getTransform().getInvertedWorldTransform();
    let min = new vec3(Infinity, Infinity, Infinity);
    let max = new vec3(-Infinity, -Infinity, -Infinity);
    for (const v of visuals) {
      const mesh = v.mesh;
      if (!mesh) continue;
      const a = mesh.aabbMin;
      const b = mesh.aabbMax;
      const world = v.getTransform().getWorldTransform();
      for (let i = 0; i < 8; i++) {
        const corner = new vec3(i & 1 ? b.x : a.x, i & 2 ? b.y : a.y, i & 4 ? b.z : a.z);
        const p = toWrapper.multiplyPoint(world.multiplyPoint(corner));
        min = new vec3(Math.min(min.x, p.x), Math.min(min.y, p.y), Math.min(min.z, p.z));
        max = new vec3(Math.max(max.x, p.x), Math.max(max.y, p.y), Math.max(max.z, p.z));
      }
    }
    const size = max.sub(min);
    if (!(size.y > 0.0001)) {
      print("ScapePlannerPiece: zero-height bounds for " + this.entry.label);
      return;
    }
    const factor = heightCm / size.y;
    const t = visual.getTransform();
    const s = t.getLocalScale();
    t.setLocalScale(new vec3(s.x * factor, s.y * factor, s.z * factor));
    const centre = min.add(max).uniformScale(0.5);
    const lp = t.getLocalPosition();
    t.setLocalPosition(new vec3(lp.x - centre.x * factor, lp.y - centre.y * factor, lp.z - centre.z * factor));
  }

  /** Vertex positions of the fitted visual in pivot space, thinned out, for epiphyte placement. */
  private collectSurfacePoints(visual: SceneObject): vec3[] {
    const visuals: RenderMeshVisual[] = [];
    this.collectVisuals(visual, visuals);
    const toPivot = this.pivot.getTransform().getInvertedWorldTransform();
    const out: vec3[] = [];
    for (const v of visuals) {
      if (!v.mesh) continue;
      let flat: number[];
      try {
        flat = v.mesh.extractVerticesForAttribute("position");
      } catch (e) {
        print("ScapePlannerPiece: cannot read vertices of " + this.entry.label + ": " + e);
        continue;
      }
      const n = flat.length / 3;
      const step = Math.max(1, Math.floor(n / MAX_SURFACE_POINTS));
      const world = v.getTransform().getWorldTransform();
      for (let i = 0; i < n; i += step) {
        const p = new vec3(flat[3 * i], flat[3 * i + 1], flat[3 * i + 2]);
        out.push(toPivot.multiplyPoint(world.multiplyPoint(p)));
      }
    }
    return out;
  }

  /** Multiply the GLB material's base colour by a tint (per-instance clones), for species variants that share a mesh. */
  private applyTint(visual: SceneObject, tint: vec4): void {
    const visuals: RenderMeshVisual[] = [];
    this.collectVisuals(visual, visuals);
    for (const v of visuals) {
      const count = v.getMaterialsCount();
      const clones: Material[] = [];
      for (let i = 0; i < count; i++) clones.push(v.getMaterial(i).clone());
      v.clearMaterials();
      for (const m of clones) {
        const pass = m.mainPass;
        if (pass.baseColorFactor !== undefined) {
          const c = pass.baseColorFactor as vec4;
          pass.baseColorFactor = new vec4(c.x * tint.x, c.y * tint.y, c.z * tint.z, c.w * tint.w);
        } else if (pass.baseColor !== undefined) {
          const c = pass.baseColor as vec4;
          pass.baseColor = new vec4(c.x * tint.x, c.y * tint.y, c.z * tint.z, c.w * tint.w);
        }
        v.addMaterial(m);
      }
    }
  }

  private collectVisuals(obj: SceneObject, out: RenderMeshVisual[]): void {
    const rmv = obj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null;
    if (rmv) out.push(rmv);
    for (let i = 0; i < obj.getChildrenCount(); i++) this.collectVisuals(obj.getChild(i), out);
  }
}
