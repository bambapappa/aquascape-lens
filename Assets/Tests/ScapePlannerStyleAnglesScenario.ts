// v2 criteria: the style card scores the layout, Style cycles styles, Rotate and Lean act on the
// selected piece, and the front-gap check speaks up when hardscape touches the front glass.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerStyleAnglesScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    await sleep(1500);
    await interactor.tapButton("Button_clear");

    // Empty tank: the style header names the start style and asks for pieces.
    expect(interactor.styleHeader().includes("Iwagumi")).toBe(true);
    expect(interactor.styleHeader().includes("place pieces")).toBe(true);

    // Three Seiryu stones: Iwagumi rules become applicable and a percentage appears.
    await interactor.tapButton("Button_seiryu");
    await interactor.tapButton("Button_seiryu");
    await interactor.tapButton("Button_seiryu");
    expect(interactor.styleHeader().includes("%")).toBe(true);
    const iwagumi = interactor.styleHeader();

    // Style cycles to Nature; the header changes.
    await interactor.tapButton("Button_style");
    expect(interactor.styleHeader().includes("Nature")).toBe(true);
    expect(interactor.styleHeader()).not.toBe(iwagumi);
    await interactor.tapButton("Button_style");
    expect(interactor.styleHeader().includes("Dutch")).toBe(true);
    await interactor.tapButton("Button_style");
    expect(interactor.styleHeader().includes("Jungle")).toBe(true);
    await interactor.tapButton("Button_style");
    expect(interactor.styleHeader().includes("Iwagumi")).toBe(true);

    // Rotate turns the selected (last placed) stone by 15 degrees of yaw.
    await interactor.tapButton("Button_clear");
    await interactor.tapButton("Button_seiryu");
    const yaw0 = interactor.pieceYawDeg("Piece_Seiryu");
    await interactor.tapButton("Button_rotate");
    const yaw1 = interactor.pieceYawDeg("Piece_Seiryu");
    expect(Math.abs(((yaw1 - yaw0 + 540) % 360) - 180)).toBeCloseTo(15, 0);

    // Lean steps to 10 degrees and the main stone's lean is read by the Iwagumi rule.
    await interactor.tapButton("Button_lean");
    await sleep(300);
    const rows = [interactor.coachMessage(5), interactor.coachMessage(6), interactor.coachMessage(7)];
    expect(rows.some((r) => r.length > 0)).toBe(true);

    // A wood piece pushed against the front glass trips the front-gap check.
    await interactor.tapButton("Button_spiderwood");
    await interactor.dragPiece("Piece_Spider", new vec3(0, 0, 60)); // strong pull to the front, clamped at the glass
    expect(interactor.coachMessage(2).includes("Pull hardscape")).toBe(true);
  }
}
