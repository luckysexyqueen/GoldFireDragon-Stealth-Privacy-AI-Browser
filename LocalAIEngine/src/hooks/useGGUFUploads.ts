import { useState, useCallback, useEffect } from 'react';
import { ModelInfo } from '@/types/engine';
import { supabase, DBGgufUpload } from '@/lib/supabase';
import { toast } from 'sonner';

const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB upload chunk size

export function useGGUFUploads() {
  const [uploads, setUploads] = useState<DBGgufUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gguf_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUploads(data as DBGgufUpload[]);
    }
    setLoading(false);
  }, []);

  const uploadGGUF = useCallback(async (file: File, displayName: string, quantization?: string, description?: string): Promise<DBGgufUpload | null> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const storageName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `models/${storageName}`;

      setUploadProgress(10);
      toast.info(`"${file.name}" 업로드 시작... (${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB)`);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('gguf-models')
        .upload(storagePath, file, {
          upsert: false,
          contentType: 'application/octet-stream',
        });

      if (uploadError) {
        toast.error(`업로드 실패: ${uploadError.message}`);
        return null;
      }

      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gguf-models')
        .getPublicUrl(storagePath);

      const downloadUrl = urlData.publicUrl;

      setUploadProgress(90);

      // Save metadata to DB
      const { data: dbData, error: dbError } = await supabase
        .from('gguf_uploads')
        .insert({
          name: file.name,
          display_name: displayName,
          file_size: file.size,
          storage_path: storagePath,
          quantization: quantization || null,
          description: description || null,
          download_url: downloadUrl,
        })
        .select()
        .single();

      if (dbError) {
        toast.error(`메타데이터 저장 실패: ${dbError.message}`);
        return null;
      }

      const saved = dbData as DBGgufUpload;
      setUploads(prev => [saved, ...prev]);
      setUploadProgress(100);
      toast.success(`"${displayName}" 업로드 완료!`);
      return saved;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`업로드 오류: ${msg}`);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const deleteUpload = useCallback(async (id: string, storagePath: string, displayName: string) => {
    const { error: storageError } = await supabase.storage
      .from('gguf-models')
      .remove([storagePath]);

    if (storageError) {
      console.warn('Storage delete failed:', storageError.message);
    }

    const { error: dbError } = await supabase
      .from('gguf_uploads')
      .delete()
      .eq('id', id);

    if (!dbError) {
      setUploads(prev => prev.filter(u => u.id !== id));
      toast.success(`"${displayName}" 삭제됨`);
    } else {
      toast.error('삭제 실패');
    }
  }, []);

  const toModelInfo = useCallback((upload: DBGgufUpload): ModelInfo => ({
    id: `gguf_upload_${upload.id}`,
    name: upload.display_name,
    engine: 'gguf',
    size: `${(upload.file_size / 1024 / 1024 / 1024).toFixed(2)} GB`,
    description: upload.description || '사용자 업로드 GGUF 모델',
    quantization: upload.quantization || undefined,
    url: upload.download_url || undefined,
    license: '사용자 제공',
  }), []);

  return {
    uploads,
    loading,
    uploading,
    uploadProgress,
    loadUploads,
    uploadGGUF,
    deleteUpload,
    toModelInfo,
  };
}
