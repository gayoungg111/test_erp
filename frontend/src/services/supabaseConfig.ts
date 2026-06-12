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
