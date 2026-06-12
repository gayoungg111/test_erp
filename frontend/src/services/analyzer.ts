import type { ErpRecord, Summary, ValidationResult } from "../types";

export const SAMPLE_DATA: ErpRecord[] = [
  { 날짜: "2025-01-05", 부서: "영업", 항목: "제품A", 금액: 1500000, 수량: 10, 거래처: "ABC상사", 비고: "" },
  { 날짜: "2025-01-12", 부서: "영업", 항목: "제품B", 금액: 2300000, 수량: 15, 거래처: "XYZ코퍼", 비고: "" },
  { 날짜: "2025-02-03", 부서: "구매", 항목: "원자재", 금액: 890000, 수량: 50, 거래처: "공급업체A", 비고: "긴급발주" },
  { 날짜: "2025-02-18", 부서: "생산", 항목: "제품A", 금액: 1200000, 수량: 8, 거래처: "", 비고: "내부생산" },
  { 날짜: "2025-03-07", 부서: "영업", 항목: "제품C", 금액: 3100000, 수량: 20, 거래처: "DEF유통", 비고: "" },
  { 날짜: "2025-03-22", 부서: "재무", 항목: "운영비", 금액: 450000, 수량: 1, 거래처: "", 비고: "사무용품" },
  { 날짜: "2025-04-01", 부서: "영업", 항목: "제품A", 금액: 1800000, 수량: 12, 거래처: "ABC상사", 비고: "" },
  { 날짜: "2025-04-15", 부서: "구매", 항목: "포장재", 금액: 320000, 수량: 100, 거래처: "포장업체B", 비고: "" },
  { 날짜: "2025-05-10", 부서: "생산", 항목: "제품B", 금액: 950000, 수량: 6, 거래처: "", 비고: "" },
  { 날짜: "2025-05-28", 부서: "영업", 항목: "제품C", 금액: 2700000, 수량: 18, 거래처: "GHI마트", 비고: "대량주문" },
];

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

export function validateErpData(records: ErpRecord[]): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  const warnings: ValidationResult["warnings"] = [];
  const validRows: ErpRecord[] = [];

  if (!records.length) {
    return {
      valid: false,
      errors: [{ row: 0, field: "전체", message: "데이터가 비어 있습니다." }],
      warnings: [],
      summary: {},
      data: [],
    };
  }

  records.forEach((row, idx) => {
    const rowNum = idx + 1;
    const rowErrors: string[] = [];

    const dateVal = parseDate(row.날짜);
    if (!dateVal) rowErrors.push("날짜 형식이 올바르지 않습니다.");

    if (!row.부서 || String(row.부서).trim() === "") rowErrors.push("부서는 필수입니다.");
    if (!row.항목 || String(row.항목).trim() === "") rowErrors.push("항목은 필수입니다.");

    const amount = Number(row.금액);
    if (isNaN(amount)) rowErrors.push("금액은 숫자여야 합니다.");
    else if (amount < 0) warnings.push({ row: rowNum, field: "금액", message: "금액이 음수입니다." });

    const qty = Number(row.수량);
    if (isNaN(qty)) rowErrors.push("수량은 숫자여야 합니다.");
    else if (qty < 0) warnings.push({ row: rowNum, field: "수량", message: "수량이 음수입니다." });

    if (rowErrors.length) {
      rowErrors.forEach((msg) => errors.push({ row: rowNum, field: "검증", message: msg }));
    } else if (dateVal) {
      validRows.push({
        날짜: dateVal.toISOString().slice(0, 10),
        부서: String(row.부서).trim(),
        항목: String(row.항목).trim(),
        금액: amount,
        수량: qty,
        거래처: row.거래처 ? String(row.거래처).trim() : "",
        비고: row.비고 ? String(row.비고).trim() : "",
      });
    }
  });

  const summary = validRows.length ? computeSummary(validRows) : {};
  return {
    valid: errors.length === 0 && validRows.length > 0,
    errors,
    warnings,
    summary,
    data: validRows,
  };
}

export function computeSummary(data: ErpRecord[]): Summary {
  const totalAmount = data.reduce((s, r) => s + r.금액, 0);
  const totalQty = data.reduce((s, r) => s + r.수량, 0);
  const dates = data.map((r) => r.날짜).sort();

  const depts: Record<string, { 부서: string; 총금액: number; 총수량: number; 건수: number }> = {};
  data.forEach((r) => {
    if (!depts[r.부서]) depts[r.부서] = { 부서: r.부서, 총금액: 0, 총수량: 0, 건수: 0 };
    depts[r.부서].총금액 += r.금액;
    depts[r.부서].총수량 += r.수량;
    depts[r.부서].건수++;
  });

  const items: Record<string, { 항목: string; 총금액: number; 총수량: number }> = {};
  data.forEach((r) => {
    if (!items[r.항목]) items[r.항목] = { 항목: r.항목, 총금액: 0, 총수량: 0 };
    items[r.항목].총금액 += r.금액;
    items[r.항목].총수량 += r.수량;
  });

  const months: Record<string, { 월: string; 총금액: number; 건수: number }> = {};
  data.forEach((r) => {
    const m = r.날짜.slice(0, 7);
    if (!months[m]) months[m] = { 월: m, 총금액: 0, 건수: 0 };
    months[m].총금액 += r.금액;
    months[m].건수++;
  });

  const customers: Record<string, { 거래처: string; 총금액: number }> = {};
  data.forEach((r) => {
    if (r.거래처?.trim()) {
      if (!customers[r.거래처]) customers[r.거래처] = { 거래처: r.거래처, 총금액: 0 };
      customers[r.거래처].총금액 += r.금액;
    }
  });

  return {
    totalRecords: data.length,
    totalAmount,
    totalQuantity: totalQty,
    avgAmount: totalAmount / data.length,
    departmentCount: new Set(data.map((r) => r.부서)).size,
    itemCount: new Set(data.map((r) => r.항목)).size,
    dateRange: { start: dates[0], end: dates[dates.length - 1] },
    byDepartment: Object.values(depts).sort((a, b) => b.총금액 - a.총금액),
    byItem: Object.values(items).sort((a, b) => b.총금액 - a.총금액).slice(0, 10),
    byMonth: Object.values(months).sort((a, b) => a.월.localeCompare(b.월)),
    topCustomers: Object.values(customers).sort((a, b) => b.총금액 - a.총금액).slice(0, 5),
  };
}

export function generateBasicInsights(summary: Summary): string[] {
  const lines: string[] = [];
  const total = summary.totalAmount || 0;
  const records = summary.totalRecords || 0;
  lines.push(`총 ${records.toLocaleString()}건의 ERP 거래 데이터를 분석한 결과, 총 금액은 ${total.toLocaleString()}원입니다.`);

  const topDept = summary.byDepartment?.[0];
  if (topDept) {
    lines.push(`부서별로는 '${topDept.부서}' 부서가 ${topDept.총금액.toLocaleString()}원으로 가장 높은 비중을 차지합니다.`);
  }

  const months = summary.byMonth || [];
  if (months.length >= 2) {
    const last = months[months.length - 1].총금액;
    const prev = months[months.length - 2].총금액;
    if (prev > 0) {
      const change = ((last - prev) / prev) * 100;
      lines.push(`최근 월별 추이를 보면 전월 대비 ${Math.abs(change).toFixed(1)}% ${change >= 0 ? "증가" : "감소"}하였습니다.`);
    }
  }

  const topItem = summary.byItem?.[0];
  if (topItem) {
    lines.push(`항목별로는 '${topItem.항목}'이(가) ${topItem.총금액.toLocaleString()}원으로 최다 매출 항목입니다.`);
  }

  return lines;
}

export async function parseUploadedFile(file: File): Promise<ErpRecord[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();

  let workbook;
  if (file.name.endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    workbook = XLSX.read(text, { type: "string" });
  } else {
    workbook = XLSX.read(buffer, { type: "array" });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return raw.map((row) => ({
    날짜: String(row["날짜"] ?? ""),
    부서: String(row["부서"] ?? ""),
    항목: String(row["항목"] ?? ""),
    금액: Number(row["금액"] ?? 0),
    수량: Number(row["수량"] ?? 0),
    거래처: row["거래처"] != null ? String(row["거래처"]) : "",
    비고: row["비고"] != null ? String(row["비고"]) : "",
  }));
}
