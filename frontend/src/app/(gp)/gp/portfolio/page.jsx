'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Compass, 
  ArrowRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import Link from 'next/link';

export default function PortfolioOverview() {
  const sections = [
    {
      title: 'Analytics',
      description: 'Monthly KPIs, variance analysis, and operational performance monitoring across the portfolio.',
      icon: BarChart3,
      href: '/gp/portfolio/analytics',
      color: 'bg-blue-500/10 text-blue-400',
      stats: '12 Active Reports'
    },
    {
      title: 'Waterfall',
      description: 'Carry calculations, distribution modeling, and GP/LP split analysis for exit events.',
      icon: TrendingUp,
      href: '/gp/portfolio/waterfall',
      color: 'bg-emerald-500/10 text-emerald-400',
      stats: '8-8-2 Structure'
    },
    {
      title: 'Valuations',
      description: 'Fair value tracking, DCF/LBO models, and unrealized gain/loss assessments.',
      icon: DollarSign,
      href: '/gp/portfolio/valuations',
      color: 'bg-amber-500/10 text-amber-400',
      stats: 'NPR 1.42B Total'
    },
    {
      title: 'Exit Planning',
      description: 'IPO eligibility, harvest strategy mapping, and secondary sale opportunity tracking.',
      icon: Compass,
      href: '/gp/portfolio/exit-planning',
      color: 'bg-purple-500/10 text-purple-400',
      stats: '3 IPO Pipeline'
    }
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-1000">
      <div>
        <div className="flex items-center gap-2 text-[#F59F01] mb-2">
          <PieChartIcon size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Phase 3 Integrated</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Portfolio Control</h1>
        <p className="text-white/40 text-sm mt-2 max-w-lg">
          Welcome to the central command for fund performance. Manage your investments from acquisition through harvest with institutional-grade tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link 
            key={section.title} 
            href={section.href}
            className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition-all overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl ${section.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
              <section.icon size={28} />
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{section.title}</h3>
            <p className="text-white/40 text-sm mb-8 leading-relaxed max-w-xs">{section.description}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{section.stats}</span>
              <div className="flex items-center gap-2 text-[#F59F01] font-bold text-xs">
                Enter Hub <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/[0.02] rounded-full blur-3xl group-hover:bg-white/[0.05] transition-all" />
          </Link>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 justify-between shadow-2xl">
        <div className="flex-1">
          <h3 className="text-white font-bold mb-1">Need a Consolidated LP Report?</h3>
          <p className="text-white/40 text-sm">Generate quarterly statements for all LPs across the active portfolio in one click.</p>
        </div>
        <button className="px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10">
          Global Report Generator
        </button>
      </div>
    </div>
  );
}
