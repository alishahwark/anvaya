# DPDP case-study walkthrough

## Current state of the local case

The inbox contains and the database has imported three authentic local PDFs: the Act (21 pages), G.S.R. 843(E) (2 pages), and G.S.R. 846(E) Rules (41 pages). Their SHA-256 identities and expected markers were checked; all three source records are verified. The importer created 64 page excerpts. The December 2025 Rules corrigendum is missing and remains an explicit evidence gap.

The Act assent event and Group A partial-commencement event were approved through the existing review command. The policy is therefore `partially_commenced`, not wholly in force. Six provision schedule rows are recorded: three Act groups and three separate Rules groups.

## Demonstrable workflow

```bash
npm run db:migrate
npm run db:seed
npm run data:import:files
npm run dev
```

Open `/policies/dpdp-act-2023`. The page shows the Act identifier as pending verification, an unverified timeline, provision commencement groups, the source state, stakeholder impact explorer, and policy-scoped Ask Anvaya.

When official files are present:

1. Add each original PDF and sidecar to `data/source-inbox/`.
2. Run `npm run data:import:files`.
3. Inspect the extracted file hash, pages, excerpts, and pending review row.
4. Verify the source with `npm run data:verify:source -- --document-id <id>` only after manual inspection.
5. Create/review a candidate event and approve it with `npm run data:approve:event -- --event-id <id>`.
6. For the checked-in DPDP case, the registration command is `npm run data:register:dpdp`; re-run the app and inspect the updated timeline.

The model agents retrieve a ranked subset of indexed page excerpts (not the entire database), explain the selected local record, and produce conditional impact analysis. Citation IDs are checked deterministically; semantic support remains conservative and requires review. Agents cannot change the deterministic status or commencement engine.

## Actual live-agent evidence

The live explanation smoke test used Portkey/gpt-6-luna and returned structured JSON with three verified source citations. One measured run used 5,706 input, 0 cached-input, and 1,300 output tokens (7,006 total) in 9,683 ms. The API reported valid citation IDs and `requires_semantic_agent_review`; this is not presented as an automatic semantic guarantee.
