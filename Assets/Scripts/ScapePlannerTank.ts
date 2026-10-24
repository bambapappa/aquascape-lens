// Scape Planner: the virtual tank, the stand-in for the real aquarium.
// Builds a glass box on a table at real size, a sloped substrate, and the
// composition guides (thirds grid on the front glass, zone bands on the
// substrate). Everything is built from one box mesh and three materials
// that the bootstrap wires in as @inputs, so a human can swap them.
//
// The substrate is a height field (ScapePlannerSubstrate) built with MeshBuilder,
// so soil and sand mounds can reshape it; pieces ask surfaceAt(x, z) where to sit.
//
// Local frame: origin at the centre of the tank floor (inside the glass),
// +x to the right, +y up, +z toward the front glass (toward the user).

import { Mound, SubstrateField, buildSubstrateMesh } from "./ScapePlannerSubstrate";

/** Gap between the substrate mesh and the glass, in cm. */
const SUBSTRATE_INSET_CM = 0.2;

export interface TankSize {
  id: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
}

/** Common standard tanks (ADA-style names): width x depth x height in cm. */
export const TANK_SIZES: TankSize[] = [
  { id: "30C", widthCm: 30, depthCm: 30, heightCm: 30 },
  { id: "45P", widthCm: 45, depthCm: 27, heightCm: 30 },
  { id: "60P", widthCm: 60, depthCm: 30, heightCm: 36 },
  { id: "75P", widthCm: 75, depthCm: 45, heightCm: 45 },
  { id: "90P", widthCm: 90, depthCm: 45, heightCm: 45 },
  { id: "120P", widthCm: 120, depthCm: 45, heightCm: 45 },
];

@component
export class ScapePlannerTank extends BaseScriptComponent {
  @ui.label("Tank size (cm)")
  @input
  @hint("Inner width of the tank, left to right")
  widthCm: number = 60;
  @input
  @hint("Inner depth of the tank, front glass to back glass")
  depthCm: number = 30;
  @input
  @hint("Inner height of the tank")
  heightCm: number = 36;

  @ui.label("Substrate (cm)")
  @input
  substrateFrontCm: number = 4;
  @input
  substrateBackCm: number = 7;

  @ui.label("Table")
  @input
  tableHeightCm: number = 75;
  @input
  tableWidthCm: number = 90;
  @input
  tableDepthCm: number = 50;

  @ui.label("Visuals")
  @input
  @hint("Unit box mesh used for every panel, bar and band")
  boxMesh!: RenderMesh;
  @input
  @hint("Translucent material for the glass panes")
  glassMaterial!: Material;
  @input
  @hint("Unlit material for guide lines and zone bands (cloned and tinted per element)")
  lineMaterial!: Material;
  @input
  @hint("Lit material for substrate and table (cloned and tinted per element)")
  solidMaterial!: Material;
  @input
  @hint("Vertex colour material for the substrate height field and carpet tiles")
  vertexColorMaterial!: Material;

  private guidesRoot!: SceneObject;
  private boxSizeCm: vec3 = new vec3(1, 1, 1);
  private built = false;
  private builtGroups: SceneObject[] = [];
  private sizeIndex = 2;
  private field: SubstrateField = new SubstrateField(60, 30, 4, 7);
  private mounds: Mound[] = [];
  private substrateGroup: SceneObject | null = null;
  private zoneTintOn = true;

  onAwake(): void {
    if (!this.boxMesh || !this.glassMaterial || !this.lineMaterial || !this.solidMaterial) {
      print("ScapePlannerTank: a mesh or material @input is not wired. Check the bootstrap Phase B.");
      return;
    }
    this.measureBoxMesh();
    this.sizeIndex = this.findSizeIndex();
    this.rebuild();
  }

  /** Tear down and rebuild every visual for the current dimensions. */
  rebuild(): void {
    const guidesWereVisible = this.guidesRoot ? this.guidesRoot.enabled : true;
    for (const g of this.builtGroups) g.destroy();
    this.builtGroups = [];
    this.substrateGroup = null;
    this.buildTable();
    this.buildGlass();
    this.buildSubstrate();
    this.buildGuides();
    this.guidesRoot.enabled = guidesWereVisible;
    this.built = true;
  }

  /** Switch to a standard size by index into TANK_SIZES and rebuild. */
  setSize(index: number): void {
    const size = TANK_SIZES[((index % TANK_SIZES.length) + TANK_SIZES.length) % TANK_SIZES.length];
    this.sizeIndex = TANK_SIZES.indexOf(size);
    this.widthCm = size.widthCm;
    this.depthCm = size.depthCm;
    this.heightCm = size.heightCm;
    // Substrate slope scales with depth: 4 to 7 cm on a 30 cm deep tank.
    this.substrateFrontCm = 4;
    this.substrateBackCm = 4 + 3 * (size.depthCm / 30);
    this.tableWidthCm = Math.max(80, size.widthCm + 30);
    this.tableDepthCm = Math.max(50, size.depthCm + 20);
    this.mounds = [];
    this.rebuild();
  }

  nextSize(): TankSize {
    this.setSize(this.sizeIndex + 1);
    return TANK_SIZES[this.sizeIndex];
  }

  get sizeLabel(): string {
    return TANK_SIZES[this.sizeIndex].id;
  }

  private findSizeIndex(): number {
    for (let i = 0; i < TANK_SIZES.length; i++) {
      const t = TANK_SIZES[i];
      if (t.widthCm === this.widthCm && t.depthCm === this.depthCm && t.heightCm === this.heightCm) return i;
    }
    return 2;
  }

  // ── Public API used by the main script ──────────────────────────────────

  get halfWidth(): number {
    return this.widthCm / 2;
  }

  get halfDepth(): number {
    return this.depthCm / 2;
  }

  /** Height of the sloped base (without mounds) above the tank floor at a local z. */
  substrateTopAt(zLocal: number): number {
    return this.field.baseAt(zLocal);
  }

  /** Height of the substrate surface, mounds included, at a local (x, z). */
  surfaceAt(xLocal: number, zLocal: number): number {
    return this.field.heightAt(xLocal, zLocal);
  }

  /** Replace the soil and sand mounds and rebuild the substrate mesh. */
  setMounds(mounds: Mound[]): void {
    this.mounds = mounds.slice();
    this.field.setMounds(this.mounds);
    this.buildSubstrate();
  }

  setGuidesVisible(visible: boolean): void {
    if (this.guidesRoot) this.guidesRoot.enabled = visible;
    if (this.zoneTintOn !== visible) {
      this.zoneTintOn = visible;
      if (this.built) this.buildSubstrate();
    }
  }

  get guidesVisible(): boolean {
    return this.guidesRoot ? this.guidesRoot.enabled : false;
  }

  get isBuilt(): boolean {
    return this.built;
  }

  // ── Construction ────────────────────────────────────────────────────────

  private measureBoxMesh(): void {
    const min = this.boxMesh.aabbMin;
    const max = this.boxMesh.aabbMax;
    const size = max.sub(min);
    this.boxSizeCm = new vec3(
      size.x > 0.0001 ? size.x : 1,
      size.y > 0.0001 ? size.y : 1,
      size.z > 0.0001 ? size.z : 1
    );
  }

  private box(
    parent: SceneObject,
    name: string,
    material: Material,
    centre: vec3,
    size: vec3,
    tint?: vec4,
    rotation?: quat
  ): SceneObject {
    const so = global.scene.createSceneObject(name);
    so.setParent(parent);
    const t = so.getTransform();
    t.setLocalPosition(centre);
    t.setLocalScale(
      new vec3(size.x / this.boxSizeCm.x, size.y / this.boxSizeCm.y, size.z / this.boxSizeCm.z)
    );
    if (rotation) t.setLocalRotation(rotation);
    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    rmv.mesh = this.boxMesh;
    const mat = material.clone();
    rmv.clearMaterials();
    rmv.addMaterial(mat);
    if (tint) mat.mainPass.baseColor = tint;
    return so;
  }

  private group(name: string, parent?: SceneObject): SceneObject {
    const so = global.scene.createSceneObject(name);
    so.setParent(parent ? parent : this.sceneObject);
    if (!parent) this.builtGroups.push(so);
    return so;
  }

  private buildTable(): void {
    const g = this.group("Table");
    const top = 4;
    const woodTop = new vec4(0.62, 0.45, 0.3, 1);
    const woodLeg = new vec4(0.45, 0.32, 0.22, 1);
    this.box(g, "TableTop", this.solidMaterial, new vec3(0, -top / 2, 0),
      new vec3(this.tableWidthCm, top, this.tableDepthCm), woodTop);
    const legSize = 5;
    const legH = this.tableHeightCm - top;
    const lx = this.tableWidthCm / 2 - legSize;
    const lz = this.tableDepthCm / 2 - legSize;
    const corners = [new vec3(lx, 0, lz), new vec3(-lx, 0, lz), new vec3(lx, 0, -lz), new vec3(-lx, 0, -lz)];
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      this.box(g, "Leg" + i, this.solidMaterial, new vec3(c.x, -top - legH / 2, c.z),
        new vec3(legSize, legH, legSize), woodLeg);
    }
  }

  private buildGlass(): void {
    const g = this.group("Glass");
    const w = this.widthCm;
    const d = this.depthCm;
    const h = this.heightCm;
    const glass = 0.6;
    const tint = new vec4(0.75, 0.9, 1.0, 0.14);
    // Panes sit just outside the inner volume so pieces can touch the inner faces.
    this.box(g, "Front", this.glassMaterial, new vec3(0, h / 2, d / 2 + glass / 2), new vec3(w + 2 * glass, h, glass), tint);
    this.box(g, "Back", this.glassMaterial, new vec3(0, h / 2, -d / 2 - glass / 2), new vec3(w + 2 * glass, h, glass), tint);
    this.box(g, "Left", this.glassMaterial, new vec3(-w / 2 - glass / 2, h / 2, 0), new vec3(glass, h, d), tint);
    this.box(g, "Right", this.glassMaterial, new vec3(w / 2 + glass / 2, h / 2, 0), new vec3(glass, h, d), tint);
    this.box(g, "Bottom", this.glassMaterial, new vec3(0, -glass / 2, 0), new vec3(w + 2 * glass, glass, d + 2 * glass), tint);
    // Visible edges: thin light bars along the twelve edges of the box.
    const e = this.group("Edges", g);
    const bar = 0.8;
    const edgeTint = new vec4(0.85, 0.95, 1.0, 0.9);
    const X = w / 2 + glass;
    const Z = d / 2 + glass;
    const xs = [-X, X];
    const zs = [-Z, Z];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        this.box(e, "Vertical", this.lineMaterial, new vec3(xs[i], h / 2, zs[j]), new vec3(bar, h, bar), edgeTint);
      }
      this.box(e, "TopX", this.lineMaterial, new vec3(0, h, zs[i]), new vec3(2 * X, bar, bar), edgeTint);
      this.box(e, "BottomX", this.lineMaterial, new vec3(0, 0, zs[i]), new vec3(2 * X, bar, bar), edgeTint);
      this.box(e, "TopZ", this.lineMaterial, new vec3(xs[i], h, 0), new vec3(bar, bar, 2 * Z), edgeTint);
      this.box(e, "BottomZ", this.lineMaterial, new vec3(xs[i], 0, 0), new vec3(bar, bar, 2 * Z), edgeTint);
    }
  }

  private buildSubstrate(): void {
    this.field = new SubstrateField(this.widthCm, this.depthCm, this.substrateFrontCm, this.substrateBackCm);
    this.field.setMounds(this.mounds);
    if (this.substrateGroup) {
      this.builtGroups = this.builtGroups.filter((g) => g !== this.substrateGroup);
      this.substrateGroup.destroy();
    }
    const g = this.group("Substrate");
    this.substrateGroup = g;
    if (!this.vertexColorMaterial) {
      this.buildBoxSubstrate(g);
      return;
    }
    const builder = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3, normalized: true },
      { name: "color", components: 4 },
    ]);
    builder.topology = MeshTopology.Triangles;
    builder.indexType = MeshIndexType.UInt16;
    buildSubstrateMesh(builder, this.field, SUBSTRATE_INSET_CM, this.zoneTintOn);
    if (!builder.isValid()) {
      print("ScapePlannerTank: substrate mesh is invalid, falling back to a box");
      this.buildBoxSubstrate(g);
      return;
    }
    builder.updateMesh();
    const so = global.scene.createSceneObject("Soil");
    so.setParent(g);
    const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    rmv.mesh = builder.getMesh();
    const mat = this.vertexColorMaterial.clone();
    mat.mainPass.twoSided = true;
    rmv.clearMaterials();
    rmv.addMaterial(mat);
  }

  /** Fallback when the vertex colour material is not wired: the old tilted box. */
  private buildBoxSubstrate(g: SceneObject): void {
    const w = this.widthCm - 0.4;
    const d = this.depthCm - 0.4;
    const hAvg = (this.substrateFrontCm + this.substrateBackCm) / 2;
    const slope = Math.atan((this.substrateBackCm - this.substrateFrontCm) / this.depthCm);
    const soil = new vec4(0.42, 0.3, 0.2, 1);
    this.box(g, "Soil", this.solidMaterial, new vec3(0, hAvg / 2, 0), new vec3(w, hAvg, d), soil,
      quat.angleAxis(slope, new vec3(1, 0, 0)));
  }

  private buildGuides(): void {
    this.guidesRoot = this.group("Guides");
    const w = this.widthCm;
    const d = this.depthCm;
    const h = this.heightCm;
    const line = 0.4;
    const cyan = new vec4(0.3, 0.95, 1.0, 0.85);
    const zFront = d / 2 - line; // just inside the front glass
    // Thirds grid on the front glass: two vertical lines, one horizontal line.
    this.box(this.guidesRoot, "ThirdLeft", this.lineMaterial, new vec3(-w / 6, h / 2, zFront), new vec3(line, h, line), cyan);
    this.box(this.guidesRoot, "ThirdRight", this.lineMaterial, new vec3(w / 6, h / 2, zFront), new vec3(line, h, line), cyan);
    this.box(this.guidesRoot, "ThirdHorizontal", this.lineMaterial, new vec3(0, h * 2 / 3, zFront), new vec3(w, line, line), cyan);
    // Zone bands: with the height-field substrate the zones are a tint in the surface itself
    // (see buildSubstrate); only the box fallback draws flat bands.
    if (this.vertexColorMaterial) return;
    const zones = [
      { name: "Foreground", z: d / 3, tint: new vec4(0.4, 1.0, 0.5, 0.28) },
      { name: "Midground", z: 0, tint: new vec4(1.0, 0.9, 0.3, 0.22) },
      { name: "Background", z: -d / 3, tint: new vec4(1.0, 0.55, 0.3, 0.22) },
    ];
    for (const zone of zones) {
      const y = this.substrateTopAt(zone.z) + 0.25;
      const slope = Math.atan((this.substrateBackCm - this.substrateFrontCm) / this.depthCm);
      this.box(this.guidesRoot, zone.name, this.lineMaterial, new vec3(0, y, zone.z),
        new vec3(w - 1, 0.15, d / 3 - 1), zone.tint, quat.angleAxis(slope, new vec3(1, 0, 0)));
    }
  }
}
