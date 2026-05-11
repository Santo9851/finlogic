'use client'

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
  Building2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CapitalCallsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: calls, isLoading } = useQuery({
    queryKey: ['admin', 'capital-calls'],
    queryFn: () => api.get('/deals/capital-calls/').then(res => res.data)
  });

  const markReceivedMutation = useMutation({
    mutationFn: (id) => api.post(`/deals/capital-calls/${id}/mark_received/`),
    onSuccess: () => {
      toast.success('Capital call marked as received');
      queryClient.invalidateQueries(['admin', 'capital-calls']);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update status')
  });

  const filteredCalls = calls?.filter(call => {
    const matchesSearch = 
      call.fund_name?.toLowerCase().includes(search.toLowerCase()) ||
      call.lp_profile_detail?.full_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || call.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: calls?.filter(c => c.status === 'CALLED').length || 0,
    received: calls?.filter(c => c.status === 'RECEIVED').length || 0,
    total_amount: calls?.reduce((sum, c) => sum + parseFloat(c.amount_npr), 0) || 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <CircleDollarSign className="text-purple-400" size={32} />
            Capital Calls
          </h1>
          <p className="text-white/40 text-sm max-w-xl leading-relaxed">
            Manage LP drawdowns, track payment status, and verify pro-rata contributions across all fund investments.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Calls', value: stats.pending, icon: Clock, color: 'text-[#F59F01]', bg: 'bg-[#F59F01]/10' },
          { label: 'Payments Received', value: stats.received, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Total Volume (NPR)', value: `रू ${stats.total_amount.toLocaleString()}`, icon: ArrowUpRight, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (stat.label && (
          <div key={i} className="bg-white/5 border border-white/8 rounded-[32px] p-8 hover:bg-white/8 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
              <ChevronRight size={20} className="text-white/10 group-hover:text-white/40 transition-colors" />
            </div>
            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        )))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white/5 border border-white/8 rounded-[32px] p-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search by Fund or LP Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-white/20" />
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            {['ALL', 'CALLED', 'RECEIVED', 'DEFAULTED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === f ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-white/40 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/8 rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">LP Investor</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Fund / Project</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Amount (NPR)</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Due Date</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-white/40 text-sm animate-pulse">Syncing capital records...</p>
                  </td>
                </tr>
              ) : filteredCalls?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <AlertCircle className="text-white/20" size={32} />
                    </div>
                    <p className="text-white/60 font-medium">No capital calls found</p>
                    <p className="text-white/20 text-xs mt-1">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredCalls?.map((call) => (
                  <tr key={call.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                          {call.lp_profile_detail?.full_name?.[0] || 'L'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">{call.lp_profile_detail?.full_name || 'Unknown LP'}</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-tighter mt-1">{call.lp_profile_detail?.organization || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm text-white/80 flex items-center gap-2">
                          <Building2 size={14} className="text-purple-500/40" />
                          {call.fund_name}
                        </p>
                        {call.project_name && (
                          <p className="text-[10px] text-[#F59F01] uppercase font-bold tracking-tight">
                            Project: {call.project_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-white">रू {parseFloat(call.amount_npr).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-white/60">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={14} className="text-white/20" />
                        {format(new Date(call.due_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`
                        px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${call.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          call.status === 'CALLED' ? 'bg-[#F59F01]/10 text-[#F59F01] border-[#F59F01]/20 animate-pulse' :
                          'bg-red-500/10 text-red-400 border-red-500/20'}
                      `}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {call.status === 'CALLED' ? (
                        <button 
                          onClick={() => markReceivedMutation.mutate(call.id)}
                          disabled={markReceivedMutation.isLoading}
                          className="px-4 py-2 bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                        >
                          {markReceivedMutation.isLoading ? 'Processing...' : 'Mark Received'}
                        </button>
                      ) : call.status === 'RECEIVED' ? (
                        <div className="flex items-center justify-end gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={14} />
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
