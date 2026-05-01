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
  Filter, 
  Download, 
  Calendar, 
  User, 
  Database,
  ArrowRight,
  Eye,
  X,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function SuperAdminAuditPage() {
  const [actor, setActor] = useState('');
  const [eventType, setEventType] = useState('');
  const [table, setTable] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // 1. Fetch Audit Logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'audit-logs', actor, eventType, table],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actor) params.append('actor', actor);
      if (eventType) params.append('event_type', eventType);
      if (table) params.append('table', table);
      
      const res = await api.get(`/superadmin/audit-logs/?${params.toString()}`);
      return res.data?.results ?? res.data ?? [];
    }
  });

  const exportToExcel = () => {
    // Mock export logic - in a real app you'd use a library like xlsx
    toast.success('Exporting audit logs to Excel format...');
  };

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
          <p className="text-white/40 text-sm">Track every data mutation across the platform.</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
        >
          <FileSpreadsheet size={18} /> Export to Excel
        </button>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Actor (Email)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              value={actor} 
              onChange={(e) => setActor(e.target.value)}
              placeholder="Search user..."
              className="w-full bg-[#060010] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-xs outline-none focus:border-purple-500/40"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Event Type</label>
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-[#060010] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500/40"
          >
            <option value="">All Actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="SOFT_DELETE">SOFT_DELETE</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Table Name</label>
          <input 
            value={table} 
            onChange={(e) => setTable(e.target.value)}
            placeholder="e.g. projects, users"
            className="w-full bg-[#060010] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500/40"
          />
        </div>

        <div className="flex items-end">
          <button 
            onClick={() => { setActor(''); setEventType(''); setTable(''); }}
            className="w-full h-9 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] uppercase font-bold rounded-lg border border-white/10 transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Timestamp</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Actor</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Action</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Resource</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group text-xs">
                  <td className="px-6 py-4 text-white/60 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <User size={12} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{log.actor_name || 'System'}</p>
                        <p className="text-white/20 text-[10px]">{log.actor_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      px-2 py-0.5 rounded font-bold text-[10px]
                      ${log.action === 'INSERT' ? 'bg-emerald-500/10 text-emerald-400' : 
                        log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-red-500/10 text-red-400'}
                    `}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-white/60 uppercase tracking-tighter text-[10px] font-bold">
                      <Database size={12} className="text-white/20" />
                      {log.table_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-white/20 italic">
                    No audit records found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0124] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Event Inspection</h3>
                  <p className="text-xs text-white/30 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <div>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Actor</p>
                  <p className="text-sm text-white">{selectedLog.actor_name || 'System'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Table</p>
                  <p className="text-sm text-white uppercase">{selectedLog.table_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Action</p>
                  <p className="text-sm text-emerald-400 font-bold">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Date</p>
                  <p className="text-sm text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Data Diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Previous State
                  </h4>
                  <div className="bg-[#060010] border border-white/10 rounded-xl p-4 h-64 overflow-auto">
                    <pre className="text-[10px] text-white/40 font-mono">
                      {JSON.stringify(selectedLog.old_data || {}, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    New State
                  </h4>
                  <div className="bg-[#060010] border border-white/10 rounded-xl p-4 h-64 overflow-auto">
                    <pre className="text-[10px] text-emerald-400/80 font-mono">
                      {JSON.stringify(selectedLog.new_data || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3 text-amber-500/60 italic text-xs">
                <Database size={16} className="flex-shrink-0" />
                This event mutated record ID: {selectedLog.record_id}
              </div>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-white/[0.02]">
              <button 
                onClick={() => setSelectedLog(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
