'use client';

import React, { useState, useMemo } from 'react';
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
  CircleDollarSign,
  Lock,
  Info,
  HelpCircle,
  Send,
  X,
  Clock,
  ArrowDownRight
} from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import Link from 'next/link';
import LPNoProfileError from '@/components/portal/LPNoProfileError';
import { motion } from 'framer-motion';
import { formatIndianNumber, formatIndianCurrency } from '@/lib/formatters';


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

  const { data: fundDetail, isLoading: isLoadingDetail, error: detailError } = useQuery({
    queryKey: ['lp', 'fund', selectedFund?.id],
    queryFn: async () => {
      const res = await api.get(`/deals/lp/fund/${selectedFund.id}/`);
      return res.data;
    },
    enabled: !!selectedFund?.id
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-12 theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Portfolio Assets...</p>
    </div>
  );

  if (error) {
    if (error.response?.status === 404) {
      return <LPNoProfileError />;
    }
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-12 text-center px-6 animate-in fade-in zoom-in duration-1000">
        <div className="w-20 h-20 border border-red-500/20 flex items-center justify-center text-red-500 bg-red-500/5">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-serif font-light text-foreground uppercase tracking-tight">Access Restricted</h2>
          <p className="text-text-muted max-w-md mx-auto text-[11px] font-bold uppercase tracking-[0.3em] font-mono opacity-60">
            We encountered an issue syncing your portfolio data. Please verify your connection or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-20 pb-32 theme-transition max-w-7xl mx-auto"
    >
      {/* Header & Fund Selector - Institutional Style */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_auto] lg:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <Building2 size={14} /> Wealth Intelligence Registry
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Investor <span className="italic">Command</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-2xl">
            A comprehensive overview of institutional wealth intelligence, capital deployment, and strategic asset mastery.
          </p>
        </div>

        {funds.length > 1 && (
          <div className="flex bg-border-theme/20 p-px border border-border-theme">
            {funds.map(fund => (
              <button
                key={fund.id}
                onClick={() => setSelectedFundId(fund.id)}
                className={`px-8 py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${(selectedFundId === fund.id || (!selectedFundId && fund === funds[0]))
                  ? 'bg-ls-primary text-ls-white shadow-xl'
                  : 'text-text-muted hover:text-foreground hover:bg-border-theme/40'
                  }`}
              >
                {fund.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedFund ? (
        <div className="h-96 flex flex-col items-center justify-center text-center gap-10 border border-border-theme bg-card theme-transition">
          <div className="w-20 h-20 border border-border-theme flex items-center justify-center opacity-20">
            <ShieldCheck size={32} />
          </div>
          <p className="text-text-muted font-serif font-light italic text-xl">No active commitment records discovered in the registry.</p>
        </div>
      ) : (
        <>
          {/* Critical Alerts Strip */}
          {(selectedFund.pending_action_count > 0 || dashboard?.pending_calls?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-theme border border-border-theme">
              {selectedFund.pending_action_count > 0 && (
                <div className="bg-ls-primary text-ls-white p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                  <div className="flex items-start gap-8">
                    <AlertCircle size={28} className="text-ls-compliment flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-lg font-serif font-light tracking-tight">Institutional Action Required</p>
                      <p className="text-[9px] text-ls-white/40 font-bold uppercase tracking-[0.3em]">{selectedFund.pending_action_count} Document(s) Awaiting Acknowledgement</p>
                    </div>
                  </div>
                  <Link
                    href="/lp/documents"
                    className="bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.4em] px-10 py-5 hover:bg-ls-white transition-all shadow-xl"
                  >
                    Enter Vault
                  </Link>
                </div>
              )}

              {dashboard?.pending_calls?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border border-ls-compliment/20 shadow-[0_0_40px_rgba(245,159,1,0.05)]"
                >
                  <div className="flex items-start gap-8">
                    <CircleDollarSign size={28} className="text-ls-compliment flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-lg font-serif font-light text-foreground tracking-tight">Pending Capital Drawdown</p>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.3em]">Active drawdown protocols detected in ledger</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-10">
                    <div className="flex flex-col items-start sm:items-end">
                      <p className="text-2xl font-serif font-light text-foreground tracking-tighter tabular-nums">रू {parseFloat(dashboard.pending_calls[0].amount_npr || 0).toLocaleString()}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-[0.3em] mt-1 ${dashboard.pending_calls[0].status === 'PAID' ? 'text-ls-up' : 'text-ls-compliment'
                        }`}>
                        {dashboard.pending_calls[0].call_type_display} | {dashboard.pending_calls[0].status === 'PAID' ? 'Awaiting Verification' : `Due: ${new Date(dashboard.pending_calls[0].due_date).toLocaleDateString()}`}
                      </p>
                    </div>

                    {dashboard.pending_calls[0].status === 'CALLED' ? (
                      <LPPaymentNotification call={dashboard.pending_calls[0]} />
                    ) : (
                      <div className="px-8 py-4 border border-border-theme flex items-center gap-4">
                        <Clock size={14} className="text-ls-up animate-pulse" />
                        <span className="text-[9px] font-bold text-ls-up uppercase tracking-[0.4em]">Processing Ingestion</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Capital Credit Balance Notification */}
          {(dashboard?.total_credit_balance_npr || 0) > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="border border-emerald-500/20 bg-emerald-500/5 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <CircleDollarSign size={24} />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-serif font-light text-foreground tracking-tight">Capital Credit Available</p>
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.3em]">
                    From equalization rebalancing — automatically deducted from your next capital call
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-serif font-light text-emerald-500 tracking-tighter tabular-nums">
                  रू {formatIndianNumber(dashboard.total_credit_balance_npr)}
                </p>
                <p className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-[0.3em] mt-1">Net-off Applied on Next Call</p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border-theme border border-border-theme overflow-visible">
            <MetricCard
              label="Committed Capital"
              value={formatIndianCurrency(dashboard?.total_committed_npr || 0, 1)}
              icon={Wallet}
              info="Total capital you have legally committed to invest over the fund's lifecycle."
            />
            <MetricCard
              label="Capital Called"
              value={formatIndianCurrency(dashboard?.total_called_npr || 0, 1)}
              icon={ArrowUpRight}
              info="Total capital requested by the GP to date, including paid, verified, and outstanding calls."
            />
            <MetricCard
              label="Institutional Returns"
              value={formatIndianCurrency(dashboard?.total_distributed_npr || 0, 1)}
              icon={PieChart}
              info="Total cash and stock distributions returned to you to date (DPI basis)."
            />
            <MetricCard
              label="Total Value"
              value={formatIndianCurrency(dashboard?.total_value_npr || 0, 1)}
              icon={CircleDollarSign}
              info="Total Distributed + Net Asset Value. This represents the total wealth created for you (TVPI basis)."
            />
            <MetricCard
              label="Net Asset Value"
              value={formatIndianCurrency(dashboard?.nav_npr || 0, 1)}
              icon={TrendingUp}
              info="Estimated Fair Market Value of your current stake, net of GP carried interest and accrued fees."
            />
            <MetricCard
              label="Est. Accrued Fees"
              value={formatIndianCurrency(dashboard?.management_fees?.total_accrued_unpaid_npr || 0, 1)}
              icon={Clock}
              info="Management fees accrued since inception that have not yet been called, calculated daily."
            />
            <MetricCard
              label="Life-to-Date Mgmt Fees"
              value={formatIndianCurrency(dashboard?.total_mgmt_fees_npr || 0, 1)}
              icon={History}
              info="Total management fees and fund expenses that have already been called and paid."
            />
            <MetricCard
              label="Est. Carried Interest"
              value={formatIndianCurrency(dashboard?.estimated_carry_npr || 0, 1)}
              icon={Lock}
              info="The GP's estimated share of performance-based profits (Carry) based on current unrealized gains."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
            <div className="lg:col-span-2 space-y-24">
              {/* Performance Multipliers - Architectural */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border-theme border border-border-theme overflow-visible">
                {[
                  {
                    label: 'TVPI',
                    value: (dashboard?.performance?.tvpi || 0).toFixed(2) + 'x',
                    sub: 'Gross MOIC',
                    info: 'Total Value to Paid-In (Net of Carry): (Distributed + Net RV) / Paid-In Capital. Measures total value created after GP participation.'
                  },
                  {
                    label: 'DPI',
                    value: (dashboard?.performance?.dpi || 0).toFixed(2) + 'x',
                    sub: 'Cash Realized',
                    info: 'Distributed to Paid-In: Total Distributions / Paid-In Capital. Measures cash returned to investor.'
                  },
                  {
                    label: 'RVPI',
                    value: (dashboard?.performance?.rvpi || 0).toFixed(2) + 'x',
                    sub: 'Residual Cap',
                    info: 'Residual Value to Paid-In (Net of Carry): Net Asset Value / Paid-In Capital. Measures unrealized value after estimated GP carry.'
                  },
                  {
                    label: 'Net IRR',
                    value: (dashboard?.performance?.irr || 0).toFixed(1) + '%',
                    sub: 'Inception Yield',
                    info: 'Internal Rate of Return (Net of Carry & Fees): Annualized rate of earnings on an investment, net of all management fees and estimated carried interest.'
                  },
                ].map((m, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ backgroundColor: "var(--ls-primary)" }}
                    transition={{ duration: 0.5 }}
                    className="bg-card p-8 group transition-all duration-700 relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-[9px] text-text-muted group-hover:text-ls-white/40 uppercase font-bold tracking-[0.4em] relative z-10">{m.label}</p>
                      <div className="group/tip relative">
                        <Info size={12} className="text-text-muted/20 group-hover:text-ls-compliment transition-colors cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-ls-primary border border-ls-compliment/20 text-[8px] font-bold uppercase tracking-widest text-ls-white leading-relaxed opacity-0 group-hover/tip:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl">
                          {m.info}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-ls-primary" />
                        </div>
                      </div>
                    </div>
                    <p className="text-3xl font-serif font-light text-foreground group-hover:text-ls-compliment transition-colors tracking-tight relative z-10">
                      {m.value}
                    </p>
                    <p className="text-[9px] text-text-muted group-hover:text-ls-white/20 font-bold uppercase tracking-[0.3em] mt-3 relative z-10 font-serif italic">{m.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Fee & Carry Transparency Note */}
              <div className="p-8 bg-border-theme/5 border border-border-theme/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-ls-compliment animate-pulse" />
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em]">Institutional Transparency Protocol</p>
                </div>
                <div className="flex gap-12 text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted/60">
                  <span>Mgmt Fees: {formatIndianCurrency(dashboard?.performance?.total_mgmt_fees || 0, 2)}</span>
                  <span>Est. Carry: {formatIndianCurrency(dashboard?.performance?.estimated_carry || 0, 2)}</span>
                </div>
              </div>

              {/* Portfolio Registry - Formal Document */}
              <div className="bg-card border border-border-theme theme-transition">
                <div className="px-12 py-10 border-b border-border-theme flex items-center justify-between bg-border-theme/10">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 border border-border-theme flex items-center justify-center text-ls-compliment">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-light text-foreground tracking-tight leading-tight uppercase">Asset Registry</h3>
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.4em] mt-2 opacity-60">Strategic Portfolio Allocations & Ledger Summary</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-text-muted/40 border border-border-theme px-6 py-2">{fundDetail?.approved_deals?.length || 0} Discrete Assets</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-border-theme/5 border-b border-border-theme">
                        <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Transaction Entity</th>
                        <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Taxonomy</th>
                        <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em]">Maturity</th>
                        <th className="px-12 py-8 text-[10px] font-bold text-text-muted uppercase tracking-[0.5em] text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-theme/50">
                      {fundDetail?.approved_deals?.map((deal, i) => (
                        <tr key={deal.id} className="hover:bg-ls-primary transition-all duration-500 group cursor-pointer">
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 border border-border-theme flex items-center justify-center text-[10px] font-bold text-text-muted group-hover:text-ls-white group-hover:border-ls-white/20 transition-all">
                                0{i + 1}
                              </div>
                              <span className="text-xl font-serif font-light text-foreground group-hover:text-ls-white transition-all leading-tight">
                                {deal.status === 'CLOSED' ? deal.legal_name : 'RESTRICTED_PROJECT_' + (i + 1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-12 py-10">
                            <span className="text-[9px] font-bold uppercase tracking-[0.4em] px-5 py-2 border border-border-theme group-hover:border-ls-white/20 text-text-muted group-hover:text-ls-white/40 shadow-inner">
                              {deal.sector}
                            </span>
                          </td>
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-ls-up shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <span className="text-[10px] text-foreground group-hover:text-ls-white/60 font-bold uppercase tracking-[0.3em] opacity-60">
                                {deal.status_display}
                              </span>
                            </div>
                          </td>
                          <td className="px-12 py-10 text-right">
                            <button className="p-4 border border-border-theme group-hover:border-ls-white/20 text-text-muted group-hover:text-ls-compliment transition-all">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-24">
              {/* Document Vault - Archival */}
              <div className="bg-ls-primary text-ls-white p-12 space-y-12 shadow-2xl relative overflow-hidden group">
                <h3 className="text-[10px] font-bold text-ls-white/40 flex items-center gap-4 uppercase tracking-[0.5em] border-b border-ls-white/10 pb-8 relative z-10">
                  <FileText size={16} className="text-ls-compliment" /> Vault Snapshot
                </h3>

                <div className="space-y-10 relative z-10">
                  {(dashboard?.recent_documents || []).map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-6 group/doc cursor-pointer">
                      <div className="w-12 h-12 border border-ls-white/10 flex items-center justify-center text-ls-white/20 group-hover/doc:text-ls-compliment group-hover/doc:border-ls-compliment transition-all">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-serif font-light text-ls-white tracking-tight truncate group-hover/doc:text-ls-compliment transition-colors leading-tight">{doc.title}</p>
                        <div className="flex justify-between items-center mt-3 font-mono">
                          <span className="text-[9px] text-ls-white/30 font-bold uppercase tracking-widest">
                            {new Date(doc.publish_date || doc.uploaded_at).toLocaleDateString()}
                          </span>
                          <span className="text-[8px] font-mono text-ls-white/20">{(doc.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/lp/documents"
                  className="block w-full py-6 bg-ls-compliment text-ls-primary text-center text-[10px] font-bold uppercase tracking-[0.5em] transition-all hover:bg-ls-white shadow-xl"
                >
                  Enter Document Vault
                </Link>
              </div>

              {/* Fund Activity - Ledger */}
              <div className="space-y-12">
                <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em] px-4">
                  <History size={16} className="text-ls-compliment" /> Fund Activity Ledger
                </h3>

                <div className="relative pl-10 space-y-12 border-l border-border-theme ml-4">
                  {(dashboard?.activity_feed || []).map((act, idx) => (
                    <div key={idx} className="relative group/activity cursor-pointer">
                      <div
                        className={`absolute -left-[45px] top-1.5 w-2 h-2 rounded-full border border-background transition-transform group-hover/activity:scale-150 ${act.type === 'CAPITAL_CALL' ? 'bg-ls-compliment shadow-[0_0_12px_rgba(245,159,1,0.3)]' : 'bg-ls-up shadow-[0_0_12px_rgba(16,185,129,0.3)]'}`}
                      />
                      <p className="text-lg font-serif font-light text-foreground tracking-tight leading-tight group-hover/activity:text-ls-compliment transition-colors">{act.title}</p>
                      <div className="flex justify-between items-center mt-3 font-mono">
                        <span className="text-[9px] text-text-muted/40 font-bold uppercase tracking-widest">
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${act.type === 'CAPITAL_CALL' ? 'text-ls-compliment' : 'text-ls-up'}`}>
                          {act.type === 'CAPITAL_CALL' ? '-' : '+'} {formatIndianCurrency(act.amount, 2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MetricCard({ label, value, icon: Icon, info }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="p-10 bg-card flex flex-col justify-between space-y-10 group hover:bg-ls-primary transition-all duration-500 relative border-r border-b border-border-theme/10 dark:border-border-theme/50 last:border-r-0">
      <div className="text-ls-compliment opacity-60 group-hover:opacity-100 transition-all flex items-center justify-between">
        <Icon size={24} />
        <div className="flex items-center gap-3">
          {info && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="text-text-muted group-hover:text-ls-white/40 transition-colors"
              >
                <Info size={14} />
              </button>
              {showInfo && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-ls-primary dark:bg-ls-primary border border-ls-white/10 text-[10px] font-bold uppercase tracking-widest text-ls-white shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2">
                  <div className="relative z-10">{info}</div>
                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-ls-primary rotate-45 border-r border-b border-ls-white/10" />
                </div>
              )}
            </div>
          )}
          <span className="text-[8px] font-mono opacity-20 group-hover:opacity-40 tracking-widest uppercase">Institutional Metric</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="text-4xl font-serif font-light text-foreground group-hover:text-ls-white transition-colors tracking-tight">{value}</div>
        <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-text-muted group-hover:text-ls-white/40 transition-colors">{label}</div>
      </div>
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
        className="bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.5em] px-10 py-5 hover:bg-ls-white transition-all shadow-xl"
      >
        Notify Payment
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-ls-primary/90 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border-theme p-16 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-serif font-light text-foreground tracking-tight mb-4">Submit Payment Proof</h3>
            <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-12 opacity-60">Upload official bank receipt or transfer confirmation ledger.</p>

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="space-y-6">
                <label className="block text-[9px] font-bold text-text-muted uppercase tracking-[0.4em]">Asset Documentation (PDF/JPG)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="w-full bg-border-theme/5 border border-border-theme p-6 text-xs focus:ring-1 focus:ring-ls-compliment/20 outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-10 py-5 border border-border-theme text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted hover:bg-border-theme/10 transition-all"
                >
                  Cancel Protocol
                </button>
                <button
                  type="submit"
                  disabled={notifyMutation.isLoading}
                  className="flex-1 px-10 py-5 bg-ls-compliment text-ls-primary text-[10px] font-bold uppercase tracking-[0.5em] shadow-xl hover:bg-ls-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {notifyMutation.isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Commit Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
