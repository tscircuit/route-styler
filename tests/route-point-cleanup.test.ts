import { describe, expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import {
  removeConsecutiveDuplicateWirePoints,
  removeRedundantCollinearWirePoints,
} from "../lib"

const wire = (
  x: number,
  y: number,
  overrides: Partial<Extract<PcbTraceRoutePoint, { route_type: "wire" }>> = {},
): Extract<PcbTraceRoutePoint, { route_type: "wire" }> => ({
  route_type: "wire",
  x,
  y,
  width: 0.2,
  layer: "top",
  ...overrides,
})

describe("route point cleanup safety", () => {
  test("only removes duplicate wire points with identical style and metadata", () => {
    const route: PcbTraceRoutePoint[] = [
      wire(0, 0),
      wire(0, 0),
      wire(0, 0, { width: 0.3 }),
      wire(0, 0, { start_pcb_port_id: "pcb_port_0" }),
    ]

    const cleanup = removeConsecutiveDuplicateWirePoints(route)

    expect(cleanup.removedRoutePointCount).toBe(1)
    expect(cleanup.route).toEqual([route[0]!, route[2]!, route[3]!])
  })

  test("keeps annotated, width-changing, layer-changing, and bent points", () => {
    const annotatedMiddle = wire(1, 0, {
      end_pcb_port_id: "pcb_port_0",
    })
    const route: PcbTraceRoutePoint[] = [
      wire(0, 0),
      annotatedMiddle,
      wire(2, 0),
      wire(3, 0, { width: 0.3 }),
      wire(4, 0, { layer: "bottom" }),
      wire(5, 1, { layer: "bottom" }),
    ]

    const cleanup = removeRedundantCollinearWirePoints(route)

    expect(cleanup.removedRoutePointCount).toBe(0)
    expect(cleanup.route).toEqual(route)
  })

  test("collapses repeated exact-collinear points to their endpoints", () => {
    const route: PcbTraceRoutePoint[] = [
      wire(0, 0),
      wire(1, 1),
      wire(2, 2),
      wire(3, 3),
    ]

    const cleanup = removeRedundantCollinearWirePoints(route)

    expect(cleanup.removedRoutePointCount).toBe(2)
    expect(cleanup.route).toEqual([route[0]!, route[3]!])
  })
})
