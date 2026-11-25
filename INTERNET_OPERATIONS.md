# BLACKVEIL — Internet operations and integrations

## What is internet-connected today

The **Internet intelligence** workspace sends live requests from the browser to public data providers:

| Capability | Provider | Mode | Credentials |
|---|---|---|---|
| DNS A/AAAA/MX/TXT/NS/CNAME/CAA/SOA | Cloudflare DNS-over-HTTPS | Public lookup | No |
| IP/domain registration and allocation | RDAP bootstrap service | Public lookup | No |
| Certificate Transparency search | crt.sh | Public dataset lookup | No |
| CVE keyword search | NIST NVD API 2.0 | Public dataset lookup | No |

These lookups retrieve current information from external services. Provider availability, browser CORS policy, quotas and rate limits apply. A successful lookup is not a vulnerability verdict.

## Why some utilities remain local

Hashing files, Base64 conversion, regex testing, JWT decoding and password-strength estimation are intentionally local. Sending file contents, tokens or passwords to a third-party server would create an unnecessary data-exposure risk. Local execution is the correct security property for these functions, not a missing Internet feature.

Tools that need to contact a remote target (for example, HTTP assessment) must use a backend or an installed agent. A browser-only app cannot reliably inspect arbitrary remote services because of CORS, network isolation and browser security boundaries.

## Credentialed internet intelligence providers

The UI identifies the next provider integrations:

- **Shodan** — host/service banner lookups via the official API.
- **Censys** — host, service and certificate lookups via the official API.
- **VirusTotal / AbuseIPDB** — reputation context for IPs, domains, URLs and file hashes.

Do not put provider secrets in Vite variables or browser storage. These services must be called through an authenticated backend that keeps API credentials server-side, checks the signed-in user's permissions, applies provider quotas, and records audit events.

Official API documentation:
- Shodan: https://developer.shodan.io/api
- Censys: https://search.censys.io/api
- VirusTotal: https://docs.virustotal.com/reference/overview
- AbuseIPDB: https://docs.abuseipdb.com/

## Active Internet assessment

BLACKVEIL does not yet claim to run a remote Nmap/Nuclei/ZAP scan from GitHub Pages. A real active assessment engine requires a separately deployed worker (container/VM), not just a React component.

The planned worker must enforce all of the following before sending packets or HTTP requests:

1. A signed-in user and a server-validated Supabase access token.
2. A specific asset record owned by that user.
3. Explicit written authorization, an expiry, and an exact target allowlist.
4. DNS resolution and rejection of loopback, private, link-local, multicast and cloud metadata addresses.
5. A fixed, non-destructive scan profile, request/time limits, concurrency limits and cancellation.
6. A durable job/audit record, bounded output, and no arbitrary shell, template upload or user-supplied command execution.
7. No stealth, credential theft, persistence, destructive exploitation, denial-of-service or lateral movement.

### Scanner choices

- **OWASP ZAP Automation Framework** for authenticated web-application testing, with passive baseline checks first. Active scanning is only enabled for an explicitly authorized staging target and a reviewed policy.
- **Nuclei** for a curated allowlist of non-intrusive HTTP/TLS/DNS misconfiguration and exposure templates. Exclude fuzzing, brute force, DoS and intrusive/exploit templates; enforce a conservative rate limit.

Official references:
- ZAP Automation Framework: https://www.zaproxy.org/docs/automate/automation-framework/
- ZAP API and authorization warning: https://www.zaproxy.org/docs/api/
- Nuclei rate limits and template operation: https://github.com/projectdiscovery/nuclei-docs/blob/main/docs/nuclei/get-started.md

## Deployment prerequisites still outstanding

The GitHub Pages site is a static frontend. To make credentialed providers and active scans operational, BLACKVEIL still needs:

- A dedicated Supabase project selected and configured for authentication/database.
- Server-side secrets for each provider integration.
- A deployed API/worker service with HTTPS, authentication, rate limits and audit logs.
- A real enrollment flow for endpoint agents if local network/device inspection is required.

Until those are deployed, the UI must continue to label these integrations as requiring server configuration. Never present a placeholder or a successful frontend build as proof that an external integration is live.
