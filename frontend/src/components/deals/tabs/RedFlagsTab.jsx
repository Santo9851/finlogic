import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, CheckCircle, ExternalLink, AlertTriangle, X, ShieldAlert, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function RedFlagsTab({ deal, onReview, onViewSource, isSplitView = false }) {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualRisk, setManualRisk] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Aggregate document-based legal findings
  const legalFindings = (deal.red_flags || []).map(f => ({
    ...f,
    type: 'LEGAL',
    sourceName: f.document_name,
    title: f.pattern_detail?.name || 'Legal Risk',
    content: f.context_snippet,
    analysis: f.ai_analysis
  }));

  // Aggregate audit-based operational red flags
  const latestOp = deal.operational_analyses?.[0];
  const operationalFindings = (latestOp?.operational_red_flags || []).map((flag, idx) => ({
    id: `op-${idx}`,
    type: 'OPERATIONAL',
    severity: 'WARNING',
    sourceName: 'Operational Audit',
    title: 'Operational Red Flag',
    content: flag,
    analysis: "This risk was identified during the multimodal operational due diligence audit of the firm's structure, tech stack, and supply chain.",
    is_reviewed_by_gp: false
  }));

  // Aggregate financial red flags from QoE reports
  const latestQoE = deal.qoe_reports?.[0];
  const financialFindings = (latestQoE && latestQoE.status !== 'CLEAN') ? [{
    id: `qoe-${latestQoE.id}`,
    type: 'FINANCIAL',
    severity: latestQoE.status === 'HIGH_RISK' ? 'CRITICAL' : 'WARNING',
    sourceName: 'QoE Report',
    title: `Financial ${latestQoE.status === 'HIGH_RISK' ? 'Critical' : 'Caution'}`,
    content: `The Quality of Earnings report has flagged this project with a ${latestQoE.status} status.`,
    analysis: latestQoE.report_text?.substring(0, 500) + '...',
    is_reviewed_by_gp: false
  }] : [];

  const findings = [...legalFindings, ...operationalFindings, ...financialFindings].sort((a, b) => {
    if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
    if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
    return 0;
  });

  return (
    <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${isSplitView ? 'pb-20' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            Unified Risk Intelligence
            {isSplitView && <span className="bg-[#F59F01] text-black text-[10px] px-2 py-0.5 rounded ml-2">Review Mode</span>}
          </h3>
          <p className="text-white/40 text-sm mt-1">Aggregated legal, operational, and commercial red flags</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowManualEntry(true)}
             className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
           >
             <AlertTriangle size={14} className="text-[#F59F01]" />
             Log Manual Risk
           </button>
           <SeveritySummary count={findings.filter(f => f.severity === 'CRITICAL').length} label="Critical" color="bg-red-500" />
           <SeveritySummary count={findings.filter(f => f.severity === 'WARNING' || f.severity === 'OPERATIONAL' || f.severity === 'FINANCIAL').length} label="Watchlist" color="bg-[#F59F01]" />
        </div>
      </div>

      {/* Manual Risk Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-[100] bg-[#100226]/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-xl w-full bg-[#140b2e] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative">
            <button 
              onClick={() => setShowManualEntry(false)}
              className="absolute top-8 right-8 text-white/20 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Log Strategic Risk</h4>
                <p className="text-white/40 text-xs font-medium">Manually identify a red flag that wasn't captured in automated scans.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Risk Title</label>
                  <input 
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Hidden Key Person Dependency"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F59F01]/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Risk Description (MD Supported)</label>
                  <textarea 
                    value={manualRisk}
                    onChange={(e) => setManualRisk(e.target.value)}
                    placeholder="Provide full context about why this is a deal-breaker..."
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F59F01]/50 transition-colors resize-none font-serif italic"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  // This will be connected to the onReview or a new onManualRisk prop
                  setShowManualEntry(false);
                }}
                disabled={!manualTitle || manualRisk.length < 50}
                className="w-full py-4 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-20"
              >
                Log Red Flag to Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {findings.map((f) => (
          <div key={f.id} className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20 ${f.is_reviewed_by_gp ? 'opacity-60' : ''}`}>
            <div className="p-6 flex items-start justify-between gap-6">
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${f.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-[#F59F01] shadow-[0_0_8px_#F59F01]'}`} />
                     <h4 className="text-white font-bold text-lg">{f.title}</h4>
                     <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                        f.type === 'LEGAL' ? 'bg-blue-500/10 text-blue-400' : 
                        f.type === 'FINANCIAL' ? 'bg-emerald-500/10 text-emerald-400' : 
                        'bg-purple-500/10 text-purple-400'
                     }`}>
                        {f.type}
                     </span>
                     {f.type === 'LEGAL' ? (
                       <button 
                         onClick={() => onViewSource(f.document)}
                         className="text-[10px] text-white/30 font-black uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded hover:bg-white/5 transition-all flex items-center gap-1.5"
                       >
                         {f.sourceName} <ExternalLink size={10} />
                       </button>
                     ) : (
                       <span className="text-[10px] text-white/30 font-black uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
                          {f.sourceName}
                       </span>
                     )}
                  </div>
                  
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-white/60 italic leading-relaxed">
                     {f.type === 'LEGAL' ? `"...${f.content}..."` : f.content}
                  </div>

                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">AI Analysis & Risk Mitigation</p>
                     <div className="article-body prose prose-invert max-w-none text-white/80 text-sm leading-relaxed font-serif italic">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {f.analysis}
                        </ReactMarkdown>
                     </div>
                  </div>
               </div>

               <div className="w-48 flex flex-col items-end gap-4">
                  {f.is_reviewed_by_gp ? (
                    <div className="text-right">
                       <p className="text-[#10b981] text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 mb-1">
                         <CheckCircle2 size={14} /> Reviewed
                       </p>
                       <p className="text-white/20 text-[9px] font-bold">By {f.reviewed_by_detail?.email || 'GP'}</p>
                    </div>
                  ) : f.type === 'LEGAL' ? (
                    <button 
                      onClick={() => onReview(f.id)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-white/5"
                    >
                      Mark Reviewed
                    </button>
                  ) : (
                    <div className="text-right">
                      <p className="text-white/20 text-[9px] font-black uppercase tracking-widest italic">Live Audit Data</p>
                    </div>
                  )}
                  
                  {f.type === 'LEGAL' && (
                    <button 
                      onClick={() => onViewSource(f.document)}
                      className="w-full py-2 bg-[#F59F01]/10 border border-[#F59F01]/20 rounded-xl text-[#F59F01] text-[10px] font-black uppercase tracking-widest hover:bg-[#F59F01] hover:text-black transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} /> View Evidence
                    </button>
                  )}
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

