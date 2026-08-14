# AI golden-set human review protocol v2

The 500-question AI evaluation is a frozen machine result, not a human approval.
`npm run ai:eval:dataset` and `scripts/ai-human-review-ledger.mjs` preserve the
dataset/report hashes so reviewers judge the same result.

## Required reviewer record

Each of the two independent reviewers must provide:

- an identity that is not the other reviewer on the same row;
- one allowed role: `HISTORIAN`, `CURRICULUM`, `AI_SAFETY` or `COUNCIL`;
- an authority scope explaining why that person may review the row;
- an evidence reference to the review note, source comparison or decision record;
- an ISO-8601 UTC timestamp and one verdict: `APPROVE`, `REJECT` or `ABSTAIN`.

An approval without all five fields is rejected by the validator. The generator
never invents identities, roles, signatures, timestamps or evidence references.

## Conflicts and release rule

Different reviewer verdicts set `conflict=OPEN` and cannot count as approval until
the Council process records a valid resolution. The machine release gate requires
500 rows with two distinct `APPROVE` verdicts, no violations and no unresolved
conflicts. Run `node scripts/ai-human-review-ledger.mjs --validate` for structural
validation and `--require-approved` only in a release review after real evidence
has been attached. A clean pending ledger is expected before human review and does
not enable Public Beta.
