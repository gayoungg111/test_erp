import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { useData } from "../context/DataContext";

export default function OriginalData() {
  const navigate = useNavigate();
  const { isValidated, data } = useData();

  if (!isValidated || data.length === 0) {
    return (
      <EmptyState
        title="아직 불러온 erp 데이터가 없습니다"
        actionLabel="데이터 입력하러가기"
        onAction={() => navigate("/")}
      />
    );
  }

  const totalAmount = data.reduce((sum, r) => sum + r.금액, 0);
  const totalQty = data.reduce((sum, r) => sum + r.수량, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">원본데이터</h2>
          <p className="mt-1 text-sm text-slate-500">
            검증을 통과한 ERP 원본 데이터 {data.length}건을 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
            총 금액: {totalAmount.toLocaleString()}원
          </span>
          <span className="rounded-lg bg-purple-50 px-3 py-1.5 font-medium text-purple-700">
            총 수량: {totalQty.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">날짜</th>
              <th className="px-4 py-3">부서</th>
              <th className="px-4 py-3">항목</th>
              <th className="px-4 py-3 text-right">금액</th>
              <th className="px-4 py-3 text-right">수량</th>
              <th className="px-4 py-3">거래처</th>
              <th className="px-4 py-3">비고</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                <td className="px-4 py-2.5">{row.날짜}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {row.부서}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-medium">{row.항목}</td>
                <td className="px-4 py-2.5 text-right">{row.금액.toLocaleString()}원</td>
                <td className="px-4 py-2.5 text-right">{row.수량.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-slate-600">{row.거래처 || "-"}</td>
                <td className="px-4 py-2.5 text-slate-500">{row.비고 || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
