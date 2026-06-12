# ERP 분석 서비스

GitHub: [gayoungg111/test_erp](https://github.com/gayoungg111/test_erp)

ERP 거래 데이터를 **브라우저에서 분석**하고, **Google Gemini**로 AI 종합 보고서를 생성하는 웹 서비스입니다.

## 아키텍처

| 기능 | 처리 위치 |
|------|-----------|
| 데이터 검증 · 요약 · 대시보드 · 차트 | **브라우저** (클라이언트) |
| AI 종합 보고서 생성 | **Google Gemini** (백엔드 프록시) |
| PDF / Word 다운로드 | **브라우저** (Gemini 보고서 기반) |

## 기능

- **데이터 입력**: 직접 입력, CSV/Excel 업로드, 샘플 데이터
- **데이터 검증**: 브라우저에서 필수 컬럼·형식 검증
- **대시보드**: 부서별·월별·항목별 차트 및 KPI
- **분석보고서**: 브라우저 기본 분석 + Gemini AI 종합 보고서
- **원본데이터**: 검증된 데이터 테이블 조회

## Gemini API 설정

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API Key 발급
2. `backend/.env` 파일 생성:

```bash
cp backend/.env.example backend/.env
# GEMINI_API_KEY=발급받은_키 입력
```

## HTML 미리보기 (서버 없이)

```
html/index.html
```

브라우저에서 바로 열 수 있습니다. 분석은 브라우저에서 처리되며, Gemini 보고서는 백엔드 또는 HTML 내 API Key 입력으로 생성합니다.

## 실행 방법

### 1. 백엔드 (Gemini 보고서용)

```bash
cd backend
pip install -r requirements.txt
# .env 파일에 GEMINI_API_KEY 설정
uvicorn main:app --reload --port 8000
```

### 2. 프론트엔드 (React)

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 사용 흐름

1. 데이터 입력 → **데이터 검증** (브라우저)
2. 대시보드 / 원본데이터 확인 (브라우저)
3. 분석보고서 → **Gemini 보고서 생성** (Gemini AI)
4. PDF 또는 Word 다운로드

## 프로젝트 구조

```
├── backend/          # Gemini API 프록시
├── frontend/         # React SPA (브라우저 분석)
├── html/index.html   # 독립 HTML 버전
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
