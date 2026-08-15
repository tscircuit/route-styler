import { cju, type CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"

export type CircuitJson = AnyCircuitElement[]

export type RouteStylerStageName =
  | "removeDuplicateRoutePointsSolver"
  | "removeCollinearRoutePointsSolver"

export interface RouteStylerChange {
  stage: RouteStylerStageName
  pcbTraceId: string
  removedRoutePointCount: number
}

export interface RouteStylerContext {
  /** Immutable snapshot used for replay, debugging, and before/after views. */
  originalCircuitJson: CircuitJson
  /** Shared mutable working copy used by every pipeline stage. */
  circuitJson: CircuitJson
  /** Typed Circuit JSON query/update facade backed by circuitJson. */
  db: CircuitJsonUtilObjects
  changes: RouteStylerChange[]
}

export const cloneCircuitJson = (circuitJson: CircuitJson): CircuitJson =>
  structuredClone([...circuitJson])

export const createRouteStylerContext = (
  inputCircuitJson: CircuitJson,
): RouteStylerContext => {
  const originalCircuitJson = cloneCircuitJson(inputCircuitJson)
  const circuitJson = cloneCircuitJson(inputCircuitJson)

  return {
    originalCircuitJson,
    circuitJson,
    db: cju(circuitJson),
    changes: [],
  }
}
