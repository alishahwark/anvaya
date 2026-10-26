# Legislative status model

Anvaya treats lifecycle stages as distinct events, not synonyms:

```text
proposed → introduced → under_consideration → passed_parliament
         → presidential_assent → in_force
```

Additional terminal or partial states are `withdrawn`, `rejected`, `lapsed`, `partially_commenced`, and `unknown`.

Rules enforced by `lib/policy-status/engine.ts`:

- An unverified or conflicting event cannot change the current status.
- Presidential assent does not imply that every provision is in force.
- `partially_commenced` is only reachable after assent/partial commencement evidence.
- `in_force` is only reachable after assent or partial commencement evidence.
- Withdrawal, rejection, and lapse are only accepted from pre-assent consideration states.
- A court challenge is stored in `judicial_developments`; it does not alter legislative status or create a stay unless a verified court event says so.
- Unknown remains unknown when current information is missing.

The normalized database stores policies, source documents, dated legislative events, versions/amendments, individual provisions, judicial developments, ingestion runs, and manual review items separately. The AI route can explain records but cannot write status changes; only the importer/status engine can update the register.

The source inbox importer records possible document/event associations as pending review. It does not approve extracted events automatically. Multiple commencement dates belong in `policy_provisions`, one row per provision, rather than collapsing them into the Act-level status.
