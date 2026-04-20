"use client";

import { Check } from "lucide-react";

export default function ProgressBar({ currentStep, steps }) {
  return (
    <div className="w-full mb-12 relative pb-8">
      {/* Background track */}
      <div className="absolute top-5 left-0 w-full h-0.5 bg-white/10 -z-10 mt-[2px] rounded-full" />
      {/* Active fill */}
      <div
        className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#F59F01] to-[#F59F01]/60 -z-10 mt-[2px] transition-all duration-500 ease-in-out rounded-full"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />

      <div className="flex justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep - 1;
          const isActive = index === currentStep - 1;
          return (
            <div key={step.id} className="flex flex-col items-center relative w-1/6">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2
                  ${isCompleted
                    ? 'bg-[#F59F01] border-[#F59F01] text-[#100226]'
                    : isActive
                      ? 'bg-[#100226] border-[#F59F01] text-[#F59F01] shadow-[0_0_16px_rgba(245,159,1,0.35)]'
                      : 'bg-white/5 border-white/10 text-white/30'
                  }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>

              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-24 text-center">
                <span className={`text-xs font-medium transition-colors duration-300
                  ${isActive ? 'text-[#F59F01]' : isCompleted ? 'text-white/70' : 'text-white/25'}`}>
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
