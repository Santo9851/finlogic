'use client'

/**
 * (entrepreneur)/submissions/[id]/apply/page.jsx
 * Authenticated multi-step form for entrepreneurs who already have an account.
 */
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronRight, ChevronLeft, Check, 
  Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { toast } from 'sonner';
import FileUploader from '@/components/portal/FileUploader';

export default function AuthMultiStepForm() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get(`/entrepreneur/submissions/${projectId}/`);
        setProject(res.data);
        setTemplate(res.data.active_template);
        // Start at the step the user left off
        const savedStep = res.data.form_step_completed;
        if (res.data.active_template) {
           setCurrentStepIndex(Math.min(savedStep, res.data.active_template.steps.length - 1));
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load project details.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [projectId]);

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
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#F59F01] animate-spin" />
    </div>
  );

  if (!project || !template) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center space-y-4">
      <div className="max-w-md w-full">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white">Project Not Found</h1>
        <p className="text-white/40 text-sm">We couldn't find the application form for this project.</p>
      </div>
    </div>
  );

  const currentStep = template.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / template.steps.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-block px-3 py-1 rounded-full bg-[#F59F01]/10 border border-[#F59F01]/20 text-[#F59F01] text-[10px] uppercase tracking-widest font-bold mb-4">
          Resuming Submission
        </div>
        <h1 className="text-3xl font-bold text-white">{project.legal_name}</h1>
      </div>

      {/* Progress */}
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

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.step_name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
        >
          <StepForm 
            projectId={projectId} 
            step={currentStep} 
            onSuccess={nextStep}
            isLast={currentStepIndex === template.steps.length - 1}
            onFinalSubmit={() => router.push('/entrepreneur/dashboard?msg=submitted')}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center pt-4">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentStepIndex === 0 
              ? 'opacity-0 pointer-events-none' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <ChevronLeft size={18} /> Previous
        </button>
      </div>
    </div>
  );
}

function StepForm({ projectId, step, onSuccess, isLast, onFinalSubmit }) {
  const [submitting, setSubmitting] = useState(false);
  
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
    defaultValues: {} 
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post(`/entrepreneur/submissions/${projectId}/step/${step.step_name}/`, data);
      
      if (isLast) {
        await api.post(`/entrepreneur/submissions/${projectId}/finalize/`);
        toast.success('Submission complete!');
        onFinalSubmit();
      } else {
        toast.success(`${step.title} saved`);
        onSuccess();
      }
    } catch (err) {
      toast.error('Failed to save step.');
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
            <FormField key={field.name} field={field} projectId={projectId} />
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#F59F01] text-black font-bold py-4 rounded-xl hover:bg-[#F59F01]/90 transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
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

function FormField({ field, projectId }) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const fieldValue = watch(field.name);

  const commonCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#F59F01] transition-all";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/70">
        {field.label} {field.required && <span className="text-[#F59F01]">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea {...register(field.name)} className={commonCls + " min-h-[100px]"} />
      ) : field.type === 'select' ? (
        <select {...register(field.name)} className={commonCls}>
          <option value="" disabled className="bg-[#0a0014]">Select...</option>
          {field.choices?.map(c => <option key={c.value} value={c.value} className="bg-[#0a0014]">{c.label}</option>)}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register(field.name)} className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#F59F01]" />
          <span className="text-sm text-white/50">{field.label}</span>
        </label>
      ) : field.type === 'file_upload' ? (
        <div className="space-y-2">
          <FileUploader 
            projectId={projectId} 
            category={field.category || 'OTHER'} 
            onSuccess={(docId) => setValue(field.name, docId, { shouldValidate: true })}
            label={`Upload ${field.label}`}
          />
          {fieldValue && <div className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> Document Uploaded</div>}
        </div>
      ) : (
        <input 
          type={field.type === 'number' || field.type === 'decimal' ? 'number' : field.type} 
          {...register(field.name)} 
          className={commonCls} 
        />
      )}
      {errors[field.name] && <p className="text-xs text-red-400 mt-1">{errors[field.name].message}</p>}
    </div>
  );
}
