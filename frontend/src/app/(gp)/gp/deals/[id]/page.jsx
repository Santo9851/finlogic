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
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import { toast } from 'sonner';
import FileUploader from '@/components/portal/FileUploader';

const TABS = ['Overview', 'Data Room', 'Financials', 'Form Responses', 'Audit Log'];

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
             onClick={() => toast.info("AI Analysis triggered...")}
             className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-bold hover:bg-white/10 transition-all"
           >
             <BrainCircuit size={14} className="text-[#F59F01]" /> Run AI Analysis
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
        {activeTab === 'Financials' && <FinancialsTab deal={deal} />}
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
                        <button 
                          onClick={() => onView(doc.file_key)}
                          className="text-white/20 hover:text-[#F59F01] transition-colors"
                        >
                           <ExternalLink size={16} />
                        </button>
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

function FinancialsTab({ deal }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4">
      <BarChart4 size={48} className="mx-auto text-white/10" />
      <div>
        <h3 className="text-white font-bold">Financial Extraction Engine</h3>
        <p className="text-white/40 text-sm max-w-md mx-auto mt-2">
          Once financials are uploaded to the Data Room, Finlogic's AI will automatically extract Income Statements and Balance Sheets for review.
        </p>
      </div>
      <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-6 py-2 rounded-lg transition-all mt-4">
        Request Latest Financials
      </button>
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

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-white/30 text-[10px] uppercase font-black mb-1.5 tracking-widest">{label}</p>
      <p className="text-white text-sm font-semibold">{value || '—'}</p>
    </div>
  );
}
