"use client";

import React from 'react';

export default function Step5Partnership({ register, errors }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-inter text-white mb-2">Harmonious Partnerships</h2>
        <p className="text-gray-400 text-sm">Tell us about your ecosystem and what you seek from Finlogic.</p>
      </div>

      <div className="space-y-4 text-left">
        <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">
            List existing partners, advisors, or key stakeholders.
          </label>
          <textarea
            {...register('existing_partners')}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 focus:border-[#B99555] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors"
            placeholder="(Optional) Strategic alliances, mentors..."
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            Describe your relationships with suppliers, distributors, or other partners.
          </label>
          <textarea
            {...register('supplier_relations')}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 focus:border-[#B99555] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors"
            placeholder="(Optional) Dependency levels, exclusivity agreements..."
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            What kind of partnership are you seeking from an investor? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('investor_expectations')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.investor_expectations ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="Beyond capital, what strategic value, network, or mentorship do you need?"
          />
          {errors.investor_expectations && (
            <p className="mt-1 text-sm text-red-500">{errors.investor_expectations.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
