# BLACKVEIL

**Cybersecurity command workspace** — BLACKVEIL is a tool-first platform for ethical hacking, security operations, defensive analysis, forensics, threat intelligence, development and controlled labs. The Academy is one module inside the platform; it is not the product's primary purpose.

## Operating profiles
- **Black Hat** — adversary-emulation learning in explicitly authorized labs only.
- **White Hat** — ethical assessment, scoped testing and evidence.
- **Red Hat** — offensive security workflows for approved engagements.
- **Blue Hat** — detection, hardening, monitoring and incident response.
- **Purple Hat** — collaborative validation between attack simulation and defense.

These profiles are workflow presets, not permission escalations. Every action remains subject to scope, authorization and audit.

## Stack
- React + TypeScript + Vite
- Supabase integration (optional; publishable key only in browser)
- Local-first utilities; remote endpoint access requires an installed, paired, consent-based agent.

## Development
```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key when a project is selected.

Vite development and preview servers bind to `127.0.0.1` by default. Only override the host to `0.0.0.0` on a trusted network when LAN access is intentionally required; never expose the development server publicly.

## Security boundaries
- No stealth access, credential theft, persistence, lateral movement or actions against systems without explicit authorization.
- Remote devices must opt in by installing an agent, pairing with a short-lived code and approving each privileged task.
- Secrets never belong in frontend source control. Never expose Supabase service-role keys in a browser client.
- Training exercises should run in isolated, disposable environments.

See [SECURITY.md](./SECURITY.md) for the security model. For account setup, provider callbacks, OAuth configuration and required deployment secrets, see [AUTH_SETUP.md](./AUTH_SETUP.md). For Internet data sources, active scan architecture and deployment boundaries, see [INTERNET_OPERATIONS.md](./INTERNET_OPERATIONS.md).

## Platform modules
BLACKVEIL is organized around operational work, with the Academy as a supporting learning path:

- **Overview** — workspace status and quick access.
- **Operations** — local engagement register with target, explicit authorization confirmation, scope boundaries, timestamps and saved records. It documents work; it does not launch scans.
- **Toolbox** — local-first utilities for network calculations, hashing, IOC extraction, log triage, Base64, JWT inspection, password-strength estimation, URL parsing and regular-expression testing.
- **Internet intelligence** — live public DNS, RDAP, Certificate Transparency and NVD lookups. Shodan, Censys and reputation feeds require server-side provider credentials.
- **Threat intelligence** — IOC extraction, a persistent local indicator register and on-demand RDAP context for IPs/domains.
- **Laboratories** — browser learning checkpoints plus a local Docker cyber range with OWASP Juice Shop, WebGoat, Kali tools and ZAP passive baseline. See [`labs/README.md`](./labs/README.md).
- **Devices** — agent control-plane requirements and status; real endpoint pairing is unavailable until the Linux/Windows agents and backend are deployed.
- **Academy** — structured courses that teach the technologies and security concepts used by the operational modules.

### Academy curriculum
The Academy currently contains **21 courses** across web development, programming, data, developer tooling, automation, DevOps, systems programming and cybersecurity: HTML5, CSS3, JavaScript, TypeScript, Python, C, C++, Rust, Java, SQL, Git/GitHub, Bash, PowerShell, Docker, digital fundamentals, networking, cybersecurity essentials, Linux, web security/OWASP, SOC/incident response and ethical penetration testing. Each course currently includes three lessons, theory, a guided practical exercise, a checkpoint and a final assessment. Progress is stored in the current browser; cross-device synchronization and executable browser IDE labs are not yet implemented.

### Local cyber range
The optional Docker range runs intentionally vulnerable OWASP targets on loopback-only host ports and an internal Docker network. Kali and ZAP tools are not exposed on host ports. Start-up, commands, safety boundaries and cleanup are documented in [`labs/README.md`](./labs/README.md). The range must not be deployed publicly.

### Execution model
Browser-only utilities must disclose their local processing limits. Network discovery, packet capture, endpoint inspection, vulnerability scanning and shell execution require a separately installed, permissioned agent or an isolated lab runtime; a website must never pretend that a browser-only action performed those tasks. Planned modules are not presented as operational capabilities.

The private completion certificate is planned at **€2.00 EUR**. Real payment is not enabled until Stripe Checkout, Supabase Auth, server-side progress verification and signed webhooks are configured. See [PAYMENTS.md](./PAYMENTS.md) and the SQL migration under `supabase/migrations`. The certificate is not an official academic qualification.

## Accounts and profiles

The application now includes Supabase Auth client flows for email/password, Google, Apple and GitHub, plus an operator profile stored in a row-level-security-protected `profiles` table. Real sign-in requires a dedicated Supabase project, the profile migration, enabled provider credentials in the Supabase dashboard and the two public build variables configured as GitHub Actions secrets. The UI does not provide simulated authentication. Sign in with ChatGPT is exposed only after an OpenAI-issued client and a secure backend start/callback flow are registered; see `AUTH_SETUP.md`.

## Backend and cloud workspace

BLACKVEIL uses a dedicated Supabase project for account profiles, authorized engagement records, IOC storage and audit events. See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for authentication/provider configuration, database security and deployment boundaries. A public-key environment template is available in [`.env.example`](./.env.example).

## Core workspace modules

The application includes local-first operational records for:
- **Asset inventory** — manually register domains, IPs, applications, servers and environments. Adding an asset does not scan it.
- **Case management** — track findings with severity, status and analyst summaries.
- **Vulnerability management** — maintain a local finding register with CVE references, affected assets, severity and remediation notes.
- **Reports** — export a Markdown snapshot of the locally recorded assets and cases.

These records currently live in the browser's local storage. They are not synchronized to Supabase, shared between users, or immutable evidence. Cloud persistence and authorization-aware team access remain planned work.
