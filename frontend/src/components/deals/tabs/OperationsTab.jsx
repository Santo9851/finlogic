import React from 'react';
import { BrainCircuit, Loader2, History } from 'lucide-react';

export default function OperationsTab({ deal, onRun, isLoading }) {
  const analysis = deal.operational_analyses?.[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Operational Due Diligence</h3>
            <p className="text-white/40 text-sm mt-1">Tech stack, key person risk, and supply chain audit</p>
          </div>
          <button 
            onClick={() => onRun()}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
            {analysis ? 'Re-Run Analysis' : 'Run Operational Analysis'}
          </button>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
               <div className="bg-black/40 p-8 rounded-3xl border border-white/5">
                  <h4 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest mb-6">Technology Stack</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {Object.entries(analysis.technology_stack || {}).map(([key, val]) => (
                        <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5">
                           <p className="text-[10px] text-white/30 uppercase font-black mb-1">{key}</p>
                           <p className="text-white text-xs font-bold">{String(val)}</p>
                        </div>
                     ))}
                  </div>
                  {Object.keys(analysis.technology_stack || {}).length === 0 && (
                    <p className="text-white/20 text-xs italic">No tech stack data identified.</p>
                  )}
               </div>

               <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Supply Chain Risks</h4>
                  <ul className="space-y-3">
                    {(analysis.supply_chain_risks || []).map((risk, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                         <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                         {risk}
                      </li>
                    ))}
                    {(analysis.supply_chain_risks || []).length === 0 && (
                      <p className="text-white/20 text-xs italic">No supply chain risks identified.</p>
                    )}
                  </ul>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Key Person Risk</h4>
                    <p className="text-white/20 text-[10px]">Dependency on founding team</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-3xl font-black ${analysis.key_person_risk_score > 7 ? 'text-red-500' : 'text-[#F59F01]'}`}>
                      {analysis.key_person_risk_score}/10
                    </span>
                  </div>
               </div>

               <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl">
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <History size={14} /> Operational Red Flags
                  </h4>
                  <ul className="space-y-4">
                    {(analysis.operational_red_flags || []).map((flag, i) => (
                      <li key={i} className="p-4 bg-black/20 rounded-xl border border-red-500/10 text-xs text-white/80 leading-relaxed font-serif italic">
                        {flag}
                      </li>
                    ))}
                    {(analysis.operational_red_flags || []).length === 0 && (
                      <p className="text-white/20 text-xs italic">No major red flags identified.</p>
                    )}
                  </ul>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6">
             <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mx-auto border border-white/5">
                <History size={40} />
             </div>
             <p className="text-white/20 italic text-sm">No operational analysis generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
