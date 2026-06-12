import { useEffect, useRef, useState } from "react";

export type DownloadFormat = "word" | "excel" | "pdf";

interface DownloadMenuProps {
  onDownload: (format: DownloadFormat) => void;
  disabled?: boolean;
  loading?: DownloadFormat | null;
}

const OPTIONS: { format: DownloadFormat; label: string; desc: string }[] = [
  { format: "word", label: "Word 파일", desc: ".doc" },
  { format: "excel", label: "Excel 파일", desc: ".xlsx" },
  { format: "pdf", label: "PDF 파일", desc: ".pdf" },
];

export default function DownloadMenu({ onDownload, disabled, loading }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (format: DownloadFormat) => {
    setOpen(false);
    onDownload(format);
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary inline-flex items-center gap-1.5 whitespace-nowrap"
        disabled={disabled || loading != null}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {loading ? (
          <>다운로드 중...</>
        ) : (
          <>
            <span aria-hidden>📥</span>
            다운로드
            <svg
              className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && !loading && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
        >
          {OPTIONS.map(({ format, label, desc }) => (
            <button
              key={format}
              type="button"
              onClick={() => handleSelect(format)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <span className="font-medium">{label}</span>
              <span className="text-xs text-slate-400">{desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
