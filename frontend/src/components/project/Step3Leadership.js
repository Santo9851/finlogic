"use client";

import React from 'react';

export default function Step3Leadership({ register, errors }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Leadership Activation</h2>
        <p className="text-text-muted text-sm font-medium">Present the strategic team driving the vision forward.</p>
      </div>

      <div className="space-y-6 text-left">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            Tell us about your background and institutional leadership. <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('background')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.background ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="Details of your domain expertise, strategic passion, and lead-by-example philosophy..."
          />
          {errors.background && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.background.message}</p>
          )}
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            List key team members and their institutional roles. <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('team_members')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.team_members ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="John Doe (CTO, 10 YOE in Fintech), Jane Smith (COO, Ex-Institutional Banking)..."
          />
          {errors.team_members && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.team_members.message}</p>
          )}
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            What previous entrepreneurial or leadership experience do you have? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('experience')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.experience ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="Details of past institutional ventures, market exits, or key strategic lessons..."
          />
          {errors.experience && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.experience.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
