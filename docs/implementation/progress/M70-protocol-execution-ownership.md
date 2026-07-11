# M70 — Protocol execution ownership and squat parity

**Status:** Complete (2026-07-11).

`ProtocolRuntime` now owns outcome semantics, session-result construction, and
the optional cyclic live engine. Camera, upload, offline analysis, and replay
route through the selected runtime; UI entry points no longer import squat FSM
operations directly. The contract admits transition protocols without forcing
them into `RepMetrics[]`.

Evidence: runtime, analysis, results, and replay parity tests pass, as does the
production build. Sit-to-stand negative tests confirm its planned definition has
no executable runtime.
