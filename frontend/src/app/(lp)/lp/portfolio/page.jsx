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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import api from '@/services/api';
import { toast } from 'sonner';

const COLORS = ['#F59F01', '#3B82F6', '#10B981', '#8B5CF6', '#F43F5E'];

export default function LPPortfolioPage() {
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
    <div className="flex items-center justify-center h-screen text-white/30 animate-pulse">
      Loading your portfolio analytics...
    </div>
  );

  const sectorChartData = Object.entries(data?.stats?.sectors || {}).map(([name, value]) => ({
    name, value
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio Insights</h1>
          <p className="text-white/50 mt-1">Anonymized performance tracking of underlying fund investments.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <ShieldAlert size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">SEBON Compliant Reporting</span>
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
        />
        <MetricCard 
          title="Portfolio IRR" 
          value={`${data?.stats?.performance?.irr}%`} 
          desc="Internal Rate of Return" 
          icon={Target} 
          trend="+2.1%" 
          color="blue"
        />
        <MetricCard 
          title="DPI" 
          value={`${data?.stats?.performance?.dpi}x`} 
          desc="Distributed to Paid-In" 
          icon={Wallet} 
          trend="Stable" 
          color="emerald"
        />
        <MetricCard 
          title="Active Projects" 
          value={data?.stats?.total_investments} 
          desc="Across all committed funds" 
          icon={Building2} 
          trend="+2 new" 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Allocation Chart */}
        <div className="lg:col-span-1 bg-[#08001a] border border-white/8 rounded-3xl p-8 shadow-2xl relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59F01]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
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
                  contentStyle={{ backgroundColor: '#08001a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {sectorChartData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div className="lg:col-span-2 bg-[#08001a] border border-white/8 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 size={20} className="text-[#3B82F6]" />
              Portfolio Companies
            </h3>
            <div className="flex items-center gap-2 text-white/20 text-xs">
              <Info size={14} />
              <span>Anonymized per SIF Rules 2075</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {data?.projects?.map(project => (
              <div key={project.id} className="p-5 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/5 hover:border-[#F59F01]/20 transition-all group cursor-default">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#F59F01] transition-colors">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-[#F59F01] transition-colors">{project.anonymized_name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">{project.sector_display}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{project.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">Investment Range</p>
                    <p className="text-xs font-bold text-white/80">
                      NPR {(project.investment_range_min_npr / 10000000).toFixed(1)}Cr - {(project.investment_range_max_npr / 10000000).toFixed(1)}Cr
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-white/10 group-hover:text-white transition-colors" />
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
  const colorMap = {
    amber: 'from-amber-500/20 to-transparent text-amber-500 border-amber-500/10',
    blue: 'from-blue-500/20 to-transparent text-blue-500 border-blue-500/10',
    emerald: 'from-emerald-500/20 to-transparent text-emerald-500 border-emerald-500/10',
    purple: 'from-purple-500/20 to-transparent text-purple-500 border-purple-500/10',
  };

  const isUp = trend.includes('+');

  return (
    <div className="bg-[#08001a] border border-white/8 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colorMap[color]}`} />
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-white/5 ${colorMap[color].split(' ')[2]}`}>
          <Icon size={20} />
        </div>
        {trend !== 'Stable' && (
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-white group-hover:text-[#F59F01] transition-colors">{value}</h3>
        <p className="text-white/20 text-[10px] mt-1 font-medium">{desc}</p>
      </div>
    </div>
  );
}
