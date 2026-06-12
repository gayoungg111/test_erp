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

async function readApiError(res: Response): Promise<string> {
  const text = await res.text();

  if (!text) {
    return `요청 실패 (HTTP ${res.status})`;
  }

  try {
    const json = JSON.parse(text) as {
      detail?: string;
      message?: string;
      error?: string | { message?: string };
    };

    if (typeof json.detail === "string" && json.detail) return json.detail;
    if (typeof json.message === "string" && json.message) return json.message;
    if (typeof json.error === "string" && json.error) return json.error;
    if (json.error && typeof json.error === "object" && json.error.message) {
      return json.error.message;
    }
  } catch {
    // not JSON — likely HTML error page
  }

  if (text.includes("<!DOCTYPE") || text.includes("<html")) {
    return `API 연결 실패 (HTTP ${res.status}). 배포 후 /api/download/register 경로를 확인해주세요.`;
  }

  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

export async function saveDownloadRequest(payload: DownloadRequestPayload): Promise<void> {
  let res: Response;

  try {
    res = await fetch("/api/download/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email.trim(),
        nickname: payload.nickname.trim(),
        format: payload.format,
        recordCount: payload.recordCount ?? null,
      }),
    });
  } catch {
    throw new Error("서버에 연결할 수 없습니다. 네트워크 또는 API 배포 상태를 확인해주세요.");
  }

  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
}
