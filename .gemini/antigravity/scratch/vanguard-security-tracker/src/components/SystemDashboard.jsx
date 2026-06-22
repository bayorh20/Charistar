import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, Cpu, Zap, Settings, Key, Layout, 
  Download, RefreshCw, Play, Check, Trash2, Plus, 
  Sparkles, Smartphone, Globe, Clock, ShieldAlert 
} from 'lucide-react';
import { TEMPLATES } from '../services/templates.js';

export default function SystemDashboard({
  files,
  onLoadPreset,
  geminiKey,
  setGeminiKey,
  claudeKey,
  setClaudeKey,
  selectedModel,
  setSelectedModel,
  isMobile,
  setIsMobile,
  compileError,
  isCompiling,
  onAutoFix,
  onRefresh,
  onDownload,
  onDeploy,
  consoleLogs,
  onClearLogs
}) {
  // DB Storage Simulator States
  const [dbItems, setDbItems] = useState({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Latency Simulator States
  const [latency, setLatency] = useState(() => {
    return Number(localStorage.getItem('lumina_sandbox_latency') || '0');
  });

  // Load and filter localStorage items for database editor
  const loadDbItems = () => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // We list lumina keys or user keys, let's show all keys to give complete control
      items[key] = localStorage.getItem(key);
    }
    setDbItems(items);
  };

  useEffect(() => {
    loadDbItems();
  }, []);

  // Sync latency value to storage
  const handleLatencyChange = (e) => {
    const val = Number(e.target.value);
    setLatency(val);
    localStorage.setItem('lumina_sandbox_latency', String(val));
  };

  // Add a new row to local storage db
  const handleAddDbItem = (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    
    // Prefix with lumina_db_ if not present to keep namespace clean
    let key = newKey.trim();
    if (!key.startsWith('lumina_')) {
      key = `lumina_db_${key}`;
    }

    localStorage.setItem(key, newValue.trim());
    setNewKey('');
    setNewValue('');
    loadDbItems();
    onRefresh(); // trigger preview frame to reload with new storage
  };

  // Edit existing row
  const handleSaveEdit = (key) => {
    localStorage.setItem(key, editingValue);
    setEditingKey(null);
    setEditingValue('');
    loadDbItems();
    onRefresh();
  };

  // Delete row
  const handleDeleteDbItem = (key) => {
    localStorage.removeItem(key);
    loadDbItems();
    onRefresh();
  };

  // Clear simulated storage
  const handleClearDb = () => {
    if (window.confirm("Wipe all simulated database records?")) {
      // Clear keys starting with lumina_
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('lumina_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      loadDbItems();
      onRefresh();
    }
  };

  // Seed mock database analytics values
  const handleSeedDb = () => {
    // Seed SaaS Dashboard metrics
    localStorage.setItem('lumina_db_timerange', '30d');
    localStorage.setItem('lumina_db_metric', 'revenue');
    
    // Seed Music Player states
    localStorage.setItem('lumina_music_track', '1');
    localStorage.setItem('lumina_music_liked', 'true');
    localStorage.setItem('lumina_music_volume', '90');
    
    // Seed Fitness Tracker metrics
    localStorage.setItem('lumina_fit_steps', '9420');
    localStorage.setItem('lumina_fit_calories', '412');
    localStorage.setItem('lumina_fit_water', '5');

    // Add general mock developer credentials
    localStorage.setItem('lumina_db_user_role', 'Founder');
    localStorage.setItem('lumina_db_company_name', 'QuickStart Inc.');

    loadDbItems();
    onRefresh();
    alert("Mock database records seeded successfully!");
  };

  // Compute stats
  const fileNames = Object.keys(files);
  const totalFiles = fileNames.length;
  const totalLines = Object.values(files).reduce((acc, curr) => acc + curr.split('\n').length, 0);
  const totalChars = Object.values(files).reduce((acc, curr) => acc + (curr || '').length, 0);

  // Filter db items to show in table
  const filteredDbItems = Object.entries(dbItems).filter(([k]) => k.startsWith('lumina_'));

  return (
    <div className="w-full h-full p-6 space-y-6 overflow-y-auto select-none max-w-6xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            System Control Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual control hub to manage your AI provider, database simulator, app templates, and compiler diagnostic tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Lumina Engine: Ready
          </span>
        </div>
      </div>

      {/* Grid Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* 1. App Presets Card (Saves code, resets template) */}
        <div className="md:col-span-8 bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layout className="w-4 h-4 text-purple-400" />
            Starter App Presets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(TEMPLATES).map(([key, template]) => {
              const isSelected = (template.type === 'mobile' && isMobile) || (template.type === 'web' && !isMobile);
              return (
                <div 
                  key={key}
                  onClick={() => {
                    onLoadPreset(key);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-3 hover:-translate-y-0.5 ${
                    isSelected 
                      ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-500/5' 
                      : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      template.type === 'mobile' ? 'bg-purple-500/10 text-purple-400' : 'bg-teal-500/10 text-teal-400'
                    }`}>
                      {template.type}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-tight">{template.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{template.description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                    Load Preset &rarr;
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Compiler & Diagnostics Widget */}
        <div className="md:col-span-4 bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              Build Diagnostics
            </h3>
            
            {compileError ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  Compilation Failed
                </div>
                <p className="text-[9px] font-mono text-slate-300 line-clamp-3 leading-normal bg-black/20 p-1.5 rounded">
                  {compileError}
                </p>
                <button
                  onClick={() => onAutoFix(compileError)}
                  className="w-full py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 fill-current" />
                  AI Auto-Fix Code
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs font-bold">
                <Check className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 flex items-center justify-center" />
                Build Success (Live)
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-slate-950/40 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Files</span>
                <span className="text-sm font-extrabold text-white">{totalFiles}</span>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Lines</span>
                <span className="text-sm font-extrabold text-white">{totalLines}</span>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Bytes</span>
                <span className="text-sm font-extrabold text-white font-mono text-xs mt-0.5 block">
                  {totalChars > 1024 ? `${(totalChars / 1024).toFixed(1)}k` : totalChars}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onRefresh}
              className="w-full py-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Force Sandbox Recompile
            </button>
          </div>
        </div>

        {/* 3. Database Simulator Card */}
        <div className="md:col-span-7 bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Database Storage Simulator
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handleSeedDb}
                className="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
              >
                Seed Mock Data
              </button>
              {filteredDbItems.length > 0 && (
                <button 
                  onClick={handleClearDb}
                  className="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  Clear DB
                </button>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal">
            Saves state data inside browser's local storage. This simulates a real cloud database. Your template reads and updates these values in real-time.
          </p>

          {/* DB Editor Table */}
          <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="max-h-48 overflow-y-auto">
              {filteredDbItems.length === 0 ? (
                <div className="text-slate-600 text-center py-8 text-xs font-medium">
                  Database is empty. Click "Seed Mock Data" above or interact with the app preview.
                </div>
              ) : (
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-4 py-2">Database Key</th>
                      <th className="px-4 py-2">Simulated Value</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDbItems.map(([key, val]) => (
                      <tr key={key} className="border-b border-white/[0.02] last:border-0 hover:bg-slate-900/20">
                        <td className="px-4 py-2.5 font-mono text-[10px] text-indigo-300 font-semibold">{key.replace('lumina_', '')}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-300 break-all max-w-[200px]">
                          {editingKey === key ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={() => handleSaveEdit(key)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(key);
                                if (e.key === 'Escape') setEditingKey(null);
                              }}
                              autoFocus
                              className="w-full bg-slate-900 border border-purple-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span 
                              onClick={() => {
                                setEditingKey(key);
                                setEditingValue(val);
                              }}
                              className="cursor-pointer border-b border-dashed border-slate-600 hover:border-white transition-colors"
                              title="Click to edit value inline"
                            >
                              {val}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right space-x-2">
                          <button
                            onClick={() => handleDeleteDbItem(key)}
                            className="text-slate-500 hover:text-rose-400 font-bold uppercase text-[9px] transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Add DB Item Form */}
          <form onSubmit={handleAddDbItem} className="flex gap-2 items-center bg-slate-950/80 p-2 rounded-xl border border-white/5">
            <Plus className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Database key (e.g. user_name)"
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-slate-600 font-mono"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value"
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-slate-600 font-mono"
            />
            <button
              type="submit"
              disabled={!newKey.trim()}
              className="px-3 py-1.5 bg-slate-900 border border-white/10 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-all"
            >
              Add Record
            </button>
          </form>
        </div>

        {/* 4. API Configurations Dashboard */}
        <div className="md:col-span-5 bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" />
            AI Provider Credentials
          </h3>
          <p className="text-[10px] text-slate-400 leading-normal">
            Configure keys to unlock unlimited prompt editing. Saved securely in local storage.
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => {
                  setGeminiKey(e.target.value);
                  localStorage.setItem('lumina_gemini_key', e.target.value);
                }}
                placeholder="Google Gemini API key..."
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700 font-mono"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Claude API Key</label>
              <input
                type="password"
                value={claudeKey}
                onChange={(e) => {
                  setClaudeKey(e.target.value);
                  localStorage.setItem('lumina_claude_key', e.target.value);
                }}
                placeholder="Anthropic Claude API key..."
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Active Generation Engine</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Recommended)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Ultimate Smart)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Advanced)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Latency & Exports Actions Console */}
        <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          
          {/* Latency Simulator */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Sandbox Network Latency Simulator
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              Simulate cloud latency of database requests inside the sandbox. Helpful to verify loading spinners and skeleton screens.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-slate-500">Latency Delay:</span>
                <span className="text-indigo-400">{latency === 0 ? '0ms (Instant)' : `${latency}ms (Simulated Link)`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="250"
                value={latency}
                onChange={handleLatencyChange}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                <span>0ms</span>
                <span>500ms</span>
                <span>1000ms</span>
                <span>1500ms</span>
                <span>2000ms</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Console */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                DevOps Console Actions
              </h3>
              <p className="text-[10px] text-slate-400">
                Perform operational exports and builds on the current codebase.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onDownload}
                className="py-2.5 bg-slate-950 border border-white/5 hover:border-white/10 hover:bg-slate-900 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                Download Project ZIP
              </button>

              <button
                onClick={onDeploy}
                className="py-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-current animate-pulse" />
                Deploy Production App
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
