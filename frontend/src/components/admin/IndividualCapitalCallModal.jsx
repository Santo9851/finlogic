'use client'

import React, { useState, useEffect } from 'react';
import { X, CircleDollarSign, Calendar, Calculator, Loader2, Info, Landmark, ArrowDownCircle } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';

export default function IndividualCapitalCallModal({ lpProfileId, onClose, onRefresh }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [interestRate, setInterestRate] = useState(0); // Optional interest rate %
  
  const [formData, setFormData] = useState({
    lp_commitment: '',
    fund: '',
    project: '',
    amount_npr: '',
    interest_npr: 0,
    due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    call_type: 'EQUALIZATION',
    auto_redistribute: false,
    redistribute_mode: 'CREDIT',
    notes: 'Late-joiner equalization drawdown.'
  });

  // 1. Fetch Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`/deals/lp-profiles/${lpProfileId}/calculate-catch-up/`);
        setSuggestions(res.data);
      } catch (err) {
        toast.error("Failed to fetch catch-up suggestions");
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [lpProfileId]);

  const handleApplySuggestion = (sug) => {
    // Simple Interest Calculation if rate provided
    // For now, it's just a UI helper. Real PE logic might use daily accrual.
    const principal = sug.suggested_amount;
    const interest = interestRate > 0 ? (principal * (interestRate / 100)) : 0;

    setFormData({
      ...formData,
      lp_commitment: sug.lp_commitment_id,
      fund: sug.fund_id,
      project: sug.project_id,
      amount_npr: principal.toFixed(2),
      interest_npr: interest.toFixed(2),
      notes: `Equalization catch-up for project: ${sug.project_name}. ${interest > 0 ? `Includes ${interestRate}% equalization interest.` : ''}`
    });
  };

  const handleIssue = async () => {
    setIsSubmitting(true);
    try {
      // Use the specialized execution endpoint
      await api.post(`/deals/lp-profiles/${lpProfileId}/execute-catch-up/`, formData);
      toast.success('Equalization protocol executed successfully');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to execute equalization protocol');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500 theme-transition">
      <div className="bg-card border border-border-theme w-full max-w-2xl rounded-[3rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] theme-transition relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
        
        {/* Header */}
        <div className="p-10 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01] theme-transition relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
              <ArrowDownCircle size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight uppercase leading-tight">Manual Drawdown</h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Individual LP Equalization Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 space-y-10 relative z-10 custom-scrollbar">
          
              <div className="space-y-3">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Equalization Interest (%)</label>
                <input 
                  type="number" 
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 8.0"
                  className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-5 text-foreground font-mono text-lg focus:border-purple-500/40 outline-none transition-all shadow-inner tracking-tighter"
                />
                <p className="text-[8px] text-text-muted/60 uppercase font-black ml-1">Charged for late entry into the fund pool</p>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between ml-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/60">Catch-up Calculator Suggestions</h3>
                {loadingSuggestions && <Loader2 className="w-3 h-3 animate-spin text-purple-500" />}
             </div>
             
             {suggestions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                   {suggestions.map((sug, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleApplySuggestion(sug)}
                        className="p-5 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center justify-between hover:bg-purple-500/10 transition-all text-left group"
                      >
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{sug.project_name}</p>
                            <p className="text-[9px] text-text-muted/60 uppercase font-black tracking-widest mt-1">Vehicle: {sug.fund_name}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-purple-500 tabular-nums">रू {sug.suggested_amount.toLocaleString()}</p>
                            <p className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1 group-hover:text-purple-500 transition-colors">Apply Suggested</p>
                         </div>
                      </button>
                   ))}
                </div>
             ) : !loadingSuggestions ? (
                <div className="p-6 bg-foreground/[0.02] border border-border-theme border-dashed rounded-2xl text-center">
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-40 italic">No equalization gaps discovered for this profile</p>
                </div>
             ) : null}
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Drawdown Amount (NPR)</label>
                <input 
                  type="number" 
                  value={formData.amount_npr}
                  onChange={(e) => setFormData({...formData, amount_npr: e.target.value})}
                  placeholder="e.g. 2,500,000"
                  className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-5 text-foreground font-mono text-lg focus:border-purple-500/40 outline-none transition-all shadow-inner tracking-tighter"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Calculated Interest (NPR)</label>
                <input 
                  type="number" 
                  value={formData.interest_npr}
                  readOnly
                  className="w-full bg-foreground/[0.02] border border-border-theme rounded-2xl p-5 text-text-muted font-mono text-lg outline-none cursor-not-allowed opacity-60"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Maturity Date</label>
                <input 
                  type="date" 
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-5 text-foreground font-black uppercase tracking-widest text-xs focus:border-purple-500/40 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Drawdown Notes</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-6 text-foreground text-sm font-medium focus:border-purple-500/40 outline-none transition-all shadow-inner leading-relaxed h-24"
                placeholder="Institutional justification for this manual call..."
              />
            </div>
            
            <div className="flex items-center gap-4 p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl group cursor-pointer" onClick={() => setFormData({...formData, auto_redistribute: !formData.auto_redistribute})}>
               <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.auto_redistribute ? 'bg-purple-500 border-purple-500' : 'border-border-theme bg-foreground/5'}`}>
                  {formData.auto_redistribute && <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-in zoom-in" />}
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Auto-Redistribute to Early LPs</p>
                  <p className="text-[9px] text-text-muted font-medium mt-1">Automatically rebalance capital for previous investors who fronted excess.</p>
               </div>
            </div>

            {formData.auto_redistribute && (
              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Redistribution Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, redistribute_mode: 'CREDIT'})}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      formData.redistribute_mode === 'CREDIT'
                        ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                        : 'bg-foreground/[0.02] border-border-theme hover:border-emerald-500/20'
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest ${formData.redistribute_mode === 'CREDIT' ? 'text-emerald-500' : 'text-foreground'}`}>Capital Netting</p>
                    <p className="text-[9px] text-text-muted mt-1">Add credits to early LPs. Deducted from their next capital call automatically.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, redistribute_mode: 'REFUND'})}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      formData.redistribute_mode === 'REFUND'
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : 'bg-foreground/[0.02] border-border-theme hover:border-amber-500/20'
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest ${formData.redistribute_mode === 'REFUND' ? 'text-amber-500' : 'text-foreground'}`}>Cash Refund</p>
                    <p className="text-[9px] text-text-muted mt-1">Create Distribution records. Pay early LPs back their excess share immediately.</p>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 flex items-center gap-4">
               <Info size={16} className="text-purple-500 shrink-0" />
               <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.1em] leading-normal">
                  Executing this protocol will generate a formal capital call record for this LP. 
                  They will receive immediate notification via secure channels.
               </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-border-theme bg-foreground/[0.01] flex gap-6 theme-transition relative z-10">
          <button 
            onClick={onClose}
            className="flex-1 px-8 py-4 bg-foreground/5 text-text-muted rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-foreground hover:bg-foreground/10 transition-all active:scale-95"
          >
            Discard
          </button>
          <button 
            onClick={handleIssue}
            disabled={isSubmitting || !formData.amount_npr || !formData.lp_commitment}
            className={`flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-[0.2em] text-[10px] px-8 py-4 rounded-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-2xl shadow-purple-500/30 active:scale-95`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CircleDollarSign size={20} />}
            {isSubmitting ? 'Executing Protocol...' : 'Issue Individual Call'}
          </button>
        </div>

      </div>
    </div>
  );
}
