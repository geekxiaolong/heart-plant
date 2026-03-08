import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { NavLink } from 'react-router';
import { UsersTab } from '../components/UsersTab';
import { PlantsTab } from '../components/PlantsTab';
import { ClaimedPlantsTab } from '../components/ClaimedPlantsTab';
import { ClaimedPlantDetail } from '../components/ClaimedPlantDetail';
import { useNavigate } from 'react-router';
import { apiGet } from '../utils/api';

type Tab = 'overview' | 'plants' | 'claimed_plants' | 'sensors' | 'users' | 'settings';

interface Plant {
  id: number;
  name: string;
  type: string;
  health: number;
  temp: number;
  humidity: number;
  owners: string[];
  tag: string;
  alert: boolean;
  days: number;
  lastWatered?: string;
  image: string;
}

const MOCK_SENSOR_DATA = [
  { time: '00:00', temp: 22, humidity: 45, light: 300 },
  { time: '04:00', temp: 21, humidity: 48, light: 50 },
  { time: '08:00', temp: 23, humidity: 42, light: 800 },
  { time: '12:00', temp: 26, humidity: 38, light: 1200 },
  { time: '16:00', temp: 25, humidity: 40, light: 900 },
  { time: '20:00', temp: 23, humidity: 44, light: 400 },
];

const MOCK_PLANT_DISTRIBUTION = [
  { name: '悦己', value: 1, color: '#2F4F4F' },
  { name: '亲情', value: 1, color: '#FFBB00' },
  { name: '爱情', value: 1, color: '#D946EF' },
  { name: '友情', value: 1, color: '#22C55E' },
];

const MOCK_HEALTH_TREND = [
  { date: '2/24', avg: 85 },
  { date: '2/25', avg: 87 },
  { date: '2/26', avg: 86 },
  { date: '2/27', avg: 88 },
  { date: '2/28', avg: 90 },
  { date: '3/1', avg: 89 },
  { date: '3/2', avg: 87 },
];

export function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedClaimedPlantId, setSelectedClaimedPlantId] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // 检查登录状态
  useEffect(() => {
    const authData = localStorage.getItem('adminAuth');
    if (!authData) {
      // 未登录，跳转到登录页
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(authData);
      if (user.role !== 'admin') {
        // 不是管理员，跳转到登录页
        localStorage.removeItem('adminAuth');
        navigate('/admin/login');
        return;
      }
    } catch (e) {
      console.error('Failed to parse auth data:', e);
      localStorage.removeItem('adminAuth');
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const data = await apiGet<Plant[]>('/plants?admin_view=true');
        if (data && Array.isArray(data) && data.length > 0) {
          setPlants(data);
        }
      } catch (e) {
        console.error('Error fetching plants:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlants();
  }, []);

  const stats = {
    totalPlants: plants.length,
    activeUsers: plants.reduce((acc, p) => acc + p.owners.length, 0),
    avgHealth: plants.length > 0 
      ? Math.round(plants.reduce((sum, p) => sum + p.health, 0) / plants.length)
      : 0,
    alertCount: plants.filter(p => p.alert).length,
  };

  const filteredPlants = plants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'overview', label: '总览', icon: LayoutDashboard },
    { id: 'plants', label: '植物库', icon: Leaf },
    { id: 'claimed_plants', label: '认领管理', icon: Flower2 },
    { id: 'sensors', label: '传感器监控', icon: Activity },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'settings', label: '系统设置', icon: Settings },
  ] as const;

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedClaimedPlantId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                <Leaf size={20} />
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="font-black text-lg tracking-tight">心植管理</h1>
                  <p className="text-xs text-gray-500 font-medium">HeartPlant Admin</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as Tab)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                    isActive 
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <NavLink
              to="/"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all"
            >
              <Home size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">返回小程序</span>}
            </NavLink>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">退出登录</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Menu size={20} />
                </button>
                <div className="min-w-0">
                  <h2 className="text-2xl font-black tracking-tight truncate">
                    {navItems.find(item => item.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5 truncate">
                    {activeTab === 'overview' && '系统运行状况总览'}
                    {activeTab === 'plants' && '发布与管理可认领植物库'}
                    {activeTab === 'claimed_plants' && (selectedClaimedPlantId ? `正在管理植物: ${selectedClaimedPlantId}` : '已认领植物的状态与成长管理')}
                    {activeTab === 'sensors' && '实时传感器数据监控'}
                    {activeTab === 'users' && '用户信息与权限管理'}
                    {activeTab === 'settings' && '系统配置与参数设置'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <button className="relative w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <Bell size={20} className="text-gray-600" />
                  {stats.alertCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                      {stats.alertCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  <RefreshCw size={16} />
                  <span className="hidden sm:inline">刷新数据</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab plants={plants} stats={stats} />
            )}

            {activeTab === 'plants' && (
              <PlantsTab />
            )}

            {activeTab === 'claimed_plants' && (
              selectedClaimedPlantId ? (
                <ClaimedPlantDetail 
                  plantId={selectedClaimedPlantId} 
                  onBack={() => setSelectedClaimedPlantId(null)} 
                />
              ) : (
                <ClaimedPlantsTab onSelectPlant={(id) => setSelectedClaimedPlantId(id)} />
              )
            )}

            {activeTab === 'sensors' && (
              <SensorsTab />
            )}

            {activeTab === 'users' && (
              <UsersTab />
            )}

            {activeTab === 'settings' && (
              <PlaceholderTab icon={Settings} title="系统设置" />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Plant Detail Modal */}
      {selectedPlant && (
        <PlantDetailModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ plants, stats }: { plants: Plant[], stats: any }) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="总植物数" 
          value={stats.totalPlants} 
          trend="+2 本周" 
          icon={Leaf} 
          color="green" 
        />
        <StatsCard 
          label="活跃用户" 
          value={stats.activeUsers} 
          trend="+1 本周" 
          icon={Users} 
          color="blue" 
        />
        <StatsCard 
          label="平均健康度" 
          value={`${stats.avgHealth}%`} 
          trend="-2% 本周" 
          icon={Activity} 
          color="emerald" 
          trendDown
        />
        <StatsCard 
          label="需要关注" 
          value={stats.alertCount} 
          trend="需要浇水" 
          icon={AlertTriangle} 
          color="red" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="健康度趋势">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={MOCK_HEALTH_TREND}>
              <defs>
                <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <YAxis style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontWeight: 'bold'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="avg" 
                stroke="#22C55E" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorHealth)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="植物类型分布">
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={MOCK_PLANT_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {MOCK_PLANT_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontWeight: 'bold'
                }} 
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                iconType="circle"
              />
            </RePieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-black mb-6">最近活动</h3>
        <div className="space-y-4">
          {plants.slice(0, 5).map((plant) => (
            <div key={plant.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{plant.name}</p>
                <p className="text-xs text-gray-500 font-medium truncate">
                  {plant.owners.join(', ')} • {plant.tag}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap",
                  plant.health > 80 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {plant.health}% 健康
                </div>
                {plant.alert && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Sensors Tab Component
function SensorsTab() {
  return (
    <motion.div
      key="sensors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Thermometer size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold opacity-90">平均温度</p>
              <p className="text-3xl font-black">24°C</p>
            </div>
          </div>
          <div className="text-xs font-bold opacity-80">范围: 21-26°C</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Droplets size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold opacity-90">平均湿度</p>
              <p className="text-3xl font-black">44%</p>
            </div>
          </div>
          <div className="text-xs font-bold opacity-80">范围: 20-60%</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Sun size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold opacity-90">平均光照</p>
              <p className="text-3xl font-black">650 lux</p>
            </div>
          </div>
          <div className="text-xs font-bold opacity-80">范围: 50-1200 lux</div>
        </div>
      </div>

      {/* Sensor Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="温度变化 (24小时)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={MOCK_SENSOR_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" style={{ fontSize: '12px', fontWeight: 'bold' }} />
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
                dataKey="temp" 
                stroke="#FF6B6B" 
                strokeWidth={3}
                dot={{ fill: '#FF6B6B', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="湿度变化 (24小时)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={MOCK_SENSOR_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" style={{ fontSize: '12px', fontWeight: 'bold' }} />
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
                dataKey="humidity" 
                stroke="#4ECDC4" 
                strokeWidth={3}
                dot={{ fill: '#4ECDC4', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="光照强度 (24小时)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={MOCK_SENSOR_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <YAxis style={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontWeight: 'bold'
                }} 
              />
              <Bar dataKey="light" fill="#FFD93D" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.div>
  );
}

// Helper Components
function StatsCard({ label, value, trend, icon: Icon, color, trendDown }: any) {
  const colorMap: any = {
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  };
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-3xl font-black mt-2">{value}</p>
          <p className={cn(
            "text-xs font-bold mt-2 flex items-center gap-1",
            trendDown ? "text-amber-600" : color === 'red' ? "text-red-600" : `text-${color}-600`
          )}>
            {trendDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {trend}
          </p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          colorMap[color].bg,
          colorMap[color].text
        )}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className }: any) {
  return (
    <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-gray-200", className)}>
      <h3 className="text-lg font-black mb-6">{title}</h3>
      {children}
    </div>
  );
}

function PlaceholderTab({ icon: Icon, title }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center"
    >
      <Icon size={64} className="mx-auto mb-4 text-gray-300" />
      <h3 className="text-xl font-black mb-2">{title}</h3>
      <p className="text-gray-500 font-medium">此功能正在开发中...</p>
    </motion.div>
  );
}

function PlantDetailModal({ plant, onClose }: { plant: Plant, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64">
          <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-black mb-2">{plant.name}</h2>
          <p className="text-gray-500 font-medium mb-6">已照料 {plant.days} 天 • {plant.tag}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">健康度</p>
              <p className="text-2xl font-black text-green-600">{plant.health}%</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">温度</p>
              <p className="text-2xl font-black text-orange-600">{plant.temp}°C</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">湿度</p>
              <p className="text-2xl font-black text-blue-600">{plant.humidity}%</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase mb-1">养护者</p>
              <p className="text-lg font-black">{plant.owners.join(', ')}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              编辑信息
            </button>
            <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
              查看历史
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}