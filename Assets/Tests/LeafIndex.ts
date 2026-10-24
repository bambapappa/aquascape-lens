// Registers the Scape Planner LEAF scenarios, one per done criterion in devpost/design-brief.md.
import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import { ScapePlannerTankGuidesScenario } from "./ScapePlannerTankGuidesScenario";
import { ScapePlannerPlaceStoneScenario } from "./ScapePlannerPlaceStoneScenario";
import { ScapePlannerFocalPointScenario } from "./ScapePlannerFocalPointScenario";
import { ScapePlannerOddCountScenario } from "./ScapePlannerOddCountScenario";
import { ScapePlannerUndoClearScenario } from "./ScapePlannerUndoClearScenario";
import { ScapePlannerReachScenario } from "./ScapePlannerReachScenario";
import { ScapePlannerStyleAnglesScenario } from "./ScapePlannerStyleAnglesScenario";
import { ScapePlannerTabsTankScenario } from "./ScapePlannerTabsTankScenario";
import { ScapePlannerDemoScenario } from "./ScapePlannerDemoScenario";
import { ScapePlannerV4Scenario } from "./ScapePlannerV4Scenario";
import { ScapePlannerAdaScenario } from "./ScapePlannerAdaScenario";
import { ScapePlannerGreenAquaScenario } from "./ScapePlannerGreenAquaScenario";

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    { id: "scape-1-tank-and-guides", typename: ScapePlannerTankGuidesScenario.getTypeName() },
    { id: "scape-2-place-and-drag-stone", typename: ScapePlannerPlaceStoneScenario.getTypeName() },
    { id: "scape-3-focal-point", typename: ScapePlannerFocalPointScenario.getTypeName() },
    { id: "scape-4-odd-count", typename: ScapePlannerOddCountScenario.getTypeName() },
    { id: "scape-5-undo-clear", typename: ScapePlannerUndoClearScenario.getTypeName() },
    { id: "scape-6-reach-ik", typename: ScapePlannerReachScenario.getTypeName() },
    { id: "scape-7-style-and-angles", typename: ScapePlannerStyleAnglesScenario.getTypeName() },
    { id: "scape-8-tabs-and-tank-sizes", typename: ScapePlannerTabsTankScenario.getTypeName() },
    { id: "scape-10-v4-substrate-carpet-moss", typename: ScapePlannerV4Scenario.getTypeName() },
    { id: "scape-11-ada-60p-iwagumi", typename: ScapePlannerAdaScenario.getTypeName() },
    { id: "scape-12-greenaqua-120p-jungle", typename: ScapePlannerGreenAquaScenario.getTypeName() },
    { id: "scape-9-demo", typename: ScapePlannerDemoScenario.getTypeName() },
  ];
}
