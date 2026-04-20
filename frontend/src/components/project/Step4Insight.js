"use client";

import React from 'react';

export default function Step4Insight({ register, errors }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-inter text-white mb-2">Deep Insight</h2>
        <p className="text-gray-400 text-sm">Share your core metrics, market feedback, and potential risks.</p>
      </div>

      <div className="space-y-6 text-left">
        <div>
           <label className="block text-sm font-medium text-gray-300 mb-2 border-b border-gray-800 pb-2">
            Key Metrics (if applicable)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Revenue (Last 3 Years)</label>
              <input
                type="text"
                {...register('revenue_metrics')}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B99555]"
                placeholder="e.g., $100k, $250k, $500k"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Growth Rate (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('growth_rate', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B99555]"
                placeholder="e.g., 25.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Gross Margins (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('gross_margins', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B99555]"
                placeholder="e.g., 65.0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Customer Acquisition Cost (CAC)</label>
              <input
                type="number"
                step="0.01"
                {...register('customer_acquisition_cost', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B99555]"
                placeholder="e.g., 150.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Lifetime Value (LTV)</label>
              <input
                type="number"
                step="0.01"
                {...register('lifetime_value', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B99555]"
                placeholder="e.g., 1200.00"
              />
            </div>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            Share any customer feedback or testimonials.
          </label>
          <textarea
            {...register('feedback')}
            rows={3}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.feedback ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="(Optional) Quotes or summary of market response..."
          />
          {errors.feedback && (
            <p className="mt-1 text-sm text-red-500">{errors.feedback.message}</p>
          )}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            Are there any hidden risks we should be aware of?
          </label>
          <textarea
            {...register('risks')}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 focus:border-[#B99555] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors"
            placeholder="(Optional) Regulatory hurdles, supply chain dependencies..."
          />
        </div>
      </div>
    </div>
  );
}
