# BLACKVEIL — Next Execution Handoff

Read `continuity/STATUS.md` first, then verify every branch, PR, issue and CI run against live GitHub state. This checkpoint is not proof that any open PR has merged.

## Immediate priorities

1. **Reproducible dependency installation (PR #7 / issue #3).**
   - The Vite 7.3.8 update and fail-closed npm audit gate pass CI, but `package-lock.json` remains a seven-day Actions artifact from run [45721774732](https://github.com/HexDrifter0/BLACKVEIL/actions/runs/45721774732), not a committed repository file.
   - Transfer the artifact into `chore/dependency-audit-report` if the available tools can do so without changing repository permissions. Then replace `npm install` with `npm ci`, update README development instructions and rerun audit, typecheck, build and Compose validation.
   - If artifact-to-GitHub file transfer is unavailable, state the exact limitation; do not claim a lockfile was committed. Keep issue #3 open.
   - `main` still uses Vite 7.2.2, so the high-severity remediation is not in the default branch.

2. **Coordinate Node 24 action updates.**
   - PR #10 upgrades checkout/setup-node actions, while PR #7 still uses v4. Avoid duplicate or conflicting edits; decide whether to port the compatible action versions into PR #7 and document the overlap. Do not merge either PR.

3. **Lazy-module runtime validation (PR #6 / issue #4).**
   - Test Academy, Operations, Auth, Profile, Mission Modules, Internet Intelligence and Audit Feed in a real browser, including loading/error recovery and narrow mobile layouts.
   - Do not close issue #4 based only on build and chunk-size CI.

4. **Atomic provider rate limiting (PR #11 / issue #9).**
   - The disposable PostgreSQL 16 regression workflow passed six-way concurrency, per-user isolation, invalid arguments, grants, retention cleanup and Deno type-check.
   - Review the SQL and Edge Function changes for correctness and keep the distinction explicit: this is disposable PostgreSQL validation, not a hosted Supabase migration or deployed Edge Function.
   - Do not apply a hosted migration or deploy without explicit owner approval.

5. **Cyber-range hardening (PR #2).**
   - Review Compose isolation, capability dropping, no-new-privileges, resource limits, pinned images and regression coverage. Keep vulnerable targets loopback-only and on an internal network.

6. **Continuity control plane (PR #1).**
   - Treat it as a foundation only. Review checkpoint/handoff behavior, retries, provider contracts, authentication, idempotency, auditability and failure recovery. No deployment is authorized.

## Execution discipline

- Inspect the current repository state before changing files; avoid duplicating work from open PRs.
- Work in a feature/fix branch and update a draft PR when changes are coherent.
- Run typecheck, build, relevant tests, dependency audit and Compose validation as applicable.
- Update `continuity/STATUS.md` and this handoff after meaningful changes, with commit hashes, CI run links, exact test results and remaining blockers.
- Never merge, deploy, publish, enable paid services, change permissions/secrets, or perform destructive actions without approval.
- Never describe CI-only tests as live production verification.
