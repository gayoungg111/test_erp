import { useRef, useState } from "react";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  uploadedFiles?: string[];
}

export default function FileDropZone({
  onFiles,
  disabled = false,
  uploadedFiles = [],
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length || disabled) return;
    onFiles(Array.from(fileList));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="mb-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="text-4xl opacity-50">📂</div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          {isDragging ? "여기에 파일을 놓으세요" : "파일을 끌어다 놓거나 클릭하여 선택"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          CSV / Excel 파일 · 여러 개 동시 업로드 가능
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {uploadedFiles.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              📄 {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
