'use client'

/**
 * invite/[token]/page.jsx
 * Public multi-step form for entrepreneurs.
 * No login required; access is via the UUID token.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronRight, ChevronLeft, Check, 
  Upload, FileText, Loader2, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { toast } from 'sonner';

export default function MultiStepInviteForm() {
  const { token } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0-indexed
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch project and form template
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get(`/deals/projects/invite/${token}/`);
        setProject(res.data.project);
        setTemplate(res.data.template);
        // Start at the step the user left off
        const savedStep = res.data.project.form_step_completed;
        setCurrentStepIndex(Math.min(savedStep, res.data.template.steps.length - 1));
      } catch (err) {
        console.error(err);
        toast.error('Invalid or expired invitation link.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const nextStep = () => {
    if (currentStepIndex < template.steps.length - 1) {
      setCurrentStepIndex(v => v + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(v => v - 1);
      window.scrollTo(0, 0);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#060010] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#F59F01] animate-spin" />
    </div>
  );

  if (!project || !template) return (
    <div className="min-h-screen bg-[#060010] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-bold text-white">Invitation Not Found</h1>
        <p className="text-white/40 text-sm">This link may have expired or been completed already.</p>
        <button onClick={() => router.push('/')} className="text-[#F59F01] text-sm hover:underline">Return to homepage</button>
      </div>
    </div>
  );

  const currentStep = template.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / template.steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#060010] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-[#F59F01]/10 border border-[#F59F01]/20 text-[#F59F01] text-[10px] uppercase tracking-widest font-bold mb-4">
            Deal Submission
          </div>
          <h1 className="text-3xl font-bold text-white">{project.legal_name}</h1>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Please complete the following details to proceed with your funding application.
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
              Step {currentStepIndex + 1} of {template.steps.length}: {currentStep.title}
            </p>
            <p className="text-xs text-[#F59F01] font-bold">{Math.round(progress)}%</p>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#F59F01]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.step_name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
            >
              <StepForm 
                token={token} 
                step={currentStep} 
                onSuccess={nextStep}
                isLast={currentStepIndex === template.steps.length - 1}
                onFinalSubmit={() => router.push('/auth/login?msg=submitted')}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0 || submitting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              currentStepIndex === 0 
                ? 'opacity-0 pointer-events-none' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <ChevronLeft size={18} /> Previous
          </button>
          
          <p className="text-[10px] text-white/20 uppercase tracking-tighter hidden sm:block">
            All progress is automatically saved
          </p>
        </div>
      </div>
    </div>
  );
}

function StepForm({ token, step, onSuccess, isLast, onFinalSubmit }) {
  const [submitting, setSubmitting] = useState(false);
  
  // Dynamic Zod schema based on template fields
  const schemaShape = {};
  step.fields.forEach(field => {
    if (field.type === 'file_upload') {
      schemaShape[field.name] = field.required ? z.string().min(1, 'Required') : z.string().optional();
    } else if (field.type === 'checkbox') {
      schemaShape[field.name] = field.required ? z.boolean().refine(v => v === true, 'Required') : z.boolean().optional();
    } else if (field.type === 'integer') {
      schemaShape[field.name] = z.coerce.number().int();
    } else if (field.type === 'decimal') {
      schemaShape[field.name] = z.coerce.number();
    } else if (field.type === 'email') {
      schemaShape[field.name] = z.string().email();
    } else {
      schemaShape[field.name] = field.required ? z.string().min(1, 'Required') : z.string().optional();
    }
  });
  
  const methods = useForm({
    resolver: zodResolver(z.object(schemaShape)),
    defaultValues: {} // Would ideally fetch previously saved values for this step
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // 1. Submit step data
      await api.post(`/deals/projects/invite/${token}/step/${step.step_name}/`, data);
      
      if (isLast) {
        // 2. Final submission if it's the last step
        await api.post(`/deals/projects/invite/${token}/submit/`);
        toast.success('Submission complete! Redirecting...');
        onFinalSubmit();
      } else {
        toast.success(`${step.title} saved`);
        onSuccess();
      }
    } catch (err) {
      toast.error('Failed to save step. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">{step.title}</h2>
          <p className="text-white/40 text-sm">{step.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {step.fields.map(field => (
            <FormField key={field.name} field={field} token={token} />
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#F59F01] text-black font-bold py-4 rounded-xl hover:bg-[#F59F01]/90 transition-all shadow-xl shadow-[#F59F01]/10 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isLast ? 'Finalize Submission' : 'Continue'} 
              {!isLast && <ChevronRight size={18} />}
            </>
          )}
        </button>
      </form>
    </FormProvider>
  );
}

function FormField({ field, token }) {
  const { register, formState: { errors }, setValue, watch } = useForm({
    // We get methods from context if we used FormProvider, but here we're passing props
    // Correcting to use useFormContext
  });
  
  // Actually I need useFormContext to access methods from FormProvider
  return <FormFieldContent field={field} token={token} />;
}

import { useFormContext } from 'react-hook-form';
import FileUploader from '@/components/portal/FileUploader';

function FormFieldContent({ field, token }) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const fieldValue = watch(field.name);

  const commonCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#F59F01]/40 focus:ring-1 focus:ring-[#F59F01]/10 transition-all";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/70">
        {field.label} {field.required && <span className="text-[#F59F01]">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea 
          {...register(field.name)} 
          className={commonCls + " min-h-[120px] resize-none"} 
        />
      ) : field.type === 'select' ? (
        <select {...register(field.name)} className={commonCls}>
          <option value="" disabled className="bg-[#0a0014]">Select option...</option>
          {field.choices?.map(c => (
            <option key={c.value} value={c.value} className="bg-[#0a0014]">{c.label}</option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" {...register(field.name)} className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-[#F59F01] focus:ring-0" />
          <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors leading-tight">
            {field.label}
          </span>
        </label>
      ) : field.type === 'file_upload' ? (
        <div className="space-y-3">
          <FileUploader 
            token={token} 
            category={field.category || 'OTHER'} 
            onSuccess={(docId) => setValue(field.name, docId, { shouldValidate: true })}
            label={`Upload ${field.label}`}
          />
          {fieldValue && (
            <div className="flex items-center gap-2 text-xs text-[#16c784]">
              <CheckCircle2 size={14} />
              <span>Document ID: {fieldValue.substring(0, 8)}...</span>
            </div>
          )}
        </div>
      ) : (
        <input 
          type={field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : (field.type === 'integer' || field.type === 'decimal') ? 'number' : 'text'} 
          {...register(field.name)} 
          step={field.type === 'decimal' ? '0.01' : '1'}
          className={commonCls} 
        />
      )}

      {errors[field.name] && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {errors[field.name].message}
        </p>
      )}
    </div>
  );
}
