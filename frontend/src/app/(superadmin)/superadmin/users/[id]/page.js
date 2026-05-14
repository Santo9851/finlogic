'use client'

import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2,
  ChevronLeft,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  History,
  PlusCircle,
  MinusCircle,
  Save,
  Clock,
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SuperAdminUserDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const queryClient = useQueryClient();
  
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentNote, setAdjustmentNote] = useState('');

  // 1. Fetch User Data (includes quota and history now)
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['superadmin', 'user', id],
    queryFn: async () => {
      const res = await api.get(`/superadmin/users/${id}/`);
      return res.data;
    }
  });

  // 2. Adjust Quota Mutation
  const adjustQuotaMutation = useMutation({
    mutationFn: (payload) => api.post('/idea-validator/quota/adjust-user-quota/', payload),
    onSuccess: () => {
      toast.success('User quota adjusted successfully');
      setAdjustmentAmount(0);
      setAdjustmentNote('');
      queryClient.invalidateQueries(['superadmin', 'user', id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to adjust quota')
  });

  const handleAdjustQuota = (e) => {
    e.preventDefault();
    if (adjustmentAmount === 0) {
      toast.error("Please specify a change amount.");
      return;
    }
    if (!adjustmentNote.trim()) {
      toast.error("A mandatory note is required for quota adjustments.");
      return;
    }

    adjustQuotaMutation.mutate({
      user_id: id,
      change_amount: adjustmentAmount,
      note: adjustmentNote
    });
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Retrieving Identity Dossier...</p>
    </div>
  );

  if (error) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
      <Fingerprint className="w-16 h-16 text-ls-secondary" />
      <p className="text-xl font-bold uppercase tracking-widest">Identity Not Found</p>
      <Link href="/superadmin/users" className="text-purple-500 font-bold hover:underline">Return to Registry</Link>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/superadmin/users"
          className="flex items-center gap-2 text-text-muted hover:text-purple-500 transition-colors group w-fit"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-widest">Return to Identity Registry</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
              <UserIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">{user.first_name} {user.last_name}</h1>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2 font-mono">Principal ID: {user.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Identity Info */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-xl space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest border-b border-border-theme pb-4">Security Profile</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted shadow-inner">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">Institutional Email</p>
                    <p className="font-bold text-sm truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted shadow-inner">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">System Roles</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                       {user.role_list.map(r => (
                          <span key={r} className="text-[8px] font-black uppercase tracking-tighter bg-purple-500/5 text-purple-500 px-2 py-0.5 rounded-full border border-purple-500/10">
                            {r}
                          </span>
                       ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted shadow-inner">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">Account Created</p>
                    <p className="font-bold text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
           </div>

           {/* Quota Overview */}
           <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                 <History size={80} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Validator Quota</h3>
              <div className="flex items-end gap-3">
                 <span className="text-5xl font-black text-ls-compliment">{user.validator_quota.remaining}</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40 mb-2">Validations Remaining</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                Last reset: {user.validator_quota.last_reset}
              </p>
           </div>
        </div>

        {/* Right: Management Area */}
        <div className="lg:col-span-2 space-y-12">
          {/* Quota Adjustment Form */}
          <div className="bg-card border border-border-theme rounded-[3rem] p-10 lg:p-12 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-black uppercase tracking-widest mb-8">Provision Validator Credits</h3>
            
            <form onSubmit={handleAdjustQuota} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40 ml-1">Adjustment Amount</label>
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setAdjustmentAmount(prev => prev - 1)}
                      className="p-4 bg-foreground/5 rounded-2xl hover:bg-ls-secondary/10 hover:text-ls-secondary transition-all"
                    >
                      <MinusCircle size={24} />
                    </button>
                    <input 
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                      className="flex-1 bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-center text-xl font-black focus:border-purple-500/40 outline-none transition-all shadow-inner"
                    />
                    <button 
                      type="button"
                      onClick={() => setAdjustmentAmount(prev => prev + 1)}
                      className="p-4 bg-foreground/5 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                    >
                      <PlusCircle size={24} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted/40 ml-1">Mandatory Audit Note</label>
                  <textarea 
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    required
                    placeholder="Provide justification for this adjustment..."
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-sm font-medium focus:border-purple-500/40 outline-none transition-all shadow-inner h-[68px] resize-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={adjustQuotaMutation.isLoading || adjustmentAmount === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-2xl shadow-purple-500/30 active:scale-95"
              >
                {adjustQuotaMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {adjustQuotaMutation.isLoading ? 'Committing Adjustment...' : 'Commit Quota Adjustment'}
              </button>
            </form>
          </div>

          {/* Quota History Ledger */}
          <div className="bg-card border border-border-theme rounded-[3rem] p-10 lg:p-12 shadow-2xl space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-black uppercase tracking-widest">Audit Ledger: Quota Adjustments</h3>
               <History className="text-text-muted/20" size={24} />
            </div>

            <div className="space-y-4">
              {user.quota_history.length > 0 ? (
                user.quota_history.map((log, i) => (
                  <div key={log.id} className="p-6 bg-foreground/[0.01] border border-border-theme rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-purple-500/20 transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                        log.change_amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-ls-secondary/10 text-ls-secondary'
                      }`}>
                         {log.change_amount > 0 ? <PlusCircle size={24} /> : <MinusCircle size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <span className={`font-black text-lg ${log.change_amount > 0 ? 'text-emerald-500' : 'text-ls-secondary'}`}>
                              {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                           </span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">Credits</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1 max-w-md italic">"{log.note}"</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                       <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-text-muted">
                          <Clock size={12} />
                          {new Date(log.created_at).toLocaleString()}
                       </div>
                       <div className="text-[9px] font-black uppercase tracking-widest bg-foreground/5 px-3 py-1 rounded-full border border-border-theme">
                          Admin: {log.admin_email}
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4 opacity-20">
                   <History size={48} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-widest italic">No adjustments recorded for this identity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
