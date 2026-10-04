
import { AccessibilityAudit, SemanticAccessibilityTags } from '../types';
import { formatMathInText, normalizeMathSpacing } from './dom';

export const computeSemanticAccessibilityTags = (html: string, pageTitle?: string): SemanticAccessibilityTags => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const tables = Array.from(doc.querySelectorAll('table'));
  const figures = Array.from(doc.querySelectorAll('figure, img[data-figure-id]'));
  
  // Math count: match \( ... \), \[ ... \], or MathJax mjx-container / LaTeX environments
  const inlineMathMatches = html.match(/\\\([\s\S]*?\\\)/g) || [];
  const blockMathMatches = html.match(/\\\[[\s\S]*?\\\]/g) || [];
  const envMathMatches = html.match(/\\begin\{(?:aligned|cases|pmatrix|bmatrix|vmatrix|matrix|split|equation)\}[\s\S]*?\\end\{(?:aligned|cases|pmatrix|bmatrix|vmatrix|matrix|split|equation)\}/g) || [];
  const mathExpressionsCount = inlineMathMatches.length + blockMathMatches.length + envMathMatches.length;

  const hasAriaLandmarks = doc.querySelector('article, section, main, nav, header, footer, [role="region"], [role="main"]') !== null;
  
  const hasAccessibleTables = tables.length > 0 && tables.every(table => {
    const hasTh = table.querySelectorAll('th').length > 0;
    const thHaveScope = Array.from(table.querySelectorAll('th')).every(th => th.hasAttribute('scope'));
    return hasTh && thHaveScope;
  });

  const firstH1 = doc.querySelector('h1')?.textContent?.trim();
  const detectedTitle = pageTitle || firstH1 || doc.querySelector('h2')?.textContent?.trim() || 'Mathematical Document';

  return {
    pageTitle: detectedTitle,
    headingsCount: headings.length,
    mathExpressionsCount,
    tablesCount: tables.length,
    figuresCount: figures.length,
    hasAriaLandmarks,
    hasAccessibleTables: tables.length === 0 || hasAccessibleTables,
    hasFormulasEnriched: mathExpressionsCount > 0
  };
};

export const enrichHtmlAccessibility = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Enrich Tables with accessible containers & ARIA landmarks
  const tables = Array.from(doc.querySelectorAll('table'));
  tables.forEach((table, idx) => {
    // Add default high contrast Tailwind classes if none exist
    if (!table.className || !table.className.includes('border-collapse')) {
      table.classList.add('w-full', 'text-left', 'border-collapse', 'my-4', 'border', 'border-zinc-300', 'bg-white', 'rounded-xl', 'overflow-hidden');
    }

    // Ensure <th> has scope="col" if inside thead, or scope="row" if first cell in tbody
    const theadThs = Array.from(table.querySelectorAll('thead th'));
    theadThs.forEach(th => {
      if (!th.hasAttribute('scope')) {
        th.setAttribute('scope', 'col');
      }
      th.classList.add('bg-zinc-100', 'text-zinc-900', 'font-black', 'p-3', 'border-b', 'border-zinc-300', 'text-xs', 'uppercase', 'tracking-wider');
    });

    const tbodyRows = Array.from(table.querySelectorAll('tbody tr'));
    tbodyRows.forEach(tr => {
      const firstCell = tr.firstElementChild;
      if (firstCell && firstCell.tagName === 'TH' && !firstCell.hasAttribute('scope')) {
        firstCell.setAttribute('scope', 'row');
        firstCell.classList.add('font-bold', 'text-zinc-900', 'p-3', 'border-b', 'border-zinc-200', 'text-xs');
      }
      const tds = Array.from(tr.querySelectorAll('td'));
      tds.forEach(td => {
        td.classList.add('p-3', 'border-b', 'border-zinc-200', 'text-sm', 'text-zinc-800');
      });
    });

    // If table not wrapped in an overflow scroll container with role="region", wrap it
    const parent = table.parentElement;
    if (!parent || (!parent.classList.contains('overflow-x-auto') && parent.tagName.toLowerCase() !== 'div')) {
      const wrapper = doc.createElement('div');
      wrapper.className = 'overflow-x-auto my-6 rounded-2xl border border-zinc-200/80 shadow-xs bg-white';
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', `Data Table ${idx + 1}`);
      wrapper.setAttribute('tabindex', '0');
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });

  // Ensure all figure captions have clean, accessible accordions and no redundant "Figure:" in descriptions
  const figcaptions = Array.from(doc.querySelectorAll('figcaption'));
  figcaptions.forEach(fc => {
    // 1. If it's a legacy details accordion, upgrade to the clean accordion
    const legacyDetails = fc.querySelector('details.group\\/details, .figure-details-chevron');
    if (legacyDetails) {
      const detailsEl = fc.querySelector('details');
      if (detailsEl) {
        const summarySpan = detailsEl.querySelector('summary span:first-child');
        const titleText = summarySpan ? summarySpan.innerHTML.trim() : '';
        const bodyDiv = detailsEl.querySelector('div');
        let bodyText = bodyDiv ? bodyDiv.innerHTML.trim() : '';
        bodyText = bodyText.replace(/^(?:<[^>]+>)*(?:(?:figure|fig\.?|diagram|illustration)\s*(?:\d+)?\s*[:.-]?\s*)+(?:<\/[^>]+>)*/i, '').trim();

        fc.innerHTML = `
          <div class="figure-title font-bold text-zinc-900 mb-1">${titleText ? (titleText.startsWith('Figure:') ? titleText : `Figure: ${titleText}`) : 'Figure'}</div>
          ${bodyText ? `
            <details class="group mt-2.5 max-w-2xl mx-auto text-left">
              <summary class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 active:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border border-zinc-200 cursor-pointer select-none transition-all list-none [&::-webkit-details-marker]:hidden shadow-2xs">
                <svg class="w-3.5 h-3.5 text-zinc-500 group-open:rotate-90 transition-transform shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;min-width:14px;max-width:14px;display:inline-block;"><polyline points="9 18 15 12 9 6"></polyline></svg>
                <span>Detailed description</span>
              </summary>
              <div class="figure-details-content mt-2.5 p-3 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-600 leading-relaxed italic shadow-2xs">
                ${bodyText}
              </div>
            </details>
          ` : ''}
        `;
      }
    }

    // 2. Strip any redundant "Figure:" prefix from detailed descriptions in existing <details> or secondary text
    const details = fc.querySelector('details');
    if (details) {
      const bodyDiv = details.querySelector('div, .figure-details-content');
      if (bodyDiv) {
        bodyDiv.innerHTML = bodyDiv.innerHTML.replace(/^(?:<[^>]+>)*(?:(?:figure|fig\.?|diagram|illustration)\s*(?:\d+)?\s*[:.-]?\s*)+(?:<\/[^>]+>)*/i, '').trim();
        bodyDiv.innerHTML = formatMathInText(bodyDiv.innerHTML);
      }
    } else {
      const titleEl = fc.querySelector('.figure-title, strong:first-child');
      const italicEl = fc.querySelector('span.italic, p.italic');
      if (italicEl) {
        italicEl.innerHTML = italicEl.innerHTML.replace(/^(?:<[^>]+>)*(?:(?:figure|fig\.?|diagram|illustration)\s*(?:\d+)?\s*[:.-]?\s*)+(?:<\/[^>]+>)*/i, '').trim();
        italicEl.innerHTML = formatMathInText(italicEl.innerHTML);
      }
      if (titleEl) {
        titleEl.innerHTML = formatMathInText(titleEl.innerHTML);
      }
    }
  });

  return normalizeMathSpacing(doc.body.innerHTML);
};

export const runAccessibilityAudit = (html: string, isFirstPage: boolean = true): AccessibilityAudit => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const checks = [];

  // Check 1: Alt text for all images/figures (1.1.1)
  const images = Array.from(doc.querySelectorAll('img'));
  const allImagesHaveAlt = images.length === 0 || images.every(img => {
    const alt = img.getAttribute('alt');
    return alt && alt.trim().length > 0;
  });
  checks.push({
    title: 'Alt Text (1.1.1)',
    passed: allImagesHaveAlt,
    description: 'All visual figures must have descriptive alternative text for screen readers.',
    suggestion: allImagesHaveAlt ? undefined : 'Use the Figure Editor to add descriptive alt text to all images.'
  });

  // Check 2: Heading Structure (1.3.1) - Sequential Order
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let headingOrderValid = true;
  let lastLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1]);
    if (level > lastLevel + 1 && lastLevel !== 0) {
      headingOrderValid = false;
      break;
    }
    lastLevel = level;
  }
  const hasH1 = headings.some(h => h.tagName === 'H1');
  
  checks.push({
    title: 'Heading Order (1.3.1)',
    passed: headingOrderValid && headings.length > 0 && (!isFirstPage || hasH1),
    description: 'Headings should follow a logical nested order (e.g., h1 followed by h2) without skipping levels.',
    suggestion: !headings.length ? 'Add at least one heading.' : 
                (isFirstPage && !hasH1) ? 'Ensure the document starts with an <h1>.' :
                !headingOrderValid ? 'Fix skipped heading levels (e.g., don\'t jump from <h1> to <h3>).' : undefined
  });

  // Check 3: ARIA Landmarks (1.3.1)
  const hasLandmarks = doc.querySelector('article, section, main, nav, header, footer, [role="region"]') !== null;
  checks.push({
    title: 'Landmarks (1.3.1)',
    passed: hasLandmarks,
    description: 'Content is organized within semantic landmarks like <article> or <section> for easier navigation.',
    suggestion: hasLandmarks ? undefined : 'Wrap main content in <article> or <section> tags.'
  });

  // Check 4: Color Contrast (1.4.3) - Simulation
  const hasInlineColors = html.includes('style="color:') || html.includes('style="background:');
  const hasLowContrastClasses = html.includes('text-slate-300') || html.includes('text-gray-300') || html.includes('text-zinc-300') || html.includes('text-slate-400');
  const contrastPassed = !hasInlineColors && !hasLowContrastClasses;
  
  checks.push({
    title: 'Contrast (1.4.3)',
    passed: contrastPassed,
    description: 'Text must have a contrast ratio of at least 4.5:1 against its background.',
    suggestion: !contrastPassed ? 'Avoid light gray text or inline color styles that might be hard to read.' : undefined
  });

  // Check 5: Keyboard Navigation (2.1.1)
  const interactive = Array.from(doc.querySelectorAll('a, button, details, [tabindex]'));
  const noTabindexMinusOne = interactive.every(el => el.getAttribute('tabindex') !== '-1');
  const allHaveLabels = interactive.every(el => {
    const text = el.textContent?.trim();
    const ariaLabel = el.getAttribute('aria-label');
    const title = el.getAttribute('title');
    return (text && text.length > 0) || (ariaLabel && ariaLabel.length > 0) || (title && title.length > 0);
  });
  
  checks.push({
    title: 'Keyboard (2.1.1)',
    passed: noTabindexMinusOne && allHaveLabels,
    description: 'All interactive elements must be reachable via keyboard and have descriptive labels.',
    suggestion: !noTabindexMinusOne ? 'Remove tabindex="-1" from interactive elements.' :
                !allHaveLabels ? 'Add text or aria-labels to all buttons and links.' : undefined
  });

  // Check 6: Screen Reader (4.1.2)
  const hasGroupRoles = doc.querySelectorAll('figure[role="group"]').length > 0;
  checks.push({
    title: 'Screen Reader (4.1.2)',
    passed: images.length === 0 || hasGroupRoles,
    description: 'Complex components like figures should use ARIA roles to describe their purpose.',
    suggestion: (images.length > 0 && !hasGroupRoles) ? 'Ensure figures are wrapped in <figure role="group">.' : undefined
  });

  // Check 7: Table Data Accessibility (1.3.1)
  const tables = Array.from(doc.querySelectorAll('table'));
  const tablesAreAccessible = tables.length === 0 || tables.every(table => {
    const hasTh = table.querySelectorAll('th').length > 0;
    const thHaveScope = Array.from(table.querySelectorAll('th')).every(th => th.hasAttribute('scope'));
    return hasTh && thHaveScope;
  });

  checks.push({
    title: 'Table Data (1.3.1)',
    passed: tablesAreAccessible,
    description: 'Data tables must have header cells (<th>) with scope attributes (col/row) to identify rows and columns.',
    suggestion: !tablesAreAccessible ? 'Ensure all <table> elements use <th> tags for headers and include scope="col" or scope="row" attributes.' : undefined
  });

  // Check 8: Math Structure & Delimiters (WCAG & MathJax)
  const rawDollarMath = (html.match(/(?<!\\)\$[^\$]+(?<!\\)\$/g) || []).length;
  // We prefer \( ... \) or \[ ... \] for strict MathJax compatibility without delimiter collisions
  const mathDelimitersValid = rawDollarMath === 0 || html.includes('\\(') || html.includes('\\[');
  checks.push({
    title: 'Math Structure (1.3.1)',
    passed: mathDelimitersValid,
    description: 'Mathematical equations must follow standard LaTeX delimiters (\\( ... \\) or \\[ ... \\]) for screen readers and MathJax rendering.',
    suggestion: !mathDelimitersValid ? 'Use the Math Editor to verify LaTeX delimiters for formulas and equations.' : undefined
  });

  // Check 9: Link Purpose (2.4.4)
  const links = Array.from(doc.querySelectorAll('a'));
  const linksHaveDescriptiveText = links.length === 0 || links.every(link => {
    const text = link.textContent?.trim().toLowerCase();
    const title = link.getAttribute('title');
    const ariaLabel = link.getAttribute('aria-label');
    const nonDescriptive = ['click here', 'read more', 'more', 'link', 'here'];
    const isDescriptive = text && !nonDescriptive.includes(text);
    return isDescriptive || (title && title.trim().length > 0) || (ariaLabel && ariaLabel.trim().length > 0);
  });

  checks.push({
    title: 'Link Purpose (2.4.4)',
    passed: linksHaveDescriptiveText,
    description: 'Links must have descriptive text that explains their purpose (avoid "click here").',
    suggestion: !linksHaveDescriptiveText ? 'Update non-descriptive link text like "click here" to describe the destination or action.' : undefined
  });

  // Check 10: Form Labels (3.3.2)
  const inputs = Array.from(doc.querySelectorAll('input, select, textarea'));
  const labels = Array.from(doc.querySelectorAll('label'));
  const inputsHaveLabels = inputs.length === 0 || inputs.every(input => {
    const id = input.getAttribute('id');
    const hasAssociatedLabel = id && labels.some(label => label.getAttribute('for') === id);
    const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
    const isSubmitOrButton = input.getAttribute('type') === 'submit' || input.getAttribute('type') === 'button';
    return isSubmitOrButton || hasAssociatedLabel || hasAriaLabel;
  });

  checks.push({
    title: 'Form Labels (3.3.2)',
    passed: inputsHaveLabels,
    description: 'All form inputs must have associated <label> elements or aria-labels.',
    suggestion: !inputsHaveLabels ? 'Ensure all <input>, <textarea>, and <select> elements have a matching <label for="id"> or aria-label.' : undefined
  });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return { score, checks };
};
