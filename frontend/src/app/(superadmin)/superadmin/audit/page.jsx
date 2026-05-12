'use client'

/**
 * (superadmin)/audit/page.jsx
 * System-wide Audit Log viewer.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Search, 
  Database,
  Eye,
  X,
  Loader2,
  FileSpreadsheet,
  User,
  ShieldCheck,
  History
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function SuperAdminAuditPage() {
  const [source, setSource] = useState('compliance'); // 'compliance' or 'data'
  const [actor, setActor] = useState('');
  const [eventType, setEventType] = useState('');
  const [table, setTable] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // 1. Fetch Audit Logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'audit-logs', source, actor, eventType, table],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('source', source);
      if (actor) params.append('actor', actor);
      if (eventType) params.append('event_type', eventType);
      if (table) params.append('table', table);
      
      const res = await api.get(`/superadmin/audit-logs/?${params.toString()}`);
      return res.data?.results ?? res.data ?? [];
    }
  });

  const exportToExcel = () => {
    toast.success('Exporting audit logs to Excel format...');
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 theme-transition">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Scanning Immutable Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">System Audit Registry</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Immutable Ledger of Institutional Actions & Data Mutations</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-foreground/[0.03] border border-border-theme p-1.5 rounded-2xl flex shadow-inner">
             <button 
                onClick={() => setSource('compliance')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${source === 'compliance' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-text-muted hover:text-foreground'}`}
             >
                Compliance
             </button>
             <button 
                onClick={() => setSource('data')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${source === 'data' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-text-muted hover:text-foreground'}`}
             >
                Data CRUD
             </button>
          </div>
          <button 
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/10 active:scale-95"
          >
            <FileSpreadsheet size={16} /> Export Ledger
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-8 theme-transition relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <label className="text-[10px] text-text-muted/40 uppercase font-black tracking-[0.3em] ml-1">Actor Identity</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/20" size={14} />
            <input 
              value={actor} 
              onChange={(e) => setActor(e.target.value)}
              placeholder="Search by email..."
              className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl pl-11 pr-4 py-3 text-foreground text-xs outline-none focus:border-purple-500/40 transition-all shadow-inner font-medium"
            />
          </div>
        </div>
        
        <div className="space-y-3 relative z-10">
          <label className="text-[10px] text-text-muted/40 uppercase font-black tracking-[0.3em] ml-1">
             {source === 'compliance' ? 'Event Type' : 'Action Variant'}
          </label>
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl px-4 py-3 text-foreground text-xs outline-none focus:border-purple-500/40 transition-all shadow-inner font-medium appearance-none"
          >
            <option value="" className="bg-background">All Historical Events</option>
            {source === 'compliance' ? (
               <>
                  <option value="PROJECT_CREATED" className="bg-background">Project Created</option>
                  <option value="PROJECT_STATUS_CHANGED" className="bg-background">Project Status Changed</option>
                  <option value="PROJECT_SUBMITTED" className="bg-background">Project Submitted</option>
                  <option value="INVESTMENT_CLOSED" className="bg-background">Investment Finalized</option>
                  <option value="CAPITAL_CALLED" className="bg-background">Capital Called</option>
                  <option value="DISTRIBUTION_MADE" className="bg-background">Distribution Made</option>
                  <option value="VALUATION_OVERRIDE" className="bg-background">Valuation Override</option>
                  <option value="LOI_ISSUED" className="bg-background">LOI Issued</option>
                  <option value="MEMO_FINALIZED" className="bg-background">Memo Finalized</option>
                  <option value="COMPLIANCE_CLEARED" className="bg-background">Compliance Gate Cleared</option>
                  <option value="SCORING_OVERRIDE" className="bg-background">Scoring Override</option>
               </>
            ) : (
               <>
                  <option value="INSERT" className="bg-background">CREATE (INSERT)</option>
                  <option value="UPDATE" className="bg-background">MODIFY (UPDATE)</option>
                  <option value="DELETE" className="bg-background">REMOVE (DELETE)</option>
               </>
            )}
          </select>
        </div>

        <div className="space-y-3 relative z-10">
          <label className="text-[10px] text-text-muted/40 uppercase font-black tracking-[0.3em] ml-1">
             Target Resource
          </label>
          <input 
            value={table} 
            onChange={(e) => setTable(e.target.value)}
            placeholder={source === 'compliance' ? "Project name..." : "Database table..."}
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-xl px-4 py-3 text-foreground text-xs outline-none focus:border-purple-500/40 transition-all shadow-inner font-medium"
          />
        </div>

        <div className="flex items-end relative z-10">
          <button 
            onClick={() => { setActor(''); setEventType(''); setTable(''); }}
            className="w-full py-3.5 bg-foreground/5 hover:bg-foreground/10 text-text-muted/60 hover:text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl border border-border-theme transition-all shadow-lg active:scale-95"
          >
            Clear Constraints
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-theme bg-foreground/[0.02]">
                <th className="px-8 py-5 font-black text-text-muted uppercase tracking-[0.2em] text-[10px]">Registry Date</th>
                <th className="px-8 py-5 font-black text-text-muted uppercase tracking-[0.2em] text-[10px]">Actor Entity</th>
                <th className="px-8 py-5 font-black text-text-muted uppercase tracking-[0.2em] text-[10px]">Event Logic</th>
                <th className="px-8 py-5 font-black text-text-muted uppercase tracking-[0.2em] text-[10px]">Resource Index</th>
                <th className="px-8 py-5 font-black text-text-muted uppercase tracking-[0.2em] text-[10px] text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-foreground/[0.01] transition-all group text-xs">
                  <td className="px-8 py-6 text-text-muted/60 font-mono">
                    <div className="flex flex-col">
                       <span className="font-bold text-foreground/80">{new Date(log.created_at).toLocaleDateString()}</span>
                       <span className="opacity-40 text-[10px]">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-inner">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-foreground font-bold tracking-tight">{log.actor_name || 'System Execution'}</p>
                        <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-tighter">{log.actor_email || 'Core Engine'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`
                      px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border
                      ${source === 'compliance' ? 'bg-purple-500/5 text-purple-600 border-purple-500/20' : 
                        log.action === 'INSERT' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 
                        log.action === 'UPDATE' ? 'bg-blue-500/5 text-blue-600 border-blue-500/20' :
                        'bg-rose-500/5 text-rose-600 border-rose-500/20'}
                    `}>
                      {source === 'compliance' ? log.event_type_display : log.action}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-text-muted/60 uppercase tracking-widest text-[9px] font-black">
                      <Database size={12} className="text-text-muted/20" />
                      <span className="bg-foreground/5 px-2 py-0.5 rounded border border-border-theme">{source === 'compliance' ? log.project_name : log.table_name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-3 text-text-muted/20 hover:text-purple-500 hover:bg-purple-500/5 rounded-xl transition-all border border-transparent hover:border-purple-500/20 shadow-none hover:shadow-lg active:scale-95"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-text-muted/20 italic font-black uppercase tracking-[0.5em]">
                    Awaiting Audit Records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col theme-transition">
            <div className="p-10 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01]">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-inner">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Event Analysis</h3>
                  <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest opacity-40">{selectedLog.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="p-4 bg-foreground/5 border border-border-theme rounded-2xl text-text-muted hover:text-foreground transition-all hover:rotate-90 active:scale-95"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-foreground/[0.02] rounded-[2rem] p-8 border border-border-theme shadow-inner">
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-widest">Actor</p>
                  <p className="text-sm text-foreground font-bold uppercase tracking-tight">{selectedLog.actor_name || 'System'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-widest">Resource</p>
                  <p className="text-sm text-foreground font-bold uppercase tracking-tight">{selectedLog.table_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-widest">Operation</p>
                  <p className="text-sm text-emerald-500 font-black uppercase tracking-widest">{selectedLog.action}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-widest">Registry Date</p>
                  <p className="text-sm text-foreground font-bold uppercase tracking-tight">{new Date(selectedLog.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Data Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                      Prior State
                    </h4>
                    <History size={14} className="text-text-muted/20" />
                  </div>
                  <div className="bg-foreground/[0.03] border border-border-theme rounded-[2rem] p-8 h-80 overflow-auto shadow-inner custom-scrollbar">
                    <pre className="text-[11px] text-text-muted/60 font-mono leading-relaxed">
                      {JSON.stringify(selectedLog.old_data || {}, null, 3)}
                    </pre>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      Mutated State
                    </h4>
                    <Activity size={14} className="text-emerald-500/20" />
                  </div>
                  <div className="bg-foreground/[0.03] border border-border-theme rounded-[2rem] p-8 h-80 overflow-auto shadow-inner custom-scrollbar">
                    <pre className="text-[11px] text-emerald-500/80 font-mono leading-relaxed font-bold">
                      {JSON.stringify(selectedLog.new_data || {}, null, 3)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6 flex gap-4 text-purple-500/60 italic text-[11px] font-medium items-center">
                <Database size={18} className="flex-shrink-0 opacity-40" />
                This event mutated record ID: <span className="font-mono font-black text-purple-500 ml-1">{selectedLog.record_id}</span>
              </div>
            </div>
            
            <div className="p-8 border-t border-border-theme bg-foreground/[0.01]">
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-full py-5 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl active:scale-[0.98] hover:scale-[1.01]"
              >
                Terminate Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
