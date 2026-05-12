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
import { useTheme } from 'next-themes';

export default function AuthMultiStepForm() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // Local cache of step responses
  const [localResponses, setLocalResponses] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get(`/entrepreneur/submissions/${projectId}/`);
        setProject(res.data);
        setTemplate(res.data.active_template);
        if (res.data.submitted_at) {
           router.replace('/entrepreneur/dashboard');
           return;
        }
        const seed = {};
        (res.data.form_responses || []).forEach(r => {
          seed[r.step_index] = r.response_data;
        });
        setLocalResponses(seed);
        const savedStep = res.data.form_step_completed || 0;
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

  const onStepSaved = (stepIndex, data, newStepCompleted) => {
    setLocalResponses(prev => ({ ...prev, [stepIndex]: data }));
    if (newStepCompleted !== undefined) {
      setProject(prev => prev ? { ...prev, form_step_completed: newStepCompleted } : prev);
    }
  };

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
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Project Not Found</h1>
        <p className="text-text-muted text-sm font-medium">We couldn't find the application form for this project.</p>
      </div>
    </div>
  );

  const currentStep = template.steps[currentStepIndex];
  const completedStepCount = project?.form_step_completed ?? 0;
  const progress = ((currentStepIndex + 1) / template.steps.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20 theme-transition">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#F59F01]/10 border border-[#F59F01]/20 text-[#F59F01] text-[10px] uppercase tracking-[0.2em] font-black mb-2">
          Institutional Submission
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter leading-none">{project.legal_name}</h1>
      </div>

      {/* Progress */}
      <div className="space-y-10">
        <div className="flex justify-between items-center px-4 relative">
          {template.steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
              <button
                onClick={() => {
                  if (idx < completedStepCount || idx === currentStepIndex) {
                    setCurrentStepIndex(idx);
                  }
                }}
                disabled={idx >= completedStepCount && idx !== currentStepIndex}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all border ${
                  idx === currentStepIndex 
                    ? 'bg-[#F59F01] text-ls-primary-fixed border-[#F59F01] shadow-2xl shadow-[#F59F01]/40 scale-110' 
                    : idx < completedStepCount 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-foreground/5 text-text-muted/40 border-border-theme'
                }`}
              >
                {idx < completedStepCount ? <Check size={16} strokeWidth={3} /> : idx + 1}
              </button>
              <span className={`text-[9px] uppercase tracking-[0.1em] font-black ${idx === currentStepIndex ? 'text-foreground' : 'text-text-muted/40'}`}>
                {s.title.split(' ')[0]}
              </span>
            </div>
          ))}
          {/* Connecting Line */}
          <div className="absolute left-0 right-0 h-px bg-border-theme -z-0 top-5 mx-12 opacity-50" />
        </div>

        <div className="space-y-3 px-2">
          <div className="flex justify-between items-end">
            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black opacity-60">
              {currentStep.title}
            </p>
            <p className="text-xs text-[#F59F01] font-black">{Math.round(progress)}%</p>
          </div>
          <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden border border-border-theme/50 shadow-inner">
            <motion.div 
              className="h-full bg-[#F59F01]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.step_name}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="bg-card border border-border-theme rounded-[3rem] p-8 sm:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] theme-transition"
        >
          <StepForm 
            projectId={projectId} 
            step={currentStep} 
            savedData={localResponses[currentStep.step_index] || {}}
            onSuccess={nextStep}
            onStepSaved={onStepSaved}
            isLast={currentStepIndex === template.steps.length - 1}
            onFinalSubmit={() => router.push('/entrepreneur/dashboard?msg=submitted')}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center pt-6 px-4">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            currentStepIndex === 0 
              ? 'opacity-0 pointer-events-none' 
              : 'text-text-muted hover:text-foreground hover:bg-foreground/5 border border-transparent hover:border-border-theme'
          }`}
        >
          <ChevronLeft size={18} /> Back
        </button>
      </div>
    </div>
  );
}

function StepForm({ projectId, step, savedData, onSuccess, onStepSaved, isLast, onFinalSubmit }) {
  const [submitting, setSubmitting] = useState(false);
  
  const schemaShape = {};
  step.fields.forEach(field => {
    if (field.type === 'file_upload') {
      schemaShape[field.name] = field.required ? z.any().refine(val => !!val, 'Please upload a document') : z.any().optional();
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
    defaultValues: savedData || {} 
  });

  useEffect(() => {
    if (savedData) {
      methods.reset(savedData);
    }
  }, [savedData, methods]);

const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const url = '/entrepreneur/submissions/' + projectId + '/step/' + step.step_name + '/';
      const stepRes = await api.post(url, data);

      if (!stepRes.data.can_advance && stepRes.data.missing_required && stepRes.data.missing_required.length > 0) {
        const missingList = stepRes.data.missing_required.join(', ');
        toast.error('Please complete required fields: ' + missingList);
        setSubmitting(false);
        return;
      }

      if (isLast) {
        try {
          await api.post('/entrepreneur/submissions/' + projectId + '/finalize/');
          toast.success('Submission complete!');
          onFinalSubmit();
        } catch (finalErr) {
          const missing = finalErr.response && finalErr.response.data && finalErr.response.data.missing_required;
          if (missing && missing.length > 0) {
            const missingByStep = {};
            missing.forEach(function(m) {
              if (!missingByStep[m.step]) missingByStep[m.step] = [];
              missingByStep[m.step].push(m.label);
            });
            const msg = Object.keys(missingByStep).map(function(step) {
              return step + ': ' + missingByStep[step].join(', ');
            }).join('\n');
            toast.error('Please complete all required fields:\n' + msg);
          } else {
            const errMsg = finalErr.response && finalErr.response.data && finalErr.response.data.detail;
            toast.error(errMsg || 'Failed to finalize submission.');
          }
        }
      } else {
        onStepSaved(step.step_index, data, stepRes.data.step_completed);
        toast.success(step.title + ' saved');
        onSuccess();
      }
    } catch (err) {
      const missing = err.response && err.response.data && err.response.data.missing_required;
      if (missing && missing.length > 0) {
        const missingList = missing.map(function(m) { return m.label || m; }).join(', ');
        toast.error('Please complete required fields: ' + missingList);
      } else {
        const errMsg = err.response && err.response.data && err.response.data.detail;
        toast.error(errMsg || 'Failed to save step.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-10">
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{step.title}</h2>
          <p className="text-text-muted text-sm font-medium leading-relaxed">{step.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {step.fields.map(field => (
            <FormField key={field.name} field={field} projectId={projectId} stepName={step.step_name} />
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 bg-[#F59F01] text-ls-primary-fixed font-black uppercase tracking-[0.1em] py-5 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 shadow-2xl shadow-[#F59F01]/20"
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              {isLast ? 'Execute Final Submission' : 'Save & Continue'} 
              {!isLast && <ChevronRight size={20} strokeWidth={3} />}
            </>
          )}
        </button>
      </form>
    </FormProvider>
  );
}

function FormField({ field, projectId, stepName }) {
  const { register, formState: { errors }, setValue, watch, clearErrors, getValues } = useFormContext();
  const fieldValue = watch(field.name);

  const commonCls = "w-full bg-foreground/[0.03] border border-border-theme rounded-2xl px-6 py-4 text-foreground text-sm font-medium outline-none focus:border-[#F59F01]/50 focus:bg-foreground/[0.05] transition-all placeholder:text-text-muted/30";

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">
        {field.label} {field.required && <span className="text-[#F59F01] ml-1">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea {...register(field.name)} className={commonCls + " min-h-[140px] resize-none"} />
      ) : field.type === 'select' ? (
        <select {...register(field.name)} className={commonCls + " appearance-none"}>
          <option value="" disabled>Select option...</option>
          {field.choices?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-4 cursor-pointer group bg-foreground/[0.03] p-4 rounded-2xl border border-border-theme hover:bg-foreground/[0.05] transition-all">
          <input type="checkbox" {...register(field.name)} className="w-5 h-5 rounded-lg border-border-theme bg-background text-[#F59F01] focus:ring-[#F59F01]/50" />
          <span className="text-xs font-bold text-text-muted group-hover:text-foreground transition-colors uppercase tracking-widest">{field.label}</span>
        </label>
      ) : field.type === 'file_upload' ? (
        <div className="space-y-4">
          <FileUploader 
            projectId={projectId}
            category={field.category || 'OTHER'} 
            isLocal={true}
            uploadUrl={`/entrepreneur/submissions/${projectId}/upload-local/`}
            label={field.label}
            hideCategory={true}
            value={fieldValue}
            allowedExtensions={
              {
                'audited_financials': '.pdf,.xlsx,.xls',
                'moa_aoa': '.pdf',
                'company_registration': '.pdf',
                'pitch_deck': '.pdf,.pptx',
                'business_plan': '.pdf,.docx'
              }[field.name] || ".pdf,.docx,.xlsx"
            }
            formatText={
              {
                'audited_financials': 'PDF or XLSX',
                'moa_aoa': 'PDF',
                'company_registration': 'PDF',
                'pitch_deck': 'PDF or PPTX',
                'business_plan': 'PDF or DOCX'
              }[field.name] || "PDF, DOCX, or XLSX"
            }
            description={
              field.help_text || {
                'audited_financials': 'Upload audited P&L, Balance Sheet, and Cash Flow statements for the last 3 fiscal years.',
                'moa_aoa': 'The legal charter of your company (Memorandum and Articles of Association).',
                'company_registration': 'Certificate of incorporation or OCR registration certificate.',
                'pitch_deck': 'A presentation deck covering problem, solution, market size, and traction.',
                'business_plan': 'Detailed document outlining strategy, operations, and financial projections.'
              }[field.name] || ""
            }
            onSuccess={async (docId) => {
              setValue(field.name, docId, { shouldValidate: true });
              clearErrors(field.name);
              try {
                const currentData = getValues();
                currentData[field.name] = docId;
                await api.post(`/entrepreneur/submissions/${projectId}/step/${stepName}/`, currentData);
              } catch(e) {
                console.error("Auto-save failed", e);
              }
            }}
            onRemove={() => {
              setValue(field.name, "", { shouldValidate: true });
              clearErrors(field.name);
            }}
          />
          {fieldValue && (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-emerald-500/5 w-fit px-4 py-2 rounded-lg border border-emerald-500/10 shadow-sm">
              <CheckCircle2 size={14} /> Integrity Verified: Document Uploaded
            </div>
          )}
        </div>
      ) : (
        <input 
          type={field.type === 'number' || field.type === 'decimal' ? 'number' : field.type} 
          {...register(field.name)} 
          className={commonCls} 
        />
      )}
      {errors[field.name] && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-1 flex items-center gap-2"><AlertCircle size={12}/> {errors[field.name].message}</p>}
    </div>
  );
}
