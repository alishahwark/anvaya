# Economic benchmark results

Ten source-value checks were independently compared against the retained MoSPI base-year-2019 JSON response and the normalized SQLite vintage. All ten matched exactly at the source precision (10/10; 100%). The checked fields were:

| Period | Index all India | Index rural + urban | Inflation all India | Inflation rural + urban |
|---|---:|---:|---:|---:|
| 2026-09 | 144.82 | 144.58 | 6.30 | 5.98 |
| 2026-08 | 143.40 | 143.20 | 5.18 | 4.83 |
| 2026-07 | 141.65 | 141.46 | 4.68 | 4.27 |
| 2026-06 | 140.06 | 139.92 | 4.46 | 4.13 |
| 2026-05 | 138.52 | 138.37 | 4.08 | 3.71 |
| 2026-04 | 137.30 | 137.22 | 3.39 | 3.11 |
| 2026-03 | 136.99 | 136.95 | 3.18 | 2.92 |
| 2026-02 | 136.57 | 136.51 | 2.57 | 2.37 |
| 2026-01 | 137.07 | 136.90 | 1.61 | 1.47 |
| 2025-12 | 137.12 | 137.03 | 0.04 | 0.11 |

The checks validate imported source values, not causal claims. Deterministic edge cases for zero denominators and scenario arithmetic are covered in `tests/economic.test.ts`.
