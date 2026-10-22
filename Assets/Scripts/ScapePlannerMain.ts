// Scape Planner: main orchestration. Owns the layout state (the placed
// pieces), routes palette actions, runs the composition checks and pushes
// their results into the coach card. The tank, palette and coach are
// authored SceneObjects wired in by the bootstrap; pieces are runtime
// content created under the tank.

import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { ScapePlannerTank } from "./ScapePlannerTank";
import { ScapePlannerPaletteUI, PaletteAction } from "./ScapePlannerPaletteUI";
import { ScapePlannerCoachUI } from "./ScapePlannerCoachUI";
import { ScapePlannerPiece, PieceSpec } from "./ScapePlannerPiece";
import { evaluateLayout, PieceInfo, PieceKind } from "./ScapePlannerRules";

// Real-world sizes from the design brief. The stone ladder repeats: 22, 13, 9 cm.
const STONE_LADDER_CM = [22, 13, 9];
const SPECS: { [kind: string]: PieceSpec } = {
  wood: { kind: "wood", heightCm: 18, widthCm: 28, depthCm: 22, label: "Wood" },
  carpet: { kind: "carpet", heightCm: 3, widthCm: 12, depthCm: 12, label: "Carpet" },
  bush: { kind: "bush", heightCm: 12, widthCm: 12, depthCm: 12, label: "Bush" },
  stems: { kind: "stems", heightCm: 25, widthCm: 8, depthCm: 8, label: "Stems" },
};

@component
export class ScapePlannerMain extends BaseScriptComponent {
  @ui.label("Authored scene parts (wired by the bootstrap)")
  @input
  @hint("The virtual tank component")
  tank!: ScapePlannerTank;
  @input
  @hint("The palette of pinch buttons")
  palette!: ScapePlannerPaletteUI;
  @input
  @hint("The coach card")
  coach!: ScapePlannerCoachUI;

  @ui.label("Piece prefabs (GLB imports)")
  @input
  stonePrefab!: ObjectPrefab;
  @input
  woodPrefab!: ObjectPrefab;
  @input
  carpetPrefab!: ObjectPrefab;
  @input
  bushPrefab!: ObjectPrefab;
  @input
  stemsPrefab!: ObjectPrefab;

  @ui.label("Placement")
  @input
  @hint("How far in front of the user the tank is placed, in cm")
  distanceCm: number = 100;
  @input
  @hint("How far below eye level the tank floor sits, in cm (eye height minus table height)")
  dropBelowEyesCm: number = 90;
  @input
  @hint("Place the tank in front of the user when the Lens starts")
  placeOnStart: boolean = true;
  @input
  @hint("Render colliders as wireframes for debugging")
  debugColliders: boolean = false;

  private pieces: ScapePlannerPiece[] = [];
  private stoneIndex = 0;
  private started = false;

  onAwake(): void {
    if (!this.tank || !this.palette || !this.coach) {
      print("ScapePlannerMain: required @input not wired (tank / palette / coach). Check Phase B.");
      return;
    }
    if (!this.stonePrefab || !this.woodPrefab || !this.carpetPrefab || !this.bushPrefab || !this.stemsPrefab) {
      print("ScapePlannerMain: a piece prefab @input is not wired. Check Phase B.");
      return;
    }
    this.createEvent("OnStartEvent").bind(() => this.onStart());
  }

  private onStart(): void {
    this.started = true;
    this.palette.onAction.add((action) => this.handleAction(action));
    if (this.placeOnStart) this.placeInFrontOfUser();
    this.tank.setGuidesVisible(true);
    this.palette.setGuidesOn(true);
    this.refreshCoach(false);
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  handleAction(action: PaletteAction): void {
    switch (action) {
      case "stone":
      case "wood":
      case "carpet":
      case "bush":
      case "stems":
        this.addPiece(action);
        break;
      case "undo":
        this.undo();
        break;
      case "clear":
        this.clear();
        break;
      case "guides":
        this.tank.setGuidesVisible(!this.tank.guidesVisible);
        this.palette.setGuidesOn(this.tank.guidesVisible);
        break;
      case "place":
        this.placeInFrontOfUser();
        break;
    }
  }

  addPiece(kind: PieceKind): void {
    const spec = this.specFor(kind);
    const prefab = this.prefabFor(kind);
    if (!spec || !prefab) return;
    // New pieces appear near the tank centre, slightly staggered so they do not stack.
    const n = this.pieces.length;
    const x = ((n % 3) - 1) * 6;
    const z = -((Math.floor(n / 3) % 3) - 1) * 5;
    const piece = new ScapePlannerPiece(prefab, spec, this.tank, x, z);
    piece.bindEvents();
    piece.onMoved.add(() => this.refreshCoach(true));
    this.pieces.push(piece);
    if (kind === "stone") this.stoneIndex++;
    this.refreshCoach(true);
  }

  undo(): void {
    const last = this.pieces.pop();
    if (!last) return;
    if (last.kind === "stone" && this.stoneIndex > 0) this.stoneIndex--;
    last.destroy();
    this.refreshCoach(true);
  }

  clear(): void {
    for (const p of this.pieces) p.destroy();
    this.pieces = [];
    this.stoneIndex = 0;
    this.refreshCoach(true);
  }

  /** Move the whole planner (tank, palette, coach) to distanceCm in front of the user, facing them. */
  placeInFrontOfUser(): void {
    const camera = WorldCameraFinderProvider.getInstance();
    const camPos = camera.getWorldPosition();
    const ahead = camera.getForwardPositionParallelToGround(this.distanceCm);
    const target = new vec3(ahead.x, camPos.y - this.dropBelowEyesCm, ahead.z);
    const toCamera = new vec3(camPos.x - target.x, 0, camPos.z - target.z);
    const yaw = Math.atan2(toCamera.x, toCamera.z); // rotates local +z (the front glass) toward the user
    const t = this.getSceneObject().getTransform();
    t.setWorldPosition(target);
    t.setWorldRotation(quat.angleAxis(yaw, new vec3(0, 1, 0)));
  }

  // ── Coach ───────────────────────────────────────────────────────────────

  /** Current layout as plain data for the rules module. */
  layoutInfo(): PieceInfo[] {
    return this.pieces.map((p) => ({ kind: p.kind, x: p.xLocal, z: p.zLocal, height: p.heightCm }));
  }

  private refreshCoach(speakUp: boolean): void {
    const results = evaluateLayout(this.layoutInfo(), {
      widthCm: this.tank.widthCm,
      depthCm: this.tank.depthCm,
      heightCm: this.tank.heightCm,
    });
    for (let i = 0; i < results.length; i++) {
      this.coach.setCheck(i, results[i].state, results[i].message);
    }
    if (speakUp) this.coach.speakUp();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  get pieceCount(): number {
    return this.pieces.length;
  }

  private specFor(kind: PieceKind): PieceSpec | null {
    if (kind === "stone") {
      const h = STONE_LADDER_CM[this.stoneIndex % STONE_LADDER_CM.length];
      // Seiryu stone proportions from the imported mesh: width about 0.57 of height, depth about 0.31.
      return { kind: "stone", heightCm: h, widthCm: h * 0.57, depthCm: h * 0.31, label: "Stone" };
    }
    return SPECS[kind] || null;
  }

  private prefabFor(kind: PieceKind): ObjectPrefab | null {
    switch (kind) {
      case "stone": return this.stonePrefab;
      case "wood": return this.woodPrefab;
      case "carpet": return this.carpetPrefab;
      case "bush": return this.bushPrefab;
      case "stems": return this.stemsPrefab;
    }
    return null;
  }
}
