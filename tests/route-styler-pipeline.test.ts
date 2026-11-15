import { describe, expect, test } from "bun:test"
import {
  beautifyCircuitJson,
  RouteStylerPipelineSolver,
  type RouteStylerStageOutput,
  type RouteStylerStageName,
} from "../lib"
import {
  getDrcIssueFingerprints,
  getIntroducedDrcIssueFingerprints,
} from "./fixtures/assert-no-new-drc-issues"
import { createRouteStylerExample } from "./fixtures/route-styler-example"

describe("RouteStylerPipelineSolver", () => {
  test("shares a circuit-json-util db and does not mutate its input", () => {
    const input = createRouteStylerExample()
    const inputSnapshot = structuredClone(input)
    const solver = new RouteStylerPipelineSolver(input)

    expect(solver.context.db.toArray()).toBe(solver.context.circuitJson)
    expect(solver.context.db.pcb_trace.list()).toHaveLength(1)

    solver.solve()

    expect(input).toEqual(inputSnapshot)
    expect(solver.solved).toBe(true)
    expect(solver.failed).toBe(false)
    expect(solver.getOutput()).toEqual(solver.context.circuitJson)
    expect(Object.keys(solver.getOutput())).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
    ])
  })

  test("removes duplicate and collinear route points in separate stages", () => {
    const solver = new RouteStylerPipelineSolver(createRouteStylerExample())
    solver.solve()

    const outputTrace = solver
      .getOutput()
      .find((element) => element.type === "pcb_trace")

    expect(outputTrace?.route).toEqual([
      {
        route_type: "wire",
        x: -4,
        y: -1,
        width: 0.2,
        layer: "top",
        start_pcb_port_id: "pcb_port_0",
      },
      { route_type: "wire", x: 0, y: -1, width: 0.2, layer: "top" },
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
      { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "top" },
      {
        route_type: "wire",
        x: 4,
        y: 2,
        width: 0.2,
        layer: "top",
        end_pcb_port_id: "pcb_port_1",
      },
    ])
    expect(solver.context.changes).toEqual([
      {
        stage: "removeDuplicateRoutePointsSolver",
        pcbTraceId: "pcb_trace_0",
        removedRoutePointCount: 1,
      },
      {
        stage: "removeCollinearRoutePointsSolver",
        pcbTraceId: "pcb_trace_0",
        removedRoutePointCount: 2,
      },
    ])

    const duplicateStageOutput = solver.getStageOutput<RouteStylerStageOutput>(
      "removeDuplicateRoutePointsSolver",
    )
    const collinearStageOutput = solver.getStageOutput<RouteStylerStageOutput>(
      "removeCollinearRoutePointsSolver",
    )
    expect(
      duplicateStageOutput?.circuitJson.find(
        (element) => element.type === "pcb_trace",
      )?.route,
    ).toHaveLength(7)
    expect(
      collinearStageOutput?.circuitJson.find(
        (element) => element.type === "pcb_trace",
      )?.route,
    ).toHaveLength(5)
  })

  test("is idempotent", () => {
    const once = beautifyCircuitJson(createRouteStylerExample())
    const twice = beautifyCircuitJson(once)

    expect(twice).toEqual(once)
  })

  test("skips pcb_trace entries that omit route instead of throwing", () => {
    const unrouted = {
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_unrouted",
    } as const
    const circuitJson = [
      {
        type: "pcb_board",
        pcb_board_id: "pcb_board_0",
        center: { x: 0, y: 0 },
        width: 12,
        height: 8,
        thickness: 1.6,
        num_layers: 2,
        material: "fr4",
      },
      unrouted,
    ] as Parameters<typeof beautifyCircuitJson>[0]

    const solver = new RouteStylerPipelineSolver(circuitJson)
    expect(() => solver.initialVisualize()).not.toThrow()
    expect(() => solver.solve()).not.toThrow()
    expect(solver.solved).toBe(true)
    expect(solver.failed).toBe(false)
    expect(() => solver.finalVisualize()).not.toThrow()

    const output = beautifyCircuitJson(circuitJson)
    expect(
      output.find((element) => element.type === "pcb_trace"),
    ).toMatchObject({
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_unrouted",
    })
    expect(
      output.find((element) => element.type === "pcb_trace"),
    ).not.toHaveProperty("route")
  })

  test("introduces no new tscircuit/checks issues after any stage", async () => {
    const input = createRouteStylerExample()
    const solver = new RouteStylerPipelineSolver(input)
    const stageNames = solver.pipelineDef.map(
      (stage) => stage.solverName as RouteStylerStageName,
    )

    expect(await getDrcIssueFingerprints(input)).toEqual([])

    for (const stageName of stageNames) {
      while (solver.getCurrentStageName() === stageName) solver.step()

      const stageOutput = solver.getStageOutput<{ circuitJson: typeof input }>(
        stageName,
      )
      expect(stageOutput).toBeDefined()
      expect(
        await getIntroducedDrcIssueFingerprints(
          input,
          stageOutput!.circuitJson,
        ),
      ).toEqual([])
    }

    solver.step()
    expect(solver.solved).toBe(true)
  })
})
