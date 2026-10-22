// Done criterion 4: two stones turn the count check amber, a third stone turns it green.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerOddCountScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    await sleep(1500);
    await interactor.tapButton("Button_clear");

    await interactor.tapButton("Button_stone");
    expect(interactor.coachMessage(1).includes("(1)")).toBe(true);

    await interactor.tapButton("Button_stone");
    expect(interactor.coachMessage(1).includes("add one or remove one")).toBe(true);

    await interactor.tapButton("Button_stone");
    expect(interactor.coachMessage(1).includes("(3)")).toBe(true);
  }
}
