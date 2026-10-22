// Registers the Scape Planner LEAF scenarios, one per done criterion in devpost/design-brief.md.
import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator";
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata";
import { ScapePlannerTankGuidesScenario } from "./ScapePlannerTankGuidesScenario";
import { ScapePlannerPlaceStoneScenario } from "./ScapePlannerPlaceStoneScenario";
import { ScapePlannerFocalPointScenario } from "./ScapePlannerFocalPointScenario";
import { ScapePlannerOddCountScenario } from "./ScapePlannerOddCountScenario";
import { ScapePlannerUndoClearScenario } from "./ScapePlannerUndoClearScenario";
import { ScapePlannerReachScenario } from "./ScapePlannerReachScenario";

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
  ];
}
