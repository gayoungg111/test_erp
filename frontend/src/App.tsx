import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { DataProvider } from "./context/DataContext";
import AnalysisReport from "./pages/AnalysisReport";
import Dashboard from "./pages/Dashboard";
import DataInput from "./pages/DataInput";
import OriginalData from "./pages/OriginalData";

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DataInput />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="report" element={<AnalysisReport />} />
            <Route path="data" element={<OriginalData />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
