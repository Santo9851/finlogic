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
    <div className="flex flex-col items-center justify-center h-[60vh] gap-12">
      <div className="w-12 h-12 border border-ls-compliment border-t-transparent animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Portfolio Ledger...</p>
    </div>
  );

  const sectorChartData = Object.entries(data?.stats?.sectors || {}).map(([name, value]) => ({
    name, value
  }));

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32 max-w-7xl mx-auto">
      {/* Header - Institutional Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border-theme pb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
            <Target size={14} /> Strategic Asset Dossier
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
            Portfolio <span className="italic">Registry</span>
          </h1>
          <p className="text-xl text-text-muted font-serif font-light italic max-w-2xl">
            A secure archival overview of institutional allocations, sectoral exposure, and anonymized performance multipliers.
          </p>
        </div>
        <div className="flex items-center gap-6 px-10 py-5 bg-ls-up/5 border border-ls-up/20 shadow-sm transition-all hover:bg-ls-up/10">
          <ShieldAlert size={18} className="text-ls-up" />
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-ls-up uppercase tracking-[0.3em]">Compliance Verified</p>
             <p className="text-[9px] text-ls-up/40 font-bold uppercase tracking-widest">SEBON-REF: SIF-2075-P</p>
          </div>
        </div>
      </div>

      {/* Metrics Ledger - High Fidelity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border-theme border border-border-theme">
        <MetricCard 
          title="Portfolio TVPI" 
          value={`${data?.stats?.performance?.tvpi}x`} 
          desc="Gross MOIC Value" 
          icon={TrendingUp} 
          trend="+0.12x" 
          color="amber"
        />
        <MetricCard 
          title="Portfolio IRR" 
          value={`${data?.stats?.performance?.irr}%`} 
          desc="Net Inception Yield" 
          icon={Target} 
          trend="+2.1%" 
          color="blue"
        />
        <MetricCard 
          title="Realized DPI" 
          value={`${data?.stats?.performance?.dpi}x`} 
          desc="Cash-on-Cash Return" 
          icon={Wallet} 
          trend="Stable" 
          color="emerald"
        />
        <MetricCard 
          title="Active Assets" 
          value={data?.stats?.total_investments} 
          desc="In-Cycle Deployments" 
          icon={Building2} 
          trend="+2 UNIT" 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Allocation Chart - Institutional Style */}
        <div className="lg:col-span-1 bg-card border border-border-theme p-12 shadow-2xl relative group overflow-hidden theme-transition">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ls-compliment/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          <h3 className="text-[10px] font-bold text-text-muted mb-12 flex items-center gap-4 uppercase tracking-[0.5em]">
            <LucidePie size={16} className="text-ls-compliment" />
            Sectoral Exposure
          </h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorChartData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(16,2,38,0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    padding: '16px',
                    borderRadius: '0'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.4em]">Asset</span>
              <span className="text-3xl font-serif font-light text-foreground">Split</span>
            </div>
          </div>
          <div className="mt-12 space-y-4">
            {sectorChartData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] font-bold text-text-muted group-hover:text-foreground transition-colors uppercase tracking-[0.3em]">{s.name}</span>
                </div>
                <span className="text-[9px] font-mono text-text-muted/40 group-hover:text-ls-compliment transition-colors">ALLOC-0{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Registry - Archival Ledger */}
        <div className="lg:col-span-2 bg-card border border-border-theme shadow-2xl theme-transition">
          <div className="px-12 py-10 border-b border-border-theme flex items-center justify-between bg-border-theme/10">
            <h3 className="text-[10px] font-bold text-text-muted flex items-center gap-4 uppercase tracking-[0.5em]">
              <Building2 size={16} className="text-ls-compliment" />
              Strategic Deployment Registry
            </h3>
            <div className="flex items-center gap-4 text-text-muted/40 text-[9px] font-bold uppercase tracking-[0.3em]">
              <Info size={14} />
              <span>Redacted per Governance Protocol</span>
            </div>
          </div>
          
          <div className="divide-y divide-border-theme">
            {data?.projects?.map((project, i) => (
              <div key={project.id} className="p-10 flex items-center justify-between hover:bg-ls-primary group transition-all duration-500 cursor-pointer relative overflow-hidden">
                <div className="flex items-center gap-10">
                  <div className="w-14 h-14 border border-border-theme flex items-center justify-center text-[10px] font-bold text-text-muted/30 group-hover:text-ls-white group-hover:border-ls-white/20 transition-all">
                    0{i + 1}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-serif font-light text-foreground group-hover:text-ls-white transition-all uppercase tracking-tight leading-none">
                      {project.anonymized_name}
                    </h4>
                    <div className="flex items-center gap-6">
                      <span className="text-[9px] font-bold text-ls-compliment uppercase tracking-[0.4em]">{project.sector_display}</span>
                      <div className="w-px h-2 bg-border-theme group-hover:bg-ls-white/10" />
                      <span className="text-[9px] font-bold text-text-muted/40 group-hover:text-ls-white/40 uppercase tracking-[0.4em]">{project.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-12">
                  <div className="text-right space-y-2">
                    <p className="text-[9px] font-bold text-text-muted/30 group-hover:text-ls-white/20 uppercase tracking-[0.4em]">Investment Exposure</p>
                    <p className="text-lg font-serif font-light text-foreground group-hover:text-ls-compliment opacity-90 transition-all tabular-nums">
                      रू {(project.investment_range_min_npr / 10000000).toFixed(1)}Cr - {(project.investment_range_max_npr / 10000000).toFixed(1)}Cr
                    </p>
                  </div>
                  <div className="p-4 border border-border-theme group-hover:border-ls-white/20 text-text-muted group-hover:text-ls-compliment transition-all">
                     <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, desc, icon: Icon, trend, color }) {
  const isUp = trend.includes('+');

  return (
    <div className="bg-card p-10 group hover:bg-ls-primary transition-all duration-700 overflow-hidden relative">
      <div className="flex items-center justify-between mb-10">
        <div className="text-ls-compliment group-hover:text-ls-white/40 transition-all opacity-40 group-hover:opacity-100">
          <Icon size={24} />
        </div>
        {trend !== 'Stable' && (
          <div className={`flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] px-4 py-2 border transition-all ${
            isUp ? 'text-ls-up border-ls-up/20 bg-ls-up/5' : 'text-red-500 border-red-500/20 bg-red-500/5'
          } group-hover:bg-ls-white group-hover:text-ls-primary group-hover:border-ls-white`}>
            {isUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
            {trend}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <p className="text-[9px] font-bold text-text-muted group-hover:text-ls-white/30 uppercase tracking-[0.5em]">{title}</p>
        <h3 className="text-5xl font-serif font-light text-foreground group-hover:text-ls-white transition-all tracking-tight tabular-nums">{value}</h3>
        <p className="text-base font-serif italic text-text-muted/40 group-hover:text-ls-white/20 transition-all pt-2">{desc}</p>
      </div>
    </div>
  );
}
