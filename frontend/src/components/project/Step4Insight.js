"use client";

import React from 'react';

export default function Step4Insight({ register, errors }) {
  const inputCls = "w-full px-4 py-2.5 bg-foreground/[0.03] border border-border-theme rounded-xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 focus:border-[#F59F01] transition-all font-medium shadow-inner";
  const labelCls = "block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60 mb-2";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Deep Insight</h2>
        <p className="text-text-muted text-sm font-medium">Share your core institutional metrics, market feedback, and strategic risks.</p>
      </div>

      <div className="space-y-8 text-left">
        <div>
           <label className="block text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6 border-b border-border-theme pb-3">
            Institutional Key Metrics
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>Revenue (Last 3 Years)</label>
              <input
                type="text"
                {...register('revenue_metrics')}
                className={inputCls}
                placeholder="e.g., $100k, $250k, $500k"
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Growth Rate (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('growth_rate', { valueAsNumber: true })}
                className={inputCls}
                placeholder="e.g., 25.5"
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Gross Margins (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('gross_margins', { valueAsNumber: true })}
                className={inputCls}
                placeholder="e.g., 65.0"
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Customer Acquisition Cost (CAC)</label>
              <input
                type="number"
                step="0.01"
                {...register('customer_acquisition_cost', { valueAsNumber: true })}
                className={inputCls}
                placeholder="e.g., 150.00"
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Lifetime Value (LTV)</label>
              <input
                type="number"
                step="0.01"
                {...register('lifetime_value', { valueAsNumber: true })}
                className={inputCls}
                placeholder="e.g., 1200.00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            Share any customer feedback or testimonials.
          </label>
          <textarea
            {...register('feedback')}
            rows={3}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.feedback ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="(Optional) Quotes or summary of market response and institutional validation..."
          />
          {errors.feedback && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.feedback.message}</p>
          )}
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            Are there any hidden risks we should be aware of?
          </label>
          <textarea
            {...register('risks')}
            rows={3}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border border-border-theme focus:border-[#F59F01] rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="(Optional) Regulatory hurdles, supply chain dependencies, or market volatility..."
          />
        </div>
      </div>
    </div>
  );
}
