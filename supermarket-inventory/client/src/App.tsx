import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { PosScreen } from './pages/PosScreen';
import { InventoryScreen } from './pages/InventoryScreen';
import { SalesAnalyticsScreen } from './pages/SalesAnalyticsScreen';
export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<PosScreen />} />
            <Route path="/inventory" element={<InventoryScreen />} />
            <Route path="/analytics" element={<SalesAnalyticsScreen />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}