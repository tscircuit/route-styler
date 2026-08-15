# @tscircuit/route-styler

A non-mutating Circuit JSON beautifier built as a
`@tscircuit/solver-utils` pipeline. Each stage owns one styling concern and is
required to preserve the design's DRC baseline.

## Usage

```ts
import { beautifyCircuitJson } from "@tscircuit/route-styler"

const cleanedCircuitJson = beautifyCircuitJson(circuitJson)
```

Use the solver directly to step through stages or inspect their output:

```ts
import { RouteStylerPipelineSolver } from "@tscircuit/route-styler"

const solver = new RouteStylerPipelineSolver(circuitJson)
solver.solve()

console.log(solver.getStageStats())
console.log(solver.context.changes)
const cleanedCircuitJson = solver.getOutput()
```

The input array is cloned before any stage runs. The shared context exposes a
Circuit JSON utility database backed by that working copy:

```ts
interface RouteStylerContext {
  originalCircuitJson: AnyCircuitElement[]
  circuitJson: AnyCircuitElement[]
  db: CircuitJsonUtilObjects
  changes: RouteStylerChange[]
}
```

Stages query and update `context.db`, so they share one typed working model
without passing ad-hoc maps between solvers.

## Pipeline

1. `RemoveDuplicateRoutePointsSolver` removes consecutive, exactly identical
   wire points.
2. `RemoveCollinearRoutePointsSolver` removes unannotated middle points from
   exactly collinear, same-width, same-layer wire runs.

Both transformations preserve the physical copper path. New stages should
target one styling issue, record their edits in `context.changes`, and include
both a per-stage DRC regression assertion and an SVG snapshot.

## Development

```sh
bun install
bun test
bun run typecheck
bun run format:check
bun run start
```

Tests use `@tscircuit/checks` after every completed stage to prove no new DRC
issues were introduced. PCB visuals are checked with `bun-match-svg` and
`toMatchSvgSnapshot`.

## License

MIT
