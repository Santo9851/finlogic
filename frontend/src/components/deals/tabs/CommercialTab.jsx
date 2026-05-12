import React, { useState, useEffect } from 'react';
import { BrainCircuit, Loader2, BarChart4, TrendingUp, ShieldAlert, Target, Users, Edit3, Save, X, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { projectService } from '@/services/project';
import { toast } from 'sonner';

export default function CommercialTab({ deal, onRun, isLoading }) {
  const analysis = deal.commercial_analyses?.[0];
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (analysis) {
      setEditedText(analysis.market_positioning_notes);
    }
  }, [analysis]);

  // Helper to determine risk level
  const getRiskLevel = (pct) => {
    if (pct > 40) return { label: 'HIGH RISK', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-red-400/10', border: 'border-red-500/20 dark:border-red-400/20' };
    if (pct > 20) return { label: 'MODERATE', color: 'text-[#F59F01]', bg: 'bg-[#F59F01]/10', border: 'border-[#F59F01]/20' };
    return { label: 'LOW RISK', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/10 dark:bg-emerald-400/10', border: 'border-emerald-600/20 dark:border-emerald-400/20' };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await projectService.updateCommercialAnalysis(deal.id, {
        market_positioning_notes: editedText
      });
      toast.success('Commercial thesis refined and saved.');
      setIsEditing(false);
      // We rely on parent to refresh data or just keep local state
      analysis.market_positioning_notes = editedText; 
    } catch (error) {
      toast.error('Failed to save refinements.');
    } finally {
      setIsSaving(false);
    }
  };

  const risk = analysis ? getRiskLevel(analysis.customer_concentration_pct) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 theme-transition">
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl theme-transition">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 border-b border-border-theme pb-8">
          <div>
            <h3 className="text-3xl font-black text-ls-primary dark:text-white tracking-tight">Commercial Thesis</h3>
            <p className="text-text-muted text-sm mt-1 uppercase tracking-widest font-bold">Market Intelligence & Strategy Audit</p>
          </div>
          
          <div className="flex items-center gap-3">
            {analysis && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-ls-primary/5 dark:bg-white/5 text-ls-primary dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-ls-primary/10 dark:hover:bg-white/10 transition-all border border-border-theme"
              >
                <Edit3 size={16} />
                Refine Thesis
              </button>
            )}
            
            {!isEditing ? (
              <button 
                onClick={() => onRun()}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#F59F01] text-ls-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#F59F01]/20 disabled:opacity-50 active:scale-95"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                {analysis ? 'Refresh Strategy' : 'Generate Commercial Thesis'}
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
                  Save Refinements
                </button>
              </div>
            )}
          </div>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Report Area */}
            <div className="lg:col-span-8 space-y-8">
               <div className={`bg-ls-primary/5 dark:bg-black/30 rounded-[2rem] border transition-all duration-500 relative group overflow-hidden ${isEditing ? 'border-[#F59F01]/30 ring-1 ring-[#F59F01]/10' : 'border-border-theme'}`}>
                  <div className="absolute top-8 right-10 flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                    <Target size={14} className={isEditing ? 'text-[#F59F01]' : 'text-ls-primary dark:text-white'} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {isEditing ? 'Strategic Refinement Mode' : 'AI Analysis Grounded in Data'}
                    </span>
                  </div>
                  
                  <div className="p-10">
                    {isEditing ? (
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full h-[500px] bg-transparent text-ls-primary/90 dark:text-white/90 text-lg leading-relaxed focus:outline-none resize-none font-medium selection:bg-[#F59F01]/30"
                        placeholder="Refine the commercial thesis here..."
                      />
                    ) : (
                      <div className="article-body prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {analysis.market_positioning_notes}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
               </div>
            </div>
            
            {/* Analytical Sidepanel */}
            <div className="lg:col-span-4 space-y-6">
               {/* Customer Concentration Card */}
               <div className={`p-6 rounded-3xl border transition-all duration-500 ${risk.border} ${risk.bg} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <Users size={18} className={risk.color} />
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${risk.bg} ${risk.color} border ${risk.border}`}>
                      {risk.label}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-ls-primary/40 dark:text-white/40 uppercase tracking-widest mb-1">Top Customer Concentration</p>
                  <div className="text-4xl font-black text-ls-primary dark:text-white tabular-nums">{analysis.customer_concentration_pct}%</div>
                  <div className="w-full h-2 bg-ls-primary/5 dark:bg-white/5 rounded-full mt-4 overflow-hidden border border-border-theme">
                    <div 
                      className={`h-full transition-all duration-1000 ${analysis.customer_concentration_pct > 30 ? 'bg-red-500' : 'bg-[#F59F01]'}`}
                      style={{ width: `${analysis.customer_concentration_pct}%` }}
                    />
                  </div>
               </div>

               {/* Top Customers Card */}
                <div className="bg-ls-primary/5 dark:bg-white/[0.03] border border-border-theme p-6 rounded-3xl">
                   <div className="flex items-center gap-2 mb-4">
                     <Target size={16} className="text-[#F59F01]" />
                     <h4 className="text-[10px] font-black text-ls-primary dark:text-white uppercase tracking-widest">Key Strategic Accounts</h4>
                   </div>
                   <div className="space-y-3">
                     {analysis.top_customer_names ? analysis.top_customer_names.split(',').map((name, i) => (
                       <div key={i} className="flex items-center justify-between py-2 border-b border-border-theme last:border-0">
                         <span className="text-xs text-ls-primary/80 dark:text-white/80 font-medium truncate">{name.trim()}</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-[#F59F01]/40" />
                       </div>
                     )) : (
                       <p className="text-xs text-text-muted italic">No specific accounts identified.</p>
                     )}
                   </div>
                </div>

               {/* Market Outlook Card */}
                <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 p-6 rounded-3xl">
                   <div className="flex items-center gap-2 mb-4">
                     <TrendingUp size={16} className="text-[#F59F01]" />
                     <h4 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Growth Trajectory</h4>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-ls-primary/60 dark:text-white/60">Competitive Moat</span>
                       <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">STRENGTHENING</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-ls-primary/60 dark:text-white/60">Pricing Power</span>
                       <span className="text-xs text-ls-primary dark:text-white font-bold">MODERATE</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-ls-primary/60 dark:text-white/60">Market Entry Barriers</span>
                       <span className="text-xs text-[#F59F01] font-bold">HIGH</span>
                     </div>
                   </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center space-y-6 theme-transition">
             <div className="w-24 h-24 rounded-[2rem] bg-ls-primary/5 dark:bg-white/5 flex items-center justify-center text-ls-primary/10 dark:text-white/10 mx-auto border border-border-theme animate-pulse">
                <BarChart4 size={48} />
             </div>
             <div className="max-w-xs mx-auto">
                <p className="text-ls-primary dark:text-white text-lg font-bold">No Commercial Thesis Yet</p>
                <p className="text-text-muted text-sm mt-2">Run the analysis to generate market positioning and customer concentration insights.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
