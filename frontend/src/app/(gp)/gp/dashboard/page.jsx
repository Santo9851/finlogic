'use client'

/**
 * (gp)/dashboard/page.jsx
 * GP Staff Dashboard — metric cards + priority deal queue.
 */
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Users, TrendingUp, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Eye,
} from 'lucide-react';
import { MetricCard, StatusBadge } from '@/components/portal/PortalShell';
import api from '@/services/api';
import Link from 'next/link';
import PriorityQueue from '@/components/portal/PriorityQueue';

export default function GPDashboardPage() {
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['deals', 'projects'],
    queryFn: async () => {
      const res = await api.get('/deals/projects/?page_size=100');
      return res.data?.results ?? res.data ?? [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: funds = [], isLoading: loadingFunds } = useQuery({
    queryKey: ['deals', 'funds'],
    queryFn: async () => {
      const res = await api.get('/deals/funds/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  const totalCommitted = funds.reduce((sum, f) => sum + Number(f.committed_capital_npr), 0);
  const formattedCapital = new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(totalCommitted);

  const count = (s) => projects.filter((d) => d.status === s).length;

  // "Submitted" in user's mind likely means anything that has moved past the draft/pending state
  const submittedCount = projects.filter(d => d.status !== 'PENDING_SUBMISSION').length;

  const metrics = [
    { label: 'Total Pipeline', value: projects.length, icon: Briefcase, color: '#F59F01', href: '/gp/deals' },
    { label: 'New Submissions', value: count('SUBMITTED'), icon: Clock, color: '#0B6EC3', href: '/gp/deals?status=SUBMITTED' },
    { label: 'In Diligence', value: count('SCREENING'), icon: TrendingUp, color: '#16c784', href: '/gp/deals?status=SCREENING' },
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
    const committed = Number(f.committed_capital_npr);
    const target = Number(f.target_size_npr);
    return {
      name: f.name,
      percent: target > 0 ? (committed / target) * 100 : 0,
      committed: committed
    };
  }).slice(0, 3);

  const isLoading = loadingProjects || loadingFunds;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">GP Control Center</h1>
          <p className="text-white/40 text-sm mt-1 font-medium">Real-time Private Equity Pipeline & Portfolio Intelligence</p>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">Active Capital</p>
            <p className="text-lg font-bold text-white tabular-nums">{formattedCapital}</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">Network Status</p>
            <div className="flex items-center justify-end gap-2 text-[#16c784] text-xs font-black mt-1 uppercase">
              <div className="w-2 h-2 rounded-full bg-[#16c784] animate-pulse" />
              Operational
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Priority Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Priority Deal Queue</h2>
              <p className="text-xs text-white/30 font-medium">Deals requiring institutional screening or GP review</p>
            </div>
            <Link
              href="/gp/deals"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[#F59F01] text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center gap-2"
            >
              Full Pipeline <Eye size={14} />
            </Link>
          </div>

          <PriorityQueue />

          {/* New Section: Sector Concentration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-[#F59F01]" /> Sector Concentration
              </h3>
              <div className="space-y-5">
                {sortedSectors.map(([name, count]) => (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/60">{name}</span>
                      <span className="text-white">{count} Deals</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#F59F01] h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${(count / projects.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={14} className="text-[#16c784]" /> Fund Deployment
              </h3>
              <div className="space-y-6">
                {fundDeployment.map(f => (
                  <div key={f.name} className="flex items-center gap-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#16c784]" strokeDasharray={126} strokeDashoffset={126 - (126 * f.percent) / 100} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white/40">{Math.round(f.percent)}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{f.name}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                        {(f.committed / 1000000).toFixed(1)}M / {(f.committed / (f.percent/100) / 1000000).toFixed(1)}M NPR
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Activity & Actions */}
        <div className="space-y-10">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-[#F59F01] rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />

            <h3 className="text-xs font-black text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Recent Submissions</h3>
            <div className="space-y-6">
              {projects.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle size={18} className="text-white/20" />
                  </div>
                  <div>
                    <Link href={`/gp/deals/${p.id}`} className="text-sm font-bold text-white hover:text-[#F59F01] transition-colors line-clamp-1">
                      {p.legal_name || p.company_name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={p.status} />
                      <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-white/20 text-xs italic">No recent activity found.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest px-2">Quick Commands</h3>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/gp/deals/invite" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <span className="text-xs font-bold text-white/80 group-hover:text-white">Invite New Entrepreneur</span>
                <ChevronRight size={16} className="text-white/20 group-hover:text-[#F59F01]" />
              </Link>
              <Link href="/gp/governance" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <span className="text-xs font-bold text-white/80 group-hover:text-white">Launch Voting Ballot</span>
                <ChevronRight size={16} className="text-white/20 group-hover:text-[#F59F01]" />
              </Link>
              <Link href="/gp/fund-admin/documents" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <span className="text-xs font-bold text-white/80 group-hover:text-white">Upload Fund Reports</span>
                <ChevronRight size={16} className="text-white/20 group-hover:text-[#F59F01]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
