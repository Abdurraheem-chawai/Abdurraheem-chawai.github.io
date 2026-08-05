import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { PosScreen } from './pages/PosScreen';

const InventoryScreen = () => <div className="p-8"><h1 className="text-2xl font-bold">📦 Multi-Branch Inventory</h1></div>;
const AnalyticsScreen = () => <div className="p-8"><h1 className="text-2xl font-bold">📊 Real-Time Sales & Revenue Analytics</h1></div>;
const SuppliersScreen = () => <div className="p-8"><h1 className="text-2xl font-bold">🤝 Supplier Directory</h1></div>;

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<PosScreen />} />
            <Route path="/inventory" element={<InventoryScreen />} />
            <Route path="/analytics" element={<AnalyticsScreen />} />
            <Route path="/suppliers" element={<SuppliersScreen />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}