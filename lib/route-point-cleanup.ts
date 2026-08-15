import type { PcbTraceRoutePoint, PcbTraceRoutePointWire } from "circuit-json"

export interface RouteCleanupResult {
  route: PcbTraceRoutePoint[]
  removedRoutePointCount: number
}

const isWirePoint = (
  point: PcbTraceRoutePoint,
): point is PcbTraceRoutePointWire => point.route_type === "wire"

const wirePointsAreIdentical = (
  a: PcbTraceRoutePointWire,
  b: PcbTraceRoutePointWire,
): boolean =>
  a.x === b.x &&
  a.y === b.y &&
  a.width === b.width &&
  a.layer === b.layer &&
  a.copper_pour_id === b.copper_pour_id &&
  a.is_inside_copper_pour === b.is_inside_copper_pour &&
  a.start_pcb_port_id === b.start_pcb_port_id &&
  a.end_pcb_port_id === b.end_pcb_port_id

const wireStylesMatch = (
  a: PcbTraceRoutePointWire,
  b: PcbTraceRoutePointWire,
): boolean =>
  a.width === b.width &&
  a.layer === b.layer &&
  a.copper_pour_id === b.copper_pour_id &&
  a.is_inside_copper_pour === b.is_inside_copper_pour

const isExactlyCollinearAndBetween = (
  a: PcbTraceRoutePointWire,
  b: PcbTraceRoutePointWire,
  c: PcbTraceRoutePointWire,
): boolean => {
  const abX = b.x - a.x
  const abY = b.y - a.y
  const acX = c.x - a.x
  const acY = c.y - a.y
  const crossProduct = abX * acY - abY * acX
  if (crossProduct !== 0) return false

  const baX = a.x - b.x
  const baY = a.y - b.y
  const bcX = c.x - b.x
  const bcY = c.y - b.y
  return baX * bcX + baY * bcY <= 0
}

export const removeConsecutiveDuplicateWirePoints = (
  route: PcbTraceRoutePoint[],
): RouteCleanupResult => {
  const cleanedRoute: PcbTraceRoutePoint[] = []
  let removedRoutePointCount = 0

  for (const point of route) {
    const previousPoint = cleanedRoute.at(-1)
    if (
      previousPoint &&
      isWirePoint(previousPoint) &&
      isWirePoint(point) &&
      wirePointsAreIdentical(previousPoint, point)
    ) {
      removedRoutePointCount += 1
      continue
    }

    cleanedRoute.push(point)
  }

  return { route: cleanedRoute, removedRoutePointCount }
}

const canRemoveCollinearMiddlePoint = (
  a: PcbTraceRoutePoint,
  b: PcbTraceRoutePoint,
  c: PcbTraceRoutePoint,
): boolean => {
  if (!isWirePoint(a) || !isWirePoint(b) || !isWirePoint(c)) return false
  if (b.start_pcb_port_id || b.end_pcb_port_id) return false
  if (!wireStylesMatch(a, b) || !wireStylesMatch(b, c)) return false
  return isExactlyCollinearAndBetween(a, b, c)
}

export const removeRedundantCollinearWirePoints = (
  route: PcbTraceRoutePoint[],
): RouteCleanupResult => {
  const cleanedRoute: PcbTraceRoutePoint[] = []
  let removedRoutePointCount = 0

  for (const point of route) {
    cleanedRoute.push(point)

    while (cleanedRoute.length >= 3) {
      const a = cleanedRoute.at(-3)!
      const b = cleanedRoute.at(-2)!
      const c = cleanedRoute.at(-1)!
      if (!canRemoveCollinearMiddlePoint(a, b, c)) break

      cleanedRoute.splice(cleanedRoute.length - 2, 1)
      removedRoutePointCount += 1
    }
  }

  return { route: cleanedRoute, removedRoutePointCount }
}
