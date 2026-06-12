export function buildGeminiPrompt(data: unknown[], summary: unknown): string {
  return `당신은 ERP 데이터 분석 전문가입니다.
아래 ERP 거래 데이터와 브라우저에서 계산된 분석 요약을 바탕으로,
경영진에게 제출할 **한국어 ERP 분석 보고서**를 작성해주세요.

## 작성 지침
- 마크다운 형식으로 작성 (## 섹션 제목, - 목록)
- 반드시 포함할 섹션:
  1. ## 경영 요약 (Executive Summary)
  2. ## 핵심 지표 분석
  3. ## 부서별 인사이트
  4. ## 항목별 매출 분석
  5. ## 월별 추이 및 전망
  6. ## 리스크 및 개선 제안
  7. ## 결론
- 숫자는 구체적으로 인용하고, 데이터에 기반한 실질적 조언을 포함
- 전문적이고 간결한 비즈니스 보고서 톤 유지

## 분석 요약 (브라우저 계산)
${JSON.stringify(summary, null, 2)}

## 원본 데이터 (${data.length}건)
${JSON.stringify(data, null, 2)}`;
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
