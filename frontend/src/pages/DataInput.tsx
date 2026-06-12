import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileDropZone from "../components/FileDropZone";
import { useData } from "../context/DataContext";
import {
  parseUploadedFiles,
  SAMPLE_DATA,
  validateErpData,
} from "../services/analyzer";
import { EMPTY_RECORD, REQUIRED_COLUMNS, type ErpRecord } from "../types";

export default function DataInput() {
  const navigate = useNavigate();
  const { setData, setValidation, validation } = useData();
  const [rows, setRows] = useState<ErpRecord[]>([{ ...EMPTY_RECORD }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const updateRow = (index: number, field: keyof ErpRecord, value: string | number) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_RECORD }]);

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleValidate = () => {
    setLoading(true);
    setError("");
    try {
      const filtered = rows.filter(
        (r) => r.날짜 || r.부서 || r.항목 || r.금액 || r.수량
      );
      const result = validateErpData(filtered);
      setValidation(result);
      if (result.valid) setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검증 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    setLoading(true);
    setError("");
    try {
      const { records, fileNames } = await parseUploadedFiles(files);
      setUploadedFiles(fileNames);
      const result = validateErpData(records);
      setValidation(result);
      if (result.valid) {
        setData(result.data);
        setRows(result.data.length > 0 ? result.data : [{ ...EMPTY_RECORD }]);
      } else {
        setRows(records.length > 0 ? records : [{ ...EMPTY_RECORD }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setLoading(true);
    setError("");
    setUploadedFiles([]);
    try {
      const sample = SAMPLE_DATA.map((r) => ({ ...r }));
      setRows(sample);
      const result = validateErpData(sample);
      setValidation(result);
      if (result.valid) setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "샘플 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">데이터 입력</h2>
        <p className="mt-1 text-sm text-slate-500">
          ERP 거래 데이터를 직접 입력하거나 CSV/Excel 파일을 업로드하세요. 여러 파일을 한번에 올릴 수 있습니다.
        </p>
      </div>

      <div className="card">
        <FileDropZone
          onFiles={handleFilesUpload}
          disabled={loading}
          uploadedFiles={uploadedFiles}
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={handleLoadSample} className="btn-secondary" disabled={loading}>
            샘플 데이터 불러오기
          </button>
          <button onClick={addRow} className="btn-secondary" disabled={loading}>
            + 행 추가
          </button>
          <button onClick={handleValidate} className="btn-primary ml-auto" disabled={loading}>
            {loading ? "처리 중..." : "데이터 검증"}
          </button>
        </div>

        <div className="mb-3 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <strong>필수 컬럼:</strong> {REQUIRED_COLUMNS.join(", ")} · 선택: 거래처, 비고
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-3 py-2">날짜</th>
                <th className="px-3 py-2">부서</th>
                <th className="px-3 py-2">항목</th>
                <th className="px-3 py-2">금액</th>
                <th className="px-3 py-2">수량</th>
                <th className="px-3 py-2">거래처</th>
                <th className="px-3 py-2">비고</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      className="input-field"
                      value={row.날짜}
                      onChange={(e) => updateRow(idx, "날짜", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input-field"
                      value={row.부서}
                      onChange={(e) => updateRow(idx, "부서", e.target.value)}
                      placeholder="영업"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input-field"
                      value={row.항목}
                      onChange={(e) => updateRow(idx, "항목", e.target.value)}
                      placeholder="제품A"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="input-field"
                      value={row.금액 || ""}
                      onChange={(e) => updateRow(idx, "금액", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="input-field"
                      value={row.수량 || ""}
                      onChange={(e) => updateRow(idx, "수량", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input-field"
                      value={row.거래처 || ""}
                      onChange={(e) => updateRow(idx, "거래처", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input-field"
                      value={row.비고 || ""}
                      onChange={(e) => updateRow(idx, "비고", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-red-400 hover:text-red-600"
                      title="행 삭제"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {validation && (
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold">검증 결과</h3>
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
              validation.valid
                ? "border border-green-200 bg-green-50 text-green-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {validation.valid
              ? `✅ 검증 성공 — ${validation.data.length}건의 데이터가 유효합니다.${uploadedFiles.length ? ` (${uploadedFiles.length}개 파일)` : ""}`
              : `❌ 검증 실패 — ${validation.errors.length}개의 오류가 발견되었습니다.`}
          </div>

          {validation.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-red-700">오류 목록</h4>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-100 bg-red-50">
                {validation.errors.map((err, i) => (
                  <div key={i} className="border-b border-red-100 px-4 py-2 text-xs text-red-700">
                    행 {err.row}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-amber-700">경고</h4>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-amber-100 bg-amber-50">
                {validation.warnings.map((w, i) => (
                  <div key={i} className="border-b border-amber-100 px-4 py-2 text-xs text-amber-700">
                    행 {w.row} ({w.field}): {w.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation.valid && (
            <div className="flex gap-3">
              <button onClick={() => navigate("/dashboard")} className="btn-primary">
                대시보드 보기 →
              </button>
              <button onClick={() => navigate("/report")} className="btn-secondary">
                분석보고서 보기 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
