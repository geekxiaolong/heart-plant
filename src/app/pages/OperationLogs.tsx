import React, { useState } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Terminal,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  ArrowDownToLine,
  RefreshCcw
} from 'lucide-react';

const mockLogs = [
  { id: 1, type: 'info', action: '名录更新', details: '更新了 "银皇后" 的养护指南和展示图片', operator: 'Admin_Chen', time: '2024-03-02 14:23:45' },
  { id: 2, type: 'success', action: '新认领开启', details: '用户 ID 20394 成功认领 "琴叶榕"', operator: 'System', time: '2024-03-02 13:58:12' },
  { id: 3, type: 'warning', action: '传感器预警', details: '设备 DB-0192 (晨露多肉) 湿度低于临界值 20%', operator: 'IoT_Monitor', time: '2024-03-02 12:45:30' },
  { id: 4, type: 'info', action: '名录添加', details: '新植物 "仙人掌" 已添加到植物库', operator: 'Admin_Wang', time: '2024-03-02 11:30:00' },
  { id: 5, type: 'danger', action: '登录异常', details: '尝试从非法 IP 221.4.1.2 登录后台', operator: 'Security_Bot', time: '2024-03-02 10:15:22' },
  { id: 6, type: 'info', action: '数据导出', details: '导出 2024 年 2 月成长日记报告', operator: 'Admin_Chen', time: '2024-03-02 09:45:00' },
  { id: 7, type: 'success', action: '系统维护', details: '完成数据库例行优化与清理', operator: 'DevOps', time: '2024-03-02 04:00:15' },
  { id: 8, type: 'warning', action: '设备下线', details: '设备 DB-0583 (琴叶榕) 失去连接超过 15 分钟', operator: 'IoT_Monitor', time: '2024-03-02 02:30:44' },
];

export const OperationLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'warning': return <AlertCircle size={16} className="text-orange-500" />;
      case 'danger': return <XCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getLogBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50/50';
      case 'warning': return 'bg-orange-50/50';
      case 'danger': return 'bg-red-50/50';
      default: return 'bg-blue-50/50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">系统操作日志</h2>
          <p className="text-sm text-gray-500 mt-1 italic">所有管理操作、IoT 预警及安全事件的审计踪迹</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm">
            <ArrowDownToLine size={16} />
            导出 CSV
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm">
            <RefreshCcw size={16} />
            刷新
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="搜索日志详情或操作人..." 
                className="bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-green-500/20 w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-gray-50 border-none rounded-xl py-2.5 px-4 text-xs focus:ring-2 focus:ring-green-500/20"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">所有事件类型</option>
              <option value="info">常规通知</option>
              <option value="success">操作成功</option>
              <option value="warning">运行警告</option>
              <option value="danger">安全风险</option>
            </select>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> 2024-03-02</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> 最近 24 小时</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">事件级别</th>
                <th className="px-6 py-4">动作类型</th>
                <th className="px-6 py-4">详细详情</th>
                <th className="px-6 py-4">操作者</th>
                <th className="px-6 py-4">记录时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 w-fit px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getLogBg(log.type)}`}>
                      {getLogIcon(log.type)}
                      <span className={
                        log.type === 'success' ? 'text-green-600' : 
                        log.type === 'warning' ? 'text-orange-600' : 
                        log.type === 'danger' ? 'text-red-600' : 'text-blue-600'
                      }>
                        {log.type === 'info' ? '常规' : log.type === 'success' ? '成功' : log.type === 'warning' ? '警告' : '风险'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600 max-w-md line-clamp-1">{log.details}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                        {log.operator?.[0] || 'S'}
                      </div>
                      <span className="text-xs font-bold text-gray-700">{log.operator}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400 font-medium tabular-nums">{log.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400 italic">共显示 8 条记录，最近同步：1 分钟前</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-50 text-gray-400 rounded-md text-xs font-bold cursor-not-allowed">上一页</button>
            <button className="px-3 py-1 bg-white border border-gray-100 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-50 transition-all">下一页</button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
          <Terminal size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-1 leading-none">安全审计提示</h4>
          <p className="text-xs text-gray-500 leading-relaxed max-w-2xl mt-2">
            系统当前每 24 小时会自动清理过期 90 天以上的常规日志。如果您需要进行长期存档，请使用顶部的 "导出 CSV" 功能。
            如发现大量 "登录异常" 日志，请立即更新管理员密码并检查 API 访问限制。
          </p>
        </div>
      </div>
    </div>
  );
};

const XCircle = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
