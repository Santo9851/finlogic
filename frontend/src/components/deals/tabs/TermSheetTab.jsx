'use client'

/**
 * TermSheetTab.jsx
 * AI-generated term sheet with GP manual override capability.
 * Each field override is logged to the immutable audit ledger.
 */
import { useState } from 'react';
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
      const res = await api.post(`/deals/projects/${projectId}/term-sheets/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('AI term sheet generation started.');
      queryClient.invalidateQueries(['deals', projectId, 'term-sheets']);
      queryClient.invalidateQueries(['deals', 'project', projectId]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to generate term sheet.')
  });

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
        <Loader2 className="w-8 h-8 text-[#F59F01] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-[#F59F01]" size={22} />
            Term Sheet
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {latest ? `v${latest.version} — ${latest.status}` : 'No term sheet generated yet'}
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F59F01] to-[#E88B00] text-black rounded-lg text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/10 disabled:opacity-50"
        >
          {generateMutation.isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {latest ? 'Regenerate' : 'Generate'} AI Term Sheet
        </button>
      </div>

      {!latest ? (
        <div className="border border-dashed border-white/10 rounded-xl p-12 text-center">
          <BrainCircuit className="mx-auto text-white/20 mb-4" size={48} />
          <p className="text-white/40 text-lg font-medium">No term sheet yet</p>
          <p className="text-white/30 text-sm mt-2">
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
                    ? 'bg-[#F59F01] text-black' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/5'
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
                  className={`rounded-xl border p-4 transition-all ${
                    isEditing 
                      ? 'border-[#F59F01]/50 bg-[#F59F01]/5' 
                      : wasOverridden 
                        ? 'border-amber-500/30 bg-amber-500/5' 
                        : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40 uppercase tracking-wider font-medium">
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
                          className="text-white/20 hover:text-[#F59F01] transition-colors"
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
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-[#F59F01]/40"
                      />
                      <input
                        value={editRemarks}
                        onChange={e => setEditRemarks(e.target.value)}
                        placeholder="Override remarks (logged to audit)..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white/60 outline-none focus:border-[#F59F01]/40"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(latest.id, key)}
                          disabled={overrideMutation.isLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#F59F01] text-black rounded-lg text-xs font-bold"
                        >
                          {overrideMutation.isLoading ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                          Save Override
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-white/60 rounded-lg text-xs"
                        >
                          <RotateCcw size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white font-medium break-words">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Comparison */}
          {latest.ai_generated_terms && Object.keys(latest.ai_generated_terms).length > 0 && (
            <details className="border border-white/5 rounded-xl overflow-hidden">
              <summary className="p-4 text-sm text-white/40 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2">
                <BrainCircuit size={14} /> View Original AI-Generated Terms
              </summary>
              <div className="p-4 bg-white/[0.01] border-t border-white/5">
                <pre className="text-xs text-white/50 whitespace-pre-wrap font-mono">
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
