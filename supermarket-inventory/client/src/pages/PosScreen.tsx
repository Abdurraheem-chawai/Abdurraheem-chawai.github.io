import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface Inventory {
  quantity: number;
  branchId: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  inventories: Inventory[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err: any) {
      console.error('Failed to load products', err);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.product.sellingPrice) * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    setMessage(null);

    // 1. Try to get branchId from cart product inventory
    let targetBranchId = cart[0]?.product.inventories?.[0]?.branchId;

    // 2. If product.inventories is empty, try pulling first branch or fall back to standard UUID
    if (!targetBranchId) {
      try {
        const branchRes = await api.get('/branches');
        if (branchRes.data && branchRes.data.length > 0) {
          targetBranchId = branchRes.data[0].id;
        }
      } catch (err) {
        // Fallback ID if branches route isn't loaded
      }
    }

    if (!targetBranchId) {
      targetBranchId = 'main-branch-uuid';
    }

    try {
      const payload = {
        branchId: targetBranchId,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      await api.post('/sales/checkout', payload, {
  headers: {
    Authorization: 'Bearer mock-dev-token-123',
  },
});
      setMessage({ type: 'success', text: 'Checkout completed successfully!' });
      setCart([]);
      fetchProducts(); // Refresh inventory stock levels
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Checkout failed. Check stock levels or backend route.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Left Column: Product Selection Grid */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-emerald-600" /> POS Cashier Register
          </h1>

          {/* Search Box */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
            <input
              id="pos-search-input"
              name="search"
              type="text"
              placeholder="Search product or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        {products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <p className="text-base font-medium">No products found in inventory.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
            {filteredProducts.map((product) => {
            const currentStock = product.inventories?.[0]?.quantity ?? 0;

              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={currentStock <= 0}
                  className={`p-4 bg-white rounded-xl shadow-sm border text-left flex flex-col justify-between transition-all ${
                    currentStock > 0
                      ? 'hover:shadow-md border-slate-200 hover:border-emerald-500 cursor-pointer'
                      : 'opacity-50 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                    <h3 className="font-semibold text-slate-800 text-sm mt-1">{product.name}</h3>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-3 border-slate-100">
                    <span className="text-emerald-600 font-bold">
                      ${Number(product.sellingPrice).toFixed(2)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        currentStock > 10
                          ? 'bg-emerald-100 text-emerald-700'
                          : currentStock > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      Stock: {currentStock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Shopping Cart & Checkout Panel */}
      <div className="w-96 bg-white border-l border-slate-200 p-6 flex flex-col justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Current Order</h2>

          {/* Feedback Messages */}
          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-sm flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No items in order cart</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex-1 pr-2">
                    <h4 className="text-sm font-medium text-slate-800">{item.product.name}</h4>
                    <p className="text-xs text-slate-500">
                      ${Number(item.product.sellingPrice).toFixed(2)} x {item.quantity}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 hover:bg-rose-100 text-rose-600 rounded ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Summary & Action */}
        <div className="pt-4 border-t border-slate-200">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'CARD', 'TRANSFER'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 text-xs font-medium rounded border transition-colors cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-emerald-600">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 shadow cursor-pointer"
          >
            {loading ? 'Processing...' : 'Complete Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};