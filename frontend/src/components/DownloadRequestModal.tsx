import { useEffect, useState } from "react";
import type { DownloadFormat } from "./DownloadMenu";
import { saveDownloadRequest, validateDownloadForm } from "../services/downloadRequest";

const FORMAT_LABELS: Record<DownloadFormat, string> = {
  word: "Word (.doc)",
  excel: "Excel (.xlsx)",
  pdf: "PDF (.pdf)",
};

interface DownloadRequestModalProps {
  format: DownloadFormat;
  recordCount?: number;
  onClose: () => void;
  onSuccess: (info: { email: string; nickname: string }) => Promise<void>;
}

export default function DownloadRequestModal({
  format,
  recordCount,
  onClose,
  onSuccess,
}: DownloadRequestModalProps) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateDownloadForm(email, nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await saveDownloadRequest({
        email: email.trim(),
        nickname: nickname.trim(),
        format,
        recordCount,
      });
      onClose();
      await onSuccess({ email: email.trim(), nickname: nickname.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => !submitting && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 id="download-modal-title" className="text-lg font-bold text-slate-800">
              보고서 받아보기
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {FORMAT_LABELS[format]} 형식으로 다운로드합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="download-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              이메일
            </label>
            <input
              id="download-email"
              type="email"
              className="input-field"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="download-nickname" className="mb-1.5 block text-sm font-medium text-slate-700">
              닉네임
            </label>
            <input
              id="download-nickname"
              type="text"
              className="input-field"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={submitting}
              maxLength={50}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              취소
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? "처리 중..." : "받아보기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
