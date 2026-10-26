# Economic data sources

## Integrated workflow

The first complete workflow uses the Ministry of Statistics and Programme Implementation (MoSPI) eSankhyiki Consumer Price Index API.

- Portal: https://esankhyiki.mospi.gov.in/macroindicators?product=cpi
- API: `https://api.mospi.gov.in/api/cpialrl/getCpialrlRecords`
- Request: `indicator_code=1`, `state_code=99`, `base_year=2019`, paged at 200 rows.
- Dataset: General Index, All India, base year 2019.
- Frequency: monthly.
- Metrics retained: all-India index, rural-plus-urban index, and the two published inflation fields.
- Raw response: `data/economic/raw/`; every imported vintage stores its SHA-256 and full payload in SQLite.

The API response included more than one returned base-year series. The normalization step therefore retains only rows whose returned `base_year` is exactly `2019`; it does not trust the request parameter alone. The imported current vintage contains 16 source rows and 64 normalized metric observations, covering 2025-06 through 2026-09 as returned by the source at retrieval time.

NPCI’s public product-statistics pages returned HTTP 403 during bounded verification and are not represented as integrated data. RBI’s DBIE frontend was reachable, but no stable machine-readable dataset endpoint was validated for this milestone. Neither source is replaced with invented values.
