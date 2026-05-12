"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

export default function Step6StandardInfo({ register, errors, setValue, watch }) {
  const pitchDeckFile = watch('pitch_deck_file');
  const financialModelFile = watch('financial_model_file');

  const onDropPitch = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setValue('pitch_deck_file', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const onDropFinancial = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setValue('financial_model_file', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const { getRootProps: getPitchProps, getInputProps: getPitchInputProps, isDragActive: pitchActive } = useDropzone({
    onDrop: onDropPitch,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const { getRootProps: getFinProps, getInputProps: getFinInputProps, isDragActive: finActive } = useDropzone({
    onDrop: onDropFinancial,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const removeFile = (fieldName) => {
    setValue(fieldName, null, { shouldValidate: true });
  };

  const inputCls = "w-full px-6 py-3.5 bg-foreground/[0.03] border border-border-theme rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 focus:border-[#F59F01] transition-all font-medium shadow-inner";
  const labelCls = "block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60 mb-2";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">Institutional Identification</h2>
        <p className="text-text-muted text-sm font-medium">Provide your contact details and official institutional documents for review.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
        {/* Left Column: Basic Info */}
        <div className="space-y-6">
          <div className="space-y-1">
            <label className={labelCls}>
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('company_name')}
              className={`w-full px-6 py-3.5 bg-foreground/[0.03] border ${errors.company_name ? 'border-red-500' : 'border-border-theme focus:border-[#F59F01]'} rounded-2xl text-foreground placeholder:text-text-muted/30 focus:outline-none focus:ring-1 focus:ring-[#F59F01]/20 transition-all font-medium shadow-inner`}
            />
            {errors.company_name && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.company_name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className={labelCls}>
              Official Website
            </label>
            <input
              type="url"
              {...register('website')}
              placeholder="https://"
              className={inputCls}
            />
             {errors.website && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.website.message}</p>}
          </div>

          <div className="space-y-1">
            <label className={labelCls}>
              Primary Contact Identity <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('contact_name')}
              className={inputCls}
            />
             {errors.contact_name && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.contact_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className={inputCls}
              />
               {errors.email && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelCls}>
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                className={inputCls}
              />
               {errors.phone && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
             <label className={labelCls}>
              Funding Amount Sought (NPR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('funding_amount', { valueAsNumber: true })}
              className={inputCls}
            />
             {errors.funding_amount && <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wide">{errors.funding_amount.message}</p>}
          </div>
        </div>

        {/* Right Column: File Uploads */}
        <div className="space-y-8">
          
          {/* Pitch Deck Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">
              Institutional Pitch Deck <span className="text-red-500">*</span>
            </label>
            
            {pitchDeckFile ? (
               <div className="flex items-center justify-between p-6 bg-foreground/[0.05] border border-border-theme rounded-2xl shadow-lg animate-in zoom-in-95 duration-300">
                 <div className="flex items-center space-x-4 overflow-hidden">
                   <div className="w-12 h-12 rounded-xl bg-[#F59F01]/10 flex items-center justify-center text-[#F59F01]">
                     <File className="w-6 h-6" />
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-foreground truncate">{pitchDeckFile.name}</p>
                     <p className="text-[10px] text-text-muted uppercase font-black tracking-widest opacity-40">Ready for submission</p>
                   </div>
                 </div>
                 <button 
                  type="button" 
                  onClick={() => removeFile('pitch_deck_file')}
                  className="p-2 bg-foreground/5 rounded-xl text-text-muted hover:text-red-500 transition-all border border-border-theme"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
            ) : (
              <div 
                {...getPitchProps()} 
                className={`border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all duration-300
                  ${pitchActive ? 'border-[#F59F01] bg-[#F59F01]/5 scale-[0.98]' : 'border-border-theme hover:border-[#F59F01]/40 bg-foreground/[0.02] hover:bg-foreground/[0.04]'}`}
              >
                <input {...getPitchInputProps()} />
                <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-text-muted/20 group-hover:text-[#F59F01]/40 transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-black text-foreground uppercase tracking-widest">Drop Pitch Deck</p>
                <p className="text-[10px] text-text-muted font-bold mt-2 uppercase tracking-tighter opacity-40">PDF format • Max 10MB</p>
              </div>
            )}
          </div>

          {/* Financial Model Upload */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-foreground uppercase tracking-[0.2em] mb-4">
              Financial Model <span className="text-text-muted font-black text-[10px] ml-2 opacity-30 tracking-widest">(OPTIONAL)</span>
            </label>
            
            {financialModelFile ? (
               <div className="flex items-center justify-between p-6 bg-foreground/[0.05] border border-border-theme rounded-2xl shadow-lg animate-in zoom-in-95 duration-300">
                 <div className="flex items-center space-x-4 overflow-hidden">
                   <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <File className="w-6 h-6" />
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-bold text-foreground truncate">{financialModelFile.name}</p>
                     <p className="text-[10px] text-text-muted uppercase font-black tracking-widest opacity-40">Financial analysis attached</p>
                   </div>
                 </div>
                 <button 
                  type="button" 
                  onClick={() => removeFile('financial_model_file')}
                  className="p-2 bg-foreground/5 rounded-xl text-text-muted hover:text-red-500 transition-all border border-border-theme"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
            ) : (
              <div 
                {...getFinProps()} 
                className={`border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all duration-300
                  ${finActive ? 'border-emerald-500 bg-emerald-500/5 scale-[0.98]' : 'border-border-theme hover:border-emerald-500/40 bg-foreground/[0.02] hover:bg-foreground/[0.04]'}`}
              >
                <input {...getFinInputProps()} />
                <div className="w-16 h-16 bg-foreground/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-text-muted/20 group-hover:text-emerald-500/40 transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-black text-foreground uppercase tracking-widest">Drop Financial Model</p>
                <p className="text-[10px] text-text-muted font-bold mt-2 uppercase tracking-tighter opacity-40">Excel format (.xls, .xlsx)</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
