// Demo run for the submission video: walks through the storyboard with real palette
// taps and piece drags, paced for recording. It asserts nothing. Lines starting with
// "[DEMO] cam:" tell the recording script on the host where to put the preview camera.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerDemoScenario extends Scenario {
  private interactor: ScapePlannerLeafInteractor = new ScapePlannerLeafInteractor();

  private cue(name: string): void {
    print("[DEMO] cam:" + name);
  }

  private async tap(button: string, holdMs: number): Promise<void> {
    try {
      await this.interactor.tapButton(button);
    } catch (e) {
      print("[DEMO] skipped " + button + ": " + e);
    }
    await sleep(holdMs);
  }

  private async place(id: string, holdMs: number): Promise<void> {
    try {
      await this.interactor.tapPiece(id);
    } catch (e) {
      print("[DEMO] skipped " + id + ": " + e);
    }
    await sleep(holdMs);
  }

  private async pull(piece: string, delta: vec3, ms: number, holdMs: number): Promise<void> {
    try {
      await this.interactor.dragPiece(piece, delta, ms);
    } catch (e) {
      print("[DEMO] skipped drag " + piece + ": " + e);
    }
    await sleep(holdMs);
  }

  async run(): Promise<void> {
    await sleep(1000);
    await this.tap("Button_clear", 500);
    this.cue("A");
    await sleep(4000);
    this.cue("orbit");
    await sleep(9000);

    await this.tap("Button_guides", 2000);
    await this.tap("Button_guides", 2500);

    await this.place("seiryu", 3000);
    await this.pull("Piece_Seiryu", new vec3(0.15, 0, 0), 300, 3000);
    await this.pull("Piece_Seiryu", new vec3(-0.15, 0, 0), 300, 3000);
    await this.place("seiryu", 3000);
    await this.place("seiryu", 3000);
    this.cue("coach");
    await sleep(4500);
    this.cue("A");
    await sleep(1000);

    await this.tap("Button_rotate", 1200);
    await this.tap("Button_rotate", 1200);
    await this.tap("Button_lean", 1500);
    await this.tap("Button_lean", 2000);

    await this.place("spiderwood", 2500);
    await this.place("carpet", 1500);
    await this.place("hccuba", 2000);
    await this.place("bush", 1500);
    await this.place("staurogyne", 2000);
    await this.place("stems", 1500);
    await this.pull("Piece_Rotala", new vec3(0, 0, 60), 600, 3000);
    await this.pull("Piece_Rotala", new vec3(0, 0, -60), 600, 3000);
    await this.place("vallisneria", 1500);
    await this.place("anubias", 1500);
    await this.place("buce", 2000);

    this.cue("coach");
    await sleep(2000);
    for (let i = 0; i < 4; i++) await this.tap("Button_style", 3000);
    this.cue("A");
    await sleep(1000);
    this.cue("orbit");
    await sleep(9000);

    await this.tap("Button_undo", 2000);
    await this.tap("Button_undo", 2000);
    await this.tap("Button_clear", 2500);

    this.cue("wide");
    await sleep(1500);
    for (let i = 0; i < 6; i++) await this.tap("Button_tank", 3000);
    this.cue("A");
    await sleep(1500);

    await this.place("dragon", 1200);
    await this.place("dragon", 1200);
    await this.place("dragon", 1200);
    await this.place("hairgrass", 1200);
    await this.place("hairgrass", 1200);
    await this.place("ludwigia", 2000);
    this.cue("orbit");
    await sleep(10000);
    print("[DEMO] cam:end");
    await sleep(1000);
  }
}
