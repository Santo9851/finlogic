import React, { useState, useEffect } from 'react';
import { BrainCircuit, Loader2, History, ShieldCheck, Cpu, AlertTriangle, Users, Target, Edit3, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { projectService } from '@/services/project';
import { toast } from 'sonner';

export default function OperationsTab({ deal, onRun, isLoading }) {
  const analysis = deal.operational_analyses?.[0];
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Preparation Flow State
  const [showPrep, setShowPrep] = useState(false);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [provideManual, setProvideManual] = useState(false);
  const [manualContext, setManualContext] = useState('');

  useEffect(() => {
    if (analysis) {
      setEditedText(analysis.thesis_markdown || analysis.operational_red_flags?.join('\n\n') || '');
    }
  }, [analysis]);

  const wordCount = manualContext.trim() ? manualContext.trim().split(/\s+/).length : 0;
  const canRun = filesUploaded || (provideManual && wordCount >= 100);

  // Track if the background task is currently active
  const isProcessing = deal.analysis_progress?.['Operational'] === 'processing' || isLoading;

  const handleRun = () => {
    onRun(manualContext);
    setShowPrep(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await projectService.updateOperationalAnalysis(deal.id, {
        thesis_markdown: editedText
      });
      toast.success('Operational thesis refined and saved.');
      setIsEditing(false);
      analysis.thesis_markdown = editedText; 
    } catch (error) {
      toast.error('Failed to save refinements.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 theme-transition">
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl theme-transition">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 border-b border-border-theme pb-8">
          <div>
            <h3 className="text-3xl font-black text-ls-primary dark:text-white tracking-tight uppercase tracking-tighter">Operational Audit</h3>
            <p className="text-text-muted text-sm mt-1 uppercase tracking-widest font-bold">Tech Stack, Team Risk & Supply Chain Review</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-4 py-4 bg-ls-primary/5 dark:bg-white/5 text-ls-primary/40 dark:text-white/40 hover:text-ls-primary dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-border-theme"
              title="Force Refresh Data"
            >
              <History size={16} />
              Sync
            </button>

            {analysis && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-ls-primary/5 dark:bg-white/5 text-ls-primary dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-ls-primary/10 dark:hover:bg-white/10 transition-all border border-border-theme"
              >
                <Edit3 size={16} />
                Refine Audit
              </button>
            )}

            {!isEditing ? (
              <button 
                onClick={() => setShowPrep(true)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#F59F01] text-ls-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#F59F01]/20 disabled:opacity-50 active:scale-95"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                {analysis ? 'Re-Run Audit' : 'Start Operational Analysis'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-ls-primary/5 dark:bg-white/5 text-ls-primary/50 dark:text-white/50 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-ls-primary dark:hover:text-white transition-all"
                >
                  <X size={16} />
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#10b981] text-ls-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#10b981]/20 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Audit
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Task Status Banner */}
        {isProcessing && (
          <div className="mb-8 p-6 bg-[#F59F01]/10 border border-[#F59F01]/20 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F59F01] flex items-center justify-center text-ls-primary">
                <BrainCircuit size={20} className="animate-spin" />
              </div>
              <div>
                <p className="text-ls-primary dark:text-white font-black text-sm uppercase tracking-widest">AI Audit in Progress</p>
                <p className="text-[#F59F01] text-[10px] font-bold uppercase">Extracting operational insights from data room & manual context...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-ls-primary/5 dark:bg-white/5 rounded-full border border-border-theme">
              <Loader2 size={14} className="animate-spin text-ls-primary/40 dark:text-white/40" />
              <span className="text-[10px] font-black text-ls-primary/40 dark:text-white/40 uppercase tracking-tighter">Polling Status...</span>
            </div>
          </div>
        )}

        {/* Preparation Overlay */}
        {showPrep && (
          <div className="fixed inset-0 z-[100] bg-ls-primary/80 dark:bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 md:p-10 animate-in fade-in zoom-in-95 duration-300 theme-transition">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-8 bg-background border border-border-theme p-8 md:p-12 rounded-[3rem] shadow-2xl relative theme-transition">
               <button 
                 onClick={() => setShowPrep(false)}
                 className="absolute top-8 right-8 text-ls-primary/20 dark:text-white/20 hover:text-ls-primary dark:hover:text-white transition-colors"
               >
                 <X size={24} />
               </button>
               <div className="text-center space-y-4">
                  <h3 className="text-3xl font-black text-ls-primary dark:text-white uppercase tracking-tighter">Strategic Preparation</h3>
                  <p className="text-ls-primary/40 dark:text-white/40 text-sm font-medium leading-relaxed">
                    To ensure a high-fidelity audit, the AI requires specific operational context. 
                    Please verify your data sources before proceeding.
                  </p>
               </div>

               <div className="space-y-6">
                <label className="flex items-start gap-4 p-6 bg-ls-primary/5 dark:bg-white/[0.03] border border-border-theme rounded-2xl cursor-pointer hover:bg-ls-primary/10 dark:hover:bg-white/[0.05] transition-all group">
                  <input 
                    type="checkbox" 
                    checked={filesUploaded}
                    onChange={(e) => {
                      setFilesUploaded(e.target.checked);
                      if (e.target.checked) setProvideManual(false);
                    }}
                    className="mt-1 w-5 h-5 rounded border-border-theme bg-ls-primary/5 dark:bg-white/5 text-[#F59F01] focus:ring-[#F59F01]"
                  />
                  <div>
                    <p className="text-ls-primary dark:text-white font-bold text-sm uppercase tracking-wider">Data Room Readiness</p>
                    <p className="text-text-muted text-xs mt-1">I have uploaded Tech Stack, Org Charts, and Operational Audit documents to the Data Room.</p>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-6 bg-ls-primary/5 dark:bg-white/[0.03] border border-border-theme rounded-2xl cursor-pointer hover:bg-ls-primary/10 dark:hover:bg-white/[0.05] transition-all group">
                  <input 
                    type="checkbox" 
                    checked={provideManual}
                    onChange={(e) => {
                      setProvideManual(e.target.checked);
                      if (e.target.checked) setFilesUploaded(false);
                    }}
                    className="mt-1 w-5 h-5 rounded border-border-theme bg-ls-primary/5 dark:bg-white/5 text-[#F59F01] focus:ring-[#F59F01]"
                  />
                  <div>
                    <p className="text-ls-primary dark:text-white font-bold text-sm uppercase tracking-wider">Manual Operational Context</p>
                    <p className="text-text-muted text-xs mt-1">I will provide expert context about the business operations to ground the analysis.</p>
                  </div>
                </label>

                  {provideManual && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <textarea 
                      value={manualContext}
                      onChange={(e) => setManualContext(e.target.value)}
                      placeholder="Provide deep context about the tech moat, supply chain logic, and founder dependencies (Minimum 100 words)..."
                      className="w-full h-48 bg-ls-primary/5 dark:bg-black/40 border border-[#F59F01]/20 rounded-2xl p-6 text-ls-primary dark:text-white text-sm focus:border-[#F59F01] focus:ring-1 focus:ring-[#F59F01] transition-all placeholder:text-text-muted"
                    />
                      <div className="flex items-center justify-between px-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${wordCount >= 100 ? 'text-emerald-400' : 'text-[#F59F01]'}`}>
                          {wordCount} / 100 Words
                        </span>
                        {wordCount < 100 && (
                          <span className="text-[10px] text-white/20 italic">Provide more detail to ground the AI.</span>
                        )}
                      </div>
                    </div>
                  )}
               </div>

               <div className="flex items-center gap-4 pt-4">
                  <button 
                    onClick={() => setShowPrep(false)}
                    className="flex-1 px-8 py-5 bg-ls-primary/5 dark:bg-white/5 text-ls-primary/50 dark:text-white/50 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-ls-primary dark:hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRun}
                    disabled={!canRun}
                    className="flex-[2] flex items-center justify-center gap-2 px-8 py-5 bg-[#F59F01] text-ls-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#F59F01]/20 disabled:opacity-20 disabled:grayscale"
                  >
                    <BrainCircuit size={18} />
                    Confirm & Run Analysis
                  </button>
               </div>
            </div>
          </div>
        )}

        {analysis && !isProcessing ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Thesis Area */}
            <div className="lg:col-span-8 space-y-8">
               <div className={`bg-ls-primary/5 dark:bg-black/30 rounded-[2rem] border transition-all duration-500 relative group overflow-hidden ${isEditing ? 'border-[#F59F01]/30 ring-1 ring-[#F59F01]/10' : 'border-border-theme'}`}>
                  <div className="absolute top-8 right-10 flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                    <ShieldCheck size={14} className={isEditing ? 'text-[#F59F01]' : 'text-emerald-600 dark:text-emerald-400'} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {isEditing ? 'Expert Audit Refinement' : 'Verified Operational Context'}
                    </span>
                  </div>
                  
                  <div className="p-10">
                    {isEditing ? (
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full h-[500px] bg-transparent text-ls-primary/90 dark:text-white/90 text-lg leading-relaxed focus:outline-none resize-none font-medium selection:bg-[#F59F01]/30"
                        placeholder="Refine the operational audit results..."
                      />
                    ) : (
                      <div className="article-body prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {analysis.thesis_markdown || (analysis.operational_red_flags?.[0]?.length > 200 ? analysis.operational_red_flags[0] : "No detailed thesis generated. Review red flags below.")}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
               </div>
            </div>
            
            {/* Analytical Sidepanel */}
            <div className="lg:col-span-4 space-y-6">
               {/* Tech Stack Card */}
               <div className="bg-ls-primary/5 dark:bg-white/[0.03] border border-border-theme p-6 rounded-3xl relative overflow-hidden theme-transition">
                  <div className="flex items-center gap-2 mb-6">
                    <Cpu size={18} className="text-[#F59F01]" />
                    <h4 className="text-[10px] font-black text-ls-primary dark:text-white uppercase tracking-widest tracking-tighter">Core Technology Stack</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                     {typeof analysis.technology_stack === 'object' && !Array.isArray(analysis.technology_stack) ? (
                        <div className="grid grid-cols-2 gap-3">
                           {Object.entries(analysis.technology_stack).map(([key, val]) => (
                              <div key={key} className="bg-ls-primary/5 dark:bg-white/5 p-3 rounded-xl border border-border-theme">
                                 <p className="text-[8px] text-text-muted uppercase font-black mb-1">{key}</p>
                                 <p className="text-ls-primary dark:text-white text-[10px] font-bold truncate">{String(val)}</p>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="bg-ls-primary/5 dark:bg-white/5 p-4 rounded-xl border border-border-theme">
                           <p className="text-ls-primary dark:text-white text-[10px] font-medium leading-relaxed">
                              {typeof analysis.technology_stack === 'string' ? analysis.technology_stack : JSON.stringify(analysis.technology_stack)}
                           </p>
                        </div>
                     )}
                  </div>
                  {(!analysis.technology_stack || Object.keys(analysis.technology_stack).length === 0) && (
                    <p className="text-text-muted text-xs italic">Awaiting technical audit completion.</p>
                  )}
               </div>

               {/* Key Person Risk Card */}
                <div className="bg-ls-primary/5 dark:bg-black/30 border border-border-theme p-6 rounded-3xl theme-transition">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                       <Users size={18} className="text-[#F59F01]" />
                       <h4 className="text-[10px] font-black text-ls-primary dark:text-white uppercase tracking-widest tracking-tighter">Founder Dependency</h4>
                     </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${analysis.key_person_risk_score > 7 ? 'bg-red-400/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                      {analysis.key_person_risk_score > 7 ? 'HIGH RISK' : 'STABLE'}
                    </span>
                  </div>
                   <div className="flex items-end justify-between">
                     <div className="text-4xl font-black text-ls-primary dark:text-white tabular-nums">{analysis.key_person_risk_score}<span className="text-lg text-text-muted">/10</span></div>
                     <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Risk Score</p>
                   </div>
                   <div className="w-full h-1.5 bg-ls-primary/5 dark:bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${analysis.key_person_risk_score > 7 ? 'bg-red-500' : 'bg-[#F59F01]'}`}
                      style={{ width: `${analysis.key_person_risk_score * 10}%` }}
                    />
                  </div>
                </div>

               {/* Supply Chain Card */}
               <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 p-6 rounded-3xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Target size={18} className="text-[#F59F01]" />
                    <h4 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest tracking-tighter">Supply Chain Risks</h4>
                  </div>
                  <div className="space-y-4">
                    {(analysis.supply_chain_risks || []).map((risk, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-[10px] text-ls-primary/80 dark:text-white/80 leading-relaxed">{risk}</span>
                      </div>
                    ))}
                    {(!analysis.supply_chain_risks || analysis.supply_chain_risks.length === 0) && (
                      <p className="text-text-muted text-xs italic">No vulnerabilities identified.</p>
                    )}
                  </div>
               </div>

               {/* Red Flags Card */}
               <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl">
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertTriangle size={16} /> Operational Blockers
                  </h4>
                  <div className="space-y-3">
                    {(analysis.operational_red_flags || [])
                      .filter(flag => !(!analysis.thesis_markdown && flag.length > 200))
                      .map((flag, i) => (
                      <div key={i} className="p-3 bg-ls-primary/5 dark:bg-black/40 rounded-xl border border-red-500/10 text-[10px] text-ls-primary/70 dark:text-white/70 leading-relaxed font-serif italic">
                        {flag}
                      </div>
                    ))}
                    {(!analysis.operational_red_flags || analysis.operational_red_flags.filter(f => f.length <= 200).length === 0) && (
                      <p className="text-text-muted text-xs italic text-center">Clean audit. No critical blockers.</p>
                    )}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center space-y-6 theme-transition">
             <div className="w-24 h-24 rounded-[2rem] bg-ls-primary/5 dark:bg-white/5 flex items-center justify-center text-ls-primary/10 dark:text-white/10 mx-auto border border-border-theme theme-transition">
                {isProcessing ? (
                  <BrainCircuit size={48} className="text-[#F59F01] animate-spin" />
                ) : (
                  <History size={48} />
                )}
             </div>
             <div className="max-w-xs mx-auto">
                <p className="text-ls-primary dark:text-white text-lg font-bold">
                  {isProcessing ? 'AI Analysis Underway' : 'Awaiting Operational Audit'}
                </p>
                <p className="text-text-muted text-sm mt-2 tracking-wide font-medium leading-relaxed">
                  {isProcessing 
                    ? 'Our multimodal engine is fusing your manual context with data room documents to build the operational thesis.'
                    : 'Generate a technical audit and founder dependency review to see operational red flags.'}
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
