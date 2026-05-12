"use client";

import React from 'react';

export default function Step1Vision({ register, errors }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Unconventional Vision</h2>
        <p className="text-text-muted text-sm font-medium">Define the problem space and your unique institutional approach.</p>
      </div>

      <div className="space-y-6 text-left">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            What problem are you solving that others ignore? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('problem_solving')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.problem_solving ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="e.g., Despite the rise in mobile banking, rural communities remain underserved due to..."
          />
          {errors.problem_solving && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.problem_solving.message}</p>
          )}
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            Describe your target market – why is it overlooked? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('target_market')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.target_market ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="Detailed description of your core demographics and market inefficiencies..."
          />
          {errors.target_market && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.target_market.message}</p>
          )}
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            Who are your competitors, and why is your approach different? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('competitors')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.competitors ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="List direct/indirect competitors and your distinct strategic advantage..."
          />
          {errors.competitors && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.competitors.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
