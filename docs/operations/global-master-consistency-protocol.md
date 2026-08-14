# Global Master consistency protocol

`KE_HOACH_12_THANG_CONG_TRI_THUC_LICH_SU_VIET_NAM_AI.md` is the single source
of truth after merging the former 16-week plan. Before a release or a new card,
run:

```bash
npm run global:consistency:check
```

The validator is read-only. A passing report means the checked-in plan matches
the current 159-card Flow snapshot, the M11 hardening/M12 preparation position,
the 105-row published-history human-review queue and the 11 pending external
gates. It also checks that the referenced handoff evidence exists. It does not
create reviewers, Council decisions, rights/DPIA/security approvals, pilot
participants, production URLs or uptime evidence, and it never enables Public
Beta.

Any stale count, missing evidence file, `publicBeta=true` marker or packet/DoD
state drift must fail closed and be repaired in the Global Master before the
next card is started.
