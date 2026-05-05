import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiFetch } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardStats {
  dailySales: { total: number };
  weeklySales: { total: number };
  monthlySales: { total: number };
  lowStock: { count: number };
  totalProducts: { count: number };
  salesTrend: { date: string, sales: number }[];
  salesByCategory: { name: string, value: number }[];
  recentSales: any[];
  lowStockProducts: any[];
  cashBalance: { balance: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return null;

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Panel de Control</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Resumen general del rendimiento de tu negocio hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Última actualización</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{new Date().toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={() => {
              setIsLoading(true);
              fetchStats();
            }}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-500 hover:text-blue-600"
          >
            <Clock size={20} />
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Ventas de Hoy', 
            value: stats.dailySales.total || 0, 
            icon: DollarSign, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-100 dark:border-blue-900/30'
          },
          { 
            label: 'Saldo en Caja', 
            value: stats.cashBalance.balance || 0, 
            icon: ShoppingCart, 
            color: 'text-green-600', 
            bg: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-100 dark:border-green-900/30'
          },
          { 
            label: 'Stock Bajo', 
            value: stats.lowStock.count || 0, 
            icon: AlertCircle, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            borderColor: 'border-amber-100 dark:border-amber-900/30',
            isCount: true
          },
          { 
            label: 'Total Productos', 
            value: stats.totalProducts.count || 0, 
            icon: Package, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-100 dark:border-purple-900/30',
            isCount: true
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between h-44 transition-all hover:shadow-lg",
              "bg-white dark:bg-gray-900",
              item.borderColor
            )}
          >
            <div className="flex justify-between items-start">
              <div className={cn("p-4 rounded-2xl", item.bg, item.color)}>
                <item.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full",
                item.isCount ? "bg-gray-100 dark:bg-gray-800 text-gray-500" : "bg-green-100 dark:bg-green-900/30 text-green-600"
              )}>
                {item.isCount ? 'Inventario' : <><TrendingUp size={12} /> +12%</>}
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{item.label}</p>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {item.isCount ? item.value : formatCurrency(item.value)}
              </h4>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Tendencia de Ventas</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Últimos 7 días</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-[10px] font-black uppercase">
              <Calendar size={14} />
              Semana Actual
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                  tickFormatter={(val) => {
                    const date = new Date(val);
                    return date.toLocaleDateString('es-ES', { weekday: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: '14px', color: '#1e293b' }}
                  labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#2563eb" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Ventas por Categoría</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Distribución del Negocio</p>
          </div>
          <div className="flex-1 h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(stats.salesByCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Top 5</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Categorías</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-6">
            {(stats.salesByCategory || []).slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{cat.name}</span>
                </div>
                <span className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales List */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Últimas Ventas</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Recientes</p>
            </div>
            <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">Ver Todas</button>
          </div>
          <div className="flex-1">
            {(stats.recentSales || []).length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {(stats.recentSales || []).map((sale) => (
                  <div key={sale.id} className="p-4 px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">#{String(sale.id).padStart(6, '0')}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-medium text-gray-500">{new Date(sale.created_at).toLocaleTimeString()}</p>
                          {(() => {
                            try {
                              const methods = JSON.parse(sale.payment_method);
                              if (Array.isArray(methods)) {
                                return methods.map((m: any, idx) => (
                                  <span key={idx} className={cn(
                                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border",
                                    m.method === 'cash' 
                                      ? "bg-green-50 text-green-600 border-green-100" 
                                      : "bg-purple-50 text-purple-600 border-purple-100"
                                  )}>
                                    {m.method.replace('_', '/')}
                                  </span>
                                ));
                              }
                              return <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-100">{sale.payment_method}</span>;
                            } catch (e) {
                              return <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-100">{sale.payment_method}</span>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(sale.total)}</p>
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Completado</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-gray-400">Sin ventas recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Alertas de Stock</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Por Agotarse</p>
            </div>
            <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full text-[10px] font-black uppercase">
              {(stats.lowStockProducts || []).length} Alertas
            </div>
          </div>
          <div className="flex-1">
            {(stats.lowStockProducts || []).length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {(stats.lowStockProducts || []).map((product) => (
                  <div key={product.id} className="p-4 px-8 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[180px]">{product.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Stock Actual: {product.stock}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${(product.stock / product.min_stock) * 100}%` }}
                        />
                      </div>
                      <p className="text-[9px] font-black text-amber-600 uppercase">Mínimo: {product.min_stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-gray-400">Todo el inventario está al día</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
