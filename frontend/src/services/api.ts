import type { ErpRecord, ValidationResult } from "../types";

export async function validateData(data: ErpRecord[]): Promise<ValidationResult> {
  const { validateErpData } = await import("./analyzer");
  return validateErpData(data);
}

export async function uploadFile(file: File): Promise<ValidationResult> {
  const { parseUploadedFile, validateErpData } = await import("./analyzer");
  const records = await parseUploadedFile(file);
  return validateErpData(records);
}

export async function fetchSampleData(): Promise<ErpRecord[]> {
  const { SAMPLE_DATA } = await import("./analyzer");
  return SAMPLE_DATA.map((r) => ({ ...r }));
}

export { generateGeminiReport, downloadReportAsPdf, downloadReportAsWord } from "./gemini";
