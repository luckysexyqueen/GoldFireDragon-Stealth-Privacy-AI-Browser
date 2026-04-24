/**
 * useImageGallery
 * 생성된 이미지 전체 갤러리 관리
 * IndexedDB의 image_history 스토어에서 데이터 로드
 */
import { useState, useEffect, useCallback } from 'react';
import { GenerationRecord } from '@/pages/ai-tools/components/ImageGenerator';

const DB_NAME = 'gfd_image_gen_db';
const HISTORY_STORE = 'image_history';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllHistory(): Promise<GenerationRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    const req = tx.objectStore(HISTORY_STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result ?? []) as GenerationRecord[];
      resolve(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteHistoryItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function useImageGallery() {
  const [images, setImages] = useState<GenerationRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAllHistory();
      setImages(data);
    } catch { /* empty */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteImage = useCallback(async (id: string) => {
    await deleteHistoryItem(id);
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const deleteAll = useCallback(async () => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HISTORY_STORE, 'readwrite');
      tx.objectStore(HISTORY_STORE).clear();
      tx.oncomplete = () => {
        setImages([]);
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }, []);

  // ZIP 다운로드 (JSZip 없이 Blob으로 간단 구현)
  const downloadAll = useCallback(async (selectedIds?: string[]) => {
    const targets = selectedIds
      ? images.filter(img => selectedIds.includes(img.id))
      : images;

    if (targets.length === 0) return;

    // 개별 이미지 다운로드
    for (let i = 0; i < targets.length; i++) {
      const img = targets[i];
      const link = document.createElement('a');
      link.href = img.imageUrl;
      link.download = `gfd-${img.style}-${Date.now()}-${i + 1}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(r => setTimeout(r, 300)); // rate limit 방지
    }
  }, [images]);

  return {
    images,
    loaded,
    load,
    deleteImage,
    deleteAll,
    downloadAll,
  };
}