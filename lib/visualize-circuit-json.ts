import type { PcbTraceRoutePoint } from "circuit-json"
import type { GraphicsObject } from "graphics-debug"
import type { CircuitJson } from "./context"

const hasPoint = (
  point: PcbTraceRoutePoint,
): point is Exclude<PcbTraceRoutePoint, { route_type: "through_pad" }> =>
  point.route_type === "wire" || point.route_type === "via"

export const visualizeCircuitJson = (
  circuitJson: CircuitJson,
  title: string,
): GraphicsObject => {
  const traces = circuitJson.filter((element) => element.type === "pcb_trace")

  return {
    title,
    coordinateSystem: "cartesian",
    lines: traces.flatMap((trace) => {
      const route = trace.route ?? []
      return route.slice(1).flatMap((point, index) => {
        const previousPoint = route[index]!
        if (!hasPoint(previousPoint) || !hasPoint(point)) return []

        return [
          {
            points: [
              { x: previousPoint.x, y: previousPoint.y },
              { x: point.x, y: point.y },
            ],
            strokeColor: "#2563eb",
            strokeWidth: point.route_type === "wire" ? point.width : undefined,
            label: trace.pcb_trace_id,
          },
        ]
      })
    }),
    points: traces.flatMap((trace) =>
      (trace.route ?? []).flatMap((point) =>
        hasPoint(point)
          ? [
              {
                x: point.x,
                y: point.y,
                color: point.route_type === "via" ? "#dc2626" : "#1d4ed8",
              },
            ]
          : [],
      ),
    ),
    rects: [],
    circles: [],
  }
}
