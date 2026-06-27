import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Search, Calendar, User, Clock, AlertCircle } from 'lucide-react';

const AuditLogs = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logs by search query
  const filteredLogs = auditLogs.filter(log => {
    const search = searchQuery.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(search) ||
      (log.actor || '').toLowerCase().includes(search) ||
      (log.id || '').toLowerCase().includes(search)
    );
  });

  // Helper to color-code action type badges
  const getActionBadgeColor = (actionText) => {
    const txt = (actionText || '').toLowerCase();
    if (txt.includes('delete') || txt.includes('remove') || txt.includes('ban')) {
      return 'bg-red-50 dark:bg-red-500/10 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-550/20';
    }
    if (txt.includes('create') || txt.includes('publish') || txt.includes('add') || txt.includes('approve')) {
      return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-550/20';
    }
    if (txt.includes('update') || txt.includes('modify') || txt.includes('adjust') || txt.includes('toggled')) {
      return 'bg-orange-55 text-orange-650 dark:text-orange-400 border border-orange-100 dark:border-orange-550/20';
    }
    return 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800';
  };

  return (
    <div className="space-y-6">
      
      {/* Search Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <ShieldCheck size={18} className="text-orange-500" />
          <span>Security Audit Trail</span>
        </h3>
        
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by action or actor..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/10">
                <th className="px-6 py-4">Event Date / Time</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Administrative Action</th>
                <th className="px-6 py-4">Log Scope ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors text-xs font-semibold">
                  
                  {/* Timestamp */}
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-450" />
                      <span>
                        {log.timestamp 
                          ? new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) 
                          : 'just now'}
                      </span>
                    </div>
                  </td>

                  {/* Actor */}
                  <td className="px-6 py-4 text-slate-800 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-orange-500" />
                      <span>{log.actor || 'Super Admin'}</span>
                    </div>
                  </td>

                  {/* Action Description */}
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1.5 rounded-xl font-bold ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>

                  {/* Log ID */}
                  <td className="px-6 py-4 text-[10px] font-mono text-slate-400 uppercase">
                    {log.id}
                  </td>

                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                    <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
                    <span>No audit entries matches search query.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AuditLogs;
