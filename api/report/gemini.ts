import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildGeminiPrompt, DEFAULT_GEMINI_MODEL } from "../../lib/gemini-prompt";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      detail: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 설정해주세요.",
    });
  }

  const { data, summary } = req.body ?? {};
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ detail: "보고서 생성을 위한 데이터가 없습니다." });
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(buildGeminiPrompt(data, summary ?? {}));
    const report = result.response.text()?.trim();

    if (!report) {
      return res.status(500).json({ detail: "Gemini가 빈 응답을 반환했습니다." });
    }

    return res.status(200).json({ report, model: modelName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini 보고서 생성 오류";
    return res.status(500).json({ detail: message });
  }
}
