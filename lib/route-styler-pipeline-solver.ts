import {
  BasePipelineSolver,
  BaseSolver,
  definePipelineStep,
  type PipelineStep,
} from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import {
  cloneCircuitJson,
  createRouteStylerContext,
  type CircuitJson,
  type RouteStylerContext,
} from "./context"
import { RemoveCollinearRoutePointsSolver } from "./stages/remove-collinear-route-points-solver"
import { RemoveDuplicateRoutePointsSolver } from "./stages/remove-duplicate-route-points-solver"
import { visualizeCircuitJson } from "./visualize-circuit-json"

export class RouteStylerPipelineSolver extends BasePipelineSolver<CircuitJson> {
  readonly context: RouteStylerContext

  pipelineDef: PipelineStep<BaseSolver>[] = [
    definePipelineStep<
      RemoveDuplicateRoutePointsSolver,
      RouteStylerContext,
      RouteStylerPipelineSolver
    >(
      "removeDuplicateRoutePointsSolver",
      RemoveDuplicateRoutePointsSolver,
      (pipeline) => [pipeline.context],
    ),
    definePipelineStep<
      RemoveCollinearRoutePointsSolver,
      RouteStylerContext,
      RouteStylerPipelineSolver
    >(
      "removeCollinearRoutePointsSolver",
      RemoveCollinearRoutePointsSolver,
      (pipeline) => [pipeline.context],
    ),
  ]

  constructor(inputCircuitJson: CircuitJson) {
    const context = createRouteStylerContext(inputCircuitJson)
    super(context.circuitJson)
    this.context = context
  }

  override getConstructorParams(): [CircuitJson] {
    return [cloneCircuitJson(this.context.originalCircuitJson)]
  }

  override getOutput(): CircuitJson {
    if (!this.solved) {
      throw new Error("RouteStylerPipelineSolver has not completed")
    }

    return cloneCircuitJson(this.context.circuitJson)
  }

  override initialVisualize(): GraphicsObject {
    return visualizeCircuitJson(
      this.context.originalCircuitJson,
      "Route styler input",
    )
  }

  override finalVisualize(): GraphicsObject {
    return visualizeCircuitJson(
      this.context.circuitJson,
      `Route styler output · ${this.context.changes.length} trace edits`,
    )
  }
}

export const beautifyCircuitJson = (circuitJson: CircuitJson): CircuitJson => {
  const solver = new RouteStylerPipelineSolver(circuitJson)
  solver.solve()
  return solver.getOutput()
}
