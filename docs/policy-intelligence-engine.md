# Policy intelligence engine

Anvaya exposes one policy-scoped API route, `POST /api/interpret`, with four modes:

- `research`: retrieves facts, events, and evidence gaps from the selected local register record.
- `explanation`: returns a short explanation, detailed explanation, why-proposed context, affected groups, status, uncertainty, and evidence references.
- `impact`: returns stakeholder groups with conditional benefits, costs, burdens, trade-offs, implementation challenges, and evidence gaps.
- `verification`: classifies claims as facts, projections, or interpretations and validates evidence IDs.

The route never sends the entire database to the model. It selects one `policySlug`, serializes only that record’s status, events, uncertainty, and sources, and wraps user/document text as untrusted data. Citation IDs are filtered against the selected record before the response is returned. A model response cannot write a status or event.

Responses are cached in process by policy, mode, question, and source set. Successful calls record model, provider, input/cached/output/total tokens, duration, and status in `data/logs/agent-executions.jsonl`. A failed call returns an error; it does not silently substitute a fabricated answer.
