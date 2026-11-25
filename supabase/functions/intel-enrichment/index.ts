import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function classify(value: string): "ip" | "domain" | "hash" | null {
  const ip = value.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (ip && value.split(".").every(part => Number(part) >= 0 && Number(part) <= 255)) return "ip";
  if (/^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value)) return "hash";
  if (value.length <= 253 && /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(value)) return "domain";
  return null;
}

async function requestJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(9000) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Provider HTTP " + response.status);
  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !authorization) return reply(401, { error: "authentication_required" });

  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return reply(401, { error: "invalid_session" });

  let payload: { indicator?: unknown };
  try { payload = await req.json(); } catch { return reply(400, { error: "invalid_json" }); }
  const indicator = typeof payload.indicator === "string" ? payload.indicator.trim().toLowerCase() : "";
  const kind = classify(indicator);
  if (!kind) return reply(400, { error: "invalid_indicator", accepted: "IPv4, public domain, MD5/SHA1/SHA256 hash" });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return reply(503, { error: "server_configuration_missing" });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error: rateReadError } = await admin.from("intel_request_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authData.user.id)
    .gte("created_at", since);
  if (rateReadError) return reply(503, { error: "rate_limit_unavailable" });
  if ((count ?? 0) >= 5) return reply(429, { error: "rate_limit_exceeded", limit: "5 requests per minute" });
  const { error: rateWriteError } = await admin.from("intel_request_events").insert({ user_id: authData.user.id });
  if (rateWriteError) return reply(503, { error: "rate_limit_unavailable" });

  const results: Record<string, unknown> = {};
  const run = async (name: string, keyNames: string[], operation: () => Promise<unknown>) => {
    if (keyNames.some(key => !Deno.env.get(key))) {
      results[name] = { status: "not_configured", required_secrets: keyNames };
      return;
    }
    try { results[name] = { status: "ok", data: await operation() }; }
    catch (error) { results[name] = { status: "error", message: error instanceof Error ? error.message : "provider_error" }; }
  };

  if (kind === "ip") {
    await run("Shodan", ["SHODAN_API_KEY"], async () => {
      const key = Deno.env.get("SHODAN_API_KEY")!;
      const d = await requestJson("https://api.shodan.io/shodan/host/" + encodeURIComponent(indicator) + "?key=" + encodeURIComponent(key));
      return { ip_str: d.ip_str, hostnames: d.hostnames, ports: d.ports, org: d.org, isp: d.isp, country_name: d.country_name, last_update: d.last_update, vulns: d.vulns };
    });
    await run("Censys", ["CENSYS_API_TOKEN"], async () => {
      const d = await requestJson("https://api.platform.censys.io/v3/global/asset/host/" + encodeURIComponent(indicator), {
        headers: { Authorization: "Bearer " + Deno.env.get("CENSYS_API_TOKEN")!, Accept: "application/vnd.censys.api.v3.host.v1+json" }
      });
      return d;
    });
    await run("AbuseIPDB", ["ABUSEIPDB_API_KEY"], async () => {
      const d = await requestJson("https://api.abuseipdb.com/api/v2/check?ipAddress=" + encodeURIComponent(indicator) + "&maxAgeInDays=90", { headers: { Key: Deno.env.get("ABUSEIPDB_API_KEY")!, Accept: "application/json" } });
      return d.data;
    });
  }

  await run("VirusTotal", ["VIRUSTOTAL_API_KEY"], async () => {
    const endpoint = kind === "ip" ? "ip_addresses/" : kind === "domain" ? "domains/" : "files/";
    const d = await requestJson("https://www.virustotal.com/api/v3/" + endpoint + encodeURIComponent(indicator), { headers: { "x-apikey": Deno.env.get("VIRUSTOTAL_API_KEY")!, Accept: "application/json" } });
    const a = d.data?.attributes ?? {};
    return { id: d.data?.id, type: d.data?.type, reputation: a.reputation, last_analysis_stats: a.last_analysis_stats, categories: a.categories, last_analysis_date: a.last_analysis_date, total_votes: a.total_votes };
  });

  const statuses = Object.fromEntries(Object.entries(results).map(([key, value]: [string, any]) => [key, value.status]));
  await supabase.from("audit_events").insert({
    user_id: authData.user.id,
    event_type: "threat_intelligence.enriched",
    resource_type: "indicator",
    resource_id: indicator,
    metadata: { indicator_type: kind, provider_status: statuses },
  });

  return reply(200, { indicator, indicator_type: kind, results });
});
