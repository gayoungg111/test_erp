import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, "..", "");
  const localEnv = loadEnv(mode, ".", "");
  const env = { ...rootEnv, ...localEnv };

  const pick = (...values: Array<string | undefined>) =>
    values.map((v) => v?.trim()).find(Boolean) || "";

  const supabaseUrl = pick(
    process.env.supabase_url,
    process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
    env.supabase_url,
    env.VITE_SUPABASE_URL
  );

  const serviceRoleKey = pick(
    process.env.supabase_service_role_key,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let supabaseAnonKey = pick(
    process.env.supabase_anon_key,
    process.env.SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
    env.supabase_anon_key,
    env.VITE_SUPABASE_ANON_KEY
  );

  // anon 자리에 service_role이 들어간 경우 빌드에 넣지 않음
  if (supabaseAnonKey && serviceRoleKey && supabaseAnonKey === serviceRoleKey) {
    console.warn(
      "[erp] supabase_anon_key와 supabase_service_role_key가 동일합니다. anon public 키만 supabase_anon_key에 넣어주세요."
    );
    supabaseAnonKey = "";
  }

  if (supabaseUrl && !supabaseAnonKey) {
    console.warn(
      "[erp] supabase_anon_key가 비어 있습니다. Vercel Environment Variables를 확인하세요."
    );
  }

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
