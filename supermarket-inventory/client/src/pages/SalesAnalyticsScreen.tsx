import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, DollarSign, ShoppingBag, TrendingUp, RefreshCw, CreditCard } from 'lucide-react';

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Sale {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
}

export const SalesAnalyticsScreen: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales');
      setSales(res.data);
    } catch (err) {
      console.error('Failed to load sales analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Compute Metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  return (
    <div className="flex-1 p-6 bg-slate-100 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-emerald-600" /> Sales & Analytics
        </h1>
        <button
          onClick={fetchSales}
          className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition font-medium text-sm shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">${totalRevenue.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Orders</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalOrders}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Avg. Order Value</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">${avgOrderValue.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Items Sold</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalItemsSold}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Recent Sales Transactions
          </h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Items Purchased</th>
              <th className="p-4">Payment Method</th>
              <th className="p-4 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                  {loading ? 'Loading sales history...' : 'No transactions recorded yet.'}
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-xs text-slate-500">{sale.id.substring(0, 8)}...</td>
                  <td className="p-4 text-slate-600">
                    {new Date(sale.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {sale.items?.map((item) => (
                        <span key={item.id} className="text-xs text-slate-700 font-medium">
                          {item.product?.name || 'Product'} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 uppercase">
                      {sale.paymentMethod || 'CASH'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-600">
                    ${Number(sale.totalAmount).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};