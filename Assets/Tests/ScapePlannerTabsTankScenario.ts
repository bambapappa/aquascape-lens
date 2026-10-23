// v3 criteria: palette tabs show each category, a plant from another tab can be placed, and Tank cycles standard sizes.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerTabsTankScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    await sleep(1500);
    await interactor.tapButton("Button_clear");

    // Pieces from four different tabs can be placed.
    await interactor.tapPiece("lava");
    await interactor.tapPiece("redmoor");
    await interactor.tapPiece("javafern");
    await interactor.tapPiece("vallisneria");
    expect(interactor.countPieces()).toBe(4);

    // Tank cycles to the next standard size: the glass gets wider and the pieces are cleared.
    const front = findSceneObjectByName("Front");
    const rmv = front.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    const widthBefore = rmv.worldAabbMax().x - rmv.worldAabbMin().x;
    await interactor.tapButton("Button_tank");
    await sleep(500);
    expect(interactor.countPieces()).toBe(0);
    const front2 = findSceneObjectByName("Front");
    const rmv2 = front2.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    const widthAfter = rmv2.worldAabbMax().x - rmv2.worldAabbMin().x;
    expect(Math.abs(widthAfter - widthBefore)).toBeGreaterThan(5);

    // A stone still lands on the substrate of the new tank.
    await interactor.tapPiece("seiryu");
    const p = interactor.pieceLocal("Piece_Seiryu");
    expect(p.y).toBeGreaterThan(10);
  }
}
