# Source import instructions

This is the offline, permitted import workflow for government PDFs and HTML.

1. Manually download an official document from a reachable government website.
2. Put the original file in `data/source-inbox/`.
3. Add a sidecar with the same filename plus `.json` and include the original URL, issuer, publication date, exact title, source type, and `policySlug` when known.
4. Run:

```bash
npm run db:migrate
npm run db:seed
npm run data:import:files
```

The importer computes SHA-256, stores the original metadata, extracts searchable HTML text or PDF text using `pdftotext` when available (with `pdf-parse` fallback), records page count/quality, and creates a human review item. It is idempotent by file hash and creates page-linked excerpts. If PDF extraction is unavailable, the file is retained with `extraction_quality=unavailable` and no legal event is created.

## Approval rule

Import does not verify legal claims. A reviewer must inspect the local file, confirm the excerpt and page, mark the source document verified, and then approve a proposed event through the status engine. An unverified title, URL, filename, or model output can never promote a policy status.

The DPDP case currently has three local files: the Act PDF, G.S.R. 843(E) commencement notification, and G.S.R. 846(E) Rules. They were identity-checked and marked verified after review. A December 2025 corrigendum is not in the inbox and must be added and reviewed before calling the Rules consolidated. The workflow remains runnable when files are missing.

For this case, after import and source review, register candidate rows with `npm run data:register:dpdp`. This does not approve status. Approve only source-supported candidates with `npm run data:approve:event -- --event-id <id>`.
