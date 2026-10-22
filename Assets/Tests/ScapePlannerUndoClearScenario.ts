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
    await interactor.tapButton("Button_stone");
    await interactor.tapButton("Button_wood");
    await interactor.tapButton("Button_stems");
    const n = interactor.countPieces();
    expect(n).toBe(3);
    // Stems placed near the centre sit in the midground, so the zone check speaks up.
    expect(interactor.coachMessage(4).includes("Rotala belongs in the background")).toBe(true);

    await interactor.tapButton("Button_undo");
    expect(interactor.countPieces()).toBe(n - 1);

    await interactor.tapButton("Button_clear");
    expect(interactor.countPieces()).toBe(0);
    expect(interactor.coachMessage(0).includes("Place a stone")).toBe(true);
    expect(interactor.coachMessage(1).includes("3, 5 or 7")).toBe(true);
  }
}
