// Scape Planner: main orchestration. Owns the layout state (the placed
// pieces and the selected one), routes palette actions, runs the general
// composition checks and the style-fit score, and pushes them to the coach
// card. The tank, palette and coach are authored SceneObjects wired in by
// the bootstrap; pieces are runtime content created under the tank.

import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { ScapePlannerTank } from "./ScapePlannerTank";
import { ScapePlannerPaletteUI, PaletteAction } from "./ScapePlannerPaletteUI";
import { ScapePlannerCoachUI } from "./ScapePlannerCoachUI";
import { ScapePlannerPiece } from "./ScapePlannerPiece";
import { CATALOG, CatalogEntry, catalogEntry, isHardscapeKind } from "./ScapePlannerCatalog";
import { evaluateLayout, PieceInfo, TankDims } from "./ScapePlannerRules";
import { STYLES, scoreStyle, rulesToShow } from "./ScapePlannerStyles";

const YAW_STEP_DEG = 15;
const LEAN_STEPS_DEG = [0, 10, 20, 30];
const STYLE_RULE_ROWS = 3;
/** Candidate x positions for a new piece, nearest the golden thirds first. */
const SPAWN_X_CM = [-6, 6, -14, 14, -20, 20, 0];
const SPAWN_Z_BY_ZONE: { [zone: string]: number } = { foreground: 8, midground: 0, background: -8, anywhere: 2, "on-hardscape": 0 };

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

  @ui.label("Piece prefabs (GLB imports), one per catalogue id")
  @input prefabSeiryu!: ObjectPrefab;
  @input prefabDragon!: ObjectPrefab;
  @input prefabSpiderwood!: ObjectPrefab;
  @input prefabManzanita!: ObjectPrefab;
  @input prefabCarpet!: ObjectPrefab;
  @input prefabHairgrass!: ObjectPrefab;
  @input prefabBush!: ObjectPrefab;
  @input prefabAnubias!: ObjectPrefab;
  @input prefabStems!: ObjectPrefab;
  @input prefabLudwigia!: ObjectPrefab;

  @ui.label("Placement")
  @input
  @hint("How far in front of the user the tank is placed, in cm")
  distanceCm: number = 100;
  @input
  @hint("How far below eye level the tank floor sits, in cm (eye height minus table height)")
  dropBelowEyesCm: number = 85;
  @input
  @hint("Place the tank in front of the user when the Lens starts")
  placeOnStart: boolean = true;
  @input
  @hint("Style shown first: 0 Iwagumi, 1 Nature, 2 Dutch, 3 Jungle")
  startStyleIndex: number = 0;

  private pieces: ScapePlannerPiece[] = [];
  private selected: ScapePlannerPiece | null = null;
  private styleIndex = 0;

  onAwake(): void {
    if (!this.tank || !this.palette || !this.coach) {
      print("ScapePlannerMain: required @input not wired (tank / palette / coach). Check Phase B.");
      return;
    }
    for (const e of CATALOG) {
      if (!this.prefabFor(e.id)) print("ScapePlannerMain: prefab @input missing for catalogue id " + e.id);
    }
    this.styleIndex = Math.max(0, Math.min(STYLES.length - 1, Math.floor(this.startStyleIndex)));
    this.createEvent("OnStartEvent").bind(() => this.onStart());
  }

  private onStart(): void {
    this.palette.onAction.add((action) => this.handleAction(action));
    if (this.placeOnStart) this.placeInFrontOfUser();
    this.tank.setGuidesVisible(true);
    this.palette.setGuidesOn(true);
    this.refreshCoach(false);
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  handleAction(action: PaletteAction): void {
    const entry = catalogEntry(action);
    if (entry) {
      this.addPiece(entry);
      return;
    }
    switch (action) {
      case "rotate": this.rotateSelected(); break;
      case "lean": this.leanSelected(); break;
      case "size": this.resizeSelected(); break;
      case "undo": this.undo(); break;
      case "clear": this.clear(); break;
      case "guides":
        this.tank.setGuidesVisible(!this.tank.guidesVisible);
        this.palette.setGuidesOn(this.tank.guidesVisible);
        break;
      case "style": this.nextStyle(); break;
      case "place": this.placeInFrontOfUser(); break;
    }
  }

  addPiece(entry: CatalogEntry): void {
    const prefab = this.prefabFor(entry.id);
    if (!prefab) return;
    const sameKind = this.pieces.filter((p) => p.entry.id === entry.id).length;
    const sizeScale = entry.sizeLadder[sameKind % entry.sizeLadder.length];
    const spot = this.freeSpawnSpot(entry, sizeScale);
    const piece = new ScapePlannerPiece(prefab, entry, sizeScale, this.tank, spot.x, spot.z,
      { ringMesh: this.tank.boxMesh, ringMaterial: this.tank.lineMaterial });
    piece.bindEvents();
    piece.onGrabbed.add(() => this.select(piece));
    piece.onMoved.add(() => this.refreshCoach(true));
    this.pieces.push(piece);
    this.select(piece);
    this.refreshCoach(true);
  }

  rotateSelected(): void {
    if (!this.selected) return;
    this.selected.setYaw(this.selected.yawDeg + YAW_STEP_DEG);
    this.refreshCoach(true);
  }

  leanSelected(): void {
    if (!this.selected) return;
    const i = LEAN_STEPS_DEG.indexOf(this.selected.leanDeg);
    this.selected.setLean(LEAN_STEPS_DEG[(i + 1) % LEAN_STEPS_DEG.length]);
    this.refreshCoach(true);
  }

  resizeSelected(): void {
    if (!this.selected) return;
    const ladder = this.selected.entry.sizeLadder;
    if (ladder.length < 2) return;
    const i = ladder.indexOf(this.selected.scale);
    this.selected.setSizeScale(ladder[(i + 1) % ladder.length]);
    this.refreshCoach(true);
  }

  undo(): void {
    const last = this.pieces.pop();
    if (!last) return;
    if (this.selected === last) this.selected = null;
    last.destroy();
    this.select(this.pieces.length > 0 ? this.pieces[this.pieces.length - 1] : null);
    this.refreshCoach(true);
  }

  clear(): void {
    for (const p of this.pieces) p.destroy();
    this.pieces = [];
    this.selected = null;
    this.refreshCoach(true);
  }

  nextStyle(): void {
    this.styleIndex = (this.styleIndex + 1) % STYLES.length;
    this.refreshCoach(true);
  }

  /** Move the whole planner (tank, palette, coach) to distanceCm in front of the user, facing them. */
  placeInFrontOfUser(): void {
    const camera = WorldCameraFinderProvider.getInstance();
    const camPos = camera.getWorldPosition();
    const ahead = camera.getForwardPositionParallelToGround(this.distanceCm);
    if (isNaN(ahead.x) || isNaN(ahead.z)) return; // looking straight up or down: keep the current place
    const target = new vec3(ahead.x, camPos.y - this.dropBelowEyesCm, ahead.z);
    const toCamera = new vec3(camPos.x - target.x, 0, camPos.z - target.z);
    const yaw = Math.atan2(toCamera.x, toCamera.z); // rotates local +z (the front glass) toward the user
    const t = this.getSceneObject().getTransform();
    t.setWorldPosition(target);
    t.setWorldRotation(quat.angleAxis(yaw, new vec3(0, 1, 0)));
  }

  // ── Selection and spawning ──────────────────────────────────────────────

  private select(piece: ScapePlannerPiece | null): void {
    if (this.selected && this.selected !== piece) this.selected.setSelected(false);
    this.selected = piece;
    if (piece) piece.setSelected(true);
  }

  /** First candidate spot whose footprint does not overlap an existing piece; the last candidate otherwise. */
  private freeSpawnSpot(entry: CatalogEntry, sizeScale: number): { x: number; z: number } {
    const w = entry.widthCm * sizeScale;
    const d = entry.depthCm * sizeScale;
    const z = SPAWN_Z_BY_ZONE[entry.zone] !== undefined ? SPAWN_Z_BY_ZONE[entry.zone] : 0;
    const infos = this.layoutInfo();
    for (const x of SPAWN_X_CM) {
      let free = true;
      for (const p of infos) {
        const overlapX = Math.abs(p.x - x) < (p.width + w) / 2;
        const overlapZ = Math.abs(p.z - z) < (p.depth + d) / 2;
        if (overlapX && overlapZ) { free = false; break; }
      }
      if (free) return { x, z };
    }
    return { x: SPAWN_X_CM[SPAWN_X_CM.length - 1], z };
  }

  // ── Coach ───────────────────────────────────────────────────────────────

  /** Current layout as plain data for the rules and style modules. */
  layoutInfo(): PieceInfo[] {
    return this.pieces.map((p) => p.info());
  }

  private tankDims(): TankDims {
    return { widthCm: this.tank.widthCm, depthCm: this.tank.depthCm, heightCm: this.tank.heightCm };
  }

  private refreshCoach(speakUp: boolean): void {
    const infos = this.layoutInfo();
    const tank = this.tankDims();
    const results = evaluateLayout(infos, tank);
    for (let i = 0; i < results.length; i++) this.coach.setCheck(i, results[i].state, results[i].message);
    const score = scoreStyle(STYLES[this.styleIndex], infos, tank);
    this.coach.setStyle(score.style.name, score.score, score.applicable);
    const shown = rulesToShow(score, STYLE_RULE_ROWS);
    for (let i = 0; i < STYLE_RULE_ROWS; i++) {
      const r = shown[i];
      if (!r) { this.coach.setStyleRule(i, "neutral", ""); continue; }
      this.coach.setStyleRule(i, r.pass === null ? "neutral" : r.pass ? "ok" : "warn", r.rule.label);
    }
    if (speakUp) this.coach.speakUp();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  get pieceCount(): number { return this.pieces.length; }
  get currentStyleName(): string { return STYLES[this.styleIndex].name; }
  get hardscapeCount(): number { return this.pieces.filter((p) => isHardscapeKind(p.kind)).length; }

  private prefabFor(id: string): ObjectPrefab | null {
    switch (id) {
      case "seiryu": return this.prefabSeiryu;
      case "dragon": return this.prefabDragon;
      case "spiderwood": return this.prefabSpiderwood;
      case "manzanita": return this.prefabManzanita;
      case "carpet": return this.prefabCarpet;
      case "hairgrass": return this.prefabHairgrass;
      case "bush": return this.prefabBush;
      case "anubias": return this.prefabAnubias;
      case "stems": return this.prefabStems;
      case "ludwigia": return this.prefabLudwigia;
    }
    return null;
  }
}
