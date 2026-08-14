# Production handoff check

- Status: **BLOCKED_EXTERNAL**
- Release allowed: **NO**
- Official production evidence: **NO**
- Errors: 24
- Secret values accepted: **NO**

- origin:REQUIRES_OFFICIAL_HTTPS_URL
- releaseCommit:INVALID_GIT_SHA
- imageDigest:INVALID_IMAGE_DIGEST
- criticalRoutes:MUST_INCLUDE_SIX_REQUIRED_ROUTES
- deploymentRecord.artifact:MISSING_ARTIFACT
- deploymentRecord.sha256:INVALID_SHA256
- rollback.ref:MISSING_ROLLBACK_REF
- rollback.artifact:MISSING_ARTIFACT
- rollback.sha256:INVALID_SHA256
- database.strategy:MISSING_DATABASE_STRATEGY
- database.backupArtifact:MISSING_ARTIFACT
- database.restoreArtifact:MISSING_ARTIFACT
- monitoring.provider:MISSING_MONITORING_PROVIDER
- monitoring.artifact:MISSING_ARTIFACT
- monitoring.sha256:INVALID_SHA256
- owner.name:MISSING_NAMED_OWNER_FIELD
- owner.organization:MISSING_NAMED_OWNER_FIELD
- owner.contact:MISSING_NAMED_OWNER_FIELD
- onCall.name:MISSING_NAMED_OWNER_FIELD
- onCall.escalation:MISSING_NAMED_OWNER_FIELD
- onCall.rotaArtifact:MISSING_NAMED_OWNER_FIELD
- rpoMinutes:MUST_BE_POSITIVE_INTEGER
- rtoMinutes:MUST_BE_POSITIVE_INTEGER
- secretNames:MUST_LIST_NAMES_ONLY

This validator checks handoff packet structure only; it is not official production evidence or Public Beta approval.
