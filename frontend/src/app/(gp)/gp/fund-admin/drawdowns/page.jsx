'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CircleDollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  FileText,
  Building2,
  ExternalLink,
  Loader2,
  ChevronRight
} from 'lucide-react';
import api from '@/services/api';
import { StatusBadge } from '@/components/portal/PortalShell';

export default function DrawdownManagement() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // 1. Fetch all capital calls
  const { data: calls, isLoading } = useQuery({
    queryKey: ['admin', 'capital-calls'],
    queryFn: async () => {
      const res = await api.get('/deals/capital-calls/');
      return res.data;
    }
  });

  // 2. Mutation to mark as received
  const markReceived = useMutation({
    mutationFn: async (id) => {
      return api.post(`/deals/capital-calls/${id}/mark_received/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'capital-calls']);
    }
  });

  const allCalls = Array.isArray(calls) ? calls : (calls?.results || []);
  
  const filteredCalls = allCalls.filter(call => {
    const matchesSearch = call.lp_commitment_name?.toLowerCase().includes(search.toLowerCase()) || 
                          call.fund_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || call.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Loading Drawdown Registry...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Drawdown Reconciliation</h1>
          <p className="text-text-muted text-sm mt-1">Institutional capital tracking and payment verification hub.</p>
        </div>
        
        <div className="flex bg-card border border-border-theme p-1.5 rounded-2xl shadow-inner">
          {['ALL', 'CALLED', 'PAID', 'RECEIVED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-ls-compliment text-white shadow-lg' : 'text-text-muted hover:text-foreground'
              }`}
            >
              {f === 'PAID' ? 'Awaiting Verification' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-ls-compliment transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by LP name or Fund..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border-theme rounded-[2rem] py-6 pl-16 pr-8 text-sm focus:ring-2 focus:ring-ls-compliment/20 outline-none transition-all shadow-xl"
        />
      </div>

      {/* Registry Table */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-border-theme">
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Limited Partner</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Fund / Project</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Amount (NPR)</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {filteredCalls.map((call) => (
                <tr key={call.id} className="hover:bg-foreground/[0.01] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-ls-compliment/5 flex items-center justify-center text-ls-compliment border border-ls-compliment/10 shadow-inner">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">{call.lp_commitment_name}</p>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5 opacity-60">Due: {new Date(call.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">{call.fund_name}</p>
                    <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1 opacity-40">{call.project_name || 'Fund General Call'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-foreground tabular-nums">रू {parseFloat(call.amount_npr).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={call.status} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {call.payment_proof && (
                        <a 
                          href={call.payment_proof} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                          title="View Payment Proof"
                        >
                          <FileText size={18} />
                        </a>
                      )}
                      
                      {call.status !== 'RECEIVED' && (
                        <button
                          onClick={() => {
                            if(confirm('Confirm that funds have been received in the bank account?')) {
                              markReceived.mutate(call.id);
                            }
                          }}
                          disabled={markReceived.isLoading}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {markReceived.isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Confirm Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCalls.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-24 text-center">
                    <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-20 border border-border-theme">
                      <CircleDollarSign size={32} />
                    </div>
                    <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-[0.3em] italic">No Drawdown Records Found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
