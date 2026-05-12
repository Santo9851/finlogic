"use client";

import React from 'react';

export default function Step5Partnership({ register, errors }) {
  const inputCls = "w-full px-6 py-4 bg-foreground/[0.03] border border-border-theme rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 focus:border-[#F59F01] transition-all font-medium shadow-inner";
  const labelCls = "block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60 mb-2";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Harmonious Partnerships</h2>
        <p className="text-text-muted text-sm font-medium">Define your strategic ecosystem and what you seek from Finlogic&apos;s institutional network.</p>
      </div>

      <div className="space-y-6 text-left">
        <div className="space-y-2">
             <label className={labelCls}>
            List existing partners, advisors, or key stakeholders.
          </label>
          <textarea
            {...register('existing_partners')}
            rows={3}
            className={inputCls}
            placeholder="(Optional) Strategic alliances, mentors, or institutional advisors..."
          />
        </div>

        <div className="space-y-2">
           <label className={labelCls}>
            Describe your relationships with suppliers or distribution partners.
          </label>
          <textarea
            {...register('supplier_relations')}
            rows={3}
            className={inputCls}
            placeholder="(Optional) Dependency levels, exclusivity agreements, or supply chain resilience..."
          />
        </div>

        <div className="space-y-2">
           <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">
            What kind of strategic partnership do you seek from an investor? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('investor_expectations')}
            rows={4}
            className={`w-full px-6 py-4 bg-foreground/[0.03] border ${errors.investor_expectations ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all shadow-inner font-medium`}
            placeholder="Beyond capital, what institutional value, network access, or strategic mentorship do you require?"
          />
          {errors.investor_expectations && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.investor_expectations.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
