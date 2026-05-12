'use client'

/**
 * TermSheetTab.jsx
 * AI-generated term sheet with GP manual override capability.
 * Each field override is logged to the immutable audit ledger.
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  BrainCircuit, FileText, Edit3, Save, RotateCcw, 
  Loader2, CheckCircle2, AlertTriangle, Sparkles 
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const TERM_LABELS = {
  investment_amount_npr: 'Investment Amount (NPR)',
  pre_money_valuation_npr: 'Pre-Money Valuation (NPR)',
  ownership_pct: 'Ownership %',
  board_seats: 'Board Seats',
  observer_rights: 'Observer Rights',
  exclusivity_days: 'Exclusivity Period (Days)',
  vesting_schedule: 'Vesting Schedule',
  exit_strategy_summary: 'Exit Strategy',
  anti_dilution: 'Anti-Dilution',
  drag_along: 'Drag-Along Rights',
  tag_along: 'Tag-Along Rights',
  liquidation_preference: 'Liquidation Preference',
  information_rights: 'Information Rights',
  non_compete: 'Non-Compete Clause',
};

export default function TermSheetTab({ deal }) {
  const queryClient = useQueryClient();
  const projectId = deal.id;
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

  // Fetch term sheets
  const { data: termSheets = [], isLoading } = useQuery({
    queryKey: ['deals', projectId, 'term-sheets'],
    queryFn: async () => {
      const res = await api.get(`/deals/projects/${projectId}/term-sheets/`);
      return res.data;
    }
  });

  const latest = termSheets[0];

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingLocal(true);
      const res = await api.post(`/deals/projects/${projectId}/term-sheets/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('AI term sheet generation started in background.');
      queryClient.invalidateQueries(['deals', projectId, 'term-sheets']);
      queryClient.invalidateQueries(['deals', 'project', projectId]);
    },
    onError: (err) => {
      setIsGeneratingLocal(false);
      toast.error(err.response?.data?.detail || 'Failed to start generation.');
    }
  });

  // Sync local generating state with backend progress
  const isProcessing = isGeneratingLocal || deal?.analysis_progress?.['Term Sheet'] === 'processing';
  const [wasProcessing, setWasProcessing] = useState(false);

  // Sync wasProcessing state
  useEffect(() => {
    const backendProcessing = deal?.analysis_progress?.['Term Sheet'] === 'processing';
    
    // If the backend has picked up the task, or if the task is clearly not in progress anymore
    if (backendProcessing && isGeneratingLocal) {
      setIsGeneratingLocal(false);
    }

    // Safety: If we are in local generating state but backend progress is empty, 
    // it means the task failed fast or finished before we even saw it.
    if (isGeneratingLocal && deal?.analysis_progress && !backendProcessing) {
      setIsGeneratingLocal(false);
    }

    if (isProcessing) {
      setWasProcessing(true);
    } else if (wasProcessing) {
      // Transitioned from processing to not processing
      setWasProcessing(false);
      setIsGeneratingLocal(false); // Safety
      queryClient.invalidateQueries(['deals', projectId, 'term-sheets']);
      toast.success('Term sheet generation cycle complete.');
    }
  }, [isProcessing, wasProcessing, deal?.analysis_progress, queryClient, projectId, isGeneratingLocal]);

  // Override mutation
  const overrideMutation = useMutation({
    mutationFn: async ({ tsId, key, value, remarks }) => {
      const res = await api.patch(`/deals/projects/${projectId}/term-sheets/${tsId}/`, {
        terms: { [key]: value },
        remarks,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Term override saved & logged.');
      setEditingField(null);
      setEditValue('');
      setEditRemarks('');
      queryClient.invalidateQueries(['deals', projectId, 'term-sheets']);
      queryClient.invalidateQueries(['deals', 'project', projectId]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Override failed.')
  });

  // Status update
  const statusMutation = useMutation({
    mutationFn: async ({ tsId, status }) => {
      const res = await api.patch(`/deals/projects/${projectId}/term-sheets/${tsId}/`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Term sheet status updated.');
      queryClient.invalidateQueries(['deals', projectId, 'term-sheets']);
    }
  });

  const startEdit = (key, currentValue) => {
    setEditingField(key);
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue ?? ''));
    setEditRemarks('');
  };

  const saveEdit = (tsId, key) => {
    let parsedValue = editValue;
    try { parsedValue = JSON.parse(editValue); } catch {}
    overrideMutation.mutate({ tsId, key, value: parsedValue, remarks: editRemarks });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#F59F01] animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 theme-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ls-primary dark:text-white flex items-center gap-2">
            <FileText className="text-[#F59F01]" size={22} />
            Term Sheet
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {latest ? `v${latest.version} — ${latest.status}` : 'No term sheet generated yet'}
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || isProcessing || (latest && latest.status !== 'DRAFT')}
          className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F59F01] to-[#E88B00] text-ls-primary rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#F59F01]/10 disabled:opacity-50 ${isProcessing ? 'animate-pulse' : (latest && latest.status !== 'DRAFT') ? '' : 'hover:scale-105'}`}
        >
          {generateMutation.isPending || isProcessing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {isProcessing 
            ? 'AI Drafting Terms...' 
            : (latest ? 'Regenerate AI Term Sheet' : 'Generate AI Term Sheet')}
        </button>
      </div>

      {!latest ? (
        <div className="border border-dashed border-border-theme rounded-xl p-12 text-center theme-transition">
          <BrainCircuit className="mx-auto text-ls-primary/20 dark:text-white/20 mb-4" size={48} />
          <p className="text-ls-primary/40 dark:text-white/40 text-lg font-medium">No term sheet yet</p>
          <p className="text-text-muted text-sm mt-2">
            Click "Generate AI Term Sheet" to let Gemini draft commercial terms based on your valuation models.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex items-center gap-3">
            {['DRAFT', 'NEGOTIATING', 'AGREED'].map(s => (
              <button
                key={s}
                onClick={() => statusMutation.mutate({ tsId: latest.id, status: s })}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  latest.status === s 
                    ? 'bg-[#F59F01] text-ls-primary' 
                    : 'bg-ls-primary/5 dark:bg-white/5 text-ls-primary/40 dark:text-white/40 hover:bg-ls-primary/10 dark:hover:bg-white/10 border border-border-theme'
                }`}
              >
                {s === 'DRAFT' ? 'Draft' : s === 'NEGOTIATING' ? 'Under Negotiation' : 'Terms Agreed'}
              </button>
            ))}
          </div>

          {/* Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(latest.terms || {}).map(([key, value]) => {
              const isEditing = editingField === key;
              const wasOverridden = latest.ai_generated_terms?.[key] !== undefined && 
                JSON.stringify(latest.ai_generated_terms[key]) !== JSON.stringify(value);

              return (
                <div
                  key={key}
                  className={`rounded-xl border p-4 transition-all theme-transition ${
                    isEditing 
                      ? 'border-[#F59F01]/50 bg-[#F59F01]/5' 
                      : wasOverridden 
                        ? 'border-amber-500/30 bg-amber-500/5' 
                        : 'border-border-theme bg-card dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted uppercase tracking-wider font-medium">
                      {TERM_LABELS[key] || key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {wasOverridden && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle size={10} /> Overridden
                        </span>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(key, value)}
                          className="text-ls-primary/20 dark:text-white/20 hover:text-[#F59F01] transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        rows={2}
                        className="w-full bg-ls-primary/5 dark:bg-black/50 border border-border-theme rounded-lg p-2 text-sm text-ls-primary dark:text-white outline-none focus:border-[#F59F01]/40"
                      />
                      <input
                        value={editRemarks}
                        onChange={e => setEditRemarks(e.target.value)}
                        placeholder="Override remarks (logged to audit)..."
                        className="w-full bg-ls-primary/5 dark:bg-black/50 border border-border-theme rounded-lg p-2 text-xs text-ls-primary/60 dark:text-white/60 outline-none focus:border-[#F59F01]/40"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(latest.id, key)}
                          disabled={overrideMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#F59F01] text-ls-primary rounded-lg text-xs font-bold"
                        >
                          {overrideMutation.isPending ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                          Save Override
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-ls-primary/5 dark:bg-white/5 text-ls-primary/60 dark:text-white/60 rounded-lg text-xs hover:bg-ls-primary/10 dark:hover:bg-white/10"
                        >
                          <RotateCcw size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                    ) : (
                      <p className="text-sm text-ls-primary dark:text-white font-medium break-words">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    )}
                </div>
              );
            })}
          </div>

          {/* AI Comparison */}
          {latest.ai_generated_terms && Object.keys(latest.ai_generated_terms).length > 0 && (
            <details className="border border-border-theme rounded-xl overflow-hidden theme-transition">
              <summary className="p-4 text-sm text-ls-primary/40 dark:text-white/40 cursor-pointer hover:bg-ls-primary/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
                <BrainCircuit size={14} /> View Original AI-Generated Terms
              </summary>
              <div className="p-4 bg-ls-primary/5 dark:bg-white/[0.01] border-t border-border-theme">
                <pre className="text-xs text-ls-primary/50 dark:text-white/50 whitespace-pre-wrap font-mono">
                  {JSON.stringify(latest.ai_generated_terms, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
