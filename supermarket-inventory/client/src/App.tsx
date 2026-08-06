import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { PosScreen } from './pages/PosScreen';
import { InventoryScreen } from './pages/InventoryScreen';
import { SalesAnalyticsScreen } from './pages/SalesAnalyticsScreen';
import { SuppliersScreen } from './pages/SuppliersScreen';
import { LoginScreen } from './pages/LoginScreen';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-semibold">
        Loading Nexus POS...
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<PosScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/analytics" element={<SalesAnalyticsScreen />} />
          <Route path="/suppliers" element={<SuppliersScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}