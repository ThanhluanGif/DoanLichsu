# DPIA và Child/Privacy Controls v1.0

Status: `DRAFT_PENDING_PRIVACY_REVIEW`  
Owner: Security/Privacy lead  
Last reviewed: 2026-08-13

## Purpose and risk

The service supports learners, including minors. The year-1 pilot is no-account by
default. We do not ask for name, school, phone, precise location, birth date or sensitive
identity. AI is internal alpha only; free-form public AI for young children is disabled.

## Controls

- Data minimization: question text is processed transiently; no default model training.
- Retention: raw prompts/transcripts are deleted within 30 days unless a safety/legal
  hold is documented; retain aggregate, de-identified metrics only.
- Access: role-based operators, least privilege, audit log, no reporter identity in public
  changelog; secrets never enter artifacts.
- Rights: deletion/correction requests have an owner and target of three business days;
  safety/rights incidents are triaged within one business day.
- Child safety: guided prompts, no public account/chat, no targeted profiling, escalation
  to teacher/guardian/operator, and an emergency disable switch for AI.
- Incident response: detect, disable affected feature, preserve minimal evidence, notify
  responsible owner, assess harm, remediate and record closure.

This document is a working DPIA and requires a real privacy review before public AI.
