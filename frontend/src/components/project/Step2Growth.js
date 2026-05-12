"use client";

import React from 'react';

export default function Step2Growth({ register, errors }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Wisdom-Backed Growth</h2>
        <p className="text-text-muted text-sm font-medium">Outline your institutional business model and path to sustainable scale.</p>
      </div>

      <div className="space-y-6 text-left">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            Explain your business model and revenue streams. <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('business_model')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.business_model ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="e.g., We utilise a SaaS subscription model with tiered pricing and enterprise-grade SLA..."
          />
          {errors.business_model && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.business_model.message}</p>
          )}
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            How do you plan to scale? What are the growth drivers? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('scale_plan')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.scale_plan ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="Expansion into neighbouring regions, strategic partnerships, and AI-driven efficiency..."
          />
          {errors.scale_plan && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.scale_plan.message}</p>
          )}
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            Describe any ethical practices or social impact initiatives.
          </label>
          <textarea
            {...register('social_impact')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.social_impact ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="(Optional) e.g., We commit 1% of equity to local educational programs and ESG compliance..."
          />
          {errors.social_impact && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.social_impact.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
