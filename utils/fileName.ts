/**
 * Utility functions for handling file names and extensions safely.
 */

// Known file extensions that can be safely stripped without truncating
// decimal numbers, chapter versions, or section markers like "Lesson 2 (13.5)"
const KNOWN_FILE_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'bmp',
  'tiff',
  'tif',
  'heic',
  'html',
  'htm',
  'txt',
  'md'
];

const EXT_REGEX = new RegExp(`\\.(${KNOWN_FILE_EXTENSIONS.join('|')})$`, 'i');

/**
 * Strips only known document/image extensions (e.g. .pdf, .png, .jpg, .html)
 * from a filename or custom title. Leaves decimal numbers, chapter notation,
 * and parenthesis notation (e.g. "Lesson 2 (13.5)") intact.
 */
export function stripFileExtension(filename: string): string {
  if (!filename) return '';
  
  // Also strip trailing "-acc.html" or "-clean.html" if entered by user
  let cleaned = filename.trim().replace(/-(?:acc|clean)\.html$/i, '');
  
  // Strip known file extension if present at the end
  cleaned = cleaned.replace(EXT_REGEX, '');
  
  return cleaned;
}
