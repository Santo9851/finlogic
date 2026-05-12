'use client'

/**
 * (superadmin)/compliance/page.jsx
 * Compliance Hub for Superadmins: SEBON Filing, Checklists, and COI Register.
 */
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
  Loader2,
  Lock,
  Building2,
  CalendarCheck2,
  ShieldAlert
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export default function SuperAdminCompliancePage() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="space-y-8 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Compliance Command</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">SEBON Filing Oversight, Regulatory Checklists & COI Register</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-foreground/[0.03] p-1.5 rounded-[1.5rem] w-fit border border-border-theme shadow-inner">
        {[
          { id: 'calendar', label: 'Filing Calendar', icon: CalendarIcon },
          { id: 'checklists', label: 'Checklist Matrix', icon: Database },
          { id: 'conflicts', label: 'Conflict Register', icon: ShieldAlert },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20' : 'text-text-muted hover:text-foreground'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'calendar' && <FilingCalendar />}
        {activeTab === 'checklists' && <ChecklistMatrix />}
        {activeTab === 'conflicts' && <ConflictRegister />}
      </div>
    </div>
  );
}

function FilingCalendar() {
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  if (isLoading) return (
    <div className="h-[40vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Regulatory Timeline...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Automation Control */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 theme-transition overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <CalendarCheck2 size={24} />
          </div>
          <div>
            <h4 className="text-foreground font-black uppercase tracking-widest text-sm">Filing Intelligence</h4>
            <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1 opacity-60">Generate institutional SEBON deadlines for fund vehicles</p>
          </div>
        </div>
        <div className="relative group min-w-[300px] relative z-10">
          <select 
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-[10px] font-black uppercase tracking-widest focus:border-purple-500/40 outline-none appearance-none pr-12 shadow-inner transition-all"
            onChange={(e) => {
              if (e.target.value) generateMutation.mutate(e.target.value);
            }}
            defaultValue=""
          >
            <option value="" disabled className="bg-background">Authorize Fund for Population...</option>
            {funds.map(f => <option key={f.id} value={f.id} className="bg-background">{f.name}</option>)}
          </select>
          <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/20 rotate-90" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Deadlines Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {deadlines.length > 0 ? (
            deadlines.map(deadline => (
              <div 
                key={deadline.id}
                onClick={() => setSelectedDeadline(deadline)}
                className={`bg-card border border-border-theme rounded-[2rem] p-8 flex items-center gap-6 hover:bg-foreground/[0.01] cursor-pointer transition-all group shadow-xl relative overflow-hidden theme-transition ${selectedDeadline?.id === deadline.id ? 'ring-2 ring-purple-500/40 border-purple-500/40' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform 
                  ${deadline.rag_status === 'red' ? 'bg-rose-500/10 text-rose-500 shadow-rose-500/20' : 
                    deadline.rag_status === 'amber' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/20' : 
                    deadline.rag_status === 'grey' ? 'bg-foreground/5 text-text-muted/20 shadow-inner' : 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20'}`}
                >
                  <CalendarIcon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-black text-sm uppercase tracking-tight group-hover:text-purple-500 transition-colors leading-tight">{deadline.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-[9px] text-text-muted font-black uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-2"><Building2 size={12} className="opacity-30" /> {deadline.fund_name || 'System Protocol'}</span>
                    <span className="flex items-center gap-2"><Clock size={12} className="opacity-30" /> Due: {deadline.due_date}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-inner border
                    ${deadline.status === 'OVERDUE' ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' : 
                      deadline.status === 'SUBMITTED' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-foreground/5 text-text-muted/40 border-border-theme'}`}>
                    {deadline.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center gap-6 bg-card border-2 border-dashed border-border-theme rounded-[3rem] theme-transition">
              <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center border border-border-theme shadow-inner">
                <CalendarIcon size={40} className="text-text-muted/10" />
              </div>
              <div className="space-y-2">
                <p className="text-text-muted font-black uppercase tracking-widest text-xs">Timeline Depleted</p>
                <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em]">Authorize fund Vehicles to populate regulatory filing protocols</p>
              </div>
            </div>
          )}
        </div>

        {/* Intelligence Panel */}
        <div className="bg-card border border-border-theme rounded-[3rem] p-10 h-fit sticky top-10 shadow-2xl theme-transition overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          {selectedDeadline ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
                  <FileText size={24} />
                </div>
                <button onClick={() => setSelectedDeadline(null)} className="p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95 shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] ml-1">Filing Specification</p>
                  <p className="text-lg font-black text-foreground leading-tight uppercase tracking-tight">{selectedDeadline.title}</p>
                  <p className="text-xs font-black text-purple-500 uppercase tracking-widest">{selectedDeadline.filing_type}</p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] ml-1">Regulatory Basis</p>
                  <div className="bg-foreground/[0.03] border border-border-theme rounded-2xl p-6 shadow-inner">
                    <p className="text-xs text-text-muted leading-relaxed font-medium">"{selectedDeadline.regulatory_basis || 'Standard institutional SEBON Guidelines apply for this reporting window.'}"</p>
                  </div>
                </div>

                {selectedDeadline.penalty_note && (
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 shadow-xl text-rose-500">
                    <p className="font-black flex items-center gap-3 mb-3 text-[10px] uppercase tracking-widest"><AlertCircle size={16} /> Non-Compliance Protocol</p>
                    <p className="text-xs font-medium leading-relaxed opacity-90">{selectedDeadline.penalty_note}</p>
                  </div>
                )}
              </div>

              {selectedDeadline.status !== 'SUBMITTED' && (
                <button 
                  onClick={() => submitMutation.mutate({ id: selectedDeadline.id })}
                  disabled={submitMutation.isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-purple-500/20 active:scale-95 text-[10px] uppercase tracking-widest"
                >
                  {submitMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Mark as Submitted
                </button>
              )}

              {selectedDeadline.status === 'SUBMITTED' && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[1.5rem] p-6 text-emerald-500 shadow-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-black text-[10px] uppercase tracking-widest">Protocol Compliant</p>
                    <p className="text-[9px] font-mono opacity-80 mt-1 uppercase tracking-widest">Executed: {new Date(selectedDeadline.submitted_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[25rem] flex flex-col items-center justify-center text-center gap-8 relative z-10">
              <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center border border-border-theme shadow-inner animate-pulse">
                <Lock size={40} className="text-text-muted/10" />
              </div>
              <div className="space-y-3">
                <p className="text-text-muted font-black uppercase tracking-widest text-[10px]">Restricted Context</p>
                <p className="text-text-muted/20 text-[9px] uppercase font-black tracking-[0.3em] max-w-[15rem]">Select a specific filing record to decrypt regulatory requirements and non-compliance protocols</p>
              </div>
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

  if (isLoading) return (
    <div className="h-[40vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Checklist Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Matrix Controls */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 theme-transition overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <Database size={24} />
          </div>
          <div>
            <h4 className="text-foreground font-black uppercase tracking-widest text-sm">Matrix Synchronization</h4>
            <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1 opacity-60">Initialize compliance tracking for new pipeline entries</p>
          </div>
        </div>
        <button 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 relative z-10"
        >
          {syncMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
          Synchronize Deals
        </button>
      </div>

      {/* Checklist Grid/Table */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Transaction Specification</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-center">FITTA Registry</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-center">NRB Approval</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-center">SEBON Filing</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-center">Sector Licensing</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Last Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {checklists.length > 0 ? (
                checklists.map(item => (
                  <tr key={item.id} className="hover:bg-foreground/[0.01] transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 bg-purple-600 rounded-full shadow-lg shadow-purple-600/30" />
                        <div>
                          <p className="text-foreground font-black text-sm uppercase tracking-tight group-hover:text-purple-500 transition-all">{item.project_name || 'Protocol-8231'}</p>
                          <p className="text-text-muted/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1 font-mono">NODE_ID: {item.project?.substring(0, 12)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <div className="flex items-center justify-center">
                        {item.fitta_approval_obtained ? <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner"><ShieldCheck size={18} /></div> : <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner"><Clock size={18} /></div>}
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <div className="flex items-center justify-center">
                        {item.nrb_approval_obtained ? <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner"><ShieldCheck size={18} /></div> : <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner"><Clock size={18} /></div>}
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <div className="flex items-center justify-center">
                        {item.sebon_reporting_compliant ? <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner"><ShieldCheck size={18} /></div> : <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner"><ShieldAlert size={18} /></div>}
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <div className="flex items-center justify-center">
                        {item.industry_specific_license_obtained ? <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner"><ShieldCheck size={18} /></div> : <div className="w-8 h-8 rounded-xl bg-foreground/5 text-text-muted/20 flex items-center justify-center shadow-inner"><X size={18} /></div>}
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <p className="text-text-muted font-mono text-[10px] tracking-widest uppercase">{item.last_reviewed_at ? new Date(item.last_reviewed_at).toLocaleDateString() : 'Initial Audit'}</p>
                      <p className="text-[9px] text-purple-500 font-black uppercase tracking-[0.2em] mt-1">Status: Operational</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner">
                      <Database className="text-text-muted/10" size={40} />
                    </div>
                    <p className="text-text-muted font-black uppercase tracking-widest text-xs">Checklist Matrix Inactive</p>
                    <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Execute global synchronization to populate regulatory compliance trackers</p>
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

  if (isLoading) return (
    <div className="h-[40vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Conflict Registry...</p>
    </div>
  );

  return (
    <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-foreground/[0.01] border-b border-border-theme">
              <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Declarant Profile</th>
              <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Temporal Period</th>
              <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Conflict Disclosure</th>
              <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Registry Status</th>
              <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Action Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-theme/50">
            {conflicts.length > 0 ? (
              conflicts.map(coi => (
                <tr key={coi.id} className="hover:bg-foreground/[0.01] transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 transition-transform">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-foreground font-black text-sm uppercase tracking-tight">{coi.declarant_detail?.email?.split('@')[0] || 'Institutional User'}</p>
                        <p className="text-text-muted/30 text-[9px] font-black uppercase tracking-[0.2em] mt-1">{coi.declarant_detail?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="text-text-muted font-mono text-[10px] font-black uppercase tracking-widest shadow-inner px-4 py-1.5 bg-foreground/5 border border-border-theme rounded-full">{coi.declaration_period}</span>
                  </td>
                  <td className="px-10 py-7 max-w-sm">
                    <p className="text-text-muted/60 text-xs line-clamp-2 italic leading-relaxed">"{coi.nature_of_conflict}"</p>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${coi.is_submitted ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${coi.is_submitted ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {coi.is_submitted ? 'Formalized' : 'Pending Action'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    {!coi.is_submitted && (
                      <button 
                        onClick={() => remindMutation.mutate(coi.id)}
                        className="p-3 bg-purple-500/5 text-purple-500 border border-purple-500/10 rounded-xl hover:bg-purple-500/10 transition-all active:scale-95 shadow-sm group-hover:shadow-lg"
                        title="Send Institutional Reminder"
                      >
                        <Send size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-10 py-32 text-center">
                  <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner">
                    <ShieldAlert className="text-text-muted/10" size={40} />
                  </div>
                  <p className="text-text-muted font-black uppercase tracking-widest text-xs">Registry Unpopulated</p>
                  <p className="text-text-muted/20 text-[10px] uppercase font-black tracking-[0.3em] mt-2">No institutional conflict disclosures have been filed in the current cycle</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
