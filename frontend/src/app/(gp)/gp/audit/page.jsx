'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Settings, 
  LogIn, 
  AlertCircle,
  Download,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Sample Audit Data
const AUDIT_LOGS = [
  {
    id: 1,
    action: 'Document Uploaded',
    details: 'Financial_Statement_Q4.pdf uploaded for CloudScale AI',
    user: 'Sarah Jenkins',
    role: 'GP Staff',
    timestamp: '2026-04-19 14:45',
    type: 'upload',
    status: 'success'
  },
  {
    id: 2,
    action: 'Login Success',
    details: 'GP Staff login from IP 192.168.1.45',
    user: 'Michael Chen',
    role: 'Admin',
    timestamp: '2026-04-19 09:12',
    type: 'auth',
    status: 'success'
  },
  {
    id: 3,
    action: 'Deal Status Changed',
    details: 'GreenPulse moved from Due Diligence to Investment Committee',
    user: 'Sarah Jenkins',
    role: 'GP Staff',
    timestamp: '2026-04-18 16:30',
    type: 'update',
    status: 'success'
  },
  {
    id: 4,
    action: 'Security Alert',
    details: 'Multiple failed login attempts detected',
    user: 'Unknown',
    role: 'External',
    timestamp: '2026-04-18 22:10',
    type: 'security',
    status: 'warning'
  },
  {
    id: 5,
    action: 'Pre-signed URL Generated',
    details: 'Download link created for private document: Term_Sheet.pdf',
    user: 'David Miller',
    role: 'Managing Partner',
    timestamp: '2026-04-18 11:05',
    type: 'access',
    status: 'success'
  }
];

export default function GPAuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      setLogs(AUDIT_LOGS);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">System Audit Log</h1>
            <p className="text-white/50 text-sm mt-0.5">Immutable record of all platform activities and security events.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium hover:bg-white/10 transition-all">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#08001a] border border-white/8 rounded-2xl p-4 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="Filter by action or details..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#F59F01]/50"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-white text-xs focus:outline-none appearance-none cursor-pointer">
            <option>All Users</option>
            <option>GP Staff</option>
            <option>Admin</option>
            <option>Entrepreneur</option>
          </select>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-white text-xs focus:outline-none appearance-none cursor-pointer">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom Range</option>
          </select>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[#F59F01]/10 text-[#F59F01] border border-[#F59F01]/20 rounded-lg py-2 text-xs font-bold hover:bg-[#F59F01]/20 transition-all">
          <Filter size={14} />
          Apply Filters
        </button>
      </div>

      {/* Audit Table */}
      <div className="bg-[#08001a] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 border-b border-white/8">
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest w-16">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">User / Origin</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-4 bg-white/5 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : (
                logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between bg-white/1">
          <p className="text-xs text-white/30 font-medium">Showing 1 to 5 of 124 entries</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-white/50 text-xs hover:text-white transition-colors disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-white/50 text-xs hover:text-white transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditRow({ log }) {
  const getIcon = (type) => {
    switch(type) {
      case 'upload': return <FileText size={14} />;
      case 'auth': return <LogIn size={14} />;
      case 'update': return <Settings size={14} />;
      case 'security': return <AlertCircle size={14} />;
      case 'access': return <ShieldCheck size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'warning') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    if (status === 'error') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <tr className="hover:bg-white/2 transition-colors group">
      <td className="px-6 py-5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getStatusColor(log.status)}`}>
          {log.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-white/5 text-white/40 group-hover:text-[#F59F01] transition-colors">
              {getIcon(log.type)}
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-[#F59F01] transition-colors">{log.action}</span>
          </div>
          <span className="text-xs text-white/40 max-w-xs truncate">{log.details}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white/80">{log.user}</span>
          <span className="text-[10px] text-[#F59F01] font-bold uppercase tracking-wider">{log.role}</span>
        </div>
      </td>
      <td className="px-6 py-5 text-sm text-white/40 font-mono">
        {log.timestamp}
      </td>
      <td className="px-6 py-5 text-right">
        <button className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition-colors border border-white/5 px-2 py-1 rounded">
          Details
        </button>
      </td>
    </tr>
  );
}
