// Scape Planner: one placed piece (stone, wood or plant) inside the tank.
// A unit-scale wrapper SceneObject carries the collider, the SIK Interactable
// and the InteractableManipulation; the GLB prefab instance is a scaled,
// rotated visual child. The wrapper stays axis-aligned: yaw and lean rotate
// the visual, and the collider and the tank clamp use the rotated bounds.

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { CatalogEntry, pieceObjectName } from "./ScapePlannerCatalog";
import { PieceInfo } from "./ScapePlannerRules";
import { ScapePlannerTank } from "./ScapePlannerTank";

const WALL_MARGIN_CM = 0.6;
const TARGETING_DIRECT_AND_INDIRECT = 3;
const DEG = Math.PI / 180;
const RING_COLOR = new vec4(0.3, 0.95, 1.0, 0.9);

export interface PieceVisualAssets {
  ringMesh: RenderMesh;
  ringMaterial: Material;
}

/** Axis-aligned extents of a w x h x d box after yaw (about y) then lean (about x). */
export function rotatedExtents(w: number, h: number, d: number, yawDeg: number, leanDeg: number): vec3 {
  const cy = Math.abs(Math.cos(yawDeg * DEG));
  const sy = Math.abs(Math.sin(yawDeg * DEG));
  const hx = (w * cy + d * sy) / 2;
  const hz0 = (w * sy + d * cy) / 2;
  const cl = Math.abs(Math.cos(leanDeg * DEG));
  const sl = Math.abs(Math.sin(leanDeg * DEG));
  const hy = (h / 2) * cl + hz0 * sl;
  const hz = (h / 2) * sl + hz0 * cl;
  return new vec3(hx * 2, hy * 2, hz * 2);
}

export class ScapePlannerPiece {
  readonly entry: CatalogEntry;
  readonly root: SceneObject;
  readonly onMoved: Event<void> = new Event<void>();
  readonly onGrabbed: Event<void> = new Event<void>();

  private readonly tank: ScapePlannerTank;
  private readonly pivot: SceneObject;
  private readonly collider: ColliderComponent;
  private readonly manipulation: InteractableManipulation;
  private readonly ring: SceneObject | null;
  private sizeScale = 1;
  private _yawDeg = 0;
  private _leanDeg = 0;
  private bound = false;

  constructor(prefab: ObjectPrefab, entry: CatalogEntry, sizeScale: number, tank: ScapePlannerTank, xLocal: number, zLocal: number, assets: PieceVisualAssets | null) {
    this.entry = entry;
    this.tank = tank;
    this.sizeScale = sizeScale;

    this.root = global.scene.createSceneObject(pieceObjectName(entry));
    this.root.setParent(tank.getSceneObject());

    // The pivot sits at the wrapper origin (the centre of the fitted bounds); yaw, lean and size act on it.
    this.pivot = global.scene.createSceneObject("Pivot");
    this.pivot.setParent(this.root);
    const visual = prefab.instantiate(this.pivot);
    this.fitVisual(visual, entry.heightCm);

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

  /** Subscribe to SIK events; call once from an OnStartEvent handler or later. */
  bindEvents(): void {
    if (this.bound) return;
    this.bound = true;
    this.manipulation.onManipulationStart.add(() => this.onGrabbed.invoke());
    this.manipulation.onManipulationUpdate.add(() => this.clampToTank());
    this.manipulation.onManipulationEnd.add(() => {
      this.clampToTank();
      this.onMoved.invoke();
    });
  }

  get kind() { return this.entry.kind; }
  get yawDeg(): number { return this._yawDeg; }
  get leanDeg(): number { return this._leanDeg; }
  get scale(): number { return this.sizeScale; }

  /** Current footprint and height in cm after size, yaw and lean. */
  get extents(): vec3 {
    const s = this.sizeScale;
    return rotatedExtents(this.entry.widthCm * s, this.entry.heightCm * s, this.entry.depthCm * s, this._yawDeg, this._leanDeg);
  }

  get xLocal(): number { return this.root.getTransform().getLocalPosition().x; }
  get zLocal(): number { return this.root.getTransform().getLocalPosition().z; }

  setYaw(deg: number): void {
    this._yawDeg = ((deg % 360) + 360) % 360;
    this.applyShape();
    this.clampToTank();
  }

  /** Lean the top toward the front glass (the viewer), 0 to 30 degrees. */
  setLean(deg: number): void {
    this._leanDeg = Math.max(0, Math.min(30, deg));
    this.applyShape();
    this.clampToTank();
  }

  setSizeScale(scale: number): void {
    this.sizeScale = scale;
    this.applyShape();
    this.clampToTank();
  }

  setSelected(on: boolean): void {
    if (this.ring) this.ring.enabled = on;
  }

  setLocal(x: number, z: number): void {
    const e = this.extents;
    const p = this.clampXZ(x, z, e);
    const y = this.tank.substrateTopAt(p.z) + e.y / 2;
    this.root.getTransform().setLocalPosition(new vec3(p.x, y, p.z));
  }

  info(): PieceInfo {
    const e = this.extents;
    const c = this.entry;
    return { id: c.id, kind: c.kind, form: c.form, species: c.species, x: this.xLocal, z: this.zLocal, width: e.x, depth: e.z, height: e.y,
      matureHeight: Math.max(e.y, c.matureHeightCm * this.sizeScale), yawDeg: this._yawDeg, leanDeg: this._leanDeg, broadLeaf: c.broadLeaf, red: c.red };
  }

  destroy(): void {
    this.root.destroy();
  }

  // ── internals ────────────────────────────────────────────────────────

  /** Apply size, yaw and lean to the pivot, resize the collider and the ring. */
  private applyShape(): void {
    const t = this.pivot.getTransform();
    const s = this.sizeScale;
    t.setLocalScale(new vec3(s, s, s));
    const yaw = quat.angleAxis(this._yawDeg * DEG, new vec3(0, 1, 0));
    const lean = quat.angleAxis(this._leanDeg * DEG, new vec3(1, 0, 0));
    t.setLocalRotation(lean.multiply(yaw));
    const e = this.extents;
    const shape = this.collider.shape as BoxShape;
    shape.size = e;
    this.collider.shape = shape;
    if (this.ring) {
      const rt = this.ring.getTransform();
      rt.setLocalPosition(new vec3(0, -e.y / 2 + 0.2, 0));
      rt.setLocalScale(new vec3(e.x + 3, 0.3, e.z + 3));
    }
  }

  private buildRing(assets: PieceVisualAssets): SceneObject {
    // Outer object is scaled in cm by applyShape; the inner mesh is normalised to a unit box.
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

  private collectVisuals(obj: SceneObject, out: RenderMeshVisual[]): void {
    const rmv = obj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null;
    if (rmv) out.push(rmv);
    for (let i = 0; i < obj.getChildrenCount(); i++) this.collectVisuals(obj.getChild(i), out);
  }
}
