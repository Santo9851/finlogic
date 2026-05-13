import React, { useState } from 'react';
import { X, ShieldCheck, DollarSign, Calendar, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function InvestmentFinalizer({ deal, funds, onClose, onRefresh }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fund_id: '',
    investment_amount_npr: '',
    ownership_pct: '',
    valuation_at_entry_npr: '',
    investment_date: new Date().toISOString().split('T')[0],
    ic_notes: ''
  });

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/deals/projects/${deal.id}/finalize-investment/`, formData);
      toast.success('Investment finalized successfully');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to finalize investment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [calls, setCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(true);

  React.useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await api.get(`/deals/capital-calls/?project_id=${deal.id}`);
        setCalls(res.data);
      } catch (err) {
        toast.error('Failed to load capital calls verification');
      } finally {
        setLoadingCalls(false);
      }
    };
    fetchCalls();
  }, [deal.id]);

  const allCalls = Array.isArray(calls) ? calls : (calls?.results || []);
  const allReceived = !loadingCalls && allCalls.length > 0 && allCalls.every(c => c.status === 'RECEIVED');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0d0124] border border-purple-500/20 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Finalize Investment</h2>
              <p className="text-white/40 text-xs">Official closing for {deal.legal_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Capital Verification Section */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <DollarSign size={14} className="text-purple-400" /> Capital Receipt Verification
            </h3>
            
            <div className="space-y-3">
              {loadingCalls ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="animate-spin text-purple-400" size={16} />
                  <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Checking LP Ledgers...</span>
                </div>
              ) : allCalls.length === 0 ? (
                <div className="py-4 text-center border border-dashed border-white/10 rounded-2xl">
                  <p className="text-[10px] text-white/20 uppercase font-black italic">No capital calls detected for this project.</p>
                </div>
              ) : (
                allCalls.map(call => (
                  <div key={call.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{call.lp_commitment_name}</p>
                      <p className="text-[9px] text-white/40 font-mono mt-1">रू {parseFloat(call.amount_npr).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                         call.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400' : 
                         call.status === 'PAID' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                       }`}>
                         {call.status_display}
                       </span>
                       
                       {call.status !== 'RECEIVED' && (
                         <button
                           onClick={async () => {
                             try {
                               await api.post(`/deals/capital-calls/${call.id}/mark_received/`);
                               toast.success(`Verified receipt for ${call.lp_commitment_name}`);
                               // Refresh local calls list
                               const res = await api.get(`/deals/capital-calls/?project_id=${deal.id}`);
                               setCalls(res.data);
                             } catch (err) {
                               toast.error('Failed to verify receipt');
                             }
                           }}
                           className="p-2 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all shadow-inner"
                           title="Confirm Receipt for this LP"
                         >
                           <ShieldCheck size={14} />
                         </button>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {!allReceived && !loadingCalls && calls.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 animate-pulse">
                <AlertCircle size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Finalization Locked: All capital calls must be marked as 'RECEIVED' by GP Staff first.
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Select Capital Fund</label>
              <select 
                value={formData.fund_id}
                onChange={(e) => setFormData({...formData, fund_id: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500 outline-none"
              >
                <option value="">Select a fund...</option>
                {funds.map(fund => (
                  <option key={fund.id} value={fund.id}>{fund.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                <DollarSign size={12} /> Actual Investment (NPR)
              </label>
              <input 
                type="number" 
                value={formData.investment_amount_npr}
                onChange={(e) => setFormData({...formData, investment_amount_npr: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                <TrendingUp size={12} /> Final Ownership %
              </label>
              <input 
                type="number" 
                value={formData.ownership_pct}
                onChange={(e) => setFormData({...formData, ownership_pct: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Post-Money Valuation</label>
              <input 
                type="number" 
                value={formData.valuation_at_entry_npr}
                onChange={(e) => setFormData({...formData, valuation_at_entry_npr: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Investment Date
              </label>
              <input 
                type="date" 
                value={formData.investment_date}
                onChange={(e) => setFormData({...formData, investment_date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Investment Committee Final Notes</label>
              <textarea 
                value={formData.ic_notes}
                onChange={(e) => setFormData({...formData, ic_notes: e.target.value})}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-purple-500 outline-none"
                placeholder="Final decision rationale..."
              />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-white/5 text-white/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleFinalize}
            disabled={isSubmitting || !formData.fund_id || !formData.investment_amount_npr || !allReceived}
            className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
            Confirm & Finalize Closing
          </button>
        </div>

      </div>
    </div>
  );
}
