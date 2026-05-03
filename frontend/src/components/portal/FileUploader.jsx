'use client'

/**
 * FileUploader.jsx
 * Reusable component for B2 document uploads.
 * Handles:
 * 1. Requesting pre-signed POST URL
 * 2. Uploading to B2
 * 3. Confirming with backend
 */
import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

// --- Local UI Shims (Since shadcn isn't installed) ---
const Progress = ({ value }) => (
  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
    <div 
      className="h-full bg-[#F59F01] transition-all duration-300" 
      style={{ width: `${value}%` }} 
    />
  </div>
);

const Alert = ({ children, variant = 'default' }) => {
  const bg = variant === 'destructive' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20';
  const text = variant === 'destructive' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className={`p-4 rounded-lg border ${bg} ${text} flex gap-3 text-sm`}>
      {children}
    </div>
  );
};

export default function FileUploader({ 
  projectId, 
  fundId,
  category, 
  token = null, 
  onSuccess = () => {},
  label = "Upload Document",
  hideCategory = false,
  isLocal = false,
  uploadUrl = '',
  value = null,
  description = "",
  allowedExtensions = ".pdf,.docx,.xlsx,.png,.jpg,.jpeg",
  formatText = "PDF, DOCX, or Image",
  onRemove = () => {}
}) {
  const [file, setFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(category || 'OTHER');
  // If a value (document_id) is already saved from a previous session, start in success state.
  const [status, setStatus] = useState(value ? 'success' : 'idle'); 
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Keep status in sync with external value prop changes.
  useEffect(() => {
    if (value && status === 'idle') {
      setStatus('success');
    } else if (!value && status === 'success') {
      setStatus('idle');
    }
  }, [value]);

  const CATEGORIES = [
    { value: 'INCORPORATION', label: 'Incorporation Documents' },
    { value: 'FINANCIALS', label: 'Financial Statements' },
    { value: 'TAX_CLEARANCE', label: 'Tax Clearance' },
    { value: 'KYC', label: 'KYC Documents' },
    { value: 'OTHER', label: 'Other' },
  ];

  const reset = () => {
    setFile(null);
    setSelectedCategory(category || 'OTHER');
    setStatus('idle');
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 3 * 1024 * 1024) {
        setError('File size exceeds the 3MB limit.');
        toast.error('File too large (Max 3MB)');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    // Handle Local Upload (Direct Multipart to Django)
    if (isLocal) {
      setStatus('uploading');
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', selectedCategory);

        const res = await api.post(uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(pct);
          },
        });

        setStatus('success');
        toast.success(`${file.name} uploaded successfully.`);
        onSuccess(res.data.document_id);
        return;
      } catch (err) {
        console.error('Local Upload Error:', err);
        setStatus('error');
        setError(err.response?.data?.detail || err.message || 'Upload failed');
        toast.error('Upload failed');
        return;
      }
    }

    // Handle B2 Upload (Pre-signed URL flow)
    setStatus('presigning');
    try {
      // 1. Get Pre-signed URL
      let urlPath = '';
      if (token) {
        urlPath = `deals/projects/invite/${token}/get-upload-url/`;
      } else if (fundId) {
        urlPath = `deals/funds/${fundId}/get-upload-url/`;
      } else if (projectId) {
        urlPath = `entrepreneur/submissions/${projectId}/get-upload-url/`;
      }
      
      const res = await api.post(urlPath, {
        filename: file.name,
        file_size: file.size,
        content_type: file.type,
        category: selectedCategory
      });

      const { url, document_id, content_type } = res.data;

      // 2. Upload to B2 via PUT
      setStatus('uploading');
      
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      // For PUT, we must set the Content-Type header to match the pre-signed URL
      xhr.setRequestHeader('Content-Type', content_type || file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            console.error('B2 Upload Error Response:', xhr.responseText);
            reject(new Error(`B2 Error ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          console.error('B2 Network Error - check CORS and Endpoint');
          reject(new Error('Network error: Browser blocked the request to B2 (likely CORS)'));
        };
        
        // Send the file directly as binary data
        xhr.send(file);
      });
      await uploadPromise;

      // 3. Confirm with Backend
      // Only for projects - Fund documents are finalized via the page POST
      if (!fundId) {
        const confirmPath = token
          ? `deals/projects/invite/${token}/documents/${document_id}/confirm/`
          : `deals/projects/${projectId}/documents/${document_id}/confirm/`;
        
        await api.post(confirmPath);
      }

      setStatus('success');
      toast.success(`${file.name} uploaded successfully.`);
      // For funds, we return the file_key and metadata for the parent page to save
      onSuccess(fundId ? {
        file_key: res.data.file_key,
        file_name: file.name,
        file_size: file.size,
        mime_type: res.data.content_type || file.type
      } : document_id);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err.response?.data?.detail || err.message || 'Upload failed');
      toast.error('Upload failed');
    }
  };

  return (
    <div className="space-y-4 w-full">
      {description && (
        <p className="text-[10px] text-white/40 leading-relaxed italic ml-1">
          {description}
        </p>
      )}
      <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
        status === 'idle' ? 'border-white/10 bg-white/2' : 
        status === 'success' ? 'border-green-500/30 bg-green-500/5' :
        status === 'error' ? 'border-red-500/30 bg-red-500/5' : 'border-[#F59F01]/30 bg-[#F59F01]/5'
      }`}>
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {!file ? (
              <>
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-white/30 mt-1">{formatText} (Max 3MB)</p>
                </div>
                <input 
                  type="file" 
                  accept={allowedExtensions}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
              </>
            ) : (
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="bg-[#F59F01]/10 px-4 py-3 rounded-xl flex items-center gap-3 border border-[#F59F01]/20 w-full max-w-sm">
                  <FileText size={20} className="text-[#F59F01] flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-white/40 uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); reset(); }} 
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {!hideCategory && (
                  <div className="w-full max-w-sm space-y-1.5 text-left">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Document Category</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-[#08001a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#F59F01]/40 transition-all appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value} className="bg-[#08001a] text-white">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <button 
                  onClick={(e) => { e.preventDefault(); uploadFile(); }}
                  className="bg-[#F59F01] text-black text-xs font-bold px-8 py-2.5 rounded-lg hover:scale-105 transition-all shadow-lg shadow-[#F59F01]/20"
                >
                  Start Upload
                </button>
              </div>
            )}
          </div>
        )}

        {(status === 'presigning' || status === 'uploading' || status === 'confirming') && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/60 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#F59F01]" />
                {status === 'presigning' && 'Preparing upload...'}
                {status === 'uploading' && `Uploading: ${progress}%`}
                {status === 'confirming' && 'Finalizing...'}
              </span>
            </div>
            <Progress value={status === 'uploading' ? progress : status === 'confirming' ? 100 : 0} />
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
            <CheckCircle2 size={32} className="text-green-500" />
            <p className="text-sm font-medium text-white">Upload Complete</p>
            <button type="button" onClick={(e) => { e.preventDefault(); reset(); }} className="mt-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white transition-colors">Change File</button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-2">
            <Alert variant="destructive">
              <AlertCircle size={18} />
              <div>
                <p className="font-semibold">Upload failed</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </Alert>
            <button 
              onClick={reset}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
