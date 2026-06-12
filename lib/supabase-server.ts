import { createClient } from "@supabase/supabase-js";

function getSupabaseEnv() {
  const url =
    process.env.supabase_url ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.supabase_service_role_key ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, serviceRoleKey };
}

export interface DownloadRegisterInput {
  email: string;
  nickname: string;
  format: "word" | "excel" | "pdf";
  recordCount?: number;
}

export function validateDownloadInput(input: DownloadRegisterInput): string | null {
  const email = input.email.trim();
  const nickname = input.nickname.trim();

  if (!nickname) return "닉네임을 입력해주세요.";
  if (nickname.length > 50) return "닉네임은 50자 이내로 입력해주세요.";
  if (!email) return "이메일을 입력해주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 형식을 입력해주세요.";
  if (!["word", "excel", "pdf"].includes(input.format)) return "지원하지 않는 파일 형식입니다.";

  return null;
}

export async function insertDownloadRequest(input: DownloadRegisterInput): Promise<void> {
  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase 환경 변수(supabase_url, supabase_service_role_key)가 설정되지 않았습니다."
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("download_requests").insert({
    email: input.email.trim(),
    nickname: input.nickname.trim(),
    file_format: input.format,
    record_count: input.recordCount ?? null,
  });

  if (error) {
    throw new Error(error.message || "다운로드 요청 저장에 실패했습니다.");
  }
}
