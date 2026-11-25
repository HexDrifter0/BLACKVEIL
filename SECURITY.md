# BLACKVEIL security model

## Trust boundaries
1. Browser tools process user-supplied data locally unless a module explicitly states otherwise.
2. A browser client may contain only a Supabase publishable key (or legacy anon key). Never put a service-role or secret key in `.env.local` variables prefixed with `VITE_`.
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

## Current implementation status
The initial dashboard and four local browser utilities are implemented. Device agents, remote orchestration, threat feeds, persistent audit storage, and isolated lab provisioning are not yet connected. The UI must not represent these as operational until integration and verification are complete.
