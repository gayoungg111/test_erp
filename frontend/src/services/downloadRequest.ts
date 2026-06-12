import type { DownloadFormat } from "../components/DownloadMenu";

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
  const res = await fetch("/api/download/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email.trim(),
      nickname: payload.nickname.trim(),
      format: payload.format,
      recordCount: payload.recordCount ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "다운로드 요청 저장에 실패했습니다.");
  }
}
