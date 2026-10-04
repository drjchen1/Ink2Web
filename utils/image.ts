import { Figure } from '../types';

export const cropImage = (originalCanvas: HTMLCanvasElement, figure: Figure): string => {
  const [ymin, xmin, ymax, xmax] = figure.box_2d;
  const w = originalCanvas.width;
  const h = originalCanvas.height;

  const padding = 15;
  const sx = Math.max(0, (xmin / 1000) * w - padding);
  const sy = Math.max(0, (ymin / 1000) * h - padding);
  const sWidth = Math.min(w - sx, ((xmax - xmin) / 1000) * w + padding * 2);
  const sHeight = Math.min(h - sy, ((ymax - ymin) / 1000) * h + padding * 2);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = sWidth;
  cropCanvas.height = sHeight;
  const ctx = cropCanvas.getContext('2d');
  
  if (!ctx) return '';
  ctx.drawImage(originalCanvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
  return cropCanvas.toDataURL('image/png');
};
