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
  Loader2, AlertTriangle, Sparkles, BrainCircuit, ChevronDown, ChevronUp,
  Printer, Upload, FileCheck, CheckCircle2
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
  const [viewMode, setViewMode] = useState('document'); // 'document' or 'sections'
  const [signedFile, setSignedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);


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
    mutationFn: async ({ key, value, remarks }) => {
      const res = await api.patch(`/deals/projects/${projectId}/spa-drafts/${latest.id}/`, {
        section_key: key,
        new_content: value,
        remarks
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Clause updated successfully.');
      setEditingSection(null);
      queryClient.invalidateQueries(['deals', projectId, 'spa-drafts']);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Update failed.')
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const res = await api.patch(`/deals/projects/${projectId}/spa-drafts/${latest.id}/`, {
        status: newStatus
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('SPA status updated.');
      queryClient.invalidateQueries(['deals', projectId, 'spa-drafts']);
    }
  });

  const uploadSignedMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post(`/deals/projects/${projectId}/spa-drafts/${latest.id}/upload-signed/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Signed SPA uploaded. Project promoted to CAPITAL_CALLED.');
      queryClient.invalidateQueries(['deals', projectId, 'spa-drafts']);
      queryClient.invalidateQueries(['deals', 'project', projectId]);
      setSignedFile(null);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Upload failed.')
  });

  const handleDownload = async () => {
    try {
      const response = await api.get(`/deals/projects/${projectId}/spa-drafts/${latest.id}/download/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SPA_${deal.legal_name.replace(/\s+/g, '_')}_FINAL.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('SPA Document downloaded successfully.');
    } catch (err) {
      toast.error('Failed to download PDF.');
    }
  };

  const handleFileUpload = (e) => {

    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('signed_spa', file);
    uploadSignedMutation.mutate(formData);
  };


  const startEdit = (key, currentValue) => {
    setEditingSection(key);
    setEditValue(typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : String(currentValue ?? ''));
    setEditRemarks('');
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="animate-spin text-[#F59F01]" size={32} />
      <p className="text-text-muted text-sm font-medium">Loading SPA Drafts...</p>
    </div>
  );

  if (!latest && !isProcessing) return (
    <div className="bg-white/5 border border-dashed border-border-theme rounded-2xl p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F59F01]/10 flex items-center justify-center mx-auto mb-6">
        <Scale className="text-[#F59F01]" size={32} />
      </div>
      <h3 className="text-xl font-bold text-ls-primary dark:text-white mb-2">No SPA Draft Found</h3>
      <p className="text-text-muted text-sm max-w-md mx-auto mb-8">
        Start by generating an AI-powered Share Purchase Agreement based on your Term Sheet and due diligence findings.
      </p>
      <button
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className="btn-primary-ls px-8 py-3 flex items-center gap-2 mx-auto"
      >
        {generateMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
        Generate AI SPA Draft
      </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-white/5 p-6 rounded-2xl border border-border-theme">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-ls-primary dark:text-white uppercase tracking-tight">Legal Execution Draft</h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              latest?.status === 'FINAL' ? 'bg-green-500/20 text-green-500' : 
              latest?.status === 'REVIEW' ? 'bg-blue-500/20 text-blue-500' : 'bg-[#F59F01]/20 text-[#F59F01]'
            }`}>
              {latest?.status || 'DRAFT'}
            </span>
          </div>
          <p className="text-text-muted text-xs font-medium">Version {latest?.version}.1 — Last updated {new Date(latest?.updated_at).toLocaleString()}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggles */}
          <div className="flex bg-ls-primary/5 dark:bg-white/5 p-1 rounded-xl mr-4">
            <button
              onClick={() => setViewMode('document')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'document' ? 'bg-white dark:bg-white/10 text-ls-primary dark:text-white shadow-sm' : 'text-text-muted hover:text-ls-primary'}`}
            >
              Document View
            </button>
            <button
              onClick={() => setViewMode('sections')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'sections' ? 'bg-white dark:bg-white/10 text-ls-primary dark:text-white shadow-sm' : 'text-text-muted hover:text-ls-primary'}`}
            >
              Section Editor
            </button>
          </div>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={isProcessing || latest.status !== 'DRAFT'}
            className="flex items-center gap-2 px-4 py-2 bg-[#F59F01]/10 text-[#F59F01] rounded-xl text-xs font-bold hover:bg-[#F59F01]/20 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Regenerate AI
          </button>
          
          <div className="h-6 w-px bg-border-theme mx-2" />
          
          <div className="flex items-center gap-2">
            {['DRAFT', 'REVIEW', 'FINAL'].map(s => (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                disabled={latest.status === s || statusMutation.isPending}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                  latest.status === s ? 'bg-ls-primary text-white scale-105' : 'bg-ls-primary/5 text-text-muted hover:bg-ls-primary/10'
                }`}
              >
                {s === 'DRAFT' ? 'Draft' : s === 'REVIEW' ? 'Under Legal Review' : 'Final'}
              </button>
            ))}
          </div>

          {/* Finalization Tasks (Visible when status is FINAL) */}
          {latest.status === 'FINAL' && deal.status !== 'CAPITAL_CALLED' && (
            <div className="bg-[#F59F01]/5 border border-[#F59F01]/30 rounded-2xl p-8 space-y-6 animate-in slide-in-from-top-4 duration-500 w-full mt-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F59F01] flex items-center justify-center text-ls-primary shadow-lg shadow-[#F59F01]/20">
                  <FileCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ls-primary dark:text-white uppercase tracking-tight">Execution Phase</h3>
                  <p className="text-text-muted text-xs font-medium">Download, Print, and Upload the Executed Share Purchase Agreement to trigger Capital Calls.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-3 p-6 bg-white dark:bg-white/5 border border-border-theme rounded-xl hover:border-[#F59F01] transition-all group"
                >
                  <Printer size={20} className="text-text-muted group-hover:text-[#F59F01] transition-colors" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-ls-primary dark:text-white">Download & Print</p>
                    <p className="text-[10px] text-text-muted">High-fidelity legal document (PDF)</p>
                  </div>
                </button>


                <label className="relative flex items-center justify-center gap-3 p-6 bg-white dark:bg-white/5 border border-border-theme rounded-xl hover:border-[#F59F01] transition-all group cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploadSignedMutation.isPending}
                  />
                  {uploadSignedMutation.isPending ? (
                    <Loader2 size={20} className="text-[#F59F01] animate-spin" />
                  ) : (
                    <Upload size={20} className="text-text-muted group-hover:text-[#F59F01] transition-colors" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-bold text-ls-primary dark:text-white">Upload Signed Copy</p>
                    <p className="text-[10px] text-text-muted">Trigger capital calls for LPs</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Success State when already promoted */}
          {deal.status === 'CAPITAL_CALLED' && (
             <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-6 flex items-center gap-4 text-green-500 w-full mt-4">
               <CheckCircle2 size={24} />
               <div>
                 <p className="text-sm font-bold uppercase tracking-tight">Investment Executed</p>
                 <p className="text-xs opacity-70 font-medium">Signed SPA is archived. Capital calls have been initiated for all committed LPs.</p>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'document' ? (
        <div className="bg-white dark:bg-ls-primary/20 border border-border-theme rounded-2xl p-12 shadow-2xl min-h-[1000px] font-serif theme-transition">
          <div className="max-w-3xl mx-auto space-y-12 print:space-y-8">
            {/* Document Header */}
            <div className="text-center space-y-4 border-b border-border-theme pb-8">
              <h1 className="text-3xl font-bold uppercase tracking-widest text-ls-primary dark:text-white">Share Purchase Agreement</h1>
              <p className="text-sm italic text-text-muted">Dated: {new Date(latest.created_at).toLocaleDateString()}</p>
            </div>

            {/* Clauses */}
            {Object.entries(SECTION_LABELS).map(([key, label], index) => {
              const content = latest.sections[key];
              const isEditing = editingSection === key;

              return (
                <div key={key} className="group relative">
                  <div className="flex items-baseline gap-4 mb-3">
                    <span className="font-bold text-lg min-w-[1.5rem]">{index + 1}.</span>
                    <h3 className="text-xl font-bold uppercase text-ls-primary dark:text-white">{label}</h3>
                    
                    {latest.status === 'DRAFT' && !isEditing && (
                      <button 
                        onClick={() => startEdit(key, content)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-ls-primary/5 text-[#F59F01] transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="pl-10">
                    {isEditing ? (
                      <div className="space-y-4 bg-ls-primary/5 p-6 rounded-2xl border border-[#F59F01]/30">
                         <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full h-64 bg-white dark:bg-ls-primary/20 p-4 rounded-xl text-sm border border-border-theme focus:ring-1 focus:ring-[#F59F01] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Reason for manual adjustment (immutable log entry)..."
                          value={editRemarks}
                          onChange={(e) => setEditRemarks(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-ls-primary/20 rounded-xl text-xs border border-border-theme focus:ring-1 focus:ring-[#F59F01] outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingSection(null)} className="px-4 py-2 text-xs font-bold text-text-muted hover:text-ls-primary">Cancel</button>
                          <button 
                            onClick={() => overrideMutation.mutate({ key, value: editValue, remarks: editRemarks })}
                            disabled={overrideMutation.isPending || !editRemarks}
                            className="px-6 py-2 bg-ls-primary text-white rounded-xl text-xs font-bold disabled:opacity-50"
                          >
                            {overrideMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-ls-primary dark:text-white/90 leading-relaxed whitespace-pre-wrap text-base">
                        {content || <span className="italic text-text-muted opacity-50">Clause content not generated...</span>}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-16 mt-24 pt-16 border-t border-border-theme print:mt-16">
              <div className="space-y-12">
                <p className="font-bold uppercase text-xs tracking-widest text-text-muted">For the Seller:</p>
                <div className="w-full border-b border-ls-primary/30 h-1" />
                <p className="text-sm font-bold uppercase">{deal.legal_name}</p>
              </div>
              <div className="space-y-12">
                <p className="font-bold uppercase text-xs tracking-widest text-text-muted">For the Purchaser:</p>
                <div className="w-full border-b border-ls-primary/30 h-1" />
                <p className="text-sm font-bold uppercase">Finlogic Capital Private Equity Fund I</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(latest.sections || {}).map(([key, value]) => {
            const isExpanded = expandedSection === key;
            const isEditing = editingSection === key;

            return (
              <div key={key} className={`bg-white dark:bg-white/5 border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-[#F59F01] shadow-lg shadow-[#F59F01]/5' : 'border-border-theme'}`}>
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : key)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-ls-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isExpanded ? 'bg-[#F59F01] text-white' : 'bg-ls-primary/5 text-ls-primary dark:text-white'}`}>
                      <BrainCircuit size={18} />
                    </div>
                    <span className="font-bold text-sm text-ls-primary dark:text-white">{SECTION_LABELS[key] || key}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full h-64 bg-ls-primary/5 dark:bg-white/5 p-4 rounded-xl text-sm border border-border-theme focus:ring-1 focus:ring-[#F59F01] outline-none theme-transition"
                        />
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Why are you overriding this AI draft?"
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="flex-1 p-3 bg-ls-primary/5 dark:bg-white/5 rounded-xl text-xs border border-border-theme focus:ring-1 focus:ring-[#F59F01] outline-none theme-transition"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingSection(null)} className="px-4 py-2 text-xs font-bold text-text-muted">Cancel</button>
                            <button 
                              onClick={() => overrideMutation.mutate({ key, value: editValue, remarks: editRemarks })}
                              disabled={overrideMutation.isPending || !editRemarks}
                              className="btn-primary-ls px-6 py-2 text-xs font-bold"
                            >
                              Save & Audit
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="text-sm leading-relaxed text-ls-primary dark:text-white/80 whitespace-pre-wrap p-4 bg-ls-primary/5 dark:bg-white/5 rounded-xl border border-border-theme">
                          {value}
                        </div>
                        {latest.status === 'DRAFT' && (
                          <button
                            onClick={() => startEdit(key, value)}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-ls-primary text-[#F59F01] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-border-theme"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
