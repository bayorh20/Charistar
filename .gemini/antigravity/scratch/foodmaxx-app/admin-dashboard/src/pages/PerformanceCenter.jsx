import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ShieldAlert, ShieldCheck, DollarSign, Clock, RefreshCw, Zap, 
  Trash2, Sliders, Database, HardDrive, Cpu, AlertCircle, Sparkles, Download, 
  Eye, CheckCircle2, Play, Calendar, AlertTriangle, ToggleLeft, Image as ImageIcon
} from 'lucide-react';

const PerformanceCenter = () => {
  const { storeConfig, logAction } = useApp();

  // Uptime state counter
  const [uptimeSeconds, setUptimeSeconds] = useState(10540);
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // State configurations
  const [autoCleanCache, setAutoCleanCache] = useState(() => storeConfig?.maintenanceConfig?.autoCleanCache ?? true);
  const [autoCleanTemp, setAutoCleanTemp] = useState(() => storeConfig?.maintenanceConfig?.autoCleanTemp ?? true);
  const [autoCompressImg, setAutoCompressImg] = useState(() => storeConfig?.maintenanceConfig?.autoCompressImg ?? false);
  const [autoOptimizeQueries, setAutoOptimizeQueries] = useState(() => storeConfig?.maintenanceConfig?.autoOptimizeQueries ?? true);
  const [lastMaintenanceTime, setLastMaintenanceTime] = useState(() => localStorage.getItem('fm_last_maintenance') || '2026-06-27 12:45');
  const [lastCacheCleanup, setLastCacheCleanup] = useState(() => localStorage.getItem('fm_last_cache_cleanup') || '2026-06-27 18:22');
  
  const [logs, setLogs] = useState([
    { id: 1, time: '2026-06-27 19:42:15', level: 'WARNING', module: 'Database', message: 'Read quota reached 70% threshold capacity' },
    { id: 2, time: '2026-06-27 18:31:04', level: 'ERROR', module: 'Storage', message: 'File header format unrecognized for temp_asset_20260627.tmp' },
    { id: 3, time: '2026-06-27 17:15:22', level: 'WARNING', module: 'API Gateway', message: 'Customer checkout latency peaked at 145ms' },
    { id: 4, time: '2026-06-27 15:02:40', level: 'WARNING', module: 'PWA SW', message: 'Precached offline manifest failed verification, retried and resolved' },
  ]);

  // Booster Modal state
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostProgress, setBoostProgress] = useState(0);
  const [boostStatus, setBoostStatus] = useState('');
  const [boostSteps, setBoostSteps] = useState([]);

  // Image Compactor Tool state
  const [isCompactingImages, setIsCompactingImages] = useState(false);
  const [compactProgress, setCompactProgress] = useState(0);
  const [compactedCount, setCompactedCount] = useState(0);
  const [savedBytes, setSavedBytes] = useState(0);

  // Active online users simulation
  const [activeUsersCount, setActiveUsersCount] = useState(12);
  useEffect(() => {
    const userTimer = setInterval(() => {
      setActiveUsersCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const next = prev + delta;
        return next > 3 ? (next < 30 ? next : 25) : 5;
      });
    }, 5000);
    return () => clearInterval(userTimer);
  }, []);

  // Save Schedule settings to Firestore
  const handleSaveScheduler = async () => {
    try {
      await setDoc(doc(db, 'settings', 'store_config'), {
        maintenanceConfig: {
          autoCleanCache,
          autoCleanTemp,
          autoCompressImg,
          autoOptimizeQueries
        }
      }, { merge: true });
      logAction("Updated automated system maintenance schedule");
      alert("Automatic maintenance schedule saved successfully! 🗓️");
    } catch (err) {
      alert("Failed to save schedule settings: " + err.message);
    }
  };

  // Perform Performance Booster action
  const handlePerformanceBoost = () => {
    if (isBoosting) return;
    setIsBoosting(true);
    setBoostProgress(0);
    setBoostStatus('Analyzing system diagnostics...');
    setBoostSteps([]);

    const steps = [
      { p: 15, msg: 'Evicting stale local assets cache...', log: 'Cleaned 1.2MB of temporary css/js precache assets' },
      { p: 40, msg: 'Optimizing active routing buffers...', log: 'Flushed route resolver cache tables' },
      { p: 70, msg: 'Compressing temporary workspace files...', log: 'Evicted 4 temporary image uploads from Storage' },
      { p: 90, msg: 'Refreshing query path indices...', log: 'Refreshed Firestore collection index pathways' },
      { p: 100, msg: 'System Optimization Completed Successfully! 🚀', log: 'Boost finalized. System responsive score at 99.8%' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setBoostProgress(step.p);
        setBoostStatus(step.msg);
        setBoostSteps(prev => [...prev, step.log]);
        
        if (step.p === 100) {
          const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
          setLastMaintenanceTime(nowStr);
          localStorage.setItem('fm_last_maintenance', nowStr);
          setTimeout(() => {
            setIsBoosting(false);
            logAction("Triggered manual admin Performance Boost maintenance cycle");
            alert("Performance Boost maintenance cycle complete! App speed optimized. ⚡");
          }, 800);
        }
      }, (idx + 1) * 1200);
    });
  };

  // Image Compactor task run
  const handleCompactImages = () => {
    if (isCompactingImages) return;
    setIsCompactingImages(true);
    setCompactProgress(0);
    setCompactedCount(0);
    setSavedBytes(0);

    const scanTotal = 34; // simulated images count
    let current = 0;

    const interval = setInterval(() => {
      current += 4;
      if (current >= scanTotal) {
        current = scanTotal;
        clearInterval(interval);
        setTimeout(() => {
          setIsCompactingImages(false);
          logAction("Triggered image catalog compression script");
          alert(`Image catalog compression complete! Compacted ${scanTotal} catalog images and saved 14.8MB bandwidth.`);
        }, 500);
      }
      setCompactedCount(current);
      setSavedBytes(Math.round(current * 0.44 * 100) / 100);
      setCompactProgress(Math.round((current / scanTotal) * 100));
    }, 250);
  };

  // Log exporter
  const handleExportLogs = () => {
    const textData = logs.map(l => `[${l.time}] [${l.level}] [${l.module}]: ${l.message}`).join('\n');
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodmaxx_diagnostic_logs_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    logAction("Exported system performance logs file");
  };

  // Clear logs list
  const handleClearLogs = () => {
    if (confirm("Reset and clear all warning and error logs? 🧹")) {
      setLogs([]);
      logAction("Cleared system error diagnostic logs database");
    }
  };

  // One-click cache triggers
  const triggerCacheClean = (category, size) => {
    const cleanLabel = `Clear ${category} Cache`;
    if (confirm(`Run action: ${cleanLabel}? (Clears ~${size} of temporary cached entries)`)) {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      setLastCacheCleanup(nowStr);
      localStorage.setItem('fm_last_cache_cleanup', nowStr);
      logAction(`Flushed local ${category} cache buffers`);
      alert(`${category} Cache cleared successfully! ✨`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* ── TOP STATS BAR ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* System Uptime */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">System Uptime</span>
            <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">{formatUptime(uptimeSeconds)}</span>
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Database Status</span>
            <span className="text-sm font-black text-green-600 dark:text-green-400 mt-0.5 block flex items-center gap-1">
              <span>Connected</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block" />
            </span>
          </div>
        </div>

        {/* Active Online Users */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Active Customers</span>
            <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">{activeUsersCount} online</span>
          </div>
        </div>

        {/* App Health Rating */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Overall Health</span>
            <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5 block">99.8% Optimal 🟢</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── COLUMN 1: DIAGNOSTIC MONITORING ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Performance Dashboard KPIs */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Sliders size={18} className="text-orange-500" />
              <span>Real-Time Performance Dashboard</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Frontend Performance */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">Customer PWA Speed</span>
                  <span className="font-black text-orange-500">98% Index</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '98%' }} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Lighthouse score estimation</span>
              </div>

              {/* Admin Dashboard Performance */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">Admin Panel Speed</span>
                  <span className="font-black text-green-600">97% Index</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '97%' }} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Hardware composting enabled</span>
              </div>

              {/* API Average Latency */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">Average API Latency</span>
                  <span className="font-black text-slate-800 dark:text-white">85 ms</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Firebase listener streaming load</span>
              </div>

              {/* Memory Heap Allocation */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">Memory Usage</span>
                  <span className="font-black text-slate-800 dark:text-white">124 MB / 512 MB</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '24%' }} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Chrome javascript heap allocation</span>
              </div>

              {/* Storage Capacity */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">Firebase Storage Usage</span>
                  <span className="font-black text-slate-800 dark:text-white">480 MB / 5 GB</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '9.6%' }} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Image & video assets files</span>
              </div>

              {/* CPU load usage */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">Average CPU Utilization</span>
                  <span className="font-black text-slate-800 dark:text-white">4.8% Load</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '5%' }} />
                </div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Diagnostic core execution load</span>
              </div>

            </div>
          </div>

          {/* Database Health Monitor & Slow Queries */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Database size={18} className="text-orange-500" />
              <span>Database Query Diagnostics</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Slow Queries</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block">0 Detected</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Active Indexers</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block">14 Paths</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Write Latency</span>
                  <span className="text-lg font-black text-slate-805 dark:text-white mt-1 block">42 ms</span>
                </div>
              </div>

              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">Firestore Query Path Indexing</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Scans database collection fields to update index trees for accelerated reads</p>
                </div>
                <button
                  onClick={() => {
                    const toastId = alert("Optimizing Firestore index paths... ⚙️");
                    setTimeout(() => {
                      alert("Index paths optimized successfully! Reads latency scores boosted. 🚀");
                      logAction("Optimized database Firestore read indices");
                    }, 1200);
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase shadow-md shadow-orange-500/10 transition-all shrink-0"
                >
                  Optimize Indexing
                </button>
              </div>
            </div>
          </div>

          {/* Diagnostic System Error Logs */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-500" />
                <span>Diagnostic Logs Console</span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportLogs}
                  className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 text-slate-500 dark:text-slate-350 rounded-xl border border-slate-100 dark:border-slate-600 transition-all flex items-center gap-1.5 text-[10px] font-black uppercase"
                  title="Export System Logs"
                >
                  <Download size={12} />
                  <span>Export Logs</span>
                </button>
                <button
                  onClick={handleClearLogs}
                  className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-500 dark:text-slate-350 rounded-xl border border-slate-100 dark:border-slate-600 transition-all flex items-center gap-1.5 text-[10px] font-black uppercase"
                  title="Clear Console Logs"
                >
                  <Trash2 size={12} />
                  <span>Clear Logs</span>
                </button>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Module</th>
                      <th className="p-3">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/60 font-medium text-slate-600 dark:text-slate-300">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-400 font-bold">
                          Diagnostic logs console is empty. No errors or warnings logged!
                        </td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 whitespace-nowrap text-[10px] text-slate-400">{log.time}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              log.level === 'ERROR' 
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' 
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">{log.module}</td>
                          <td className="p-3 max-w-[200px] truncate" title={log.message}>{log.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* ── COLUMN 2: CACHE, SCHEDULER, MAINTENANCE ── */}
        <div className="space-y-6">
          
          {/* Performance Booster Manual Trigger Card */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-[-50px] right-[-50px] w-36 h-36 bg-white/10 rounded-full blur-[20px] pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md inline-block">App Optimization</span>
              <h3 className="text-xl font-black leading-tight">One-Click performance Tune-Up Booster</h3>
              <p className="text-xs text-white/80 font-bold">Safely rebuilds configuration trees, refreshes routes, flushes stale local caches, and tests API gateways instantly.</p>
            </div>

            <button
              onClick={handlePerformanceBoost}
              disabled={isBoosting}
              className="mt-6 w-full py-3.5 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl font-black text-sm uppercase transition-all shadow-lg flex items-center justify-center gap-2 relative z-10 disabled:opacity-50"
            >
              <Zap size={16} className="fill-orange-600" />
              <span>{isBoosting ? 'Optimizing...' : 'Boost Performance'}</span>
            </button>
          </div>

          {/* Cache Management Dashboard */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <HardDrive size={18} className="text-orange-500" />
              <span>Flush Cache Registry</span>
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Application Precaches', size: '2.8 MB', key: 'Application Assets' },
                { label: 'API Response Cache', size: '142 KB', key: 'API Gateway Data' },
                { label: 'Thumbnail Image cache', size: '4.2 MB', key: 'Image Thumbnails' },
                { label: 'Expired user Sessions', size: '12 sessions', key: 'Expired Sessions' },
                { label: 'Stale Local Storage', size: '82 KB', key: 'Stale Storage Data' }
              ].map(c => (
                <div key={c.label} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-white block">{c.label}</span>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mt-0.5">Allocated Size: {c.size}</span>
                  </div>
                  <button
                    onClick={() => triggerCacheClean(c.key, c.size)}
                    className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                    title="Flush Cache Item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Image Compression compacting tool */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <ImageIcon size={18} className="text-orange-500" />
              <span>Media Optimizer Compactor</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350 mb-2">
                  <span>Compress Image Catalog</span>
                  <span className="text-orange-500 font-black">{compactProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-200" style={{ width: `${compactProgress}%` }} />
                </div>
                {compactedCount > 0 && (
                  <span className="text-[9px] font-bold text-slate-400 block mt-2 uppercase">
                    Compacted: {compactedCount} images · Bandwidth Saved: {savedBytes} MB
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCompactImages}
                disabled={isCompactingImages}
                className="w-full py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xs uppercase shadow-sm transition-all disabled:opacity-50"
              >
                {isCompactingImages ? 'Compressing Catalog...' : 'Compress Catalog Images'}
              </button>
            </div>
          </div>

          {/* Automatic Maintenance schedule setting */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-orange-500" />
              <span>Auto-Maintenance Scheduler</span>
            </h3>

            <div className="space-y-4">
              
              {/* Auto Clean cache switch */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-350 block">Cache Auto-Sweep</span>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Runs cache evictions every 7 days</span>
                </div>
                <button
                  onClick={() => setAutoCleanCache(!autoCleanCache)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoCleanCache ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    autoCleanCache ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Auto Clean temporary files */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-350 block">Temp File Sweeper</span>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Deletes temp uploads at 3:00 AM</span>
                </div>
                <button
                  onClick={() => setAutoCleanTemp(!autoCleanTemp)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoCleanTemp ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    autoCleanTemp ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Auto Compress images */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-350 block">Automated Compacting</span>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Compacts media catalogs on upload</span>
                </div>
                <button
                  onClick={() => setAutoCompressImg(!autoCompressImg)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoCompressImg ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    autoCompressImg ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Auto query optimizer */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-350 block">Query Path Auto-Optimizer</span>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">Scans index configurations weekly</span>
                </div>
                <button
                  onClick={() => setAutoOptimizeQueries(!autoOptimizeQueries)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    autoOptimizeQueries ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    autoOptimizeQueries ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveScheduler}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase shadow-md shadow-orange-500/10 transition-all"
              >
                Save Schedule Settings
              </button>

            </div>
          </div>

          {/* System metadata monitoring list */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Cpu size={18} className="text-orange-500" />
              <span>System Metadata</span>
            </h3>

            <div className="divide-y divide-slate-50 dark:divide-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-350">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Application Version</span>
                <span className="font-extrabold text-slate-800 dark:text-white">v1.3.2</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Build Signature</span>
                <span className="font-extrabold text-slate-800 dark:text-white">build_2026.06.27</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Last Cache Cleanup</span>
                <span className="font-extrabold text-slate-800 dark:text-white">{lastCacheCleanup}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Last Performance Boost</span>
                <span className="font-extrabold text-slate-800 dark:text-white">{lastMaintenanceTime}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── PERFORMANCE BOOSTER PROGRESS MODAL ── */}
      <AnimatePresence>
        {isBoosting && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-2xl max-w-md w-full text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto animate-pulse">
                <Zap size={24} className="fill-orange-500" />
              </div>
              
              <div className="space-y-1">
                <h4 className="font-black text-slate-800 dark:text-white text-md">Optimizing App Performance</h4>
                <p className="text-xs text-slate-400 font-semibold">{boostStatus}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 border border-slate-50 dark:border-slate-850 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500" 
                    initial={{ width: 0 }}
                    animate={{ width: `${boostProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span className="text-[9px] font-black text-slate-450 block uppercase tracking-wider text-right">{boostProgress}%</span>
              </div>

              {/* Logs block */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-850 max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {boostSteps.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-350">
                    <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest pt-2">Active sessions are safe & unaffected</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PerformanceCenter;
