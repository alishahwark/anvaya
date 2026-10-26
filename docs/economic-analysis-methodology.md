# Economic analysis methodology

## Reproducible pipeline

Official API response → raw JSON retention → checksum → returned-base-year validation → All India filter → numeric validation → year/month normalization → SQLite vintage and observation records → deterministic statistics → Evidence Lab.

`npm run economic:import` runs the importer. For the verified raw response captured in this workspace, the reproducible command is:

```bash
MOSPI_RAW_FILE=data/economic/raw/mospi-cpi-api-base-2019.json npm run economic:import
```

Vintages are never silently overwritten. A new checksum creates a new vintage and marks the prior vintage non-current.

## Statistics

The implementation calculates count, minimum, maximum, arithmetic mean, median, first-to-last absolute change, first-to-last percentage change, and lagged period percentage change. A zero denominator returns `null`; it is never rendered as a misleading percentage. The Evidence Lab uses a 12-period lag for index observations and a one-period lag for the published inflation fields. Units remain attached to every observation.

This milestone is descriptive. It does not estimate a regression or causal effect. CPI is contextual evidence for policy research, not evidence that the DPDP Act caused an observed movement.

## Scenario analysis

The DPDP compliance calculator is a transparent arithmetic scenario: initial expenditure plus annual recurring expenditure multiplied by the selected projection period. The optional shared-resource reduction changes only the user-entered recurring assumption. It is clearly labeled illustrative and is not an observed or official economic impact estimate.
