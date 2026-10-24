// Done criterion 2: pinching Stone places a 22 cm stone on the substrate; it can be dragged and never leaves the tank.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectsByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerPlaceStoneScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    await sleep(1500);
    await interactor.tapButton("Button_clear");
    const before = interactor.countPieces();

    await interactor.tapPiece("seiryu");
    expect(interactor.countPieces()).toBe(before + 1);

    const stone = findSceneObjectsByName("Piece_Seiryu")[0];
    expect(stone).toBeTruthy();
    // Collider box height equals the stone height from the brief (22 cm).
    const collider = stone.getComponent("Physics.ColliderComponent") as ColliderComponent;
    expect(collider).toBeTruthy();
    const shape = collider.shape as BoxShape;
    expect(shape.size.y).toBeCloseTo(22, 1);
    // The wrapper centre sits half a stone above the substrate (about 6 cm at the spawn point),
    // less the 20% the stone is sunk into the soil: about 6 + 11 - 4.4 = 12.6 cm.
    const start = interactor.pieceLocal("Piece_Seiryu");
    expect(start.y).toBeGreaterThan(10);
    expect(start.y).toBeLessThan(15);

    // Drag it 8 cm to the left; it moves.
    await interactor.dragPiece("Piece_Seiryu", new vec3(-8, 0, 0)); // a strong pull to the left (per-update vector)
    const moved = interactor.pieceLocal("Piece_Seiryu");
    expect(moved.x).toBeLessThan(start.x - 3);

    // Drag it hard toward the front glass; it stays inside the tank (half depth 15 cm).
    await interactor.dragPiece("Piece_Seiryu", new vec3(0, 0, 60)); // far more than the tank depth: must clamp
    const clamped = interactor.pieceLocal("Piece_Seiryu");
    expect(clamped.z).toBeLessThan(15);
    expect(clamped.z).toBeGreaterThan(5);
    // And it still rests in the substrate (lower at the front, where the substrate is thinner).
    expect(clamped.y).toBeGreaterThan(9);
    expect(clamped.y).toBeLessThan(15);
  }
}
