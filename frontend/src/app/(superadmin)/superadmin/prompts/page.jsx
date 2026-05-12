'use client'

/**
 * (superadmin)/prompts/page.jsx
 * AI Prompt Library management for Superadmins.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Play, 
  X, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Terminal,
  Code,
  TerminalSquare,
  Cpu,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function SuperAdminPromptsPage() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testContext, setTestContext] = useState('{\n  "project_name": "Solar Nepal",\n  "sector": "Energy"\n}');
  const [testResult, setTestResult] = useState(null);

  // 1. Fetch Prompts
  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'prompts'],
    queryFn: async () => {
      const res = await api.get('/superadmin/prompts/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  // 2. Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/superadmin/prompts/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'prompts']);
      toast.success('Prompt updated successfully');
      setIsEditModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update prompt')
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/superadmin/prompts/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'prompts']);
      toast.success('New prompt version created');
      setIsEditModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create prompt')
  });

  const testMutation = useMutation({
    mutationFn: ({ id, context }) => api.post(`/superadmin/prompts/${id}/test/`, { context }),
    onSuccess: (res) => {
      setTestResult(res.data);
      toast.success('Test execution completed');
    },
    onError: (err) => {
      setTestResult({ status: 'ERROR', message: err.response?.data?.message || 'Test failed' });
      toast.error('AI test failed');
    }
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse JSON output schema
    try {
      data.output_schema = JSON.parse(data.output_schema);
    } catch (e) {
      toast.error('Invalid JSON in output schema');
      return;
    }

    if (selectedPrompt?.id) {
      updateMutation.mutate({ id: selectedPrompt.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleRunTest = () => {
    try {
      const context = JSON.parse(testContext);
      testMutation.mutate({ id: selectedPrompt.id, context });
    } catch (e) {
      toast.error('Invalid JSON in test context');
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Neural Library...</p>
    </div>
  );

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <Cpu size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Neural Registry</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Institutional AI Prompt Engineering & Version Control</p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedPrompt(null); setIsEditModalOpen(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl active:scale-95"
        >
          <Plus size={18} /> Initialize New Archetype
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {prompts.map(prompt => (
          <div key={prompt.id} className="bg-card border border-border-theme rounded-[2.5rem] p-10 flex flex-col hover:bg-foreground/[0.02] transition-all group shadow-xl relative overflow-hidden theme-transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="bg-purple-500/10 text-purple-500 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-purple-500/20 shadow-inner">
                {prompt.task_type}
              </div>
              <span className="text-text-muted/20 font-mono text-[10px] font-black">V{prompt.version}</span>
            </div>
            
            <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-3 group-hover:text-purple-500 transition-colors relative z-10">{prompt.name}</h3>
            <p className="text-text-muted/60 text-xs line-clamp-3 mb-8 italic leading-relaxed relative z-10">
              "{prompt.system_prompt}"
            </p>

            <div className="flex items-center justify-between mt-auto pt-6 border-t border-border-theme/50 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${prompt.is_active ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-foreground/10'}`} />
                <span className="text-[9px] text-text-muted font-black uppercase tracking-widest">
                  {prompt.is_active ? 'Production Ready' : 'Archived Version'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setSelectedPrompt(prompt); setTestResult(null); setIsTestModalOpen(true); }}
                  className="p-3 bg-emerald-500/5 text-emerald-500 rounded-xl hover:bg-emerald-500/10 transition-all border border-emerald-500/10 active:scale-95 shadow-sm"
                  title="Execute Test Call"
                >
                  <Play size={16} fill="currentColor" />
                </button>
                <button 
                  onClick={() => { setSelectedPrompt(prompt); setIsEditModalOpen(true); }}
                  className="p-3 bg-purple-500/5 text-purple-500 rounded-xl hover:bg-purple-500/10 transition-all border border-purple-500/10 active:scale-95 shadow-sm"
                  title="Configure Archetype"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme w-full max-w-6xl rounded-[3rem] p-12 relative shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] theme-transition overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
              <X size={24} />
            </button>
            
            <div className="mb-10">
              <h2 className="text-3xl font-black text-foreground tracking-tight uppercase flex items-center gap-4">
                <BookOpen className="text-purple-500" size={32} />
                {selectedPrompt ? 'Configure Archetype' : 'New Neural Archetype'}
              </h2>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Define cognitive logic & output protocols for system AI</p>
            </div>
            
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Institutional Label</label>
                  <input name="name" defaultValue={selectedPrompt?.name} required className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium" placeholder="e.g. Due Diligence Analyzer" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Logic Archetype (Internal Key)</label>
                  <input name="task_type" defaultValue={selectedPrompt?.task_type} required className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all font-medium" placeholder="DEAL_ANALYSIS_V2" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Output Schema (JSON Schema)</label>
                  <textarea 
                    name="output_schema" 
                    defaultValue={JSON.stringify(selectedPrompt?.output_schema || {}, null, 2)} 
                    rows={12}
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-[2rem] py-5 px-6 text-foreground font-mono text-[11px] focus:border-purple-500 outline-none shadow-inner transition-all resize-none" 
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">System Instructions (Context)</label>
                  <textarea 
                    name="system_prompt" 
                    defaultValue={selectedPrompt?.system_prompt} 
                    rows={6}
                    required
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-[2rem] py-5 px-6 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all resize-none" 
                    placeholder="Global AI constraints and persona definition..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] ml-1">Input Template (Dynamic Variables)</label>
                  <textarea 
                    name="user_prompt_template" 
                    defaultValue={selectedPrompt?.user_prompt_template} 
                    rows={10}
                    required
                    placeholder="Use {variable_name} for runtime data injection"
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-[2rem] py-5 px-6 text-foreground text-sm focus:border-purple-500 outline-none shadow-inner transition-all resize-none" 
                  />
                </div>
                <div className="flex items-center gap-4 p-6 bg-foreground/[0.03] rounded-2xl border border-border-theme shadow-inner">
                  <input id="is_active" name="is_active" type="checkbox" defaultChecked={selectedPrompt?.is_active ?? true} className="w-5 h-5 rounded border-border-theme text-purple-600 focus:ring-purple-500/40 cursor-pointer" />
                  <label htmlFor="is_active" className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 cursor-pointer select-none">Deploy as Active Production Version</label>
                </div>
              </div>

              <div className="lg:col-span-2 pt-10 flex gap-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl border border-border-theme text-text-muted text-[10px] font-black uppercase tracking-widest hover:bg-foreground/5 transition-all shadow-sm active:scale-95">Terminate Configuration</button>
                <button type="submit" disabled={updateMutation.isLoading || createMutation.isLoading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                  {updateMutation.isLoading || createMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {selectedPrompt ? 'Commit Archetype Version' : 'Authorize Archetype'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-12 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme w-full max-w-7xl h-[90vh] rounded-[3rem] overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] flex flex-col theme-transition">
            <div className="p-10 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01]">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                  <TerminalSquare size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Protocol Test Execution</h3>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mt-1">Logic Node: {selectedPrompt?.task_type} (V{selectedPrompt?.version})</p>
                </div>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Input Panel */}
              <div className="w-[30%] border-r border-border-theme p-10 flex flex-col gap-8 bg-foreground/[0.01]">
                <div className="space-y-4">
                  <h4 className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
                    <Database size={14} /> Injection Context
                  </h4>
                  <textarea 
                    value={testContext}
                    onChange={(e) => setTestContext(e.target.value)}
                    className="w-full h-[30rem] bg-foreground/[0.03] border border-border-theme rounded-[2rem] p-8 text-foreground font-mono text-[11px] focus:border-emerald-500/40 outline-none resize-none shadow-inner theme-transition"
                  />
                </div>
                <button 
                  onClick={handleRunTest}
                  disabled={testMutation.isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 mt-auto"
                >
                  {testMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                  Execute Neural Call
                </button>
              </div>

              {/* Output Panel */}
              <div className="flex-1 bg-background p-10 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] flex items-center gap-3 ml-1">
                  <Code size={14} /> Institutional AI Trace
                </h4>
                
                {!testResult ? (
                  <div className="flex-1 border-2 border-dashed border-border-theme rounded-[3rem] flex flex-col items-center justify-center text-text-muted/10 gap-6">
                    <Cpu size={64} className="opacity-5" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px] italic">Awaiting Protocol Execution...</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6">
                    {testResult.status === 'ERROR' ? (
                      <div className="bg-rose-500/5 border border-rose-500/20 rounded-[2rem] p-8 flex gap-6 text-rose-500 shadow-xl">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">Execution Protocol Failure</p>
                          <p className="text-xs font-medium opacity-80 mt-2 leading-relaxed">{testResult.message}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-8">
                          <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-xl shadow-black/5">
                            <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest mb-1">Inference Latency</p>
                            <p className="text-xl font-black font-mono text-emerald-500">{testResult.metrics?.latency_ms}MS</p>
                          </div>
                          <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-xl shadow-black/5">
                            <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest mb-1">Token Volume</p>
                            <p className="text-xl font-black font-mono text-foreground">{testResult.metrics?.tokens}</p>
                          </div>
                          <div className="bg-card border border-border-theme rounded-3xl p-6 shadow-xl shadow-black/5">
                            <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest mb-1">Notional Cost</p>
                            <p className="text-xl font-black font-mono text-ls-compliment">${testResult.metrics?.cost_usd.toFixed(6)}</p>
                          </div>
                        </div>

                        <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-foreground/5 rounded-bl-[2rem] flex items-center justify-center text-text-muted/10">
                            <Terminal size={48} />
                          </div>
                          <p className="text-[10px] text-text-muted/40 font-black uppercase mb-6 tracking-[0.3em] relative z-10">Neural Intelligence Payload</p>
                          <div className="relative z-10 bg-foreground/[0.02] rounded-2xl p-8 border border-border-theme/50 shadow-inner">
                            <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                              {testResult.output}
                            </pre>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
