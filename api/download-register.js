export const config = {
  runtime: "edge",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function readEnv(name) {
  return (process.env[name] || "").trim();
}

function getSupabaseEnv() {
  return {
    url: readEnv("supabase_url") || readEnv("SUPABASE_URL"),
    serviceRoleKey:
      readEnv("supabase_service_role_key") || readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function validateInput(input) {
  const email = String(input.email || "").trim();
  const nickname = String(input.nickname || "").trim();
  const format = String(input.format || "").trim();

  if (!nickname) return "닉네임을 입력해주세요.";
  if (nickname.length > 50) return "닉네임은 50자 이내로 입력해주세요.";
  if (!email) return "이메일을 입력해주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 형식을 입력해주세요.";
  if (!["word", "excel", "pdf"].includes(format)) return "지원하지 않는 파일 형식입니다.";

  return null;
}

function parseSupabaseError(status, body) {
  if (!body) return `Supabase 저장 실패 (HTTP ${status})`;
  try {
    const data = JSON.parse(body);
    const parts = [data.message || data.error, data.details, data.hint].filter(Boolean);
    if (parts.length) return parts.join(" · ");
  } catch {
    // plain text
  }
  return body.length > 200 ? `${body.slice(0, 200)}...` : body;
}

async function saveToSupabase(input) {
  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!url) throw new Error("Supabase URL(supabase_url) 환경 변수가 설정되지 않았습니다.");
  if (!serviceRoleKey) {
    throw new Error("Supabase service role key(supabase_service_role_key) 환경 변수가 설정되지 않았습니다.");
  }

  const baseUrl = url.replace(/\/$/, "");
  const recordCount =
    typeof input.recordCount === "number"
      ? input.recordCount
      : typeof input.record_count === "number"
        ? input.record_count
        : null;

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
        email: String(input.email).trim(),
        nickname: String(input.nickname).trim(),
        file_format: String(input.format).trim(),
        record_count: recordCount,
      },
    ]),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(parseSupabaseError(response.status, body));
  }
}

export default async function handler(request) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET") {
      const { url, serviceRoleKey } = getSupabaseEnv();
      return json({ ok: true, configured: Boolean(url && serviceRoleKey) });
    }

    if (request.method !== "POST") {
      return json({ detail: "Method not allowed" }, 405);
    }

    const body = await request.json().catch(() => ({}));
    const validationError = validateInput(body);
    if (validationError) {
      return json({ detail: validationError }, 400);
    }

    await saveToSupabase(body);
    return json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "다운로드 요청 저장 오류";
    return json({ detail: message }, 500);
  }
}
