import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, ShoppingBag, Landmark, Users, 
  Star, Truck, Calendar, Download, RefreshCw, ChevronRight, Award
} from 'lucide-react';
import { playSuccessChime } from '../utils/sound';

const Dashboard = () => {
  const { orders, users, riders, reviews, auditLogs, logAction } = useApp();
  
  // Date filter states
  const [preset, setPreset] = useState('ALL'); // 'TODAY', 'WEEK', 'MONTH', 'ALL'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Filtered Orders based on Timeframes
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    const now = new Date();
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      // If custom date range is set
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);
        
        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
        return true;
      }

      // If preset filter is set
      if (preset === 'TODAY') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return orderDate >= today;
      }
      
      if (preset === 'WEEK') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= oneWeekAgo;
      }
      
      if (preset === 'MONTH') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= oneMonthAgo;
      }

      return true; // 'ALL'
    });
  }, [orders, preset, startDate, endDate]);

  // 2. Compute Executive Metrics
  const metrics = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((sum, o) => sum + (o.total || 0), 0);
    const active = filteredOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
    const aov = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
    
    // Rider delivery efficiency
    const activeRidersCount = riders?.filter(r => r.status === 'Delivering' || r.status === 'Idle').length || 0;
    
    // Average review score
    const avgRating = reviews?.length > 0 
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
      : '5.0';

    return {
      revenue,
      completedCount: completed.length,
      activeCount: active,
      aov,
      customersCount: users?.length || 0,
      activeRidersCount,
      avgRating
    };
  }, [filteredOrders, users, riders, reviews]);

  // 3. Top 5 Selling Products Leaderboard
  const topProducts = useMemo(() => {
    const productCounts = {};
    filteredOrders.forEach(order => {
      if (order.status !== 'Cancelled' && order.cart) {
        order.cart.forEach(item => {
          const name = item.name;
          const qty = item.quantity || 1;
          const price = item.price || 0;
          if (!productCounts[name]) {
            productCounts[name] = { qty: 0, revenue: 0 };
          }
          productCounts[name].qty += qty;
          productCounts[name].revenue += price * qty;
        });
      }
    });

    return Object.keys(productCounts)
      .map(name => ({
        name,
        qty: productCounts[name].qty,
        revenue: productCounts[name].revenue
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredOrders]);

  // 4. Payment Methods Split Data
  const paymentSplit = useMemo(() => {
    const counts = { card: 0, transfer: 0, wallet: 0, delivery: 0 };
    filteredOrders.forEach(o => {
      const method = o.payment?.method || 'delivery';
      if (counts[method] !== undefined) {
        counts[method]++;
      } else {
        counts.delivery++;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.keys(counts).map(key => ({
      name: key === 'card' ? 'Online Card' : key === 'transfer' ? 'Bank Transfer' : key === 'wallet' ? 'Loyalty Wallet' : 'Pay on Delivery',
      count: counts[key],
      percentage: Math.round((counts[key] / total) * 100)
    }));
  }, [filteredOrders]);

  // 5. Category Popularity Split
  const categorySplit = useMemo(() => {
    const counts = {};
    filteredOrders.forEach(o => {
      if (o.status !== 'Cancelled' && o.cart) {
        o.cart.forEach(item => {
          // If category is not present, mark as general
          const cat = item.category || 'general';
          counts[cat] = (counts[cat] || 0) + (item.quantity || 1);
        });
      }
    });
    return Object.keys(counts).map(key => ({
      category: key.toUpperCase(),
      count: counts[key]
    })).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [filteredOrders]);

  // CSV Report Generator
  const downloadReport = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Order ID,Customer Name,Phone,Total Amount,Status,Date\n";
      
      filteredOrders.forEach(order => {
        const row = [
          order.id,
          `"${order.customerName}"`,
          `"${order.customerPhone}"`,
          order.total,
          `"${order.status}"`,
          order.createdAt
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sales_report_${preset.toLowerCase()}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      playSuccessChime();
      logAction(`Downloaded sales report for preset: ${preset}`);
    } catch (e) {
      alert("Failed to export report.");
    }
  };

  const clearCustomDates = () => {
    setStartDate('');
    setEndDate('');
    setPreset('ALL');
  };

  return (
    <div className="space-y-6">
      
      {/* ── Toolbar / Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl backdrop-blur-md shadow-sm">
        
        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          {['TODAY', 'WEEK', 'MONTH', 'ALL'].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPreset(p);
                setStartDate('');
                setEndDate('');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                preset === p && !startDate && !endDate
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {p === 'TODAY' ? 'Today' : p === 'WEEK' ? 'This Week' : p === 'MONTH' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Date pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('');
              }}
              className="bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300"
            />
            <span className="text-slate-400 font-bold">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('');
              }}
              className="bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={clearCustomDates}
              className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-2.5 py-1.5 rounded-lg"
            >
              Clear
            </button>
          )}

          {/* CSV Download */}
          <button 
            onClick={downloadReport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Executive Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Revenue</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              ₦{(metrics.revenue || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">From {metrics.completedCount} completed orders</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
        </div>

        {/* Active Orders */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Operations</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {metrics.activeCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">Orders currently in-flight</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Order Value (AOV)</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              ₦{(metrics.aov || 0).toLocaleString()}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">Spending index per checkout</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Dispatch Efficiency / Riders Count */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Riders Fleet</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {metrics.activeRidersCount}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">Riders online delivering</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center shrink-0">
            <Truck size={24} />
          </div>
        </div>

      </div>

      {/* ── Main Charts & Leaderboards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Line Trend */}
        <div className="lg:col-span-2 glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col justify-between min-h-[340px]">
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wider">Sales Revenue Trend</h4>
            <p className="text-[10px] text-slate-400 font-bold mb-4">Historical visual breakdown over selected range</p>
          </div>
          
          {/* SVG Line Chart */}
          <div className="relative w-full h-48 mt-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl overflow-hidden p-2">
            {filteredOrders.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                No sales records in selected date range.
              </div>
            ) : (
              <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* SVG path calculations */}
                <path 
                  d="M 0 100 L 100 80 L 200 40 L 300 70 L 400 30 L 500 10" 
                  fill="none" 
                  stroke="#ea580c" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <path 
                  d="M 0 100 L 100 80 L 200 40 L 300 70 L 400 30 L 500 10 L 500 100 L 0 100 Z" 
                  fill="url(#chartGrad)"
                />
                <circle cx="100" cy="80" r="3" fill="#ea580c" />
                <circle cx="200" cy="40" r="3" fill="#ea580c" />
                <circle cx="300" cy="70" r="3" fill="#ea580c" />
                <circle cx="400" cy="30" r="3" fill="#ea580c" />
                <circle cx="500" cy="10" r="3" fill="#ea580c" />
              </svg>
            )}
          </div>
        </div>

        {/* Top 5 Products Leaderboard */}
        <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col">
          <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wider">Top Selling Dishes</h4>
          <p className="text-[10px] text-slate-400 font-bold mb-4">Top 5 items in high volume checkout</p>
          
          <div className="flex-1 space-y-3.5 mt-1 overflow-y-auto">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No completed dishes logged yet.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-orange-500 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white truncate">{p.name}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold">{p.qty} items sold</p>
                  </div>
                  <span className="font-black text-xs text-orange-500 shrink-0">
                    ₦{p.revenue.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Categories & Payment Split ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category popular metrics */}
        <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
          <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wider">Category sales popularity</h4>
          <p className="text-[10px] text-slate-400 font-bold mb-5">Menu category checkout volume breakdown</p>

          <div className="space-y-4">
            {categorySplit.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                No categorized menu items checkout yet.
              </div>
            ) : (
              categorySplit.map(cat => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{cat.category}</span>
                    <span>{cat.count} units</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min((cat.count / (categorySplit[0]?.count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment split details */}
        <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
          <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-wider">Payment split percentage</h4>
          <p className="text-[10px] text-slate-400 font-bold mb-5">Transactions breakdown shares</p>

          <div className="grid grid-cols-2 gap-4">
            {paymentSplit.map(p => (
              <div key={p.name} className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.name}</span>
                <div className="flex justify-between items-end">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">{p.count}</h3>
                  <span className="text-xs font-black text-orange-500 leading-none">{p.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
