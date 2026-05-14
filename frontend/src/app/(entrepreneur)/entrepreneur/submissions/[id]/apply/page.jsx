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
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-12">
      <Loader2 className="w-12 h-12 text-ls-compliment animate-spin opacity-40" />
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Syncing Ingestion Sequence...</p>
    </div>
  );

  if (!project || !template) return (
    <div className="min-h-[60vh] flex items-center justify-center p-12 text-center">
      <div className="max-w-md space-y-8">
        <div className="w-20 h-20 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
           <AlertCircle size={40} />
        </div>
        <h1 className="text-4xl font-serif font-light text-foreground uppercase tracking-tight">Registry <span className="italic">Error</span></h1>
        <p className="text-text-muted font-serif italic">Protocol initialization failed. Project not found in ledger.</p>
      </div>
    </div>
  );

  const currentStep = template.steps[currentStepIndex];
  const completedStepCount = project?.form_step_completed ?? 0;
  const progress = ((currentStepIndex + 1) / template.steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-20 pb-32 theme-transition">
      {/* Header - Institutional Header */}
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-4 text-ls-compliment text-[10px] font-bold uppercase tracking-[0.5em]">
          <CheckCircle2 size={14} /> Strategic Ingestion Protocol
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground tracking-tight leading-tight">
          {project.legal_name.split(' ').map((word, i) => i === 0 ? <span key={i}>{word} </span> : <span key={i} className="italic">{word} </span>)}
        </h1>
      </div>

      {/* Progress Ledger */}
      <div className="space-y-12">
        <div className="flex justify-between items-center px-4 relative">
          {template.steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center gap-6 relative z-10 group">
              <button
                onClick={() => {
                  if (idx < completedStepCount || idx === currentStepIndex) {
                    setCurrentStepIndex(idx);
                  }
                }}
                disabled={idx >= completedStepCount && idx !== currentStepIndex}
                className={`w-12 h-12 border flex items-center justify-center text-[11px] font-bold transition-all
                  ${idx === currentStepIndex 
                    ? 'bg-ls-compliment text-ls-primary border-ls-compliment shadow-2xl shadow-ls-compliment/20 scale-110' 
                    : idx < completedStepCount 
                    ? 'bg-ls-up/10 text-ls-up border-ls-up/20 hover:bg-ls-up/20'
                    : 'bg-foreground/5 text-text-muted/40 border-border-theme'
                }`}
              >
                {idx < completedStepCount ? <Check size={18} strokeWidth={3} /> : `0${idx + 1}`}
              </button>
              <span className={`text-[9px] uppercase tracking-[0.3em] font-bold ${idx === currentStepIndex ? 'text-ls-compliment' : 'text-text-muted/40'}`}>
                {s.title.split(' ')[0]}
              </span>
            </div>
          ))}
          {/* Connecting Ledger Line */}
          <div className="absolute left-0 right-0 h-px bg-border-theme -z-0 top-6 mx-16 opacity-30" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <p className="text-[10px] text-text-muted uppercase tracking-[0.4em] font-bold">
              Sequence Unit: <span className="text-foreground">{currentStep.title}</span>
            </p>
            <p className="text-[10px] text-ls-compliment font-bold tracking-widest">{Math.round(progress)}% PROTOCOL SYNC</p>
          </div>
          <div className="h-0.5 w-full bg-border-theme overflow-hidden">
            <motion.div 
              className="h-full bg-ls-compliment"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>
        </div>
      </div>

      {/* Form Dossier */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.step_name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-card border border-border-theme p-12 md:p-20 shadow-2xl theme-transition relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-ls-compliment/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          
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

      <div className="flex justify-between items-center pt-8">
        <button
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className={`flex items-center gap-4 px-10 py-5 text-[10px] font-bold uppercase tracking-[0.4em] transition-all border border-border-theme hover:bg-ls-primary hover:text-ls-white ${
            currentStepIndex === 0 
              ? 'opacity-0 pointer-events-none' 
              : 'text-text-muted'
          }`}
        >
          <ChevronLeft size={16} /> Previous Sequence
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
      schemaShape[field.name] = field.required ? z.any().refine(val => !!val, 'Upload required') : z.any().optional();
    } else if (field.type === 'checkbox') {
      schemaShape[field.name] = field.required ? z.boolean().refine(v => v === true, 'Consent required') : z.boolean().optional();
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
        toast.error('Protocol Incomplete: ' + missingList);
        setSubmitting(false);
        return;
      }

      if (isLast) {
        try {
          await api.post('/entrepreneur/submissions/' + projectId + '/finalize/');
          toast.success('Dossier Finalized');
          onFinalSubmit();
        } catch (finalErr) {
          toast.error('Failed to finalize ingestion protocol.');
        }
      } else {
        onStepSaved(step.step_index, data, stepRes.data.step_completed);
        toast.success(step.title + ' Ingested');
        onSuccess();
      }
    } catch (err) {
      toast.error('Dossier update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-16">
        <div className="space-y-6">
          <h2 className="text-4xl font-serif font-light text-foreground tracking-tight uppercase leading-tight">
            Unit <span className="italic">Briefing</span>
          </h2>
          <p className="text-lg font-serif italic text-text-muted leading-relaxed max-w-2xl">{step.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {step.fields.map(field => (
            <FormField key={field.name} field={field} projectId={projectId} stepName={step.step_name} />
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-6 bg-ls-compliment text-ls-primary font-bold uppercase tracking-[0.5em] py-8 hover:bg-ls-white transition-all disabled:opacity-50 shadow-2xl shadow-ls-compliment/10"
        >
          {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
            <>
              {isLast ? 'Execute Final Ingestion' : 'Commit & Proceed'} 
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

  const commonCls = "w-full bg-foreground/[0.02] border border-border-theme p-6 text-foreground text-base font-serif italic outline-none focus:border-ls-compliment focus:bg-ls-primary/[0.02] transition-all placeholder:text-text-muted/20";

  return (
    <div className="space-y-6">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-ls-compliment" />
        {field.label} {field.required && <span className="text-ls-compliment">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea {...register(field.name)} className={commonCls + " min-h-[180px] resize-none"} />
      ) : field.type === 'select' ? (
        <select {...register(field.name)} className={commonCls + " appearance-none"}>
          <option value="" disabled>Select Registry Option...</option>
          {field.choices?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-6 cursor-pointer group bg-foreground/[0.01] p-8 border border-border-theme hover:bg-ls-primary transition-all">
          <input type="checkbox" {...register(field.name)} className="w-6 h-6 border-border-theme bg-background text-ls-compliment focus:ring-ls-compliment/50" />
          <span className="text-[10px] font-bold text-text-muted group-hover:text-ls-white transition-colors uppercase tracking-[0.3em]">{field.label}</span>
        </label>
      ) : field.type === 'file_upload' ? (
        <div className="space-y-6">
          <FileUploader 
            projectId={projectId}
            category={field.category || 'OTHER'} 
            isLocal={true}
            uploadUrl={`/entrepreneur/submissions/${projectId}/upload-local/`}
            label={field.label}
            hideCategory={true}
            value={fieldValue}
            onSuccess={async (docId) => {
              setValue(field.name, docId, { shouldValidate: true });
              clearErrors(field.name);
              try {
                const currentData = getValues();
                currentData[field.name] = docId;
                await api.post(`/entrepreneur/submissions/${projectId}/step/${stepName}/`, currentData);
              } catch(e) {}
            }}
            onRemove={() => {
              setValue(field.name, "", { shouldValidate: true });
              clearErrors(field.name);
            }}
          />
          {fieldValue && (
            <div className="text-[9px] text-ls-up font-bold uppercase tracking-[0.3em] flex items-center gap-4 border-l border-ls-up pl-6 py-2">
              <CheckCircle2 size={14} /> Integrity Verified: Archival Document Ingested
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
      {errors[field.name] && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-4 flex items-center gap-3"><AlertCircle size={14}/> {errors[field.name].message}</p>}
    </div>
  );
}
