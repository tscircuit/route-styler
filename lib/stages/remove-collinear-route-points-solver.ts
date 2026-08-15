import { BaseSolver } from "@tscircuit/solver-utils"
import type { PcbTrace } from "circuit-json"
import type { GraphicsObject } from "graphics-debug"
import type { RouteStylerContext } from "../context"
import { removeRedundantCollinearWirePoints } from "../route-point-cleanup"
import { visualizeCircuitJson } from "../visualize-circuit-json"
import {
  createRouteStylerStageOutput,
  type RouteStylerStageOutput,
} from "./route-styler-stage-output"

export class RemoveCollinearRoutePointsSolver extends BaseSolver {
  private readonly traces: PcbTrace[]
  private readonly changedTraceIds: string[] = []
  private nextTraceIndex = 0
  private removedRoutePointCount = 0

  constructor(public readonly context: RouteStylerContext) {
    super()
    this.traces = context.db.pcb_trace.list()
    this.MAX_ITERATIONS = this.traces.length + 1
  }

  override _step(): void {
    const trace = this.traces[this.nextTraceIndex]
    if (!trace) {
      this.solved = true
      return
    }

    const cleanup = removeRedundantCollinearWirePoints(trace.route)
    if (cleanup.removedRoutePointCount > 0) {
      this.context.db.pcb_trace.update(trace.pcb_trace_id, {
        route: cleanup.route,
      })
      this.changedTraceIds.push(trace.pcb_trace_id)
      this.removedRoutePointCount += cleanup.removedRoutePointCount
      this.context.changes.push({
        stage: "removeCollinearRoutePointsSolver",
        pcbTraceId: trace.pcb_trace_id,
        removedRoutePointCount: cleanup.removedRoutePointCount,
      })
    }

    this.nextTraceIndex += 1
    this.stats = {
      processedTraceCount: this.nextTraceIndex,
      changedTraceCount: this.changedTraceIds.length,
      removedRoutePointCount: this.removedRoutePointCount,
    }
  }

  computeProgress(): number {
    return this.traces.length === 0
      ? 1
      : this.nextTraceIndex / this.traces.length
  }

  override getConstructorParams(): [RouteStylerContext] {
    return [this.context]
  }

  override getOutput(): RouteStylerStageOutput {
    return createRouteStylerStageOutput(
      this.context.circuitJson,
      this.changedTraceIds,
      this.removedRoutePointCount,
    )
  }

  override visualize(): GraphicsObject {
    return visualizeCircuitJson(
      this.context.circuitJson,
      `Remove collinear route points · ${this.removedRoutePointCount} removed`,
    )
  }
}
