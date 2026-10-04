
/**
 * Escapes special characters for use in HTML attributes.
 */
export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Cleans alt text for accessibility by removing LaTeX delimiters
 * and escaping HTML characters.
 */
export const cleanAltText = (alt: string): string => {
  if (!alt) return "";
  const noLatexDelimiters = alt.replace(/\\\(|\\\)|\\\[|\\\]|\$\$/g, '').replace(/\$/g, '');
  return escapeHtml(noLatexDelimiters);
};

/**
 * Helper to parse balanced curly braces { ... } in LaTeX strings.
 */
const parseBalancedBraces = (str: string, startIndex: number): { content: string; endIndex: number } | null => {
  if (str[startIndex] !== '{') return null;
  let depth = 0;
  let inEscape = false;
  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];
    if (inEscape) {
      inEscape = false;
      continue;
    }
    if (char === '\\') {
      inEscape = true;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIndex + 1, i), endIndex: i };
      }
    }
  }
  return null;
};

/**
 * Normalizes LaTeX math expressions:
 * 1. Normalizes \underbrace{A}_{B} and \overbrace{A}^{B} to ensure text labels are cleanly wrapped in \text{...} and strips zero-width \mathclap overrides that cause horizontal text collisions.
 * 2. Unwraps accidental math delimiters around plain English phrases (e.g. \( "is proportional to" \)).
 * 3. Ensures English text inside math underbraces is wrapped in \text{...} and cleans up internal spacing.
 */
export const normalizeMathSpacing = (content: string): string => {
  if (!content || typeof content !== 'string') return content || '';

  // 1. Unwrap accidental math delimiters around plain English phrases
  let res = content.replace(/(\\\([\s\S]*?\\\)|\$(?:\\.|[^\$\n])+\$)/g, (match) => {
    const isParen = match.startsWith('\\(');
    const inner = isParen ? match.slice(2, -2).trim() : match.slice(1, -1).trim();
    // If the inner text is pure English words/quotes/punctuation and has no math operators or LaTeX macros
    if (/^[a-zA-Z\s"'(),.:;!?]+$/.test(inner) && /\s/.test(inner) && !inner.includes('\\')) {
      const words = inner.match(/[a-zA-Z]{2,}/g);
      if (words && words.length >= 2) {
        return inner; // Unwrap back to clean prose
      }
    }
    return match;
  });

  // 2. Optimize \underbrace and \overbrace (ensure text labels are cleanly wrapped in \text{...} while preserving width-controls like \mathclap and \substack)
  let out = '';
  let i = 0;
  while (i < res.length) {
    if (res.startsWith('\\underbrace', i) || res.startsWith('\\overbrace', i)) {
      const isUnder = res.startsWith('\\underbrace', i);
      const cmdLen = isUnder ? 11 : 10;
      let cur = i + cmdLen;
      while (cur < res.length && /\s/.test(res[cur])) cur++;
      const target = parseBalancedBraces(res, cur);
      if (target) {
        cur = target.endIndex + 1;
        while (cur < res.length && /\s/.test(res[cur])) cur++;
        const symbol = isUnder ? '_' : '^';
        if (res[cur] === symbol) {
          cur++;
          while (cur < res.length && /\s/.test(res[cur])) cur++;
          const label = parseBalancedBraces(res, cur);
          if (label) {
            let labelContent = label.content.trim();

            // If label is wrapped in \mathclap{...} or \clap{...}, keep it and ensure inner English words are wrapped in \text{...}
            const isClapped = /^\\(?:mathclap|clap)\s*\{/.test(labelContent);
            if (isClapped) {
              const innerTarget = parseBalancedBraces(labelContent, labelContent.indexOf('{'));
              if (innerTarget) {
                let inner = innerTarget.content.trim();
                if (!inner.includes('\\text{') && /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(inner)) {
                  if (!inner.includes('\\')) {
                    inner = `\\text{${inner}}`;
                  }
                }
                inner = inner.replace(/\\(?:quad|qquad|;|,)\s*/g, ' ');
                const clapCmd = labelContent.startsWith('\\clap') ? '\\clap' : '\\mathclap';
                labelContent = `${clapCmd}{${inner}}`;
              }
            } else {
              // If label contains plain English words without \text{...}, wrap words in \text{...}
              if (!labelContent.includes('\\text{') && /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(labelContent)) {
                if (!labelContent.includes('\\')) {
                  labelContent = `\\text{${labelContent}}`;
                }
              }
              // Clean up multi-space or awkward spacing macros in text labels
              labelContent = labelContent.replace(/\\(?:quad|qquad|;|,)\s*/g, ' ');
            }

            const cmd = isUnder ? '\\underbrace' : '\\overbrace';
            out += `${cmd}{${target.content}}${symbol}{${labelContent}}`;
            i = label.endIndex + 1;
            continue;
          }
        }
      }
    }
    out += res[i];
    i++;
  }

  // 3. Clean up multiple spaces inside \text{...}
  out = out.replace(/\\text\{([^{}]*)\}/g, (_m, inner) => {
    const cleaned = inner.replace(/\s{2,}/g, ' ').replace(/\\(?:quad|qquad)\s*/g, ' ');
    return `\\text{${cleaned}}`;
  });

  // 4. Prevent giant vertically-stretched delimiters around underbrace expressions:
  // When \left( and \right) enclose \underbrace, KaTeX stretches them vertically across the footnote labels.
  // Converting to \bigl( and \bigr) preserves natural baseline-anchored parentheses.
  out = out.replace(/\\left\(([^\n]*?\\underbrace[^\n]*?)\\right\)/g, (_m, inner) => {
    return `\\bigl(${inner}\\bigr)`;
  });

  return out;
};

/**
 * Automatically detects and formats un-delimited mathematical expressions,
 * powers (e.g. x^2, e^{-2t}), derivatives (e.g. y' = ay + b, dy/dt = -2y + 5),
 * equations, fractions, and Greek symbols into standard LaTeX \( ... \) delimiters.
 * Leaves existing LaTeX delimiters (\( \), \[, \], $, $$) and HTML tags untouched,
 * and ensures math delimiters are never nested or duplicated.
 */
export const formatMathInText = (text: string): string => {
  if (!text || typeof text !== 'string') return text || '';

  // Step 0: Split text by existing LaTeX math delimiters (\( ... \), \[ ... \], $$ ... $$, $ ... $) and HTML tags (< ... >)
  const existingTokenRegex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$(?:\\.|[^\$\n])+\$|<[^>]+>)/g;
  const rawParts = text.split(existingTokenRegex);

  // Array of blocks: { text: string, isProtected: boolean }
  let blocks: Array<{ text: string; isProtected: boolean }> = rawParts.map((part, index) => {
    if (index % 2 === 1) {
      let cleaned = part;
      if (cleaned.startsWith('\\(')) {
        cleaned = cleaned.replace(/\\\(\s*\\\(/g, '\\(').replace(/\\\)\s*\\\)/g, '\\)');
      }
      return { text: cleaned, isProtected: true };
    }
    return { text: part, isProtected: false };
  });

  // Helper to safely apply a regex match across all non-protected blocks
  const processPattern = (regex: RegExp, formatter: (match: string) => string | null) => {
    const nextBlocks: Array<{ text: string; isProtected: boolean }> = [];
    for (const block of blocks) {
      if (block.isProtected || !block.text) {
        nextBlocks.push(block);
        continue;
      }

      let lastIndex = 0;
      const flags = regex.flags.includes('g') ? regex.flags : regex.flags + 'g';
      const r = new RegExp(regex.source, flags);
      let m: RegExpExecArray | null;

      while ((m = r.exec(block.text)) !== null) {
        const matchStr = m[0];
        const matchIndex = m.index;

        if (matchIndex > lastIndex) {
          nextBlocks.push({ text: block.text.slice(lastIndex, matchIndex), isProtected: false });
        }

        const formatted = formatter(matchStr);
        if (formatted !== null) {
          nextBlocks.push({ text: formatted, isProtected: true });
        } else {
          nextBlocks.push({ text: matchStr, isProtected: false });
        }

        lastIndex = matchIndex + matchStr.length;
      }

      if (lastIndex < block.text.length) {
        nextBlocks.push({ text: block.text.slice(lastIndex), isProtected: false });
      }
    }
    blocks = nextBlocks;
  };

  // 1. Intervals and set membership: x \in [-\pi, \pi], u \in [-L, L], t \in [0, 1]
  processPattern(
    /(?<![\\a-zA-Z0-9])([a-zA-Z](?:'|\(\w+\))?\s*(?:\\in|\bin\b)\s*[\(\[][^\(\)\[\]\n\r]+[\)\]])(?=[,\.;\:\?\!\s]|$)/g,
    (match) => {
      let formatted = match.replace(/\bin\b/g, '\\in');
      return `\\( ${formatted.trim()} \\)`;
    }
  );

  // 2. Compound inequalities: -1 < t < 0, 0 < t < 1, -\pi \le x \le \pi, 0 \le t \le 2\pi, -L \le u \le L
  processPattern(
    /(?<![\\a-zA-Z0-9])((?:[\+\-]?[0-9a-zA-Z\\]+(?:\/[0-9a-zA-Z\\]+)?)\s*(?:<=|>=|<|>|\\le|\\ge|\\leq|\\geq)\s*[a-zA-Z](?:'|\(\w+\))?\s*(?:<=|>=|<|>|\\le|\\ge|\\leq|\\geq)\s*(?:[\+\-]?[0-9a-zA-Z\\]+(?:\/[0-9a-zA-Z\\]+)?))(?=[,\.;\:\?\!\)]*(?:\s|$))/g,
    (match) => `\\( ${match.trim()} \\)`
  );

  // 3. Limit / Tend-to arrow expressions: t \to 0^-, t \to 0^+, x \to \infty, t -> 0, x \to -1
  processPattern(
    /(?<![\\a-zA-Z0-9])([a-zA-Z](?:'|\(\w+\))?\s*(?:\\to|\\rightarrow|->)\s*[\+\-]?[0-9a-zA-Z\\]+(?:\^[0-9\+\-]+|\_[0-9a-zA-Z\+\-]+)?)(?=[,\.;\:\?\!\)]*(?:\s|$))/g,
    (match) => {
      let formatted = match.replace(/->/g, '\\to');
      return `\\( ${formatted.trim()} \\)`;
    }
  );

  // 4. Mathematical equations: u = \frac{L}{\pi}x, f(t) = -1 - t, f(t) = 1 - t, y = x^2 - 4, dy/dt = -2y + 5, y' = ay + b, y(t) = 5/2 + Ce^{-2t}
  processPattern(
    /(?<![\\a-zA-Z0-9])((?:[a-zA-Z](?:'|\([a-zA-Z0-9,\s]+\))?|d[a-zA-Z]\/d[a-zA-Z]|\\[a-zA-Z]+)\s*(?:=|\\approx|\\le|\\ge|\\leq|\\geq|<|>|!=|\\neq)\s*[\+\-]?(?:[0-9a-zA-Z\\]+(?:\{[^{}]*\})*(?:\^[a-zA-Z0-9\+\-]+|\_[a-zA-Z0-9\+\-]+)*[a-zA-Z0-9]*|\([a-zA-Z0-9\+\-\*\/\s]+\)|[0-9]+(?:\.[0-9]+)?)(?:\s*(?:[\+\-\*\/\^=]|\s)\s*(?:[0-9a-zA-Z\\]+(?:\{[^{}]*\})*(?:\^[a-zA-Z0-9\+\-]+|\_[a-zA-Z0-9\+\-]+)*[a-zA-Z0-9]*|\([a-zA-Z0-9\+\-\*\/\s]+\)|[0-9]+(?:\.[0-9]+)?))*)(?=[,\.;\:\?\!\)]*(?:\s|$))/g,
    (match) => {
      if (/^(?:id|class|style|width|height|src|href)=/i.test(match)) return null;
      const englishWords = match.match(/[a-zA-Z]{3,}/g);
      if (englishWords && englishWords.length >= 2) {
        const nonMathWords = englishWords.filter(w => !/^(?:sin|cos|tan|cot|sec|csc|log|ln|lim|min|max|exp|det|gcd|deg|dim|hom|ker|arg|arc)$/i.test(w));
        if (nonMathWords.length >= 2) return null;
      }
      return `\\( ${match.trim()} \\)`;
    }
  );

  // 5. Simple variable assignments: T = 2, L = 1, t = -1, t = 1, y = 0, k = 5
  processPattern(
    /(?<![\\a-zA-Z0-9])([a-zA-Z]\s*=\s*[\+\-]?[0-9]+(?:\.[0-9]+)?)(?=[,\.;\:\?\!\)]*(?:\s|$))/g,
    (match) => `\\( ${match.trim()} \\)`
  );

  // 6. Un-delimited LaTeX commands: \frac{a}{b}, \sqrt{x}, \alpha, \beta, \theta, \pi, \int, \partial, \in, \pm, etc.
  processPattern(
    /(?<![\\a-zA-Z0-9])(\\[a-zA-Z]+(?:\{[^{}]*\}|\^[a-zA-Z0-9]|\_[a-zA-Z0-9]|_\{[^{}]*\}|\^\{[^{}]*\})*(?:\s*[\+\-\*\/=]\s*(?:\\[a-zA-Z]+(?:\{[^{}]*\})*|[a-zA-Z0-9_\^\{\}\+\-\*\/]+))*)/g,
    (match) => `\\( ${match.trim()} \\)`
  );

  // 7. Isolated powers and subscripts: x^2, e^{-2t}, x_0, y_n, 2^n, (a+b)^2, 0^-, 0^+
  processPattern(
    /(?<![\\a-zA-Z0-9])((?:\([a-zA-Z0-9\+\-\s]+\)|[a-zA-Z0-9]+)(?:\^\{[^{}]+\}|\^[a-zA-Z0-9\+\-]+|\_\{[^{}]+\}|\_[a-zA-Z0-9]+)+(?:\s*[\+\-\*\/]\s*(?:[a-zA-Z0-9]+(?:\^\{[^{}]+\}|\^[a-zA-Z0-9\+\-]+|\_\{[^{}]+\}|\_[a-zA-Z0-9]+)*|[a-zA-Z0-9]+))*)/g,
    (match) => `\\( ${match.trim()} \\)`
  );

  // 8. Math function calls: f(t), g(x), y(t), f'(t), y''(t), h(x,y)
  processPattern(
    /(?<![\\a-zA-Z0-9])([fghypquvwFGH](?:'|'')?\([a-zA-Z0-9,\s\+\-]+\))(?=[,\.;\:\?\!\s]|$)/g,
    (match) => `\\( ${match.trim()} \\)`
  );

  // 9. Standalone derivatives: y', y'', f'(x), dy/dt, dx/dt
  processPattern(
    /(?<![\\a-zA-Z0-9])([a-zA-Z]'|d[a-zA-Z]\/d[a-zA-Z]|[a-zA-Z]''|f'\([a-zA-Z]\))(?=[,\.;\:\?\!\s]|$)/g,
    (match) => `\\( ${match.trim()} \\)`
  );

  // 10. Single math variables in contexts: "axis x", "axis y", "axis u", "period T", "value t", "constant k", "values of t"
  processPattern(
    /(?<=\b(?:axis|axes|variable|parameter|period|constant|function|value|values of)\s+)([a-zA-Z])(?=[,\.;\:\?\!\s]|$)/gi,
    (match) => `\\( ${match.trim()} \\)`
  );

  // Join all blocks together
  let result = blocks.map(b => b.text).join('');

  // Final cleanup of double delimiters
  result = result.replace(/\\\(\s*\\\(/g, '\\(').replace(/\\\)\s*\\\)/g, '\\)');

  return normalizeMathSpacing(result);
};

/**
 * Automatically fixes skipped heading levels in an HTML string to comply with WCAG 1.3.1.
 * For example, if it finds an <h1> then an <h3>, it changes the <h3> to an <h2>.
 */
export const fixHeadingOrder = (html: string, isRootPage: boolean = true): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // If not the root page (i.e. pages 2+), demote any h1 to h2 to maintain single-h1 WCAG hierarchy
  if (!isRootPage) {
    doc.querySelectorAll('h1').forEach(h1 => {
      const h2 = doc.createElement('h2');
      Array.from(h1.attributes).forEach(attr => h2.setAttribute(attr.name, attr.value));
      h2.innerHTML = h1.innerHTML;
      h1.parentNode?.replaceChild(h2, h1);
    });
  }

  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  
  if (headings.length === 0) return html;

  // 1. Remove consecutive identical duplicate headings
  let prevText = '';
  for (const heading of headings) {
    const text = (heading.textContent || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (text && text === prevText) {
      heading.remove();
      continue;
    }
    prevText = text;
  }

  // Refresh remaining headings after removing duplicates
  const activeHeadings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  
  for (const heading of activeHeadings) {
    const currentLevel = parseInt(heading.tagName[1]);
    
    // If the current level skips down by more than 1 from the last level (e.g., from h1 to h3)
    if (lastLevel !== 0 && currentLevel > lastLevel + 1) {
      const newLevel = lastLevel + 1;
      const newTagName = `h${newLevel}`;
      
      const newHeading = doc.createElement(newTagName);
      // Copy all attributes
      Array.from(heading.attributes).forEach(attr => {
        newHeading.setAttribute(attr.name, attr.value);
      });
      // Copy content
      newHeading.innerHTML = heading.innerHTML;
      
      // Replace in DOM
      heading.parentNode?.replaceChild(newHeading, heading);
      lastLevel = newLevel;
    } else {
      lastLevel = currentLevel;
    }
  }

  return doc.body.innerHTML;
};

/**
 * Safely replaces an image tag (and its surrounding figure/p tag if applicable)
 * with the provided figure HTML.
 */
export const replaceFigureInHtml = (html: string, figureId: string, figureHtml: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find the image by ID
  const img = doc.querySelector(`img[id="${figureId}"]`);
  
  if (!img) {
    // Fallback to regex if DOM parsing doesn't find it (e.g., malformed HTML)
    const imgTagRegex = new RegExp(`(?:<figure[^>]*>\\s*)?(?:<p[^>]*>\\s*)?<img[^>]*id=["']${figureId}["'][^>]*>(?:\\s*</p>)?(?:\\s*(?:<figcaption|<p)[^>]*>(?:\\s*<strong[^>]*>)?\\s*Figure[\\s\\S]*?</(?:figcaption|p)>\\s*)?(?:\\s*</figure>)?`, 'gi');
    return html.replace(imgTagRegex, figureHtml);
  }

  let targetNode: Element = img;
  
  // Check if it's inside a <figure>, a <p>, or a container div (.notebox, card, etc.) that only contains this image
  if (img.parentElement) {
    const parentTag = img.parentElement.tagName.toLowerCase();
    if (parentTag === 'figure') {
      targetNode = img.parentElement;
    } else if (parentTag === 'p' || parentTag === 'div') {
      // Only replace parent if it effectively only contains the image and whitespace
      if (img.parentElement.textContent?.trim() === '') {
        targetNode = img.parentElement;
      }
    }
  }

  // If the parent of targetNode is a notebox or wrapper div that only contains this figure/targetNode, unwrap it
  if (targetNode.parentElement && (targetNode.parentElement.classList.contains('notebox') || targetNode.parentElement.tagName.toLowerCase() === 'div')) {
    if (targetNode.parentElement.textContent?.trim() === '') {
      targetNode = targetNode.parentElement;
    }
  }

  // Remove any immediately following duplicate caption paragraphs/elements (e.g., <p><strong>Figure 1:</strong> ...</p>)
  let nextSibling = targetNode.nextElementSibling;
  while (nextSibling) {
    const text = nextSibling.textContent?.trim() || '';
    const isFigureCaption = /^\s*(?:Figure|Fig\.?|Diagram|Illustration)\s*\d*[:.-]/i.test(text) || nextSibling.tagName.toLowerCase() === 'figcaption';
    if (isFigureCaption) {
      const toRemove = nextSibling;
      nextSibling = nextSibling.nextElementSibling;
      toRemove.remove();
    } else {
      break;
    }
  }

  const template = doc.createElement('template');
  template.innerHTML = figureHtml.trim();
  
  if (template.content.firstChild) {
    targetNode.parentNode?.replaceChild(template.content.firstChild, targetNode);
  }

  return doc.body.innerHTML;
};

/**
 * Formats a figure title cleanly without duplicate "Figure:" prefixes.
 */
export const formatFigureTitle = (rawTitle: string): string => {
  if (!rawTitle) return "Figure";
  let title = rawTitle.trim();
  // Strip duplicate repeated prefixes like "Figure: Figure:" or "Fig. Figure:"
  title = title.replace(/^(?:(?:figure|fig\.?|diagram|illustration)\s*(?:\d+)?\s*[:.-]?\s*)+/i, '').trim();
  if (!title) return "Figure";
  return `Figure: ${title}`;
};

/**
 * Formats a figure caption cleanly by stripping any redundant "Figure:" prefixes.
 * The detailed description should not repeat "Figure:".
 */
export const formatFigureCaption = (rawCaption: string): string => {
  if (!rawCaption) return "";
  let caption = rawCaption.trim();
  // Strip any leading "Figure:", "Fig.", "Diagram:", "Illustration:" prefix (even if repeated)
  caption = caption.replace(/^(?:(?:figure|fig\.?|diagram|illustration)\s*(?:\d+)?\s*[:.-]?\s*)+/i, '').trim();
  return caption;
};
