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
