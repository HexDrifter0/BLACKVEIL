#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const composeFile = path.join(root, 'labs', 'docker-compose.yml');

function fail(message) {
  console.error(`[lab-boundary] FAIL: ${message}`);
  process.exitCode = 1;
}

function requireCondition(condition, message) {
  if (!condition) fail(message);
}

let config;
try {
  const output = execFileSync(
    'docker',
    ['compose', '--profile', 'tools', '-f', composeFile, 'config', '--format', 'json'],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  config = JSON.parse(output);
} catch (error) {
  const detail = error?.stderr?.toString().trim() || error?.message || 'unknown error';
  console.error('[lab-boundary] Could not render Docker Compose configuration.');
  console.error(detail);
  console.error('Install Docker Compose v2 and rerun: npm run check:lab');
  process.exit(2);
}

const services = config.services ?? {};
const networks = config.networks ?? {};
const internalNetworks = new Set(
  Object.entries(networks)
    .filter(([, network]) => network?.internal === true)
    .map(([name]) => name),
);
const expectedLoopbackPorts = {
  'juice-shop': [3000],
  webgoat: [8080, 9090],
};

requireCondition(internalNetworks.size > 0, 'At least one Docker network must be marked internal: true.');

for (const [name, service] of Object.entries(services)) {
  requireCondition(service.privileged !== true, `${name} must not run in privileged mode.`);
  requireCondition(service.network_mode !== 'host', `${name} must not use host networking.`);

  const attachedNetworks = Object.keys(service.networks ?? {});
  requireCondition(attachedNetworks.length > 0, `${name} must be attached to the isolated lab network.`);
  requireCondition(
    attachedNetworks.every((network) => internalNetworks.has(network)),
    `${name} is attached to a network that is not explicitly internal.`,
  );

  if (!Object.hasOwn(expectedLoopbackPorts, name)) {
    requireCondition(
      (service.ports ?? []).length === 0,
      `${name} is not an approved host-published lab target and must not publish ports.`,
    );
  }
}

for (const [name, expectedPorts] of Object.entries(expectedLoopbackPorts)) {
  const service = services[name];
  requireCondition(Boolean(service), `Required lab target service "${name}" is missing.`);
  if (!service) continue;

  const ports = service.ports ?? [];
  requireCondition(
    ports.length === expectedPorts.length,
    `${name} must publish exactly ${expectedPorts.join(', ')} and no other host ports.`,
  );

  for (const expectedPort of expectedPorts) {
    const mapping = ports.find(
      (port) => Number(port.target) === expectedPort && Number(port.published) === expectedPort,
    );
    requireCondition(Boolean(mapping), `${name} must map container port ${expectedPort} to the same host port.`);
    if (mapping) {
      requireCondition(
        mapping.host_ip === '127.0.0.1',
        `${name} port ${expectedPort} must bind exclusively to 127.0.0.1 (got ${mapping.host_ip ?? 'unspecified'}).`,
      );
    }
  }
}

for (const name of ['kali', 'zap']) {
  const service = services[name];
  requireCondition(Boolean(service), `Required tools service "${name}" is missing.`);
  if (!service) continue;
  requireCondition(
    (service.ports ?? []).length === 0,
    `${name} must not publish any host ports.`,
  );
  requireCondition(
    (service.profiles ?? []).includes('tools'),
    `${name} must remain behind the opt-in "tools" Compose profile.`,
  );
  requireCondition(
    !(service.devices ?? []).length,
    `${name} must not receive direct host device access.`,
  );
}

const kali = services.kali;
if (kali) {
  const dropped = (kali.cap_drop ?? []).map((value) => value.toUpperCase());
  const added = (kali.cap_add ?? []).map((value) => value.toUpperCase());
  requireCondition(dropped.includes('ALL'), 'Kali must drop all Linux capabilities before adding any exception.');
  requireCondition(
    added.length === 1 && added[0] === 'NET_RAW',
    'Kali may add NET_RAW only; do not grant additional Linux capabilities.',
  );
  requireCondition(
    (kali.security_opt ?? []).includes('no-new-privileges:true'),
    'Kali must enforce no-new-privileges:true.',
  );

  const mounts = kali.volumes ?? [];
  requireCondition(mounts.length === 1, 'Kali must have exactly one host mount: the dedicated lab workspace.');
  for (const mount of mounts) {
    requireCondition(mount.type === 'bind', 'Kali workspace mount must be an explicit bind mount.');
    const source = String(mount.source).replaceAll(/\\/g, '/');
    requireCondition(
      mount.target === '/workspace' && source.endsWith('/labs/workspace'),
      'Kali may mount only labs/workspace at /workspace.',
    );
    requireCondition(
      !source.includes('docker.sock'),
      'Kali must never receive the Docker socket.',
    );
  }
}

if (process.exitCode) {
  console.error('[lab-boundary] One or more isolation invariants failed.');
  process.exit(process.exitCode);
}

console.log('[lab-boundary] PASS: targets are loopback-only; tool containers are opt-in, isolated, and unprivileged.');
