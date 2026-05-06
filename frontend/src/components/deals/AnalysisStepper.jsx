import React, { useEffect, useState } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

const steps = [
  { id: 'Extraction', label: 'Data Extraction' },
  { id: 'QoE', label: 'QoE Analysis' },
  { id: 'Commercial', label: 'Commercial' },
  { id: 'Operational', label: 'Operational' },
  { id: 'Compliance', label: 'Compliance' },
  { id: 'Legal Scan', label: 'Legal Scan' },
  { id: 'Scoring', label: 'Risk Scoring' },
  { id: 'Memo', label: 'Memo Draft' },
];

export default function AnalysisStepper({ progress = {} }) {
  const activeSteps = steps.filter(step => progress?.hasOwnProperty(step.id));
  const hasActiveTask = activeSteps.some(step => progress[step.id] === 'processing' || progress[step.id] === 'pending');
  const hasFailedTask = activeSteps.some(step => progress[step.id] === 'failed');

  // Initial visibility should be true if tasks are active
  const [isVisible, setIsVisible] = useState(hasActiveTask || Object.keys(progress).length > 0);
  
  const completedCount = activeSteps.filter(step => progress[step.id] === 'completed').length;
  const totalCount = activeSteps.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Auto-hide logic
  useEffect(() => {
    if (!progress || Object.keys(progress).length === 0) {
      setIsVisible(false);
      return;
    }

    // Force visible if any task is active (processing or pending)
    if (hasActiveTask) {
      setIsVisible(true);
      return;
    }

    // If everything is finished/failed, start the timer to hide
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // Professional 10s wait
    
    return () => clearTimeout(timer);
  }, [JSON.stringify(progress), hasActiveTask]);

  if (!isVisible || activeSteps.length === 0) return null;

  return (
    <div className="bg-[#0f172a] border border-white/5 rounded-lg p-5 mb-8 animate-in fade-in slide-in-from-top-2 duration-700 shadow-2xl relative overflow-hidden group font-sans">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Top Header Section */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] px-1.5 py-0.5 bg-blue-400/10 rounded border border-blue-400/20">
              Intelligence
            </span>
            <h3 className="text-sm font-semibold text-white/90 tracking-tight">
              AI Analysis Pipeline
            </h3>
          </div>
          <p className="text-[10px] text-white/30 mt-1 font-medium tracking-wide">
            {hasActiveTask ? 'Synthesizing portfolio data...' : hasFailedTask ? 'Analysis interrupted.' : 'Portfolio intelligence ready.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-white/80 tabular-nums leading-none">{Math.round(progressPercentage)}%</span>
            <span className="text-[8px] text-white/20 uppercase tracking-[0.1em] font-black mt-1">Complete</span>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white/10 hover:text-white/40 transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Modern Sleek Progress Bar */}
      <div className="w-full h-[2px] bg-white/5 rounded-full mb-6 relative overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-1000 ease-out relative"
          style={{ width: `${progressPercentage}%` }}
        >
          {hasActiveTask && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
          )}
        </div>
      </div>

      {/* Step Status Grid - Minimal & Professional */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 relative z-10">
        {activeSteps.map((step) => {
          const status = (progress && progress[step.id]) || 'pending';
          const isCompleted = status === 'completed';
          const isProcessing = status === 'processing';
          const isFailed = status === 'failed';
          
          return (
            <div key={step.id} className="flex items-center gap-3 group/item">
              <div className={`
                flex-shrink-0 w-4 h-4 rounded-sm flex items-center justify-center transition-all duration-300
                ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                  isFailed ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  isProcessing ? 'bg-blue-500/5 text-blue-400 border border-blue-500/20 pulse-gentle' : 
                  'bg-white/5 text-white/5 border border-white/5'}
              `}>
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5" />
                ) : isFailed ? (
                  <X className="w-2.5 h-2.5" />
                ) : isProcessing ? (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                ) : (
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                )}
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className={`
                  text-[10px] font-semibold tracking-wide truncate transition-colors duration-300
                  ${isProcessing ? 'text-white' : isFailed ? 'text-red-400' : isCompleted ? 'text-white/50' : 'text-white/10'}
                `}>
                  {step.label}
                </span>
                {isProcessing && (
                  <span className="text-[8px] text-blue-400/50 uppercase tracking-widest font-bold leading-none mt-0.5">
                    Analyzing
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasFailedTask && (
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
        <AlertCircle className="w-3 h-3 text-red-400" />
          <span className="text-[9px] text-red-400/70 font-bold uppercase tracking-[0.05em]">
            System Alert: Pipeline interrupted. Manual review suggested.
          </span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
        .pulse-gentle {
          animation: pulse-gentle 2s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}
