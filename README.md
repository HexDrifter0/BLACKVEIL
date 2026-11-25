# BLACKVEIL

**Security operations workspace** — a modular cybersecurity platform for authorized assessment, defensive monitoring, incident response, threat intelligence and isolated training labs.

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

## BLACKVEIL Academy
The Academy currently includes eight progressive courses (foundation to professional): digital fundamentals, networking, cybersecurity essentials, Linux, Python automation, web security/OWASP, SOC/incident response, and ethical penetration testing. Each course includes lessons, guided exercises and a final assessment. Local progress is stored in the current browser.

The private completion certificate is planned at **€2.00 EUR**. Real payment is not enabled until Stripe Checkout, Supabase Auth, server-side progress verification and signed webhooks are configured. See [PAYMENTS.md](./PAYMENTS.md) and the SQL migration under `supabase/migrations`. The certificate is not an official academic qualification.
