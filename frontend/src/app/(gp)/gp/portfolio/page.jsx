'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Compass, 
  ArrowRight,
  PieChart as PieChartIcon,
  ShieldCheck,
  ShieldAlert,
  CircleDollarSign
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
      title: 'Drawdowns',
      description: 'Reconcile capital calls, verify LP bank transfers, and update paid-in capital ledgers.',
      icon: CircleDollarSign,
      href: '/gp/fund-admin/drawdowns',
      color: 'bg-ls-compliment/10 text-ls-compliment',
      stats: 'Awaiting Reconciliation'
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
    },
    {
      title: 'Governance',
      description: 'Manage shareholder voting, governance proposals, and board ballots.',
      icon: ShieldCheck,
      href: '/gp/governance',
      color: 'bg-emerald-500/10 text-emerald-400',
      stats: 'Active Ballots'
    },
    {
      title: 'Compliance',
      description: 'Track SEBON deadlines, regulatory filings, and Nepal-specific reporting.',
      icon: ShieldAlert,
      href: '/gp/compliance',
      color: 'bg-rose-500/10 text-rose-400',
      stats: 'Regulatory Calendar'
    }
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-1000 theme-transition">
      <div>
        <div className="flex items-center gap-2 text-[#F59F01] mb-2">
          <PieChartIcon size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Phase 3 Integrated</span>
        </div>
        <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase">Portfolio Control</h1>
        <p className="text-text-muted text-sm mt-2 max-w-lg">
          Welcome to the central command for fund performance. Manage your investments from acquisition through harvest with institutional-grade tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link 
            key={section.title} 
            href={section.href}
            className="group relative bg-card border border-border-theme rounded-[2.5rem] p-8 hover:bg-foreground/[0.04] transition-all overflow-hidden theme-transition"
          >
            <div className={`w-14 h-14 rounded-2xl ${section.color.includes('text-blue-400') ? section.color.replace('text-blue-400', 'text-blue-600 dark:text-blue-400') : section.color.includes('text-emerald-400') ? section.color.replace('text-emerald-400', 'text-emerald-600 dark:text-emerald-400') : section.color.includes('text-amber-400') ? section.color.replace('text-amber-400', 'text-amber-600 dark:text-amber-400') : section.color.includes('text-purple-400') ? section.color.replace('text-purple-400', 'text-purple-600 dark:text-purple-400') : section.color.replace('text-rose-400', 'text-rose-600 dark:text-rose-400')} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
              <section.icon size={28} />
            </div>
            
            <h3 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">{section.title}</h3>
            <p className="text-text-muted text-sm mb-8 leading-relaxed max-w-xs">{section.description}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[10px] font-black text-text-muted/20 uppercase tracking-widest">{section.stats}</span>
              <div className="flex items-center gap-2 text-[#F59F01] font-bold text-xs">
                Enter Hub <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-foreground/[0.01] rounded-full blur-3xl group-hover:bg-foreground/[0.03] transition-all" />
          </Link>
        ))}
      </div>

      <div className="bg-card border border-border-theme rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 justify-between shadow-2xl theme-transition">
        <div className="flex-1">
          <h3 className="text-foreground font-bold mb-1">Need a Consolidated LP Report?</h3>
          <p className="text-text-muted text-sm font-medium">Generate quarterly statements for all LPs across the active portfolio in one click.</p>
        </div>
        <button className="px-8 py-4 bg-foreground text-background rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-foreground/10">
          Global Report Generator
        </button>
      </div>
    </div>
  );
}
