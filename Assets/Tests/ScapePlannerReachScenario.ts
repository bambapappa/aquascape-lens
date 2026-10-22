// Reachability: a simulated arm (IK) must be able to pinch the palette on the table and place a stone.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { createIKInteractor } from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerReachScenario extends Scenario {
  private readonly ik = createIKInteractor();

  async run(): Promise<void> {
    const helper = new ScapePlannerLeafInteractor();
    await sleep(1500);
    await helper.tapButton("Button_clear");
    const before = helper.countPieces();
    const stoneButton = findInteractableByName("Button_stone");
    expect(stoneButton).toBeTruthy();
    await this.ik.trigger(stoneButton);
    await sleep(600);
    expect(helper.countPieces()).toBe(before + 1);
  }
}
