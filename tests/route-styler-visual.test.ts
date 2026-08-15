import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { beautifyCircuitJson } from "../lib"
import { createRouteStylerExample } from "./fixtures/route-styler-example"

test("route beautifier PCB before and after", async () => {
  const input = createRouteStylerExample()
  const output = beautifyCircuitJson(input)

  await expect(
    convertCircuitJsonToPcbSvg(input, { includeVersion: false }),
  ).toMatchSvgSnapshot(import.meta.path, "before")
  await expect(
    convertCircuitJsonToPcbSvg(output, { includeVersion: false }),
  ).toMatchSvgSnapshot(import.meta.path, "after")
})
