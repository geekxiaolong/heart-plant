import React from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Bell, Search, User, CircleUser } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <header className="flex items-center justify-between mb-8">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索植物、设备或日志..." 
              className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 border border-gray-100 hover:bg-gray-50 transition-all shadow-sm group">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-gray-900 leading-none">
                  {user?.email?.split('@')[0] || '管理员'}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
                  {user?.email || 'System Owner'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center text-white shadow-md">
                <CircleUser size={24} />
              </div>
            </div>
          </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
