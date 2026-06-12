import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { useData } from "../context/DataContext";
import { generateBasicInsights } from "../services/analyzer";
import {
  downloadReportAsPdf,
  downloadReportAsWord,
  generateGeminiReport,
} from "../services/gemini";

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return (
        <h3 key={i} className="mt-4 text-base font-bold text-slate-800">
          {line.slice(3)}
        </h3>
      );
    if (line.startsWith("# "))
      return (
        <h2 key={i} className="mt-2 text-lg font-bold text-slate-800">
          {line.slice(2)}
        </h2>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="ml-4 text-sm text-slate-700">
          {line.slice(2)}
        </li>
      );
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} className="text-sm leading-relaxed text-slate-700">
        {line}
      </p>
    );
  });
}

export default function AnalysisReport() {
  const navigate = useNavigate();
  const { isValidated, summary, data, geminiReport, setGeminiReport } = useData();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidated) setGeminiReport(null);
  }, [isValidated, setGeminiReport]);

  if (!isValidated || data.length === 0) {
    return (
      <EmptyState
        title="아직 불러온 erp 데이터가 없습니다"
        actionLabel="데이터 입력하러가기"
        onAction={() => navigate("/")}
      />
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const report = await generateGeminiReport(data, summary);
      setGeminiReport(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gemini 보고서 생성 실패");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (format: "pdf" | "word") => {
    if (!geminiReport) {
      setError("먼저 Gemini 보고서를 생성해주세요.");
      return;
    }
    setDownloading(format);
    setError("");
    try {
      if (format === "pdf") await downloadReportAsPdf(geminiReport);
      else await downloadReportAsWord(geminiReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : "다운로드 실패");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">분석보고서</h2>
          <p className="mt-1 text-sm text-slate-500">
            기본 분석은 브라우저에서, AI 종합 보고서는 Google Gemini가 생성합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            className="btn-primary"
            disabled={generating || downloading !== null}
          >
            {generating ? "Gemini 생성 중..." : "✨ Gemini 보고서 생성"}
          </button>
          {geminiReport && (
            <>
              <button
                onClick={() => handleDownload("pdf")}
                className="btn-secondary"
                disabled={generating || downloading !== null}
              >
                {downloading === "pdf" ? "생성 중..." : "📥 PDF 다운로드"}
              </button>
              <button
                onClick={() => handleDownload("word")}
                className="btn-secondary"
                disabled={generating || downloading !== null}
              >
                {downloading === "word" ? "생성 중..." : "📥 Word 다운로드"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">1. 요약 <span className="text-xs font-normal text-slate-400">(브라우저 분석)</span></h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["총 거래 건수", `${summary.totalRecords?.toLocaleString()}건`],
            ["총 금액", `${summary.totalAmount?.toLocaleString()}원`],
            ["총 수량", summary.totalQuantity?.toLocaleString()],
            ["평균 거래금액", `${Math.round(summary.avgAmount || 0).toLocaleString()}원`],
            ["부서 수", `${summary.departmentCount}개`],
            ["항목 수", `${summary.itemCount}개`],
            [
              "분석 기간",
              summary.dateRange
                ? `${summary.dateRange.start} ~ ${summary.dateRange.end}`
                : "-",
            ],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-1 font-semibold text-slate-800">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">2. 부서별 분석 <span className="text-xs font-normal text-slate-400">(브라우저 분석)</span></h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-2">부서</th>
                <th className="px-4 py-2 text-right">총금액</th>
                <th className="px-4 py-2 text-right">총수량</th>
                <th className="px-4 py-2 text-right">건수</th>
              </tr>
            </thead>
            <tbody>
              {(summary.byDepartment || []).map((d) => (
                <tr key={d.부서} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium">{d.부서}</td>
                  <td className="px-4 py-2 text-right">{d.총금액.toLocaleString()}원</td>
                  <td className="px-4 py-2 text-right">{d.총수량.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{d.건수}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">3. 항목별 Top 10 <span className="text-xs font-normal text-slate-400">(브라우저 분석)</span></h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-2">항목</th>
                <th className="px-4 py-2 text-right">총금액</th>
                <th className="px-4 py-2 text-right">총수량</th>
              </tr>
            </thead>
            <tbody>
              {(summary.byItem || []).map((item) => (
                <tr key={item.항목} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium">{item.항목}</td>
                  <td className="px-4 py-2 text-right">{item.총금액.toLocaleString()}원</td>
                  <td className="px-4 py-2 text-right">{item.총수량.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">4. 월별 추이 <span className="text-xs font-normal text-slate-400">(브라우저 분석)</span></h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-2">월</th>
                <th className="px-4 py-2 text-right">총금액</th>
                <th className="px-4 py-2 text-right">건수</th>
              </tr>
            </thead>
            <tbody>
              {(summary.byMonth || []).map((m) => (
                <tr key={m.월} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium">{m.월}</td>
                  <td className="px-4 py-2 text-right">{m.총금액.toLocaleString()}원</td>
                  <td className="px-4 py-2 text-right">{m.건수}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold">5. 기본 분석 의견 <span className="text-xs font-normal text-slate-400">(브라우저 분석)</span></h3>
        <div className="space-y-3 rounded-lg bg-blue-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
          {generateBasicInsights(summary).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      <div className="card border-2 border-violet-100 bg-gradient-to-br from-white to-violet-50/30">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-semibold">6. AI 종합 보고서</h3>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            gemini-2.5-flash-lite
          </span>
        </div>
        {!geminiReport ? (
          <div className="rounded-lg border border-dashed border-violet-200 bg-white px-6 py-10 text-center">
            <div className="mb-3 text-3xl">✨</div>
            <p className="text-sm text-slate-600">
              「Gemini 보고서 생성」 버튼을 누르면 AI가 경영진용 종합 분석 보고서를 작성합니다.
            </p>
            <button
              onClick={handleGenerate}
              className="btn-primary mt-4"
              disabled={generating}
            >
              {generating ? "생성 중..." : "Gemini 보고서 생성"}
            </button>
          </div>
        ) : (
          <div className="rounded-lg bg-white px-5 py-4">{renderMarkdown(geminiReport)}</div>
        )}
      </div>
    </div>
  );
}
