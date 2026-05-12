import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, CheckCircle, ExternalLink, AlertTriangle, X, ShieldAlert, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function RedFlagsTab({ deal, onReview, onViewSource, isSplitView = false }) {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualRisk, setManualRisk] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const legalFindings = (deal.red_flags || []).map(f => ({
    ...f,
    type: 'LEGAL',
    sourceName: f.document_name,
    title: f.pattern_detail?.name || 'Legal Risk',
    content: f.context_snippet,
    analysis: f.ai_analysis
  }));

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
    <div className={`space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 theme-transition ${isSplitView ? 'pb-20' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-foreground tracking-tight uppercase flex items-center gap-3">
            Risk Intelligence
            {isSplitView && <span className="bg-[#F59F01] text-ls-primary-fixed text-[10px] px-3 py-1 rounded-full ml-2">Review Mode</span>}
          </h3>
          <p className="text-text-muted text-sm mt-1 font-medium">Aggregated legal, operational, and financial red flags</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <button 
             onClick={() => setShowManualEntry(true)}
             className="px-6 py-3 bg-foreground/5 hover:bg-foreground/10 border border-border-theme rounded-2xl text-foreground text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg active:scale-95"
           >
             <AlertTriangle size={16} className="text-[#F59F01]" />
             Log Manual Risk
           </button>
           <SeveritySummary count={findings.filter(f => f.severity === 'CRITICAL').length} label="Critical" color="bg-rose-500 shadow-rose-500/50" />
           <SeveritySummary count={findings.filter(f => f.severity === 'WARNING' || f.severity === 'OPERATIONAL' || f.severity === 'FINANCIAL').length} label="Watchlist" color="bg-[#F59F01] shadow-[#F59F01]/50" />
        </div>
      </div>

      {showManualEntry && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500 theme-transition">
          <div className="max-w-2xl w-full bg-card border border-border-theme p-12 rounded-[3rem] shadow-2xl relative theme-transition">
            <button 
              onClick={() => setShowManualEntry(false)}
              className="absolute top-10 right-10 text-text-muted/40 hover:text-foreground transition-all p-2 hover:bg-foreground/5 rounded-xl border border-border-theme/50"
            >
              <X size={24} />
            </button>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Log Strategic Risk</h4>
                <p className="text-text-muted text-sm font-medium">Identify a red flag that wasn't captured in automated scans.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Risk Title</label>
                  <input 
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g., Hidden Key Person Dependency"
                    className="w-full bg-foreground/5 border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm font-bold focus:outline-none focus:border-[#F59F01] transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Risk Description (MD Supported)</label>
                  <textarea 
                    value={manualRisk}
                    onChange={(e) => setManualRisk(e.target.value)}
                    placeholder="Provide full context about why this is a deal-breaker..."
                    className="w-full h-48 bg-foreground/5 border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm font-medium focus:outline-none focus:border-[#F59F01] transition-all resize-none shadow-inner"
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowManualEntry(false)}
                disabled={!manualTitle || manualRisk.length < 50}
                className="w-full py-5 bg-[#F59F01] text-ls-primary-fixed rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all disabled:opacity-20 shadow-2xl shadow-[#F59F01]/20 active:scale-95"
              >
                Log Red Flag to Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {findings.map((f) => (
          <div key={f.id} className={`bg-card border border-border-theme rounded-[2.5rem] overflow-hidden transition-all hover:border-[#F59F01]/30 shadow-xl hover:shadow-2xl theme-transition ${f.is_reviewed_by_gp ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="p-8 flex flex-col lg:flex-row lg:items-start justify-between gap-8">
               <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4 flex-wrap">
                      <div className={`w-3 h-3 rounded-full ${f.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'bg-[#F59F01] shadow-[0_0_12px_rgba(245,159,1,0.5)]'} animate-pulse`} />
                      <h4 className="text-foreground font-black text-xl tracking-tight uppercase">{f.title}</h4>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                         f.type === 'LEGAL' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 
                         f.type === 'FINANCIAL' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                         'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      }`}>
                         {f.type}
                      </span>
                      {f.type === 'LEGAL' ? (
                        <button 
                          onClick={() => onViewSource(f.document)}
                          className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest border border-border-theme px-3 py-1 rounded-full hover:bg-foreground/5 hover:text-foreground transition-all flex items-center gap-2 bg-background/50 shadow-sm"
                        >
                          {f.sourceName} <ExternalLink size={12} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-muted/60 font-black uppercase tracking-widest border border-border-theme px-3 py-1 rounded-full bg-background/50 shadow-sm">
                           {f.sourceName}
                        </span>
                      )}
                  </div>

                  <div className="bg-foreground/[0.02] p-6 rounded-2xl border border-border-theme font-mono text-xs text-text-muted leading-relaxed shadow-inner">
                      {f.type === 'LEGAL' ? `"...${f.content}..."` : f.content}
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-[0.2em] flex items-center gap-2">
                        <BrainCircuit size={14} /> AI Analysis & Risk Mitigation
                      </p>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed font-medium">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                           {f.analysis}
                         </ReactMarkdown>
                      </div>
                   </div>
               </div>

               <div className="w-full lg:w-56 flex flex-col items-stretch lg:items-end gap-4">
                   {f.is_reviewed_by_gp ? (
                     <div className="text-right bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 w-full">
                        <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-end gap-2 mb-1">
                          <CheckCircle2 size={16} /> Reviewed
                        </p>
                        <p className="text-text-muted/60 text-[9px] font-bold uppercase tracking-widest">By {f.reviewed_by_detail?.email || 'GP Collaborator'}</p>
                     </div>
                   ) : f.type === 'LEGAL' ? (
                     <button 
                       onClick={() => onReview(f.id)}
                       className="w-full py-4 bg-foreground/5 hover:bg-foreground/10 border border-border-theme rounded-2xl text-foreground text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                     >
                       Mark Reviewed
                     </button>
                   ) : (
                     <div className="text-right opacity-40">
                       <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] italic">Live Audit Data</p>
                     </div>
                   )}

                    {f.type === 'LEGAL' && (
                      <button 
                        onClick={() => onViewSource(f.document)}
                        className="w-full py-4 bg-[#F59F01]/5 border border-[#F59F01]/20 rounded-2xl text-[#F59F01] text-[10px] font-black uppercase tracking-widest hover:bg-[#F59F01] hover:text-ls-primary-fixed transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                      >
                        <ExternalLink size={16} /> View Evidence
                      </button>
                    )}
               </div>
            </div>
          </div>
        ))}

        {findings.length === 0 && (
          <div className="py-24 text-center bg-card border border-border-theme border-dashed rounded-[3rem] shadow-inner theme-transition space-y-6">
             <div className="w-20 h-20 rounded-[2rem] bg-foreground/5 flex items-center justify-center text-text-muted/10 mx-auto border border-border-theme shadow-inner">
                <ShieldAlert size={40} className="opacity-20" />
             </div>
             <div className="max-w-xs mx-auto space-y-2">
               <p className="text-foreground font-black text-lg uppercase tracking-widest">Zero Red Flags Detected</p>
               <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-widest italic leading-relaxed">No critical risks identified. Automated legal scans and audits found no deal-breakers.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SeveritySummary({ count, label, color }) {
  return (
    <div className="bg-card border border-border-theme px-6 py-4 rounded-[1.5rem] flex items-center gap-4 shadow-xl theme-transition">
       <div className={`w-3 h-3 rounded-full ${color} shadow-[0_0_12px] shadow-current animate-pulse`} />
       <div className="flex flex-col">
          <span className="text-foreground font-black text-2xl leading-none">{count}</span>
          <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mt-1 opacity-60">{label}</span>
       </div>
    </div>
  );
}
