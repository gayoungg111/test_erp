import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "../components/EmptyState";
import { useData } from "../context/DataContext";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"];

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isValidated, summary, data } = useData();

  if (!isValidated || data.length === 0) {
    return (
      <EmptyState
        title="아직 불러온 erp 데이터가 없습니다"
        actionLabel="데이터 입력하러가기"
        onAction={() => navigate("/")}
      />
    );
  }

  const deptChart = (summary.byDepartment || []).map((d) => ({
    name: d.부서,
    금액: d.총금액,
    수량: d.총수량,
  }));

  const monthChart = (summary.byMonth || []).map((m) => ({
    name: m.월,
    금액: m.총금액,
    건수: m.건수,
  }));

  const itemChart = (summary.byItem || []).slice(0, 6).map((item) => ({
    name: item.항목,
    value: item.총금액,
  }));

  const stats = [
    { label: "총 거래 건수", value: `${summary.totalRecords?.toLocaleString()}건`, icon: "📋" },
    { label: "총 금액", value: `${summary.totalAmount?.toLocaleString()}원`, icon: "💰" },
    { label: "총 수량", value: summary.totalQuantity?.toLocaleString(), icon: "📦" },
    { label: "평균 거래금액", value: `${Math.round(summary.avgAmount || 0).toLocaleString()}원`, icon: "📈" },
    { label: "부서 수", value: `${summary.departmentCount}개`, icon: "🏢" },
    { label: "분석 기간", value: summary.dateRange ? `${summary.dateRange.start} ~ ${summary.dateRange.end}` : "-", icon: "📅" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">대시보드</h2>
        <p className="mt-1 text-sm text-slate-500">
          검증된 ERP 데이터를 기반으로 한 실시간 분석 현황입니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="mb-2 text-2xl">{stat.icon}</div>
            <div className="text-xs font-medium text-slate-500">{stat.label}</div>
            <div className="mt-1 text-lg font-bold text-slate-800">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-base font-semibold">부서별 금액</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()}원`, "금액"]} />
              <Bar dataKey="금액" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-base font-semibold">월별 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()}원`, "금액"]} />
              <Legend />
              <Line type="monotone" dataKey="금액" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-base font-semibold">항목별 비중 (Top 6)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={itemChart}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {itemChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()}원`, "금액"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-base font-semibold">부서별 수량</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [v.toLocaleString(), "수량"]} />
              <Bar dataKey="수량" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
