/**
 * Claims-policy automated copy audit (M38).
 *
 * Scans the copy-bearing source modules for forbidden claim language
 * (docs/doctrine/claims-policy.md "Forbidden conclusions"). This is a
 * GUARDRAIL against unsafe language landing in user-facing strings — a
 * heuristic text scan, not a parser and not a full legal/clinical review.
 *
 * Rules:
 * - Comments are stripped first (comments are not user-facing copy).
 * - A line with a forbidden phrase passes only if the line also matches a
 *   negation context ("not measured", "never", "forbids", ...) — copy may
 *   name a forbidden concept strictly to say it is not claimed (e.g. the
 *   metric-registry exclusion reasons).
 * - Test files are excluded (they intentionally contain forbidden strings).
 * - Immutable research docs are NOT scanned — they are sources, not copy.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DOCUMENTED_EXCEPTIONS,
  FORBIDDEN_PHRASES,
  NEGATION_CONTEXT_PATTERNS,
} from './claimsForbiddenTerms'

/** Directories under web/src that carry user-facing copy. */
const COPY_DIRECTORIES = [
  'feedback',
  'findings',
  'coaching',
  'screens',
  'components',
  'session',
  'export',
  'storage',
  'scoring',
  'metrics',
  'cv',
]

const SRC_ROOT = join(__dirname, '..')

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full))
      continue
    }
    const isSource = /\.(ts|tsx)$/.test(entry)
    const isTest = /\.test\.(ts|tsx)$/.test(entry)
    if (isSource && !isTest) files.push(full)
  }
  return files
}

/**
 * Strip comments so doctrine references in comments don't trip the audit.
 * Heuristic: block comments, then line comments. URLs in strings
 * ("https://...") lose their tails — that can only hide text, never flag it,
 * which is the safe failure direction for this guardrail.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

interface Violation {
  file: string
  line: number
  phrase: string
  policy: string
  text: string
}

function isDocumentedException(relPath: string, phrase: string): boolean {
  return DOCUMENTED_EXCEPTIONS.some(
    (ex) => relPath.includes(ex.pathIncludes) && ex.phrase === phrase,
  )
}

function auditFile(fullPath: string): Violation[] {
  const relPath = relative(SRC_ROOT, fullPath).replace(/\\/g, '/')
  const lines = stripComments(readFileSync(fullPath, 'utf8')).split('\n')
  const violations: Violation[] = []
  lines.forEach((line, index) => {
    const lower = line.toLowerCase()
    for (const { phrase, policy } of FORBIDDEN_PHRASES) {
      if (!lower.includes(phrase)) continue
      if (NEGATION_CONTEXT_PATTERNS.some((pattern) => pattern.test(line))) continue
      if (isDocumentedException(relPath, phrase)) continue
      violations.push({
        file: relPath,
        line: index + 1,
        phrase,
        policy,
        text: line.trim().slice(0, 160),
      })
    }
  })
  return violations
}

describe('claims-policy copy audit', () => {
  const files = COPY_DIRECTORIES.flatMap((dir) =>
    listSourceFiles(join(SRC_ROOT, dir)),
  )

  it('scans a meaningful set of copy modules', () => {
    // Guard against the audit silently going blind (e.g. renamed folders).
    expect(files.length).toBeGreaterThan(30)
  })

  it('finds no forbidden claim language in user-facing copy modules', () => {
    const violations = files.flatMap(auditFile)
    const report = violations
      .map(
        (v) =>
          `${v.file}:${v.line} — "${v.phrase}" (${v.policy})\n    ${v.text}`,
      )
      .join('\n')
    expect(
      violations,
      `Forbidden claim language found — fix the copy or, only if it is a ` +
        `genuine not-measured/not-claimed statement, add a same-line negation ` +
        `or a documented exception in claimsForbiddenTerms.ts:\n${report}`,
    ).toEqual([])
  })

  it('allows exclusion copy that names forbidden concepts as not-claimed', () => {
    // The metric registry documents WHY kinetics are excluded — that copy
    // must keep passing (roadmap requirement: safe exclusions still pass).
    const squatMetrics = readFileSync(
      join(SRC_ROOT, 'metrics', 'squatMetrics.ts'),
      'utf8',
    )
    expect(squatMetrics).toMatch(/not defensible/i)
    // And the audit as a whole passes over that file (covered above), so the
    // negation-context rule is doing its job rather than the file being skipped.
    expect(auditFile(join(SRC_ROOT, 'metrics', 'squatMetrics.ts'))).toEqual([])
  })

  it('would catch an affirmative forbidden claim (self-test)', () => {
    // Feed the matcher a synthetic bad line to prove the audit can fail.
    const bad = 'label: "Your knee shows high injury risk this set"'
    const lower = bad.toLowerCase()
    const hit = FORBIDDEN_PHRASES.some(
      ({ phrase }) =>
        lower.includes(phrase) &&
        !NEGATION_CONTEXT_PATTERNS.some((p) => p.test(bad)),
    )
    expect(hit).toBe(true)
  })
})
