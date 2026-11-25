# BLACKVEIL security model

## Trust boundaries
1. Browser tools process user-supplied data locally unless a module explicitly states otherwise.
2. A browser client may contain only a Supabase publishable key (or legacy anon key). Never put a Supabase secret/service-role key in `.env.local` variables prefixed with `VITE_`.
3. Remote endpoint management is disabled until an endpoint agent is installed by the device owner, paired with a short-lived challenge, and explicitly authorized.
4. High-impact actions require a scoped approval, an audit record, and a revocation path.
5. Lab workloads must run in isolated, disposable environments with no implicit route to production networks.

## Authorization policy
- Only assess assets for which the operator has documented authorization.
- Every engagement must define target identifiers, allowed techniques, time window, and stop conditions.
- No stealth access, credential harvesting, persistence, evasion, or uncontrolled lateral movement.
- The five interface profiles are workflow presets. They do not grant additional permissions.

## Secrets and deployment
- Keep `.env.local` out of Git.
- Rotate any credential accidentally committed to source control.
- Enable RLS on every exposed Supabase table and write ownership-aware policies.
- Keep service-role credentials exclusively in trusted server-side environments.
- Review dependency updates and CI output before deployment.

## Verified repository implementation boundaries
The following describes what is represented in the repository source. A checked-in migration, configuration file, or integration is not by itself proof that the corresponding remote service is deployed or configured.

- **Browser utilities and records:** local-first tools and workspace records run in the browser. Asset, case, vulnerability and report data described in the product documentation are local browser data unless a module explicitly confirms cloud persistence.
- **Supabase:** the repository contains a browser client using a public publishable key, Auth/profile flows, owner-scoped schema migrations and RLS policies for profiles, engagements, threat indicators and audit events. Real provider sign-in, applied migrations, SMTP delivery and live database behavior must be verified against the selected Supabase project.
- **Internet intelligence:** passive DNS, RDAP, Certificate Transparency and NVD lookups call public providers from the browser. The repository also contains an authenticated `intel-enrichment` Edge Function for server-side provider APIs and a service-role-only rate-limit ledger. Provider access depends on the function being deployed and the relevant server-side secrets being configured. Never put provider secrets in the browser bundle.
- **Local cyber range:** `labs/docker-compose.yml` defines intentionally vulnerable Juice Shop and WebGoat targets bound to loopback, plus opt-in Kali and ZAP tools on an internal Docker network. This is a local training environment, not a production service. Never publish these ports or deploy the vulnerable targets publicly.
- **Not operational merely because UI or documentation exists:** endpoint agents, remote device orchestration, a production active-scanning worker, public cloud lab provisioning, immutable evidence storage, cross-device synchronization for browser-local workspace records and real certificate payments require separate implementation and end-to-end verification.

## Required lab isolation invariants
The local range must preserve all of the following:
- The Docker network used by lab services is marked `internal: true`.
- Only Juice Shop and WebGoat expose ports, and every published port binds to `127.0.0.1`.
- Kali and ZAP expose no host ports and remain behind the opt-in `tools` profile.
- Kali drops all Linux capabilities and adds only `NET_RAW`, enforces `no-new-privileges:true`, and mounts only `labs/workspace` at `/workspace`.
- No lab container runs in privileged mode, uses host networking or receives direct host device access.

The CI workflow runs `npm run check:lab` against Docker Compose's normalized configuration to detect regressions in these boundaries. This static guard complements, but does not replace, review of Docker, host and runtime security.

## Operational verification
- Confirm the Supabase project's RLS policies and provider configuration independently; do not infer live status from source files.
- Verify real authentication round-trips and profile ownership with test accounts before calling sign-in production-ready.
- Keep active scanning disabled until a separate worker enforces server-side authorization, exact target allowlists, DNS/SSRF controls, rate limits, resource limits and audit logging.
- Never expose intentionally vulnerable lab targets to a LAN or public network.
