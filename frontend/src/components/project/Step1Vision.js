"use client";

import React from 'react';

export default function Step1Vision({ register, errors }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-inter text-white mb-2">Unconventional Vision</h2>
        <p className="text-gray-400 text-sm">Define the problem space and your unique approach.</p>
      </div>

      <div className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            What problem are you solving that others ignore? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('problem_solving')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.problem_solving ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="e.g., Despite the rise in mobile banking throughout South Asia, rural communities remain..."
          />
          {errors.problem_solving && (
            <p className="mt-1 text-sm text-red-500">{errors.problem_solving.message}</p>
          )}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            Describe your target market – why is it underserved or overlooked? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('target_market')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.target_market ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="Detailed description of your core demographics..."
          />
          {errors.target_market && (
            <p className="mt-1 text-sm text-red-500">{errors.target_market.message}</p>
          )}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            Who are your competitors, and why is your approach different? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('competitors')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.competitors ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="List direct and indirect competitors, highlighting your distinct advantage..."
          />
          {errors.competitors && (
            <p className="mt-1 text-sm text-red-500">{errors.competitors.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
