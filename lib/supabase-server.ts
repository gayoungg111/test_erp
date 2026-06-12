export interface DownloadRegisterInput {
  email: string;
  nickname: string;
  format: "word" | "excel" | "pdf";
  recordCount?: number;
}

function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

export function getSupabaseEnv() {
  const url =
    readEnv("supabase_url") ||
    readEnv("SUPABASE_URL") ||
    readEnv("VITE_SUPABASE_URL");
  const serviceRoleKey =
    readEnv("supabase_service_role_key") ||
    readEnv("SUPABASE_SERVICE_ROLE_KEY");

  return { url, serviceRoleKey };
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

function parseSupabaseError(status: number, body: string): string {
  if (!body) {
    return `Supabase 저장 실패 (HTTP ${status})`;
  }

  try {
    const json = JSON.parse(body) as {
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
    // plain text response
  }

  return body.length > 200 ? `${body.slice(0, 200)}...` : body;
}

export async function insertDownloadRequest(input: DownloadRegisterInput): Promise<void> {
  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!url) {
    throw new Error("Supabase URL(supabase_url) 환경 변수가 설정되지 않았습니다.");
  }
  if (!serviceRoleKey) {
    throw new Error("Supabase service role key(supabase_service_role_key) 환경 변수가 설정되지 않았습니다.");
  }

  const baseUrl = url.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/rest/v1/download_requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify([
      {
        email: input.email.trim(),
        nickname: input.nickname.trim(),
        file_format: input.format,
        record_count: input.recordCount ?? null,
      },
    ]),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(parseSupabaseError(response.status, body));
  }
}
