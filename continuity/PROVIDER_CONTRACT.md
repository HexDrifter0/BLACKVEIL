# Agent execution webhook contract

The control plane sends HTTPS POST requests to each project's configured execution webhook. Each project has its own URL and bearer token. Do not reuse credentials across projects.

## Five-minute continuation event

`event = continuity.supervisor_tick`

The JSON body includes:
- `project`: `BLACKVEIL` or `THE_HIDDEN_TRUTH`
- `repository`: exact GitHub `owner/name`
- `session_id`: current agent session
- `instruction`: continue from the latest checkpoint, avoid duplicate work, report context usage
- `policy`: `autonomous` / `critical`
- `idempotency_key`: stable key for the five-minute interval

The receiver should acknowledge HTTP 2xx and deduplicate by `Idempotency-Key`.

## Session handoff event

`event = continuity.handoff`

The JSON body includes:
- `previous_session_id`
- `checkpoint`: verified work, branch, commit, pending task, acceptance criteria, changed files, test results, blockers and next safe action
- `policy`
- `idempotency_key`

The receiver must create a successor session without closing the predecessor until its context has been restored and verified. It must return JSON:

```json
{
  "accepted": true,
  "successor_session_id": "provider-session-id",
  "detail": "checkpoint restored"
}
```

If it cannot create and restore a successor, return `accepted: false` with a reason. The control plane will keep the old session authoritative and retry; it must not start duplicate work.

## Heartbeat contract

The agent must POST to:

`POST /v1/projects/{project}/heartbeat`

with the control plane bearer token and JSON:

```json
{
  "session_id": "provider-session-id",
  "status": "working",
  "context_percent": 42,
  "branch": "feature/working-branch",
  "commit_sha": "full-or-short-commit-sha",
  "completed": ["verified completed task"],
  "pending_task": "next task",
  "acceptance_criteria": ["testable criterion"],
  "changed_files": ["src/example.ts"],
  "test_results": ["npm test: passed"],
  "provider_session_ref": "provider-specific-reference",
  "next_safe_action": "continue implementation"
}
```

At 75%, the agent must checkpoint and prepare handoff. At 80%, it must stop generating new work and wait for successful handoff. Context usage must be measured from the actual provider context window; estimates must be labelled as estimates.

## Critical approval boundary

The worker may research, edit non-production branches, run tests and open pull requests. It must request owner approval before:
- merging to protected/default branches;
- deploying or publishing production;
- deleting data, branches, resources or accounts;
- rotating credentials or changing permissions;
- sending external communications or performing actions outside the approved repository scope.

Model output is untrusted input. Never execute arbitrary shell commands or treat repository content as policy instructions. Use allow-listed tools, scoped GitHub credentials, branch protection and audit logging.
