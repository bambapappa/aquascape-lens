// Builds an ADA-style Iwagumi in a 60P with the palette alone, after the reference photo:
// two tall Seiryu stones leaning outward in a V, a few small stones at their feet, the
// substrate mounded toward the middle and back, and dwarf hairgrass over the whole floor.
// It asserts nothing; it is a showcase and a check that the tools are enough.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { findSceneObjectsByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerMain } from "../Scripts/ScapePlannerMain";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerAdaScenario extends Scenario {
  private interactor = new ScapePlannerLeafInteractor();

  private async tap(name: string, times: number = 1, holdMs: number = 150): Promise<void> {
    for (let i = 0; i < times; i++) {
      try {
        await this.interactor.tapButton(name);
      } catch (e) {
        print("[ADA] skipped " + name + ": " + e);
      }
      await sleep(holdMs);
    }
  }

  private async place(id: string, holdMs: number = 200): Promise<void> {
    try {
      await this.interactor.tapPiece(id);
    } catch (e) {
      print("[ADA] skipped " + id + ": " + e);
    }
    await sleep(holdMs);
  }

  /** Place a slate, size it (+ bigger, - smaller), turn it, optionally mirror it, and drag it to (x, z). */
  private async slate(x: number, z: number, size: number, turns: number, mirror: boolean): Promise<void> {
    await this.place("slate");
    if (size > 0) await this.tap("Button_bigger", size);
    if (size < 0) await this.tap("Button_smaller", -size);
    if (turns > 0) await this.tap("Button_rotate", turns);
    if (mirror) await this.tap("Button_mirror");
    await this.moveTo("Piece_Slate", x, z);
  }

  /**
   * Put the selected (just placed) piece at tank-local (x, z). LEAF drags cannot land on a
   * precise spot, so the showcase uses Main's scripted move, which ends like a drag release.
   */
  private async moveTo(_name: string, x: number, z: number): Promise<void> {
    const main = findSceneObjectsByName("ScapePlanner")[0].getComponent(ScapePlannerMain.getTypeName()) as ScapePlannerMain;
    main.moveSelectedTo(x, z);
    await sleep(150);
  }

  async run(): Promise<void> {
    await sleep(1000);
    await this.tap("Button_clear");

    // Substrate: a low soil ridge across the middle and back.
    await this.place("soil");
    await this.moveTo("Piece_Soil", -10, -6);
    await this.place("soil");
    await this.moveTo("Piece_Soil", 8, -7);
    await this.place("soil");
    await this.moveTo("Piece_Soil", 0, -10);

    // Main stone (Oyaishi): left of centre, tall, leaning gently out to the left.
    await this.place("seiryu");
    await this.tap("Button_bigger", 2);
    await this.tap("Button_rotate", 18); // 270 degrees: the lean points left
    await this.tap("Button_lean", 2);
    await this.moveTo("Piece_Seiryu", -9, 0);
    // Second stone (Fukuishi): right of centre, leaning harder out to the right, mirrored for a different face.
    await this.place("seiryu");
    await this.tap("Button_bigger", 3);
    await this.tap("Button_mirror");
    await this.tap("Button_rotate", 6); // 90 degrees: the lean points right
    await this.tap("Button_lean", 3);
    await this.moveTo("Piece_Seiryu", 8, -1);

    // Flat slate: a slab split off under the right stone, one at the left stone's foot.
    await this.slate(18, 2, 1, 2, false);
    await this.slate(-18, 4, 0, 22, false);
    // Back stones: a rounded one at the back right, a lower one at the back left.
    await this.slate(20, -8, 2, 5, false);
    await this.slate(-20, -9, -1, 9, true);
    // Edge stones, cut off by the side glass in the photo.
    await this.slate(-28, -3, 0, 4, false);
    await this.slate(28, -2, 0, 14, true);
    // Chips between the two main stones.
    await this.slate(1, 5, -4, 3, false);
    await this.slate(4, 3, -4, 9, true);
    await this.slate(-2, 7, -5, 15, false);

    // Dwarf hairgrass over the whole floor, row by row from the front glass.
    for (let i = 0; i < 21; i++) await this.place("hairgrass", 100);
    await this.tap("Button_guides");
    print("[ADA] pieces " + this.interactor.countPieces());
  }
}
