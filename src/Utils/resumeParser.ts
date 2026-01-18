// Force using the exact pdfjs-dist version to avoid conflicts
import * as pdfjsLibImport from 'pdfjs-dist';

let pdfjsLib: typeof pdfjsLibImport | null = null;
let mammoth: any = null;

const initLibraries = async () => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    // Import libraries
    const pdfjs = await import('pdfjs-dist');
    pdfjsLib = pdfjs as any;
    mammoth = await import('mammoth');
    
    // ✅ FIX: Use jsdelivr CDN with legacy format (works for all versions)
    const version = pdfjsLib?.version || '5.4.530';
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/legacy/build/pdf.worker.min.js`;
      
      console.log('PDF.js initialized with version:', version);
      console.log('Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    }
  }
};

export interface ParsedResumeData {
  text: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  isImageBased?: boolean;
  ocrProcessed?: boolean;
}

export async function parseResumeFile(file: File): Promise<ParsedResumeData> {
  
  await initLibraries();
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload PDF, DOC, DOCX, or image files (JPG, PNG, WEBP).');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size too large. Please upload files smaller than 10MB.');
  }

  let extractedText = '';
  let isImageBased = false;

  try {
    
    if (file.type.startsWith('image/')) {
      return {
        text: '', 
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isImageBased: true
      };
    }

    if (file.type === 'application/pdf') {
      extractedText = await extractPDFText(file);

      if (isPdfImageBased(extractedText)) {
        isImageBased = true;
      }
    } else {
      extractedText = await extractDocxText(file);
    }

    if (!extractedText.trim() || isImageBased) {
      return {
        text: extractedText,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isImageBased: true
      };
    }

    return {
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      isImageBased: false
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractPDFText(file: File): Promise<string> {
  if (!pdfjsLib) {
    throw new Error('PDF.js library not initialized');
  }
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function isPdfImageBased(extractedText: string): boolean {
  const cleanText = extractedText.replace(/\s+/g, ' ').trim();
  const wordCount = cleanText.split(' ').filter(word => word.length > 2).length;

  return wordCount < 10;
}

export async function pdfPageToImage(file: File, pageNumber: number = 1): Promise<string> {
  await initLibraries();
  
  if (!pdfjsLib) {
    throw new Error('PDF.js library not initialized');
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2.0 });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Canvas context not available');
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}