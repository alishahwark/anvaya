# Anvaya benchmarks

This folder contains a 20-question DPDP benchmark fixture. `dpdp-questions.json` separates blocked document-dependent gold answers from manually checked safety/gap expectations. Run `npm run benchmark:run` while Anvaya is running to write raw API outputs and latency/citation measurements. Results are ignored until the gold answers are completed from imported official documents.
