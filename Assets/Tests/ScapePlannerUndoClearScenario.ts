// Done criterion 5: Undo removes the last piece, Clear empties the tank and the coach resets.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerUndoClearScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    await sleep(1500);
    await interactor.tapButton("Button_clear");
    await interactor.tapButton("Button_seiryu");
    await interactor.tapButton("Button_spiderwood");
    await interactor.tapButton("Button_stems");
    const n = interactor.countPieces();
    expect(n).toBe(3);
    // Stems spawn in the background zone, so the zone check is green; pulled to the front it speaks up.
    expect(interactor.coachMessage(4).includes("Plants sit in their zones")).toBe(true);
    await interactor.dragPiece("Piece_Rotala", new vec3(0, 0, 60));
    expect(interactor.coachMessage(4).includes("Rotala belongs in the background")).toBe(true);

    await interactor.tapButton("Button_undo");
    expect(interactor.countPieces()).toBe(n - 1);

    await interactor.tapButton("Button_clear");
    expect(interactor.countPieces()).toBe(0);
    expect(interactor.coachMessage(0).includes("Place a stone")).toBe(true);
    expect(interactor.coachMessage(1).includes("3, 5 or 7")).toBe(true);
  }
}
