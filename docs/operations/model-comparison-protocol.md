# Model comparison handoff protocol

The current `artifacts/ai-eval/config-comparison.json` is a machine comparison
of two configurations in the same deterministic gateway. It is not evidence
that two independent models were compared. This packet exists for an authorised
AI owner to attach a real comparison later.

Run:

```bash
npm run ai:model-comparison:check
```

The manifest must contain exactly two distinct provider/model identities using
the canonical frozen 500-question dataset. Each comparison needs 500-question
metrics for accuracy, citation precision, refusal rate, injection leak rate,
latency and cost, plus an existing repository artifact and matching SHA-256.

The validator rejects same-model comparisons, dataset drift, missing metrics,
path traversal, artifact hash drift and secret/token values. A structurally
complete packet returns `PASS_COMPARISON_PACKET`, but it deliberately keeps
`officialModelIndependenceEvidence=false`, `releaseAllowed=false` and
`publicBeta=false`. The external-evidence ledger and a named authority must
still verify the real packet before the `model-comparison` gate can pass.
