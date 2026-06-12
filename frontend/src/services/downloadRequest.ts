import type { DownloadFormat } from "../components/DownloadMenu";

export interface DownloadRequestPayload {
  email: string;
  nickname: string;
  format: DownloadFormat;
  recordCount?: number;
}

function getSupabaseConfig() {
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

function parseSupabaseError(status: number, text: string): string {
  if (!text) return `Supabase 저장 실패 (HTTP ${status})`;

  try {
    const json = JSON.parse(text) as {
      message?: string;
      error?: string;
      hint?: string;
      details?: string;
      code?: string;
    };
    const parts = [
      json.message || json.error,
      json.details,
      json.hint,
      json.code ? `code=${json.code}` : "",
    ].filter(Boolean);
    if (parts.length) return parts.join(" · ");
  } catch {
    // plain text
  }

  if (text.includes("Could not find the table")) {
    return "download_requests 테이블이 없습니다. Supabase SQL Editor에서 schema.sql을 실행해주세요.";
  }

  if (text.includes("Invalid API key")) {
    return [
      "Supabase API 키가 올바르지 않습니다.",
      "Vercel → supabase_anon_key 에 Supabase의 anon public 키만 넣었는지 확인하세요.",
      "service_role 키와는 다른 값이어야 합니다. 수정 후 Redeploy가 필요합니다.",
    ].join(" ");
  }

  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

export async function saveDownloadRequest(payload: DownloadRequestPayload): Promise<void> {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 설정이 비어 있습니다. Vercel에 supabase_url, supabase_anon_key(anon public)를 넣고 Redeploy 해주세요."
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
    const text = await res.text();
    throw new Error(parseSupabaseError(res.status, text));
  }
}
