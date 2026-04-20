"use client";

import React from 'react';

export default function Step2Growth({ register, errors }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-inter text-white mb-2">Wisdom-Backed Growth</h2>
        <p className="text-gray-400 text-sm">Outline your business model and path to scale.</p>
      </div>

      <div className="space-y-4 text-left">
        <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">
            Explain your business model and how it generates revenue. <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('business_model')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.business_model ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="e.g., We use a SaaS subscription model with tiered pricing..."
          />
          {errors.business_model && (
            <p className="mt-1 text-sm text-red-500">{errors.business_model.message}</p>
          )}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            How do you plan to scale? What are the key growth drivers? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('scale_plan')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.scale_plan ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="Expansion into neighboring regions, strategic partnerships..."
          />
          {errors.scale_plan && (
            <p className="mt-1 text-sm text-red-500">{errors.scale_plan.message}</p>
          )}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            Describe any ethical practices or social impact initiatives.
          </label>
          <textarea
            {...register('social_impact')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.social_impact ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="(Optional) e.g., We commit 1% of equity to local educational programs..."
          />
          {errors.social_impact && (
            <p className="mt-1 text-sm text-red-500">{errors.social_impact.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
