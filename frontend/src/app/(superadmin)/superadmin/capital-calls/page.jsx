'use client'

/**
 * (superadmin)/capital-calls/page.jsx
 * Institutional Capital Call Management & LP Verification.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { 
  CircleDollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight,
  ChevronRight,
  Loader2,
  Calendar,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTheme } from 'next-themes';

export default function CapitalCallsPage() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 1. Fetch Capital Calls
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['admin', 'capital-calls'],
    queryFn: () => api.get('/deals/capital-calls/').then(res => res.data)
  });

  // Ensure calls is an array (handle pagination)
  // Ensure calls is an array (handle pagination and edge cases)
  const calls = Array.isArray(rawData) 
    ? rawData 
    : (Array.isArray(rawData?.results) ? rawData.results : []);

  const markReceivedMutation = useMutation({
    mutationFn: (id) => api.post(`/deals/capital-calls/${id}/mark_received/`),
    onSuccess: () => {
      toast.success('Capital call marked as received');
      queryClient.invalidateQueries(['admin', 'capital-calls']);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update status')
  });

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.fund_name?.toLowerCase().includes(search.toLowerCase()) ||
      call.lp_profile_detail?.full_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || call.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: calls.filter(c => c.status === 'CALLED').length || 0,
    received: calls.filter(c => c.status === 'RECEIVED').length || 0,
    total_amount: calls.reduce((sum, c) => sum + parseFloat(c.amount_npr || 0), 0) || 0,
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Capital Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-4 uppercase">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
              <CircleDollarSign size={28} />
            </div>
            Capital Ledger
          </h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            Institutional LP Drawdown Registry & Verification Engine
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Pending Calls', value: stats.pending, icon: Clock, color: 'text-[#F59F01]', bg: 'bg-[#F59F01]/10' },
          { label: 'Payments Received', value: stats.received, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Volume (NPR)', value: `रू ${stats.total_amount.toLocaleString()}`, icon: ArrowUpRight, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border-theme rounded-[2.5rem] p-10 hover:bg-foreground/[0.02] transition-all group shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl shadow-inner`}>
                <stat.icon size={24} />
              </div>
              <ChevronRight size={20} className="text-text-muted/10 group-hover:text-text-muted/40 transition-colors" />
            </div>
            <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-foreground uppercase tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-6 shadow-2xl items-center">
        <div className="flex-1 relative group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Query Registry by Fund or LP Identity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 pl-14 pr-6 text-foreground text-sm focus:outline-none focus:border-purple-500/40 transition-all shadow-inner font-medium"
          />
        </div>
        
        <div className="flex items-center gap-4 bg-foreground/[0.03] p-1.5 rounded-2xl border border-border-theme shadow-inner">
          {['ALL', 'CALLED', 'RECEIVED', 'DEFAULTED'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-text-muted hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-theme bg-foreground/[0.01]">
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40">LP Entity</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40">Vehicle / Deployment</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40">Notional (NPR)</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40">Maturity Date</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40">Ledger Status</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40 text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner">
                      <AlertCircle className="text-text-muted/10" size={40} />
                    </div>
                    <p className="text-text-muted font-black uppercase tracking-widest text-xs">No Capital Records Discovered</p>
                    <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Adjust system constraints or verify backend synchronization</p>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-foreground/[0.01] transition-all group text-xs">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-black shadow-inner">
                          {call.lp_profile_detail?.full_name?.[0] || 'L'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground leading-tight tracking-tight uppercase">{call.lp_profile_detail?.full_name || 'Anonymous LP'}</p>
                          <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-widest mt-1">{call.lp_profile_detail?.organization || 'Individual Account'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="space-y-1.5">
                        <p className="text-foreground/80 font-bold flex items-center gap-2">
                          <Building2 size={14} className="text-purple-500/40" />
                          {call.fund_name}
                        </p>
                        {call.project_name && (
                          <p className="text-[9px] text-[#F59F01] uppercase font-black tracking-[0.2em] bg-[#F59F01]/5 px-2 py-0.5 rounded border border-[#F59F01]/10 inline-block">
                            PROJ: {call.project_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-sm font-black text-foreground tracking-tighter">रू {parseFloat(call.amount_npr).toLocaleString()}</p>
                    </td>
                    <td className="px-10 py-7 text-text-muted/60 font-mono">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="opacity-20" />
                        {call.due_date ? format(new Date(call.due_date), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className={`
                        px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner
                        ${call.status === 'RECEIVED' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 
                          call.status === 'CALLED' ? 'bg-[#F59F01]/5 text-[#F59F01] border-[#F59F01]/20' :
                          'bg-rose-500/5 text-rose-500 border-rose-500/20'}
                      `}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right">
                      {call.status === 'CALLED' ? (
                        <button 
                          onClick={() => markReceivedMutation.mutate(call.id)}
                          disabled={markReceivedMutation.isLoading}
                          className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {markReceivedMutation.isLoading ? 'Processing...' : 'Mark Received'}
                        </button>
                      ) : call.status === 'RECEIVED' ? (
                        <div className="flex items-center justify-end gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={16} />
                          Finalized
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
