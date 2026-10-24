// Scape Planner: the palette, a column of big pinch buttons beside the tank.
// Built from SpectaclesUIKit primitives (BackPlate + FlexLayout + Button).
// Emits onAction with the action id; the main script decides what happens.

import { FlexLayout } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import { FlexItem } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import { FlexAlign, FlexDirection, FlexJustify, FlexAlignSelf } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";
import { BackPlate } from "SpectaclesUIKit.lspkg/Scripts/BackPlate";
import { Button } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button";
import { Billboard } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard";
import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { Tab, entriesForTab } from "./ScapePlannerCatalog";

// ── Typography: single source of truth for text size + weight (Snap Specs type scale at 110 cm) ──
const FONT_SIZE_SCALE = 1.0;
type TextRole = "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2" | "Subheadline" | "Button" | "Callout" | "Body" | "Caption";
const TYPE_SCALE: Record<TextRole, { size: number; weight: number }> = {
  Title1: { size: 105, weight: 700 }, Title2: { size: 93, weight: 700 },
  HeadlineXL: { size: 62, weight: 700 }, Headline1: { size: 54, weight: 700 },
  Headline2: { size: 48, weight: 700 }, Subheadline: { size: 41, weight: 700 },
  Button: { size: 39, weight: 500 }, Callout: { size: 39, weight: 700 },
  Body: { size: 39, weight: 500 }, Caption: { size: 38, weight: 500 },
};
function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110);
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = roleSize(role, distanceCm);
  (t as Text & { weight?: number }).weight = TYPE_SCALE[role].weight;
}

/** A catalogue id, or one of the tool actions. */
export type PaletteAction = string;

interface ButtonSpec {
  id: PaletteAction;
  label: string;
}

const TOOL_BUTTONS: ButtonSpec[] = [
  { id: "rotate", label: "Rotate" },
  { id: "lean", label: "Lean" },
  { id: "bigger", label: "Bigger" },
  { id: "smaller", label: "Smaller" },
  { id: "mirror", label: "Mirror" },
  { id: "undo", label: "Undo" },
  { id: "clear", label: "Clear" },
  { id: "guides", label: "Guides" },
  { id: "style", label: "Style" },
  { id: "tank", label: "Tank" },
  { id: "place", label: "Place" },
];

interface TabSpec {
  tab: Tab;
  label: string;
}

const TABS: TabSpec[] = [
  { tab: "base", label: "Base" },
  { tab: "stone", label: "Stones" },
  { tab: "wood", label: "Wood" },
  { tab: "carpet", label: "Carpets" },
  { tab: "mid", label: "Mid" },
  { tab: "back", label: "Back" },
  { tab: "epi", label: "On wood" },
];

/** Tool buttons are narrower than catalogue buttons so eleven fit in one row. */
const TOOL_BUTTON_WIDTH_CM = 5.0;

/** Items per row of the catalogue area; two rows are shown per tab. */
const ITEMS_PER_ROW = 8;

const BUTTON_LABEL_Z = 0.08;
const LAYOUT_Z_LIFT = 0.02;

@component
export class ScapePlannerPaletteUI extends BaseScriptComponent {
  @ui.label("Panel")
  @input
  @hint("Panel width in cm")
  widthCm: number = 64;
  @input
  @hint("Padding inside the panel in cm")
  paddingCm: number = 1.6;
  @input
  @hint("Gap between buttons in cm")
  gapCm: number = 0.6;
  @input
  @hint("Button height in cm")
  buttonHeightCm: number = 4.4;
  @input
  @hint("Button width in cm")
  buttonWidthCm: number = 6.2;
  @input
  @hint("Title shown above the buttons")
  titleText: string = "Scape Planner";
  @input
  @hint("Turn the panel toward the user (off: keep the authored tilt, e.g. lying on the table)")
  faceUser: boolean = false;

  private _onAction = new Event<PaletteAction>();
  get onAction(): PublicApi<PaletteAction> {
    return this._onAction.publicApi();
  }

  private buttons: { [id: string]: Button } = {};
  private tabButtons: { [tab: string]: Button } = {};
  private itemRows: SceneObject[] = [];
  private currentTab: Tab = "stone";

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas");
    if (this.faceUser) {
      const bb = this.sceneObject.createComponent(Billboard.getTypeName()) as Billboard;
      bb.xAxisEnabled = false;
      bb.zAxisEnabled = false;
    }
    const backPlate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate;

    const content = global.scene.createSceneObject("Content");
    content.setParent(this.sceneObject);
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.6));

    const flex = content.createComponent(FlexLayout.getTypeName()) as FlexLayout;

    flex.autoDiscoverItemsOnStart = false; // items are added programmatically below
    flex.width = this.widthCm;
    flex.height = -1;
    flex.direction = FlexDirection.Column;
    flex.alignItems = FlexAlign.Center;
    flex.justifyContent = FlexJustify.Start;
    flex.rowGap = this.gapCm;
    flex.paddingTop = this.paddingCm;
    flex.paddingBottom = this.paddingCm;
    flex.paddingLeft = this.paddingCm;
    flex.paddingRight = this.paddingCm;
    // Full panel width: the measured container width can be narrower than the widest row, and the
    // plate may initialise after the first layout pass, so apply the size on both events.
    let plateHeight = 16;
    const applyPlate = () => { backPlate.size = new vec2(this.widthCm, plateHeight); };
    flex.onLayoutComplete.add((r) => { plateHeight = r.containerHeight; applyPlate(); });
    backPlate.onInitialized.add(applyPlate);

    const items: FlexItem[] = [];
    items.push(this.addHeader(content, this.titleText));
    items.push(this.addTabRow(content));
    this.itemRows = [this.addItemRow(content, items), this.addItemRow(content, items)];
    items.push(this.addRow(content, TOOL_BUTTONS));
    flex.addItems(items);
    this.showTab(this.currentTab);
  }

  /** Show the catalogue entries of one tab in the two item rows. */
  showTab(tab: Tab): void {
    this.currentTab = tab;
    for (const t of TABS) {
      const b = this.tabButtons[t.tab];
      if (b) b.isOn = t.tab === tab;
    }
    const entries = entriesForTab(tab);
    for (let r = 0; r < this.itemRows.length; r++) {
      const row = this.itemRows[r];
      for (let i = 0; i < ITEMS_PER_ROW; i++) {
        const slot = row.getChild(i);
        const entry = entries[r * ITEMS_PER_ROW + i];
        slot.enabled = !!entry;
        if (!entry) continue;
        slot.name = "Button_" + entry.id;
        const label = this.findDescendant(slot, "ButtonLabel");
        if (label) (label.getComponent("Component.Text") as Text).text = entry.label;
        this.slotAction[slot.name] = entry.id;
      }
    }
  }

  get activeTab(): Tab {
    return this.currentTab;
  }

  private slotAction: { [slotName: string]: string } = {};

  /** Visual toggle state for the Guides button. */
  setGuidesOn(on: boolean): void {
    const b = this.buttons["guides"];
    if (b) b.isOn = on;
  }

  private addHeader(parent: SceneObject, label: string): FlexItem {
    const so = global.scene.createSceneObject("Header");
    so.setParent(parent);
    so.getTransform().setLocalPosition(new vec3(0, 0, LAYOUT_Z_LIFT));
    const innerW = this.widthCm - this.paddingCm * 2;
    const headerH = 2.6;
    const t = so.createComponent("Component.Text") as Text;
    t.text = label;
    t.depthTest = true;
    applyTextRole(t, "Subheadline");
    t.horizontalAlignment = HorizontalAlignment.Center;
    t.verticalAlignment = VerticalAlignment.Center;
    t.horizontalOverflow = HorizontalOverflow.Overflow;
    t.verticalOverflow = VerticalOverflow.Overflow;
    t.layoutRect = Rect.create(-innerW / 2, innerW / 2, -headerH / 2, headerH / 2);
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem;
    item.flexShrink = 0;
    item.overrideWidth = innerW;
    item.overrideHeight = headerH;
    item.marginBottom = 0.6;
    item.alignSelf = FlexAlignSelf.Stretch;
    return item;
  }

  private addTabRow(parent: SceneObject): FlexItem {
    const innerW = this.widthCm - this.paddingCm * 2;
    const row = this.makeRow(parent, innerW, this.buttonHeightCm - 1);
    const items: FlexItem[] = [];
    for (const t of TABS) {
      const so = global.scene.createSceneObject("Tab_" + t.tab);
      so.setParent(row);
      so.getTransform().setLocalPosition(new vec3(0, 0, LAYOUT_Z_LIFT));
      const w = this.buttonWidthCm + 1.5;
      const h = this.buttonHeightCm - 1;
      const btn = so.createComponent(Button.getTypeName()) as Button;
      btn.size = new vec3(w, h, 1);
      btn.setIsToggleable(true);
      btn.onInitialized.add(() => { btn.size = new vec3(w, h, 1); });
      this.addButtonLabel(so, t.label, w - 0.5);
      const item = so.createComponent(FlexItem.getTypeName()) as FlexItem;
      item.flexShrink = 0;
      item.overrideWidth = w;
      item.overrideHeight = h;
      btn.onTriggerUp.add(() => this.showTab(t.tab));
      this.tabButtons[t.tab] = btn;
      items.push(item);
    }
    (row.getComponent(FlexLayout.getTypeName()) as FlexLayout).addItems(items);
    return row.getComponent(FlexItem.getTypeName()) as FlexItem;
  }

  /** A row of ITEMS_PER_ROW reusable item slots; showTab fills labels and actions. */
  private addItemRow(parent: SceneObject, outer: FlexItem[]): SceneObject {
    const innerW = this.widthCm - this.paddingCm * 2;
    const row = this.makeRow(parent, innerW, this.buttonHeightCm);
    const items: FlexItem[] = [];
    for (let i = 0; i < ITEMS_PER_ROW; i++) {
      const spec: ButtonSpec = { id: "slot" + i, label: "" };
      items.push(this.addButton(row, spec, (so) => this._onAction.invoke(this.slotAction[so.name] || "")));
    }
    (row.getComponent(FlexLayout.getTypeName()) as FlexLayout).addItems(items);
    outer.push(row.getComponent(FlexItem.getTypeName()) as FlexItem);
    return row;
  }

  private makeRow(parent: SceneObject, width: number, height: number): SceneObject {
    const row = global.scene.createSceneObject("Row");
    row.setParent(parent);
    row.getTransform().setLocalPosition(new vec3(0, 0, LAYOUT_Z_LIFT));
    const rowItem = row.createComponent(FlexItem.getTypeName()) as FlexItem;
    rowItem.flexShrink = 0;
    rowItem.overrideWidth = width;
    rowItem.overrideHeight = height;
    const flex = row.createComponent(FlexLayout.getTypeName()) as FlexLayout;
    flex.autoDiscoverItemsOnStart = false;
    flex.width = width;
    flex.height = height;
    flex.direction = FlexDirection.Row;
    flex.alignItems = FlexAlign.Center;
    flex.justifyContent = FlexJustify.Center;
    flex.columnGap = this.gapCm;
    return row;
  }

  private findDescendant(obj: SceneObject, name: string): SceneObject | null {
    for (let i = 0; i < obj.getChildrenCount(); i++) {
      const c = obj.getChild(i);
      if (c.name === name) return c;
      const d = this.findDescendant(c, name);
      if (d) return d;
    }
    return null;
  }

  private addRow(parent: SceneObject, specs: ButtonSpec[]): FlexItem {
    const innerW = this.widthCm - this.paddingCm * 2;
    const row = global.scene.createSceneObject("Row");
    row.setParent(parent);
    row.getTransform().setLocalPosition(new vec3(0, 0, LAYOUT_Z_LIFT));
    const rowItem = row.createComponent(FlexItem.getTypeName()) as FlexItem;
    rowItem.flexShrink = 0;
    rowItem.overrideWidth = innerW;
    rowItem.overrideHeight = this.buttonHeightCm;
    const flex = row.createComponent(FlexLayout.getTypeName()) as FlexLayout;
    flex.autoDiscoverItemsOnStart = false;
    flex.width = innerW;
    flex.height = this.buttonHeightCm;
    flex.direction = FlexDirection.Row;
    flex.alignItems = FlexAlign.Center;
    flex.justifyContent = FlexJustify.Center;
    flex.columnGap = this.gapCm;
    const items: FlexItem[] = [];
    for (const spec of specs) items.push(this.addButton(row, spec, undefined, TOOL_BUTTON_WIDTH_CM));
    flex.addItems(items);
    return rowItem;
  }

  private addButton(parent: SceneObject, spec: ButtonSpec, onPress?: (so: SceneObject) => void, widthCm?: number): FlexItem {
    const sizeX = widthCm !== undefined ? widthCm : this.buttonWidthCm;
    const sizeY = this.buttonHeightCm;
    const so = global.scene.createSceneObject("Button_" + spec.id);
    so.setParent(parent);
    so.getTransform().setLocalPosition(new vec3(0, 0, LAYOUT_Z_LIFT));
    const btn = so.createComponent(Button.getTypeName()) as Button;
    btn.size = new vec3(sizeX, sizeY, 1);
    // Button defers its own configuration to init; re-apply the size there so it cannot be
    // reset to the default (specs-build-ui gotcha G2).
    btn.onInitialized.add(() => {
      btn.size = new vec3(sizeX, sizeY, 1);
    });
    if (spec.id === "guides") {
      btn.setIsToggleable(true);
      btn.isOn = true;
    }
    this.addButtonLabel(so, spec.label, sizeX - 0.5);
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem;
    item.flexShrink = 0;
    item.overrideWidth = sizeX;
    item.overrideHeight = sizeY;
    btn.onTriggerUp.add(() => (onPress ? onPress(so) : this._onAction.invoke(spec.id)));
    this.buttons[spec.id] = btn;
    return item;
  }

  private addButtonLabel(parent: SceneObject, text: string, widthCm: number): void {
    const so = global.scene.createSceneObject("ButtonLabel");
    so.setParent(parent);
    so.getTransform().setLocalPosition(new vec3(0, 0, BUTTON_LABEL_Z));
    const t = so.createComponent("Component.Text") as Text;
    t.text = text;
    t.depthTest = true;
    applyTextRole(t, "Button");
    t.horizontalAlignment = HorizontalAlignment.Center;
    t.verticalAlignment = VerticalAlignment.Center;
    t.horizontalOverflow = HorizontalOverflow.Overflow;
    t.verticalOverflow = VerticalOverflow.Overflow;
    t.layoutRect = Rect.create(-widthCm / 2, widthCm / 2, -1.2, 1.2);
  }
}
