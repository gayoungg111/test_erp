import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, "..", "");
  const localEnv = loadEnv(mode, ".", "");
  const env = { ...rootEnv, ...localEnv };

  const supabaseUrl =
    process.env.supabase_url ||
    process.env.SUPABASE_URL ||
    env.supabase_url ||
    env.VITE_SUPABASE_URL ||
    "";

  const supabaseAnonKey =
    process.env.supabase_anon_key ||
    process.env.SUPABASE_ANON_KEY ||
    env.supabase_anon_key ||
    env.VITE_SUPABASE_ANON_KEY ||
    "";

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
