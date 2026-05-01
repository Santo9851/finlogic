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

export default function SuperAdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['superadmin', 'analytics'],
    queryFn: async () => {
      const res = await api.get('/superadmin/analytics/');
      return res.data;
    }
  });

  if (isLoading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-purple-500 animate-spin" /></div>;

  const stats = analytics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Analytics</h1>
          <p className="text-white/40 text-sm">Real-time platform performance and capital metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
            <Calendar size={16} /> FY 2081/82
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all">
            <Download size={16} /> Export Report
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
        <div className="lg:col-span-2 bg-[#0d0124] border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Activity className="text-purple-500" size={20} />
              Deal Pipeline Funnel
            </h3>
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">{stats.pipeline?.total_deals} Total Deals</span>
          </div>
          
          <div className="space-y-6">
            {stats.pipeline?.pipeline_funnel?.length > 0 ? (
              stats.pipeline.pipeline_funnel.map((step, idx) => {
                const max = Math.max(...stats.pipeline.pipeline_funnel.map(s => s.count));
                const width = max > 0 ? (step.count / max) * 100 : 0;
                return (
                  <div key={step.status} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60 font-medium">{step.status}</span>
                      <span className="text-white font-bold">{step.count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-1000"
                        style={{ width: `${width}%`, transitionDelay: `${idx * 100}ms` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-48 flex items-center justify-center text-white/20 text-xs italic">
                No pipeline data available.
              </div>
            )}
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-[#0d0124] border border-white/10 rounded-3xl p-8">
          <h3 className="text-white font-bold flex items-center gap-2 mb-8">
            <Users className="text-emerald-500" size={20} />
            User Roles
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.users?.users_by_role || {}).length > 0 ? (
              Object.entries(stats.users.users_by_role).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-xs text-white/60 capitalize">{role.replace('_', ' ')}</span>
                  <span className="text-xs text-white font-bold font-mono">{count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-white/20 text-xs italic">
                No user roles defined.
              </div>
            )}
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Total LPs</p>
            <p className="text-3xl font-bold text-white font-mono">{stats.users?.total_lps}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* AI Spend */}
        <div className="bg-[#0d0124] border border-white/10 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Cpu className="text-amber-500" size={20} />
              AI Infrastructure
            </h3>
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Spend this Month</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white font-mono">${stats.ai?.cost_this_month.toFixed(2)}</span>
                <span className="text-xs text-emerald-400 flex items-center gap-0.5"><ArrowUpRight size={14} /> 12%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-white/30 uppercase font-bold">Calls</p>
                <p className="text-xl font-bold text-white font-mono">{stats.ai?.calls_this_month}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-white/30 uppercase font-bold">Top Task</p>
                <p className="text-xs font-bold text-amber-500 truncate mt-1 uppercase tracking-tighter">{stats.ai?.top_task_type || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-[#0d0124] border border-white/10 rounded-3xl p-8 flex flex-col">
          <h3 className="text-white font-bold flex items-center gap-2 mb-6">
            <FileText className="text-blue-500" size={20} />
            Data & Storage
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Total Documents</p>
                <p className="text-xs text-white/40">{stats.storage?.total_fund_documents + stats.storage?.total_project_documents} managed assets</p>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {stats.storage?.total_fund_documents + stats.storage?.total_project_documents}
              </div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500 w-1/3" />
              <div className="h-full bg-indigo-500 w-2/3" />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 font-bold uppercase tracking-widest">
              <span>Fund Docs (33%)</span>
              <span>Project Docs (67%)</span>
            </div>
            <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">Vault Storage</p>
              <p className="text-xl font-bold text-white font-mono">{(stats.storage?.estimated_storage_bytes / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          </div>
        </div>

        {/* Audit Activity */}
        <div className="bg-[#0d0124] border border-white/10 rounded-3xl p-8">
          <h3 className="text-white font-bold flex items-center gap-2 mb-6">
            <Database className="text-white/40" size={20} />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {stats.audit?.recent_events?.length > 0 ? (
              stats.audit.recent_events.map(event => (
                <div key={event.id} className="flex items-center gap-3 py-1 border-b border-white/5 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white font-medium truncate">{event.object_repr}</p>
                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">{event.event_type_display}</p>
                  </div>
                  <span className="text-[9px] text-white/20 font-mono italic shrink-0">
                    {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/20 text-xs italic">
                No recent activity.
              </div>
            )}
          </div>
          <button className="w-full mt-6 py-2 text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-widest transition-colors">
            View All Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color }) {
  const colors = {
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div className="bg-[#0d0124] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl border ${colors[color] || colors.purple}`}>
          <Icon size={20} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <ArrowUpRight size={12} /> {trend}
        </div>
      </div>
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">{title}</p>
      <p className="text-2xl font-bold text-white font-mono group-hover:text-purple-400 transition-colors">{value}</p>
    </div>
  );
}
