import type { Summary } from "../types";

export interface ReportExportPayload {
  summary: Summary;
  insights: string[];
  geminiReport: string | null;
}

const TITLE = "ERP 분석 보고서";

function formatNow() {
  return new Date().toLocaleString("ko-KR");
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h3>${escapeHtml(line.slice(3))}</h3>`;
      if (line.startsWith("# ")) return `<h2>${escapeHtml(line.slice(2))}</h2>`;
      if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (line.trim() === "") return "<br/>";
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

function buildSummaryRows(summary: Summary): [string, string][] {
  return [
    ["총 거래 건수", `${summary.totalRecords?.toLocaleString() ?? 0}건`],
    ["총 금액", `${summary.totalAmount?.toLocaleString() ?? 0}원`],
    ["총 수량", summary.totalQuantity?.toLocaleString() ?? "0"],
    ["평균 거래금액", `${Math.round(summary.avgAmount || 0).toLocaleString()}원`],
    ["부서 수", `${summary.departmentCount ?? 0}개`],
    ["항목 수", `${summary.itemCount ?? 0}개`],
    [
      "분석 기간",
      summary.dateRange
        ? `${summary.dateRange.start} ~ ${summary.dateRange.end}`
        : "-",
    ],
  ];
}

function buildReportHtml(payload: ReportExportPayload): string {
  const { summary, insights, geminiReport } = payload;
  const summaryRows = buildSummaryRows(summary)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">${label}</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${value}</td></tr>`
    )
    .join("");

  const deptRows = (summary.byDepartment || [])
    .map(
      (d) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0">${escapeHtml(d.부서)}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${d.총금액.toLocaleString()}원</td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${d.총수량.toLocaleString()}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${d.건수}</td></tr>`
    )
    .join("");

  const itemRows = (summary.byItem || [])
    .map(
      (item) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0">${escapeHtml(item.항목)}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${item.총금액.toLocaleString()}원</td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${item.총수량.toLocaleString()}</td></tr>`
    )
    .join("");

  const monthRows = (summary.byMonth || [])
    .map(
      (m) =>
        `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0">${escapeHtml(m.월)}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${m.총금액.toLocaleString()}원</td><td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right">${m.건수}</td></tr>`
    )
    .join("");

  const insightHtml = insights.map((line) => `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`).join("");

  const geminiSection = geminiReport
    ? `<h2 style="margin-top:32px;font-size:18px">6. AI 종합 보고서</h2><div>${markdownToHtml(geminiReport)}</div>`
    : `<p style="color:#64748b;font-size:13px">AI 종합 보고서는 생성되지 않았습니다.</p>`;

  return `
    <h1 style="text-align:center;margin-bottom:8px">${TITLE}</h1>
    <p style="text-align:center;color:#64748b;font-size:13px;margin-bottom:24px">생성일: ${formatNow()}</p>
    <h2 style="font-size:18px">1. 요약</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">${summaryRows}</table>
    <h2 style="font-size:18px">2. 부서별 분석</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
      <thead><tr style="background:#f1f5f9"><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:left">부서</th><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">총금액</th><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">총수량</th><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">건수</th></tr></thead>
      <tbody>${deptRows}</tbody>
    </table>
    <h2 style="font-size:18px">3. 항목별 Top 10</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
      <thead><tr style="background:#f1f5f9"><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:left">항목</th><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">총금액</th><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">총수량</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <h2 style="font-size:18px">4. 월별 추이</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
      <thead><tr style="background:#f1f5f9"><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:left">월</th><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">총금액</th><th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right">건수</th></tr></thead>
      <tbody>${monthRows}</tbody>
    </table>
    <h2 style="font-size:18px">5. 기본 분석 의견</h2>
    <div style="background:#eff6ff;padding:16px;border-radius:8px;margin-bottom:24px">${insightHtml}</div>
    <h2 style="font-size:18px">6. AI 종합 보고서</h2>
    ${geminiSection}
  `;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadReportAsWord(payload: ReportExportPayload) {
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${TITLE}</title></head>
<body style="font-family:'Malgun Gothic',sans-serif;line-height:1.6;color:#1e293b">${buildReportHtml(payload)}</body></html>`;

  const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
  triggerDownload(blob, "erp_report.doc");
}

export async function downloadReportAsPdf(payload: ReportExportPayload) {
  const container = document.createElement("div");
  container.style.cssText =
    "font-family:'Malgun Gothic',sans-serif;padding:40px;max-width:800px;line-height:1.7;color:#1e293b";
  container.innerHTML = buildReportHtml(payload);
  document.body.appendChild(container);

  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({
      margin: 10,
      filename: "erp_report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}

export async function downloadReportAsExcel(payload: ReportExportPayload) {
  const XLSX = await import("xlsx");
  const { summary, insights, geminiReport } = payload;
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["항목", "값"],
    ...buildSummaryRows(summary),
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "요약");

  const deptSheet = XLSX.utils.aoa_to_sheet([
    ["부서", "총금액", "총수량", "건수"],
    ...(summary.byDepartment || []).map((d) => [d.부서, d.총금액, d.총수량, d.건수]),
  ]);
  XLSX.utils.book_append_sheet(wb, deptSheet, "부서별");

  const itemSheet = XLSX.utils.aoa_to_sheet([
    ["항목", "총금액", "총수량"],
    ...(summary.byItem || []).map((item) => [item.항목, item.총금액, item.총수량]),
  ]);
  XLSX.utils.book_append_sheet(wb, itemSheet, "항목별");

  const monthSheet = XLSX.utils.aoa_to_sheet([
    ["월", "총금액", "건수"],
    ...(summary.byMonth || []).map((m) => [m.월, m.총금액, m.건수]),
  ]);
  XLSX.utils.book_append_sheet(wb, monthSheet, "월별");

  const insightSheet = XLSX.utils.aoa_to_sheet([
    ["기본 분석 의견"],
    ...insights.map((line) => [line]),
  ]);
  XLSX.utils.book_append_sheet(wb, insightSheet, "분석의견");

  if (geminiReport) {
    const aiSheet = XLSX.utils.aoa_to_sheet([
      ["AI 종합 보고서"],
      ...geminiReport.split("\n").map((line) => [line]),
    ]);
    XLSX.utils.book_append_sheet(wb, aiSheet, "AI보고서");
  }

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "erp_report.xlsx"
  );
}

export async function downloadReport(
  format: "word" | "excel" | "pdf",
  payload: ReportExportPayload
) {
  if (format === "word") await downloadReportAsWord(payload);
  else if (format === "excel") await downloadReportAsExcel(payload);
  else await downloadReportAsPdf(payload);
}
