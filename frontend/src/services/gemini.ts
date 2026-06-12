import type { ErpRecord, Summary } from "../types";

export async function generateGeminiReport(
  data: ErpRecord[],
  summary: Summary
): Promise<string> {
  const res = await fetch("/api/report/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, summary }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Gemini 보고서 생성에 실패했습니다.");
  }

  const json = await res.json();
  return json.report as string;
}

export async function downloadReportAsWord(report: string, title = "ERP 분석 보고서") {
  const now = new Date().toLocaleString("ko-KR");
  const htmlBody = report
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      if (line.trim() === "") return "<br/>";
      return `<p>${line}</p>`;
    })
    .join("\n");

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${title}</title></head>
<body><h1 style='text-align:center'>${title}</h1><p>생성일: ${now}</p><p style='color:#64748b;font-size:12px'>Powered by Google Gemini</p>${htmlBody}</body></html>`;

  const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
  triggerDownload(blob, "erp_report.doc");
}

export async function downloadReportAsPdf(report: string, title = "ERP 분석 보고서") {
  const now = new Date().toLocaleString("ko-KR");
  const container = document.createElement("div");
  container.style.cssText = "font-family:'Malgun Gothic',sans-serif;padding:40px;max-width:800px;line-height:1.7;color:#1e293b";
  container.innerHTML = `
    <h1 style="text-align:center;margin-bottom:8px">${title}</h1>
    <p style="text-align:center;color:#64748b;font-size:13px">생성일: ${now} · Powered by Google Gemini</p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
    <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">${escapeHtml(report)}</pre>
  `;
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

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
