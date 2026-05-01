'use client'

/**
 * (gp)/deals/[id]/page.jsx
 * Comprehensive GP Deal Management View.
 */
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  FileText, 
  MessageSquare, 
  Building2, 
  History, 
  BarChart4, 
  BrainCircuit, 
  CheckCircle2, 
  Loader2,
  Upload,
  ExternalLink,
  Zap,
  Percent,
  TrendingUp,
  AlertTriangle,
  Star,
  Eye,
  Users,
  Compass,
  ChevronRight,
  Search,
  Check,
  Edit3,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import html2pdf from 'html2pdf.js';
import Link from 'next/link';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';
import FileUploader from '@/components/portal/FileUploader';

const TABS = ['Overview', 'Data Room', 'Financials', 'Modelling', 'Valuations', 'Exit Planning', 'Monte Carlo', 'Memo', 'Commercial', 'Operations', 'Scoring', 'Red Flags', 'Form Responses', 'Audit Log'];






export default function GPDealDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Overview');

  // 1. Fetch Deal Data (Full payload from backend)
  const { data: deal, isLoading, isError } = useQuery({
    queryKey: ['deals', 'project', id],
    queryFn: async () => {
      const res = await api.get(`/deals/projects/${id}/`);
      return res.data;
    }
  });

  // 2. Mutations
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.patch(`/deals/projects/${id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals', 'project', id]);
      toast.success('Deal updated successfully');
    },
    onError: () => toast.error('Update failed.')
  });

  const handleViewDocument = async (fileKey) => {
    try {
      const res = await api.get(`/deals/documents/download-url/?key=${encodeURIComponent(fileKey)}`);
      window.open(res.data.url, '_blank');
    } catch (err) {
      toast.error('Could not generate download link');
    }
  };

  const extractMutation = useMutation({
    mutationFn: async (document_id) => {
      const res = await api.post(`/deals/projects/${id}/extract-financials/`, { document_id });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Financial extraction task triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Extraction failed')
  });

  const qoeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/deals/projects/${id}/qoe-analysis/?trigger=true`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('QoE analysis task triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'QoE analysis failed')
  });

  const verifyMutation = useMutation({
    mutationFn: async (finId) => {
      const res = await api.patch(`/deals/projects/${id}/extracted-financials/${finId}/verify/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Financial data verified');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const commercialMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deals/projects/${id}/run-commercial-analysis/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Commercial analysis triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const operationalMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deals/projects/${id}/run-operational-analysis/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Operational analysis triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const legalScanMutation = useMutation({
    mutationFn: async (docId) => {
      const res = await api.post(`/deals/projects/${id}/documents/${docId}/scan-legal/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Legal scan triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const reviewRedFlagMutation = useMutation({
    mutationFn: async (findingId) => {
      const res = await api.patch(`/deals/red-flags/${findingId}/review/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Red flag reviewed');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const fullAnalysisMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deals/projects/${id}/run-full-analysis/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Complete AI pipeline triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });


  const triggerScoringMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deals/projects/${id}/trigger-scoring/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('FINLO scoring engine triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const overrideScoreMutation = useMutation({
    mutationFn: async ({ scoreId, gp_score, gp_notes }) => {
      const res = await api.patch(`/deals/projects/${id}/scoring/criteria/${scoreId}/override/`, { gp_score, gp_notes });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Criterion score overridden');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const clearGateMutation = useMutation({
    mutationFn: async ({ gateId, notes }) => {
      const res = await api.post(`/deals/projects/${id}/scoring/gates/${gateId}/clear/`, { notes });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Compliance gate cleared');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const finalApproveMutation = useMutation({
    mutationFn: async ({ assessment_summary }) => {
      const res = await api.post(`/deals/projects/${id}/approve-for-lp/`, { assessment_summary });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Deal approved for LP visibility');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Approval failed')
  });

  const dcfMutation = useMutation({
    mutationFn: async (assumptions) => {
      const res = await api.post(`/deals/projects/${id}/valuation/dcf/`, { assumptions });
      return res.data;
    },
    onSuccess: () => {
      toast.success('DCF model created');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const lboMutation = useMutation({
    mutationFn: async (assumptions) => {
      const res = await api.post(`/deals/projects/${id}/valuation/lbo/`, { assumptions });
      return res.data;
    },
    onSuccess: () => {
      toast.success('LBO model created');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const generateMemoMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deals/projects/${id}/generate-memo/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('AI memo drafting triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const saveMemoMutation = useMutation({
    mutationFn: async ({ memoId, content }) => {
      const res = await api.patch(`/deals/projects/${id}/memos/${memoId}/`, { content });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Memo draft saved');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const finalizeMemoMutation = useMutation({
    mutationFn: async (memoId) => {
      const res = await api.post(`/deals/projects/${id}/memos/${memoId}/finalize/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Investment memo finalized');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const monteCarloMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/deals/portfolio/monte-carlo/`, { 
        investment_id: id,
        ...payload
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Risk simulation complete');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Simulation failed')
  });

  const investmentId = deal?.investments?.[0]?.id;

  const valuationRecordMutation = useMutation({
    mutationFn: (payload) => api.post(`/deals/portfolio/investments/${investmentId}/valuations/`, payload),
    onSuccess: () => {
      toast.success('Valuation recorded');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to record valuation')
  });

  const exitScenarioMutation = useMutation({
    mutationFn: (payload) => api.post(`/deals/portfolio/investments/${investmentId}/exit-scenarios/`, payload),
    onSuccess: () => {
      toast.success('Exit scenario created');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create exit scenario')
  });

  const approveExitMutation = useMutation({
    mutationFn: (scenarioId) => api.post(`/deals/portfolio/exit-scenarios/${scenarioId}/approve/`),
    onSuccess: () => {
      toast.success('Exit scenario approved by IC');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });






  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 size={32} className="text-[#F59F01] animate-spin" />
      <p className="text-white/40 text-sm animate-pulse">Loading detailed deal flow...</p>
    </div>
  );

  if (isError || !deal) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <Building2 size={32} />
      </div>
      <h2 className="text-white font-bold text-xl">Deal Not Found</h2>
      <Link href="/gp/deals" className="text-[#F59F01] hover:underline text-sm">Return to Pipeline</Link>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/gp/deals" className="flex items-center gap-1.5 text-white/40 hover:text-[#F59F01] text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft size={16} /> Back to Pipeline
        </Link>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => fullAnalysisMutation.mutate()}
             disabled={fullAnalysisMutation.isLoading}
             className="flex items-center gap-2 px-6 py-2.5 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
           >
              {fullAnalysisMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Run Full Analysis
           </button>

           {deal.status !== 'GP_APPROVED' && (
             <button 
               onClick={() => updateMutation.mutate({ status: 'GP_APPROVED' })}
               className="flex items-center gap-2 px-4 py-2 bg-[#F59F01] text-black rounded-lg text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
             >
               <CheckCircle2 size={14} /> Approve for LP
             </button>
           )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <StatusBadge status={deal.status} />
        </div>
        <div className="relative z-10 flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01] border border-[#F59F01]/20">
             <Building2 size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">{deal.legal_name}</h1>
            <div className="flex items-center gap-4 mt-2 text-white/40 text-sm">
              <span className="flex items-center gap-1.5"><Building2 size={14}/> {deal.sector}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <span>OCR: {deal.ocr_registration_number}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <span className="text-[#F59F01] font-bold uppercase tracking-tighter">{deal.deal_type_display}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === t
                ? 'bg-[#F59F01] text-black shadow-lg shadow-[#F59F01]/20'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {activeTab === 'Overview' && <OverviewTab deal={deal} />}
        {activeTab === 'Data Room' && (
          <DataRoomTab 
            deal={deal} 
            onView={handleViewDocument} 
            onRefresh={() => queryClient.invalidateQueries(['deals', 'project', id])} 
          />
        )}
        {activeTab === 'Financials' && (
          <FinancialsTab 
            deal={deal} 
            onExtract={extractMutation.mutate}
            onQoE={qoeMutation.mutate}
            onVerify={verifyMutation.mutate}
          />
        )}
        {activeTab === 'Modelling' && (
          <ValuationTab 
            deal={deal} 
            onRunDCF={dcfMutation.mutate}
            onRunLBO={lboMutation.mutate}
            isCalculating={dcfMutation.isLoading || lboMutation.isLoading}
          />
        )}
        {activeTab === 'Valuations' && (
          <ValuationsTrackingTab 
            deal={deal} 
            onRecord={valuationRecordMutation.mutate}
            isRecording={valuationRecordMutation.isLoading}
          />
        )}
        {activeTab === 'Exit Planning' && (
          <ExitPlanningTab 
            deal={deal} 
            onCreate={exitScenarioMutation.mutate}
            onApprove={approveExitMutation.mutate}
            isCreating={exitScenarioMutation.isLoading}
          />
        )}
        {activeTab === 'Monte Carlo' && (
          <MonteCarloTab 
            deal={deal} 
            onRun={monteCarloMutation.mutate}
            isLoading={monteCarloMutation.isLoading}
            results={monteCarloMutation.data}
          />
        )}
        {activeTab === 'Memo' && (
          <MemoTab 
            deal={deal} 
            onGenerate={generateMemoMutation.mutate}
            onSave={saveMemoMutation.mutate}
            onFinalize={finalizeMemoMutation.mutate}
            isGenerating={generateMemoMutation.isLoading}
          />
        )}
        {activeTab === 'Commercial' && (

          <CommercialTab 
            deal={deal} 
            onRun={commercialMutation.mutate}
            isLoading={commercialMutation.isLoading}
          />
        )}
        {activeTab === 'Operations' && (
          <OperationsTab 
            deal={deal} 
            onRun={operationalMutation.mutate}
            isLoading={operationalMutation.isLoading}
          />
        )}
        {activeTab === 'Scoring' && (
          <ScoringTab 
            deal={deal} 
            onTrigger={() => triggerScoringMutation.mutate()}
            isTriggering={triggerScoringMutation.isLoading}
            onOverride={overrideScoreMutation.mutate}
            onClearGate={clearGateMutation.mutate}
            onApprove={finalApproveMutation.mutate}
            isApproving={finalApproveMutation.isLoading}
          />
        )}
        {activeTab === 'Red Flags' && (
          <RedFlagsTab 
            deal={deal} 
            onReview={reviewRedFlagMutation.mutate}
          />
        )}

        {activeTab === 'Form Responses' && <FormResponsesTab responses={deal.form_responses} />}
        {activeTab === 'Audit Log' && <AuditLogTab events={deal.audit_events} />}


      </div>
    </div>
  );
}

function OverviewTab({ deal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Entity Information</h3>
          <div className="grid grid-cols-2 gap-y-6">
            <DetailItem label="Legal Name" value={deal.legal_name} />
            <DetailItem label="Registration #" value={deal.ocr_registration_number} />
            <DetailItem label="Fund" value={deal.fund_detail?.name} />
            <DetailItem label="Deal Type" value={deal.deal_type_display} />
            <DetailItem label="Sector" value={deal.sector} />
            <DetailItem label="Status" value={deal.status_display} />
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Investment Parameters</h3>
          <div className="grid grid-cols-2 gap-y-6">
            <DetailItem 
              label="Investment Range" 
              value={deal.investment_range_min_npr 
                ? `NPR ${Number(deal.investment_range_min_npr).toLocaleString()} - ${Number(deal.investment_range_max_npr).toLocaleString()}`
                : 'Not specified'} 
            />
            <DetailItem label="Submission Mode" value={deal.submission_type === 'MANUAL_GP' ? 'Manual Entry' : 'Entrepreneur Portal'} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 rounded-2xl p-6">
           <h3 className="text-sm font-bold text-[#F59F01] mb-4 uppercase tracking-widest">Contact Point</h3>
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                  <span className="text-xs font-bold">EP</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{deal.entrepreneur_detail?.email || 'No contact linked'}</p>
                  <p className="text-white/40 text-[10px] uppercase font-bold">Entrepreneur</p>
                </div>
              </div>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                Send Message
              </button>
           </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
           <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Workflow Metadata</h3>
           <div className="space-y-4">
             <DetailItem label="Created By" value={deal.created_by_detail?.email} />
             <DetailItem label="Date Created" value={new Date(deal.created_at).toLocaleDateString()} />
             <DetailItem label="Last Update" value={new Date(deal.updated_at).toLocaleDateString()} />
           </div>
        </div>
      </div>
    </div>
  );
}

function DataRoomTab({ deal, onView, onRefresh }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Virtual Data Room</h3>
          <p className="text-white/40 text-sm">Review or upload due diligence documents</p>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
           <span className="text-[#10b981] font-bold">{deal.data_room_completeness}%</span>
           <span className="text-white/30 text-xs ml-2 uppercase font-bold">Completeness</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-white/[0.02] text-white/40 uppercase text-[10px] font-bold tracking-widest">
                 <tr>
                   <th className="px-6 py-4">Document Name</th>
                   <th className="px-6 py-4">Category</th>
                   <th className="px-6 py-4">Uploaded By</th>
                   <th className="px-6 py-4 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {deal.documents?.map((doc) => (
                   <tr key={doc.id} className="hover:bg-white/[0.01] transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-[#F59F01]" />
                          <span className="text-white font-medium truncate max-w-[200px]">{doc.filename}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px] uppercase font-bold border border-white/5">
                          {doc.category_display}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-white/30 text-xs">
                        {doc.uploaded_by_detail?.email}
                     </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => legalScanMutation.mutate(doc.id)}
                              className="text-white/20 hover:text-[#F59F01] transition-colors p-1.5 hover:bg-white/5 rounded"
                              title="Legal Red Flag Scan"
                            >
                               <BrainCircuit size={16} />
                            </button>
                            <button 
                              onClick={() => onView(doc.file_key)}
                              className="text-white/20 hover:text-[#F59F01] transition-colors p-1.5 hover:bg-white/5 rounded"
                            >
                               <ExternalLink size={16} />
                            </button>
                         </div>
                      </td>

                   </tr>
                 ))}
                 {(!deal.documents || deal.documents.length === 0) && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-white/20 italic">No documents in data room</td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={16} className="text-[#F59F01]" /> Upload Document
            </h4>
            <FileUploader projectId={deal.id} onSuccess={onRefresh} />
          </div>

          <div className="pt-6 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Due Diligence Checklist</h4>
            <ul className="space-y-3">
              <ChecklistItem text="Company Registration (OCR)" />
              <ChecklistItem text="MoA / AoA (Prabandha Patra)" />
              <ChecklistItem text="Latest Audit Report" />
              <ChecklistItem text="Tax Clearance (Current FY)" />
              <ChecklistItem text="Shareholders Register" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ text }) {
  return (
    <li className="flex items-center gap-2 text-xs text-white/60">
      <div className="w-1 h-1 rounded-full bg-[#F59F01]" />
      {text}
    </li>
  );
}

function FinancialsTab({ deal, onExtract, onQoE, onVerify }) {
  const financials = deal.extracted_financials || [];
  const qoeReport = deal.qoe_reports?.[0]; // Get latest

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Financials Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Extracted Financials</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase mt-1">Multi-year trend analysis</p>
          </div>
          <div className="flex gap-2">
             <select 
               className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F59F01] transition-all"
               onChange={(e) => e.target.value && onExtract(e.target.value)}
               defaultValue=""
             >
               <option value="" disabled>Trigger Extraction...</option>
               {deal.documents?.filter(d => d.category === 'FINANCIAL').map(d => (
                 <option key={d.id} value={d.id}>{d.filename}</option>
               ))}
             </select>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-white/40 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
            <tr>
              <th className="px-6 py-4">FY (BS)</th>
              <th className="px-6 py-4">Revenue</th>
              <th className="px-6 py-4">EBITDA</th>
              <th className="px-6 py-4">PAT</th>
              <th className="px-6 py-4">Confidence</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {financials.map((f) => (
              <tr key={f.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-5 font-black text-white">{f.fiscal_year_bs}</td>
                <td className="px-6 py-5 text-white/80 font-medium">NPR {Number(f.revenue).toLocaleString()}</td>
                <td className="px-6 py-5 text-white/80 font-medium">NPR {Number(f.ebitda).toLocaleString()}</td>
                <td className="px-6 py-5 text-white/80 font-medium">NPR {Number(f.pat).toLocaleString()}</td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-3">
                     <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full transition-all duration-1000 ${f.extraction_confidence > 0.8 ? 'bg-[#10b981]' : 'bg-[#F59F01]'}`} 
                          style={{ width: `${f.extraction_confidence * 100}%` }}
                        />
                     </div>
                     <span className={`text-[10px] font-black ${(f.extraction_confidence * 100) > 80 ? 'text-[#10b981]' : 'text-[#F59F01]'}`}>
                       {(f.extraction_confidence * 100).toFixed(0)}%
                     </span>
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                   {f.is_verified_by_gp ? (
                     <span className="text-[#10b981] text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5">
                       <CheckCircle2 size={14} /> Verified
                     </span>
                   ) : (
                     <button 
                       onClick={() => onVerify(f.id)}
                       className="px-4 py-1.5 bg-[#F59F01]/10 text-[#F59F01] border border-[#F59F01]/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#F59F01] hover:text-black transition-all"
                     >
                       Verify
                     </button>
                   )}
                </td>
              </tr>
            ))}
            {financials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-white/20">
                    <BarChart4 size={40} />
                    <p className="italic text-sm">No financials extracted yet. Select a document above to begin.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* QoE Analysis Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8">
           <BrainCircuit size={120} className="text-white/[0.02] -mr-10 -mt-10" />
        </div>
        
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Quality of Earnings (QoE)</h3>
            <p className="text-white/40 text-sm mt-1">DeepSeek R1 reasoning on earnings sustainability and risk signals</p>
          </div>
          <button 
            onClick={() => onQoE()}
            disabled={financials.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              financials.length === 0 
              ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
              : 'bg-white/5 border border-white/10 text-white hover:bg-[#F59F01] hover:text-black hover:border-[#F59F01] shadow-lg hover:shadow-[#F59F01]/20'
            }`}
          >
            <BrainCircuit size={18} /> {qoeReport ? 'Re-Run Analysis' : 'Generate Analysis'}
          </button>
        </div>

        {qoeReport ? (
          <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-4">
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 ${deal.status === 'AI_REVIEW_NEEDED' ? 'bg-[#F59F01]/20 text-[#F59F01]' : 'bg-white/5 text-white/40'}`}>
                  {deal.status_display}
               </span>
               <button 
                 onClick={() => fullAnalysisMutation.mutate()}
                 disabled={fullAnalysisMutation.isLoading}
                 className="flex items-center gap-2 px-6 py-2.5 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
               >
                  {fullAnalysisMutation.isLoading ? <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" /> : <Zap size={14} />}
                  Run Full Analysis
               </button>
            </div>
            <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                 qoeReport.status === 'CLEAN' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 shadow-[#10b981]/10' :
                 qoeReport.status === 'CAUTION' ? 'bg-[#F59F01]/10 text-[#F59F01] border-[#F59F01]/20 shadow-[#F59F01]/10' :
                 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10'
               }`}>
                 {qoeReport.status === 'CLEAN' ? 'Green Flag (Clean)' : qoeReport.status === 'CAUTION' ? 'Yellow Flag (Caution)' : 'Red Flag (High Risk)'}
               </div>
               <span className="text-white/20 text-[10px] font-black uppercase tracking-tighter">
                 Last Analysis: {new Date(qoeReport.created_at).toLocaleString()}
               </span>
            
            <div className="bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
               <div className="prose prose-invert max-w-none">
                 <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-medium font-serif italic">
                   {qoeReport.report_text}
                 </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <RiskMetric label="Revenue Recognition" status={qoeReport.status === 'HIGH_RISK' ? 'Red' : 'Green'} />
               <RiskMetric label="Related Party Ops" status="Yellow" />
               <RiskMetric label="EBITDA Adjustments" status={qoeReport.status === 'CLEAN' ? 'Green' : 'Yellow'} />
            </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6 relative z-10">
             <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mx-auto border border-white/5">
                <BrainCircuit size={40} />
             </div>
             <div className="max-w-xs mx-auto">
               <p className="text-white font-bold text-sm">Waiting for Analysis</p>
               <p className="text-white/20 text-xs mt-2 italic">Extraction must be completed before running QoE analysis.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommercialTab({ deal, onRun, isLoading }) {
  const analysis = deal.commercial_analyses?.[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Commercial Due Diligence</h3>
            <p className="text-white/40 text-sm mt-1">Market positioning and customer concentration analysis</p>
          </div>
          <button 
            onClick={() => onRun()}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
            {analysis ? 'Re-Run Analysis' : 'Run Commercial Analysis'}
          </button>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
               <div className="bg-black/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
                  <h4 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest mb-4">Market Positioning</h4>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap font-medium font-serif italic">
                    {analysis.market_positioning_notes}
                  </p>
               </div>
            </div>
            
            <div className="space-y-6">
               <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Customer Concentration</p>
                  <div className="text-4xl font-black text-white">{analysis.customer_concentration_pct}%</div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full ${analysis.customer_concentration_pct > 30 ? 'bg-red-500' : 'bg-[#10b981]'}`}
                      style={{ width: `${analysis.customer_concentration_pct}%` }}
                    />
                  </div>
               </div>

               <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Top Customers</h4>
                  <div className="text-white/70 text-sm whitespace-pre-wrap">
                    {analysis.top_customer_names || "No specific customer data extracted."}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6">
             <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mx-auto border border-white/5">
                <BarChart4 size={40} />
             </div>
             <p className="text-white/20 italic text-sm">No commercial analysis generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OperationsTab({ deal, onRun, isLoading }) {
  const analysis = deal.operational_analyses?.[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Operational Due Diligence</h3>
            <p className="text-white/40 text-sm mt-1">Tech stack, key person risk, and supply chain audit</p>
          </div>
          <button 
            onClick={() => onRun()}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
            {analysis ? 'Re-Run Analysis' : 'Run Operational Analysis'}
          </button>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
               <div className="bg-black/40 p-8 rounded-3xl border border-white/5">
                  <h4 className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest mb-6">Technology Stack</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {Object.entries(analysis.technology_stack || {}).map(([key, val]) => (
                        <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5">
                           <p className="text-[10px] text-white/30 uppercase font-black mb-1">{key}</p>
                           <p className="text-white text-xs font-bold">{String(val)}</p>
                        </div>
                     ))}
                  </div>
                  {Object.keys(analysis.technology_stack || {}).length === 0 && (
                    <p className="text-white/20 text-xs italic">No tech stack data identified.</p>
                  )}
               </div>

               <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Supply Chain Risks</h4>
                  <ul className="space-y-3">
                    {(analysis.supply_chain_risks || []).map((risk, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                         <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                         {risk}
                      </li>
                    ))}
                    {(analysis.supply_chain_risks || []).length === 0 && (
                      <p className="text-white/20 text-xs italic">No supply chain risks identified.</p>
                    )}
                  </ul>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Key Person Risk</h4>
                    <p className="text-white/20 text-[10px]">Dependency on founding team</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-3xl font-black ${analysis.key_person_risk_score > 7 ? 'text-red-500' : 'text-[#F59F01]'}`}>
                      {analysis.key_person_risk_score}/10
                    </span>
                  </div>
               </div>

               <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl">
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <History size={14} /> Operational Red Flags
                  </h4>
                  <ul className="space-y-4">
                    {(analysis.operational_red_flags || []).map((flag, i) => (
                      <li key={i} className="p-4 bg-black/20 rounded-xl border border-red-500/10 text-xs text-white/80 leading-relaxed font-serif italic">
                        {flag}
                      </li>
                    ))}
                    {(analysis.operational_red_flags || []).length === 0 && (
                      <p className="text-white/20 text-xs italic">No major red flags identified.</p>
                    )}
                  </ul>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center space-y-6">
             <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mx-auto border border-white/5">
                <History size={40} />
             </div>
             <p className="text-white/20 italic text-sm">No operational analysis generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RedFlagsTab({ deal, onReview }) {
  const findings = deal.red_flags || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">Legal Red Flags</h3>
          <p className="text-white/40 text-sm mt-1">AI-detected legal risks and contract anomalies</p>
        </div>
        <div className="flex gap-4">
           <SeveritySummary count={findings.filter(f => f.severity === 'CRITICAL').length} label="Critical" color="bg-red-500" />
           <SeveritySummary count={findings.filter(f => f.severity === 'WARNING').length} label="Warning" color="bg-[#F59F01]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {findings.map((f) => (
          <div key={f.id} className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-white/20 ${f.is_reviewed_by_gp ? 'opacity-60' : ''}`}>
            <div className="p-6 flex items-start justify-between gap-6">
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${f.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-[#F59F01] shadow-[0_0_8px_#F59F01]'}`} />
                     <h4 className="text-white font-bold text-lg">{f.pattern_detail?.name || 'Manual Finding'}</h4>
                     <span className="text-[10px] text-white/30 font-black uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
                       {f.document_name}
                     </span>
                  </div>
                  
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-white/60 italic leading-relaxed">
                     "...{f.context_snippet}..."
                  </div>

                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">AI Analysis & Risk Mitigation</p>
                     <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-serif italic">
                        {f.ai_analysis}
                     </p>
                  </div>

                  {f.pattern_detail?.nepal_context_note && (
                    <div className="bg-[#F59F01]/5 border border-[#F59F01]/10 p-4 rounded-xl">
                       <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest mb-1">Nepal Regulatory Context</p>
                       <p className="text-white/60 text-xs">{f.pattern_detail.nepal_context_note}</p>
                    </div>
                  )}
               </div>

               <div className="w-48 flex flex-col items-end gap-4">
                  {f.is_reviewed_by_gp ? (
                    <div className="text-right">
                       <p className="text-[#10b981] text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 mb-1">
                         <CheckCircle2 size={14} /> Reviewed
                       </p>
                       <p className="text-white/20 text-[9px] font-bold">By {f.reviewed_by_detail?.email || 'GP'}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onReview(f.id)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-white/5"
                    >
                      Mark Reviewed
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

function ScoringTab({ deal, onTrigger, isTriggering, onOverride, onClearGate, onApprove, isApproving }) {
  const scoring = deal.latest_scoring;
  const [summary, setSummary] = useState('');

  if (!scoring) {
    return (
      <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#F59F01]/20 mx-auto border border-white/5">
          <Star size={40} />
        </div>
        <div className="max-w-md mx-auto px-6">
           <h3 className="text-white font-bold text-lg mb-2">Initialize FINLO Scoring</h3>
           <p className="text-white/40 text-sm mb-8 leading-relaxed">
             Start the proprietary scoring engine to evaluate this project across 20 criteria in 5 pillars.
           </p>
           <button 
             onClick={onTrigger}
             disabled={isTriggering}
             className="px-8 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
           >
             {isTriggering ? 'Executing Engine...' : 'Run FINLO Engine'}
           </button>
        </div>
      </div>
    );
  }

  const pillars = [
    { code: 'F', name: 'Foresight', weight: '20%', icon: <Eye size={18} /> },
    { code: 'I', name: 'Insight', weight: '25%', icon: <Zap size={18} /> },
    { code: 'N', name: 'Nexus', weight: '20%', icon: <Users size={18} /> },
    { code: 'L', name: 'Logic', weight: '20%', icon: <BarChart4 size={18} /> },
    { code: 'O', name: 'Odyssey', weight: '15%', icon: <Compass size={18} /> },
  ];

  const wordCount = summary.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isApproved = deal.status === 'GP_APPROVED';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Warning Banner */}
      <div className="bg-[#F59F01]/10 border border-[#F59F01]/30 p-6 rounded-2xl flex gap-4 items-start">
         <AlertTriangle className="text-[#F59F01] shrink-0" size={24} />
         <p className="text-[#F59F01] text-xs font-bold leading-relaxed uppercase tracking-wider">
           AI PRELIMINARY ANALYSIS — NOT INVESTMENT ADVICE. All scores are AI-generated suggestions. 
           You are responsible for reviewing, overriding, and validating each score.
         </p>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between px-2">
         <div>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase">FINLO Deal Score</h3>
            <p className="text-white/40 text-sm mt-1">Proprietary Investment Framework</p>
         </div>
         <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-3xl text-center shadow-2xl">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Weighted Total</p>
            <div className="text-5xl font-black text-[#F59F01] tabular-nums">{scoring.total_deal_score}</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scoring Pillars */}
        <div className="lg:col-span-2 space-y-4">
           {pillars.map(p => (
             <ScoringPillar 
               key={p.code} 
               pillar={p} 
               scores={scoring.criteria_scores.filter(s => s.pillar === p.code)}
               onOverride={onOverride}
             />
           ))}
        </div>

        {/* Sidebar: Compliance & Approval */}
        <div className="space-y-8">
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Compliance Gates</h4>
              <div className="space-y-6">
                 {scoring.compliance_gates.map(gate => (
                   <ComplianceGateRow key={gate.id} gate={gate} onClear={(notes) => onClearGate({ gateId: gate.gate_id, notes })} />
                 ))}
              </div>
           </div>

           {/* Nepal Regulatory Checklist */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Nepal Regulatory</h4>
              <div className="space-y-4">
                 <RegulatoryItem label="FITTA Approval" status={deal.regulatory_checklist?.fitta_approval_obtained} required={deal.regulatory_checklist?.fitta_approval_required} />
                 <RegulatoryItem label="NRB Approval" status={deal.regulatory_checklist?.nrb_approval_obtained} required={deal.regulatory_checklist?.nrb_approval_required} />
                 <RegulatoryItem label="SEBON Compliant" status={deal.regulatory_checklist?.sebon_reporting_compliant} required={true} />
              </div>
              <Link href={`/gp/deals/${deal.id}/regulatory`} className="block mt-6 text-center text-[9px] font-black text-[#F59F01] uppercase tracking-widest hover:opacity-70 transition-opacity">
                Manage Detailed Checklist
              </Link>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">

              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Final Assessment</h4>
              <div className="space-y-4">
                 <textarea 
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Enter final investment recommendation summary (min 100 words)..."
                    className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#F59F01]/50 transition-all font-serif"
                 />
                 <div className="flex items-center justify-between px-1">
                    <span className={`text-[10px] font-bold ${wordCount >= 100 ? 'text-[#10b981]' : 'text-white/20'}`}>
                       {wordCount} / 100 words
                    </span>
                    {wordCount >= 100 && <CheckCircle2 size={14} className="text-[#10b981]" />}
                 </div>
              </div>

              <button 
                onClick={() => onApprove({ assessment_summary: summary })}
                disabled={isApproving || wordCount < 100 || isApproved}
                className="w-full mt-8 py-4 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-30 disabled:hover:scale-100"
              >
                {isApproved ? 'Deal Approved' : (isApproving ? 'Approving...' : 'Approve for LP Visibility')}
              </button>
              
              {!isApproved && wordCount < 100 && (
                <p className="text-[10px] text-white/20 text-center mt-4 italic">
                  * 100 words minimum required for approval
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function ScoringPillar({ pillar, scores, onOverride }) {
  const [isOpen, setIsOpen] = useState(false);
  const avgScore = scores.reduce((acc, s) => acc + (s.gp_score || s.ai_score), 0) / (scores.length || 1);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all ${isOpen ? 'ring-1 ring-[#F59F01]/30' : ''}`}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
       >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#F59F01]">
                {pillar.icon}
             </div>
             <div className="text-left">
                <h4 className="text-white font-black text-lg tracking-tight uppercase">{pillar.name}</h4>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Weight: {pillar.weight}</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] text-white/20 uppercase font-black mb-1">Average</p>
                <span className="text-2xl font-black text-white tabular-nums">{avgScore.toFixed(1)}</span>
             </div>
             <ChevronRight size={20} className={`text-white/20 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </div>
       </button>

       {isOpen && (
         <div className="p-6 pt-0 space-y-4 border-t border-white/5 mt-4">
            {scores.map(s => (
              <CriterionRow key={s.id} score={s} onOverride={onOverride} />
            ))}
         </div>
       )}
    </div>
  );
}

function CriterionRow({ score, onOverride }) {
  const [val, setVal] = useState(score.gp_score || score.ai_score);
  const [isEditing, setIsEditing] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const getScoreColor = (v) => {
    if (v >= 8) return 'bg-[#10b981]';
    if (v >= 6) return 'bg-yellow-500';
    if (v >= 4) return 'bg-[#F59F01]';
    return 'bg-red-500';
  };

  return (
    <div className="bg-black/20 border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10">
       <div className="flex items-start justify-between gap-8">
          <div className="flex-1 space-y-2">
             <h5 className="text-white font-bold text-sm capitalize">{score.criterion_id.replace(/_/g, ' ')}</h5>
             <p className="text-white/50 text-xs leading-relaxed italic line-clamp-2">{score.ai_rationale}</p>
             <div className="flex items-center gap-4 mt-4">
                <button 
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="text-[9px] font-black text-[#F59F01] uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                >
                  <Search size={12} /> {showEvidence ? 'Hide Evidence' : 'View AI Evidence'}
                </button>
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">
                  Confidence: {(score.ai_confidence * 100).toFixed(0)}%
                </span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {isEditing ? (
               <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={val}
                    onChange={(e) => setVal(parseInt(e.target.value))}
                    className="w-16 bg-white/5 border border-[#F59F01]/50 rounded-lg p-2 text-white font-black text-center"
                  />
                  <button 
                    onClick={() => {
                      onOverride({ scoreId: score.id, gp_score: val });
                      setIsEditing(false);
                    }}
                    className="p-2 bg-[#F59F01] text-black rounded-lg hover:scale-105 transition-all"
                  >
                    <Check size={16} />
                  </button>
               </div>
             ) : (
               <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg ${getScoreColor(val)}`}>
                    {val}
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
               </div>
             )}
          </div>
       </div>

       {showEvidence && (
         <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {(score.evidence_quotes || []).map((q, i) => (
              <div key={i} className="p-3 bg-white/5 border-l-2 border-[#F59F01]/50 rounded-r-xl text-[11px] text-white/60 leading-relaxed font-mono">
                "{q}"
              </div>
            ))}
            {(!score.evidence_quotes || score.evidence_quotes.length === 0) && (
              <p className="text-[10px] text-white/20 italic">No specific evidence quotes extracted.</p>
            )}
         </div>
       )}
    </div>
  );
}

function ComplianceGateRow({ gate, onClear }) {
  const isCleared = gate.status === 'CLEARED';
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <div className="flex items-center justify-between group">
       <div className="space-y-1">
          <p className="text-white font-bold text-xs capitalize">{gate.gate_id.replace(/_/g, ' ')}</p>
          <span className={`text-[9px] font-black uppercase tracking-tighter ${isCleared ? 'text-[#10b981]' : 'text-white/20'}`}>
            {gate.status}
          </span>
       </div>
       {isCleared ? (
         <CheckCircle2 size={18} className="text-[#10b981]" />
       ) : (
         <button 
           onClick={() => setShowModal(true)}
           className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-[#F59F01] hover:text-black hover:border-[#F59F01]"
         >
           Clear
         </button>
       )}

       {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1A1A1A] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
               <h3 className="text-white font-black text-xl tracking-tight uppercase">Clear {gate.gate_id.replace(/_/g, ' ')}</h3>
               <p className="text-white/40 text-xs leading-relaxed">
                  Confirm that this compliance gate has been manually verified and cleared. This action will be logged in the audit trail.
               </p>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Enter verification notes..."
                 className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#F59F01]"
               />
               <div className="flex gap-4">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-white/40 text-xs font-black uppercase">Cancel</button>
                  <button 
                    onClick={() => {
                      onClear(notes);
                      setShowModal(false);
                    }}
                    className="flex-1 py-3 bg-[#F59F01] text-black rounded-xl text-xs font-black uppercase shadow-lg shadow-[#F59F01]/20"
                  >
                    Confirm Clear
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}

function ValuationTab({ deal, onRunDCF, onRunLBO, isCalculating }) {
  const [activeSubTab, setActiveSubTab] = useState('DCF');
  const valuations = deal.valuations || [];
  const latestDCF = valuations.find(v => v.model_type === 'DCF');
  const latestLBO = valuations.find(v => v.model_type === 'LBO');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {['DCF', 'LBO'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveSubTab(t)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === t ? 'bg-[#F59F01] text-black shadow-lg shadow-[#F59F01]/20' : 'text-white/40 hover:text-white'}`}
              >
                {t} Analysis
              </button>
            ))}
         </div>
      </div>

      {activeSubTab === 'DCF' && (
        <DCFModel 
          model={latestDCF} 
          onRun={onRunDCF} 
          isCalculating={isCalculating} 
        />
      )}
      {activeSubTab === 'LBO' && (
        <LBOModel 
          model={latestLBO} 
          onRun={onRunLBO} 
          isCalculating={isCalculating} 
        />
      )}
    </div>
  );
}

function DCFModel({ model, onRun, isCalculating }) {
  const [inputs, setInputs] = useState({
    current_revenue: 1000000,
    revenue_growth_rate: 0.15,
    ebitda_margin: 0.20,
    tax_rate: 0.25,
    projection_years: 5,
    wacc: 0.12,
    terminal_growth_rate: 0.03,
    net_debt: 200000
  });


  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
       {/* Inputs */}
       <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Assumptions</h4>
          <div className="grid grid-cols-1 gap-4">
             <ValInput label="Current Revenue (NPR)" value={inputs.current_revenue} onChange={v => setInputs({...inputs, current_revenue: parseFloat(v)})} />
             <ValInput label="Revenue Growth (%)" value={inputs.revenue_growth_rate * 100} onChange={v => setInputs({...inputs, revenue_growth_rate: v/100})} isPct />
             <ValInput label="EBITDA Margin (%)" value={inputs.ebitda_margin * 100} onChange={v => setInputs({...inputs, ebitda_margin: v/100})} isPct />
             <ValInput label="WACC (%)" value={inputs.wacc * 100} onChange={v => setInputs({...inputs, wacc: v/100})} isPct />
             <ValInput label="Terminal Growth (%)" value={inputs.terminal_growth_rate * 100} onChange={v => setInputs({...inputs, terminal_growth_rate: v/100})} isPct />
             <ValInput label="Net Debt (NPR)" value={inputs.net_debt} onChange={v => setInputs({...inputs, net_debt: parseFloat(v)})} />
          </div>
          <button 
            onClick={() => onRun(inputs)}
            disabled={isCalculating}
            className="w-full mt-6 py-4 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isCalculating ? 'Recalculating...' : 'Update DCF Model'}
          </button>
       </div>

       {/* Outputs */}
       <div className="xl:col-span-2 space-y-8">
          {model ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <OutputCard label="Enterprise Value" value={model.outputs.enterprise_value} />
                 <OutputCard label="Equity Value" value={model.outputs.equity_value} highlight />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Year</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Revenue</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">EBITDA</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">FCF</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">PV of FCF</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {model.outputs.projections.map(p => (
                         <tr key={p.year} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-white/60">{p.year}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white text-right">{p.revenue.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white text-right">{p.ebitda.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#10b981] text-right">{p.fcf.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#F59F01] text-right">{p.pv_fcf.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-3xl space-y-4 opacity-40">
               <BarChart4 size={48} />
               <p className="text-sm font-bold">Configure assumptions and run the model</p>
            </div>
          )}
       </div>
    </div>
  );
}

function LBOModel({ model, onRun, isCalculating }) {
  const [inputs, setInputs] = useState({
    entry_revenue: 5000000,
    entry_ebitda: 1000000,
    entry_multiple: 8.0,
    exit_multiple: 10.0,
    exit_year: 5,
    revenue_growth: 0.1,
    ebitda_margin: 0.22,
    tax_rate: 0.25,
    debt_financing: [
       { name: "Senior Term Loan", amount: 2000000, rate: 0.12 },
       { name: "Mezzanine Debt", amount: 1000000, rate: 0.18 }
    ]
  });


  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
       {/* Inputs */}
       <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Transaction Inputs</h4>
          <div className="grid grid-cols-1 gap-4">
             <ValInput label="Entry EBITDA (NPR)" value={inputs.entry_ebitda} onChange={v => setInputs({...inputs, entry_ebitda: parseFloat(v)})} />
             <ValInput label="Entry Multiple" value={inputs.entry_multiple} onChange={v => setInputs({...inputs, entry_multiple: parseFloat(v)})} />
             <ValInput label="Exit Multiple" value={inputs.exit_multiple} onChange={v => setInputs({...inputs, exit_multiple: parseFloat(v)})} />
             <ValInput label="Revenue Growth (%)" value={inputs.revenue_growth * 100} onChange={v => setInputs({...inputs, revenue_growth: v/100})} isPct />
             <div className="space-y-2 mt-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Debt Structure</p>
                {inputs.debt_financing.map((d, i) => (
                  <div key={i} className="flex gap-2">
                     <input className="flex-1 bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white" value={d.name} disabled />
                     <input className="w-24 bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-white text-right" value={d.amount.toLocaleString()} disabled />
                  </div>
                ))}
             </div>
          </div>
          <button 
            onClick={() => onRun(inputs)}
            disabled={isCalculating}
            className="w-full mt-6 py-4 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
          >
            {isCalculating ? 'Modeling Returns...' : 'Run LBO Analysis'}
          </button>
       </div>

       {/* Outputs */}
       <div className="xl:col-span-2 space-y-8">
          {model ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <OutputCard label="Exit Equity Value" value={model.outputs.exit_equity} />
                 <OutputCard label="MOIC" value={model.outputs.moic} isRaw />
                 <OutputCard label="IRR (%)" value={model.outputs.irr * 100} isPct highlight />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white/5">
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Year</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">EBITDA</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Cash for Paydown</th>
                          <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Remaining Debt</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {model.outputs.projections.map(p => (
                         <tr key={p.year} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-white/60">{p.year}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white text-right">{p.ebitda.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#10b981] text-right">{p.fcf.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs font-mono text-white/40 text-right">{p.remaining_debt.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-3xl space-y-4 opacity-40">
               <Zap size={48} />
               <p className="text-sm font-bold">Configure LBO parameters and run modeling</p>
            </div>
          )}
       </div>
    </div>
  );
}

function ValInput({ label, value, onChange, isPct }) {
  return (
    <div className="space-y-1.5">
       <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">{label}</label>
       <div className="relative">
          <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#F59F01]/50 transition-all font-mono"
          />
          {isPct && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">%</span>}
       </div>
    </div>
  );
}

function OutputCard({ label, value, isPct, isRaw, highlight }) {
  return (
    <div className={`p-6 rounded-3xl border border-white/10 shadow-xl ${highlight ? 'bg-[#F59F01] text-black border-transparent' : 'bg-white/5 text-white'}`}>
       <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${highlight ? 'text-black/40' : 'text-white/20'}`}>{label}</p>
       <div className="text-2xl font-black tabular-nums">
          {isPct ? `${value.toFixed(1)}%` : (isRaw ? value.toFixed(2) : `NPR ${value.toLocaleString()}`)}
       </div>
    </div>
  );
}

function SensitivityTable({ data, isIRR }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6">
       <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
             <thead>
                <tr>
                   <th className="p-2 border border-white/5 bg-black/20 text-white/20 uppercase tracking-widest">{data.y_axis} \ {data.x_axis}</th>
                   {data.x_range.map(x => (
                     <th key={x} className="p-2 border border-white/5 bg-black/20 text-white font-bold">{isIRR ? x : x}</th>
                   ))}
                </tr>
             </thead>
             <tbody>
                {data.results.map((res, i) => (
                  <tr key={i}>
                     <td className="p-2 border border-white/5 bg-black/20 text-white font-bold text-center">
                        {data.y_axis.includes('rate') || data.y_axis.includes('growth') ? `${(res.y_val*100).toFixed(1)}%` : res.y_val}
                     </td>
                     {res.row.map((val, j) => (
                       <td key={j} className={`p-2 border border-white/5 text-center font-mono ${isIRR ? (val > 0.2 ? 'text-[#10b981]' : 'text-white/60') : 'text-white/60'}`}>
                          {isIRR ? `${(val*100).toFixed(1)}%` : val.toLocaleString()}
                       </td>
                     ))}
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function RegulatoryItem({ label, status, required }) {
  if (!required) return null;
  return (
    <div className="flex items-center justify-between">
       <span className="text-[10px] text-white/60">{label}</span>
       {status ? (
         <CheckCircle2 size={14} className="text-[#10b981]" />
       ) : (
         <Clock size={14} className="text-[#F59F01]" />
       )}
    </div>
  );
}

function RiskMetric({ label, status }) {
  const colors = {
    Green: 'bg-[#10b981]',
    Yellow: 'bg-[#F59F01]',
    Red: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-white/10'}`} />
      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">{label}</span>
    </div>
  );
}

// Memo Components
function MemoTab({ deal, onGenerate, onSave, onFinalize, isGenerating }) {
  const memo = deal.latest_memo;
  const [activeSection, setActiveSection] = useState('executive_summary');

  if (!memo) {
    return (
      <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#F59F01]/20 mx-auto border border-white/5">
          <FileText size={40} />
        </div>
        <div className="max-w-md mx-auto px-6">
           <h3 className="text-white font-bold text-lg mb-2">Draft Investment Memo</h3>
           <p className="text-white/40 text-sm mb-8 leading-relaxed">
             Use DeepSeek R1 to synthesize all project data into a professional 8-section investment committee memo.
           </p>
           <button 
             onClick={onGenerate}
             disabled={isGenerating}
             className="px-8 py-3 bg-[#F59F01] text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
           >
             {isGenerating ? 'Generating Memo Draft...' : 'Generate with AI'}
           </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'executive_summary', name: 'Executive Summary' },
    { id: 'company_overview', name: 'Company Overview' },
    { id: 'market_analysis', name: 'Market Analysis' },
    { id: 'competitive_position', name: 'Competitive Position' },
    { id: 'financial_analysis', name: 'Financial Analysis' },
    { id: 'risk_assessment', name: 'Risk Assessment' },
    { id: 'investment_recommendation', name: 'Recommendation' },
    { id: 'deal_terms', name: 'Deal Terms' },
  ];

  const handleExport = () => {
    const element = document.getElementById('memo-content');
    const opt = {
      margin: 1,
      filename: `Memo_${deal.legal_name}_v${memo.version}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       {/* Sidebar */}
       <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Sections</h4>
                <span className="text-[10px] font-bold text-white/20">v{memo.version} {memo.status}</span>
             </div>
             <div className="space-y-1">
                {sections.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeSection === s.id ? 'bg-[#F59F01] text-black' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    {s.name}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
             <button 
               onClick={handleExport}
               className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
             >
               <Download size={14} /> Export to PDF
             </button>
             {memo.status !== 'FINAL' && (
               <button 
                 onClick={() => onFinalize(memo.id)}
                 className="w-full py-3 bg-[#10b981] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#10b981]/20"
               >
                 Finalize Memo
               </button>
             )}
          </div>
       </div>

       {/* Editor Area */}
       <div className="lg:col-span-3 space-y-6">
          <div id="memo-content" className="bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl min-h-[600px]">
             <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Investment Memo</h2>
                   <p className="text-white/40 text-sm mt-1">{deal.legal_name} • Internal Confidential</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Version {memo.version}</p>
                   <p className="text-[10px] text-white/20 mt-1 font-mono">{format(new Date(memo.created_at), 'yyyy-MM-dd')}</p>
                </div>
             </div>

             <MemoSection 
               key={activeSection}
               title={sections.find(s => s.id === activeSection)?.name}
               content={memo.content[activeSection]} 
               onSave={(newContent) => {
                  const updated = { ...memo.content, [activeSection]: newContent };
                  onSave({ memoId: memo.id, content: updated });
               }}
               isReadOnly={memo.status === 'FINAL'}
             />
          </div>
       </div>
    </div>
  );
}

function MemoSection({ title, content, onSave, isReadOnly }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start drafting...' })
    ],
    content: content || '<p>AI drafting failed to generate content for this section.</p>',
    editable: !isReadOnly,
    onBlur: ({ editor }) => {
      onSave(editor.getHTML());
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <h3 className="text-xl font-black text-white/80 uppercase tracking-tight border-l-4 border-[#F59F01] pl-4">{title}</h3>
       <div className="prose prose-invert max-w-none prose-p:text-white/60 prose-p:leading-relaxed prose-headings:text-white prose-strong:text-[#F59F01]">
          <EditorContent editor={editor} className="min-h-[300px] focus:outline-none" />
       </div>
    </div>
  );
}

function FormResponsesTab({ responses }) {
  return (
    <div className="space-y-6">
      {(!responses || responses.length === 0) ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/20 italic">
           No form responses recorded for this deal.
        </div>
      ) : (
        responses.map((r) => (
          <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
                <MessageSquare size={16} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Step {r.step_index}: {r.step_name}</h4>
                <p className="text-white/30 text-[10px] uppercase font-bold tracking-tighter">Submitted {new Date(r.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {Object.entries(r.response_data || {}).map(([key, val]) => (
                 <div key={key}>
                    <p className="text-white/30 text-[10px] uppercase font-black mb-1.5 tracking-widest">{key.replace(/_/g, ' ')}</p>
                    <p className="text-white text-sm">{String(val)}</p>
                 </div>
               ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AuditLogTab({ events }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <History size={18} className="text-[#F59F01]" />
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Immutable Audit Trail</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.02] text-white/20 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
          <tr>
            <th className="px-6 py-4">Event Type</th>
            <th className="px-6 py-4">Actor</th>
            <th className="px-6 py-4">Details</th>
            <th className="px-6 py-4 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events?.map((ev) => (
            <tr key={ev.id} className="hover:bg-white/[0.01] transition-colors">
              <td className="px-6 py-5">
                <span className="text-[#F59F01] font-bold text-xs uppercase tracking-tighter">
                  {ev.event_type_display}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-medium">{ev.actor_email || 'System'}</span>
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-tight">{ev.ip_address || 'Internal'}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="text-[10px] text-white/40 font-mono bg-black/20 p-2 rounded max-w-xs truncate">
                  {JSON.stringify(ev.payload)}
                </div>
              </td>
              <td className="px-6 py-5 text-right text-white/30 text-xs font-medium">
                {new Date(ev.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
          {(!events || events.length === 0) && (
             <tr>
               <td colSpan={4} className="px-6 py-12 text-center text-white/20 italic">No audit events found</td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MonteCarloTab({ deal, onRun, isLoading, results }) {
  const [assumptions, setAssumptions] = useState({
    exit_multiple_mean: 3.0,
    exit_multiple_std: 0.5,
    growth_mean: 0.20,
    growth_std: 0.10,
    num_simulations: 10000
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#F59F01]" /> Simulation Parameters
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Exit Multiple (Normal Dist)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Mean (x)</label>
                    <input 
                      type="number" step="0.1"
                      value={assumptions.exit_multiple_mean}
                      onChange={(e) => setAssumptions({...assumptions, exit_multiple_mean: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Std Dev</label>
                    <input 
                      type="number" step="0.05"
                      value={assumptions.exit_multiple_std}
                      onChange={(e) => setAssumptions({...assumptions, exit_multiple_std: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-[#F59F01] uppercase tracking-widest">Revenue Growth (Normal Dist)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Mean (%)</label>
                    <input 
                      type="number" step="0.01"
                      value={assumptions.growth_mean}
                      onChange={(e) => setAssumptions({...assumptions, growth_mean: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-bold">Std Dev</label>
                    <input 
                      type="number" step="0.01"
                      value={assumptions.growth_std}
                      onChange={(e) => setAssumptions({...assumptions, growth_std: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-bold">Iterations</label>
                <select 
                  value={assumptions.num_simulations}
                  onChange={(e) => setAssumptions({...assumptions, num_simulations: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                >
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                  <option value={10000}>10,000</option>
                  <option value={50000}>50,000</option>
                </select>
              </div>

              <button 
                onClick={() => onRun({ num_simulations: assumptions.num_simulations, assumptions })}
                disabled={isLoading}
                className="w-full bg-[#F59F01] text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#F59F01]/20 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Run Risk Simulation'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Expected MOIC</p>
                  <p className="text-3xl font-black text-white tracking-tight">{results.statistics.expected_moic}x</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Expected IRR</p>
                  <p className="text-3xl font-black text-[#F59F01] tracking-tight">{results.statistics.expected_irr}%</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest mb-1">Probability of Loss</p>
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle size={18} className="text-rose-500" />
                    <p className="text-3xl font-black text-rose-500 tracking-tight">{results.statistics.prob_loss}%</p>
                  </div>
                </div>
              </div>

              {/* Histogram */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
                 <h4 className="text-xs font-black text-white mb-8 uppercase tracking-widest">Distribution of MOIC Outcomes</h4>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results.histogram}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis 
                          dataKey="bin" 
                          stroke="#ffffff30" 
                          fontSize={10} 
                          tickFormatter={(val) => `${val}x`}
                        />
                        <YAxis stroke="#ffffff30" fontSize={10} hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ fontSize: '10px', fontWeight: '800' }}
                          labelStyle={{ fontSize: '10px', color: '#F59F01', fontWeight: '900' }}
                          labelFormatter={(val) => `Exit Multiple: ${val}x`}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {results.histogram.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.bin < 1.0 ? '#f43f5e' : entry.bin > 2.0 ? '#10b981' : '#F59F01'} 
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Percentiles */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h4 className="text-xs font-black text-white mb-6 uppercase tracking-widest">Confidence Intervals</h4>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(results.statistics.moic_percentiles).map(([p, val]) => (
                    <div key={p} className="text-center">
                      <p className="text-[10px] font-black text-white/20 uppercase mb-1">{p.replace('p', 'P')}</p>
                      <p className="text-sm font-bold text-white">{val}x</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-4">
               <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 border border-white/5">
                 <Percent size={32} />
               </div>
               <div className="max-w-xs">
                 <h4 className="text-white font-bold text-sm">No Simulation Data</h4>
                 <p className="text-white/20 text-xs mt-1">Configure your assumptions and click 'Run Risk Simulation' to generate Monte Carlo results.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-white/30 text-[10px] uppercase font-black mb-1.5 tracking-widest">{label}</p>
      <p className="text-white text-sm font-semibold">{value || '—'}</p>
    </div>
  );
}

function ValuationsTrackingTab({ deal, onRecord, isRecording }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    valuation_date: new Date().toISOString().split('T')[0],
    fair_value_npr: '',
    methodology: 'MARKET',
    notes: '',
    is_audited: false,
    auditor_name: ''
  });

  const investment = deal.investments?.[0];
  const valuations = [...(investment?.valuations || [])].sort((a, b) => new Date(a.valuation_date) - new Date(b.valuation_date));

  const chartData = valuations.map(v => ({
    date: v.valuation_date,
    value: parseFloat(v.fair_value_npr)
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onRecord({ ...formData, investment: investment.id });
    setShowModal(false);
  };

  if (!investment) return <div className="p-10 text-center text-white/20">No investment record found for this project.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white tracking-tight uppercase">Valuation Tracking</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
        >
          Add New Valuation
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
            <YAxis stroke="#ffffff30" fontSize={10} tickFormatter={(val) => (val/10000000).toFixed(1) + 'Cr'} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
              itemStyle={{ fontSize: '10px', fontWeight: '800' }}
              labelStyle={{ fontSize: '10px', color: '#F59F01', fontWeight: '900' }}
              formatter={(val) => [`NPR ${val.toLocaleString()}`, 'Fair Value']}
            />
            <Line type="monotone" dataKey="value" stroke="#F59F01" strokeWidth={3} dot={{ fill: '#F59F01', r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Fair Value (NPR)</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Methodology</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">MoIC</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Change %</th>
              <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...valuations].reverse().map(v => (
              <tr key={v.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-white/60">{new Date(v.valuation_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-xs font-mono text-white">NPR {parseFloat(v.fair_value_npr).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-[#F59F01] uppercase tracking-tighter bg-[#F59F01]/10 px-2 py-1 rounded">
                    {v.methodology_display}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-white text-right">{v.moic_implied?.toFixed(2)}x</td>
                <td className={`px-6 py-4 text-xs font-mono text-right ${v.valuation_change_pct > 0 ? 'text-[#10b981]' : v.valuation_change_pct < 0 ? 'text-rose-500' : 'text-white/20'}`}>
                  {v.valuation_change_pct ? (v.valuation_change_pct > 0 ? '+' : '') + v.valuation_change_pct.toFixed(1) + '%' : '—'}
                </td>
                <td className="px-6 py-4">
                  {v.is_audited ? (
                    <div className="flex items-center gap-1.5 text-[#10b981] text-[9px] font-black uppercase">
                      <CheckCircle2 size={12} /> Audited
                    </div>
                  ) : (
                    <span className="text-white/20 text-[9px] font-black uppercase">Un-audited</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-white font-black text-xl tracking-tight uppercase">Record Fair Value</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Valuation Date</label>
                  <input 
                    type="date" required
                    value={formData.valuation_date}
                    onChange={e => setFormData({...formData, valuation_date: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Fair Value (NPR)</label>
                  <input 
                    type="number" required
                    value={formData.fair_value_npr}
                    onChange={e => setFormData({...formData, fair_value_npr: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-black">Methodology</label>
                <select 
                  value={formData.methodology}
                  onChange={e => setFormData({...formData, methodology: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                >
                  <option value="DCF">Discounted Cash Flow</option>
                  <option value="MARKET">Market Comparables</option>
                  <option value="COST">Cost / Book Value</option>
                  <option value="RECENT_TRANSACTION">Recent Transaction</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-3 py-2">
                 <input 
                   type="checkbox" id="is_audited"
                   checked={formData.is_audited}
                   onChange={e => setFormData({...formData, is_audited: e.target.checked})}
                   className="w-4 h-4 accent-[#F59F01]"
                 />
                 <label htmlFor="is_audited" className="text-xs text-white/60 font-bold">Is this an audited valuation?</label>
              </div>
              {formData.is_audited && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Auditor Name</label>
                  <input 
                    type="text"
                    value={formData.auditor_name}
                    onChange={e => setFormData({...formData, auditor_name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-white/40 text-xs font-black uppercase">Cancel</button>
                <button type="submit" disabled={isRecording} className="flex-1 py-3 bg-[#F59F01] text-black rounded-xl text-xs font-black uppercase shadow-lg shadow-[#F59F01]/20">
                  {isRecording ? 'Recording...' : 'Save Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ExitPlanningTab({ deal, onCreate, onApprove, isCreating }) {
  const [showModal, setShowModal] = useState(false);
  const [ipoReport, setIpoReport] = useState(null);
  const [isLoadingIpo, setIsLoadingIpo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    exit_type: 'TRADE_SALE',
    target_year: 2085,
    expected_exit_value_npr: '',
    exit_multiple: '',
    probability_pct: 50,
    is_base_case: false,
    notes: ''
  });

  const investment = deal.investments?.[0];
  const scenarios = investment?.exit_scenarios || [];

  const runIpoCheck = async () => {
    setIsLoadingIpo(true);
    try {
      const res = await api.get(`/deals/portfolio/investments/${investment.id}/ipo-eligibility/`);
      setIpoReport(res.data);
    } catch (err) {
      toast.error('Failed to run IPO eligibility check');
    } finally {
      setIsLoadingIpo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ ...formData, investment: investment.id });
    setShowModal(false);
  };

  const pieData = scenarios.map(s => ({
    name: s.name,
    value: s.probability_pct
  }));

  const COLORS = ['#F59F01', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];

  if (!investment) return <div className="p-10 text-center text-white/20">No investment record found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white tracking-tight uppercase">Exit Planning & Scenarios</h3>
        <div className="flex gap-4">
           <button 
             onClick={runIpoCheck}
             className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
           >
             {isLoadingIpo ? <Loader2 className="animate-spin" size={14} /> : <TrendingUp size={14} className="inline mr-2" />}
             Check IPO Eligibility
           </button>
           <button 
             onClick={() => setShowModal(true)}
             className="px-6 py-2.5 bg-[#F59F01] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
           >
             Add Exit Scenario
           </button>
        </div>
      </div>

      {ipoReport && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-6 rounded-3xl animate-in zoom-in-95 duration-500">
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-[#10b981] uppercase tracking-widest">IPO Eligibility Report</h4>
              <button onClick={() => setIpoReport(null)} className="text-white/20 hover:text-white"><Zap size={16} /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ipoReport.criteria.map((c, i) => (
                <div key={i} className="bg-black/20 p-4 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-white/40 uppercase font-black mb-1">{c.label}</p>
                   <div className="flex items-center gap-2">
                      {c.passed ? <CheckCircle2 className="text-[#10b981]" size={14} /> : <AlertTriangle className="text-rose-500" size={14} />}
                      <span className="text-xs text-white font-bold">{c.detail}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Scenario</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Target Year</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Exit Value</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Prob. %</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scenarios.map(s => (
                  <tr key={s.id} className={`hover:bg-white/5 transition-colors ${s.is_base_case ? 'bg-[#F59F01]/5' : ''}`}>
                    <td className="px-6 py-4 flex items-center gap-2">
                       {s.is_base_case && <Star size={14} className="text-[#F59F01]" fill="#F59F01" />}
                       <span className="text-xs font-bold text-white">{s.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black text-white/60 uppercase border border-white/10 px-2 py-1 rounded">
                        {s.exit_type_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">{s.target_year} BS</td>
                    <td className="px-6 py-4 text-xs font-mono text-white text-right">NPR {parseFloat(s.expected_exit_value_npr).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-mono text-[#F59F01] text-right">{s.probability_pct}%</td>
                    <td className="px-6 py-4">
                      {s.is_approved_by_ic ? (
                        <span className="text-[#10b981] text-[9px] font-black uppercase">Approved</span>
                      ) : (
                        <button 
                          onClick={() => onApprove(s.id)}
                          className="text-[9px] font-black text-white/20 hover:text-[#F59F01] uppercase tracking-widest"
                        >
                          Pending Approval
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center">
           <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-8">Scenario Probabilities</h4>
           <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '10px', fontWeight: '800' }}
                    />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-2 w-full">
              {scenarios.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-[10px]">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-white/40 font-bold">{s.name}</span>
                   </div>
                   <span className="text-white font-black">{s.probability_pct}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Exit Scenario Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-white font-black text-xl tracking-tight uppercase">New Exit Scenario</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/30 uppercase font-black">Scenario Name</label>
                <input 
                  type="text" required placeholder="e.g. Base Case Trade Sale"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Exit Type</label>
                  <select 
                    value={formData.exit_type}
                    onChange={e => setFormData({...formData, exit_type: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  >
                    <option value="TRADE_SALE">Trade Sale</option>
                    <option value="IPO">IPO (NEPSE)</option>
                    <option value="SECONDARY">Secondary Sale</option>
                    <option value="WRITE_OFF">Write-Off</option>
                    <option value="DIVIDEND_RECAP">Dividend Recap</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Target Year (BS)</label>
                  <input 
                    type="number" required
                    value={formData.target_year}
                    onChange={e => setFormData({...formData, target_year: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Exit Value (NPR)</label>
                  <input 
                    type="number" required
                    value={formData.expected_exit_value_npr}
                    onChange={e => setFormData({...formData, expected_exit_value_npr: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/30 uppercase font-black">Exit Multiple (x)</label>
                  <input 
                    type="number" step="0.1" required
                    value={formData.exit_multiple}
                    onChange={e => setFormData({...formData, exit_multiple: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] text-white/30 uppercase font-black">Probability (%)</label>
                    <input 
                      type="number" min="0" max="100"
                      value={formData.probability_pct}
                      onChange={e => setFormData({...formData, probability_pct: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-[#F59F01]"
                    />
                 </div>
                 <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox" id="is_base_case"
                      checked={formData.is_base_case}
                      onChange={e => setFormData({...formData, is_base_case: e.target.checked})}
                      className="w-4 h-4 accent-[#F59F01]"
                    />
                    <label htmlFor="is_base_case" className="text-xs text-white/60 font-bold">Set as Base Case</label>
                 </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-white/40 text-xs font-black uppercase">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex-1 py-3 bg-[#F59F01] text-black rounded-xl text-xs font-black uppercase shadow-lg shadow-[#F59F01]/20">
                  {isCreating ? 'Creating...' : 'Create Scenario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
