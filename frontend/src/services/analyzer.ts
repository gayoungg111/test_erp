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

function normalizeColumnKey(key: string): string {
  return key.trim().replace(/^\ufeff/, "");
}

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    row[normalizeColumnKey(key)] = value;
  }
  return row;
}

function excelSerialToDate(serial: number): Date {
  // Excel serial date → JS Date (UTC)
  const utcMs = (serial - 25569) * 86400 * 1000;
  return new Date(utcMs);
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  if (typeof value === "number" && value > 30000 && value < 60000) {
    const excelDate = excelSerialToDate(value);
    if (!isNaN(excelDate.getTime())) return excelDate;
  }

  const str = String(value).trim();
  if (!str) return null;

  // YYYY.MM.DD / YYYY/MM/DD
  const normalized = str.replace(/\./g, "-").replace(/\//g, "-");
  const parsed = new Date(normalized);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number" && !isNaN(value)) return value;
  const str = String(value ?? "")
    .replace(/,/g, "")
    .replace(/원/g, "")
    .replace(/\s/g, "")
    .trim();
  if (!str) return NaN;
  return Number(str);
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isBlankRow(row: ErpRecord): boolean {
  const emptyNum = (v: number) => v === undefined || v === null || (typeof v === "number" && isNaN(v));
  return (
    !String(row.날짜 ?? "").trim() &&
    !String(row.부서 ?? "").trim() &&
    !String(row.항목 ?? "").trim() &&
    emptyNum(row.금액) &&
    emptyNum(row.수량)
  );
}

const FIELD_ALIASES: Record<string, string[]> = {
  날짜: ["날짜", "date", "order_date", "join_date", "일자", "거래일", "transaction_date"],
  부서: ["부서", "department", "dept", "channel", "category", "customer_type", "division"],
  항목: ["항목", "item", "product_name", "product", "product_id", "name", "품목", "item_name"],
  금액: ["금액", "amount", "amount_krw", "total_amount_krw", "unit_price_krw", "price", "total"],
  수량: ["수량", "qty", "quantity", "stock_qty", "count"],
  거래처: ["거래처", "customer", "customer_name", "customer_id", "vendor", "client"],
  비고: ["비고", "status", "note", "remarks", "memo", "description"],
};

function getField(row: Record<string, unknown>, field: string): unknown {
  if (row[field] !== undefined && row[field] !== "") return row[field];
  const aliases = FIELD_ALIASES[field] || [field];
  const lowerMap = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])
  );
  for (const alias of aliases) {
    const val = lowerMap[alias.toLowerCase()];
    if (val !== undefined && val !== "") return val;
  }
  return undefined;
}

function mapRawToRecord(raw: Record<string, unknown>): ErpRecord {
  const row = normalizeRow(raw);
  const dateRaw = getField(row, "날짜");
  let 날짜 = "";
  if (dateRaw instanceof Date) {
    날짜 = formatDateLocal(dateRaw);
  } else if (dateRaw != null && dateRaw !== "") {
    const d = parseDate(dateRaw);
    날짜 = d ? formatDateLocal(d) : String(dateRaw);
  }

  return {
    날짜,
    부서: String(getField(row, "부서") ?? "").trim(),
    항목: String(getField(row, "항목") ?? "").trim(),
    금액: parseNumber(getField(row, "금액")),
    수량: parseNumber(getField(row, "수량")),
    거래처: getField(row, "거래처") != null ? String(getField(row, "거래처")).trim() : "",
    비고: getField(row, "비고") != null ? String(getField(row, "비고")).trim() : "",
  };
}

interface ParsedFile {
  name: string;
  rows: Record<string, unknown>[];
}

function detectFileType(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "generic";
  const keys = new Set(Object.keys(normalizeRow(rows[0])).map((k) => k.toLowerCase()));
  if (keys.has("order_no") && keys.has("order_date")) return "sales_orders";
  if (keys.has("order_no") && keys.has("product_id") && keys.has("qty")) return "sales_order_items";
  if (keys.has("product_id") && keys.has("product_name")) return "products";
  if (keys.has("customer_id") && keys.has("customer_name")) return "customers";
  return "generic";
}

function mergeSalesErp(files: ParsedFile[]): ErpRecord[] {
  const byType = (type: string) => files.find((f) => detectFileType(f.rows) === type)?.rows ?? [];

  const orders = byType("sales_orders").map(normalizeRow);
  const items = byType("sales_order_items").map(normalizeRow);
  const products = byType("products").map(normalizeRow);
  const customers = byType("customers").map(normalizeRow);

  const orderMap = new Map(orders.map((r) => [String(r.order_no), r]));
  const productMap = new Map(products.map((r) => [String(r.product_id), r]));
  const customerMap = new Map(customers.map((r) => [String(r.customer_id), r]));

  const records: ErpRecord[] = [];

  if (items.length > 0) {
    for (const item of items) {
      const order = orderMap.get(String(item.order_no));
      const product = productMap.get(String(item.product_id));
      const customer = order ? customerMap.get(String(order.customer_id)) : undefined;
      const d = parseDate(order?.order_date);
      if (!d) continue;

      records.push({
        날짜: formatDateLocal(d),
        부서: String(order?.channel || product?.category || "미분류"),
        항목: String(product?.product_name || item.product_id || "품목"),
        금액: parseNumber(item.amount_krw ?? item.unit_price_krw),
        수량: parseNumber(item.qty),
        거래처: String(customer?.customer_name || order?.customer_id || ""),
        비고: String(order?.status || ""),
      });
    }
  } else if (orders.length > 0) {
    for (const order of orders) {
      const customer = customerMap.get(String(order.customer_id));
      const d = parseDate(order.order_date);
      if (!d) continue;

      records.push({
        날짜: formatDateLocal(d),
        부서: String(order.channel || "미분류"),
        항목: `주문 ${order.order_no}`,
        금액: parseNumber(order.total_amount_krw),
        수량: 1,
        거래처: String(customer?.customer_name || ""),
        비고: String(order.status || ""),
      });
    }
  }

  return records;
}

async function parseRawFile(file: File): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();

  let workbook;
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    workbook = XLSX.read(text, { type: "string" });
  } else {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

export function validateErpData(records: ErpRecord[]): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  const warnings: ValidationResult["warnings"] = [];
  const validRows: ErpRecord[] = [];

  const dataRows = records.filter((r) => !isBlankRow(r));

  if (!dataRows.length) {
    return {
      valid: false,
      errors: [{ row: 0, field: "전체", message: "데이터가 비어 있습니다." }],
      warnings: [],
      summary: {},
      data: [],
    };
  }

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const rowErrors: string[] = [];

    const dateVal = parseDate(row.날짜);
    if (!dateVal) rowErrors.push(`날짜 형식이 올바르지 않습니다. (값: ${row.날짜 || "비어있음"})`);

    if (!row.부서 || String(row.부서).trim() === "") rowErrors.push("부서는 필수입니다.");
    if (!row.항목 || String(row.항목).trim() === "") rowErrors.push("항목은 필수입니다.");

    const amount = typeof row.금액 === "number" ? row.금액 : parseNumber(row.금액);
    if (isNaN(amount)) rowErrors.push(`금액은 숫자여야 합니다. (값: ${row.금액})`);
    else if (amount < 0) warnings.push({ row: rowNum, field: "금액", message: "금액이 음수입니다." });

    const qty = typeof row.수량 === "number" ? row.수량 : parseNumber(row.수량);
    if (isNaN(qty)) rowErrors.push(`수량은 숫자여야 합니다. (값: ${row.수량})`);
    else if (qty < 0) warnings.push({ row: rowNum, field: "수량", message: "수량이 음수입니다." });

    if (rowErrors.length) {
      rowErrors.forEach((msg) => errors.push({ row: rowNum, field: "검증", message: msg }));
    } else if (dateVal) {
      validRows.push({
        날짜: formatDateLocal(dateVal),
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
  const raw = await parseRawFile(file);
  if (!raw.length) return [];
  return raw.map(mapRawToRecord).filter((r) => !isBlankRow(r));
}

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export function isAllowedUploadFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function parseUploadedFiles(files: File[]): Promise<{
  records: ErpRecord[];
  fileNames: string[];
}> {
  const validFiles = files.filter((f) => isAllowedUploadFile(f.name));
  if (validFiles.length === 0) {
    throw new Error("CSV 또는 Excel(.csv, .xlsx, .xls) 파일만 업로드 가능합니다.");
  }

  const parsed: ParsedFile[] = [];
  for (const file of validFiles) {
    parsed.push({ name: file.name, rows: await parseRawFile(file) });
  }

  const hasSalesData = parsed.some((p) => {
    const t = detectFileType(p.rows);
    return t === "sales_orders" || t === "sales_order_items";
  });

  let records: ErpRecord[] = [];

  if (hasSalesData) {
    records = mergeSalesErp(parsed);
  }

  if (!records.length) {
    for (const { rows } of parsed) {
      records.push(...rows.map(mapRawToRecord).filter((r) => !isBlankRow(r)));
    }
  }

  if (!records.length) {
    const sampleKeys = parsed[0]?.rows[0]
      ? Object.keys(normalizeRow(parsed[0].rows[0])).join(", ")
      : "(없음)";
    throw new Error(
      `분석 가능한 데이터를 찾지 못했습니다. 필수 정보: 날짜, 부서, 항목, 금액, 수량 (파일 컬럼: ${sampleKeys})`
    );
  }

  return { records, fileNames: validFiles.map((f) => f.name) };
}
