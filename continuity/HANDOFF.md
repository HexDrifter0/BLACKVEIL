# BLACKVEIL — Next Execution Handoff

Read `continuity/STATUS.md` first, then verify every branch, PR and issue against live GitHub state. This handoff is a checkpoint, not proof that any open PR has merged.

## Immediate priorities

1. **Dependency reproducibility:** inspect PR #7 and its `npm-package-lock` Actions artifact. Find a safe way to commit the generated `package-lock.json` without changing repository permissions or introducing secrets. Then replace `npm install` with `npm ci` and rerun CI. If the available GitHub file interface cannot transfer the artifact, report that limitation and leave issue #3 open.
2. **Lazy-module runtime validation:** continue issue #4. Test navigation to Academy, Operations, Auth, Profile, Mission Modules, Internet Intelligence and Audit Feed, including loading/error recovery and narrow mobile layouts. Do not close the issue based only on a successful build.
3. **Atomic provider rate limiting:** investigate issue #9. Implement a transaction-safe per-user consume operation with a fixed search_path and service_role-only execution; handle audit persistence errors explicitly and define retention. Add a concurrency test (six parallel requests, at most five accepted). Do not claim SQL/runtime tests until a disposable local/test Supabase environment is available.
4. **Cyber-range hardening:** review PR #2's guard and Compose configuration for capability dropping, no-new-privileges, resource limits, pinned images and regression coverage. Keep all vulnerable targets loopback-only and on an internal network.
5. **Continuity control plane:** review PR #1 as a foundation only. Verify checkpoint/handoff behavior, retries, provider contracts, authentication, idempotency, auditability and failure recovery. No deployment is authorized.

## Execution discipline

- Inspect the current repository state before changing files; avoid duplicating work from open PRs.
- Work in a feature/fix branch and create/update a draft PR when changes are coherent.
- Run typecheck, build, relevant tests, dependency audit and Compose validation as applicable.
- Update `continuity/STATUS.md` and this handoff after meaningful changes, with commit hashes, CI run links, exact test results and remaining blockers.
- Never merge, deploy, publish, enable paid services, change permissions/secrets, or perform destructive actions without approval.
