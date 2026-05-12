'use client'

/**
 * SPADraftTab.jsx
 * AI-generated Share Purchase Agreement draft with GP override capability.
 * Each section override is logged to the immutable audit ledger.
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Scale, Edit3, Save, RotateCcw,
  Loader2, AlertTriangle, Sparkles, BrainCircuit, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const SECTION_LABELS = {
  recitals: 'Recitals',
  definitions: 'Definitions',
  purchase_price: 'Purchase Price & Payment',
  representations: 'Representations & Warranties',
  conditions_precedent: 'Conditions Precedent',
  covenants: 'Covenants',
  indemnification: 'Indemnification',
  governing_law: 'Governing Law & Dispute Resolution',
  closing_conditions: 'Closing Conditions',
  termination: 'Termination Provisions',
  schedules: 'Schedules & Annexures',
};

export default function SPADraftTab({ deal }) {
  const queryClient = useQueryClient();
  const projectId = deal.id;
  const [expandedSection, setExpandedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const { data: spaDrafts = [], isLoading } = useQuery({
    queryKey: ['deals', projectId, 'spa-drafts'],
    queryFn: async () => {
      const res = await api.get(`/deals/projects/${projectId}/spa-drafts/`);
      return res.data;
    }
  });

  const latest = spaDrafts[0];

  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [wasProcessing, setWasProcessing] = useState(false);

  // Sync local generating state with backend progress
  const isProcessing = isGeneratingLocal || deal?.analysis_progress?.['SPA Draft'] === 'processing';

  // Sync wasProcessing state
  useEffect(() => {
    const backendProcessing = deal?.analysis_progress?.['SPA Draft'] === 'processing';

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
      queryClient.invalidateQueries(['deals', projectId, 'spa-drafts']);
      toast.success('SPA draft generation cycle complete.');
    }
  }, [isProcessing, wasProcessing, deal?.analysis_progress, queryClient, projectId, isGeneratingLocal]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingLocal(true);
      const res = await api.post(`/deals/projects/${projectId}/spa-drafts/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('AI SPA draft generation started.');
      queryClient.invalidateQueries(['deals', projectId, 'spa-drafts']);
      queryClient.invalidateQueries(['deals', 'project', projectId]);
    },
    onError: (err) => {
      setIsGeneratingLocal(false);
      toast.error(err.response?.data?.detail || 'Failed to generate SPA draft.');
    }
  });

  const overrideMutation = useMutation({
    mutationFn: async ({ spaId, key, value, remarks }) => {
      const res = await api.patch(`/deals/projects/${projectId}/spa-drafts/${spaId}/`, {
        sections: { [key]: value },
        remarks,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('SPA section override saved & logged.');
      setEditingSection(null);
      setEditValue('');
      setEditRemarks('');
      queryClient.invalidateQueries(['deals', projectId, 'spa-drafts']);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Override failed.')
  });

  const statusMutation = useMutation({
    mutationFn: async ({ spaId, status }) => {
      const res = await api.patch(`/deals/projects/${projectId}/spa-drafts/${spaId}/`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('SPA status updated.');
      queryClient.invalidateQueries(['deals', projectId, 'spa-drafts']);
    }
  });

  const startEdit = (key, currentValue) => {
    setEditingSection(key);
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : String(currentValue ?? ''));
    setEditRemarks('');
    setExpandedSection(key);
  };

  const saveEdit = (spaId, key) => {
    let parsedValue = editValue;
    try { parsedValue = JSON.parse(editValue); } catch { parsedValue = editValue; }
    overrideMutation.mutate({ spaId, key, value: parsedValue, remarks: editRemarks });
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
            <Scale className="text-[#F59F01]" size={22} />
            Share Purchase Agreement
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {latest ? `v${latest.version} — ${latest.status}` : 'No SPA draft generated yet'}
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || isProcessing}
          className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F59F01] to-[#E88B00] text-ls-primary rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#F59F01]/10 disabled:opacity-50 ${isProcessing ? 'animate-pulse' : 'hover:scale-105'}`}
        >
          {generateMutation.isPending || isProcessing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {isProcessing
            ? 'AI Drafting SPA...'
            : (latest ? 'Regenerate AI SPA Draft' : 'Generate AI SPA Draft')}
        </button>
      </div>

      {!latest ? (
        <div className="border border-dashed border-border-theme rounded-xl p-12 text-center theme-transition">
          <Scale className="mx-auto text-ls-primary/20 dark:text-white/20 mb-4" size={48} />
          <p className="text-ls-primary/40 dark:text-white/40 text-lg font-medium">No SPA draft yet</p>
          <p className="text-text-muted text-sm mt-2">
            Generate an AI-drafted Share Purchase Agreement based on your term sheet and regulatory context.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex items-center gap-3">
            {['DRAFT', 'REVIEW', 'FINAL'].map(s => (
              <button
                key={s}
                onClick={() => statusMutation.mutate({ spaId: latest.id, status: s })}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${latest.status === s
                    ? 'bg-[#F59F01] text-ls-primary'
                    : 'bg-ls-primary/5 dark:bg-white/5 text-ls-primary/40 dark:text-white/40 hover:bg-ls-primary/10 dark:hover:bg-white/10 border border-border-theme'
                  }`}
              >
                {s === 'DRAFT' ? 'Draft' : s === 'REVIEW' ? 'Under Legal Review' : 'Final'}
              </button>
            ))}
          </div>

          {/* Sections Accordion */}
          <div className="space-y-3">
            {Object.entries(latest.sections || {}).map(([key, value]) => {
              const isExpanded = expandedSection === key;
              const isEditing = editingSection === key;
              const wasOverridden = latest.ai_generated_sections?.[key] !== undefined &&
                JSON.stringify(latest.ai_generated_sections[key]) !== JSON.stringify(value);

              return (
                <div
                  key={key}
                  className={`rounded-xl border transition-all overflow-hidden theme-transition ${isEditing
                      ? 'border-[#F59F01]/50 bg-[#F59F01]/5'
                      : wasOverridden
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-border-theme bg-card dark:bg-white/[0.02]'
                    }`}
                >
                  {/* Section Header */}
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : key)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-ls-primary/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-ls-primary dark:text-white">
                        {SECTION_LABELS[key] || key.replace(/_/g, ' ')}
                      </span>
                      {wasOverridden && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle size={10} /> Modified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(key, value); }}
                          className="text-ls-primary/20 dark:text-white/20 hover:text-[#F59F01] transition-colors p-1"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={16} className="text-ls-primary/30 dark:text-white/30" /> : <ChevronDown size={16} className="text-ls-primary/30 dark:text-white/30" />}
                    </div>
                  </button>

                  {/* Section Body */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border-theme pt-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            rows={8}
                            className="w-full bg-ls-primary/5 dark:bg-black/50 border border-border-theme rounded-lg p-3 text-sm text-ls-primary dark:text-white outline-none focus:border-[#F59F01]/40 font-mono"
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
                              onClick={() => setEditingSection(null)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-ls-primary/5 dark:bg-white/5 text-ls-primary/60 dark:text-white/60 rounded-lg text-xs"
                            >
                              <RotateCcw size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-ls-primary/70 dark:text-white/70 whitespace-pre-wrap leading-relaxed">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Comparison */}
          {latest.ai_generated_sections && Object.keys(latest.ai_generated_sections).length > 0 && (
            <details className="border border-border-theme rounded-xl overflow-hidden theme-transition">
              <summary className="p-4 text-sm text-ls-primary/40 dark:text-white/40 cursor-pointer hover:bg-ls-primary/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
                <BrainCircuit size={14} /> View Original AI-Generated Sections
              </summary>
              <div className="p-4 bg-ls-primary/5 dark:bg-white/[0.01] border-t border-border-theme">
                <pre className="text-xs text-ls-primary/50 dark:text-white/50 whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
                  {JSON.stringify(latest.ai_generated_sections, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
