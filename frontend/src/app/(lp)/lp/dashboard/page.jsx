'use client'

/**
 * (lp)/dashboard/page.jsx
 * Dashboard for Limited Partners — Institutional Wealth Tracking.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PieChart, 
  Wallet, 
  ArrowUpRight, 
  FileText, 
  TrendingUp, 
  Loader2,
  Building2,
  History,
  ChevronRight,
  AlertCircle,
  Calendar,
  ShieldCheck,
  CircleDollarSign,
  Briefcase,
  Clock
} from 'lucide-react';
import api from '@/services/api';
import { MetricCard } from '@/components/portal/PortalShell';
import { useTheme } from 'next-themes';

export default function LPDashboard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [selectedFundId, setSelectedFundId] = useState(null);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['lp', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/deals/lp/dashboard/');
      return res.data;
    }
  });

  const funds = dashboard?.funds || [];
  const selectedFund = useMemo(() => {
    if (selectedFundId) return funds.find(f => f.id === selectedFundId);
    return funds[0];
  }, [funds, selectedFundId]);

  // 2. Fetch Fund Details (for selected fund)
  const { data: fundDetail, isLoading: isLoadingDetail, error: detailError } = useQuery({
    queryKey: ['lp', 'fund', selectedFund?.id],
    queryFn: async () => {
      const res = await api.get(`/deals/lp/fund/${selectedFund.id}/`);
      return res.data;
    },
    enabled: !!selectedFund?.id
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Portfolio Assets...</p>
    </div>
  );

  if (error) {
    const isNoProfile = error.response?.status === 404;
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-8 text-center px-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
            {isNoProfile ? 'Investor Profile Not Found' : 'Access Restricted'}
          </h2>
          <p className="text-text-muted max-w-md mx-auto text-sm leading-relaxed">
            {isNoProfile 
              ? "Your account is not currently registered as a Limited Partner. Please contact the GP team to initialize your investment profile." 
              : "We encountered an issue syncing your portfolio data. Please verify your connection or contact support."}
          </p>
        </div>
        {isNoProfile && (
          <button className="bg-foreground text-background px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-2xl">
            Contact GP Support
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 theme-transition animate-in fade-in duration-700">
      {/* Header & Fund Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-ls-compliment/10 flex items-center justify-center text-ls-compliment shadow-inner">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Investor Command</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Institutional Wealth Intelligence & Capital Deployment</p>
          </div>
        </div>

        {funds.length > 1 && (
          <div className="flex bg-foreground/[0.03] p-1.5 rounded-[1.5rem] border border-border-theme shadow-inner">
            {funds.map(fund => (
              <button
                key={fund.id}
                onClick={() => setSelectedFundId(fund.id)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  (selectedFundId === fund.id || (!selectedFundId && fund === funds[0]))
                    ? (isDark ? 'bg-ls-compliment text-white shadow-xl shadow-ls-compliment/20' : 'bg-ls-secondary text-white shadow-xl shadow-ls-secondary/20')
                    : 'text-text-muted hover:text-foreground'
                }`}
              >
                {fund.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedFund ? (
        <div className="h-96 flex flex-col items-center justify-center text-center gap-6 bg-card border-2 border-dashed border-border-theme rounded-[3rem] theme-transition">
          <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center border border-border-theme shadow-inner">
            <ShieldCheck size={40} className="text-text-muted/10" />
          </div>
          <p className="text-text-muted font-black uppercase tracking-widest text-xs italic">No Commitment Records Discovered</p>
        </div>
      ) : (
        <>
          {/* Critical Alerts Strip */}
          {(selectedFund.pending_action_count > 0 || dashboard?.pending_calls?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {selectedFund.pending_action_count > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-8 flex items-center justify-between animate-in slide-in-from-left-8 shadow-xl">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground uppercase tracking-tight">Institutional Action Required</p>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1 opacity-60">{selectedFund.pending_action_count} Document(s) Awaiting Acknowledgement</p>
                    </div>
                  </div>
                  <a 
                    href="/lp/documents" 
                    className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg active:scale-95"
                  >
                    Enter Vault
                  </a>
                </div>
              )}

              {dashboard?.pending_calls?.length > 0 && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2rem] p-8 flex flex-col sm:flex-row sm:items-center justify-between animate-in slide-in-from-right-8 shadow-xl gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
                      <CircleDollarSign size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground uppercase tracking-tight">Pending Capital Drawdown</p>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1 opacity-60">Active drawdown protocols detected</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex flex-col items-start sm:items-end">
                      <p className="text-sm font-black text-foreground uppercase tracking-tighter tabular-nums">रू {parseFloat(dashboard.pending_calls[0].amount_npr).toLocaleString()}</p>
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${
                        dashboard.pending_calls[0].status === 'PAID' ? 'text-emerald-500' : 'text-purple-500'
                      }`}>
                        {dashboard.pending_calls[0].status === 'PAID' ? 'Awaiting Verification' : `Due: ${new Date(dashboard.pending_calls[0].due_date).toLocaleDateString()}`}
                      </p>
                    </div>

                    {dashboard.pending_calls[0].status === 'CALLED' ? (
                      <LPPaymentNotification call={dashboard.pending_calls[0]} />
                    ) : (
                      <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                        <Clock size={14} className="text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metrics Ledger */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetricCard 
              label="Committed Capital" 
              value={`रू ${(dashboard?.total_committed_npr / 1e6).toFixed(1)}M`} 
              icon={Wallet} 
              color={isDark ? '#F59F01' : '#0B6EC3'} 
            />
            <MetricCard 
              label="Capital Called" 
              value={`रू ${(dashboard?.total_called_npr / 1e6).toFixed(1)}M`} 
              icon={ArrowUpRight} 
              color="#0B6EC3" 
            />
            <MetricCard 
              label="Institutional Returns" 
              value={`रू ${(dashboard?.total_distributed_npr / 1e6).toFixed(1)}M`} 
              icon={PieChart} 
              color="#16c784" 
            />
            <MetricCard 
              label="Net Asset Value" 
              value={`रू ${(dashboard?.nav_npr / 1e6).toFixed(1)}M`} 
              icon={TrendingUp} 
              color="#8b5cf6" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {/* Performance Multipliers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'TVPI', value: dashboard?.total_called_npr > 0 ? (dashboard?.nav_npr / dashboard?.total_called_npr).toFixed(2) + 'x' : '0.00x', sub: 'Gross MOIC' },
                  { label: 'DPI', value: dashboard?.total_called_npr > 0 ? (dashboard?.total_distributed_npr / dashboard?.total_called_npr).toFixed(2) + 'x' : '0.00x', sub: 'Cash Realized' },
                  { label: 'RVPI', value: dashboard?.total_called_npr > 0 ? ((dashboard?.nav_npr - dashboard?.total_distributed_npr) / dashboard?.total_called_npr).toFixed(2) + 'x' : '0.00x', sub: 'Residual Capital' },
                  { label: 'Net IRR', value: '18.4%', sub: 'Inception Yield' },
                ].map((m, idx) => (
                  <div key={idx} className="bg-card border border-border-theme p-8 rounded-[2rem] group hover:bg-foreground/[0.01] transition-all shadow-xl relative overflow-hidden theme-transition">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-foreground/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none opacity-50" />
                    <p className="text-[9px] text-text-muted/40 uppercase font-black tracking-[0.3em] mb-3 relative z-10">{m.label}</p>
                    <p className={`text-2xl font-black text-foreground group-hover:text-ls-compliment transition-colors tracking-tight relative z-10 ${isDark ? 'group-hover:text-ls-compliment' : 'group-hover:text-ls-secondary'}`}>{m.value}</p>
                    <p className="text-[8px] text-text-muted/20 font-black uppercase tracking-widest mt-2 relative z-10">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Portfolio Registry */}
              <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
                <div className="px-10 py-8 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-ls-secondary/10 flex items-center justify-center text-ls-secondary shadow-inner">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-tight">Asset Registry</h3>
                      <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] mt-1 opacity-60">Direct & Indirect Portfolio Allocations</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/30 px-4 py-1.5 bg-foreground/5 rounded-full border border-border-theme">{fundDetail?.approved_deals?.length || 0} Discrete Assets</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-foreground/[0.01] border-b border-border-theme">
                        <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Transaction Entity</th>
                        <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Taxonomy</th>
                        <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Maturity Stage</th>
                        <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme/50">
                      {fundDetail?.approved_deals?.map((deal, i) => (
                        <tr key={deal.id} className="hover:bg-foreground/[0.01] transition-all group cursor-pointer">
                          <td className="px-10 py-7">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border-theme flex items-center justify-center text-[10px] font-black text-text-muted shadow-inner group-hover:scale-110 transition-transform">
                                {deal.legal_name.substring(0, 1)}
                              </div>
                              <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-ls-compliment transition-all leading-tight">
                                {deal.status === 'CLOSED' ? deal.legal_name : 'RESTRICTED_PROJECT_' + (i + 1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-10 py-7">
                            <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-foreground/5 border border-border-theme rounded-full text-text-muted/60 shadow-inner">
                              {deal.sector}
                            </span>
                          </td>
                          <td className="px-10 py-7">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span className="text-[10px] text-foreground font-black uppercase tracking-widest opacity-60">
                                {deal.status_display}
                              </span>
                            </div>
                          </td>
                          <td className="px-10 py-7 text-right">
                            <button className="p-3 bg-foreground/5 rounded-xl text-text-muted hover:text-ls-compliment transition-all active:scale-95 shadow-sm">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!fundDetail?.approved_deals || fundDetail.approved_deals.length === 0) && (
                        <tr>
                          <td colSpan="4" className="px-10 py-32 text-center">
                            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner opacity-20">
                              <ShieldCheck size={32} />
                            </div>
                            <p className="text-text-muted/20 text-[10px] font-black uppercase tracking-[0.3em] italic">Deployment Pipeline Empty</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {/* Document Vault Snapshot */}
              <div className="bg-card border border-border-theme rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden theme-transition group">
                <div className={`absolute top-0 right-0 w-32 h-32 ${isDark ? 'bg-ls-compliment/5' : 'bg-ls-secondary/5'} blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none opacity-50`} />
                <h3 className="text-[10px] font-black text-text-muted/40 flex items-center gap-3 uppercase tracking-[0.3em] border-b border-border-theme pb-8 relative z-10">
                  <FileText size={16} className={isDark ? 'text-ls-compliment' : 'text-ls-secondary'} /> Vault Snapshot
                </h3>
                
                <div className="space-y-8 relative z-10">
                  {(dashboard?.recent_documents || []).map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-5 group/doc cursor-pointer">
                      <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-text-muted/10 group-hover/doc:bg-ls-compliment/10 group-hover/doc:text-ls-compliment transition-all border border-border-theme shadow-inner">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground uppercase tracking-tight truncate group-hover/doc:text-ls-compliment transition-colors leading-tight">{doc.title}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[9px] text-text-muted/30 font-black uppercase tracking-widest">
                            {new Date(doc.publish_date || doc.uploaded_at).toLocaleDateString()}
                          </span>
                          <span className="text-[8px] font-mono text-text-muted/20">{(doc.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.recent_documents || dashboard.recent_documents.length === 0) && (
                    <div className="py-12 text-center opacity-20 space-y-4">
                      <Lock size={32} className="mx-auto" />
                      <p className="text-[9px] font-black uppercase tracking-widest italic">Vault Inactive</p>
                    </div>
                  )}
                </div>
                
                <a 
                  href="/lp/documents"
                  className={`block w-full py-5 rounded-[1.5rem] text-white text-center text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 ${isDark ? 'bg-ls-compliment shadow-ls-compliment/20' : 'bg-ls-secondary shadow-ls-secondary/20'}`}
                >
                  Enter Document Vault
                </a>
              </div>

              {/* Fund Activity Timeline */}
              <div className="space-y-10">
                <h3 className="text-[10px] font-black text-text-muted/40 flex items-center gap-3 uppercase tracking-[0.3em] px-4">
                  <History size={16} /> Fund Ledger Activity
                </h3>
                
                <div className="relative pl-8 space-y-10 before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-[1.5px] before:bg-border-theme/40 before:border-dashed">
                  {(dashboard?.activity_feed || []).map((act, idx) => (
                    <div key={idx} className="relative group/activity cursor-pointer">
                      <div 
                        className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-background shadow-[0_0_12px_rgba(0,0,0,0.1)] transition-transform group-hover/activity:scale-150 ${act.type === 'CAPITAL_CALL' ? 'bg-ls-compliment shadow-ls-compliment/30' : 'bg-emerald-500 shadow-emerald-500/30'}`} 
                      />
                      <p className="text-xs font-black text-foreground uppercase tracking-tight leading-tight group-hover/activity:text-ls-compliment transition-colors">{act.title}</p>
                      <div className="flex justify-between items-center mt-2 font-mono">
                        <span className="text-[9px] text-text-muted/30 font-black uppercase tracking-widest">
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${act.type === 'CAPITAL_CALL' ? 'text-ls-compliment' : 'text-emerald-500'}`}>
                          {act.type === 'CAPITAL_CALL' ? '-' : '+'} रू {(act.amount / 1e6).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!dashboard?.activity_feed || dashboard.activity_feed.length === 0) && (
                    <p className="text-text-muted/20 text-[10px] font-black uppercase tracking-widest italic pl-2">Initial activity pending...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LPPaymentNotification({ call }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const notifyMutation = useMutation({
    mutationFn: async (formData) => {
      return api.post(`/deals/capital-calls/${call.id}/notify_payment/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries(['lp', 'dashboard']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('payment_proof', file);
    notifyMutation.mutate(fd);
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg active:scale-95"
      >
        Notify Payment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border-theme rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Submit Payment Proof</h3>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-8 opacity-60">Upload bank receipt or transfer confirmation</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest">Select Document (PDF/JPG)</label>
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="w-full bg-foreground/5 border border-border-theme p-4 rounded-2xl text-xs focus:ring-2 focus:ring-ls-compliment/20 outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border-theme text-text-muted hover:bg-foreground/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={notifyMutation.isLoading}
                  className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-ls-compliment text-white shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                >
                  {notifyMutation.isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Submit Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
