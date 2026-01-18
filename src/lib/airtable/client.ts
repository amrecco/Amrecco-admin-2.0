const AIRTABLE_API = "https://api.airtable.com/v0";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function airtableFetch(path: string, init?: RequestInit) {
  const token = requireEnv("NEXT_PUBLIC_AIRTABLE_TOKEN");

  const res = await fetch(`${AIRTABLE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    // avoid caching in server route
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable error ${res.status}: ${text}`);
  }

  return res.json();
}

export function getBaseId() {
  return requireEnv("NEXT_PUBLIC_AIRTABLE_BASE_ID");
}

export function getTableId() {
  return requireEnv("NEXT_PUBLIC_AIRTABLE_TABLE_ID");
}
