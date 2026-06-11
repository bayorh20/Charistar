import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Banknote, Users, Package, TrendingUp, Download, Calendar, ArrowUpRight, Truck, Wallet, Sparkles, CheckCircle2, AlertCircle, ShoppingBag, Clock } from 'lucide-react';

const COLORS = ['#A3C644', '#38bdf8', '#c084fc', '#fb923c', '#fb7185'];

export default function AdminOverview({ orders, users, products }) {
  const [dateRange, setDateRange] = useState('30D');

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt.seconds * 1000);
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch(dateRange) {
        case '1D': return diffDays <= 1;
        case '7D': return diffDays <= 7;
        case '30D': return diffDays <= 30;
        case 'YTD': return orderDate.getFullYear() === now.getFullYear();
        case 'ALL': return true;
        default: return true;
      }
    });
  }, [orders, dateRange]);

  // ── 10 Dynamic Corporate KPIs ───────────────────────────────────────
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [filteredOrders]);

  const todaysRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(o => o.createdAt && new Date(o.createdAt.seconds * 1000).toDateString() === today)
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const totalOrders = filteredOrders.length;

  const activeDeliveries = useMemo(() => {
    return orders.filter(o => ['preparing', 'dispatched'].includes(o.status)).length;
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending').length;
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'delivered').length;
  }, [orders]);

  const newCustomers = users.length;

  const activeRiders = 8; // Mock active couriers

  const totalWalletBalance = useMemo(() => {
    return users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
  }, [users]);

  const subscriptionRevenue = 28450.00; // Mock MRR

  // ── Charts Data generation ─────────────────────────────────────────
  const chartData = useMemo(() => {
    const daysToLookBack = dateRange === '1D' ? 1 : dateRange === '7D' ? 7 : dateRange === '30D' ? 30 : 12;
    if (daysToLookBack <= 30) {
      const days = Array.from({length: daysToLookBack}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (daysToLookBack - 1 - i));
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: 0,
          orders: 0
        };
      });

      filteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt.seconds * 1000);
        const dayStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayData = days.find(d => d.date === dayStr);
        if (dayData) {
          dayData.revenue += (order.total || 0);
          dayData.orders += 1;
        }
      });
      return days;
    } else {
      const months = {};
      filteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt.seconds * 1000);
        const monthStr = orderDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!months[monthStr]) months[monthStr] = { revenue: 0, orders: 0 };
        months[monthStr].revenue += (order.total || 0);
        months[monthStr].orders += 1;
      });
      return Object.keys(months).map(m => ({ date: m, revenue: months[m].revenue, orders: months[m].orders }));
    }
  }, [filteredOrders, dateRange]);

  const categoryData = useMemo(() => {
    const categories = {};
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const cat = item.category || 'Other';
        if (!categories[cat]) categories[cat] = 0;
        const priceNum = typeof item.price === 'number' 
          ? item.price 
          : (parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0);
        categories[cat] += (priceNum * item.quantity);
      });
    });
    return Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat]
    })).sort((a,b) => b.value - a.value);
  }, [filteredOrders]);

  const peakHoursData = [
    { hour: '08:00', orders: 12 },
    { hour: '10:00', orders: 28 },
    { hour: '12:00', orders: 85 }, // Lunch Peak
    { hour: '14:00', orders: 42 },
    { hour: '16:00', orders: 18 },
    { hour: '18:00', orders: 74 }, // Dinner Peak
    { hour: '20:00', orders: 30 },
  ];

  const deliveryPerformanceData = [
    { week: 'Week 1', onTime: 92, delayed: 8 },
    { week: 'Week 2', onTime: 94, delayed: 6 },
    { week: 'Week 3', onTime: 96, delayed: 4 },
    { week: 'Week 4', onTime: 98, delayed: 2 },
  ];

  const downloadCSV = () => {
    const headers = "Order ID,Date,Status,Total,Item Count\n";
    const rows = filteredOrders.map(o => {
      const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'N/A';
      return `"${o.id}","${date}","${o.status}","${o.total}","${o.items?.length || 0}"`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Charistar_Corporate_Report_${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <Calendar size={16} className="text-gray-400 mr-2" />
          {['1D', '7D', '30D', 'YTD', 'ALL'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                dateRange === range 
                  ? 'bg-charistar-green text-black shadow-sm scale-105' 
                  : 'bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 px-6 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 flex-shrink-0"
        >
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* 10 KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        <StatCard 
          title="Total Revenue" 
          value={`₦${totalRevenue.toLocaleString()}`}
          icon={<Banknote size={18} />}
          color="bg-charistar-green text-charistar-green"
          delay={0.05}
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₦${todaysRevenue.toLocaleString()}`}
          icon={<Sparkles size={18} />}
          color="bg-sky-400 text-sky-400"
          delay={0.1}
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrders}
          icon={<ShoppingBag size={18} />}
          color="bg-purple-400 text-purple-400"
          delay={0.15}
        />
        <StatCard 
          title="Active Deliveries" 
          value={activeDeliveries}
          icon={<Truck size={18} />}
          color="bg-orange-400 text-orange-400"
          delay={0.2}
        />
        <StatCard 
          title="Pending Orders" 
          value={pendingOrders}
          icon={<AlertCircle size={18} />}
          color="bg-red-400 text-red-400"
          delay={0.25}
        />
        <StatCard 
          title="Completed Orders" 
          value={completedOrders}
          icon={<CheckCircle2 size={18} />}
          color="bg-emerald-400 text-emerald-400"
          delay={0.3}
        />
        <StatCard 
          title="New Customers" 
          value={newCustomers}
          icon={<Users size={18} />}
          color="bg-indigo-400 text-indigo-400"
          delay={0.35}
        />
        <StatCard 
          title="Active Riders" 
          value={activeRiders}
          icon={<Truck size={18} />}
          color="bg-amber-400 text-amber-400"
          delay={0.4}
        />
        <StatCard 
          title="Wallet Pool" 
          value={`₦${totalWalletBalance.toLocaleString()}`}
          icon={<Wallet size={18} />}
          color="bg-teal-400 text-teal-400"
          delay={0.45}
        />
        <StatCard 
          title="Subscription MRR" 
          value={`₦${subscriptionRevenue.toLocaleString()}`}
          icon={<TrendingUp size={18} />}
          color="bg-pink-400 text-pink-400"
          delay={0.5}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Revenue Over Time */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="lg:col-span-2 glass-panel bg-[#0c0c0c]/85 border border-white/10 p-7.5 rounded-[1.5rem] shadow-lg"
        >
          <h3 className="text-white font-black text-base mb-6 tracking-tight">Revenue Analytics</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3C644" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#A3C644" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#A3C644" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-panel bg-[#0c0c0c]/85 border border-white/10 p-7.5 rounded-[1.5rem] shadow-lg flex flex-col"
        >
          <h3 className="text-white font-black text-base mb-6 tracking-tight">Popular Categories</h3>
          <div className="h-[180px] w-full mb-4 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} formatter={(v)=>`₦${v}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="text-white text-xs font-bold">{cat.name}</span>
                </div>
                <span className="text-gray-400 text-xs font-semibold">₦{cat.value.toLocaleString()}</span>
              </div>
            ))}
            {categoryData.length === 0 && <p className="text-gray-500 text-xs text-center">No catalog sales data</p>}
          </div>
        </motion.div>
      </div>

      {/* Peak Ordering Hours & Delivery Success Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak ordering hours */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="glass-panel bg-[#0c0c0c]/85 border border-white/10 p-7.5 rounded-[1.5rem] shadow-lg"
        >
          <h3 className="text-white font-black text-base mb-6 tracking-tight">Peak Ordering Hours</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                <Line type="monotone" dataKey="orders" stroke="#A3C644" strokeWidth={3} dot={{ fill: '#A3C644', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Rider delivery performance */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="glass-panel bg-[#0c0c0c]/85 border border-white/10 p-7.5 rounded-[1.5rem] shadow-lg"
        >
          <h3 className="text-white font-black text-base mb-6 tracking-tight">Delivery SLA Performance</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deliveryPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                <Bar dataKey="onTime" name="On Time Delivery" fill="#A3C644" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed" name="Delayed" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Real-time Activity Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
        className="glass-panel bg-[#0c0c0c]/85 border border-white/10 p-7.5 rounded-[1.5rem] shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-black text-base tracking-tight flex items-center gap-2"><Clock size={16} className="text-charistar-green animate-pulse"/> Real-Time Activity Feed</h3>
          <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Live stream</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-charistar-green/10 text-charistar-green flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-normal"><span className="text-charistar-green">New Order Received</span> #CH-9824</p>
              <p className="text-gray-500 text-[10px] font-semibold mt-0.5">Classic Berry Parfait •₦3,500.00 • Hostel Hotspot A</p>
            </div>
            <span className="text-gray-600 text-[9px] font-black uppercase whitespace-nowrap">Just Now</span>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0">
              <Truck size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-normal"><span className="text-sky-400">Rider Dispatched</span> (Rider: Tunde A.)</p>
              <p className="text-gray-500 text-[10px] font-semibold mt-0.5">Order #CH-9721 out for campus delivery geofence</p>
            </div>
            <span className="text-gray-600 text-[9px] font-black uppercase whitespace-nowrap">4 mins ago</span>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Users size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-normal"><span className="text-indigo-400">New Client Signup</span> (funmi@covenant.edu)</p>
              <p className="text-gray-500 text-[10px] font-semibold mt-0.5">Covenant University • Promo code Welcome1000 applied</p>
            </div>
            <span className="text-gray-600 text-[9px] font-black uppercase whitespace-nowrap">12 mins ago</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color, delay }) => {
  const accentColor = color.split(' ').find(c => c.startsWith('text-')) || 'text-white';
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel bg-[#0c0c0c]/85 border border-white/10 p-6 rounded-[1.5rem] relative overflow-hidden shadow-lg hover:border-white/20 transition-all duration-300 group"
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${color.split(' ')[0]}`}></div>
      <div className="flex justify-between items-start mb-4.5">
        <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/5 group-hover:scale-105 transition-transform flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-500 font-extrabold text-[10px] mb-1 uppercase tracking-widest leading-none">{title}</h3>
      <p className="text-white font-black text-xl tracking-tight mt-1">{value}</p>
    </motion.div>
  );
};
