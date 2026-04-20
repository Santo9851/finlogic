'use client';

import React, { useState, useEffect } from 'react';
import { 
  PieChart as LucidePie, 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  Building2, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';

// Sample Data for visual excellence (to be replaced by API)
const SECTOR_DATA = [
  { name: 'Technology', value: 45, color: '#F59F01' },
  { name: 'Healthcare', value: 25, color: '#3B82F6' },
  { name: 'Energy', value: 15, color: '#10B981' },
  { name: 'Consumer', value: 15, color: '#8B5CF6' },
];

const PERFORMANCE_DATA = [
  { month: 'Jan', value: 1.2 },
  { month: 'Feb', value: 1.4 },
  { month: 'Mar', value: 1.3 },
  { month: 'Apr', value: 1.8 },
  { month: 'May', value: 2.1 },
  { month: 'Jun', value: 2.4 },
];

export default function GPPortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio Management</h1>
          <p className="text-white/50 mt-1">Real-time overview of fund performance and asset allocation.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Search companies..." 
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F59F01]/50 w-64"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total AUM" value="$142.5M" change="+12.5%" trend="up" icon={Wallet} color="amber" />
        <StatCard title="Active Projects" value="24" change="+2" trend="up" icon={Building2} color="blue" />
        <StatCard title="Avg. Multiple" value="2.4x" change="-0.1x" trend="down" icon={TrendingUp} color="emerald" />
        <StatCard title="Internal RR" value="28.4%" change="+2.1%" trend="up" icon={BarChart3} color="purple" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Allocation Chart */}
        <div className="lg:col-span-1 bg-[#08001a] border border-white/8 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-white">Sector Allocation</h3>
            <LucidePie size={20} className="text-white/30" />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SECTOR_DATA}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {SECTOR_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#08001a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {SECTOR_DATA.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-white/50">{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-[#08001a] border border-white/8 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-white">Portfolio Value Growth</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-[#F59F01]/10 text-[#F59F01] text-[10px] font-bold uppercase tracking-wider rounded-lg">Real-Time</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#08001a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#F59F01' }}
                />
                <Bar dataKey="value" fill="#F59F01" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#08001a] border border-white/8 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between bg-white/2">
          <h3 className="font-semibold text-white">Top Portfolio Companies</h3>
          <button className="text-xs text-[#F59F01] hover:underline font-medium">View All Assets</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2 border-b border-white/8">
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Company</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Sector</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Invested</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Current Value</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Multiple</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <CompanyRow name="CloudScale AI" sector="Technology" invested="$4.2M" current="$12.8M" multiple="3.0x" />
              <CompanyRow name="GreenPulse" sector="Energy" invested="$8.5M" current="$14.2M" multiple="1.7x" />
              <CompanyRow name="BioGenic Systems" sector="Healthcare" invested="$3.1M" current="$9.4M" multiple="3.0x" />
              <CompanyRow name="RetailEdge" sector="Consumer" invested="$5.0M" current="$6.2M" multiple="1.2x" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }) {
  const isUp = trend === 'up';
  const colorMap = {
    amber: 'bg-amber-500/10 text-amber-500',
    blue: 'bg-blue-500/10 text-blue-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="bg-[#08001a] border border-white/8 rounded-2xl p-6 shadow-lg group hover:border-[#F59F01]/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color] || 'bg-white/5 text-white'}`}>
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-white/40 text-sm font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-white mt-1 group-hover:text-[#F59F01] transition-colors">{value}</h4>
      </div>
    </div>
  );
}

function CompanyRow({ name, sector, invested, current, multiple }) {
  return (
    <tr className="hover:bg-white/2 transition-colors group cursor-pointer">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/30 text-xs font-bold">
            {name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-white group-hover:text-[#F59F01] transition-colors">{name}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 font-medium">
          {sector}
        </span>
      </td>
      <td className="px-6 py-5 text-sm text-white/60 font-mono">{invested}</td>
      <td className="px-6 py-5 text-sm text-white font-semibold font-mono">{current}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
          <TrendingUp size={14} />
          {multiple}
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <button className="text-white/20 hover:text-white transition-colors">
          <ChevronRight size={18} />
        </button>
      </td>
    </tr>
  );
}

function ChevronRight({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
