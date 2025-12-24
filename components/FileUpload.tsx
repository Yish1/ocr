import React, { useCallback, useState, useEffect } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void; // 支持多文件
  disabled?: boolean;
}

// 文件上传组件
// 任务: 实现文件上传系统 (必须) - 支持多文件和复制粘贴
const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, disabled }) => {
  const [dragActive, setDragActive] = useState(false);

  // 监听粘贴事件
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const pastedFiles = (Array.from(e.clipboardData.files) as File[]).filter(file => file.type.startsWith('image/'));
        if (pastedFiles.length > 0) {
          e.preventDefault();
          onFilesSelected(pastedFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected, disabled]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(file => file.type.startsWith('image/'));
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      } else {
        alert("请上传图片文件");
      }
    }
  }, [onFilesSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = (Array.from(e.target.files) as File[]).filter(file => file.type.startsWith('image/'));
        onFilesSelected(selectedFiles);
    }
  };

  return (
    <div 
      className={`
        relative w-full border-2 border-dashed rounded-xl p-8 text-center transition-all group
        ${dragActive ? 'border-primary bg-blue-50' : 'border-slate-300 bg-white hover:border-primary/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple // 开启多文件
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleChange}
        disabled={disabled}
        accept="image/*"
      />
      
      <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
        <div className="p-3 bg-slate-100 rounded-full group-hover:bg-blue-50 transition-colors">
          <svg className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-slate-700">点击、拖拽或<span className="text-primary font-bold">Ctrl+V粘贴</span>图片</p>
          <p className="text-sm text-slate-500 mt-1">支持 JPG, PNG (支持多选)</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;