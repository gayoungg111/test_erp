import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = join(dirname(fileURLToPath(import.meta.url)), "../public/supabase-config.json");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const vars = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function clean(value) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function pick(env, ...keys) {
  for (const key of keys) {
    const value = clean(env[key]);
    if (value) return value;
  }
  return "";
}

const fileEnv = {
  ...loadDotEnv(join(root, ".env")),
  ...loadDotEnv(join(root, ".env.local")),
  ...loadDotEnv(join(root, "frontend", ".env")),
  ...loadDotEnv(join(root, "frontend", ".env.local")),
};

const env = { ...fileEnv, ...process.env };

const url = pick(env, "supabase_url", "SUPABASE_URL", "VITE_SUPABASE_URL");
const anonKey = pick(env, "supabase_anon_key", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY");
const serviceRoleKey = pick(
  env,
  "supabase_service_role_key",
  "SUPABASE_SERVICE_ROLE_KEY"
);

let finalAnonKey = anonKey;
if (finalAnonKey && serviceRoleKey && finalAnonKey === serviceRoleKey) {
  console.warn(
    "[supabase-config] supabase_anon_key와 supabase_service_role_key가 동일합니다. anon public 키만 사용하세요."
  );
  finalAnonKey = "";
}

const config = { url, anonKey: finalAnonKey };

writeFileSync(outPath, JSON.stringify(config, null, 2), "utf8");

console.log("[supabase-config] wrote", outPath);
console.log("[supabase-config] url:", url ? `${url.slice(0, 30)}...` : "(empty)");
console.log("[supabase-config] anonKey:", finalAnonKey ? `set (${finalAnonKey.length} chars)` : "(empty)");

if (url && !finalAnonKey) {
  console.warn(
    "[supabase-config] anon key가 비어 있습니다. Vercel에 supabase_anon_key(anon public)를 설정하세요."
  );
}
