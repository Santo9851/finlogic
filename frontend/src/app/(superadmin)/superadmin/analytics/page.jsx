'use client'

import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Users, 
  Briefcase, 
  Cpu, 
  FileText, 
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
  Calendar,
  Activity
} from 'lucide-react';
import api from '@/services/api';
import { useTheme } from 'next-themes';

export default function SuperAdminAnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['superadmin', 'analytics'],
    queryFn: async () => {
      const res = await api.get('/superadmin/analytics/');
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center theme-transition">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/40">Aggregating Institutional Analytics...</span>
    </div>
  );

  const stats = analytics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 theme-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">System Analytics</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Real-time platform performance and capital metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-foreground/[0.03] hover:bg-foreground/[0.08] border border-border-theme text-foreground text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg">
            <Calendar size={16} /> FY 2081/82 Registry
          </button>
          <button className="bg-ls-compliment hover:bg-ls-compliment/90 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-3 shadow-xl shadow-ls-compliment/20 transition-all active:scale-95">
            <Download size={16} /> Export Protocol Report
          </button>
        </div>
      </div>

      {/* Row 1: Capital Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Committed" 
          value={`NPR ${(stats.funds?.total_committed_capital / 10000000).toFixed(1)} Cr`} 
          trend="+12.4%" 
          icon={Briefcase} 
          color="purple" 
        />
        <MetricCard 
          title="Total Called" 
          value={`NPR ${(stats.funds?.total_called_capital / 10000000).toFixed(1)} Cr`} 
          trend="+8.2%" 
          icon={TrendingUp} 
          color="emerald" 
        />
        <MetricCard 
          title="Current AUM" 
          value={`NPR ${(stats.funds?.total_AUM / 10000000).toFixed(1)} Cr`} 
          trend="+5.1%" 
          icon={BarChart3} 
          color="amber" 
        />
        <MetricCard 
          title="Distributed" 
          value={`NPR ${(stats.funds?.total_distributed / 10000000).toFixed(1)} Cr`} 
          trend="+15.0%" 
          icon={PieChart} 
          color="blue" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal Pipeline Funnel */}
        <div className="lg:col-span-2 bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl theme-transition">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
              <Activity className="text-ls-compliment" size={20} />
              Deal Pipeline Funnel
            </h3>
            <span className="text-[10px] text-text-muted/40 uppercase tracking-[0.2em] font-black">{stats.pipeline?.total_deals} Total Deals Registry</span>
          </div>
          
          <div className="space-y-8">
            {stats.pipeline?.pipeline_funnel?.length > 0 ? (
              stats.pipeline.pipeline_funnel.map((step, idx) => {
                const max = Math.max(...stats.pipeline.pipeline_funnel.map(s => s.count));
                const width = max > 0 ? (step.count / max) * 100 : 0;
                return (
                  <div key={step.status} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-text-muted/60">{step.status}</span>
                      <span className="text-foreground">{step.count} Assets</span>
                    </div>
                    <div className="h-2.5 bg-foreground/[0.03] rounded-full overflow-hidden shadow-inner border border-border-theme/20">
                      <div 
                        className="h-full bg-gradient-to-r from-ls-compliment to-ls-secondary rounded-full transition-all duration-1000 shadow-sm"
                        style={{ width: `${width}%`, transitionDelay: `${idx * 100}ms` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-48 flex items-center justify-center text-text-muted/20 text-[10px] font-black uppercase tracking-widest italic">
                No pipeline flow identified.
              </div>
            )}
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl theme-transition">
          <h3 className="text-sm font-black text-foreground flex items-center gap-3 mb-10 uppercase tracking-widest">
            <Users className="text-emerald-500" size={20} />
            User Roles Registry
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.users?.users_by_role || {}).length > 0 ? (
              Object.entries(stats.users.users_by_role).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-4 bg-foreground/[0.02] rounded-2xl border border-border-theme/50 shadow-sm">
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest">{role.replace('_', ' ')}</span>
                  <span className="text-sm font-black text-foreground font-mono">{count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-muted/20 text-[10px] font-black uppercase tracking-widest italic">
                No active roles found.
              </div>
            )}
          </div>
          <div className="mt-10 pt-10 border-t border-border-theme/50 text-center">
            <p className="text-[10px] text-text-muted/30 uppercase tracking-[0.2em] font-black mb-2">Total Managed LPs</p>
            <p className="text-4xl font-black text-foreground font-mono tracking-tighter">{stats.users?.total_lps}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* AI Spend */}
        <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl flex flex-col theme-transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[40px] rounded-full -mr-12 -mt-12 pointer-events-none" />
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
              <Cpu className="text-amber-500" size={20} />
              AI Infrastructure
            </h3>
          </div>
          <div className="flex-1 space-y-8">
            <div>
              <p className="text-[10px] text-text-muted/30 uppercase tracking-[0.2em] font-black mb-3">Institutional Spend / Mo</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-foreground font-mono tracking-tighter">${stats.ai?.cost_this_month.toFixed(2)}</span>
                <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-full"><ArrowUpRight size={12} /> 12%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 bg-foreground/[0.02] rounded-2xl border border-border-theme/50 shadow-inner">
                <p className="text-[9px] text-text-muted/40 uppercase font-black tracking-widest mb-1">API Calls</p>
                <p className="text-xl font-black text-foreground font-mono">{stats.ai?.calls_this_month}</p>
              </div>
              <div className="p-5 bg-foreground/[0.02] rounded-2xl border border-border-theme/50 shadow-inner">
                <p className="text-[9px] text-text-muted/40 uppercase font-black tracking-widest mb-1">Dominant Task</p>
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 truncate mt-1 uppercase tracking-tighter">{stats.ai?.top_task_type || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl flex flex-col theme-transition">
          <h3 className="text-sm font-black text-foreground flex items-center gap-3 mb-8 uppercase tracking-widest">
            <FileText className="text-blue-500" size={20} />
            Data Storage Vault
          </h3>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-foreground font-black uppercase tracking-tight">Total Managed Assets</p>
                <p className="text-[10px] text-text-muted/40 font-black uppercase tracking-widest mt-1">{stats.storage?.total_fund_documents + stats.storage?.total_project_documents} verified files</p>
              </div>
              <div className="text-3xl font-black text-foreground font-mono tracking-tighter">
                {stats.storage?.total_fund_documents + stats.storage?.total_project_documents}
              </div>
            </div>
            <div className="h-2.5 bg-foreground/[0.03] rounded-full overflow-hidden flex shadow-inner border border-border-theme/20">
              <div className="h-full bg-blue-500 w-1/3 shadow-sm" />
              <div className="h-full bg-ls-compliment w-2/3 shadow-sm" />
            </div>
            <div className="flex justify-between text-[9px] text-text-muted/30 font-black uppercase tracking-[0.15em]">
              <span>Fund Assets (33%)</span>
              <span>Project Assets (67%)</span>
            </div>
            <div className="pt-8 border-t border-border-theme/50">
              <p className="text-[10px] text-text-muted/30 uppercase tracking-[0.2em] font-black mb-2">Vault Utilization</p>
              <p className="text-2xl font-black text-foreground font-mono tracking-tighter">{(stats.storage?.estimated_storage_bytes / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          </div>
        </div>

        {/* Audit Activity */}
        <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl theme-transition">
          <h3 className="text-sm font-black text-foreground flex items-center gap-3 mb-8 uppercase tracking-widest">
            <Database className="text-text-muted/30" size={20} />
            Recent Log Stream
          </h3>
          <div className="space-y-4">
            {stats.audit?.recent_events?.length > 0 ? (
              stats.audit.recent_events.map(event => (
                <div key={event.id} className="flex items-center gap-4 py-2 border-b border-border-theme/50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-ls-compliment shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground font-black uppercase tracking-tight truncate">{event.object_repr}</p>
                    <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest">{event.event_type_display}</p>
                  </div>
                  <span className="text-[10px] text-text-muted/20 font-mono italic shrink-0">
                    {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-muted/20 text-[10px] font-black uppercase tracking-widest italic">
                No activity stream.
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-[10px] text-text-muted/40 hover:text-ls-compliment uppercase font-black tracking-[0.2em] transition-all border border-border-theme/30 rounded-xl hover:bg-foreground/[0.02]">
            View Institutional Logs
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color }) {
  const colors = {
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className="bg-card border border-border-theme rounded-[2rem] p-8 hover:border-ls-compliment/30 transition-all group shadow-xl theme-transition overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-xl border shadow-inner ${colors[color] || colors.purple}`}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full shadow-sm">
          <ArrowUpRight size={12} /> {trend}
        </div>
      </div>
      <p className="text-[10px] text-text-muted/30 uppercase tracking-[0.2em] font-black mb-2">{title}</p>
      <p className="text-3xl font-black text-foreground font-mono group-hover:text-ls-compliment transition-colors tracking-tighter">{value}</p>
    </div>
  );
}
