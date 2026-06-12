import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileDropZone from "../components/FileDropZone";
import { useData } from "../context/DataContext";
import {
  parseUploadedFiles,
  SAMPLE_DATA,
  validateErpData,
} from "../services/analyzer";
import { REQUIRED_COLUMNS } from "../types";

export default function DataInput() {
  const navigate = useNavigate();
  const { setValidation, validation } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const applyValidation = (result: ReturnType<typeof validateErpData>, fileNames: string[] = []) => {
    setValidation(result);
    if (fileNames.length) setUploadedFiles(fileNames);
  };

  const handleFilesUpload = async (files: File[]) => {
    setLoading(true);
    setError("");
    try {
      const { records, fileNames } = await parseUploadedFiles(files);
      setUploadedFiles(fileNames);
      applyValidation(validateErpData(records), fileNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setLoading(true);
    setError("");
    setUploadedFiles(["샘플 데이터"]);
    try {
      applyValidation(validateErpData(SAMPLE_DATA.map((r) => ({ ...r }))));
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
          CSV/Excel 파일을 업로드하면 대시보드·분석보고서·원본데이터가 자동으로 채워집니다.
        </p>
      </div>

      <div className="card">
        <FileDropZone
          onFiles={handleFilesUpload}
          disabled={loading}
          uploadedFiles={uploadedFiles}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleLoadSample} className="btn-secondary" disabled={loading}>
            샘플 데이터 불러오기
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <strong>필수 컬럼:</strong> {REQUIRED_COLUMNS.join(", ")} · 선택: 거래처, 비고
        </div>
      </div>

      {loading && (
        <div className="card py-8 text-center text-sm text-slate-500">
          파일을 분석하고 있습니다...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {validation && !loading && (
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
              ? `✅ 검증 성공 — ${validation.data.length}건의 데이터가 반영되었습니다.${uploadedFiles.length ? ` (${uploadedFiles.length}개 파일)` : ""} 아래 메뉴에서 확인하세요.`
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
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/dashboard")} className="btn-primary">
                대시보드 보기 →
              </button>
              <button onClick={() => navigate("/report")} className="btn-secondary">
                분석보고서 보기 →
              </button>
              <button onClick={() => navigate("/data")} className="btn-secondary">
                원본데이터 보기 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
