# ERP 분석 서비스

GitHub: [gayoungg111/test_erp](https://github.com/gayoungg111/test_erp)

ERP 거래 데이터를 **브라우저에서 분석**하고, **Google Gemini**로 AI 종합 보고서를 생성하는 웹 서비스입니다.

## 아키텍처

| 기능 | 처리 위치 |
|------|-----------|
| 데이터 검증 · 요약 · 대시보드 · 차트 | **브라우저** (클라이언트) |
| AI 종합 보고서 생성 | **Google Gemini** (`gemini-2.5-flash-lite`) |
| PDF / Word 다운로드 | **브라우저** (Gemini 보고서 기반) |

## Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에서 GitHub 저장소 `gayoungg111/test_erp` 연결
2. **Settings → Environment Variables** 에서 아래 변수 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `GEMINI_API` | 발급받은 API Key | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | (선택) 미설정 시 기본값 사용 |

3. Deploy — 프론트엔드와 `/api/report/gemini` API가 함께 배포됩니다.

> API Key는 Vercel 환경 변수로만 관리되며, 클라이언트 코드에 노출되지 않습니다.

## 기능

- **데이터 입력**: 직접 입력, CSV/Excel 업로드, 샘플 데이터
- **데이터 검증**: 브라우저에서 필수 컬럼·형식 검증
- **대시보드**: 부서별·월별·항목별 차트 및 KPI
- **분석보고서**: 브라우저 기본 분석 + Gemini AI 종합 보고서
- **원본데이터**: 검증된 데이터 테이블 조회

## 로컬 개발

### Vercel API + 프론트엔드 (배포와 동일)

```bash
# 루트에서 Vercel CLI
npm install
cd frontend && npm install && cd ..
# .env.local 에 GEMINI_API 설정 후
npx vercel dev
```

### Python 백엔드 (로컬 대안)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # GEMINI_API, GEMINI_MODEL 설정
uvicorn main:app --reload --port 8000

cd frontend
npm install
npm run dev
```

## HTML 미리보기 (서버 없이)

```
html/index.html
```

브라우저에서 바로 열 수 있습니다. 분석은 브라우저에서 처리되며, Gemini 보고서는 Vercel API 또는 API Key 직접 입력으로 생성합니다.

## 사용 흐름

1. 데이터 입력 → **데이터 검증** (브라우저)
2. 대시보드 / 원본데이터 확인 (브라우저)
3. 분석보고서 → **Gemini 보고서 생성** (`gemini-2.5-flash-lite`)
4. PDF 또는 Word 다운로드

## 프로젝트 구조

```
├── api/report/gemini.ts   # Vercel Serverless (Gemini API)
├── lib/gemini-prompt.ts   # 공통 프롬프트
├── frontend/              # React SPA (브라우저 분석)
├── backend/               # 로컬 개발용 Python API
├── html/index.html        # 독립 HTML 버전
├── vercel.json
└── README.md
```

## 필수 데이터 컬럼

| 컬럼 | 설명 |
|------|------|
| 날짜 | YYYY-MM-DD |
| 부서 | 부서명 |
| 항목 | 거래 항목 |
| 금액 | 숫자 |
| 수량 | 숫자 |
| 거래처 | (선택) |
| 비고 | (선택) |
