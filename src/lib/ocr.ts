import Tesseract from 'tesseract.js';

/**
 * Extracts text from an image file using Tesseract.js
 * @param {File | Blob | string} image - The image file, Blob, or URL
 * @param {string} [lang='eng'] - Language for OCR
 * @returns {Promise<string>} - The extracted text
 */
export async function extractTextFromImage(image: File | Blob | string, lang: string = 'eng'): Promise<string> {
  const { data: { text } } = await Tesseract.recognize(image, lang, {
    logger: m => console.log(m), // Optional: progress updates
  });
  return text;
}
