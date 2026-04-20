"use client";

import React from 'react';

export default function Step3Leadership({ register, errors }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-inter text-white mb-2">Leadership Activation</h2>
        <p className="text-gray-400 text-sm">Present the team driving the vision forward.</p>
      </div>

      <div className="space-y-4 text-left">
        <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">
            Tell us about your background and why you&apos;re the right person to lead this venture. <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('background')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.background ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="Details of your domain expertise and passion..."
          />
          {errors.background && (
            <p className="mt-1 text-sm text-red-500">{errors.background.message}</p>
          )}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            List key team members and their roles. <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('team_members')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.team_members ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="John Doe (CTO, 10 YOE), Jane Smith (COO, Ex-McKinsey)..."
          />
          {errors.team_members && (
            <p className="mt-1 text-sm text-red-500">{errors.team_members.message}</p>
          )}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-1">
            What previous entrepreneurial or leadership experience do you have? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('experience')}
            rows={4}
            className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.experience ? 'border-red-500' : 'border-gray-700 focus:border-[#B99555]'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#B99555] transition-colors`}
            placeholder="Details of past ventures, successes, or key lessons from failures..."
          />
          {errors.experience && (
            <p className="mt-1 text-sm text-red-500">{errors.experience.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
