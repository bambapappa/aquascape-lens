// LEAF helper for Scape Planner: taps palette buttons, drags pieces and reads the coach card.
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import { findInteractablesByName } from "Leaf.lspkg/Interactors/InteractableUtils";
import { findSceneObjectsByName, sleep } from "Leaf.lspkg/Utils/common/Utils";
import { CATALOG, catalogEntry, pieceObjectName } from "../Scripts/ScapePlannerCatalog";

export const PIECE_NAMES: string[] = CATALOG.map((e) => pieceObjectName(e));

export class ScapePlannerLeafInteractor extends DefaultLeafInteractor {
  /** Pinch a palette button by its scene-object name, e.g. "Button_seiryu". */
  async tapButton(buttonName: string, settleMs: number = 400): Promise<void> {
    const button = findInteractablesByName(buttonName, undefined, true)[0];
    if (!button) {
      throw new Error('Button "' + buttonName + '" not found or not enabled');
    }
    await this.trigger(button);
    await sleep(settleMs);
  }

  /** Place a catalogue piece: open its palette tab first, then pinch its button. */
  async tapPiece(id: string, settleMs: number = 400): Promise<void> {
    const entry = catalogEntry(id);
    if (!entry) throw new Error('Catalogue id "' + id + '" not found');
    await this.tapButton("Tab_" + entry.tab, settleMs);
    await this.tapButton("Button_" + id, settleMs);
  }

  /** Grab the first piece with this name and drag it by a world-space delta (cm). */
  async dragPiece(pieceName: string, delta: vec3, durationMs: number = 600): Promise<void> {
    const piece = findInteractablesByName(pieceName, undefined, true)[0];
    if (!piece) {
      throw new Error('Piece "' + pieceName + '" not found or not enabled');
    }
    await this.drag(piece, delta, durationMs);
    await sleep(400);
  }

  /** Number of placed pieces of every kind. */
  countPieces(): number {
    let n = 0;
    for (const name of PIECE_NAMES) n += findSceneObjectsByName(name).length;
    return n;
  }

  /** Local position (inside the tank) of the first piece with this name. */
  pieceLocal(pieceName: string): vec3 {
    const objs = findSceneObjectsByName(pieceName);
    if (objs.length === 0) throw new Error('Piece "' + pieceName + '" not found');
    return objs[0].getTransform().getLocalPosition();
  }

  /** Text of the style header on the coach card, e.g. "Style: Iwagumi  72%". */
  styleHeader(): string {
    const objs = findSceneObjectsByName("StyleHeader");
    if (objs.length === 0) throw new Error("Style header not found");
    const text = objs[0].getComponent("Component.Text") as Text;
    return text ? text.text : "";
  }

  /** Local rotation (yaw about y, degrees) of the first piece's pivot, read back from the scene. */
  pieceYawDeg(pieceName: string): number {
    const objs = findSceneObjectsByName(pieceName);
    if (objs.length === 0) throw new Error('Piece "' + pieceName + '" not found');
    const pivot = this.findDescendant(objs[0], "Pivot");
    if (!pivot) throw new Error("Pivot not found under " + pieceName);
    const e = pivot.getTransform().getLocalRotation().toEulerAngles();
    return (e.y * 180) / Math.PI;
  }

  /** Text of coach row `index` (0 focal, 1 odd count, 2 front gap, 3 height, 4 zones, 5-7 style rules). */
  coachMessage(index: number): string {
    const rows = findSceneObjectsByName("Row_" + index);
    if (rows.length === 0) throw new Error("Coach row " + index + " not found");
    const msg = this.findDescendant(rows[0], "Message");
    if (!msg) throw new Error("Coach message " + index + " not found");
    const text = msg.getComponent("Component.Text") as Text;
    return text ? text.text : "";
  }

  private findDescendant(obj: SceneObject, name: string): SceneObject | null {
    for (let i = 0; i < obj.getChildrenCount(); i++) {
      const c = obj.getChild(i);
      if (c.name === name) return c;
      const deeper = this.findDescendant(c, name);
      if (deeper) return deeper;
    }
    return null;
  }
}
