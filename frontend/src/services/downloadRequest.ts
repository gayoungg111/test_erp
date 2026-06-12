import type { DownloadFormat } from "../components/DownloadMenu";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";

export interface DownloadRequestPayload {
  email: string;
  nickname: string;
  format: DownloadFormat;
  recordCount?: number;
}

export function validateDownloadForm(email: string, nickname: string): string | null {
  const trimmedEmail = email.trim();
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) return "닉네임을 입력해주세요.";
  if (trimmedNickname.length > 50) return "닉네임은 50자 이내로 입력해주세요.";
  if (!trimmedEmail) return "이메일을 입력해주세요.";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) return "올바른 이메일 형식을 입력해주세요.";

  return null;
}

export async function saveDownloadRequest(payload: DownloadRequestPayload): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 환경 변수를 확인해주세요."
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase 클라이언트를 초기화할 수 없습니다.");
  }

  const { error } = await supabase.from("download_requests").insert({
    email: payload.email.trim(),
    nickname: payload.nickname.trim(),
    file_format: payload.format,
    record_count: payload.recordCount ?? null,
  });

  if (error) {
    throw new Error(error.message || "다운로드 요청 저장에 실패했습니다.");
  }
}
