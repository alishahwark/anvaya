# Built-in QA checklist

The checklist registry lives in `lib/qa/checklist.ts` and is persisted in SQLite by migration `0004_qa.sql`. New records begin as `NOT_TESTED`; only actual automated runs or explicit manual submissions can change them.

The dashboard is development/submission tooling at `/internal/qa`. It is not linked from the public navigation. In production, access is disabled unless `ANVAYA_QA_ENABLED=true`.

Automated checks use a fixed allowlist: typecheck, unit tests, Playwright tests, production build, database/source counts, and required submission files. The API does not accept arbitrary commands.
