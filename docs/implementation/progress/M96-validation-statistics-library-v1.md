# M96 — Validation statistics library v1

**Status:** complete for synthetic infrastructure; no study result generated

The isolated library provides MAE, RMSE, bias, sample Bland–Altman limits,
Pearson correlation, binary precision/recall/F1 and confusion counts,
multiclass confusion matrices, exact count accuracy, and ICC(2,1). Degenerate
inputs abstain or error explicitly. Bland–Altman and ICC results state their
assumptions. Tests use independently hand-calculated synthetic fixtures only.
