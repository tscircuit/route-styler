import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { RouteStylerPipelineSolver } from "lib/route-styler-pipeline-solver"
import { createRouteStylerExample } from "tests/fixtures/route-styler-example"

export default function RouteStylerPage() {
  return (
    <GenericSolverDebugger
      createSolver={() =>
        new RouteStylerPipelineSolver(createRouteStylerExample())
      }
    />
  )
}
