import type { VercelRequest, VercelResponse } from "@vercel/node";
import { insertDownloadRequest, validateDownloadInput } from "../../lib/supabase-server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const { email, nickname, format, recordCount } = req.body ?? {};

  const validationError = validateDownloadInput({
    email: String(email ?? ""),
    nickname: String(nickname ?? ""),
    format: format as "word" | "excel" | "pdf",
    recordCount: typeof recordCount === "number" ? recordCount : undefined,
  });

  if (validationError) {
    return res.status(400).json({ detail: validationError });
  }

  try {
    await insertDownloadRequest({
      email: String(email),
      nickname: String(nickname),
      format,
      recordCount: typeof recordCount === "number" ? recordCount : undefined,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "다운로드 요청 저장 오류";
    return res.status(500).json({ detail: message });
  }
}
