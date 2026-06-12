import type { ErpRecord, Summary } from "../types";

export async function generateGeminiReport(
  data: ErpRecord[],
  summary: Summary
): Promise<string> {
  const res = await fetch("/api/report/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, summary }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Gemini 보고서 생성에 실패했습니다.");
  }

  const json = await res.json();
  return json.report as string;
}
