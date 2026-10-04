
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeminiPageResponse, BatchResponse, ModelType, MathAnnotationStyle } from "../types";
import beautify from "js-beautify";
import { getActiveCacheName, createDocumentContextCache } from "./cacheService";

const getSystemInstruction = (mathAnnotationStyle: MathAnnotationStyle = "clean-breakdown") => {
  return `
You are a world-class specialist in mathematics education and web accessibility (WCAG 2.2 AA). 
Your task is to convert scanned handwritten mathematics lecture notes into a high-fidelity, accessible HTML document.

Rules:
1. FAITHFULNESS & ADAPTIVE LAYOUT: Transcribe the author's original wording and shorthand as faithfully as possible. Do not rewrite, heavily rephrase, or expand shorthand into full sentences unless fixing an obvious typo. However, you MAY adapt the spatial layout and formatting to enhance web clarity and accessibility.
    - If text and a figure appear side-by-side in the notes, use Tailwind grid classes (e.g., <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">) to replicate this layout.
    - If an equation and an annotation (text with an arrow) appear side-by-side, you may preserve the spatial relationship using a flexbox container OR convert the annotation into a clear text note immediately below the equation if it improves readability on a screen.

2. ACCESSIBILITY: Use semantic HTML5 elements (<article>, <section>, <h1>-<h6>, <p>, <ul>, <ol>, <dl>). 
    - HEADING HIERARCHY (CRITICAL A11Y): You are FORBIDDEN from skipping heading levels. The first page MUST have an <h1> for the main title. Subsequent pages may start with <h2> or <h3> if they logically continue a previous section. NEVER jump from <h1> to <h3>. Do not use headings purely for visual sizing.
    - COLOR CONTRAST (STRICT): You are FORBIDDEN from using light gray text colors (e.g., text-slate-300, text-gray-300). Use high-contrast text colors to ensure WCAG 2.2 AA compliance. 
      - APPROVED COLORS: For emphasis, you MAY use high-contrast Tailwind classes: 'text-slate-900', 'text-blue-900', 'text-red-900', 'text-emerald-900', 'text-indigo-900'.

3. UNIVERSAL DESIGN & AESTHETICS (CLEAN, ACCESSIBLE, STREAMLINED):
   - TYPOGRAPHY: Use 'font-sans' for a clean, readable look. For headings, use 'font-black tracking-tight text-slate-900'.
   - SPACING: Use standard Tailwind spacing (e.g., 'space-y-4', 'mb-6', 'mt-8') to group related concepts logically, matching the visual flow of the original page.
   - VISUAL HIERARCHY: Use 'italic text-slate-700 my-6' for important theorems or definitions.
   - LISTS: Use 'list-disc list-outside ml-6 space-y-2 mb-6' for unordered lists to ensure proper text wrapping and readability.
   - NOTEPADS/BOXES: For explicitly boxed formulas or definitions, use '<div class="notebox" role="region" aria-label="Key Formula">'.
   - NO UNWANTED MARGIN NOTES: Do NOT generate artificial auto-annotations, margin commentary, or conversational filler. Transcribe the document cleanly and faithfully as accessible HTML.

4. NATIVE MATHEMATICS & EQUATION STRUCTURE (CRITICAL):
   - Convert all mathematical expressions into standard LaTeX. 
   - PREFER INLINE MATH: Use \\( ... \\) for variables, short expressions, or any math that is part of a sentence to maintain a natural, cohesive flow.
   - BLOCK MATH: Use '\\[ ... \\]' for standalone block math. 
   - MULTI-LINE DERIVATIONS & ALIGNMENT: For multi-step derivations, systems of equations, or aligned proofs, use LaTeX alignment environments inside block math:
     - '\\begin{aligned} ... \\end{aligned}' with '&' alignment anchors and '\\\\' line breaks.
     - Piecewise formulas and case definitions: '\\begin{cases} ... \\end{cases}'.
     - Matrices and vectors: '\\begin{pmatrix} ... \\end{pmatrix}' or '\\begin{bmatrix} ... \\end{bmatrix}' or determinants '\\begin{vmatrix} ... \\end{vmatrix}'.
${mathAnnotationStyle === 'visual-underbraces' ? `   - MATHEMATICAL ANNOTATIONS & UNDERBRACES (VISUAL UNDERBRACE MODE):
     - When handwritten notes feature explanatory phrases, curly brackets, or notes beneath math terms or variables:
       - Transcribe the underbraces directly beneath the mathematical symbols using LaTeX \\underbrace{expression}_{\text{label}} (or \\overbrace{expression}^{\text{label}}).
       - NARROW MULTI-LINE STACKS FOR LABELS: If an underbrace label contains multiple words or is descriptive, break it into a narrow multi-line stack using \\substack with \\text{...} on each line:
         \\underbrace{k}_{\\substack{\\text{constant of} \\\\ \\text{proportionality}}}
         This keeps the horizontal width bounded and prevents massive spacing gaps between surrounding math symbols.
       - AVOID GIANT DELIMITERS: NEVER wrap \\left( and \\right) around an expression containing \\underbrace. Use standard parentheses ( ... ) or \\bigl( ... \\bigr) so delimiters do not stretch vertically over the underbrace.
       - FOR ALL WORDS IN MATH / BRACES: ALWAYS wrap English words inside \\text{...}. NEVER place plain English words directly into math mode without \\text{...}.
       - NO ARTIFICIAL SPACING BETWEEN VARIABLES: NEVER insert artificial wide spacing (like \\quad, \\qquad, \\;, \\ , or hard spaces) between variables, coefficients, and parenthesized terms.
       - TIGHT, NATURAL OPERATOR SPACING: Maintain compact, natural mathematical spacing between terms and operators.` : `   - MATHEMATICAL ANNOTATIONS, UNDERBRACES & EXPLANATORY LABELS (CLEAN BREAKDOWN MODE - RECOMMENDED):
     - When handwritten notes feature explanatory phrases, descriptions, or comments beneath symbols (especially multi-symbol expressions like \\((r, \\theta)\\), coordinate pairs, equations with multiple labeled parameters, or terms with long notes):
       - DO NOT put long explanatory phrases inside \\underbrace in the equation line! Doing so forces the math symbols apart with awkward horizontal gaps and stretches surrounding parentheses into giant vertical brackets.
       - INSTEAD: Write the clean, natural mathematical formula first (e.g., \\[ (r, \\theta) \\] or inline \\((r, \\theta)\\)), and immediately follow it with an accessible \"where:\" definition list or breakdown in HTML:
         <p class="text-sm font-semibold text-slate-700 mt-2 mb-1">where:</p>
         <ul class="list-disc list-outside ml-6 space-y-1 text-sm text-slate-700">
           <li>\\( r \\): displacement from origin</li>
           <li>\\( \\theta \\): angle of line through origin and the point</li>
         </ul>
       - Or if in continuous prose: \"where \\( r \\) is the displacement from origin, and \\( \\theta \\) is the angle of the line through the origin and the point.\"
     - STRICT LIMITS ON \\underbrace:
       - ONLY use \\underbrace{expr}_{\\text{label}} when the label is an ultra-short, 1-to-2-word tag on an isolated term (e.g., \\underbrace{k}_{\\text{rate}} or \\underbrace{y'}_{\\text{nonlinear}}).
       - NEVER use \\underbrace for multiple adjacent terms on the same line (such as \\( ( \\underbrace{r}_{\\dots}, \\underbrace{\\theta}_{\\dots} ) \\)). ALWAYS use the clean formula + \"where:\" definition list instead.
       - NEVER wrap \\left( and \\right) around an \\underbrace, because LaTeX stretches the parentheses vertically to encompass the text label below. Use standard parentheses ( ... ) or \\bigl( ... \\bigr).
     - FOR ALL WORDS IN MATH / BRACES: If an underbrace is used for a short tag, ALWAYS wrap English words inside \\text{...}. NEVER place plain English words directly into math mode without \\text{...}.
     - NO ARTIFICIAL SPACING BETWEEN VARIABLES: You MUST NEVER insert artificial wide spacing (like \\quad, \\qquad, \\;, \\ , or hard spaces) between variables, coefficients, and parenthesized terms. For example, write x(a-py) exactly, NEVER x \\quad (a-py) or x \\ (a-py).
     - TIGHT, NATURAL OPERATOR SPACING: Maintain compact, natural mathematical spacing between terms and operators without inserting artificial \\quad, \\qquad, or wide gaps between words.`}
   - Ensure backslashes are present for all functions (e.g., \\sin, \\cos, \\log, \\ln, \\sqrt, \\int, \\sum, \\lim, \\times, \\partial).
   - Double check that delimiters (\\( \\), \\[ \\]) and brackets are fully closed.

5. NATIVE TABULAR DATA EXTRACTION (ACCESSIBILITY & WCAG 1.3.1):
   - Automatically detect grids, data tables, parameter values, truth tables, and matrix tables in the images.
   - Convert these structures into semantic, accessible HTML <table> elements inside a responsive container:
     <div class="overflow-x-auto my-6" role="region" aria-label="Data Table" tabindex="0">
       <table class="w-full text-left border-collapse my-2 border border-slate-300 bg-white rounded-xl overflow-hidden">
         <caption class="sr-only">Descriptive table summary</caption>
         <thead>
           <tr>
             <th scope="col" class="bg-slate-100 text-slate-900 font-bold p-3 border-b border-slate-300 text-xs uppercase tracking-wider">Header 1</th>
             <th scope="col" class="bg-slate-100 text-slate-900 font-bold p-3 border-b border-slate-300 text-xs uppercase tracking-wider">Header 2</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <th scope="row" class="font-bold text-slate-900 p-3 border-b border-slate-200 text-xs">Row Label</th>
             <td class="p-3 border-b border-slate-200 text-sm text-slate-800">Value</td>
           </tr>
         </tbody>
       </table>
     </div>
   - You MUST use correct semantic table tags (<table>, <thead>, <tbody>, <tr>, <th> with scope="col" or scope="row", <td>).
   - Do NOT capture tables as image figures.

6. DISTINGUISH ANNOTATIONS VS. FIGURES (STRICT ENFORCEMENT):
   - ANNOTATIONS (NOT FIGURES): Hand-drawn circles around text, arrows pointing to variables, large curly brackets used for grouping, and labels in boxes (e.g., "Option 2", "Important!") are NOT FIGURES.
     - Transcribe the text/math inside or pointed to by these markers as standard HTML. 
     - Use <div class="notebox"> for boxed items.
     - IGNORE the visual circle/arrow itself if it serves only to highlight text; focus on the text content.
   - ACTUAL FIGURES: Only capture visual representations as figures if they represent:
     - Coordinate systems/graphs with axes and curves.
     - Geometric shapes (circles, triangles, etc.) that are part of a problem, not just highlights.
     - Physics diagrams or complex flowcharts.

7. GRAPHS & DIAGRAMS (FIGURES ONLY):
   - Identify every actual drawing (axes, curves, sketches).
   - Determine its exact bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000).
   - Generate a highly accessible, short, and concise alt text description for screen readers (e.g. "Figure: coordinate graph showing exponential curve \\( y = x^2 \\)"). Limit it to a single sentence or a few words.
   - Generate a detailed, highly descriptive visible caption that comprehensively describes the axes, curves, equations, variables, and mathematical relationships in detail so anyone can fully understand it.
   - MATHEMATICAL DELIMITERS (CRITICAL): In BOTH "alt" and "caption", wrap EVERY SINGLE mathematical variable, equation, exponent (e.g. \( x^2 \), \( e^{-2t} \)), fraction (e.g. \( \frac{5}{2} \)), derivative (e.g. \( y' = ay + b \)), compound inequality (e.g. \( -1 < t < 0 \), \( 0 < t < 1 \)), interval / set relation (e.g. \( x \in [-\pi, \pi] \), \( u \in [-L, L] \)), function (e.g. \( f(t) \)), parameter (e.g. \( T = 2 \), \( L = 1 \)), limit / arrow (e.g. \( t \to 0^- \), \( t \to 0^+ \)), and variable name (e.g. \( t \), \( x \), \( u \)) in LaTeX \( ... \) delimiters so they are rendered as mathematical formulas by MathJax. Never leave raw LaTeX commands like \in, \to, \pi un-delimited.
   - In the HTML, place ONLY the standalone image tag with a matching ID: <img id="fig_ID" alt="[CONCISE DESCRIPTION]">.
   - NEVER wrap <img id="fig_ID"> inside a <div class="notebox">, <div class="card">, or border container. Figures must always be standalone top-level block elements.
   - CRITICAL: Do NOT write separate caption paragraphs (e.g. <p>Figure 1: ...</p> or <figcaption>) in the HTML body for figures. The application automatically constructs the figure card with its accessible caption and interactive details from the figures array.

8. STRUCTURED OUTPUT FORMAT: Return a structured JSON object containing:
   {
     "pages": [
       {
         "title": "Short descriptive page or topic title",
         "html": "The full semantic HTML string",
         "figures": [
           { "id": "fig_1", "box_2d": [ymin, xmin, ymax, xmax], "alt": "Short concise title", "caption": "Detailed visual description" }
         ],
         "semanticTags": {
           "pageTitle": "Topic title",
           "headingsCount": 2,
           "mathExpressionsCount": 8,
           "tablesCount": 1,
           "figuresCount": 1,
           "hasAriaLandmarks": true,
           "hasAccessibleTables": true,
           "hasFormulasEnriched": true
         }
       }
     ]
   }

CRITICAL: Return ONLY the JSON object.
`;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callBatchGeminiWithRetry(
  images: { base64: string, pageNumber: number }[], 
  model: ModelType = 'gemini-3.8-flash', 
  thinkingLevelStr: string = 'LOW', 
  retries = 3, 
  onModelFallback?: (fallbackModel: ModelType) => void, 
  mathAnnotationStyle: MathAnnotationStyle = 'clean-breakdown',
  onStreamProgress?: (charsCount: number, latestSnippet: string) => void
): Promise<{text: string, tokenCount: number, actualModel: ModelType}> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  
  for (let i = 0; i < retries; i++) {
    try {
      const isThinkingSupported = model.includes('pro') || model.includes('3.8-flash') || model.includes('3.7-flash');

      let currentThinkingLevel: ThinkingLevel | undefined;
      
      // If none is specified, or model doesn't support thinkingConfig, leave it undefined
      if (thinkingLevelStr === 'NONE' || !isThinkingSupported) {
        currentThinkingLevel = undefined;
      } else if (thinkingLevelStr === 'HIGH' || i > 0) { // Bump to HIGH on retry if it was LOW
        currentThinkingLevel = ThinkingLevel.HIGH;
      } else if (thinkingLevelStr === 'AUTO') {
        // Adaptive thinking: Allocate high reasoning headroom for complex math and dynamic calibration
        currentThinkingLevel = ThinkingLevel.HIGH;
      } else {
        currentThinkingLevel = ThinkingLevel.LOW;
      }

      const parts = images.flatMap(img => [
        { inlineData: { mimeType: 'image/jpeg', data: img.base64 } },
        { text: `This is page ${img.pageNumber}.` }
      ]);

      const adaptivePrompt = thinkingLevelStr === 'AUTO' 
        ? `\nADAPTIVE REASONING: Dynamically calibrate your thinking depth per page. For simple notes or text headings, execute rapidly. For pages with dense math derivations, piecewise functions, matrices, or complex tables, utilize deep multi-step verification to guarantee 100% LaTeX syntax correctness and accessibility compliance.`
        : '';

      parts.push({ text: `Analyze these ${images.length} pages in order. 
      CRITICAL: Extract all mathematical equations using native LaTeX environments (e.g. aligned, cases, pmatrix). Extract all tables as semantic accessible HTML <table> structures.
      Hand-drawn or printed circles, arrows, and grouping brackets are annotations, NOT figures. 
      Labels like "Option 2" in boxes are text content and must be transcribed directly into HTML. 
      Only extract coordinate graphs or scientific drawings as figures. 
      Return a JSON object with a 'pages' property containing exactly ${images.length} page results in the same order as provided.
      Ensure the output is complete and does not cut off.${adaptivePrompt}` });

      const activeCacheName = getActiveCacheName();

      const config: any = {
        systemInstruction: getSystemInstruction(mathAnnotationStyle) + "\nIMPORTANT: Return a JSON object with a 'pages' property containing an array of page results. Each page result must have 'title', 'html', 'figures', and 'semanticTags' properties.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  html: { type: Type.STRING },
                  figures: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        box_2d: { 
                          type: Type.ARRAY, 
                          items: { type: Type.NUMBER },
                          minItems: 4,
                          maxItems: 4
                        },
                        alt: { type: Type.STRING },
                        caption: { type: Type.STRING }
                      },
                      required: ["id", "box_2d", "alt", "caption"]
                    }
                  },
                  semanticTags: {
                    type: Type.OBJECT,
                    properties: {
                      pageTitle: { type: Type.STRING },
                      headingsCount: { type: Type.INTEGER },
                      mathExpressionsCount: { type: Type.INTEGER },
                      tablesCount: { type: Type.INTEGER },
                      figuresCount: { type: Type.INTEGER },
                      hasAriaLandmarks: { type: Type.BOOLEAN },
                      hasAccessibleTables: { type: Type.BOOLEAN },
                      hasFormulasEnriched: { type: Type.BOOLEAN }
                    },
                    required: ["headingsCount", "mathExpressionsCount", "tablesCount", "figuresCount", "hasAriaLandmarks", "hasAccessibleTables", "hasFormulasEnriched"]
                  }
                },
                required: ["html", "figures"]
              }
            }
          },
          required: ["pages"]
        },
        temperature: 0.1,
        maxOutputTokens: 65536,
        ...(currentThinkingLevel ? { thinkingConfig: { thinkingLevel: currentThinkingLevel } } : {}),
        ...(activeCacheName ? { cachedContent: activeCacheName } : {})
      };

      // Attempt streaming generation for faster perceived latency and live chunk feedback
      let fullText = "";
      let tokenCount = 0;

      try {
        const streamResponse = await ai.models.generateContentStream({
          model: model,
          contents: { parts },
          config
        });

        for await (const chunk of streamResponse) {
          const chunkText = chunk.text || "";
          fullText += chunkText;
          if (onStreamProgress && chunkText) {
            onStreamProgress(fullText.length, chunkText.slice(-30));
          }
          if (chunk.usageMetadata?.totalTokenCount) {
            tokenCount = chunk.usageMetadata.totalTokenCount;
          }
        }
      } catch (streamError: any) {
        // If streaming encountered an issue, fallback to standard generateContent
        console.warn('Streaming encountered issue, falling back to unary generateContent:', streamError?.message);
        const unaryResponse = await ai.models.generateContent({
          model: model,
          contents: { parts },
          config
        });
        fullText = unaryResponse.text || "";
        tokenCount = unaryResponse.usageMetadata?.totalTokenCount || 0;
      }

      if (!fullText) throw new Error("Empty response from Gemini");
      
      let cleanJson = fullText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      // If document has multiple pages and caching isn't active yet, asynchronously prime cache in the background
      if (images.length > 1 && !activeCacheName) {
        createDocumentContextCache(images, getSystemInstruction(mathAnnotationStyle), model).catch(() => {});
      }
      
      return { text: cleanJson, tokenCount, actualModel: model };
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit');
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i + 1) * 1000;
        console.warn(`Rate limit hit on batch. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      // If we used gemini-3.8-flash, gemini-3.7-flash, or gemini-3.1-pro-preview, let's try fallback to gemini-3.5-flash!
      if (model === 'gemini-3.8-flash' || model === 'gemini-3.7-flash' || model === 'gemini-3.1-pro-preview') {
        console.warn(`Attempting fallback to gemini-3.5-flash due to error with ${model}:`, error);
        if (onModelFallback) onModelFallback('gemini-3.5-flash' as any);
        return callBatchGeminiWithRetry(images, 'gemini-3.5-flash' as any, thinkingLevelStr, retries, onModelFallback, mathAnnotationStyle, onStreamProgress);
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export const convertBatchToHtml = async (
  images: { base64: string, pageNumber: number }[], 
  model: ModelType = 'gemini-3.8-flash', 
  thinkingLevelStr: string = 'LOW', 
  onModelFallback?: (fallbackModel: ModelType) => void, 
  mathAnnotationStyle: MathAnnotationStyle = 'clean-breakdown',
  onStreamProgress?: (charsCount: number, latestSnippet: string) => void
): Promise<BatchResponse> => {
  let result = { text: "", tokenCount: 0, actualModel: model };
  try {
    result = await callBatchGeminiWithRetry(images, model, thinkingLevelStr, 3, onModelFallback, mathAnnotationStyle, onStreamProgress);
    const parsed = JSON.parse(result.text);
    
    if (parsed.pages) {
      parsed.pages = parsed.pages.map((page: any) => {
        if (page.html) {
          page.html = beautify.html(page.html, {
            indent_size: 2,
            wrap_line_length: 120,
            preserve_newlines: true
          });
        }
        return page;
      });
    }

    return { pages: parsed.pages as GeminiPageResponse[], tokenCount: result.tokenCount, actualModelUsed: result.actualModel };
  } catch (error: any) {
    console.error('Gemini Batch API Error:', error);
    throw new Error(`Failed to process batch: ${error.message}`);
  }
};

export const fixTextFormatting = async (text: string, model: ModelType = 'gemini-3.8-flash'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: `Fix the formatting of the following extracted text/HTML from a mathematical document. 
          
          RULES:
          1. If it contains math, format it properly as LaTeX (use \\( ... \\) for inline and \\[ ... \\] for block math).
          2. Fix any obvious OCR errors, garbled text, or broken HTML tags.
          3. Maintain the original meaning and structure.
          4. If you see any <mjx-container> or <math> tags in the HTML, convert them back to raw LaTeX delimiters (\\( ... \\) or \\[ ... \\]).
          5. Return ONLY the corrected HTML/text. Do not include markdown code blocks like \`\`\`html.
          
          TEXT TO FIX:
          ${text}` }
        ]
      },
      config: {
        temperature: 0.1,
        ...((model.includes('pro') || model.includes('3.8-flash') || model.includes('3.7-flash')) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
      }
    });

    let result = response.text?.trim() || "";
    if (!result) {
      throw new Error("Empty response from Gemini");
    }
    if (result.startsWith('```html')) {
      result = result.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    return beautify.html(result, {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true
    });
  } catch (error: any) {
    console.error('Fix text error:', error);
    if (model === 'gemini-3.8-flash' || model === 'gemini-3.7-flash' || model === 'gemini-3.1-pro-preview') {
      console.warn(`Retrying fixTextFormatting with gemini-3.5-flash fallback from ${model}`);
      return fixTextFormatting(text, 'gemini-3.5-flash' as any);
    }
    throw error;
  }
};

export const autoFixAccessibilityIssue = async (html: string, issueTitle: string, issueDescription: string, issueSuggestion: string, model: ModelType = 'gemini-3.8-flash'): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: `You are an expert in Web Accessibility (WCAG 2.2 AA) and semantic mathematical HTML.
Your task is to fix a specific accessibility issue in the provided HTML document.

ACCESSIBILITY ISSUE TO FIX:
- Title: ${issueTitle}
- Description: ${issueDescription}
- Suggested Fix: ${issueSuggestion}

STRICT ARCHITECTURAL & COMPLIANCE RULES:
1. MATHEMATICAL FORMULA INTEGRITY:
   - All formulas MUST strictly preserve their LaTeX delimiters: \\( ... \\) for inline math and \\[ ... \\] for display math.
   - NEVER alter, remove, escape, or unescape LaTeX backslashes or macros (e.g. \\frac, \\sum, \\int, \\aligned, \\sqrt).
   - NEVER touch or modify MathJax/LaTeX elements (<mjx-container>, <math>) if present.

2. ISSUE-SPECIFIC REMEDIATION PATTERNS:
   - Heading Order (1.3.1): Re-sequence heading tags (<h1>, <h2>, <h3>, <h4>) so they follow a strict hierarchical order without skipping levels (e.g., ensure an <h1> exists as primary title, followed by <h2>, then <h3>).
   - Landmarks (1.3.1): If semantic landmarks are missing, ensure main content is wrapped inside semantic elements like <article role="article" class="math-document">, <header>, <section>, or <main>.
   - Table Data (1.3.1): In any <table> elements, ensure header cells use <th> elements with explicit scope="col" (for column headers) and scope="row" (for row headers). Convert top row <td> to <th scope="col">.
   - Contrast (1.4.3): Replace low-contrast gray text classes (such as text-slate-300, text-gray-300, text-zinc-300, text-slate-400) with high-contrast, accessible classes (text-slate-800, text-zinc-900).
   - Alt Text (1.1.1) & Figures: Ensure all <img> tags have meaningful descriptive alt="..." attributes and are wrapped inside <figure role="group"> with descriptive <figcaption>.
   - Keyboard & Interactive (2.1.1): Ensure all buttons/links have text or aria-label and remove improper tabindex="-1".
   - Math Structure (1.3.1): Ensure any raw single dollar signs ($...$) or double dollar signs ($$...$$) are converted to standard \\( ... \\) and \\[ ... \\].

3. MINIMAL SURGICAL INTERVENTION:
   - Apply ONLY the necessary changes to resolve the accessibility violation.
   - Preserve all existing Tailwind classes, styling, layout wrappers, and HTML IDs.
   - Return ONLY the clean, corrected HTML. Do NOT wrap in markdown code fences (\`\`\`html) or include explanatory text.

HTML TO FIX:
${html}` }
        ]
      },
      config: {
        temperature: 0.1,
        ...((model.includes('pro') || model.includes('3.8-flash') || model.includes('3.7-flash')) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
      }
    });

    let result = response.text?.trim() || "";
    if (!result) {
      throw new Error("Empty response from Gemini");
    }
    if (result.startsWith('```html')) {
      result = result.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    return beautify.html(result, {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true
    });
  } catch (error: any) {
    console.error('Auto-fix accessibility error:', error);
    if (model === 'gemini-3.8-flash' || model === 'gemini-3.7-flash' || model === 'gemini-3.1-pro-preview') {
      console.warn(`Retrying autoFixAccessibilityIssue with gemini-3.5-flash fallback from ${model}`);
      return autoFixAccessibilityIssue(html, issueTitle, issueDescription, issueSuggestion, 'gemini-3.5-flash' as any);
    }
    throw error;
  }
};

export const autoFixAllAccessibilityIssues = async (
  html: string,
  failingChecks: { title: string; description: string; suggestion?: string }[],
  model: ModelType = 'gemini-3.8-flash'
): Promise<string> => {
  if (!failingChecks || failingChecks.length === 0) {
    return html;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  const issuesSummary = failingChecks.map((c, i) => 
    `${i + 1}. [${c.title}]: ${c.description}${c.suggestion ? ` -> Recommendation: ${c.suggestion}` : ''}`
  ).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: `You are an expert in Web Accessibility (WCAG 2.2 AA) and mathematical HTML document remediation.
Your task is to fix ALL identified accessibility issues in the provided document in a single comprehensive pass.

FAILING ACCESSIBILITY CHECKS TO RESOLVE:
${issuesSummary}

STRICT REMEDIATION DIRECTIVES:
1. PRESERVE MATHEMATICS:
   - All math formulas MUST keep their exact LaTeX delimiters: \\( ... \\) for inline math and \\[ ... \\] for display math.
   - Do NOT unescape, alter, or remove LaTeX expressions or backslashes.
   - Do NOT touch <mjx-container> or <math> elements.

2. SYSTEMATIC WCAG RESOLUTION:
   - Headings: Ensure hierarchical heading sequence starting with <h1> for main page title, followed by <h2>, <h3> without skipping levels.
   - Landmarks: Wrap primary content in <article role="article" class="math-document"> or <section> elements.
   - Tables: Ensure every <table> has <th scope="col"> / <th scope="row"> header cells.
   - Colors/Contrast: Replace low-contrast gray text classes (text-slate-300, text-gray-300) with accessible dark text (text-slate-800).
   - Figures: Ensure all <img> tags have descriptive alt="..." attributes and are wrapped in <figure role="group">.
   - Math structure: Convert any bare $...$ or $$...$$ delimiters to \\( ... \\) and \\[ ... \\].

3. OUTPUT FORMAT:
   - Return ONLY the corrected HTML string.
   - Do NOT wrap in markdown code blocks like \`\`\`html.
   - Keep all layout styles, IDs, and classes intact.

HTML DOCUMENT:
${html}` }
        ]
      },
      config: {
        temperature: 0.1,
        ...((model.includes('pro') || model.includes('3.8-flash') || model.includes('3.7-flash')) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
      }
    });

    let result = response.text?.trim() || "";
    if (!result) {
      throw new Error("Empty response from Gemini during comprehensive fix");
    }
    if (result.startsWith('```html')) {
      result = result.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    return beautify.html(result, {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true
    });
  } catch (error: any) {
    console.error('Auto-fix all accessibility issues error:', error);
    if (model === 'gemini-3.8-flash' || model === 'gemini-3.7-flash' || model === 'gemini-3.1-pro-preview') {
      console.warn(`Retrying autoFixAllAccessibilityIssues with gemini-3.5-flash fallback from ${model}`);
      return autoFixAllAccessibilityIssues(html, failingChecks, 'gemini-3.5-flash' as any);
    }
    throw error;
  }
};

export const describeFigure = async (base64Image: string, model: ModelType = 'gemini-3.8-flash'): Promise<{alt: string, caption: string, tokenCount: number}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  try {
    const response = await ai.models.generateContent({
      model: model, // Dynamically use the selected model
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] || base64Image } },
          { text: `Generate a highly accessible, short, and concise alt text description (1 sentence or a few words) of this mathematical figure for a blind student, AND a highly detailed, comprehensive visible caption for all users.
          
          RULES:
          1. CONCISENESS FOR ALT: Limit alt text to a very brief description of what the figure is (e.g. "Triangle diagram for geometry problem").
          2. DETAILS FOR CAPTION: Provide a detailed, step-by-step description in the caption of all math symbols, lines, variables, curves, axes, and values so anyone can fully understand it.
          3. NO ABRUPT CUTOFFS: Ensure both thoughts are complete, well-formed, and end naturally.
          4. BEST FIT: Do not assume fixed orientation; describe the logical mathematical content.
          5. MATHEMATICAL PRECISION (CRITICAL): Ensure that ANY mathematical variables, equations, exponents (e.g. \\( x^2 \\), \\( e^{-2t} \\)), fractions, or LaTeX expressions in BOTH the alt text AND the caption are strictly enclosed within \\( ... \\) for inline math or \\[ ... \\] for block math. Example caption: "Coordinates graph plotting exponential curves \\( y = Ce^x \\) with \\( C > 0 \\) and parabola \\( y = x^2 \\)."
          6. SPOKEN MATH: Provide a spoken-word equivalent for complex mathematical notation to ensure accessibility for screen readers.
          
          Return ONLY a JSON object with 'alt' and 'caption' string properties.` }
        ]
      },
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alt: { type: Type.STRING },
            caption: { type: Type.STRING }
          },
          required: ["alt", "caption"]
        },
        ...((model.includes('pro') || model.includes('3.8-flash') || model.includes('3.7-flash')) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
      }
    });

    const text = response.text?.trim() || "";
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    const parsed = JSON.parse(text);
    return { 
      alt: parsed.alt || "", 
      caption: parsed.caption || "", 
      tokenCount: response.usageMetadata?.totalTokenCount || 0 
    };
  } catch (error: any) {
    console.error('Description error:', error);
    if (model === 'gemini-3.8-flash' || model === 'gemini-3.7-flash' || model === 'gemini-3.1-pro-preview') {
      console.warn(`Retrying describeFigure with gemini-3.5-flash fallback from ${model}`);
      return describeFigure(base64Image, 'gemini-3.5-flash' as any);
    }
    throw error;
  }
};

export interface SvgGenerationResult {
  svg: string;
  dataUri: string;
  tokenCount: number;
}

export const generateSvgDiagramFromImage = async (
  base64Image: string,
  caption: string = "",
  alt: string = "",
  model: ModelType = 'gemini-3.8-flash'
): Promise<SvgGenerationResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  let mimeType = 'image/png';
  if (base64Image.startsWith('data:')) {
    const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    if (match) {
      mimeType = match[1];
    }
  }
  const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: rawBase64 } },
          { text: `You are an expert mathematical illustrator and SVG developer.
Your task is to reconstruct the mathematical diagram/plot/geometry shown in this cropped image into a clean, modern, accessible Scalable Vector Graphic (<svg>).

CONTEXT:
- Title/Alt: ${alt || "Mathematical figure"}
- Caption: ${caption || "Mathematical plot or diagram"}

CRITICAL SVG SPECIFICATIONS:
1. ROOT ELEMENT & BOUNDS:
   - Must be a valid <svg> root element with a tight, well-fitted viewBox (e.g. viewBox="0 0 800 600" or proportional to the aspect ratio).
   - The viewBox MUST tightly bound the diagram content with minimal margins (5-10% padding maximum). DO NOT create a huge empty canvas with tiny elements in the center. Scale the coordinates so the diagram fills the available viewBox area boldly and legibly.
   - Must include xmlns="http://www.w3.org/2000/svg".
   - Must include width="100%" height="auto" and style="max-width: 100%; display: block;" for responsive fluid scaling.
   - Use clean, modern stroke colors (e.g. #4338ca for primary function curves, #0284c7 for secondary curves, #3f3f46 for axes and tick marks, #ffffff for background).

2. ACCESSIBILITY:
   - Include an accessible <title>${alt || "Mathematical Diagram"}</title>.
   - Include an accessible <desc>${caption || "Vector diagram representation"}</desc>.

3. COORDINATE SYSTEMS & LABELS (if applicable):
   - Define arrowheads in <defs>:
     <defs>
       <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
         <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3f3f46"/>
       </marker>
     </defs>
   - Draw coordinate axes with marker-end="url(#arrow)" (stroke="#3f3f46", stroke-width="2.5").
   - Add clean, readable axis labels ('x', 'y', etc.) with clear, legible font size (e.g. font-size="18px" or "20px") and text-anchor.
   - Use font-family="system-ui, -apple-system, sans-serif" for all <text> elements.

4. MATHEMATICAL CURVES & GEOMETRY:
   - Use smooth bezier paths (<path d="...">) or standard primitives (<line>, <circle>, <polygon>, <path>) for functions and geometric shapes.
   - Use stroke-width="3" or "3.5" for main curves, stroke-width="2" for subsidiary lines or grids.
   - For dashed or dotted lines (asymptotes, guidelines), use stroke-dasharray="6,4".
   - Ensure the diagram artwork is scaled generously within the viewBox.

5. BACKGROUND:
   - Add a clean background rectangle with rounded corners: <rect width="100%" height="100%" fill="#ffffff" rx="12"/> to ensure readability on any background.

6. OUTPUT FORMAT:
   - Return ONLY the raw valid <svg ...> ... </svg> code.
   - Do NOT include markdown code fences (no \`\`\`xml or \`\`\`svg blocks).
   - Do NOT include any explanations or conversational chatter.` }
        ]
      },
      config: {
        temperature: 0.1,
        ...((model.includes('pro') || model.includes('3.8-flash') || model.includes('3.7-flash')) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {})
      }
    });

    let rawText = response.text?.trim() || "";
    if (rawText.startsWith('```xml')) {
      rawText = rawText.replace(/^```xml\n?/, '').replace(/\n?```$/, '');
    } else if (rawText.startsWith('```svg')) {
      rawText = rawText.replace(/^```svg\n?/, '').replace(/\n?```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const svgMatch = rawText.match(/<svg[\s\S]*<\/svg>/i);
    let cleanedSvg = svgMatch ? svgMatch[0] : rawText;

    if (!cleanedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      cleanedSvg = cleanedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Ensure responsive attributes
    if (!cleanedSvg.includes('width=')) {
      cleanedSvg = cleanedSvg.replace('<svg', '<svg width="100%"');
    }
    if (!cleanedSvg.includes('height=')) {
      cleanedSvg = cleanedSvg.replace('<svg', '<svg height="auto"');
    }

    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanedSvg)}`;
    const tokenCount = response.usageMetadata?.totalTokenCount || 0;

    return {
      svg: cleanedSvg,
      dataUri,
      tokenCount
    };
  } catch (error: any) {
    console.error('Vector SVG generation error:', error);
    if (model === 'gemini-3.8-flash' || model === 'gemini-3.7-flash') {
      console.warn(`Retrying generateSvgDiagramFromImage with fallback`);
      return generateSvgDiagramFromImage(base64Image, caption, alt, 'gemini-3.5-flash' as any);
    }
    throw error;
  }
};
