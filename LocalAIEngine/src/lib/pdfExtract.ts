/**
 * PDF text extraction using pdfjs-dist (Mozilla PDF.js)
 * Runs entirely in-browser via WASM/Canvas — no server needed.
 */

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjsLib() {
  if (pdfjsLib) return pdfjsLib;

  const lib = await import('pdfjs-dist');

  // Point worker to the CDN bundle so Vite doesn't need to bundle it
  lib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;

  pdfjsLib = lib;
  return lib;
}

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  title: string;
}

export async function extractPDFText(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<PDFExtractionResult> {
  const lib = await getPdfjsLib();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = lib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const pageCount = pdfDoc.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    // Join items, preserving line breaks between blocks
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) return item.str;
        return '';
      })
      .join(' ')
      .replace(/\s{3,}/g, '\n') // collapse excessive whitespace to newline
      .trim();

    if (pageText) pageTexts.push(`[Page ${i}]\n${pageText}`);
    onProgress?.(i, pageCount);
  }

  // Try to get PDF metadata title
  let title = file.name.replace(/\.pdf$/i, '');
  try {
    const meta = await pdfDoc.getMetadata();
    const info = meta.info as Record<string, unknown>;
    if (info?.Title && typeof info.Title === 'string' && info.Title.trim()) {
      title = info.Title.trim();
    }
  } catch {
    // ignore metadata errors
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount,
    title,
  };
}
