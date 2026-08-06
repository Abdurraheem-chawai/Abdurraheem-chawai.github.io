import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, PlusCircle, RefreshCw, Plus } from 'lucide-react';

interface InventoryItem {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    sellingPrice?: number;
  };
  branch: {
    id: string;
    name: string;
  };
}

export const InventoryScreen: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState<number>(10);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('50');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setInventory(res.data);
    } catch (err: any) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.post('/inventory/stock-in', {
        productId: selectedItem.productId,
        branchId: selectedItem.branchId,
        quantity: addQty,
      });

      setMessage({ type: 'success', text: `Successfully added ${addQty} units to ${selectedItem.product.name}!` });
      setSelectedItem(null);
      fetchInventory();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update stock.' });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: newName,
        sku: newSku,
        price: Number(newPrice),
        initialStock: Number(newStock),
      });

      setMessage({ type: 'success', text: `Product "${newName}" created successfully!` });
      setIsAddModalOpen(false);
      setNewName('');
      setNewSku('');
      setNewPrice('');
      setNewStock('50');
      fetchInventory();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create product.' });
    }
  };

  return (
    <div className="flex-1 p-6 bg-slate-100 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-7 h-7 text-emerald-600" /> Inventory Management
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition font-medium text-sm shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div
          className={`p-4 mb-6 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="p-4">SKU</th>
              <th className="p-4">Product Name</th>
              <th className="p-4">Branch</th>
              <th className="p-4">Unit Price</th>
              <th className="p-4 text-center">Stock Level</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  {loading ? 'Loading inventory...' : 'No inventory items found.'}
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-xs text-slate-500">{item.product?.sku || 'N/A'}</td>
                  <td className="p-4 font-semibold text-slate-800">{item.product?.name || 'Unknown'}</td>
                  <td className="p-4 text-slate-600">{item.branch?.name || 'Main Branch'}</td>
                  <td className="p-4 font-medium text-slate-700">${Number(item.product?.sellingPrice ?? item.product?.price?? 0.).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        item.quantity < 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.quantity} in stock
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                    >
                      <PlusCircle className="w-4 h-4" /> Stock In
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pepsi 330ml Can"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SKU / Code</label>
                <input
                  type="text"
                  placeholder="e.g. BEV-PEPSI-330"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.25"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Restock / Stock In</h3>
            <p className="text-sm text-slate-500 mb-4">
              Add new stock for <span className="font-semibold text-slate-700">{selectedItem.product.name}</span>. Current stock is <span className="font-bold text-slate-800">{selectedItem.quantity}</span>.
            </p>

            <form onSubmit={handleStockIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  value={addQty}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                >
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};