# Anvaya data sources

Audit date: 2026-10-24. The source domains below are the intended evidence hierarchy. During this implementation, DNS resolution failed for every listed domain, so no new official document was downloaded or represented as verified. The local fixture records that limitation explicitly.

| Source | Intended use | Access method investigated | Current reliability in Anvaya |
|---|---|---|---|
| Digital Sansad (`https://sansad.in`) | Bills, debates, parliamentary stages, official documents | HTTPS landing-page probe; no endpoint invented | Unavailable during audit; no verified import |
| India Code (`https://www.indiacode.nic.in`) | Acts and central legislation | HTTPS landing-page probe; document URL must be captured from the repository | Unavailable during audit; existing landing-page fixture is unverified |
| Gazette of India (`https://egazette.gov.in`) | Gazette notifications, assent/publication, commencement | HTTPS landing-page probe; no scraping or API assumption | Unavailable during audit; no verified import |
| MyGov India (`https://www.mygov.in`) | Public consultations and draft policies | HTTPS landing-page probe; official consultation page required | Unavailable during audit; no verified import |
| Supreme Court of India (`https://www.sci.gov.in`) | Court orders and judgments | HTTPS landing-page probe; case/order document required | Unavailable during audit; no judicial claim seeded |
| Open Government Data (`https://data.gov.in`) | Structured datasets and metadata | HTTPS landing-page probe; API key/API terms must be checked before use | Unavailable during audit; no endpoint invented |
| PRS Legislative Research (`https://prsindia.org`) | Secondary cross-check only | HTTPS landing-page probe; never used as proof of enactment | Unavailable during audit; no secondary claim seeded |

## Local import contract

`data/fixtures/legislative-records.ts` is a deliberately conservative offline register. It preserves source title, publisher, URL, verification status, locator, and last verification date. Candidate policy names supplied for the project are represented as `unknown`/`unverified` records when no official document is available; they are not evidence of introduction, passage, assent, or commencement.

The intended workflow is:

```text
source discovery → document retrieval → text extraction → policy matching
→ event extraction → evidence verification → database update → timeline refresh
```

The local importer implements the final database stages, deduplicates documents/events, records an `ingestion_runs` row, and records unsupported/conflicting changes for review. Live retrieval remains a documented limitation until a permitted, reachable source method is verified.
