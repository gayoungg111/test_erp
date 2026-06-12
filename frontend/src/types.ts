export interface ErpRecord {
  날짜: string;
  부서: string;
  항목: string;
  금액: number;
  수량: number;
  거래처?: string;
  비고?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: Summary;
  data: ErpRecord[];
}

export interface Summary {
  totalRecords?: number;
  totalAmount?: number;
  totalQuantity?: number;
  avgAmount?: number;
  departmentCount?: number;
  itemCount?: number;
  dateRange?: { start: string; end: string };
  byDepartment?: Array<{
    부서: string;
    총금액: number;
    총수량: number;
    건수: number;
  }>;
  byItem?: Array<{
    항목: string;
    총금액: number;
    총수량: number;
  }>;
  byMonth?: Array<{
    월: string;
    총금액: number;
    건수: number;
  }>;
  topCustomers?: Array<{
    거래처: string;
    총금액: number;
  }>;
}

export const EMPTY_RECORD: ErpRecord = {
  날짜: "",
  부서: "",
  항목: "",
  금액: 0,
  수량: 0,
  거래처: "",
  비고: "",
};

export const REQUIRED_COLUMNS = ["날짜", "부서", "항목", "금액", "수량"];
