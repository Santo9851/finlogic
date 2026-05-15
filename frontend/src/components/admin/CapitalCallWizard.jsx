'use client'

/**
 * CapitalCallWizard.jsx
 * Institutional Capital Drawdown Protocol for Superadmins.
 */
import React, { useState } from 'react';
import { X, CircleDollarSign, Calendar, Calculator, Loader2, Info, Landmark } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function CapitalCallWizard({ deal, fund, onClose, onRefresh }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    total_amount_npr: deal?.term_sheets?.[0]?.terms?.investment_amount_npr || '',
    due_date: '',
    call_type: deal ? 'INVESTMENT' : 'MANAGEMENT_FEE',
    notes: deal ? `Initial drawdown for ${deal.legal_name}` : `Institutional Management Fee Drawdown - ${new Date().getFullYear()} Q${Math.floor(new Date().getMonth() / 3) + 1}`
  });

  const handleIssue = async () => {
    setIsSubmitting(true);
    try {
      const endpoint = deal 
        ? `/deals/projects/${deal.id}/create-capital-calls/` 
        : `/deals/funds/${fund.id}/create-capital-calls/`;
      await api.post(endpoint, formData);
      toast.success('Capital calls issued successfully');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to issue capital calls');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500 theme-transition">
      <div className="bg-card border border-border-theme w-full max-w-xl rounded-[3rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] theme-transition relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
        
        {/* Header */}
        <div className="p-10 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01] theme-transition relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
              <Landmark size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight uppercase leading-tight">Capital Drawdown</h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">LP Pro-Rata Protocol for {deal?.legal_name || fund?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 space-y-10 relative z-10 custom-scrollbar">
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-[2rem] p-6 flex items-start gap-5 shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
              <Info size={20} />
            </div>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] leading-relaxed opacity-80">
              This will execute pro-rata capital calls for all LPs committed to <span className="text-purple-500">{deal?.fund_detail?.name || fund?.name || 'Institutional Vehicle'}</span>. 
              The system will automatically compute allocations based on the commitment matrix.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                <Calculator size={14} className="text-purple-500" /> Total Drawdown Quantum (NPR)
              </label>
              <input 
                type="number" 
                value={formData.total_amount_npr}
                onChange={(e) => setFormData({...formData, total_amount_npr: e.target.value})}
                placeholder="e.g. 50,000,000"
                className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-6 text-foreground font-mono text-2xl focus:border-purple-500/40 outline-none transition-all shadow-inner tracking-tighter"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                <Calendar size={14} className="text-purple-500" /> Settlement Maturity Date
              </label>
              <input 
                type="date" 
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-6 text-foreground font-black uppercase tracking-widest text-xs focus:border-purple-500/40 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Administrative Protocols</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-6 text-foreground text-sm font-medium focus:border-purple-500/40 outline-none transition-all shadow-inner leading-relaxed"
                placeholder="Internal notes for this capital call cycle..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Call Type (Purpose)</label>
              <select 
                value={formData.call_type}
                onChange={(e) => setFormData({...formData, call_type: e.target.value})}
                className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-6 text-foreground font-black uppercase tracking-widest text-xs focus:border-purple-500/40 outline-none transition-all shadow-inner"
              >
                <option value="INVESTMENT">Investment Capital</option>
                <option value="MANAGEMENT_FEE">Management Fee</option>
                <option value="FUND_EXPENSE">Fund Expense</option>
                <option value="OTHER">Other Institutional Call</option>
              </select>
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
            disabled={isSubmitting || !formData.total_amount_npr || !formData.due_date}
            className={`flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-[0.2em] text-[10px] px-8 py-4 rounded-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-2xl shadow-purple-500/30 active:scale-95`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CircleDollarSign size={20} />}
            Execute Drawdown
          </button>
        </div>

      </div>
    </div>
  );
}
