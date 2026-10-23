// Done criterion 3: a centred main stone turns the focal check amber; a stone on a third turns it green.
//
// LEAF's far-field drag in the preview moves a piece by a per-update velocity and
// cannot land on a precise x, so this scenario checks both coach states with the
// moves it can make reliably: a weak pull to the right carries the stone from its
// spawn point (a third) to the centre, and placing a fresh stone puts one on a third.
// Dragging an existing stone back onto a third was verified by hand in the preview.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerFocalPointScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    await sleep(1500);
    await interactor.tapButton("Button_clear");

    // A fresh stone spawns 6 cm left of centre: 40 percent of the width from the left, a third.
    await interactor.tapPiece("seiryu");
    const spawnX = interactor.pieceLocal("Piece_Seiryu").x;
    expect(spawnX).toBeLessThan(-3);
    expect(spawnX).toBeGreaterThan(-14);
    expect(interactor.coachMessage(0).includes("sits on a third")).toBe(true);

    // A weak pull to the right carries it to the centre: the focal check turns amber.
    await interactor.dragPiece("Piece_Seiryu", new vec3(0.15, 0, 0), 300);
    const centreX = interactor.pieceLocal("Piece_Seiryu").x;
    print("[ScapeLeaf] after pull to centre: x=" + centreX.toFixed(1));
    expect(Math.abs(centreX)).toBeLessThan(4);
    expect(interactor.coachMessage(0).includes("move it to a third")).toBe(true);

    // Take it away and place a new main stone on a third: the check turns green again.
    await interactor.tapButton("Button_undo");
    await interactor.tapPiece("seiryu");
    expect(interactor.coachMessage(0).includes("sits on a third")).toBe(true);
  }
}
