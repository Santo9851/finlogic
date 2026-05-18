'use client'

/**
 * (gp)/deals/[id]/page.jsx
 * Comprehensive GP Deal Management View.
 */
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Building2, 
  CheckCircle2, 
  Loader2,
  Zap,
  X
} from 'lucide-react';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';

// Tab Components
import OverviewTab from '@/components/deals/tabs/OverviewTab';
import DataRoomTab from '@/components/deals/tabs/DataRoomTab';
import FinancialsTab from '@/components/deals/tabs/FinancialsTab';
import CommercialTab from '@/components/deals/tabs/CommercialTab';
import OperationsTab from '@/components/deals/tabs/OperationsTab';
import RedFlagsTab from '@/components/deals/tabs/RedFlagsTab';
import ScoringTab from '@/components/deals/tabs/ScoringTab';
import ModelingTab from '@/components/deals/tabs/ModelingTab';
import ValuationsTab from '@/components/deals/tabs/ValuationsTab';
import ExitPlanningTab from '@/components/deals/tabs/ExitPlanningTab';
import MonteCarloTab from '@/components/deals/tabs/MonteCarloTab';
import MemoTab from '@/components/deals/tabs/MemoTab';
import FormResponsesTab from '@/components/deals/tabs/FormResponsesTab';
import AuditLogTab from '@/components/deals/tabs/AuditLogTab';
import TermSheetTab from '@/components/deals/tabs/TermSheetTab';
import SPADraftTab from '@/components/deals/tabs/SPADraftTab';
import InvestmentWizard from '@/components/deals/InvestmentWizard';

const STATUS_ORDER = [
  'PENDING_SUBMISSION',
  'SUBMITTED',
  'SCREENING',
  'IC_REVIEW',
  'TERM_SHEET',
  'LOI_ISSUED',
  'CONTRACT_SIGNED',
  'CAPITAL_CALLED',
  'CLOSED',
  'DECLINED'
];

const TABS_CONFIG = [
  { id: 'Overview', label: 'Overview', minStatus: 'PENDING_SUBMISSION' },
  { id: 'Data Room', label: 'Data Room', minStatus: 'PENDING_SUBMISSION' },
  { id: 'Financials', label: 'Financials', minStatus: 'SCREENING' },
  { id: 'Commercial', label: 'Commercial', minStatus: 'SCREENING' },
  { id: 'Operations', label: 'Operations', minStatus: 'SCREENING' },
  { id: 'Red Flags', label: 'Red Flags', minStatus: 'SCREENING' },
  { id: 'Scoring', label: 'Scoring', minStatus: 'SCREENING' },
  { id: 'Modelling', label: 'Modelling', minStatus: 'IC_REVIEW' },
  { id: 'Memo', label: 'Memo', minStatus: 'IC_REVIEW' },
  { id: 'Term Sheet', label: 'Term Sheet', minStatus: 'TERM_SHEET' },
  { id: 'SPA Draft', label: 'SPA Draft', minStatus: 'LOI_ISSUED' },
  { id: 'Valuations', label: 'Valuations', minStatus: 'CLOSED' },
  { id: 'Exit Planning', label: 'Exit Planning', minStatus: 'CLOSED' },
  { id: 'Monte Carlo', label: 'Monte Carlo', minStatus: 'CLOSED' },
  { id: 'Form Responses', label: 'Form Responses', minStatus: 'PENDING_SUBMISSION' },
  { id: 'Audit Log', label: 'Audit Log', minStatus: 'PENDING_SUBMISSION' },
];

export default function GPDealDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Overview');
  const [splitViewDoc, setSplitViewDoc] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  // 1. Fetch Deal Data
  const { data: deal, isLoading, isError, error } = useQuery({
    queryKey: ['deals', 'project', id],
    queryFn: async () => {
      const res = await api.get(`/deals/projects/${id}/`);
      return res.data;
    },
    // Poll every 3s if there are active AI tasks (processing or pending)
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      const p = query.state.data?.analysis_progress;
      if (!p) return false;
      const hasActive = Object.values(p).some(s => s === 'processing' || s === 'pending');
      return hasActive ? 3000 : false;
    }
  });

  const visibleTabs = TABS_CONFIG.filter(tab => {
    if (!deal) return false;

    // Special Visibility Rule for SPA Draft:
    // 1. Must not show in TERM_SHEET stage or earlier.
    // 2. In LOI_ISSUED stage, only show IF the signed LOI has been uploaded.
    // 3. Show in CONTRACT_SIGNED or later stages regardless.
    if (tab.id === 'SPA Draft') {
      const currentIdx = STATUS_ORDER.indexOf(deal.status);
      const loiIssuedIdx = STATUS_ORDER.indexOf('LOI_ISSUED');
      const contractSignedIdx = STATUS_ORDER.indexOf('CONTRACT_SIGNED');
      
      if (currentIdx < loiIssuedIdx) return false;
      if (currentIdx === loiIssuedIdx) {
        return deal.documents?.some(d => d.category === 'LOI_SIGNED');
      }
      return currentIdx >= contractSignedIdx;
    }

    const currentIdx = STATUS_ORDER.indexOf(deal.status);
    const minIdx = STATUS_ORDER.indexOf(tab.minStatus);
    return currentIdx >= minIdx;
  });

  const findDocUrlById = (docId) => {
    // Some red flags have document ID, some have the document object
    const idToFind = typeof docId === 'object' ? docId.id : docId;
    const doc = deal?.documents?.find(d => d.id === idToFind);
    return doc?.file_key || null;
  };

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

  const handleViewDocument = async (fileKey, forceOpen = false) => {
    try {
      const res = await api.get(`/deals/documents/download-url/?key=${encodeURIComponent(fileKey)}`);
      let fileUrl = res.data.url;
      
      // If it's a local streaming URL, we must fetch it via api (axios) 
      // to include the Bearer token, otherwise the iframe/new tab will get a 401.
      if (fileUrl.includes('/serve/')) {
        const fileResponse = await api.get(fileUrl, { responseType: 'blob' });
        fileUrl = URL.createObjectURL(fileResponse.data);
      }

      if (forceOpen) {
        window.open(fileUrl, '_blank');
      } else {
        setSplitViewDoc(fileUrl);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not generate document link');
    }
  };

  const extractMutation = useMutation({
    mutationFn: async (document_id) => {
      const res = await api.post(`/deals/projects/${id}/extract-financials/`, { document_id });
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            Extraction: 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('Financial extraction task triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, variables, context) => {
      toast.error(err.response?.data?.detail || 'Extraction failed');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
    }
  });

  const qoeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/deals/projects/${id}/qoe-analysis/?trigger=true`);
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            QoE: 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('QoE analysis task triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, variables, context) => {
      toast.error(err.response?.data?.detail || 'QoE analysis failed');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
    }
  });

  const updateQoEMutation = useMutation({
    mutationFn: ({ reportId, data }) => api.patch(`/deals/projects/${id}/qoe-analysis/${reportId}/`, data),
    onSuccess: () => {
      toast.success('QoE report updated');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: () => toast.error('Failed to update QoE report')
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ finId, data }) => {
      const res = await api.patch(`/deals/projects/${id}/extracted-financials/${finId}/verify/`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Financial entry verified');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const updateFinancialMutation = useMutation({
    mutationFn: async ({ finId, data }) => {
      const res = await api.patch(`/deals/projects/${id}/extracted-financials/${finId}/`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Financial data updated');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const commercialMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deals/projects/${id}/run-commercial-analysis/`);
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            Commercial: 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('Commercial analysis triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, variables, context) => {
      toast.error(err.response?.data?.detail || 'Commercial analysis failed');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
    }
  });

  const runOperationalAnalysisMutation = useMutation({
    mutationFn: (manual_context) => 
      api.post(`/deals/projects/${id}/run-operational-analysis/`, { manual_context }),
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries(['deals', 'project', id]);
      // Snapshot the previous value
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      // Optimistically update to "processing"
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            Operational: 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('Operational analysis task triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, context) => {
      toast.error('Task trigger failed');
      // Rollback on error
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
    }
  });

  const legalScanMutation = useMutation({
    mutationFn: (docId) => api.post(`/deals/projects/${id}/documents/${docId}/scan-legal/`),
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            "Legal Scan": 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('Legal AI scan triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, context) => {
      toast.error('Scan trigger failed');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
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
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            "Extraction": "processing",
            "QoE": "processing",
            "Commercial": "processing",
            "Operational": "processing",
            "Compliance": "processing",
            "Legal Scan": "processing",
            "Scoring": "processing",
            "Memo": "processing"
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('Complete AI pipeline triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, context) => {
      toast.error('Pipeline trigger failed');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
    }
  });


  const triggerScoringMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/deals/projects/${id}/trigger-scoring/`);
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            Scoring: 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('FINLO scoring engine triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, context) => {
      toast.error('Scoring trigger failed');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
    }
  });

  const deleteFinancialMutation = useMutation({
    mutationFn: (finId) => api.delete(`/deals/projects/${id}/extracted-financials/${finId}/`),
    onSuccess: () => {
      toast.success('Financial record deleted');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: () => toast.error('Failed to delete record')
  });

  const createFinancialMutation = useMutation({
    mutationFn: (data) => api.post(`/deals/projects/${id}/extracted-financials/`, data),
    onSuccess: () => {
      toast.success('New financial record created');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create record')
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

  const resetGateMutation = useMutation({
    mutationFn: async ({ gateId }) => {
      const res = await api.post(`/deals/projects/${id}/scoring/gates/${gateId}/reset/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Compliance gate reset to pending');
      queryClient.invalidateQueries(['deals', 'project', id]);
    }
  });

  const finalApproveMutation = useMutation({
    mutationFn: async ({ assessment_summary }) => {
      // Use the canonical PATCH detail view to advance status
      const res = await api.patch(`/deals/projects/${id}/`, { 
        status: 'IC_REVIEW',
        assessment_summary // Optionally saved if field exists
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Deal approved for IC Review');
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
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            Memo: 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('AI memo drafting triggered');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, context) => {
      toast.error(err.response?.data?.detail || 'Failed to start AI memo');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
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

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId) => api.delete(`/deals/documents/${docId}/`),
    onSuccess: () => {
      toast.success('Document removed from Data Room');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete document')
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
  const generateAIValuationMutation = useMutation({
    mutationFn: () => api.post(`/deals/projects/${id}/generate-ai-valuation/`),
    onMutate: async () => {
      await queryClient.cancelQueries(['deals', 'project', id]);
      const previousDeal = queryClient.getQueryData(['deals', 'project', id]);
      if (previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], {
          ...previousDeal,
          analysis_progress: {
            ...(previousDeal.analysis_progress || {}),
            Valuation: 'processing'
          }
        });
      }
      return { previousDeal };
    },
    onSuccess: () => {
      toast.success('AI Valuation generation started');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err, context) => {
      toast.error(err.response?.data?.detail || 'Failed to start AI valuation');
      if (context?.previousDeal) {
        queryClient.setQueryData(['deals', 'project', id], context.previousDeal);
      }
    }
  });

  const uploadSignedMemoMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/deals/projects/${id}/upload-signed-ic-memo/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      toast.success('Signed IC Memo uploaded. Deal advanced to Term Sheet stage.');
      queryClient.invalidateQueries(['deals', 'project', id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to upload signed memo')
  });





  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 theme-transition">
      <Loader2 className="w-8 h-8 text-ls-compliment animate-spin" />
      <p className="text-text-muted text-sm animate-pulse font-bold uppercase tracking-widest">Loading detailed deal flow...</p>
    </div>
  );

  if (isError && error?.response?.status === 403) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500 theme-transition">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-xl">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Access Restricted</h2>
          <p className="text-text-muted max-w-sm mx-auto text-sm leading-relaxed font-medium">
            You do not have permission to view the details of this deal. If you need access, please contact your Superadmin to be added as a collaborator.
          </p>
        </div>
        <Link href="/gp/deals" className="px-6 py-2.5 bg-card border border-border-theme hover:bg-foreground/5 rounded-xl text-text-muted hover:text-foreground transition-all text-xs font-black uppercase tracking-widest mt-4">
          Return to Pipeline
        </Link>
      </div>
    );
  }

  if (isError || !deal) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 theme-transition">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-xl">
        <Building2 className="w-8 h-8" />
      </div>
      <h2 className="text-foreground font-black text-xl uppercase tracking-widest">Deal Not Found</h2>
      <Link href="/gp/deals" className="text-ls-compliment hover:underline text-xs font-black uppercase tracking-widest">Return to Pipeline</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-8 lg:p-12 font-sans theme-transition">

      
      {/* Split View Overlay */}
      {splitViewDoc && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 flex">
          <div className="w-1/2 h-full border-r border-white/10 relative">
            <iframe src={splitViewDoc} className="w-full h-full" title="Document Viewer" />
            <button 
              onClick={() => setSplitViewDoc(null)}
              className="absolute top-6 left-6 p-4 bg-black/60 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all hover:scale-110"
            >
              <X size={24} />
            </button>
          </div>
          <div className="w-1/2 h-full overflow-y-auto p-12 relative">
             <div className="max-w-4xl mx-auto">
                <button 
                  onClick={() => setSplitViewDoc(null)}
                  className="absolute top-6 right-6 p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all"
                >
                  Close Analysis Mode
                </button>
                <div className="mt-12">
                   {activeTab === 'Financials' && (
                     <FinancialsTab 
                       deal={deal}
                       onRunQoE={() => qoeMutation.mutate()}
                       isRunningQoE={qoeMutation.isLoading}
                       onVerify={(finId, data) => verifyMutation.mutate({ finId, data })}
                       onUpdate={(finId, data) => updateFinancialMutation.mutate({ finId, data })}
                       onUpdateQoE={(reportId, data) => updateQoEMutation.mutate({ reportId, data })}
                       onCreate={(data) => createFinancialMutation.mutate(data)}
                       onDelete={(finId) => deleteFinancialMutation.mutate(finId)}
                       onViewSource={(docId) => {
                         const key = findDocUrlById(docId);
                         if (key) handleViewDocument(key);
                       }}
                       fullAnalysisMutation={fullAnalysisMutation}
                       isSplitView={true}
                     />
                   )}
                   {activeTab === 'Red Flags' && (
                     <RedFlagsTab 
                       deal={deal} 
                       onReview={(id) => reviewRedFlagMutation.mutate(id)}
                       onViewSource={(docId) => {
                         const key = findDocUrlById(docId);
                         if (key) handleViewDocument(key);
                       }}
                       isSplitView={true}
                     />
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className={`max-w-[1600px] mx-auto space-y-12 transition-all duration-700 ${splitViewDoc ? 'blur-2xl scale-95 opacity-0' : 'opacity-100'}`}>
      
      {/* Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/gp/deals" className="flex items-center gap-1.5 text-text-muted hover:text-ls-compliment text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft size={16} /> Back to Pipeline
        </Link>
        <div className="flex items-center gap-2">
           {['TERM_SHEET', 'LOI_ISSUED'].includes(deal.status) && (
             <button 
               onClick={() => setShowWizard(true)}
               className="flex items-center gap-2 px-6 py-2 bg-foreground text-background rounded-lg text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-foreground/5"
             >
               <Zap size={14} /> Close Deal
             </button>
           )}
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-card border border-border-theme rounded-3xl p-8 shadow-2xl relative overflow-hidden theme-transition">
        <div className="absolute top-0 right-0 p-8">
           <StatusBadge status={deal.status} />
        </div>
        <div className="relative z-10 flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment border border-ls-compliment/20 shadow-lg">
             <Building2 size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">{deal.legal_name}</h1>
            <div className="flex items-center gap-4 mt-2 text-text-muted text-sm font-medium">
              <span className="flex items-center gap-1.5"><Building2 size={14}/> {deal.sector}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border-theme" />
              <span>OCR: {deal.ocr_registration_number}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border-theme" />
              <span className="text-ls-compliment font-black uppercase tracking-tighter">{deal.deal_type_display}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-card border border-border-theme rounded-2xl w-fit theme-transition">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === t.id
                ? 'bg-ls-compliment text-ls-primary-fixed shadow-lg shadow-ls-compliment/20'
                : 'text-text-muted hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="mt-8 bg-card border border-border-theme rounded-[40px] p-8 shadow-2xl backdrop-blur-2xl theme-transition">
        {activeTab === 'Overview' && <OverviewTab deal={deal} />}

        {activeTab === 'Data Room' && (
          <DataRoomTab 
            deal={deal}
            onView={handleViewDocument}
            onExtract={(docId) => extractMutation.mutate(docId)}
            isExtracting={extractMutation.isLoading}
            onRedFlagScan={(docId) => legalScanMutation.mutate(docId)}
            onRefresh={() => queryClient.invalidateQueries(['deals', 'project', id])}
            onDelete={(docId) => deleteDocumentMutation.mutate(docId)}
          />
        )}

        {activeTab === 'Financials' && (
          <FinancialsTab 
            deal={deal}
            onRunQoE={() => qoeMutation.mutate()}
            isRunningQoE={qoeMutation.isLoading}
            onVerify={(finId, data) => verifyMutation.mutate({ finId, data })}
            onUpdate={(finId, data) => updateFinancialMutation.mutate({ finId, data })}
            onUpdateQoE={(reportId, data) => updateQoEMutation.mutate({ reportId, data })}
            onCreate={(data) => createFinancialMutation.mutate(data)}
            onDelete={(finId) => deleteFinancialMutation.mutate(finId)}
            onViewSource={(docId) => {
              const key = findDocUrlById(docId);
              if (key) handleViewDocument(key);
            }}
            fullAnalysisMutation={fullAnalysisMutation}
          />
        )}

        {activeTab === 'Commercial' && (
          <CommercialTab 
            deal={deal} 
            onRun={() => commercialMutation.mutate()}
            isLoading={commercialMutation.isLoading}
          />
        )}

        {activeTab === 'Operations' && (
          <OperationsTab 
            deal={deal} 
            onRun={(context) => runOperationalAnalysisMutation.mutate(context)}
            isLoading={runOperationalAnalysisMutation.isLoading}
          />
        )}

        {activeTab === 'Red Flags' && (
          <RedFlagsTab 
            deal={deal} 
            onReview={(id) => reviewRedFlagMutation.mutate(id)}
            onViewSource={(docId) => {
              const key = findDocUrlById(docId);
              if (key) handleViewDocument(key);
            }}
          />
        )}

        {activeTab === 'Scoring' && (
          <ScoringTab 
            deal={deal}
            onTrigger={() => triggerScoringMutation.mutate()}
            isTriggering={triggerScoringMutation.isLoading}
            onOverride={(data) => overrideScoreMutation.mutate(data)}
            onClearGate={(data) => clearGateMutation.mutate(data)}
            onResetGate={(data) => resetGateMutation.mutate(data)}
            onApprove={(data) => finalApproveMutation.mutate(data)}
            isApproving={finalApproveMutation.isLoading}
          />
        )}

        {activeTab === 'Modelling' && (
          <ModelingTab 
            deal={deal} 
            onRunDCF={dcfMutation.mutate}
            onRunLBO={lboMutation.mutate}
            isCalculating={dcfMutation.isLoading || lboMutation.isLoading}
            onGenerateAI={() => generateAIValuationMutation.mutate()}
            isGeneratingAI={generateAIValuationMutation.isLoading}
          />
        )}

        {activeTab === 'Valuations' && (
          <ValuationsTab 
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
            onGenerate={() => generateMemoMutation.mutate()}
            onSave={(data) => saveMemoMutation.mutate(data)}
            onFinalize={(id) => finalizeMemoMutation.mutate(id)}
            onUploadSignedMemo={(file) => uploadSignedMemoMutation.mutate(file)}
            isGenerating={generateMemoMutation.isLoading}
            isUploading={uploadSignedMemoMutation.isLoading}
          />
        )}

        {activeTab === 'Form Responses' && (
          <FormResponsesTab responses={deal.form_responses} />
        )}

        {activeTab === 'Term Sheet' && (
          <TermSheetTab deal={deal} />
        )}

        {activeTab === 'SPA Draft' && (
          <SPADraftTab deal={deal} />
        )}

        {activeTab === 'Audit Log' && (
          <AuditLogTab events={deal.audit_events} />
        )}


      </div>

      {showWizard && (
        <InvestmentWizard 
          deal={deal} 
          onClose={() => setShowWizard(false)} 
          onRefresh={() => queryClient.invalidateQueries(['deals', 'project', id])}
        />
      )}
    </div>
  </div>
);
}
