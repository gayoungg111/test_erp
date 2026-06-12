interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

let cached: SupabaseRuntimeConfig | null = null;

function clean(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export function decodeSupabaseKeyRole(key: string): string | null {
  if (!key.startsWith("eyJ")) return key.startsWith("sb_publishable_") ? "publishable" : null;
  try {
    const payload = key.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: string;
      ref?: string;
    };
    return json.role ?? null;
  } catch {
    return null;
  }
}

export function describeSupabaseConfig(url: string, anonKey: string): string {
  const role = decodeSupabaseKeyRole(anonKey);
  const parts = [
    url ? `URL: ${url}` : "URL: (비어 있음)",
    anonKey ? `키 길이: ${anonKey.length}자` : "키: (비어 있음)",
  ];
  if (role) parts.push(`키 종류: ${role}`);
  if (role === "service_role") {
    parts.push("→ supabase_anon_key에 service_role이 들어가 있습니다. anon public 키로 바꿔주세요.");
  }
  return parts.join(" · ");
}

function fromImportMeta(): SupabaseRuntimeConfig {
  return {
    url: clean(import.meta.env.VITE_SUPABASE_URL),
    anonKey: clean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  };
}

export async function getSupabaseRuntimeConfig(): Promise<SupabaseRuntimeConfig> {
  if (cached?.url && cached?.anonKey) return cached;

  try {
    const res = await fetch("/supabase-config.json", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as Partial<SupabaseRuntimeConfig>;
      const url = clean(json.url);
      const anonKey = clean(json.anonKey);
      if (url && anonKey) {
        cached = { url, anonKey };
        return cached;
      }
    }
  } catch {
    // fallback below
  }

  const fallback = fromImportMeta();
  if (fallback.url && fallback.anonKey) {
    cached = fallback;
    return cached;
  }

  return { url: "", anonKey: "" };
}
