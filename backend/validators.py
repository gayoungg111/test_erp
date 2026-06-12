from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd

REQUIRED_COLUMNS = ["날짜", "부서", "항목", "금액", "수량"]
OPTIONAL_COLUMNS = ["거래처", "비고"]
ALL_COLUMNS = REQUIRED_COLUMNS + OPTIONAL_COLUMNS


def _parse_date(value: Any) -> datetime | None:
    if pd.isna(value) or value == "":
        return None
    if isinstance(value, datetime):
        return value
    try:
        return pd.to_datetime(value)
    except Exception:
        return None


def validate_erp_data(records: list[dict]) -> dict:
    errors: list[dict] = []
    warnings: list[dict] = []
    valid_rows: list[dict] = []

    if not records:
        return {
            "valid": False,
            "errors": [{"row": 0, "field": "전체", "message": "데이터가 비어 있습니다."}],
            "warnings": [],
            "summary": {},
            "data": [],
        }

    df = pd.DataFrame(records)

    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        return {
            "valid": False,
            "errors": [
                {
                    "row": 0,
                    "field": "컬럼",
                    "message": f"필수 컬럼이 없습니다: {', '.join(missing_cols)}",
                }
            ],
            "warnings": [],
            "summary": {},
            "data": [],
        }

    for idx, row in df.iterrows():
        row_num = int(idx) + 1
        row_errors: list[str] = []

        date_val = _parse_date(row.get("날짜"))
        if date_val is None:
            row_errors.append("날짜 형식이 올바르지 않습니다.")

        dept = row.get("부서")
        if pd.isna(dept) or str(dept).strip() == "":
            row_errors.append("부서는 필수입니다.")

        item = row.get("항목")
        if pd.isna(item) or str(item).strip() == "":
            row_errors.append("항목은 필수입니다.")

        try:
            amount = float(row.get("금액", 0))
            if amount < 0:
                warnings.append(
                    {"row": row_num, "field": "금액", "message": "금액이 음수입니다."}
                )
        except (TypeError, ValueError):
            row_errors.append("금액은 숫자여야 합니다.")
            amount = None

        try:
            qty = float(row.get("수량", 0))
            if qty < 0:
                warnings.append(
                    {"row": row_num, "field": "수량", "message": "수량이 음수입니다."}
                )
        except (TypeError, ValueError):
            row_errors.append("수량은 숫자여야 합니다.")
            qty = None

        if row_errors:
            for msg in row_errors:
                errors.append({"row": row_num, "field": "검증", "message": msg})
        else:
            valid_rows.append(
                {
                    "날짜": date_val.strftime("%Y-%m-%d"),
                    "부서": str(dept).strip(),
                    "항목": str(item).strip(),
                    "금액": amount,
                    "수량": qty,
                    "거래처": str(row.get("거래처", "")).strip()
                    if not pd.isna(row.get("거래처"))
                    else "",
                    "비고": str(row.get("비고", "")).strip()
                    if not pd.isna(row.get("비고"))
                    else "",
                }
            )

    summary = compute_summary(valid_rows) if valid_rows else {}

    return {
        "valid": len(errors) == 0 and len(valid_rows) > 0,
        "errors": errors,
        "warnings": warnings,
        "summary": summary,
        "data": valid_rows,
    }


def compute_summary(data: list[dict]) -> dict:
    if not data:
        return {}

    df = pd.DataFrame(data)
    df["금액"] = pd.to_numeric(df["금액"])
    df["수량"] = pd.to_numeric(df["수량"])
    df["날짜"] = pd.to_datetime(df["날짜"])

    by_department = (
        df.groupby("부서")
        .agg(총금액=("금액", "sum"), 총수량=("수량", "sum"), 건수=("금액", "count"))
        .reset_index()
        .sort_values("총금액", ascending=False)
    )

    by_item = (
        df.groupby("항목")
        .agg(총금액=("금액", "sum"), 총수량=("수량", "sum"))
        .reset_index()
        .sort_values("총금액", ascending=False)
        .head(10)
    )

    by_month = (
        df.assign(월=df["날짜"].dt.to_period("M").astype(str))
        .groupby("월")
        .agg(총금액=("금액", "sum"), 건수=("금액", "count"))
        .reset_index()
        .sort_values("월")
    )

    top_customers = []
    if "거래처" in df.columns and df["거래처"].str.strip().any():
        top_customers = (
            df[df["거래처"].str.strip() != ""]
            .groupby("거래처")
            .agg(총금액=("금액", "sum"))
            .reset_index()
            .sort_values("총금액", ascending=False)
            .head(5)
            .to_dict(orient="records")
        )

    return {
        "totalRecords": len(df),
        "totalAmount": float(df["금액"].sum()),
        "totalQuantity": float(df["수량"].sum()),
        "avgAmount": float(df["금액"].mean()),
        "departmentCount": int(df["부서"].nunique()),
        "itemCount": int(df["항목"].nunique()),
        "dateRange": {
            "start": df["날짜"].min().strftime("%Y-%m-%d"),
            "end": df["날짜"].max().strftime("%Y-%m-%d"),
        },
        "byDepartment": by_department.to_dict(orient="records"),
        "byItem": by_item.to_dict(orient="records"),
        "byMonth": by_month.to_dict(orient="records"),
        "topCustomers": top_customers,
    }
