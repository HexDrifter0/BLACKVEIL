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

## Security boundaries
- No stealth access, credential theft, persistence, lateral movement or actions against systems without explicit authorization.
- Remote devices must opt in by installing an agent, pairing with a short-lived code and approving each privileged task.
- Secrets never belong in frontend source control. Never expose Supabase service-role keys in a browser client.
- Training exercises should run in isolated, disposable environments.

See [SECURITY.md](./SECURITY.md) for the security model.

## Platform modules
BLACKVEIL is organized around operational work, with the Academy as a supporting learning path:

- **Overview** — workspace status and quick access.
- **Operations** — engagement planning, scope definition, notes and audit trail (implementation in progress).
- **Toolbox** — local-first utilities for network calculations, hashing, IOC extraction, log triage, Base64, JWT inspection, password-strength estimation, URL parsing and regular-expression testing.
- **Threat intelligence** — IOC enrichment, normalization, tagging and case context (planned integrations must be clearly labeled until connected).
- **Laboratories** — guided, isolated exercises and repeatable practice environments.
- **Devices** — consent-based agent pairing for capabilities that cannot safely run in a browser.
- **Academy** — structured courses that teach the technologies and security concepts used by the operational modules.

### Academy curriculum
The Academy currently contains **21 courses** across web development, programming, data, developer tooling, automation, DevOps, systems programming and cybersecurity: HTML5, CSS3, JavaScript, TypeScript, Python, C, C++, Rust, Java, SQL, Git/GitHub, Bash, PowerShell, Docker, digital fundamentals, networking, cybersecurity essentials, Linux, web security/OWASP, SOC/incident response and ethical penetration testing. Each course currently includes three lessons, theory, a guided practical exercise, a checkpoint and a final assessment. Progress is stored in the current browser; cross-device synchronization and executable browser IDE labs are not yet implemented.

### Execution model
Browser-only utilities must disclose their local processing limits. Network discovery, packet capture, endpoint inspection, vulnerability scanning and shell execution require a separately installed, permissioned agent or an isolated lab runtime; a website must never pretend that a browser-only action performed those tasks. Planned modules are not presented as operational capabilities.

The private completion certificate is planned at **€2.00 EUR**. Real payment is not enabled until Stripe Checkout, Supabase Auth, server-side progress verification and signed webhooks are configured. See [PAYMENTS.md](./PAYMENTS.md) and the SQL migration under `supabase/migrations`. The certificate is not an official academic qualification.
