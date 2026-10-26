# Policy experience QA

## Browser verification

Chromium regression was run against an isolated Anvaya server on `127.0.0.1:3100` with stale-server reuse disabled. The suite completed 12/12 tests: homepage, Explore, DPDP detail, Impact, Evidence Lab, mobile menu, reduced motion, research navigation, and QA dashboard.

The live development server on `127.0.0.1:3000` was separately audited after a stale Next asset-manifest incident was repaired. All primary routes returned visible content, zero failed requests, zero console errors, and no horizontal overflow.

## Policy matrix

| Policy class | Search/detail | Status distinction | Sources | AI | Result |
|---|---|---|---|---|---|
| DPDP verified record | Passed | Passed; partially commenced | Passed; 3 verified documents | Blocked by missing key | PASS with AI blocked |
| Seeded unverified records | Passed | Passed; unknown/unverified | Honest empty state | Blocked by missing key | PASS with evidence unavailable |
| Waqf research records | Research page passed | Candidate status remains provisional | Official PDF link and excerpts present | Blocked by missing key | PASS with review required |

## AI limitation

No `PORTKEY_API_KEY` or `OPENAI_API_KEY` is configured in the current environment. AI journeys are therefore BLOCKED, not marked passed. The frontend displays an understandable configuration error and preserves the deterministic legal/evidence content.
