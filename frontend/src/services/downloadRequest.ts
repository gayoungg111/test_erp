import type { DownloadFormat } from "../components/DownloadMenu";

export interface DownloadRequestPayload {
  email: string;
  nickname: string;
  format: DownloadFormat;
  recordCount?: number;
}

const API_PATHS = ["/api/download-register", "/api/download/register"];

function getSupabaseClientEnv() {
  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || "",
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || "",
  };
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

  if (text.includes("FUNCTION_INVOCATION_FAILED")) {
    return "서버 함수 실행 오류(FUNCTION_INVOCATION_FAILED). 잠시 후 다시 시도해주세요.";
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
    // not JSON
  }

  if (text.includes("<!DOCTYPE") || text.includes("<html")) {
    return `API 연결 실패 (HTTP ${res.status}).`;
  }

  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

async function saveViaApi(payload: DownloadRequestPayload, path: string): Promise<void> {
  const res = await fetch(path, {
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
    throw new Error(await readApiError(res));
  }
}

async function saveDirectToSupabase(payload: DownloadRequestPayload): Promise<void> {
  const { url, anonKey } = getSupabaseClientEnv();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase anon key가 없어 직접 저장할 수 없습니다. Vercel에 supabase_anon_key를 추가해주세요."
    );
  }

  const baseUrl = url.replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/rest/v1/download_requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify([
      {
        email: payload.email.trim(),
        nickname: payload.nickname.trim(),
        file_format: payload.format,
        record_count: payload.recordCount ?? null,
      },
    ]),
  });

  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
}

export async function saveDownloadRequest(payload: DownloadRequestPayload): Promise<void> {
  let lastError: Error | null = null;

  for (const path of API_PATHS) {
    try {
      await saveViaApi(payload, path);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("API 저장 실패");
    }
  }

  const { anonKey } = getSupabaseClientEnv();
  if (anonKey) {
    try {
      await saveDirectToSupabase(payload);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
    }
  }

  throw lastError ?? new Error("다운로드 요청 저장에 실패했습니다.");
}
