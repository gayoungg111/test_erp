from __future__ import annotations

import io
import os

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gemini_report import generate_gemini_report

load_dotenv()

app = FastAPI(title="ERP 분석 서비스 - Gemini 보고서", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReportRequest(BaseModel):
    data: list[dict]
    summary: dict


class DownloadRegisterRequest(BaseModel):
    email: str
    nickname: str
    format: str
    recordCount: int | None = None


def _save_download_request(email: str, nickname: str, file_format: str, record_count: int | None) -> None:
    import json
    import urllib.error
    import urllib.request

    url = os.getenv("supabase_url") or os.getenv("SUPABASE_URL")
    key = os.getenv("supabase_service_role_key") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail="Supabase 환경 변수(supabase_url, supabase_service_role_key)가 설정되지 않았습니다.",
        )

    payload = json.dumps(
        [{
            "email": email.strip(),
            "nickname": nickname.strip(),
            "file_format": file_format,
            "record_count": record_count,
        }]
    ).encode("utf-8")

    req = urllib.request.Request(
        f"{url.rstrip('/')}/rest/v1/download_requests",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "return=minimal",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status >= 400:
                raise HTTPException(status_code=500, detail="다운로드 요청 저장에 실패했습니다.")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=500, detail=f"Supabase 저장 오류: {body or exc.reason}") from exc


@app.get("/api/health")
def health():
    has_key = bool(os.getenv("GEMINI_API"))
    return {"status": "ok", "gemini_configured": has_key}


@app.post("/api/report/gemini")
def create_gemini_report(request: ReportRequest):
    if not request.data:
        raise HTTPException(status_code=400, detail="보고서 생성을 위한 데이터가 없습니다.")
    try:
        report = generate_gemini_report(request.data, request.summary)
        return {"report": report}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini 보고서 생성 오류: {exc}",
        ) from exc


@app.post("/api/download/register")
def register_download(request: DownloadRegisterRequest):
    email = request.email.strip()
    nickname = request.nickname.strip()

    if not nickname:
        raise HTTPException(status_code=400, detail="닉네임을 입력해주세요.")
    if len(nickname) > 50:
        raise HTTPException(status_code=400, detail="닉네임은 50자 이내로 입력해주세요.")
    if not email:
        raise HTTPException(status_code=400, detail="이메일을 입력해주세요.")
    if request.format not in {"word", "excel", "pdf"}:
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

    _save_download_request(email, nickname, request.format, request.recordCount)
    return {"ok": True}
