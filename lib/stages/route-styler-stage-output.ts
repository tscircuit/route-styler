import { cloneCircuitJson, type CircuitJson } from "../context"

export interface RouteStylerStageOutput {
  circuitJson: CircuitJson
  changedTraceIds: string[]
  removedRoutePointCount: number
}

export const createRouteStylerStageOutput = (
  circuitJson: CircuitJson,
  changedTraceIds: string[],
  removedRoutePointCount: number,
): RouteStylerStageOutput => ({
  circuitJson: cloneCircuitJson(circuitJson),
  changedTraceIds: [...changedTraceIds],
  removedRoutePointCount,
})
