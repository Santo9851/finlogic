'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ChevronRight,
  Send,
  X,
  Database,
  User,
  ExternalLink,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function SuperAdminCompliancePage() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Hub</h1>
          <p className="text-white/40 text-sm">SEBON Filing deadlines, regulatory checklists, and COI register.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'calendar' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          Filing Calendar
        </button>
        <button 
          onClick={() => setActiveTab('checklists')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'checklists' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          Checklist Matrix
        </button>
        <button 
          onClick={() => setActiveTab('conflicts')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'conflicts' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
        >
          Conflict of Interest
        </button>
      </div>

      {activeTab === 'calendar' && <FilingCalendar />}
      {activeTab === 'checklists' && <ChecklistMatrix />}
      {activeTab === 'conflicts' && <ConflictRegister />}
    </div>
  );
}

function FilingCalendar() {
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const queryClient = useQueryClient();

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'sebon-deadlines'],
    queryFn: async () => {
      const res = await api.get('/superadmin/sebon-deadlines/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  const { data: funds = [] } = useQuery({
    queryKey: ['superadmin', 'funds'],
    queryFn: async () => {
      const res = await api.get('/superadmin/funds/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  const generateMutation = useMutation({
    mutationFn: (fundId) => api.post('/superadmin/sebon-deadlines/generate-for-fund/', { fund_id: fundId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['superadmin', 'sebon-deadlines']);
      toast.success(res.data.detail);
    }
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, document_id }) => api.post(`/superadmin/sebon-deadlines/${id}/submit/`, { document_id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'sebon-deadlines']);
      toast.success('Filing marked as submitted');
      setSelectedDeadline(null);
    }
  });

  if (isLoading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 mb-2">
        <div>
          <h4 className="text-white font-bold text-sm">Filing Automation</h4>
          <p className="text-[10px] text-white/40 uppercase tracking-tighter">Generate standard SEBON deadlines for active funds.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-[#0a0014] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500/40 transition-all"
            onChange={(e) => {
              if (e.target.value) generateMutation.mutate(e.target.value);
            }}
            defaultValue=""
          >
            <option value="" disabled>Select Fund to Populate...</option>
            {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deadlines List */}
        <div className="md:col-span-2 space-y-4">
          {deadlines.length > 0 ? (
            deadlines.map(deadline => (
              <div 
                key={deadline.id}
                onClick={() => setSelectedDeadline(deadline)}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-500/40 cursor-pointer transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 
                  ${deadline.rag_status === 'red' ? 'bg-red-500/20 text-red-400' : 
                    deadline.rag_status === 'amber' ? 'bg-amber-500/20 text-amber-400' : 
                    deadline.rag_status === 'grey' ? 'bg-white/10 text-white/40' : 'bg-emerald-500/20 text-emerald-400'}`}
                >
                  <CalendarIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors">{deadline.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40 font-mono">
                    <span>{deadline.fund_name || 'System-Wide'}</span>
                    <span>•</span>
                    <span>Due: {deadline.due_date}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest 
                    ${deadline.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400' : 
                      deadline.status === 'SUBMITTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                    {deadline.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 bg-white/5 border border-dashed border-white/10 rounded-2xl">
              <CalendarIcon size={32} className="text-white/10" />
              <p className="text-white/20 text-sm italic">No filing deadlines scheduled.</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit sticky top-6">
          {selectedDeadline ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Filing Details</h2>
                <button onClick={() => setSelectedDeadline(null)} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Type</p>
                  <p className="text-sm text-purple-400 font-bold">{selectedDeadline.filing_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Regulatory Basis</p>
                  <p className="text-sm text-white/60 italic leading-relaxed">"{selectedDeadline.regulatory_basis || 'Standard SEBON Guidelines'}"</p>
                </div>
                {selectedDeadline.penalty_note && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
                    <p className="font-bold flex items-center gap-2 mb-1"><AlertCircle size={14} /> Penalty for Non-Compliance</p>
                    {selectedDeadline.penalty_note}
                  </div>
                )}
              </div>

              {selectedDeadline.status !== 'SUBMITTED' && (
                <button 
                  onClick={() => submitMutation.mutate({ id: selectedDeadline.id })}
                  disabled={submitMutation.isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                >
                  {submitMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Mark as Submitted
                </button>
              )}

              {selectedDeadline.status === 'SUBMITTED' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-xs">
                  <p className="font-bold flex items-center gap-2 mb-1"><CheckCircle2 size={14} /> Completed</p>
                  Submitted on {new Date(selectedDeadline.submitted_at).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                <FileText size={24} />
              </div>
              <p className="text-white/20 text-sm italic">Select a deadline to view<br />regulatory requirements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChecklistMatrix() {
  const queryClient = useQueryClient();
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'checklists'],
    queryFn: async () => {
      const res = await api.get('/superadmin/regulatory-checklists/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post('/superadmin/regulatory-checklists/sync-projects/'),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['superadmin', 'checklists']);
      toast.success(res.data.detail);
    }
  });

  if (isLoading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
        <div>
          <h4 className="text-white font-bold text-sm">Checklist Matrix Sync</h4>
          <p className="text-[10px] text-white/40 uppercase tracking-tighter">Initialize compliance tracking for all existing deal pipeline entries.</p>
        </div>
        <button 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isLoading}
          className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-[10px] font-bold px-4 py-2 rounded-lg border border-purple-500/20 transition-all uppercase tracking-widest flex items-center gap-2"
        >
          {syncMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
          Sync Projects
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Project / Deal</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-center">FITTA</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-center">NRB</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-center">SEBON</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-center">Licensing</th>
                <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-right">Last Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {checklists.length > 0 ? (
                checklists.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-purple-600/40 rounded-full" />
                        <div>
                          <p className="text-white font-bold text-sm leading-tight">{item.project_name || 'Deal ID: ' + item.project?.substring(0, 8)}</p>
                          <p className="text-white/30 text-[10px] uppercase font-mono mt-0.5">Project ID: {item.project?.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.fitta_approval_obtained ? <CheckCircle2 size={18} className="text-emerald-500 mx-auto" /> : <Clock size={18} className="text-amber-500 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.nrb_approval_obtained ? <CheckCircle2 size={18} className="text-emerald-500 mx-auto" /> : <Clock size={18} className="text-amber-500 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.sebon_reporting_compliant ? <CheckCircle2 size={18} className="text-emerald-500 mx-auto" /> : <AlertCircle size={18} className="text-red-500 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.industry_specific_license_obtained ? <CheckCircle2 size={18} className="text-emerald-500 mx-auto" /> : <X size={18} className="text-white/20 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-white/40 text-[10px] font-mono">{item.last_reviewed_at ? new Date(item.last_reviewed_at).toLocaleDateString() : 'Never'}</p>
                      <p className="text-[10px] text-purple-400 uppercase font-bold tracking-tighter">GP Review Pending</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-white/20 italic">
                    No regulatory checklists generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConflictRegister() {
  const { data: conflicts = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'conflicts'],
    queryFn: async () => {
      const res = await api.get('/superadmin/conflicts-of-interest/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  const queryClient = useQueryClient();
  const remindMutation = useMutation({
    mutationFn: (id) => api.post(`/superadmin/conflicts-of-interest/${id}/remind/`),
    onSuccess: () => toast.success('Reminder email sent to declarant')
  });

  if (isLoading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Declarant</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Period</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Nature of Conflict</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {conflicts.length > 0 ? (
              conflicts.map(coi => (
                <tr key={coi.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{coi.declarant_detail?.email}</p>
                        <p className="text-white/20 text-[10px] uppercase font-bold tracking-tighter">Internal Staff / LP</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white/60 font-mono text-xs">{coi.declaration_period}</span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-white/40 text-xs line-clamp-2 italic">"{coi.nature_of_conflict}"</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest 
                      ${coi.is_submitted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {coi.is_submitted ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!coi.is_submitted && (
                      <button 
                        onClick={() => remindMutation.mutate(coi.id)}
                        className="p-2 text-white/20 hover:text-purple-400 transition-all hover:bg-purple-500/10 rounded-lg"
                        title="Send Reminder"
                      >
                        <Send size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-white/20 italic">
                  No conflict of interest declarations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
