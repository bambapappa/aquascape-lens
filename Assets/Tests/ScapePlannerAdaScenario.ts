// Builds an ADA-style Iwagumi in a 60P with the palette alone, after the reference photo:
// two tall Seiryu stones leaning outward in a V, a few small stones at their feet, the
// substrate mounded toward the middle and back, and dwarf hairgrass over the whole floor.
// It asserts nothing; it is a showcase and a check that the tools are enough.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
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

  async run(): Promise<void> {
    await sleep(1000);
    await this.tap("Button_clear");

    // Substrate: a soil ridge through the middle and back, sand left plain at the front corners.
    await this.place("soil");
    await this.tap("Button_bigger", 2);
    await this.place("soil");
    await this.tap("Button_bigger", 1);
    await this.place("soil");

    // Main stone (Oyaishi): left third, tall, leaning out to the left.
    await this.place("seiryu");
    await this.tap("Button_bigger", 2);
    await this.tap("Button_rotate", 18); // 270 degrees: the lean points left
    await this.tap("Button_lean", 3);
    // Second stone (Fukuishi): right of centre, leaning out to the right, mirrored for a different face.
    await this.place("seiryu");
    await this.tap("Button_bigger", 3);
    await this.tap("Button_mirror");
    await this.tap("Button_rotate", 6); // 90 degrees: the lean points right
    await this.tap("Button_lean", 3);
    // Small stones (Soeishi and Suteishi) at their feet.
    await this.place("seiryu");
    await this.tap("Button_smaller", 2);
    await this.tap("Button_rotate", 3);
    await this.place("seiryu");
    await this.tap("Button_smaller", 3);
    await this.tap("Button_mirror");
    await this.place("seiryu");
    await this.tap("Button_smaller", 4);
    await this.tap("Button_rotate", 8);

    // Dwarf hairgrass over the whole floor, row by row from the front glass.
    for (let i = 0; i < 21; i++) await this.place("hairgrass", 100);
    await this.tap("Button_guides");
    print("[ADA] pieces " + this.interactor.countPieces());
  }
}
