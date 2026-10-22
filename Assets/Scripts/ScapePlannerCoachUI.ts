// Scape Planner: the coach card. Five composition checks, each a coloured
// dot and a short message. It sits beside the tank and speaks up (title
// highlight) for a few seconds after a piece is placed or moved.

import { FlexLayout } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import { FlexItem } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import { FlexAlign, FlexDirection, FlexJustify, FlexAlignSelf } from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";
import { BackPlate } from "SpectaclesUIKit.lspkg/Scripts/BackPlate";
import { Billboard } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard";
import { CheckState } from "./ScapePlannerRules";

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

const LAYOUT_Z_LIFT = 0.02;
const ROW_COUNT = 5;
const ROW_TITLES = ["Focal point", "Odd count", "Front gap", "Height", "Plant zones"];

@component
export class ScapePlannerCoachUI extends BaseScriptComponent {
  @ui.label("Panel")
  @input
  @hint("Panel width in cm")
  widthCm: number = 34;
  @input
  @hint("Padding inside the panel in cm")
  paddingCm: number = 1.4;
  @input
  @hint("Gap between rows in cm")
  gapCm: number = 0.7;
  @input
  @hint("Title shown at the top")
  titleText: string = "Coach";
  @input
  @hint("Seconds the title stays highlighted after a change")
  speakUpSeconds: number = 4;
  @input
  @hint("Turn the card toward the user")
  faceUser: boolean = true;

  @ui.label("Colours")
  @input
  okColor: vec4 = new vec4(0.35, 0.92, 0.5, 1);
  @input
  warnColor: vec4 = new vec4(1.0, 0.72, 0.2, 1);
  @input
  neutralColor: vec4 = new vec4(0.62, 0.66, 0.72, 1);
  @input
  textColor: vec4 = new vec4(0.95, 0.97, 1.0, 1);

  private titleTextComp!: Text;
  private dots: Text[] = [];
  private messages: Text[] = [];
  private titles: Text[] = [];
  private speakTimer!: DelayedCallbackEvent;

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
    flex.alignItems = FlexAlign.Stretch;
    flex.justifyContent = FlexJustify.Start;
    flex.rowGap = this.gapCm;
    flex.paddingTop = this.paddingCm;
    flex.paddingBottom = this.paddingCm;
    flex.paddingLeft = this.paddingCm;
    flex.paddingRight = this.paddingCm;
    flex.onLayoutComplete.add((r) => {
      backPlate.size = new vec2(r.containerWidth, r.containerHeight);
    });

    const items: FlexItem[] = [];
    items.push(this.addHeader(content));
    for (let i = 0; i < ROW_COUNT; i++) {
      items.push(this.addRow(content, i));
    }
    flex.addItems(items);

    this.speakTimer = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent;
    this.speakTimer.bind(() => this.setTitleHighlight(false));
  }

  /** Update one check row. index 0..4 in the order of ScapePlannerRules.evaluateLayout. */
  setCheck(index: number, state: CheckState, message: string): void {
    if (index < 0 || index >= this.dots.length) return;
    this.dots[index].textFill.color = this.colorFor(state);
    this.messages[index].text = message;
  }

  /** Highlight the title for speakUpSeconds, as the card speaking up after a change. */
  speakUp(): void {
    this.setTitleHighlight(true);
    if (this.speakTimer) this.speakTimer.reset(this.speakUpSeconds);
  }

  private colorFor(state: CheckState): vec4 {
    if (state === "ok") return this.okColor;
    if (state === "warn") return this.warnColor;
    return this.neutralColor;
  }

  private setTitleHighlight(on: boolean): void {
    if (!this.titleTextComp) return;
    this.titleTextComp.textFill.color = on ? this.okColor : this.textColor;
    this.titleTextComp.text = on ? this.titleText + "  checked" : this.titleText;
  }

  private makeText(parent: SceneObject, name: string, text: string, role: TextRole, widthCm: number, heightCm: number, align: HorizontalAlignment): Text {
    const so = global.scene.createSceneObject(name);
    so.setParent(parent);
    so.getTransform().setLocalPosition(new vec3(0, 0, LAYOUT_Z_LIFT));
    const t = so.createComponent("Component.Text") as Text;
    t.text = text;
    t.depthTest = true;
    applyTextRole(t, role);
    t.textFill.color = this.textColor;
    t.horizontalAlignment = align;
    t.verticalAlignment = VerticalAlignment.Center;
    t.horizontalOverflow = HorizontalOverflow.Overflow;
    t.verticalOverflow = VerticalOverflow.Overflow;
    t.layoutRect = Rect.create(-widthCm / 2, widthCm / 2, -heightCm / 2, heightCm / 2);
    return t;
  }

  private addHeader(parent: SceneObject): FlexItem {
    const innerW = this.widthCm - this.paddingCm * 2;
    const h = 2.6;
    this.titleTextComp = this.makeText(parent, "Header", this.titleText, "Headline2", innerW, h, HorizontalAlignment.Center);
    const item = this.titleTextComp.getSceneObject().createComponent(FlexItem.getTypeName()) as FlexItem;
    item.flexShrink = 0;
    item.overrideWidth = innerW;
    item.overrideHeight = h;
    item.marginBottom = 0.4;
    item.alignSelf = FlexAlignSelf.Stretch;
    return item;
  }

  private addRow(parent: SceneObject, index: number): FlexItem {
    const innerW = this.widthCm - this.paddingCm * 2;
    const rowH = 3.2;
    const row = global.scene.createSceneObject("Row_" + index);
    row.setParent(parent);
    row.getTransform().setLocalPosition(new vec3(0, 0, LAYOUT_Z_LIFT));
    const rowItem = row.createComponent(FlexItem.getTypeName()) as FlexItem;
    rowItem.flexShrink = 0;
    rowItem.overrideWidth = innerW;
    rowItem.overrideHeight = rowH;

    const flex = row.createComponent(FlexLayout.getTypeName()) as FlexLayout;

    flex.autoDiscoverItemsOnStart = false; // items are added programmatically below
    flex.width = innerW;
    flex.height = rowH;
    flex.direction = FlexDirection.Row;
    flex.alignItems = FlexAlign.Center;
    flex.justifyContent = FlexJustify.Start;
    flex.columnGap = 0.6;

    const dotW = 2.2;
    const textW = innerW - dotW - 0.6;
    const dot = this.makeText(row, "Dot", "●", "Headline1", dotW, rowH, HorizontalAlignment.Center);
    dot.textFill.color = this.neutralColor;
    const dotItem = dot.getSceneObject().createComponent(FlexItem.getTypeName()) as FlexItem;
    dotItem.flexShrink = 0;
    dotItem.overrideWidth = dotW;
    dotItem.overrideHeight = rowH;

    const textCol = global.scene.createSceneObject("TextCol");
    textCol.setParent(row);
    const colItem = textCol.createComponent(FlexItem.getTypeName()) as FlexItem;
    colItem.flexShrink = 0;
    colItem.overrideWidth = textW;
    colItem.overrideHeight = rowH;
    const colFlex = textCol.createComponent(FlexLayout.getTypeName()) as FlexLayout;
    colFlex.autoDiscoverItemsOnStart = false; // items are added programmatically below
    colFlex.width = textW;
    colFlex.height = rowH;
    colFlex.direction = FlexDirection.Column;
    colFlex.alignItems = FlexAlign.Start;
    colFlex.justifyContent = FlexJustify.Center;
    colFlex.rowGap = 0.1;

    const title = this.makeText(textCol, "Title", ROW_TITLES[index], "Caption", textW, 1.3, HorizontalAlignment.Left);
    const titleItem = title.getSceneObject().createComponent(FlexItem.getTypeName()) as FlexItem;
    titleItem.flexShrink = 0;
    titleItem.overrideWidth = textW;
    titleItem.overrideHeight = 1.3;
    const msg = this.makeText(textCol, "Message", "", "Body", textW, 1.8, HorizontalAlignment.Left);
    const msgItem = msg.getSceneObject().createComponent(FlexItem.getTypeName()) as FlexItem;
    msgItem.flexShrink = 0;
    msgItem.overrideWidth = textW;
    msgItem.overrideHeight = 1.8;
    colFlex.addItems([titleItem, msgItem]);

    flex.addItems([dotItem, colItem]);

    this.dots.push(dot);
    this.titles.push(title);
    this.messages.push(msg);
    return rowItem;
  }
}
