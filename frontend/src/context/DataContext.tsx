import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ErpRecord, Summary, ValidationResult } from "../types";

interface DataContextType {
  data: ErpRecord[];
  summary: Summary;
  validation: ValidationResult | null;
  isValidated: boolean;
  geminiReport: string | null;
  setData: (data: ErpRecord[]) => void;
  setValidation: (result: ValidationResult) => void;
  setGeminiReport: (report: string | null) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<ErpRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [validation, setValidationState] = useState<ValidationResult | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [geminiReport, setGeminiReportState] = useState<string | null>(null);

  const setData = (newData: ErpRecord[]) => {
    setDataState(newData);
    setIsValidated(false);
    setValidationState(null);
    setSummary({});
    setGeminiReportState(null);
  };

  const setValidation = (result: ValidationResult) => {
    setValidationState(result);
    setIsValidated(result.valid);
    setGeminiReportState(null);
    if (result.valid) {
      setDataState(result.data);
      setSummary(result.summary);
    }
  };

  const setGeminiReport = (report: string | null) => {
    setGeminiReportState(report);
  };

  const clearData = () => {
    setDataState([]);
    setSummary({});
    setValidationState(null);
    setIsValidated(false);
    setGeminiReportState(null);
  };

  return (
    <DataContext.Provider
      value={{
        data,
        summary,
        validation,
        isValidated,
        geminiReport,
        setData,
        setValidation,
        setGeminiReport,
        clearData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
