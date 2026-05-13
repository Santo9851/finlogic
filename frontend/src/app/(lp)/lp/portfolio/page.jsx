'use client';

import React, { useState, useEffect } from 'react';
import { 
  PieChart as LucidePie, 
  TrendingUp, 
  Building2, 
  Globe, 
  Wallet, 
  ChevronRight,
  ShieldAlert,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const COLORS = ['#F59F01', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E'];

export default function LPPortfolioPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/lp/portfolio/');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-text-muted/30 animate-pulse">
      <div className="w-12 h-12 border-4 border-ls-compliment border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Portfolio Registry...</span>
    </div>
  );

  const sectorChartData = Object.entries(data?.stats?.sectors || {}).map(([name, value]) => ({
    name, value
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Portfolio Insights</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Anonymized performance tracking of underlying fund investments.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl shadow-inner">
          <ShieldAlert size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-[0.15em]">SEBON Compliant Reporting</span>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Portfolio TVPI" 
          value={`${data?.stats?.performance?.tvpi}x`} 
          desc="Total Value to Paid-In" 
          icon={TrendingUp} 
          trend="+0.12x" 
          color="amber"
          isDark={isDark}
        />
        <MetricCard 
          title="Portfolio IRR" 
          value={`${data?.stats?.performance?.irr}%`} 
          desc="Internal Rate of Return" 
          icon={Target} 
          trend="+2.1%" 
          color="blue"
          isDark={isDark}
        />
        <MetricCard 
          title="DPI" 
          value={`${data?.stats?.performance?.dpi}x`} 
          desc="Distributed to Paid-In" 
          icon={Wallet} 
          trend="Stable" 
          color="emerald"
          isDark={isDark}
        />
        <MetricCard 
          title="Active Projects" 
          value={data?.stats?.total_investments} 
          desc="Across all committed funds" 
          icon={Building2} 
          trend="+2 new" 
          color="purple"
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Allocation Chart */}
        <div className="lg:col-span-1 bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl relative group overflow-hidden theme-transition">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59F01]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-sm font-black text-foreground mb-10 flex items-center gap-3 uppercase tracking-widest">
            <LucidePie size={20} className="text-[#F59F01]" />
            Sector Distribution
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorChartData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {sectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1a0a33' : '#ffffff', 
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16,2,38,0.1)'}`, 
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: isDark ? '#fff' : '#100226', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6">
            {sectorChartData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-black text-text-muted/60 tracking-widest uppercase">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div className="lg:col-span-2 bg-card border border-border-theme rounded-[2.5rem] p-10 shadow-2xl theme-transition">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
              <Building2 size={20} className="text-[#3B82F6]" />
              Portfolio Registry
            </h3>
            <div className="flex items-center gap-2 text-text-muted/30 text-[9px] font-black uppercase tracking-widest">
              <Info size={14} />
              <span>Anonymized per SIF Rules 2075</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {data?.projects?.map(project => (
              <div key={project.id} className="p-6 bg-foreground/[0.02] border border-border-theme/50 rounded-2xl flex items-center justify-between hover:bg-foreground/[0.05] hover:border-[#F59F01]/20 transition-all group cursor-default shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-foreground/[0.05] border border-border-theme flex items-center justify-center text-text-muted/40 group-hover:text-[#F59F01] transition-colors shadow-inner">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground group-hover:text-[#F59F01] transition-colors uppercase tracking-tight">{project.anonymized_name}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">{project.sector_display}</span>
                      <div className="w-1 h-1 rounded-full bg-foreground/10" />
                      <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest">{project.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-[0.2em] mb-1">Investment Range</p>
                    <p className="text-xs font-black text-foreground opacity-80 font-mono">
                      NPR {(project.investment_range_min_npr / 10000000).toFixed(1)}Cr - {(project.investment_range_max_npr / 10000000).toFixed(1)}Cr
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-text-muted/20 group-hover:text-[#F59F01] transition-all transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, desc, icon: Icon, trend, color, isDark }) {
  const colorMap = {
    amber: 'from-amber-500/20 to-transparent text-amber-500 border-amber-500/10',
    blue: 'from-blue-500/20 to-transparent text-blue-500 border-blue-500/10',
    emerald: 'from-emerald-500/20 to-transparent text-emerald-500 border-emerald-500/10',
    purple: 'from-purple-500/20 to-transparent text-purple-500 border-purple-500/10',
  };

  const isUp = trend.includes('+');

  return (
    <div className="bg-card border border-border-theme rounded-[2rem] p-8 shadow-xl relative overflow-hidden group theme-transition">
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${colorMap[color]}`} />
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-xl bg-foreground/[0.05] border border-border-theme ${colorMap[color].split(' ')[2]} shadow-inner`}>
          <Icon size={20} />
        </div>
        {trend !== 'Stable' && (
          <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isUp ? 'text-emerald-500 bg-emerald-500/5' : 'text-rose-500 bg-rose-500/5'}`}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{title}</p>
        <h3 className="text-3xl font-black text-foreground group-hover:text-[#F59F01] transition-colors tracking-tighter font-mono">{value}</h3>
        <p className="text-text-muted/30 text-[10px] mt-2 font-black uppercase tracking-widest opacity-60">{desc}</p>
      </div>
    </div>
  );
}
