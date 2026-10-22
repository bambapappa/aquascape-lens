// Scape Planner: one placed piece (stone, wood or plant) inside the tank.
// A unit-scale wrapper SceneObject carries the collider, the SIK Interactable
// and the InteractableManipulation; the GLB prefab instance is a scaled
// visual child. The wrapper is kept on the substrate and inside the tank.

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
import { InteractableManipulation } from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { PieceKind } from "./ScapePlannerRules";
import { ScapePlannerTank } from "./ScapePlannerTank";

export interface PieceSpec {
  kind: PieceKind;
  /** Target size in cm; the mesh is scaled uniformly so its height matches heightCm. */
  heightCm: number;
  /** Rough footprint in cm, used for the collider and the tank clamp. */
  widthCm: number;
  depthCm: number;
  label: string;
}

const WALL_MARGIN_CM = 0.6;

export class ScapePlannerPiece {
  readonly kind: PieceKind;
  readonly heightCm: number;
  readonly widthCm: number;
  readonly depthCm: number;
  readonly label: string;
  readonly root: SceneObject;
  readonly onMoved: Event<void> = new Event<void>();
  readonly onGrabbed: Event<void> = new Event<void>();

  private readonly tank: ScapePlannerTank;
  private readonly manipulation: InteractableManipulation;

  constructor(prefab: ObjectPrefab, spec: PieceSpec, tank: ScapePlannerTank, xLocal: number, zLocal: number) {
    this.kind = spec.kind;
    this.heightCm = spec.heightCm;
    this.widthCm = spec.widthCm;
    this.depthCm = spec.depthCm;
    this.label = spec.label;
    this.tank = tank;

    this.root = global.scene.createSceneObject("Piece_" + spec.label);
    this.root.setParent(tank.getSceneObject());

    const visual = prefab.instantiate(this.root);
    this.fitVisual(visual, spec.heightCm);

    const collider = this.root.createComponent("Physics.ColliderComponent") as ColliderComponent;
    const shape = Shape.createBoxShape();
    shape.size = new vec3(spec.widthCm, spec.heightCm, spec.depthCm);
    collider.shape = shape;

    const interactable = this.root.createComponent(Interactable.getTypeName()) as Interactable;
    interactable.targetingMode = 3; // direct and indirect, so the mouse interactor works in the preview

    this.manipulation = this.root.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation;
    this.manipulation.setCanRotate(false);
    this.manipulation.setCanScale(false);
    this.manipulation.setCanTranslate(true);

    this.setLocal(xLocal, zLocal);
  }

  /** Subscribe to SIK events; call from an OnStartEvent handler or later. */
  bindEvents(): void {
    this.manipulation.onManipulationStart.add(() => this.onGrabbed.invoke());
    this.manipulation.onManipulationUpdate.add(() => this.clampToTank());
    this.manipulation.onManipulationEnd.add(() => {
      this.clampToTank();
      this.onMoved.invoke();
    });
  }

  get xLocal(): number {
    return this.root.getTransform().getLocalPosition().x;
  }

  get zLocal(): number {
    return this.root.getTransform().getLocalPosition().z;
  }

  setLocal(x: number, z: number): void {
    const p = this.clampXZ(x, z);
    const y = this.tank.substrateTopAt(p.z) + this.heightCm / 2;
    this.root.getTransform().setLocalPosition(new vec3(p.x, y, p.z));
  }

  destroy(): void {
    this.root.destroy();
  }

  private clampToTank(): void {
    const lp = this.root.getTransform().getLocalPosition();
    this.setLocal(lp.x, lp.z);
  }

  private clampXZ(x: number, z: number): { x: number; z: number } {
    const maxX = this.tank.halfWidth - this.widthCm / 2 - WALL_MARGIN_CM;
    const maxZ = this.tank.halfDepth - this.depthCm / 2 - WALL_MARGIN_CM;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      z: Math.max(-maxZ, Math.min(maxZ, z)),
    };
  }

  /** Scale the prefab instance so its bounding-box height equals heightCm, and centre it on the wrapper. */
  private fitVisual(visual: SceneObject, heightCm: number): void {
    const visuals: RenderMeshVisual[] = [];
    this.collectVisuals(visual, visuals);
    if (visuals.length === 0) {
      print("ScapePlannerPiece: prefab has no RenderMeshVisual: " + this.label);
      return;
    }
    // Bounds in the wrapper's local frame, computed from each mesh's own AABB corners
    // pushed through the mesh transform. Deterministic on the frame of instantiation,
    // unlike worldAabbMin/Max which can lag one frame behind.
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
      print("ScapePlannerPiece: zero-height bounds for " + this.label);
      return;
    }
    const factor = heightCm / size.y;
    const t = visual.getTransform();
    const s = t.getLocalScale();
    t.setLocalScale(new vec3(s.x * factor, s.y * factor, s.z * factor));
    // Re-centre: the wrapper origin is the collider centre, so the scaled bounds centre must sit at the origin.
    const centre = min.add(max).uniformScale(0.5);
    const lp = t.getLocalPosition();
    t.setLocalPosition(new vec3(lp.x - centre.x * factor, lp.y - centre.y * factor, lp.z - centre.z * factor));
  }

  private collectVisuals(obj: SceneObject, out: RenderMeshVisual[]): void {
    const rmv = obj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null;
    if (rmv) out.push(rmv);
    for (let i = 0; i < obj.getChildrenCount(); i++) {
      this.collectVisuals(obj.getChild(i), out);
    }
  }
}
