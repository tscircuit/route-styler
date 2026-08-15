import { runAllChecks } from "@tscircuit/checks"
import type { CircuitJson } from "lib/context"

type DrcIssue = Awaited<ReturnType<typeof runAllChecks>>[number]

const getIssueFingerprint = (issue: DrcIssue): string => {
  const issueRecord = issue as unknown as Record<string, unknown>
  const idEntry = Object.entries(issueRecord).find(
    ([key, value]) =>
      (key.endsWith("_error_id") || key.endsWith("_warning_id")) &&
      typeof value === "string",
  )

  return JSON.stringify([
    issueRecord.type,
    issueRecord.error_type,
    issueRecord.warning_type,
    idEntry?.[1],
    issueRecord.message,
  ])
}

export const getDrcIssueFingerprints = async (
  circuitJson: CircuitJson,
): Promise<string[]> => {
  const issues = await runAllChecks(structuredClone(circuitJson))
  return issues.map(getIssueFingerprint).sort()
}

export const getIntroducedDrcIssueFingerprints = async (
  baseline: CircuitJson,
  candidate: CircuitJson,
): Promise<string[]> => {
  const baselineIssues = new Set(await getDrcIssueFingerprints(baseline))
  const candidateIssues = await getDrcIssueFingerprints(candidate)
  return candidateIssues.filter((issue) => !baselineIssues.has(issue))
}
