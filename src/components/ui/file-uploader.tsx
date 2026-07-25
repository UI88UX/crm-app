// src/components/ui/file-uploader.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface UploadedFile {
  id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
}

interface FileUploaderProps {
  patientId: string;
  initialFiles?: UploadedFile[];
  onUploadComplete?: (file: UploadedFile) => void;
  onFileDelete?: (fileId: string) => void;
  className?: string;
  maxFiles?: number;
}

interface FileUploadState {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

// ============================================
// Component
// ============================================

export function FileUploader({
  patientId,
  initialFiles = [],
  onUploadComplete,
  onFileDelete,
  className,
  maxFiles = 10,
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [uploadQueue, setUploadQueue] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // به‌روزرسانی files وقتی initialFiles تغییر می‌کند
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  // آپلود فایل‌ها
  const uploadFiles = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // بررسی تعداد فایل‌ها
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`حداکثر ${maxFiles} فایل می‌توانید آپلود کنید`);
      return;
    }

    setIsUploading(true);

    const newFiles: UploadedFile[] = [];

    for (const file of acceptedFiles) {
      const uploadState: FileUploadState = {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'uploading',
      };

      setUploadQueue(prev => [...prev, uploadState]);

      try {
        console.log('Starting upload for file:', file.name, 'Patient ID:', patientId);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patientId', patientId);

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData,
        });

        console.log('Upload response status:', response.status);
        const result = await response.json();
        console.log('Upload response data:', result);

        if (!response.ok) {
          throw new Error(result.error || 'خطا در آپلود فایل');
        }

        // به‌روزرسانی وضعیت
        setUploadQueue(prev =>
          prev.map(item =>
            item.id === uploadState.id
              ? {
                  ...item,
                  status: 'success',
                  progress: 100,
                  uploadedFile: {
                    id: result.data.id,
                    name: file.name,
                    path: result.data.path,
                    url: result.data.url,
                    size: file.size,
                    type: file.type,
                    createdAt: new Date().toISOString(),
                  },
                }
              : item
          )
        );

        const uploadedFile: UploadedFile = {
          id: result.data.id,
          name: file.name,
          path: result.data.path,
          url: result.data.url,
          size: file.size,
          type: file.type,
          createdAt: new Date().toISOString(),
        };

        newFiles.push(uploadedFile);

        if (onUploadComplete) {
          onUploadComplete(uploadedFile);
        }

        toast.success(`فایل ${file.name} با موفقیت آپلود شد`);
      } catch (error) {
        console.error('Upload error details:', error);
        setUploadQueue(prev =>
          prev.map(item =>
            item.id === uploadState.id
              ? {
                  ...item,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'خطا در آپلود',
                }
              : item
          )
        );
        toast.error(`خطا در آپلود ${file.name}: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);

    setTimeout(() => {
      setUploadQueue(prev =>
        prev.filter(item => item.status === 'uploading')
      );
    }, 3000);
  }, [patientId, files.length, maxFiles, onUploadComplete]);

  // حذف فایل
  const handleDeleteFile = useCallback(async (file: UploadedFile) => {
    if (!confirm(`آیا از حذف فایل "${file.name}" اطمینان دارید؟`)) return;

    setIsDeleting(file.id);

    try {
      console.log('Deleting file:', file.path, 'Patient ID:', patientId);

      const response = await fetch('/api/storage/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: file.path,
          patientId,
        }),
      });

      const result = await response.json();
      console.log('Delete response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'خطا در حذف فایل');
      }

      // حذف از لیست محلی
      setFiles(prev => prev.filter(f => f.id !== file.id));
      
      if (onFileDelete) {
        onFileDelete(file.id);
      }
      
      toast.success(`فایل ${file.name} با موفقیت حذف شد`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`خطا در حذف فایل: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`);
    } finally {
      setIsDeleting(null);
    }
  }, [patientId, onFileDelete]);

  // تنظیمات Dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    await uploadFiles(acceptedFiles);
  }, [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    disabled: isUploading,
  });

  // نمایش فایل
  const handleViewFile = (file: UploadedFile) => {
    window.open(file.url, '_blank');
  };

  // فرمت حجم فایل
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // آیکون بر اساس نوع فایل
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* منطقه Drop */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-700",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? "فایل را در اینجا رها کنید..."
            : "برای آپلود فایل، کلیک کنید یا بکشید و رها کنید"}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          JPG, PNG, PDF • حداکثر {maxFiles} فایل • هر فایل حداکثر ۱۰ مگابایت
        </p>
      </div>

      {/* صف آپلود */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                {getFileIcon(item.file.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'uploading' && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-500">{item.progress}%</span>
                  </div>
                )}
                {item.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {item.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* لیست فایل‌های آپلود شده */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            فایل‌های آپلود شده ({files.length})
          </p>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewFile(file)}
                  className="h-8 w-8 p-0"
                  title="مشاهده فایل"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFile(file)}
                  disabled={isDeleting === file.id}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="حذف فایل"
                >
                  {isDeleting === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}