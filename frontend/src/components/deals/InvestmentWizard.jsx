import React, { useState } from 'react';
import { X, FileText, CheckCircle, ArrowRight, DollarSign, PieChart, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function InvestmentWizard({ deal, onClose, onRefresh }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    investment_amount: '',
    valuation: '',
    ownership_pct: '',
    instrument: 'Equity Shares',
    loi_content: `
      <ul>
        <li><strong>Exclusivity:</strong> 45 days.</li>
        <li><strong>Governance:</strong> One board seat and observer rights.</li>
        <li><strong>Vesting:</strong> 4-year founder vesting schedule.</li>
        <li><strong>Exit Strategy:</strong> Target IPO within 5-7 years.</li>
      </ul>
    `
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0f172a] border border-white/10 w-full max-w-4xl rounded-[40px] shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Close Deal Wizard</h2>
              <p className="text-white/40 text-xs">Transition {deal.legal_name} from Lead to Portfolio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12">
          
          {/* Progress Stepper */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${step === s ? 'bg-[#F59F01] text-black scale-110' : step > s ? 'bg-[#10b981] text-white' : 'bg-white/5 text-white/20'}`}>
                  {step > s ? <CheckCircle size={18} /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#10b981]' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center max-w-md mx-auto mb-10">
                <h3 className="text-xl font-bold text-white mb-2">Investment Terms</h3>
                <p className="text-white/40 text-sm">Define the final commercial parameters of the deal.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                    <DollarSign size={12} /> Investment Amount (NPR)
                  </label>
                  <input 
                    type="text" 
                    value={formData.investment_amount}
                    onChange={(e) => setFormData({...formData, investment_amount: e.target.value})}
                    placeholder="e.g. 50,000,000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono focus:border-[#F59F01] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                    <PieChart size={12} /> Target Ownership %
                  </label>
                  <input 
                    type="text" 
                    value={formData.ownership_pct}
                    onChange={(e) => setFormData({...formData, ownership_pct: e.target.value})}
                    placeholder="e.g. 15"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono focus:border-[#F59F01] outline-none"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Pre-Money Valuation (NPR)</label>
                  <input 
                    type="text" 
                    value={formData.valuation}
                    onChange={(e) => setFormData({...formData, valuation: e.target.value})}
                    placeholder="e.g. 250,000,000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono focus:border-[#F59F01] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center max-w-md mx-auto mb-10">
                <h3 className="text-xl font-bold text-white mb-2">Refine LOI Details</h3>
                <p className="text-white/40 text-sm">Add specific nuances to the Letter of Intent.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Strategic Nuances (HTML allowed)</label>
                <textarea 
                  value={formData.loi_content}
                  onChange={(e) => setFormData({...formData, loi_content: e.target.value})}
                  rows={10}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm focus:border-[#F59F01] outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-[#F59F01]/10 rounded-full flex items-center justify-center text-[#F59F01] mx-auto mb-8">
                <FileText size={48} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Ready to Issue LOI?</h3>
              <p className="text-white/40 max-w-sm mx-auto mb-8">
                This will generate a formal PDF and notify the entrepreneur. They will be prompted to review terms and upload a signed contract.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left max-w-md mx-auto space-y-4">
                <div className="flex justify-between">
                  <span className="text-[10px] text-white/20 uppercase font-black">Investment</span>
                  <span className="text-white font-mono font-bold">NPR {formData.investment_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-white/20 uppercase font-black">Ownership</span>
                  <span className="text-white font-mono font-bold">{formData.ownership_pct}%</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <button 
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1 || isSubmitting}
            className="px-8 py-3 bg-white/5 text-white/40 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-white disabled:opacity-0 transition-all"
          >
            Back
          </button>
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="px-8 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleIssueLOI}
              disabled={isSubmitting}
              className="px-12 py-4 bg-[#F59F01] text-black rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[#F59F01]/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
              Issue LOI
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
