import React, { useState, useEffect } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Download, Star, DollarSign, ShoppingBag, Activity } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminAnalytics() {
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      let revenue = 0;
      let orderCount = 0;
      const productCounts = {};
      const monthlySales = {};

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      snapshot.docs.forEach(doc => {
        const order = doc.data();
        
        // Only count valid orders. Exclude cancelled.
        if (order.status === 'cancelled') return;

        orderCount++;
        const amount = Number(order.totalAmount || order.total || 0);
        revenue += amount;

        // Process items for Top Products
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const title = item.title || item.name;
            if (!title) return;
            const qty = Number(item.quantity || 1);
            if (!productCounts[title]) productCounts[title] = 0;
            productCounts[title] += qty;
          });
        }

        // Process date for Monthly Trends
        let date = new Date();
        if (order.createdAt) {
          if (order.createdAt.toDate) {
            date = order.createdAt.toDate();
          } else if (typeof order.createdAt === 'number') {
            date = new Date(order.createdAt);
          } else if (typeof order.createdAt === 'string') {
            date = new Date(order.createdAt);
          }
        }
        
        const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
        
        if (!monthlySales[monthYear]) {
          monthlySales[monthYear] = { name: monthYear, revenue: 0, orders: 0, timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime() };
        }
        monthlySales[monthYear].revenue += amount;
        monthlySales[monthYear].orders += 1;
      });

      setTotalOrders(orderCount);
      setTotalRevenue(revenue);
      setAvgOrderValue(orderCount > 0 ? revenue / orderCount : 0);

      // Sort and format product data
      const sortedProducts = Object.entries(productCounts)
        .map(([name, sold]) => ({ name, sold }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5); // Top 5
      setProductData(sortedProducts);

      // Sort and format monthly data chronologically
      const sortedMonths = Object.values(monthlySales)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({name, revenue, orders}) => ({name, revenue, orders}));
      
      // If no data, provide a flatline so the chart doesn't break
      if (sortedMonths.length === 0) {
        setSalesData([{ name: monthNames[new Date().getMonth()], revenue: 0, orders: 0 }]);
      } else {
        setSalesData(sortedMonths);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-white/50 animate-pulse font-bold tracking-widest text-sm">LOADING ANALYTICS...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <BarChart3 className="text-charistar-green" size={24} />
            Analytics & Reports Center
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Deep analysis of sales, popular catalog products, and revenue metrics in real-time.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Download size={12} /> Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-charistar-green/20 text-charistar-green flex items-center justify-center">
            <DollarSign size={24} strokeWidth={3} />
          </div>
          <div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Total Revenue</p>
            <h4 className="text-white font-black text-2xl">₦{totalRevenue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <ShoppingBag size={24} strokeWidth={3} />
          </div>
          <div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Total Orders</p>
            <h4 className="text-white font-black text-2xl">{totalOrders.toLocaleString()}</h4>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-[1.5rem] border border-white/10 bg-[#0c0c0c]/85 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Activity size={24} strokeWidth={3} />
          </div>
          <div>
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">Avg Order Value</p>
            <h4 className="text-white font-black text-2xl">₦{Math.round(avgOrderValue).toLocaleString()}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Orders Growth */}
        <div className="lg:col-span-2 glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
          <h3 className="text-white font-black text-base tracking-tight mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-charistar-green" />
            Monthly Growth Revenue Trends
          </h3>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A3C644" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#A3C644" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(value) => `₦${(value/1000)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#A3C644" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product performance */}
        <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
          <h3 className="text-white font-black text-base tracking-tight mb-6 flex items-center gap-2">
            <Star size={18} className="text-charistar-green" />
            Top Selling Products
          </h3>

          <div className="h-[280px] w-full">
            {productData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.2)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} width={120} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                  <Bar dataKey="sold" fill="#A3C644" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold uppercase tracking-widest">
                No Products Sold Yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
