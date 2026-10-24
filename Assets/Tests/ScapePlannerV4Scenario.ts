// v4 criteria: soil and sand mounds raise the substrate; carpet tiles lay a lawn edge to
// edge along the front glass; moss hangs on a stone and follows it; Mirror and Bigger act on
// the selected stone; Clear flattens the substrate again. It leaves its layout in place so
// the preview can be inspected after the run.
import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario";
import { expect } from "Leaf.lspkg/Utils/common/Expect";
import { findSceneObjectsByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { ScapePlannerTank } from "../Scripts/ScapePlannerTank";
import { ScapePlannerLeafInteractor } from "./ScapePlannerLeafInteractor";

@component
export class ScapePlannerV4Scenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new ScapePlannerLeafInteractor();
    const tank = findSceneObjectsByName("Tank")[0].getComponent(ScapePlannerTank.getTypeName()) as ScapePlannerTank;
    await sleep(1500);
    await interactor.tapButton("Button_clear");

    // A soil mound raises the surface where it lands.
    const before = tank.surfaceAt(-6, -8);
    await interactor.tapPiece("soil");
    const mound = interactor.pieceLocal("Piece_Soil");
    const raised = tank.surfaceAt(mound.x, mound.z);
    print("[v4] surface before " + before.toFixed(2) + " after " + raised.toFixed(2));
    expect(raised - tank.substrateTopAt(mound.z)).toBeGreaterThan(3);

    // A second soil mound does not land on the first.
    await interactor.tapPiece("soil");
    const soils = findSceneObjectsByName("Piece_Soil");
    expect(soils.length).toBe(2);
    const a = soils[0].getTransform().getLocalPosition();
    const b = soils[1].getTransform().getLocalPosition();
    expect(Math.abs(a.x - b.x) + Math.abs(a.z - b.z)).toBeGreaterThan(5);
    await interactor.tapPiece("sand");

    // Moss hangs on the stone it is placed on.
    await interactor.tapPiece("seiryu");
    await interactor.tapPiece("moss");
    const moss = findSceneObjectsByName("Piece_Xmas moss")[0];
    expect(moss.getParent().name).toBe("Pivot");
    expect(moss.getParent().getParent().name).toBe("Piece_Seiryu");

    // Moving the stone carries the moss.
    const mossBefore = moss.getTransform().getWorldPosition();
    await interactor.dragPiece("Piece_Seiryu", new vec3(-8, 0, 0));
    const mossAfter = moss.getTransform().getWorldPosition();
    print("[v4] moss moved " + mossAfter.sub(mossBefore).length.toFixed(1) + " cm with the stone");
    expect(mossAfter.sub(mossBefore).length).toBeGreaterThan(2);

    // Carpet tiles: four taps lay four tiles in the front row, about one tile apart.
    for (let i = 0; i < 4; i++) await interactor.tapPiece("hairgrass");
    const tiles = findSceneObjectsByName("Piece_Hairgrass").map((so) => so.getTransform().getLocalPosition());
    expect(tiles.length).toBe(4);
    const xs = tiles.map((p) => p.x).sort((p, q) => p - q);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeGreaterThan(6);
      expect(xs[i] - xs[i - 1]).toBeLessThan(11);
    }
    for (const p of tiles) expect(Math.abs(p.z - tiles[0].z)).toBeLessThan(0.5);
    await interactor.tapPiece("carpet");
    await interactor.tapPiece("carpet");

    // Mirror and Bigger act on the selected piece (the stone, once it is grabbed).
    await interactor.dragPiece("Piece_Seiryu", new vec3(0.05, 0, 0), 100);
    const pivot = findSceneObjectsByName("Piece_Seiryu")[0].getChild(0);
    const s0 = pivot.getTransform().getLocalScale();
    await interactor.tapButton("Button_mirror");
    await interactor.tapButton("Button_bigger");
    const s1 = pivot.getTransform().getLocalScale();
    print("[v4] stone scale " + s0.x.toFixed(2) + " -> " + s1.x.toFixed(2));
    expect(s1.x).toBeLessThan(0);
    expect(s1.y).toBeGreaterThan(s0.y * 1.1);

    // Undo the last tile, then leave the layout for inspection.
    const n = interactor.countPieces();
    await interactor.tapButton("Button_undo");
    expect(interactor.countPieces()).toBe(n - 1);
  }
}
