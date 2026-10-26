# Anvaya policy inventory audit

Audited from the active SQLite database on 2026-10-25. Missing fields are intentionally reported as missing.

| ID | Policy / research record | Slug | Lifecycle | Evidence state | Events | Provisions | Public workflow |
|---:|---|---|---|---|---:|---:|---|
| 1 | Digital Personal Data Protection Act, 2023 | `dpdp-act-2023` | Partially commenced | Verified | 4 | 6 | Detail page works |
| 2 | Indian Statistical Institute Bill, 2026 | `indian-statistical-institute-bill-2026` | Unknown | Unverified; no sources | 0 | 0 | Detail page works with unavailable state |
| 3 | Securities Markets Code, 2025 | `securities-markets-code-2025` | Unknown | Unverified; no sources | 0 | 0 | Detail page works with unavailable state |
| 4 | MSME Development Amendment Bill, 2026 | `msme-development-amendment-bill-2026` | Unknown | Unverified; no sources | 0 | 0 | Detail page works with unavailable state |
| 5 | National Sports Governance Bill, 2025 | `national-sports-governance-bill-2025` | Unknown | Unverified; no sources | 0 | 0 | Detail page works with unavailable state |
| 6 | 2026 government draft policy — source pending | `government-draft-policy-2026-unverified` | Unknown | Unverified; no sources | 0 | 0 | Detail page works with unavailable state |
| 49 | Digital Personal Data | research record 2 | Unknown | Provisional; 1 retrieved document | candidate research record | 0 | Research result works |
| 50 | Digital Personal Data | research record 3 | Unknown | Provisional; 1 retrieved document | candidate research record | 0 | Research result works |
| 51 | Waqf | research record 6 | Unknown | Provisional; 1 retrieved document | candidate research record | 0 | Research result works |
| 52 | Waqf | research record 7 | Unknown | Provisional; 1 retrieved document | candidate research record | 0 | Research result works |

## Verified source inventory

The DPDP record has three linked verified official documents and 66 extracted excerpts. Its Act and Rules schedules are represented separately. The active economic dataset is the verified MoSPI CPI vintage; it is contextual and is not treated as a causal DPDP outcome.

The Waqf research jobs remain provisional. Their retrieved Sansad PDF is preserved, but candidate events are not promoted into the authoritative legislative status engine. The source document itself remains review-required.

## Research history

Seven jobs are present: two no-evidence amendment searches, two successful Digital Personal Data retrievals, and two successful Waqf retrievals plus one no-evidence Waqf-adjacent search. Repeated retrievals preserved the source identity rather than creating duplicate source files.

## Known gaps

- The public policy detail route is currently backed by the curated legislative fixture for the six seeded records; research-generated records are intentionally presented through `/research/[id]` and redirect from research slugs.
- No stakeholder analysis can execute without the approved AI configuration; the UI reports that dependency instead of fabricating results.
- No direct economic dataset is linked to the unverified policies.
