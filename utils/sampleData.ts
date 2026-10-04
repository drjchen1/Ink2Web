import { ConversionResult } from '../types';

/**
 * Creates a sample math note file that can be processed directly via the standard conversion pipeline.
 */
export const createSampleMathNoteFile = (topic: 'calculus' | 'fourier' | 'linear_algebra' = 'calculus'): File => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle graph paper grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (topic === 'fourier') {
      // Fourier Series Notes
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('Lecture 8: Fourier Series & Orthogonal Expansions', 80, 110);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('MATH 3120 · Applied Analysis & Differential Equations', 80, 150);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 175);
      ctx.lineTo(1120, 175);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('1. Periodic Function Representation (Period T = 2L)', 80, 230);

      ctx.fillStyle = '#334155';
      ctx.font = '20px serif';
      ctx.fillText('Any piecewise smooth periodic function f(x) on [-L, L] can be expressed as:', 80, 275);

      // Formula Box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(80, 310, 1040, 130, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.font = 'italic bold 28px serif';
      ctx.fillText('f(x) = a₀/2 + ∑ [ aₙ cos(nπx/L) + bₙ sin(nπx/L) ]', 260, 380);

      ctx.fillStyle = '#475569';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('where the summation runs from n = 1 to ∞.', 80, 480);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('2. Euler-Fourier Formulas for Coefficients', 80, 550);

      ctx.fillStyle = '#334155';
      ctx.font = '20px serif';
      ctx.fillText('Coefficients are determined by orthogonality over [-L, L]:', 80, 600);

      ctx.font = 'italic 24px serif';
      ctx.fillText('a₀ = (1/L) ∫ f(x) dx,   aₙ = (1/L) ∫ f(x) cos(nπx/L) dx', 120, 660);
      ctx.fillText('bₙ = (1/L) ∫ f(x) sin(nπx/L) dx', 120, 720);

      // Square Wave Box
      ctx.fillStyle = '#eef2ff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, 800, 1040, 110, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#312e81';
      ctx.font = 'bold 24px serif';
      ctx.fillText('Square Wave Example:   f(x) = (4/π) ∑ [ sin((2k-1)x) / (2k-1) ]', 240, 865);
    } else if (topic === 'linear_algebra') {
      // Linear Algebra Notes
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('Lecture 12: Eigenvalues, Eigenvectors & Diagonalization', 80, 110);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('MATH 2210 · Linear Algebra & Matrix Theory', 80, 150);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 175);
      ctx.lineTo(1120, 175);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('1. The Fundamental Eigenvalue Equation', 80, 230);

      ctx.fillStyle = '#334155';
      ctx.font = '20px serif';
      ctx.fillText('For an n × n square matrix A and non-zero vector v:', 80, 275);

      // Formula Box
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(80, 310, 1040, 130, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.font = 'italic bold 28px serif';
      ctx.fillText('A v = λ v   <==>   (A - λ I) v = 0', 360, 380);

      ctx.fillStyle = '#475569';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Non-trivial solutions exist if and only if det(A - λ I) = 0.', 80, 480);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('2. Characteristic Equation & Diagonalization', 80, 550);

      ctx.fillStyle = '#334155';
      ctx.font = '20px serif';
      ctx.fillText('Roots of the polynomial p(λ) = det(A - λ I) are the eigenvalues.', 80, 600);

      ctx.font = 'italic 24px serif';
      ctx.fillText('p(λ) = λ² - Tr(A) λ + det(A) = 0', 120, 660);
      ctx.fillText('Matrix Decomposition:   A = P D P⁻¹', 120, 720);
    } else {
      // Calculus Growth Model Notes
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
      ctx.fillText('Lecture 4: Exponential Growth & Population Models', 80, 110);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('MATH 2400 · Differential Equations & Mathematical Modeling', 80, 150);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 175);
      ctx.lineTo(1120, 175);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('1. The Standard Malthusian Growth Model', 80, 230);

      ctx.fillStyle = '#334155';
      ctx.font = '20px serif';
      ctx.fillText('If the rate of growth of a population P(t) is directly proportional to the current population size:', 80, 275);

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(80, 310, 1040, 130, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.font = 'italic bold 28px serif';
      ctx.fillText('dP / dt = k · P(t)', 450, 380);

      ctx.fillStyle = '#475569';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('where  k > 0  is the intrinsic growth rate parameter.', 80, 480);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('2. Analytical Solution via Separation of Variables', 80, 550);

      ctx.fillStyle = '#334155';
      ctx.font = '20px serif';
      ctx.fillText('Step 1: Separate variables and integrate both sides:', 80, 600);

      ctx.font = 'italic 24px serif';
      ctx.fillText('∫ (1 / P) dP = ∫ k dt', 120, 650);
      ctx.fillText('ln |P| = k t + C₁', 120, 700);

      ctx.fillStyle = '#334155';
      ctx.font = '20px serif';
      ctx.fillText('Step 2: Exponentiate to isolate P(t):', 80, 760);

      ctx.font = 'italic 24px serif';
      ctx.fillText('P(t) = e^(k t + C₁) = e^(C₁) · e^(k t) = P₀ · e^(k t)', 120, 810);

      ctx.fillStyle = '#eef2ff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, 860, 1040, 90, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#312e81';
      ctx.font = 'bold 24px serif';
      ctx.fillText('General Solution:   P(t) = P₀ · e^(k t)   where P₀ = P(0)', 300, 915);
    }
  }

  // Convert canvas to Blob -> File
  const dataUrl = canvas.toDataURL('image/png');
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/png' });
  const fileName = topic === 'fourier' 
    ? 'sample_fourier_series_notes.png' 
    : topic === 'linear_algebra' 
      ? 'sample_linear_algebra_notes.png' 
      : 'sample_calculus_lecture_notes.png';
  return new File([blob], fileName, { type: 'image/png' });
};
