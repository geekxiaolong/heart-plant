import React from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Sprout, 
  Activity, 
  BookOpen, 
  ClipboardList, 
  Settings, 
  LogOut,
  Flower2,
  History,
  Users
} from 'lucide-react';

export const Sidebar = () => {
  const { signOut } = useAuth();
  const menuItems = [
    { icon: LayoutDashboard, label: '概览', path: '/admin' },
    { icon: Sprout, label: '植物库管理', path: '/admin/plants' },
    { icon: Users, label: '已认领植物', path: '/admin/adoptions' },
    { icon: Activity, label: '实时监控', path: '/admin/monitoring' },
    { icon: History, label: '成长时间轴', path: '/admin/timeline' },
    { icon: BookOpen, label: '成长日记', path: '/admin/diary' },
    { icon: ClipboardList, label: '操作日志', path: '/admin/logs' },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <Flower2 className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">心植 HeartPlant</h1>
          <p className="text-xs text-gray-500">IoT 社交管理后台</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-green-50 text-green-600 font-medium' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-100">
        <button 
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          <span>注销会话</span>
        </button>
      </div>
    </aside>
  );
};
