import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, Link2, Upload, X } from 'lucide-react';
import { uploadImageToStorage } from '../../services/storageService';

interface CloudImageUploaderProps {
  folder: 'products' | 'banners' | 'categories' | 'branding' | 'flash-sales';
  label?: string;
  helperText?: string;
  multiple?: boolean;
  acceptIco?: boolean;
  onUploaded: (urls: string[]) => void;
}

export function CloudImageUploader({
  folder,
  label = 'Upload Image',
  helperText = 'JPG, PNG, WebP, GIF, SVG, or ICO — fast auto-optimized permanent cloud save.',
  multiple = false,
  acceptIco = false,
  onUploaded,
}: CloudImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [justUploaded, setJustUploaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg('');
    setJustUploaded(false);
    setUploading(true);
    setProgress(8);

    const fileArray = multiple ? Array.from(files) : [files[0]];
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadStatusText(
          fileArray.length > 1
            ? `Processing image ${i + 1} of ${fileArray.length}...`
            : 'Saving image...'
        );
        const url = await uploadImageToStorage(file, folder, (pct) => {
          const overall = Math.max(8, Math.round(((i + pct / 100) / fileArray.length) * 100));
          setProgress(overall);
        });
        uploadedUrls.push(url);
      }
      onUploaded(uploadedUrls);
      setJustUploaded(true);
      window.setTimeout(() => setJustUploaded(false), 3000);
    } catch (err) {
      if (uploadedUrls.length > 0) {
        onUploaded(uploadedUrls);
      }
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not process the selected image. Please try another file or paste an image URL.'
      );
    } finally {
      setUploading(false);
      setProgress(0);
      setUploadStatusText('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleAddManualUrl = () => {
    const rawList = multiple
      ? manualUrl
          .split(/[\n,]+/)
          .map((u) => u.trim())
          .filter(Boolean)
      : [manualUrl.trim()].filter(Boolean);

    if (rawList.length === 0) {
      setErrorMsg('Please enter at least one valid image URL (https://...) or data URL.');
      return;
    }
    const invalid = rawList.find(
      (u) => !u.startsWith('https://') && !u.startsWith('http://') && !u.startsWith('data:image/')
    );
    if (invalid) {
      setErrorMsg('Image URLs must start with https:// or http://.');
      return;
    }

    setErrorMsg('');
    onUploaded(rawList);
    setManualUrl('');
    setShowUrlInput(false);
    setJustUploaded(true);
    window.setTimeout(() => setJustUploaded(false), 3000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#F85606]"
        >
          <Link2 className="w-3 h-3" />
          <span>
            {showUrlInput ? 'Hide URL input' : multiple ? 'Or paste image URLs' : 'Or paste image URL'}
          </span>
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`group cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
          dragging
            ? 'border-[#F85606] bg-[#FFF5F0]'
            : justUploaded
            ? 'border-emerald-400 bg-emerald-50/50'
            : 'border-slate-300 bg-slate-50/70 hover:border-[#F85606] hover:bg-[#FFF9F6]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={
            acceptIco || folder === 'branding'
              ? 'image/*,.ico'
              : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/bmp'
          }
          multiple={multiple}
          onChange={(e) => void handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              justUploaded
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-white border border-slate-200 text-[#F85606] shadow-xs group-hover:border-[#F85606]/50'
            }`}
          >
            {justUploaded ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : multiple ? (
              <ImagePlus className="w-5 h-5" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 group-hover:border-[#F85606] rounded-lg text-xs font-semibold text-slate-800 shadow-xs">
              {uploading
                ? `${uploadStatusText} ${progress}%`
                : justUploaded
                ? 'Uploaded & Saved!'
                : multiple
                ? 'Choose or Drop Unlimited Photos'
                : 'Choose or Drop Image File'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            {helperText}
          </p>
        </div>

        {uploading && (
          <div className="mt-3 max-w-xs mx-auto h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F85606] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {showUrlInput && (
        <div className="space-y-2 pt-1">
          {multiple ? (
            <textarea
              rows={3}
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder={'Paste one or multiple image URLs (one per line or comma-separated):\nhttps://...\nhttps://...'}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#F85606]"
            />
          ) : (
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#F85606]"
            />
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="px-3.5 h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
            >
              {multiple ? 'Add Image URL(s)' : 'Add URL'}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="flex-1 font-medium">{errorMsg}</p>
          <button type="button" onClick={() => setErrorMsg('')} aria-label="Dismiss error">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
