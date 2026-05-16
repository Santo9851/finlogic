'use client';

/**
 * (gp)/audit/page.jsx
 * GP-specific Audit Log viewer.
 */
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
  Clock,
  ChevronRight
} from 'lucide-react';
import { useTheme } from 'next-themes';
import api from '@/services/api';
import { format } from 'date-fns';

export default function GPAuditPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/deals/audit/');
      const data = res.data?.results ?? res.data;
      
      // Map API data to UI format
      const mappedLogs = (Array.isArray(data) ? data : []).map(item => ({
        id: item.id,
        action: item.event_type_display,
        details: item.object_repr || JSON.stringify(item.payload),
        user: item.actor_email || 'System',
        role: 'GP Staff', // Could be expanded if role info is in API
        timestamp: format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
        type: mapEventTypeToIcon(item.event_type),
        status: mapEventTypeToStatus(item.event_type)
      }));
      
      setLogs(mappedLogs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapEventTypeToIcon = (type) => {
    if (type.includes('UPLOAD')) return 'upload';
    if (type.includes('STATUS') || type.includes('UPDATE')) return 'update';
    if (type.includes('CREATED')) return 'auth';
    if (type.includes('ACCESS')) return 'access';
    return 'default';
  };

  const mapEventTypeToStatus = (type) => {
    if (type.includes('DECLINED') || type.includes('DELETE') || type.includes('FAILED')) return 'error';
    if (type.includes('WARNING') || type.includes('DEFAULTED')) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Operational Audit</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Immutable Ledger of Administrative Actions & Security Events</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-6 py-3 bg-foreground/[0.03] border border-border-theme rounded-xl text-text-muted text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-all shadow-lg active:scale-95">
            <Download size={16} />
            Export Archive
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-8 theme-transition relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Context Query</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/20" size={16} />
            <input 
              type="text" 
              placeholder="Search event logic..." 
              className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3 pl-11 pr-4 text-foreground text-xs outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium"
            />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Entity Class</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/20" size={16} />
            <select className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3 pl-11 pr-4 text-foreground text-xs outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium appearance-none">
              <option className="bg-background">All Institutional Roles</option>
              <option className="bg-background">GP Core Staff</option>
              <option className="bg-background">System Admin</option>
              <option className="bg-background">Entrepreneur Portal</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Temporal Filter</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/20" size={16} />
            <select className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl py-3 pl-11 pr-4 text-foreground text-xs outline-none focus:border-ls-compliment/40 transition-all shadow-inner font-medium appearance-none">
              <option className="bg-background">Last 24 Hours</option>
              <option className="bg-background">Current Quarter</option>
              <option className="bg-background">Historical Record</option>
              <option className="bg-background">Custom Epoch</option>
            </select>
          </div>
        </div>

        <div className="flex items-end relative z-10">
          <button className={`w-full flex items-center justify-center gap-3 ${isDark ? 'bg-ls-compliment' : 'bg-ls-secondary'} text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95`}>
            <Filter size={16} />
            Apply Constraints
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] w-24">Verification</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Institutional Event</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Actor / Origin</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Temporal Index</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-10">
                      <div className="h-4 bg-foreground/5 rounded-xl w-full shadow-inner"></div>
                    </td>
                  </tr>
                ))
              ) : (
                logs.map((log) => (
                  <AuditRow key={log.id} log={log} isDark={isDark} />
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-8 py-6 border-t border-border-theme flex items-center justify-between bg-foreground/[0.01]">
          <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest">Displaying 1-5 of 124 Records</p>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-foreground/5 border border-border-theme rounded-xl text-text-muted text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-all disabled:opacity-30 shadow-sm" disabled>Previous Epoch</button>
            <button className="px-6 py-2 bg-foreground/5 border border-border-theme rounded-xl text-text-muted text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-all shadow-sm">Next Epoch</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditRow({ log, isDark }) {
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
    if (status === 'warning') return 'text-amber-500 bg-amber-500/5 border-amber-500/20';
    if (status === 'error') return 'text-rose-500 bg-rose-500/5 border-rose-500/20';
    return 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20';
  };

  return (
    <tr className="hover:bg-foreground/[0.01] transition-all group">
      <td className="px-8 py-7">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${getStatusColor(log.status)}`}>
          {log.status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-foreground/5 text-text-muted/30 group-hover:text-ls-compliment transition-all shadow-inner">
              {getIcon(log.type)}
            </span>
            <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-ls-compliment transition-all">{log.action}</span>
          </div>
          <span className="text-[10px] text-text-muted font-medium max-w-sm truncate opacity-60">{log.details}</span>
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-black text-foreground uppercase tracking-tighter">{log.user}</span>
          <span className={`text-[9px] ${isDark ? 'text-ls-compliment' : 'text-ls-secondary'} font-black uppercase tracking-widest opacity-60`}>{log.role}</span>
        </div>
      </td>
      <td className="px-8 py-7 text-xs text-text-muted/40 font-mono">
        {log.timestamp}
      </td>
      <td className="px-8 py-7 text-right">
        <button className="p-3 text-text-muted/20 hover:text-ls-compliment hover:bg-ls-compliment/5 rounded-xl transition-all border border-transparent hover:border-ls-compliment/20 active:scale-95">
          <ChevronRight size={18} />
        </button>
      </td>
    </tr>
  );
}
