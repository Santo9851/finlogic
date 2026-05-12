import React, { useState } from 'react';
import { X, FileText, CheckCircle, ArrowRight, DollarSign, PieChart, ShieldCheck, Loader2, Landmark } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function InvestmentWizard({ deal, onClose, onRefresh }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Extract agreed terms from the latest Term Sheet
  const latestTS = deal.term_sheets?.[0];
  const terms = latestTS?.terms || {};

  const [formData, setFormData] = useState({
    investment_amount: terms.investment_amount_npr || '',
    valuation: terms.pre_money_valuation_npr || '',
    ownership_pct: terms.ownership_pct || '',
    instrument: terms.instrument || 'Equity Shares',
    loi_content: `• Exclusivity: ${terms.exclusivity_days || '45'} days.
• Governance: ${terms.board_seats || '1'} board seat(s) and ${terms.observer_rights || 'observer'} rights.
• Vesting: ${terms.vesting_schedule || '4-year founder vesting schedule'}.
• Exit Strategy: ${terms.exit_strategy_summary || 'Target IPO within 5-7 years.'}`
  });

  const handleIssueLOI = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/deals/projects/${deal.id}/issue-loi/`, {
        terms: {
          investment_amount: formData.investment_amount,
          valuation: formData.valuation,
          ownership_pct: formData.ownership_pct,
          instrument: formData.instrument
        },
        content: formData.loi_content
      });
      toast.success('LOI issued successfully');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error('Failed to issue LOI');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500 theme-transition">
      <div className="bg-card border border-border-theme w-full max-w-4xl rounded-[3rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] theme-transition relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        
        {/* Header */}
        <div className="p-10 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01] theme-transition relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
              <Landmark size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Close Deal Protocol</h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Transitioning {deal.legal_name} to Portfolio Asset</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 relative z-10">
          
          {/* Progress Stepper */}
          <div className="flex items-center justify-center gap-6 mb-16">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all shadow-lg ${step === s ? (isDark ? 'bg-ls-compliment text-white scale-110 shadow-ls-compliment/20' : 'bg-ls-secondary text-white scale-110 shadow-ls-secondary/20') : step > s ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-foreground/5 text-text-muted border border-border-theme'}`}>
                  {step > s ? <CheckCircle size={20} /> : s}
                </div>
                {s < 3 && <div className={`w-16 h-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-foreground/5'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-12">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Institutional Terms</h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] opacity-40">Define Commercial Parameters & Capital Allocation</p>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                      <DollarSign size={14} className="text-ls-compliment" /> Deployment Capital (NPR)
                    </label>
                    <input 
                      type="text" 
                      value={formData.investment_amount}
                      onChange={(e) => setFormData({...formData, investment_amount: e.target.value})}
                      placeholder="e.g. 50,000,000"
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-5 text-foreground font-mono text-sm focus:border-ls-compliment/40 outline-none shadow-inner transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                      <PieChart size={14} className="text-ls-compliment" /> Target Ownership %
                    </label>
                    <input 
                      type="text" 
                      value={formData.ownership_pct}
                      onChange={(e) => setFormData({...formData, ownership_pct: e.target.value})}
                      placeholder="e.g. 15"
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-5 text-foreground font-mono text-sm focus:border-ls-compliment/40 outline-none shadow-inner transition-all"
                    />
                  </div>
                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Pre-Money Equity Valuation (NPR)</label>
                    <input 
                      type="text" 
                      value={formData.valuation}
                      onChange={(e) => setFormData({...formData, valuation: e.target.value})}
                      placeholder="e.g. 250,000,000"
                      className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl p-5 text-foreground font-mono text-sm focus:border-ls-compliment/40 outline-none shadow-inner transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-12">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">LOI Refinement</h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] opacity-40">Add Strategic Nuances to the Letter of Intent</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Operational Provisions & Strategic Nuances</label>
                  <textarea 
                    value={formData.loi_content}
                    onChange={(e) => setFormData({...formData, loi_content: e.target.value})}
                    rows={12}
                    placeholder="Enter strategic nuances, exclusivity terms, or special governance rights..."
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-3xl p-6 text-foreground font-mono text-xs focus:border-ls-compliment/40 outline-none shadow-inner transition-all leading-relaxed"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-12 animate-in zoom-in-95 duration-500 space-y-10">
                <div className="w-24 h-24 bg-ls-compliment/10 rounded-3xl flex items-center justify-center text-ls-compliment mx-auto shadow-inner group">
                  <FileText size={48} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Authorization Pending</h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                    Initiating formal LOI generation. The counterparty will receive cryptographic notification to review terms and upload legal signatures.
                  </p>
                </div>
                
                <div className="bg-foreground/[0.02] border border-border-theme rounded-[2.5rem] p-10 text-left space-y-6 theme-transition shadow-inner">
                  <div className="flex justify-between items-center border-b border-border-theme/50 pb-4">
                    <span className="text-[9px] text-text-muted font-black uppercase tracking-[0.3em]">Capital Commitment</span>
                    <span className="text-foreground font-mono font-black uppercase tracking-tighter">NPR {formData.investment_amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-text-muted font-black uppercase tracking-[0.3em]">Asset Ownership</span>
                    <span className="text-foreground font-mono font-black uppercase tracking-tighter">{formData.ownership_pct}% Equity</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-10 border-t border-border-theme bg-foreground/[0.01] flex items-center justify-between theme-transition relative z-10">
          <button 
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1 || isSubmitting}
            className="px-10 py-4 bg-foreground/5 text-text-muted rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-foreground hover:bg-foreground/10 disabled:opacity-0 transition-all active:scale-95"
          >
            Previous
          </button>
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className={`px-10 py-4 ${isDark ? 'bg-ls-compliment shadow-ls-compliment/20' : 'bg-ls-secondary shadow-ls-secondary/20'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl active:scale-95`}
            >
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleIssueLOI}
              disabled={isSubmitting}
              className={`px-14 py-5 ${isDark ? 'bg-ls-compliment shadow-ls-compliment/20' : 'bg-ls-secondary shadow-ls-secondary/20'} text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-2xl active:scale-95`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              Execute Protocol
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
