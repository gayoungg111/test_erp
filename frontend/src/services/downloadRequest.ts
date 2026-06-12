import type { DownloadFormat } from "../components/DownloadMenu";
import { describeSupabaseConfig, getSupabaseRuntimeConfig } from "./supabaseConfig";

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
    return "Supabase API 키가 올바르지 않습니다. supabase_anon_key(anon public)와 supabase_url이 같은 프로젝트인지 확인 후 Redeploy 해주세요.";
  }

  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

export async function saveDownloadRequest(payload: DownloadRequestPayload): Promise<void> {
  const { url, anonKey } = await getSupabaseRuntimeConfig();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 설정이 비어 있습니다. Vercel에 supabase_url, supabase_anon_key(anon public)를 넣고 Redeploy 해주세요."
    );
  }

  if (!url.includes("supabase.co")) {
    throw new Error(
      "supabase_url 형식이 올바르지 않습니다. https://xxxx.supabase.co 형태인지 확인해주세요."
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
    const base = parseSupabaseError(res.status, text);
    const diag = describeSupabaseConfig(url, anonKey);
    throw new Error(`${base} (${diag})`);
  }
}
