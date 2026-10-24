// Recreates a Green Aqua jungle-style 120P (reference photo: hardscape before planting,
// then the planted result): tall redmoor roots in three clusters leaning in different
// directions, grey stones at their feet, white sand in front and soil behind; then moss,
// Bucephalandra and Anubias on the wood, Cryptocoryne and Staurogyne in the midground and
// stem plants and Vallisneria at the back. Everything goes through the palette; Main's
// scripted move puts each piece at its spot. "[GA] hardscape done" marks the before state.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findSceneObjectsByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerMain } from "../Scripts/ScapePlannerMain";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

/** Pause after the hardscape so a recording can show the before state. */
const BEFORE_HOLD_MS = 6000;

interface Root { x: number; z: number; size: number; turns: number; lean: number; mirror: boolean }

const ROOTS: Root[] = [
  { x: -50, z: -6, size: 0, turns: 18, lean: 2, mirror: false },
  { x: -42, z: -2, size: 1, turns: 20, lean: 1, mirror: true },
  { x: -34, z: -9, size: -1, turns: 2, lean: 1, mirror: false },
  { x: -16, z: -5, size: 2, turns: 19, lean: 1, mirror: false },
  { x: -8, z: -9, size: 2, turns: 5, lean: 1, mirror: true },
  { x: 0, z: -4, size: 1, turns: 7, lean: 2, mirror: false },
  { x: 8, z: -11, size: 0, turns: 4, lean: 3, mirror: true },
  { x: 26, z: -7, size: 0, turns: 6, lean: 2, mirror: false },
  { x: 36, z: -10, size: 1, turns: 1, lean: 1, mirror: true },
  { x: 48, z: -5, size: 2, turns: 7, lean: 1, mirror: false },
  // Thinner roots filling the clusters
  { x: -46, z: -12, size: -2, turns: 10, lean: 3, mirror: true },
  { x: -24, z: -10, size: -1, turns: 21, lean: 2, mirror: false },
  { x: -12, z: -14, size: 0, turns: 12, lean: 1, mirror: true },
  { x: 16, z: -8, size: -1, turns: 3, lean: 2, mirror: false },
  { x: 32, z: -14, size: -2, turns: 15, lean: 3, mirror: true },
  { x: 54, z: -12, size: -1, turns: 20, lean: 2, mirror: false },
];

const EPIPHYTES = ["moss", "javamoss", "buce", "moss", "anubpetite", "moss", "buce", "javamoss", "moss", "anubias"];
/** The back wall is one fine green stem species, with a couple of red accents. */
const BACK_X = [-55, -48, -41, -34, -27, -20, -13, -6, 1, 8, 15, 22, 29, 36, 43, 50, 56];
const RED_ACCENTS = [5, 12];

@component
export class ScapePlannerGreenAquaScenario extends Scenario {
  private interactor = new ScapePlannerLeafInteractor();
  private main!: ScapePlannerMain;

  private async tap(name: string, times: number = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      try {
        await this.interactor.tapButton(name);
      } catch (e) {
        print("[GA] skipped " + name + ": " + e);
      }
      await sleep(120);
    }
  }

  /** Place a piece, size, turn, lean and mirror it, then move it to (x, z). Returns its index. */
  private async put(id: string, x: number, z: number, size: number = 0, turns: number = 0, lean: number = 0, mirror: boolean = false): Promise<number> {
    const index = this.main.pieceCount;
    try {
      await this.interactor.tapPiece(id);
    } catch (e) {
      print("[GA] skipped " + id + ": " + e);
      return -1;
    }
    if (size > 0) await this.tap("Button_bigger", size);
    if (size < 0) await this.tap("Button_smaller", -size);
    if (turns > 0) await this.tap("Button_rotate", turns);
    if (lean > 0) await this.tap("Button_lean", lean);
    if (mirror) await this.tap("Button_mirror");
    this.main.moveSelectedTo(x, z);
    await sleep(120);
    return index;
  }

  /** Select a placed host, then place an epiphyte on it. */
  private async hang(host: number, id: string): Promise<void> {
    if (host < 0) return;
    this.main.selectIndex(host);
    try {
      await this.interactor.tapPiece(id);
    } catch (e) {
      print("[GA] skipped " + id + ": " + e);
    }
    await sleep(120);
  }

  async run(): Promise<void> {
    this.main = findSceneObjectsByName("ScapePlanner")[0].getComponent(ScapePlannerMain.getTypeName()) as ScapePlannerMain;
    await sleep(1000);
    await this.tap("Button_clear");
    for (let i = 0; i < 6 && this.main.tankSizeLabel !== "120P"; i++) await this.tap("Button_tank");
    await this.tap("Button_guides");

    for (const x of [-45, -20, 5, 30, 52]) await this.put("soil", x, -15);
    for (const x of [-52, -35, -18, 0, 18, 35, 52]) await this.put("sand", x, 17, 1);

    const stones: number[] = [];
    stones.push(await this.put("slate", -46, 2, 0, 3));
    stones.push(await this.put("slate", -24, 3, -1, 9));
    stones.push(await this.put("slate", -6, 1, 1, 14, 0, true));
    stones.push(await this.put("slate", 16, 2, 0, 20));
    stones.push(await this.put("slate", 40, 0, 1, 6, 0, true));
    stones.push(await this.put("slate", 54, 6, -1, 11));
    await this.put("seiryu", -30, 8, -2, 4);
    await this.put("seiryu", 6, 9, -2, 12, 0, true);
    await this.put("seiryu", 30, 7, -2, 8);

    const roots: number[] = [];
    for (const r of ROOTS) roots.push(await this.put("tallroot", r.x, r.z, r.size, r.turns, r.lean, r.mirror));
    await this.put("spiderwood", -26, 6, -1, 3);
    await this.put("spiderwood", 14, 7, -1, 17, 0, true);
    await this.put("spiderwood", -44, 6, -1, 9);
    await this.put("spiderwood", 40, 6, -1, 12, 0, true);

    print("[DEMO] cam:before");
    print("[GA] hardscape done, pieces " + this.main.pieceCount);
    await sleep(BEFORE_HOLD_MS);

    // Several small tufts per root: moss everywhere, Anubias and Buce on most.
    for (let i = 0; i < roots.length; i++) {
      await this.hang(roots[i], EPIPHYTES[i % EPIPHYTES.length]);
      await this.hang(roots[i], "moss");
      if (i % 3 !== 2) await this.hang(roots[i], i % 2 === 0 ? "anubpetite" : "buce");
    }

    // Anubias and Bucephalandra on the stones at the root feet.
    for (let i = 0; i < stones.length; i++) await this.hang(stones[i], i % 2 === 0 ? "anubpetite" : "buce");

    // Midground: brown Cryptocoryne and round green Staurogyne at the root feet, mostly left.
    await this.put("cryptbrown", -40, 5, -1);
    await this.put("cryptbrown", -14, 4, -1);
    await this.put("staurogyne", -50, 8);
    await this.put("staurogyne", -30, 3);
    await this.put("staurogyne", 22, 4);

    // Background: a dense wall of one green stem plant in two rows, with two red accents.
    for (let i = 0; i < BACK_X.length; i++) {
      const id = RED_ACCENTS.indexOf(i) >= 0 ? "ludwigia" : "greenstems";
      await this.put(id, BACK_X[i], -19, 1);
      if (i % 2 === 0) await this.put("greenstems", BACK_X[i] + 3.5, -15);
    }

    print("[DEMO] cam:after");
    print("[GA] planted, pieces " + this.main.pieceCount);
    await sleep(3000);
  }
}
