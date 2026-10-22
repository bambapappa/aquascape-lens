// Done criterion 1: the tank stands in front of the user and the Guides button hides and shows the thirds grid.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerTankGuidesScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    await sleep(1500);

    const tank = findSceneObjectByName("Tank");
    expect(tank).toBeTruthy();
    expect(tank.enabled).toBe(true);
    // The tank floor sits below the user and about a metre ahead.
    const tankPos = tank.getTransform().getWorldPosition();
    expect(tankPos.y).toBeLessThan(-50);
    expect(tankPos.z).toBeLessThan(-60);
    // Glass panes and the thirds grid exist.
    expect(findSceneObjectByName("Front")).toBeTruthy();
    expect(findSceneObjectByName("ThirdLeft")).toBeTruthy();

    const guides = findSceneObjectByName("Guides");
    expect(guides).toBeTruthy();
    const before = guides.enabled;
    await interactor.tapButton("Button_guides");
    expect(guides.enabled).toBe(!before);
    await interactor.tapButton("Button_guides");
    expect(guides.enabled).toBe(before);
  }
}
