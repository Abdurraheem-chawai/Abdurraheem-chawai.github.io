import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Users, Store, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'POS Checkout', path: '/', icon: ShoppingCart },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Sales & Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Suppliers', path: '/suppliers', icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
        <Store className="w-8 h-8 text-emerald-400" />
        <div>
          <h1 className="font-bold text-lg leading-tight">Nexus POS</h1>
          <p className="text-xs text-slate-400">Supermarket ERP</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Active User Footer & Logout */}
      <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-300 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-100 truncate">{user?.name || 'Cashier'}</p>
            <p className="text-[10px] text-emerald-400 uppercase font-bold">{user?.role || 'Staff'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Log Out"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-md transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};