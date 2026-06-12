import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "데이터 입력", icon: "📥" },
  { to: "/dashboard", label: "대시보드", icon: "📊" },
  { to: "/report", label: "분석보고서", icon: "📄" },
  { to: "/data", label: "원본데이터", icon: "🗂️" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 flex h-full w-64 flex-col bg-primary-800 text-white shadow-xl">
        <div className="border-b border-primary-700 px-6 py-6">
          <h1 className="text-xl font-bold">ERP 분석 서비스</h1>
          <p className="mt-1 text-xs text-primary-100">데이터 검증 · 대시보드 · 보고서</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-primary-800 shadow-md"
                    : "text-primary-100 hover:bg-primary-700 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-primary-700 px-6 py-4 text-xs text-primary-200">
          ERP Analyzer v1.0
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
