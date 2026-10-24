// Scape Planner: main orchestration. Owns the layout state (the placed
// pieces and the selected one), routes palette actions, runs the general
// composition checks and the style-fit score, and pushes them to the coach
// card. The tank, palette and coach are authored SceneObjects wired in by
// the bootstrap; pieces are runtime content created under the tank.

import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { ScapePlannerTank } from "./ScapePlannerTank";
import { ScapePlannerPaletteUI, PaletteAction } from "./ScapePlannerPaletteUI";
import { ScapePlannerCoachUI } from "./ScapePlannerCoachUI";
import { ScapePlannerPiece, MAX_LEAN_DEG } from "./ScapePlannerPiece";
import { CATALOG, CatalogEntry, catalogEntry, isEpiphyte, isHardscapeKind } from "./ScapePlannerCatalog";
import { Mound } from "./ScapePlannerSubstrate";
import { evaluateLayout, PieceInfo, TankDims } from "./ScapePlannerRules";
import { STYLES, scoreStyle, rulesToShow } from "./ScapePlannerStyles";

const YAW_STEP_DEG = 15;
const LEAN_STEP_DEG = 10;
/** Bigger and Smaller multiply the size by this; the size stays within the limits below. */
const SIZE_STEP = 1.2;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
/** A new carpet tile overlaps its neighbour by this share of the tile, so tiles knit into one lawn. */
const CARPET_OVERLAP = 0.15;
const STYLE_RULE_ROWS = 3;
/** Palette tray offset from the tank origin: below the table top and out in front of it. */
const PALETTE_DROP_CM = -14;
const PALETTE_FRONT_CM = 16;
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

  @ui.label("Piece prefabs (GLB imports), one per catalogue mesh key")
  @input prefabSeiryu!: ObjectPrefab;
  @input prefabDragon!: ObjectPrefab;
  @input prefabLava!: ObjectPrefab;
  @input prefabFrodo!: ObjectPrefab;
  @input prefabElephant!: ObjectPrefab;
  @input prefabPagoda!: ObjectPrefab;
  @input prefabSpiderwood!: ObjectPrefab;
  @input prefabManzanita!: ObjectPrefab;
  @input prefabRedmoor!: ObjectPrefab;
  @input prefabMopani!: ObjectPrefab;
  @input prefabBonsai!: ObjectPrefab;
  @input prefabCarpet!: ObjectPrefab;
  @input prefabHairgrass!: ObjectPrefab;
  @input prefabBush!: ObjectPrefab;
  @input prefabStems!: ObjectPrefab;
  @input prefabLudwigia!: ObjectPrefab;
  @input prefabAnubias!: ObjectPrefab;
  @input prefabJavafern!: ObjectPrefab;
  @input prefabMoss!: ObjectPrefab;
  @input prefabBuce!: ObjectPrefab;
  @input prefabVallisneria!: ObjectPrefab;
  @input prefabSword!: ObjectPrefab;
  @input prefabBlyxa!: ObjectPrefab;
  @input prefabDownoi!: ObjectPrefab;
  @input prefabLotus!: ObjectPrefab;
  @input prefabStaurogyne!: ObjectPrefab;

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
      if (e.render === "mesh" && !this.prefabFor(e.mesh)) print("ScapePlannerMain: prefab @input missing for mesh " + e.mesh + " (" + e.id + ")");
    }
    this.styleIndex = Math.max(0, Math.min(STYLES.length - 1, Math.floor(this.startStyleIndex)));
    this.createEvent("OnStartEvent").bind(() => this.onStart());
  }

  private onStart(): void {
    this.palette.onAction.add((action) => this.handleAction(action));
    if (this.placeOnStart) this.placeInFrontOfUser();
    this.layoutPanels();
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
      case "bigger": this.scaleSelected(SIZE_STEP); break;
      case "smaller": this.scaleSelected(1 / SIZE_STEP); break;
      case "mirror": this.mirrorSelected(); break;
      case "undo": this.undo(); break;
      case "clear": this.clear(); break;
      case "guides":
        this.tank.setGuidesVisible(!this.tank.guidesVisible);
        this.palette.setGuidesOn(this.tank.guidesVisible);
        break;
      case "style": this.nextStyle(); break;
      case "tank": this.nextTankSize(); break;
      case "place": this.placeInFrontOfUser(); break;
    }
  }

  addPiece(entry: CatalogEntry): void {
    const prefab = entry.render === "mesh" ? this.prefabFor(entry.mesh) : null;
    if (entry.render === "mesh" && !prefab) return;
    const sameKind = this.pieces.filter((p) => p.entry.id === entry.id).length;
    const sizeScale = entry.sizeLadder[sameKind % entry.sizeLadder.length];
    const spot = entry.render === "carpet" ? this.nextCarpetSpot(entry) : this.freeSpawnSpot(entry, sizeScale);
    const host = isEpiphyte(entry) ? this.epiphyteHost() : null;
    const piece = new ScapePlannerPiece(prefab, entry, sizeScale, this.tank, spot.x, spot.z,
      { ringMesh: this.tank.boxMesh, ringMaterial: this.tank.lineMaterial });
    if (host) {
      const point = host.defaultAttachPoint();
      if (point) piece.attachTo(host, point);
    }
    piece.bindEvents();
    piece.onGrabbed.add(() => this.select(piece));
    piece.onMoved.add(() => this.pieceMoved(piece));
    this.pieces.push(piece);
    this.select(piece);
    if (entry.render === "mound") this.applyMounds();
    this.refreshCoach(true);
  }

  /** After a drag: epiphytes re-hang on whatever hardscape they were dropped on; mounds reshape the substrate. */
  private pieceMoved(piece: ScapePlannerPiece): void {
    if (isEpiphyte(piece.entry)) this.rehang(piece);
    if (piece.entry.render === "mound") this.applyMounds();
    this.refreshCoach(true);
  }

  private rehang(piece: ScapePlannerPiece): void {
    const world = piece.root.getTransform().getWorldPosition();
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const h = this.pieces[i];
      if (h === piece || !h.isHardscape) continue;
      const point = h.surfacePointNear(world);
      if (point) {
        piece.attachTo(h, point);
        return;
      }
    }
    piece.detach();
  }

  /** The selected stone or wood, else the last one placed. */
  private epiphyteHost(): ScapePlannerPiece | null {
    if (this.selected && this.selected.isHardscape) return this.selected;
    for (let i = this.pieces.length - 1; i >= 0; i--) if (this.pieces[i].isHardscape) return this.pieces[i];
    return null;
  }

  /** Push every mound to the substrate and let the other pieces sit on the new surface. */
  private applyMounds(): void {
    const mounds: Mound[] = [];
    for (const p of this.pieces) {
      const m = p.mound();
      if (m) mounds.push(m);
    }
    this.tank.setMounds(mounds);
    for (const p of this.pieces) if (p.entry.render !== "mound") p.reseat();
  }

  scaleSelected(factor: number): void {
    if (!this.selected) return;
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.selected.scale * factor));
    this.selected.setSizeScale(s);
    if (this.selected.entry.render === "mound") this.applyMounds();
    this.refreshCoach(true);
  }

  mirrorSelected(): void {
    if (!this.selected || this.selected.entry.render !== "mesh") return;
    this.selected.setMirrored(!this.selected.mirrored);
    this.refreshCoach(true);
  }

  rotateSelected(): void {
    if (!this.selected) return;
    this.selected.setYaw(this.selected.yawDeg + YAW_STEP_DEG);
    this.refreshCoach(true);
  }

  leanSelected(): void {
    if (!this.selected) return;
    const next = this.selected.leanDeg + LEAN_STEP_DEG;
    this.selected.setLean(next > MAX_LEAN_DEG ? 0 : next);
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
    const last = this.pieces[this.pieces.length - 1];
    if (!last) return;
    this.removePieces([last]);
    this.select(this.pieces.length > 0 ? this.pieces[this.pieces.length - 1] : null);
    this.refreshCoach(true);
  }

  clear(): void {
    this.removePieces(this.pieces.slice());
    this.selected = null;
    this.refreshCoach(true);
  }

  /** Remove pieces and anything hanging on them; children go first so no object is destroyed twice. */
  private removePieces(targets: ScapePlannerPiece[]): void {
    const doomed = new Set<ScapePlannerPiece>(targets);
    for (const p of this.pieces) if (p.host && doomed.has(p.host)) doomed.add(p);
    const ordered = Array.from(doomed).sort((a, b) => (a.host ? 0 : 1) - (b.host ? 0 : 1));
    for (const p of ordered) p.destroy();
    this.pieces = this.pieces.filter((p) => !doomed.has(p));
    if (this.selected && doomed.has(this.selected)) this.selected = null;
    if (ordered.some((p) => p.entry.render === "mound")) this.applyMounds();
  }

  nextStyle(): void {
    this.styleIndex = (this.styleIndex + 1) % STYLES.length;
    this.refreshCoach(true);
  }

  /** Cycle the tank through the standard sizes; pieces are cleared and the panels follow the new tank. */
  nextTankSize(): void {
    this.clear();
    this.tank.nextSize();
    this.layoutPanels();
    this.refreshCoach(true);
  }

  /**
   * Put the palette tray in front of the table, below the user's line of sight into the
   * tank (so it never covers the layout), and the coach card above the tank.
   */
  private layoutPanels(): void {
    const d = this.tank.depthCm;
    const h = this.tank.heightCm;
    this.palette.getSceneObject().getTransform().setLocalPosition(new vec3(0, PALETTE_DROP_CM, d / 2 + PALETTE_FRONT_CM));
    this.coach.getSceneObject().getTransform().setLocalPosition(new vec3(0, h + 26, 6));
  }

  get tankSizeLabel(): string { return this.tank.sizeLabel; }

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

  /**
   * Where the next carpet tile goes: beside the last tile, on a grid one tile (less the
   * overlap) apart, at the free cell nearest the last tile. The first tile starts at the
   * front left, so repeated taps lay a lawn row by row from the front glass.
   */
  private nextCarpetSpot(entry: CatalogEntry): { x: number; z: number } {
    const step = entry.widthCm * (1 - CARPET_OVERLAP);
    const tiles = this.pieces.filter((p) => p.entry.render === "carpet");
    const margin = 0.6;
    const hw = this.tank.halfWidth - entry.widthCm / 2 - margin;
    const hd = this.tank.halfDepth - entry.depthCm / 2 - margin;
    const cols = Math.max(1, Math.round((2 * hw) / step) + 1);
    const rows = Math.max(1, Math.round((2 * hd) / step) + 1);
    const colX = (c: number) => (cols === 1 ? 0 : -hw + (2 * hw * c) / (cols - 1));
    const rowZ = (r: number) => (rows === 1 ? 0 : hd - (2 * hd * r) / (rows - 1));
    const lastX = tiles.length > 0 ? tiles[tiles.length - 1].xLocal : -hw;
    for (let r = 0; r < rows; r++) {
      let best: { x: number; z: number } | null = null;
      for (let c = 0; c < cols; c++) {
        const x = colX(c);
        const z = rowZ(r);
        if (tiles.some((p) => Math.abs(p.xLocal - x) < step / 2 && Math.abs(p.zLocal - z) < step / 2)) continue;
        if (!best || Math.abs(x - lastX) < Math.abs(best.x - lastX)) best = { x, z };
      }
      if (best) return best;
    }
    const last = tiles[tiles.length - 1];
    return last ? { x: last.xLocal, z: last.zLocal } : { x: 0, z: 0 };
  }

  /** First candidate spot whose footprint does not overlap an existing piece; the last candidate otherwise. */
  private freeSpawnSpot(entry: CatalogEntry, sizeScale: number): { x: number; z: number } {
    const w = entry.widthCm * sizeScale;
    const d = entry.depthCm * sizeScale;
    const z = SPAWN_Z_BY_ZONE[entry.zone] !== undefined ? SPAWN_Z_BY_ZONE[entry.zone] : 0;
    const isMound = entry.render === "mound";
    const infos = this.pieces.filter((p) => (p.entry.render === "mound") === isMound && !p.host).map((p) => p.info());
    for (const x of SPAWN_X_CM) {
      let free = true;
      for (const p of infos) {
        // Mounds may overlap by half so they merge into one ridge; other pieces keep clear.
        const reach = isMound ? 0.25 : 0.5;
        const overlapX = Math.abs(p.x - x) < (p.width + w) * reach;
        const overlapZ = Math.abs(p.z - z) < (p.depth + d) * reach;
        if (overlapX && overlapZ) { free = false; break; }
      }
      if (free) return { x, z };
    }
    return { x: SPAWN_X_CM[SPAWN_X_CM.length - 1], z };
  }

  // ── Coach ───────────────────────────────────────────────────────────────

  /** Current layout as plain data for the rules and style modules. */
  layoutInfo(): PieceInfo[] {
    return this.pieces.filter((p) => p.entry.kind !== "substrate").map((p) => p.info());
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

  private prefabFor(mesh: string): ObjectPrefab | null {
    switch (mesh) {
      case "seiryu": return this.prefabSeiryu;
      case "dragon": return this.prefabDragon;
      case "lava": return this.prefabLava;
      case "frodo": return this.prefabFrodo;
      case "elephant": return this.prefabElephant;
      case "pagoda": return this.prefabPagoda;
      case "spiderwood": return this.prefabSpiderwood;
      case "manzanita": return this.prefabManzanita;
      case "redmoor": return this.prefabRedmoor;
      case "mopani": return this.prefabMopani;
      case "bonsai": return this.prefabBonsai;
      case "carpet": return this.prefabCarpet;
      case "hairgrass": return this.prefabHairgrass;
      case "bush": return this.prefabBush;
      case "stems": return this.prefabStems;
      case "ludwigia": return this.prefabLudwigia;
      case "anubias": return this.prefabAnubias;
      case "javafern": return this.prefabJavafern;
      case "moss": return this.prefabMoss;
      case "buce": return this.prefabBuce;
      case "vallisneria": return this.prefabVallisneria;
      case "sword": return this.prefabSword;
      case "blyxa": return this.prefabBlyxa;
      case "downoi": return this.prefabDownoi;
      case "lotus": return this.prefabLotus;
      case "staurogyne": return this.prefabStaurogyne;
    }
    return null;
  }
}
