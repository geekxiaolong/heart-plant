import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Leaf,
  Award,
  Crown,
  Shield,
  X,
  UserCheck,
  UserX,
  TrendingUp,
  Users as UsersIcon
} from 'lucide-react';
import { cn } from '../utils/cn';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  status: 'active' | 'inactive' | 'banned';
  role: 'admin' | 'user' | 'vip';
  plantsCount: number;
  joinDate: string;
  lastActive: string;
  achievements: number;
}

const MOCK_USERS: User[] = [
  {
    id: 1,
    name: '阿强',
    email: 'aqiang@example.com',
    phone: '138****8888',
    location: '深圳',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1080',
    status: 'active',
    role: 'admin',
    plantsCount: 3,
    joinDate: '2024-01-15',
    lastActive: '2 分钟前',
    achievements: 12
  },
  {
    id: 2,
    name: '小芳',
    email: 'xiaofang@example.com',
    phone: '139****6666',
    location: '广州',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1080',
    status: 'active',
    role: 'vip',
    plantsCount: 5,
    joinDate: '2024-02-01',
    lastActive: '10 分钟前',
    achievements: 8
  },
  {
    id: 3,
    name: '妈妈',
    email: 'mama@example.com',
    phone: '136****9999',
    location: '北京',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1080',
    status: 'active',
    role: 'user',
    plantsCount: 2,
    joinDate: '2024-01-20',
    lastActive: '1 小时前',
    achievements: 5
  },
  {
    id: 4,
    name: '大头',
    email: 'datou@example.com',
    phone: '137****7777',
    location: '上海',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1080',
    status: 'active',
    role: 'user',
    plantsCount: 4,
    joinDate: '2024-02-10',
    lastActive: '2 小时前',
    achievements: 6
  },
  {
    id: 5,
    name: '二狗',
    email: 'ergou@example.com',
    phone: '135****5555',
    location: '成都',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1080',
    status: 'inactive',
    role: 'user',
    plantsCount: 1,
    joinDate: '2024-01-10',
    lastActive: '3 天前',
    achievements: 3
  },
  {
    id: 6,
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '134****4444',
    location: '杭州',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1080',
    status: 'banned',
    role: 'user',
    plantsCount: 0,
    joinDate: '2024-01-05',
    lastActive: '15 天前',
    achievements: 0
  }
];

const USER_GROWTH_DATA = [
  { month: '9月', users: 12 },
  { month: '10月', users: 19 },
  { month: '11月', users: 28 },
  { month: '12月', users: 42 },
  { month: '1月', users: 65 },
  { month: '2月', users: 89 },
  { month: '3月', users: 124 },
];

const ACTIVITY_DATA = [
  { day: '周一', active: 45 },
  { day: '周二', active: 52 },
  { day: '周三', active: 48 },
  { day: '周四', active: 61 },
  { day: '周五', active: 55 },
  { day: '周六', active: 67 },
  { day: '周日', active: 72 },
];

export function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'banned'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    banned: users.filter(u => u.status === 'banned').length,
    vip: users.filter(u => u.role === 'vip').length,
  };

  const handleAddUser = (newUser: Omit<User, 'id' | 'plantsCount' | 'joinDate' | 'lastActive' | 'achievements'>) => {
    const user: User = {
      ...newUser,
      id: Math.max(...users.map(u => u.id)) + 1,
      plantsCount: 0,
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: '刚刚',
      achievements: 0,
    };
    setUsers([...users, user]);
    setShowAddModal(false);
  };

  return (
    <motion.div
      key="users"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard label="总用户数" value={stats.total} icon={UsersIcon} color="blue" trend="+12 本月" />
        <StatsCard label="活跃用户" value={stats.active} icon={UserCheck} color="green" trend="+5 本周" />
        <StatsCard label="不活跃" value={stats.inactive} icon={UserX} color="amber" />
        <StatsCard label="已封禁" value={stats.banned} icon={Ban} color="red" />
        <StatsCard label="VIP 用户" value={stats.vip} icon={Crown} color="purple" trend="+2 本月" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-black mb-6">用户增长趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={USER_GROWTH_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <YAxis style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontWeight: 'bold'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-black mb-6">每周活跃度</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ACTIVITY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <YAxis style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontWeight: 'bold'
                }} 
              />
              <Bar dataKey="active" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索用户名、邮箱、地区..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilterStatus('all')}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-bold transition-all",
                filterStatus === 'all' 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
            >
              全部
            </button>
            <button 
              onClick={() => setFilterStatus('active')}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-bold transition-all",
                filterStatus === 'active' 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
            >
              活跃
            </button>
            <button 
              onClick={() => setFilterStatus('inactive')}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-bold transition-all",
                filterStatus === 'inactive' 
                  ? "bg-amber-100 text-amber-700" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
            >
              不活跃
            </button>
            <button 
              onClick={() => setFilterStatus('banned')}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-bold transition-all",
                filterStatus === 'banned' 
                  ? "bg-red-100 text-red-700" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
            >
              已封禁
            </button>
          </div>
          <button className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-all" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span className="hidden sm:inline">添加用户</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">用户</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">联系方式</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">植物数</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">成就</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">最后活跃</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate flex items-center gap-2">
                          {user.name}
                          {user.role === 'admin' && (
                            <Shield size={14} className="text-red-500" />
                          )}
                          {user.role === 'vip' && (
                            <Crown size={14} className="text-amber-500" />
                          )}
                        </p>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <MapPin size={12} />
                          {user.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                        <Mail size={12} />
                        {user.email}
                      </p>
                      <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                        <Phone size={12} />
                        {user.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      user.role === 'admin' && "bg-red-100 text-red-700",
                      user.role === 'vip' && "bg-amber-100 text-amber-700",
                      user.role === 'user' && "bg-gray-100 text-gray-700"
                    )}>
                      {user.role === 'admin' ? '管理员' : user.role === 'vip' ? 'VIP' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Leaf size={14} className="text-green-500" />
                      {user.plantsCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Award size={14} className="text-yellow-500" />
                      {user.achievements}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-xs text-gray-500 font-medium">{user.lastActive}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.status === 'active' ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        <CheckCircle size={12} />
                        活跃
                      </span>
                    ) : user.status === 'inactive' ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        <UserX size={12} />
                        不活跃
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                        <Ban size={12} />
                        已封禁
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onAddUser={handleAddUser} />
      )}
    </motion.div>
  );
}

function StatsCard({ label, value, icon: Icon, color, trend }: any) {
  const colorMap: any = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-3xl font-black mt-2">{value}</p>
          {trend && (
            <p className={cn("text-xs font-bold mt-2 flex items-center gap-1", colorMap[color]?.text || 'text-gray-600')}>
              <TrendingUp size={14} />
              {trend}
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          colorMap[color]?.bg || 'bg-gray-100',
          colorMap[color]?.text || 'text-gray-600'
        )}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: User, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-4 border-white/30">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                {user.name}
                {user.role === 'admin' && (
                  <span className="px-3 py-1 bg-red-500/20 backdrop-blur-sm rounded-full text-xs font-black flex items-center gap-1 border border-white/20">
                    <Shield size={14} />
                    管理员
                  </span>
                )}
                {user.role === 'vip' && (
                  <span className="px-3 py-1 bg-amber-500/20 backdrop-blur-sm rounded-full text-xs font-black flex items-center gap-1 border border-white/20">
                    <Crown size={14} />
                    VIP
                  </span>
                )}
              </h2>
              <p className="text-sm opacity-90 flex items-center gap-2">
                <Calendar size={14} />
                加入于 {user.joinDate}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">邮箱</p>
              <p className="text-sm font-bold flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                {user.email}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">手机</p>
              <p className="text-sm font-bold flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                {user.phone}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">地区</p>
              <p className="text-sm font-bold flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                {user.location}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">最后活跃</p>
              <p className="text-sm font-bold">{user.lastActive}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <Leaf size={24} className="mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-black text-green-600">{user.plantsCount}</p>
              <p className="text-xs font-bold text-gray-500 uppercase mt-1">植物</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <Award size={24} className="mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-black text-amber-600">{user.achievements}</p>
              <p className="text-xs font-bold text-gray-500 uppercase mt-1">成就</p>
            </div>
            <div className={cn(
              "rounded-2xl p-4 text-center",
              user.status === 'active' ? "bg-green-50" : user.status === 'inactive' ? "bg-amber-50" : "bg-red-50"
            )}>
              {user.status === 'active' ? (
                <>
                  <CheckCircle size={24} className="mx-auto mb-2 text-green-600" />
                  <p className="text-lg font-black text-green-600">活跃</p>
                </>
              ) : user.status === 'inactive' ? (
                <>
                  <UserX size={24} className="mx-auto mb-2 text-amber-600" />
                  <p className="text-lg font-black text-amber-600">不活跃</p>
                </>
              ) : (
                <>
                  <Ban size={24} className="mx-auto mb-2 text-red-600" />
                  <p className="text-lg font-black text-red-600">已封禁</p>
                </>
              )}
              <p className="text-xs font-bold text-gray-500 uppercase mt-1">状态</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              编辑用户
            </button>
            <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
              查看详情
            </button>
            {user.status === 'active' && (
              <button className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">
                封禁
              </button>
            )}
            {user.status === 'banned' && (
              <button className="px-6 py-3 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 transition-colors">
                解封
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AddUserModal({ onClose, onAddUser }: { onClose: () => void, onAddUser: (newUser: Omit<User, 'id' | 'plantsCount' | 'joinDate' | 'lastActive' | 'achievements'>) => void }) {
  const [newUser, setNewUser] = useState<Omit<User, 'id' | 'plantsCount' | 'joinDate' | 'lastActive' | 'achievements'>>({
    name: '',
    email: '',
    phone: '',
    location: '',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1080',
    status: 'active',
    role: 'user',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(newUser);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-4 border-white/30">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1080" alt="New User" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2">添加新用户</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase mb-1">用户名</p>
                <input
                  type="text"
                  placeholder="用户名"
                  name="name"
                  value={newUser.name}
                  onChange={handleChange}
                  className="w-full pl-2 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                />
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase mb-1">邮箱</p>
                <input
                  type="email"
                  placeholder="邮箱"
                  name="email"
                  value={newUser.email}
                  onChange={handleChange}
                  className="w-full pl-2 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                />
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase mb-1">手机</p>
                <input
                  type="text"
                  placeholder="手机"
                  name="phone"
                  value={newUser.phone}
                  onChange={handleChange}
                  className="w-full pl-2 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                />
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase mb-1">地区</p>
                <input
                  type="text"
                  placeholder="地区"
                  name="location"
                  value={newUser.location}
                  onChange={handleChange}
                  className="w-full pl-2 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                />
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase mb-1">角色</p>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleChange}
                  className="w-full pl-2 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                >
                  <option value="user">普通用户</option>
                  <option value="vip">VIP</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase mb-1">状态</p>
                <select
                  name="status"
                  value={newUser.status}
                  onChange={handleChange}
                  className="w-full pl-2 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                >
                  <option value="active">活跃</option>
                  <option value="inactive">不活跃</option>
                  <option value="banned">已封禁</option>
                </select>
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="flex gap-3">
            <button 
              onClick={handleSubmit}
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              添加用户
            </button>
            <button 
              onClick={onClose}
              type="button"
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}