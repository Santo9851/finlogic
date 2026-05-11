'use client'

import React, { useState } from 'react';
import { X, CircleDollarSign, Calendar, Calculator, Loader2, Info } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function CapitalCallWizard({ deal, onClose, onRefresh }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    total_amount_npr: deal.term_sheets?.[0]?.terms?.investment_amount_npr || '',
    due_date: '',
    notes: `Initial drawdown for ${deal.legal_name}`
  });

  const handleIssue = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/deals/projects/${deal.id}/create-capital-calls/`, formData);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0d0124] border border-[#F59F01]/20 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
              <CircleDollarSign size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Issue Capital Call</h2>
              <p className="text-white/40 text-xs">LP Drawdown for {deal.legal_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 rounded-2xl p-4 flex items-start gap-3">
            <Info className="text-[#F59F01] shrink-0" size={18} />
            <p className="text-[10px] text-white/60 leading-relaxed uppercase font-bold tracking-tight">
              This will create pro-rata capital calls for all LPs committed to <span className="text-[#F59F01]">{deal.fund_detail?.name}</span>. 
              The system will automatically calculate each LP's share based on their commitment percentage.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                <Calculator size={12} /> Total Drawdown Amount (NPR)
              </label>
              <input 
                type="number" 
                value={formData.total_amount_npr}
                onChange={(e) => setFormData({...formData, total_amount_npr: e.target.value})}
                placeholder="e.g. 50,000,000"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono text-xl focus:border-[#F59F01] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Payment Due Date
              </label>
              <input 
                type="date" 
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#F59F01] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Administrative Notes</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#F59F01] outline-none transition-all"
                placeholder="Internal notes for this capital call..."
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
            onClick={handleIssue}
            disabled={isSubmitting || !formData.total_amount_npr || !formData.due_date}
            className="flex-[2] bg-[#F59F01] hover:bg-[#F59F01]/90 text-black font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-[#F59F01]/10"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <CircleDollarSign size={20} />}
            Issue Pro-Rata Calls
          </button>
        </div>

      </div>
    </div>
  );
}
