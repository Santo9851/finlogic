import React from 'react';
import { BrainCircuit, Loader2, BarChart4 } from 'lucide-react';

export default function CommercialTab({ deal, onRun, isLoading }) {
  const analysis = deal.commercial_analyses?.[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Commercial Due Diligence</h3>
            <p className="text-white/40 text-sm mt-1">Market positioning and customer concentration analysis</p>
          </div>
          <button 
            onClick={() => onRun()}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
            {analysis ? 'Re-Run Analysis' : 'Run Commercial Analysis'}
          </button>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
               <div className="bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
                  <h4 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest mb-4">Market Positioning</h4>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-medium font-serif italic">
                    {analysis.market_positioning_notes}
                  </p>
               </div>
            </div>
            
            <div className="space-y-6">
               <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Customer Concentration</p>
                  <div className="text-4xl font-black text-white">{analysis.customer_concentration_pct}%</div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full ${analysis.customer_concentration_pct > 30 ? 'bg-red-500' : 'bg-[#10b981]'}`}
                      style={{ width: `${analysis.customer_concentration_pct}%` }}
                    />
                  </div>
               </div>

               <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Top Customers</h4>
                  <div className="text-white/70 text-sm whitespace-pre-wrap">
                    {analysis.top_customer_names || "No specific customer data extracted."}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6">
             <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mx-auto border border-white/5">
                <BarChart4 size={40} />
             </div>
             <p className="text-white/20 italic text-sm">No commercial analysis generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
