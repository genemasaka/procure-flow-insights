import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs`;
}

export interface ExtractionResult {
  text: string;
  confidence: number;
  method: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    fileSize: number;
  };
}

export class TextExtractor {
  /**
   * Main extraction method that routes to appropriate handler based on file type
   */
  static async extractText(file: File): Promise<ExtractionResult> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    console.log('TextExtractor: Processing file:', fileName, 'Type:', fileType);

    try {
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await this.extractFromPDF(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return await this.extractFromDOCX(file);
      } else if (fileType.startsWith('image/') || this.isImageFile(fileName)) {
        return await this.extractFromImage(file);
      } else if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
        return await this.extractFromText(file);
      } else {
        // Fallback: try as text first, then OCR if that fails
        return await this.extractWithFallback(file);
      }
    } catch (error) {
      console.error('TextExtractor: Extraction failed:', error);
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF files using PDF.js
   */
  private static async extractFromPDF(file: File): Promise<ExtractionResult> {
    console.log('TextExtractor: Extracting from PDF');
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const pageCount = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    const cleanText = this.cleanText(fullText);
    const wordCount = this.getWordCount(cleanText);
    
    return {
      text: cleanText,
      confidence: cleanText.length > 50 ? 0.9 : 0.6, // High confidence if substantial text
      method: 'PDF.js',
      metadata: {
        pageCount,
        wordCount,
        fileSize: file.size
      }
    };
  }

  /**
   * Extract text from DOCX files using Mammoth
   */
  private static async extractFromDOCX(file: File): Promise<ExtractionResult> {
    console.log('TextExtractor: Extracting from DOCX');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const cleanText = this.cleanText(result.value);
    const wordCount = this.getWordCount(cleanText);
    
    return {
      text: cleanText,
      confidence: result.messages.length === 0 ? 0.95 : 0.8, // Lower confidence if there were conversion messages
      method: 'Mammoth.js',
      metadata: {
        wordCount,
        fileSize: file.size
      }
    };
  }

  /**
   * Extract text from images using Tesseract OCR
   */
  private static async extractFromImage(file: File): Promise<ExtractionResult> {
    console.log('TextExtractor: Extracting from image using OCR');
    
    const worker = await createWorker('eng');
    
    try {
      const { data } = await worker.recognize(file);
      const cleanText = this.cleanText(data.text);
      const wordCount = this.getWordCount(cleanText);
      
      return {
        text: cleanText,
        confidence: data.confidence / 100, // Tesseract returns confidence as 0-100
        method: 'Tesseract OCR',
        metadata: {
          wordCount,
          language: 'eng',
          fileSize: file.size
        }
      };
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Extract text from plain text files
   */
  private static async extractFromText(file: File): Promise<ExtractionResult> {
    console.log('TextExtractor: Extracting from text file');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const text = reader.result as string;
        const cleanText = this.cleanText(text);
        const wordCount = this.getWordCount(cleanText);
        
        resolve({
          text: cleanText,
          confidence: 0.99, // High confidence for plain text
          method: 'FileReader',
          metadata: {
            wordCount,
            fileSize: file.size
          }
        });
      };
      
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  /**
   * Fallback extraction with multiple attempts
   */
  private static async extractWithFallback(file: File): Promise<ExtractionResult> {
    console.log('TextExtractor: Using fallback extraction methods');
    
    // Try text extraction first
    try {
      return await this.extractFromText(file);
    } catch (textError) {
      console.log('TextExtractor: Text extraction failed, trying OCR');
      
      // If text fails, try OCR as last resort
      try {
        return await this.extractFromImage(file);
      } catch (ocrError) {
        // Return minimal fallback result
        return {
          text: `Document content from ${file.name}`,
          confidence: 0.1,
          method: 'Fallback',
          metadata: {
            wordCount: 0,
            fileSize: file.size
          }
        };
      }
    }
  }

  /**
   * Clean extracted text by removing excessive whitespace and formatting
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  /**
   * Count words in text
   */
  private static getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Check if file is an image based on extension
   */
  private static isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    return imageExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Validate extraction result quality
   */
  static validateExtraction(result: ExtractionResult): boolean {
    return result.text.length > 10 && result.confidence > 0.3;
  }

  /**
   * Get supported file types
   */
  static getSupportedTypes(): string[] {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
  }
}