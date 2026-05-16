'use client'

/**
 * (gp)/dashboard/page.jsx
 * GP Staff Dashboard — Institutional Command Center with high-fidelity metrics.
 */
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Users, TrendingUp, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Eye, FileText,
  Building2,
  PieChart,
  ArrowUpRight,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { MetricCard, StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import Link from 'next/link';
import PriorityQueue from '@/components/portal/PriorityQueue';
import { useTheme } from 'next-themes';

export default function GPDashboardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['deals', 'projects'],
    queryFn: async () => {
      const res = await api.get('/deals/projects/?page_size=100');
      const data = res.data?.results ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000,
  });

  const { data: funds = [], isLoading: loadingFunds } = useQuery({
    queryKey: ['deals', 'funds'],
    queryFn: async () => {
      const res = await api.get('/deals/funds/');
      const data = res.data?.results ?? res.data;
      return Array.isArray(data) ? data : [];
    }
  });

  const totalFMV = funds.reduce((sum, f) => sum + (f.performance?.total_rv || 0), 0);
  const avgIRR = funds.length > 0 ? (funds.reduce((sum, f) => sum + (f.performance?.irr || 0), 0) / funds.length) : 0;
  
  const formattedFMV = new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(totalFMV);

  const count = (s) => projects.filter((d) => d.status === s).length;

  const metrics = [
    { label: 'Total Pipeline', value: projects.length, icon: Briefcase, color: isDark ? '#F59F01' : '#0B6EC3', href: '/gp/deals' },
    { label: 'Avg Portfolio IRR', value: `${avgIRR.toFixed(1)}%`, icon: TrendingUp, color: '#16c784', href: '/gp/portfolio/analytics' },
    { label: 'In Diligence', value: count('SCREENING'), icon: ShieldCheck, color: '#0B6EC3', href: '/gp/deals?status=SCREENING' },
    { label: 'IC Review', value: count('IC_REVIEW'), icon: AlertTriangle, color: '#ea3943', href: '/gp/deals?status=IC_REVIEW' },
  ];

  // Sector Breakdown Data
  const sectors = projects.reduce((acc, p) => {
    const s = p.sector || 'Other';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const sortedSectors = Object.entries(sectors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  // Fund Deployment Data
  const fundDeployment = funds.map(f => {
    const invested = Number(f.performance?.total_invested || 0);
    const committed = Number(f.committed_capital_npr);
    return {
      name: f.name,
      percent: committed > 0 ? (invested / committed) * 100 : 0,
      invested: invested,
      committed: committed
    };
  }).slice(0, 3);

  const isLoading = loadingProjects || loadingFunds;

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-ls-compliment animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Global Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-12 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">GP Control Center</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Real-time Private Equity Pipeline & Institutional Deployment</p>
        </div>
        <div className="flex items-center gap-8 bg-card border border-border-theme p-6 rounded-[2rem] shadow-xl">
          <div className="text-right">
            <p className="text-[9px] text-text-muted/40 uppercase tracking-[0.3em] font-black mb-1">Total Assets (FMV)</p>
            <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">{formattedFMV}</p>
          </div>
          <div className="h-10 w-px bg-border-theme opacity-50" />
          <div className="text-right">
            <p className="text-[9px] text-text-muted/40 uppercase tracking-[0.3em] font-black mb-1">Node Status</p>
            <div className="flex items-center justify-end gap-2 text-emerald-500 text-[10px] font-black mt-1 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Operational
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Priority Queue */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Priority Protocol Queue</h2>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] opacity-40 mt-1">Assets requiring immediate institutional screening</p>
            </div>
            <Link
              href="/gp/deals"
              className={`px-6 py-2.5 bg-foreground/5 hover:bg-foreground/10 rounded-xl ${isDark ? 'text-ls-compliment' : 'text-ls-secondary'} text-[10px] font-black uppercase tracking-widest transition-all border border-border-theme flex items-center gap-3 active:scale-95`}
            >
              Master Pipeline <Eye size={14} />
            </Link>
          </div>

          <div className="bg-card border border-border-theme rounded-[3rem] p-4 shadow-2xl theme-transition">
            <PriorityQueue />
          </div>

          {/* New Section: Sector Concentration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden theme-transition group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              <h3 className="text-[10px] font-black text-text-muted/40 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                <PieChart size={16} className="text-ls-compliment" /> Sector Concentration
              </h3>
              <div className="space-y-6">
                {sortedSectors.map(([name, count]) => (
                  <div key={name} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-text-muted/60">{name}</span>
                      <span className="text-foreground">{count} Protocol Entries</span>
                    </div>
                    <div className="w-full bg-foreground/[0.03] h-2 rounded-full overflow-hidden shadow-inner border border-border-theme/20">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isDark ? 'bg-ls-compliment shadow-[0_0_12px_rgba(245,159,1,0.3)]' : 'bg-ls-secondary shadow-[0_0_12px_rgba(11,110,195,0.3)]'}`}
                        style={{ width: `${(count / projects.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden theme-transition group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              <h3 className="text-[10px] font-black text-text-muted/40 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                <ArrowUpRight size={16} className="text-emerald-500" /> Capital Deployment
              </h3>
              <div className="space-y-8">
                {fundDeployment.map(f => (
                  <div key={f.name} className="flex items-center gap-6 group/item cursor-pointer">
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-foreground/5" />
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500 shadow-lg" strokeDasharray={151} strokeDashoffset={151 - (151 * f.percent) / 100} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-foreground">{Math.round(f.percent)}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground uppercase tracking-tight truncate group-hover/item:text-emerald-500 transition-colors">{f.name}</p>
                      <p className="text-[9px] text-text-muted/40 uppercase tracking-[0.2em] font-black mt-1">
                        Deployed: {(f.invested / 1000000).toFixed(1)}M / {(f.committed / 1000000).toFixed(1)}M NPR
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Activity & Actions */}
        <div className="space-y-12">
          <div className="bg-card border border-border-theme rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group theme-transition">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-ls-compliment blur-[100px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity" />

            <h3 className="text-[10px] font-black text-text-muted/40 mb-8 uppercase tracking-[0.3em] border-b border-border-theme pb-6">Temporal Activity Feed</h3>
            <div className="space-y-8">
              {projects.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-start gap-5 group/activity cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-border-theme flex items-center justify-center shrink-0 shadow-inner group-hover/activity:scale-110 transition-transform">
                    <CheckCircle size={20} className="text-text-muted/10 group-hover/activity:text-ls-compliment transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/gp/deals/${p.id}`} className="text-sm font-black text-foreground uppercase tracking-tight hover:text-ls-compliment transition-colors line-clamp-1 leading-tight">
                      {p.legal_name || p.company_name}
                    </Link>
                    <div className="flex items-center gap-4 mt-2">
                      <StatusBadge status={p.status} />
                      <span className="text-[9px] text-text-muted/40 font-black uppercase tracking-[0.2em] font-mono">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="py-12 text-center space-y-4">
                  <Clock size={32} className="text-text-muted/10 mx-auto" />
                  <p className="text-text-muted/20 text-[10px] font-black uppercase tracking-widest italic">Protocol Silent</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] px-4">Institutional Commands</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Authorize New Entrepreneur', href: '/gp/deals/invite', icon: Users },
                { label: 'Launch Governance Ballot', href: '/gp/governance', icon: ShieldCheck },
                { label: 'Publish Institutional Reports', href: '/gp/fund-admin/documents', icon: FileText },
              ].map((cmd, i) => (
                <Link
                  key={i}
                  href={cmd.href}
                  className="flex items-center justify-between p-6 bg-card border border-border-theme rounded-[1.5rem] hover:bg-foreground/[0.02] hover:border-ls-compliment/30 transition-all group shadow-sm hover:shadow-xl active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-text-muted/20 group-hover:text-ls-compliment transition-colors shadow-inner">
                      <cmd.icon size={18} />
                    </div>
                    <span className="text-[10px] font-black text-foreground/80 uppercase tracking-widest group-hover:text-foreground">{cmd.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-text-muted/10 group-hover:text-ls-compliment group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
