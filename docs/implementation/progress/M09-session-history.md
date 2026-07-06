# M9 — Local session history

## What changed

Local-only, opt-in session persistence per `08_..._Specification.md` §9
(local-first flavor only — no backend entities, no sync) and the history /
longitudinal information architecture in `11_Product_Experience_Bible.md`.

- **`web/src/storage/sessionStore.ts`** (new): versioned record
  `{ id, schemaVersion, protocolId, timestamp, result, provenance }` with
  `SESSION_STORE_SCHEMA_VERSION = 1`. Two adapters behind one `SessionStore`
  interface: IndexedDB (db `kinematiciq`, store `sessions`) and in-memory (for
  tests / browsers without IndexedDB — `getSessionStore()` picks at runtime).
  `list()` skips records whose schema version this build does not understand.
  Provenance is inherited from the session's metric results when present,
  otherwise defaults to a live capture.
- **`web/src/storage/historyView.ts`** (new): pure view model.
  `buildHistoryRows` maps stored sessions to display rows;
  `historyObservation` emits at most one hedged, observation-language sentence
  comparing the two most recent same-protocol non-invalid sessions (avg bottom
  depth direction, or trusted-rep counts when depth abstained). Explicitly not
  a trend claim; invalid sets contribute no longitudinal evidence.
- **`web/src/screens/HistoryScreen.tsx`** (new) + `/history` route in
  `App.tsx` + nav link in `AppShell.tsx`. Shows saved sessions, the single
  observation line, an empty state, and a confirm-gated **delete-all** control
  (privacy requirement).
- **`web/src/screens/ResultsScreen.tsx`**: explicit "Save to history" button
  (never silent persistence); success copy states data stays in this browser.
- **`web/src/index.css`**: history list styles.

## Acceptance checks

- Persist across reload: IndexedDB adapter; sessions survive page reloads.
- Delete-all control: present on HistoryScreen behind a confirm.
- No network calls: storage module touches only `indexedDB` / memory.
- Deep link `/history`: covered by the existing catch-all rewrite in
  `vercel.json` (`/((?!assets/).*)` → `/index.html`) — no config change needed.

## Decisions / deferrals

- `SessionResult.baseline` (`SessionBaseline`) remains **null**: the plan says
  baseline population "may" happen; the current one-sentence comparison lives
  in the history view instead of mutating analysis output. Populating
  `baseline` from history is deferred until a consumer needs it inside the
  report itself.
- Legacy `SetMetricsSummary` is stored as part of the whole `SessionResult`
  (plan's open question): kept as a stable serialization surface, versioned by
  `schemaVersion`, so old saved sessions stay readable if the live shape moves.
- IndexedDB code paths are not exercised in vitest (jsdom has no IndexedDB);
  tests cover the shared logic (record building, ordering, version skipping,
  view model) through the memory adapter.

## Tests

- Before: 42 files / 231 tests. After: 43 files / 239 tests. Build + tests green.
