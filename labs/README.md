# BLACKVEIL — Local Cyber Range

This kit creates a **deliberately vulnerable, local-only training environment**. It is separate from the public BLACKVEIL website and does not give the website remote access to your computer.

## Included targets and tools

| Component | Purpose | Local address |
|---|---|---|
| OWASP Juice Shop | Vulnerable web application for web security exercises | http://localhost:3000 |
| OWASP WebGoat | Guided lessons for common application weaknesses | http://localhost:8080/WebGoat |
| WebWolf | Companion application used by selected WebGoat lessons | http://localhost:9090/WebWolf |
| Kali tool container | Nmap, Nikto, SQLmap, curl, DNS tools, jq and common utilities | No host port exposed |
| OWASP ZAP | Passive baseline web assessment | No host port exposed |

The Docker network is marked `internal: true`. Target ports are published on `127.0.0.1` only, not on your LAN interface. The tools container has no published ports and receives only the raw-socket capability needed by Nmap.

## Requirements

- Docker Desktop or Docker Engine with the Compose plugin.
- At least 6 GB of free RAM recommended.
- Internet access for the first image pull/build only.

## Start the vulnerable targets

Run these commands from the repository root:

```bash
docker compose -f labs/docker-compose.yml up -d juice-shop webgoat
docker compose -f labs/docker-compose.yml ps
```

Open:

- Juice Shop: http://localhost:3000
- WebGoat: http://localhost:8080/WebGoat
- WebWolf: http://localhost:9090/WebWolf

These targets are intentionally vulnerable. Do not expose their ports through your router, reverse proxy, tunnel, public cloud or a non-loopback interface.

## Start the analysis container

Build and start the Kali tools container:

```bash
docker compose -f labs/docker-compose.yml --profile tools up -d --build kali
docker compose -f labs/docker-compose.yml exec kali bash
```

Inside the container, the target names resolve through the isolated Docker network:

```bash
nmap -sV -Pn -p 3000 juice-shop
nmap -sV -Pn -p 8080,9090 webgoat
nikto -h http://juice-shop:3000
curl -I http://juice-shop:3000
```

These commands are intended for the included lab services only. The Kali image does not mount the host filesystem except for `labs/workspace`.

## Run OWASP ZAP baseline

ZAP's baseline mode performs a passive assessment. It is not a full active scan:

```bash
docker compose -f labs/docker-compose.yml --profile tools run --rm zap -t http://juice-shop:3000 -m 1 -I
```

You can repeat it against WebGoat:

```bash
docker compose -f labs/docker-compose.yml --profile tools run --rm zap -t http://webgoat:8080/WebGoat -m 1 -I
```

## Stop and remove the lab

```bash
docker compose -f labs/docker-compose.yml down
```

To also remove the containers' named/anonymous volumes:

```bash
docker compose -f labs/docker-compose.yml down -v
```

Images remain cached locally. Remove them separately through Docker Desktop if you need disk space.

## Safety and scope

- The lab targets are intentionally vulnerable and must remain local.
- Only scan `juice-shop` and `webgoat` on the private Docker network created by this Compose file.
- Never point SQLmap, Nmap, Nikto, ZAP or other active tools at a public IP, third-party domain, school/work network or another person's device without explicit written authorization and a defined scope.
- Do not add port mappings for the Kali or ZAP containers.
- Do not run the vulnerable targets on a public server.
- The stack is a learning range, not a production security boundary. Keep Docker and the host operating system patched.

## Troubleshooting

- If a port is occupied, stop the conflicting local service or change the host-side port while keeping the bind address as `127.0.0.1`.
- Check logs with `docker compose -f labs/docker-compose.yml logs --tail=100 juice-shop`.
- If a tool container cannot resolve a target name, confirm both containers are attached to `blackveil-labnet`.
- First startup may take several minutes while Docker downloads images.
