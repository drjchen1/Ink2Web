
/**
 * Optimizes an image for Gemini API by resizing it while maintaining aspect ratio.
 * This reduces payload size and can improve processing speed.
 */
export const optimizeImageForGemini = async (base64: string, maxWidth = 1600, maxHeight = 1600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(base64); // Fallback
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Use JPEG for better compression of photos/handwriting
      const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
      resolve(optimizedBase64.split(',')[1] || optimizedBase64);
    };
    img.onerror = (err) => reject(err);
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
};
