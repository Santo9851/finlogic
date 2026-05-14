'use client'

import { useState, useEffect, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2,
  ChevronLeft,
  User,
  ClipboardList,
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Zap,
  Building,
  Mail,
  Shield,
  ArrowRight
} from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

export default function SuperAdminValidationDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('user');
  const [questions, setQuestions] = useState([]);

  // 1. Fetch Validation Data
  const { data: validation, isLoading, error } = useQuery({
    queryKey: ['superadmin', 'validation', id],
    queryFn: async () => {
      const res = await api.get(`/superadmin/validations/${id}/`);
      return res.data;
    }
  });

  // 2. Fetch Questions Template
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/idea-validator/sessions/questions/');
        setQuestions(res.data);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      }
    };
    fetchQuestions();
  }, []);

  // 3. Request Red-Team Mutation
  const requestRedTeamMutation = useMutation({
    mutationFn: () => api.post(`/superadmin/validations/${id}/request-raw-report/`),
    onSuccess: () => {
      toast.success('Red-Team analysis triggered successfully');
      queryClient.invalidateQueries(['superadmin', 'validation', id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to trigger analysis')
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Decrypting Submission Package...</p>
    </div>
  );

  if (error) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
      <AlertTriangle className="w-16 h-16 text-ls-secondary" />
      <p className="text-xl font-bold uppercase tracking-widest">Audit Record Not Found</p>
      <Link href="/superadmin/validations" className="text-ls-compliment font-bold hover:underline">Return to Oversight</Link>
    </div>
  );

  const tabs = [
    { id: 'user', label: 'User Identity', icon: <User size={16} /> },
    { id: 'responses', label: 'Form Ledger', icon: <ClipboardList size={16} /> },
    { id: 'polished', label: 'Polished Report', icon: <FileText size={16} /> },
    { id: 'redteam', label: 'Raw Red-Team', icon: <ShieldAlert size={16} /> },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/superadmin/validations"
          className="flex items-center gap-2 text-text-muted hover:text-ls-compliment transition-colors group w-fit"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-widest">Return to Oversight Ledger</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
              validation.verdict === 'VIABLE' ? 'bg-emerald-500/10 text-emerald-500' : 
              validation.verdict === 'DEAD ON ARRIVAL' ? 'bg-ls-secondary/10 text-ls-secondary' : 'bg-ls-compliment/10 text-ls-compliment'
            }`}>
              <Zap size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Inspect Validation</h1>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2 font-mono">Reference ID: {validation.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className={`px-6 py-3 rounded-xl border font-black text-[10px] uppercase tracking-[0.3em] ${
                validation.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-ls-compliment/10 text-ls-compliment border-ls-compliment/20'
             }`}>
                {validation.status}
             </div>
          </div>
        </div>
      </div>

      {/* Tabs System */}
      <div className="flex gap-4 p-2 bg-card border border-border-theme rounded-[2rem] w-fit overflow-x-auto shadow-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'bg-ls-compliment text-ls-primary shadow-lg shadow-ls-compliment/20' 
              : 'text-text-muted hover:bg-foreground/5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-card border border-border-theme rounded-[3rem] p-12 lg:p-16 shadow-2xl theme-transition relative overflow-hidden min-h-[500px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        
        {activeTab === 'user' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-lg font-black uppercase tracking-widest border-b border-border-theme pb-4">Personal Identity</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted shadow-inner">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">Full Legal Name</p>
                      <p className="font-bold text-lg">{validation.user_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted shadow-inner">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">Institutional Email</p>
                      <p className="font-bold text-lg font-mono">{validation.user_email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-black uppercase tracking-widest border-b border-border-theme pb-4">Institutional Affiliation</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted shadow-inner">
                      <Building size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">Organization</p>
                      <p className="font-bold text-lg">{validation.user_organization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted shadow-inner">
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">System Role</p>
                      <p className="font-bold text-lg uppercase tracking-tight">{validation.user_role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {questions.length > 0 ? (
              <div className="space-y-8">
                {questions.map((q) => {
                  const answer = validation.answers?.find(a => a.question_number === q.id);
                  return (
                    <div key={q.id} className="p-8 bg-foreground/[0.02] border border-border-theme rounded-2xl space-y-4 hover:border-ls-compliment/30 transition-all shadow-sm">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex gap-4">
                           <div className="w-8 h-8 rounded-lg bg-ls-compliment/10 flex items-center justify-center text-ls-compliment font-black text-xs">
                              {q.id}
                           </div>
                           <h4 className="font-bold leading-relaxed max-w-2xl">{q.title_en}</h4>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-foreground/5 rounded-full text-text-muted">
                           {q.pillar}
                        </div>
                      </div>
                      
                      <div className="pl-12 space-y-4">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">Selected Response</p>
                           <p className="text-ls-compliment font-black text-sm">
                              {answer?.selected_option || <span className="opacity-20 italic">No option selected</span>}
                              {answer?.other_text && <span className="text-text-muted ml-2">(Other: {answer.other_text})</span>}
                           </p>
                        </div>
                        {answer?.free_text_response && (
                           <div className="space-y-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">Contextual Elaboration</p>
                              <p className="text-sm text-text-muted leading-relaxed p-4 bg-background/50 rounded-xl border border-border-theme italic">
                                "{answer.free_text_response}"
                              </p>
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-ls-compliment" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'polished' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {validation.polished_report ? (
              <div className="prose dark:prose-invert prose-ls max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-text-muted prose-p:leading-relaxed prose-strong:text-ls-compliment bg-foreground/[0.01] rounded-3xl p-10 border border-border-theme">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {validation.polished_report}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-text-muted italic gap-4">
                <Clock className="w-12 h-12 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Report not generated yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'redteam' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            {/* Confidential Warning */}
            <div className="flex items-center gap-6 p-8 bg-ls-secondary/5 border border-ls-secondary/20 rounded-3xl text-ls-secondary">
               <ShieldAlert className="w-10 h-10 shrink-0" />
               <div className="space-y-1">
                  <h4 className="font-black uppercase tracking-widest text-sm">Confidential Institutional Intel</h4>
                  <p className="text-xs opacity-70 leading-relaxed uppercase tracking-tighter">
                    This report contains raw adversarial analysis and is intended for internal strategic oversight only. 
                    Unauthorized disclosure to the entrepreneur or external parties is strictly prohibited.
                  </p>
               </div>
            </div>

            {validation.red_team_report ? (
              <div className="prose dark:prose-invert prose-ls max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-text-muted prose-p:leading-relaxed prose-strong:text-ls-secondary bg-ls-secondary/[0.02] rounded-3xl p-10 border border-ls-secondary/10">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {validation.red_team_report}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-8">
                <div className="w-24 h-24 rounded-full bg-ls-secondary/5 flex items-center justify-center text-ls-secondary/20 border border-ls-secondary/10 shadow-inner">
                   <ShieldAlert size={48} />
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Adversarial Analysis Pending</h3>
                   <p className="text-text-muted text-sm max-w-md mx-auto">
                      Deep Red-Team analysis is triggered on-demand by superadmins for high-priority submissions.
                   </p>
                </div>
                
                {validation.status === 'completed' ? (
                  <button
                    disabled={requestRedTeamMutation.isLoading}
                    onClick={() => requestRedTeamMutation.mutate()}
                    className="flex items-center gap-4 bg-ls-secondary text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-ls-secondary/20 disabled:opacity-50"
                  >
                    {requestRedTeamMutation.isLoading ? (
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    {requestRedTeamMutation.isLoading ? 'Triggering AI Engine...' : 'Request Deep Red-Team Analysis'}
                  </button>
                ) : (
                  <p className="text-xs text-text-muted italic border border-border-theme px-6 py-2 rounded-full">
                    Analysis can only be requested for completed validations.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
