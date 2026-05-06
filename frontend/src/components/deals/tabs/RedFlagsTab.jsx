import React from 'react';
import { BrainCircuit, CheckCircle2, CheckCircle, ExternalLink } from 'lucide-react';

export default function RedFlagsTab({ deal, onReview, onViewSource, isSplitView = false }) {
  const findings = deal.red_flags || [];

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${isSplitView ? 'pb-20' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            Legal Red Flags
            {isSplitView && <span className="bg-[#F59F01] text-black text-[10px] px-2 py-0.5 rounded ml-2">Review Mode</span>}
          </h3>
          <p className="text-white/40 text-sm mt-1">AI-detected legal risks and contract anomalies</p>
        </div>
        <div className="flex gap-4">
           <SeveritySummary count={findings.filter(f => f.severity === 'CRITICAL').length} label="Critical" color="bg-red-500" />
           <SeveritySummary count={findings.filter(f => f.severity === 'WARNING').length} label="Warning" color="bg-[#F59F01]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {findings.map((f) => (
          <div key={f.id} className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20 ${f.is_reviewed_by_gp ? 'opacity-60' : ''}`}>
            <div className="p-6 flex items-start justify-between gap-6">
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${f.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-[#F59F01] shadow-[0_0_8px_#F59F01]'}`} />
                     <h4 className="text-white font-bold text-lg">{f.pattern_detail?.name || 'Manual Finding'}</h4>
                     <button 
                       onClick={() => onViewSource(f.document)}
                       className="text-[10px] text-white/30 font-black uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded hover:bg-white/5 transition-all flex items-center gap-1.5"
                     >
                       {f.document_name} <ExternalLink size={10} />
                     </button>
                  </div>
                  
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-white/60 italic leading-relaxed">
                     "...{f.context_snippet}..."
                  </div>

                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">AI Analysis & Risk Mitigation</p>
                     <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-serif italic">
                        {f.ai_analysis}
                     </p>
                  </div>

                  {f.pattern_detail?.nepal_context_note && (
                    <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 p-4 rounded-xl">
                       <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest mb-1">Nepal Regulatory Context</p>
                       <p className="text-white/60 text-xs">{f.pattern_detail.nepal_context_note}</p>
                    </div>
                  )}
               </div>

               <div className="w-48 flex flex-col items-end gap-4">
                  {f.is_reviewed_by_gp ? (
                    <div className="text-right">
                       <p className="text-[#10b981] text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 mb-1">
                         <CheckCircle2 size={14} /> Reviewed
                       </p>
                       <p className="text-white/20 text-[9px] font-bold">By {f.reviewed_by_detail?.email || 'GP'}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onReview(f.id)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-white/5"
                    >
                      Mark Reviewed
                    </button>
                  )}
                  
                  <button 
                    onClick={() => onViewSource(f.document)}
                    className="w-full py-2 bg-[#F59F01]/10 border border-[#F59F01]/20 rounded-xl text-[#F59F01] text-[10px] font-black uppercase tracking-widest hover:bg-[#F59F01] hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={14} /> View Evidence
                  </button>
               </div>
            </div>
          </div>
        ))}

        {findings.length === 0 && (
          <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl space-y-4">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 mx-auto border border-white/5">
                <BrainCircuit size={32} />
             </div>
             <div className="max-w-xs mx-auto">
               <p className="text-white font-bold text-sm">No legal red flags detected</p>
               <p className="text-white/20 text-xs mt-2 italic">Use the AI Scan button on documents in the Data Room to begin legal due diligence.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SeveritySummary({ count, label, color }) {
  return (
    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl">
       <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px] shadow-current`} />
       <div className="flex flex-col">
          <span className="text-white font-black text-lg leading-none">{count}</span>
          <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{label}</span>
       </div>
    </div>
  );
}

