# Wikimedia and partner rights handoff protocol

The Wikimedia importer and rights ledger provide metadata and a link-only
review queue; they do not grant permission to serve binary media. This handoff
validator binds the packet to the exact 300-row batch and rights ledger hashes,
requires two partner collection records and keeps every selected row
`LINK_ONLY` until a real rights reviewer and permission archive are supplied.

Run:

```bash
npm run rights:handoff:check
```

The checked-in example intentionally lacks hashes, reviewer and collections and
returns `BLOCKED_EXTERNAL`. A complete synthetic link-only packet returns
`PASS_RIGHTS_PACKET`, but `officialPartnerRights=false`, `approvedForBinary=0`,
`binaryServingEnabled=false`, `releaseAllowed=false` and `publicBeta=false`
remain immutable. The external evidence ledger must receive real permission or
MOU records before the `partner-rights` gate can pass.
