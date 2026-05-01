'use client'

/**
 * (superadmin)/prompts/page.jsx
 * AI Prompt Library management.
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
  Code
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function SuperAdminPromptsPage() {
  const queryClient = useQueryClient();
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
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Prompt Library</h1>
          <p className="text-white/40 text-sm">Version control and testing for platform AI prompts.</p>
        </div>
        <button 
          onClick={() => { setSelectedPrompt(null); setIsEditModalOpen(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/10"
        >
          <Plus size={18} /> New Prompt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {prompts.map(prompt => (
          <div key={prompt.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:border-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                {prompt.task_type}
              </div>
              <span className="text-white/20 text-[10px] font-mono">v{prompt.version}</span>
            </div>
            
            <h3 className="text-white font-bold mb-2 group-hover:text-purple-400 transition-colors">{prompt.name}</h3>
            <p className="text-white/40 text-xs line-clamp-2 mb-6 h-8 italic">
              "{prompt.system_prompt}"
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${prompt.is_active ? 'bg-emerald-500' : 'bg-white/10'}`} />
                <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">
                  {prompt.is_active ? 'Active' : 'Archived'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { setSelectedPrompt(prompt); setTestResult(null); setIsTestModalOpen(true); }}
                  className="p-2 text-white/40 hover:text-emerald-400 transition-colors"
                  title="Test Prompt"
                >
                  <Play size={16} />
                </button>
                <button 
                  onClick={() => { setSelectedPrompt(prompt); setIsEditModalOpen(true); }}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  title="Edit"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0124] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="text-purple-500" size={20} />
                {selectedPrompt ? 'Edit Prompt Version' : 'Create New Prompt'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Friendly Name</label>
                  <input name="name" defaultValue={selectedPrompt?.name} required className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Task Type (Internal Key)</label>
                  <input name="task_type" defaultValue={selectedPrompt?.task_type} required className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Output Schema (JSON)</label>
                  <textarea 
                    name="output_schema" 
                    defaultValue={JSON.stringify(selectedPrompt?.output_schema || {}, null, 2)} 
                    rows={8}
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white font-mono text-xs focus:border-purple-500 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">System Prompt</label>
                  <textarea 
                    name="system_prompt" 
                    defaultValue={selectedPrompt?.system_prompt} 
                    rows={6}
                    required
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">User Prompt Template</label>
                  <textarea 
                    name="user_prompt_template" 
                    defaultValue={selectedPrompt?.user_prompt_template} 
                    rows={10}
                    required
                    placeholder="Use {variable} for injection"
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none" 
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input id="is_active" name="is_active" type="checkbox" defaultChecked={selectedPrompt?.is_active ?? true} className="w-4 h-4 rounded border-white/10 bg-[#060010] text-purple-600" />
                  <label htmlFor="is_active" className="text-sm text-white/60">Active Version</label>
                </div>
              </div>

              <div className="md:col-span-2 pt-6 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={updateMutation.isLoading || createMutation.isLoading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {updateMutation.isLoading || createMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {selectedPrompt ? 'Save Version' : 'Create Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0124] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Terminal className="text-emerald-500" size={20} />
                  Test Execution: {selectedPrompt?.name}
                </h3>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-mono">{selectedPrompt?.task_type}</p>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Input Panel */}
              <div className="w-1/3 border-r border-white/10 p-6 flex flex-col gap-4">
                <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                  <Database size={12} /> Injection Context (JSON)
                </h4>
                <textarea 
                  value={testContext}
                  onChange={(e) => setTestContext(e.target.value)}
                  className="flex-1 bg-[#060010] border border-white/10 rounded-xl p-4 text-white font-mono text-xs focus:border-emerald-500/40 outline-none resize-none"
                />
                <button 
                  onClick={handleRunTest}
                  disabled={testMutation.isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {testMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                  Execute Test Call
                </button>
              </div>

              {/* Output Panel */}
              <div className="flex-1 bg-[#060010]/50 p-6 flex flex-col gap-4 overflow-y-auto">
                <h4 className="text-[10px] text-white/40 uppercase font-bold tracking-widest flex items-center gap-2">
                  <Code size={12} /> AI Execution Response
                </h4>
                
                {!testResult ? (
                  <div className="flex-1 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 italic text-sm">
                    Configure context and click execute to see AI results...
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {testResult.status === 'ERROR' ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-400">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <div>
                          <p className="font-bold text-sm">Execution Failed</p>
                          <p className="text-xs opacity-80 mt-1">{testResult.message}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <p className="text-[10px] text-white/30 uppercase font-bold">Latency</p>
                            <p className="text-lg font-mono text-emerald-400">{testResult.metrics?.latency_ms}ms</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <p className="text-[10px] text-white/30 uppercase font-bold">Total Tokens</p>
                            <p className="text-lg font-mono text-white">{testResult.metrics?.tokens}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <p className="text-[10px] text-white/30 uppercase font-bold">Est. Cost</p>
                            <p className="text-lg font-mono text-amber-400">${testResult.metrics?.cost_usd.toFixed(6)}</p>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                          <p className="text-[10px] text-white/40 uppercase font-bold mb-4 tracking-widest">Raw AI Text Output</p>
                          <pre className="text-sm text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                            {testResult.output}
                          </pre>
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
