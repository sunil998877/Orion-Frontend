import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const MAX_SIZE = 10 * 1024 * 1024;

  const handleFilesChange = (incoming: File[]) => {
    if (!incoming || incoming.length === 0) return;
    const tooLarge = incoming.find(f => f.size > MAX_SIZE);
    if (tooLarge) {
      setError(`File size limit reached (10MB): ${tooLarge.name}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const next = [...files, ...incoming];
    setFiles(next);
    onFilesChange(next);
    setError('');
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChange(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length > 0) handleFilesChange(selected);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange(next);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-400 mb-1">
        Upload Course Material (Optional)
      </label>
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative flex flex-col items-center ${files.length === 0 ? 'justify-center h-96 sm:h-[28rem]' : 'justify-start min-h-[20rem] sm:min-h-[24rem]'} w-full ${files.length > 0 ? 'border-4' : 'border-2'} border-dashed rounded-lg cursor-pointer transition-colors duration-200
            ${isDragging ? 'border-lime-500 bg-black/40' : 'border-white/10 bg-black/60 hover:border-white/20 hover:bg-white/5'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onFileInputChange}
        />
        {files.length > 0 ? (
          <div className="w-full p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((f, idx) => (
                <div key={`${f.name}-${idx}`} className="relative flex items-center gap-3 p-3 bg-black/60 border border-white/10 rounded-lg text-white">
                  <FileIcon className="w-6 h-6 text-lime-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{f.name}</p>
                    <p className="text-xs text-white/60">{Math.round(f.size / 1024)} KB</p>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <UploadCloud className="w-12 h-12 text-white/50" />
            <p className="mt-2 text-sm text-white/80">
              <span className="font-semibold text-lime-600 cursor-pointer" onClick={onButtonClick}>Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-white/60 mt-1">PDF, DOCX, PPTX, etc. (max. 10MB)</p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
