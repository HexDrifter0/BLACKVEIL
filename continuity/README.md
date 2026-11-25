# Autonomous Continuity Control Plane

Private operational control plane for BLACKVEIL and THE HIDDEN TRUTH. This directory is intentionally isolated from the public application runtime.

## Fixed policy

- Autonomy: `autonomous` for research, implementation, tests, documentation and work on non-production branches.
- Approval: `critical`. Production deployment/publication, destructive or irreversible operations, secret rotation, permission changes, external-system actions outside the configured scope, and data deletion must pause for owner approval.
- Supervisor interval: 300 seconds.
- Context handoff: create a checkpoint at 75%; hard-stop new work at 80% until a successor session is ready.
- Projects remain isolated: separate provider credentials, GitHub tokens, state namespaces, logs and session histories.

## Hybrid provider topology

The control plane supports two provider adapters:
- `openai`: OpenAI Responses API, configured with a project-specific API key and model.
- `webhook`: an existing agent runtime exposed through an authenticated HTTPS endpoint.

The intended initial mapping is BLACKVEIL -> OpenAI and THE HIDDEN TRUTH -> existing-agent webhook. The webhook endpoint and credentials for THE HIDDEN TRUTH are deliberately not guessed; they must be supplied by the owner. Both adapters must implement the same handoff contract. An OpenAI model response alone is not a repository executor: autonomous code changes require a separately configured, scoped GitHub-capable execution worker. Until that worker is connected, the control plane can monitor, checkpoint and dispatch work but cannot claim to have edited either project.

## Persistence and continuity

PostgreSQL stores project configuration, active session IDs, checkpoints, last heartbeat, run leases and audit events. A checkpoint contains:
- project and repository identity;
- current branch and commit SHA;
- completed work and verified evidence;
- pending task and acceptance criteria;
- changed files and test results;
- last provider response/session reference;
- next safe action and approval blockers.

On handoff, the supervisor atomically records the checkpoint, requests a successor session from the provider adapter, verifies acknowledgement, then marks the predecessor as superseded. If acknowledgement fails, the predecessor remains authoritative and the project is marked `handoff_pending`; work is not silently duplicated.

## Required environment

See `.env.example`. Never commit real secrets. Render service secrets must be set in the dashboard. Use a dedicated least-privilege GitHub token per repository, restricted to contents/pull requests/actions as required. Do not use a personal broad-scope token.

## Local run

```bash
cd continuity
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill DATABASE_URL and CONTINUITY_API_TOKEN; configure provider secrets.
uvicorn app:app --host 0.0.0.0 --port 8000
```

The service refuses to start its supervisor without a persistent PostgreSQL `DATABASE_URL` and a strong API token. It is not production-ready until migrations, provider endpoints, GitHub execution workers, health checks and alert delivery have been validated.

## Render

Deploy as a continuously running web service (not a five-minute cron job). Configure a paid always-on instance if continuous availability is required; free web services can sleep. Attach a persistent PostgreSQL database in the same region (Frankfurt preferred for this workspace). Do not deploy production project applications from this control plane.

## Security controls

- No arbitrary shell execution from model output.
- No direct production deployment or merge-to-main.
- No secret values in prompts, checkpoints or logs.
- HTTPS-only provider webhooks with bearer authentication.
- Idempotency keys and per-project run leases prevent duplicate dispatch.
- Every state transition is auditable.
- Unknown provider, stale heartbeat, missing approval or failed handoff => fail closed.
