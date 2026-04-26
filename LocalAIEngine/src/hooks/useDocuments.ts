import { useState, useCallback } from 'react';
import { UploadedFile, DocumentChunk } from '@/types/engine';
import { supabase } from '@/lib/supabase';
import { extractPDFText } from '@/lib/pdfExtract';
import { toast } from 'sonner';

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function chunkText(text: string, source: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const content = text.slice(start, end).trim();
    if (content) {
      chunks.push({
        id: `chunk_${Date.now()}_${chunks.length}`,
        content,
        source,
      });
    }
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

function simpleSearch(chunks: DocumentChunk[], query: string, topK = 3): DocumentChunk[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  const scored = chunks.map(chunk => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    queryWords.forEach(word => {
      const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += occurrences;
    });

    if (contentLower.includes(queryLower)) score += 10;

    return { chunk, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.chunk);
}

export function useDocuments() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      let text: string;
      let metaExtra: Record<string, unknown> = {};

      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isPDF) {
        toast.info(`PDF 텍스트 추출 중: ${file.name}`);
        const result = await extractPDFText(file, (page, total) => {
          console.log(`PDF 페이지 처리: ${page}/${total}`);
        });
        text = result.text;
        metaExtra = { page_count: result.pageCount, pdf_title: result.title };
      } else {
        text = await file.text();
      }

      const chunks = chunkText(text, file.name);

      // Upload to Supabase Storage
      const storagePath = `docs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('rag-documents')
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        console.warn('Storage upload failed, using local only:', uploadError.message);
      }

      // Save metadata to DB (content stored locally for performance)
      const { data: dbDoc, error: dbError } = await supabase
        .from('rag_documents')
        .insert({
          name: file.name,
          file_type: file.type || 'text/plain',
          file_size: file.size,
          storage_path: uploadError ? null : storagePath,
          content: text.slice(0, 5000), // store first 5KB as preview
          chunk_count: chunks.length,
          meta: { total_length: text.length, ...metaExtra },
        })
        .select()
        .single();

      if (dbError) {
        console.warn('DB insert failed:', dbError.message);
      }

      const uploaded: UploadedFile = {
        id: dbDoc?.id || `file_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        content: text,
        chunks,
        storagePath: uploadError ? undefined : storagePath,
      };

      setFiles(prev => [...prev, uploaded]);
      toast.success(`"${file.name}" 업로드 완료 (${chunks.length} 청크)`);
      return uploaded;
    } catch (err) {
      toast.error(`파일 처리 실패: ${file.name}`);
      console.error(err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const removeFile = useCallback(async (id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.storagePath) {
      await supabase.storage.from('rag-documents').remove([file.storagePath]);
    }
    // Delete from DB
    await supabase.from('rag_documents').delete().eq('id', id);
    setFiles(prev => prev.filter(f => f.id !== id));
  }, [files]);

  const searchDocuments = useCallback((query: string, topK = 3): string => {
    if (files.length === 0) return '';

    const allChunks = files.flatMap(f => f.chunks || []);
    const relevant = simpleSearch(allChunks, query, topK);

    if (relevant.length === 0) return '';

    const context = relevant
      .map(c => `[출처: ${c.source}]\n${c.content}`)
      .join('\n\n---\n\n');

    return `다음 문서 내용을 참고하여 답변하세요:\n\n${context}\n\n`;
  }, [files]);

  const clearFiles = useCallback(async () => {
    // Remove all from storage + DB
    const paths = files.filter(f => f.storagePath).map(f => f.storagePath as string);
    if (paths.length > 0) {
      await supabase.storage.from('rag-documents').remove(paths);
    }
    const ids = files.map(f => f.id);
    if (ids.length > 0) {
      await supabase.from('rag_documents').delete().in('id', ids);
    }
    setFiles([]);
  }, [files]);

  const totalChunks = files.reduce((sum, f) => sum + (f.chunks?.length || 0), 0);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return {
    files,
    isProcessing,
    addFile,
    removeFile,
    searchDocuments,
    clearFiles,
    totalChunks,
    totalSize,
  };
}
