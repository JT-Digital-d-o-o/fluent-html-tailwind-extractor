/**
 * Tailwind CSS content extractor for fluent-html
 * Extracts Tailwind classes from fluent method calls
 */

interface MethodPattern {
  methodName: string;
  generateClass: (args: string[]) => string[];
}

export interface ExtractorOptions {
  /** Called when a fluent method call is detected but can't be resolved to a class. */
  onWarning?: (message: string) => void;
}

/**
 * Strip TypeScript `as` cast expressions so they don't break regex matching.
 * Handles: `as const`, `as SomeType`, `as Type<Generic>`, `as "literal"`
 */
function stripTypeCasts(content: string): string {
  return content.replace(/\s+as\s+(?:const|"[^"]*"|'[^']*'|[A-Za-z_]\w*(?:<[^>]*>)?)/g, "");
}

const dirMap: Record<string, string> = {
  x: "x", y: "y",
  top: "t", bottom: "b", left: "l", right: "r",
  t: "t", b: "b", l: "l", r: "r",
};

const UNITS = new Set(["px", "rem", "em", "%", "vh", "vw", "dvh", "svh", "lvh"]);

/** Check if first arg is a CSS unit → generate arbitrary value class */
function arbitraryOrStandard(prefix: string, args: string[]): string[] {
  if (args.length === 1) return [`${prefix}-${args[0]}`];
  if (args.length === 2 && UNITS.has(args[0])) {
    const unit = args[0] === "%" ? "%" : args[0];
    return [`${prefix}-[${args[1]}${unit}]`];
  }
  return [];
}

/** Like arbitraryOrStandard but also handles direction (padding/margin) */
function spacingClass(prefix: string, args: string[]): string[] {
  if (args.length === 1) return [`${prefix}-${args[0]}`];
  if (args.length === 2) {
    if (UNITS.has(args[0])) {
      const unit = args[0] === "%" ? "%" : args[0];
      return [`${prefix}-[${args[1]}${unit}]`];
    }
    const dir = dirMap[args[0]] || args[0];
    return [`${prefix}${dir}-${args[1]}`];
  }
  return [];
}

const METHOD_PATTERNS: MethodPattern[] = [
  // --- Spacing ---
  {
    methodName: "padding",
    generateClass: (args) => spacingClass("p", args),
  },
  {
    methodName: "margin",
    generateClass: (args) => spacingClass("m", args),
  },
  {
    methodName: "gap",
    generateClass: (args) => {
      if (args.length === 1) return [`gap-${args[0]}`];
      if (args.length === 2) {
        if (UNITS.has(args[0])) {
          const unit = args[0] === "%" ? "%" : args[0];
          return [`gap-[${args[1]}${unit}]`];
        }
        return [`gap-${args[0]}-${args[1]}`];
      }
      return [];
    },
  },
  {
    methodName: "spaceX",
    generateClass: (args) => args.length === 1 ? [`space-x-${args[0]}`] : [],
  },
  {
    methodName: "spaceY",
    generateClass: (args) => args.length === 1 ? [`space-y-${args[0]}`] : [],
  },

  // --- Colors ---
  {
    methodName: "background",
    generateClass: (args) => args.length === 1 ? [`bg-${args[0]}`] : [],
  },
  {
    methodName: "textColor",
    generateClass: (args) => args.length === 1 ? [`text-${args[0]}`] : [],
  },
  {
    methodName: "borderColor",
    generateClass: (args) => {
      if (args.length === 1) return [`border-${args[0]}`];
      if (args.length === 2) {
        const dir = dirMap[args[0]] || args[0];
        return [`border-${dir}-${args[1]}`];
      }
      return [];
    },
  },
  {
    methodName: "ringColor",
    generateClass: (args) => args.length === 1 ? [`ring-${args[0]}`] : [],
  },

  // --- Typography ---
  {
    methodName: "textSize",
    generateClass: (args) => args.length === 1 ? [`text-${args[0]}`] : [],
  },
  {
    methodName: "textAlign",
    generateClass: (args) => args.length === 1 ? [`text-${args[0]}`] : [],
  },
  {
    methodName: "fontWeight",
    generateClass: (args) => args.length === 1 ? [`font-${args[0]}`] : [],
  },
  { methodName: "bold", generateClass: () => ["font-bold"] },
  { methodName: "italic", generateClass: () => ["italic"] },
  { methodName: "uppercase", generateClass: () => ["uppercase"] },
  { methodName: "lowercase", generateClass: () => ["lowercase"] },
  { methodName: "capitalize", generateClass: () => ["capitalize"] },
  { methodName: "underline", generateClass: () => ["underline"] },
  { methodName: "noUnderline", generateClass: () => ["no-underline"] },
  { methodName: "lineThrough", generateClass: () => ["line-through"] },
  { methodName: "truncate", generateClass: () => ["truncate"] },
  {
    methodName: "leading",
    generateClass: (args) => args.length === 1 ? [`leading-${args[0]}`] : [],
  },
  {
    methodName: "tracking",
    generateClass: (args) => args.length === 1 ? [`tracking-${args[0]}`] : [],
  },
  {
    methodName: "whitespace",
    generateClass: (args) => args.length === 1 ? [`whitespace-${args[0]}`] : [],
  },

  // --- Sizing ---
  { methodName: "w", generateClass: (args) => arbitraryOrStandard("w", args) },
  { methodName: "h", generateClass: (args) => arbitraryOrStandard("h", args) },
  { methodName: "maxW", generateClass: (args) => arbitraryOrStandard("max-w", args) },
  { methodName: "minW", generateClass: (args) => arbitraryOrStandard("min-w", args) },
  { methodName: "maxH", generateClass: (args) => arbitraryOrStandard("max-h", args) },
  { methodName: "minH", generateClass: (args) => arbitraryOrStandard("min-h", args) },

  // --- Display & Layout ---
  {
    methodName: "display",
    generateClass: (args) => args.length === 1 ? [args[0]] : [],
  },
  { methodName: "hidden", generateClass: () => ["hidden"] },
  {
    methodName: "flex",
    generateClass: (args) => args.length === 0 ? ["flex"] : [`flex-${args[0]}`],
  },
  {
    methodName: "flexDirection",
    generateClass: (args) => args.length === 1 ? [`flex-${args[0]}`] : [],
  },
  {
    methodName: "flexWrap",
    generateClass: (args) => args.length === 1 ? [`flex-${args[0]}`] : [],
  },
  {
    methodName: "justifyContent",
    generateClass: (args) => args.length === 1 ? [`justify-${args[0]}`] : [],
  },
  {
    methodName: "alignItems",
    generateClass: (args) => args.length === 1 ? [`items-${args[0]}`] : [],
  },
  {
    methodName: "alignSelf",
    generateClass: (args) => args.length === 1 ? [`self-${args[0]}`] : [],
  },
  { methodName: "flex1", generateClass: () => ["flex-1"] },
  {
    methodName: "shrink",
    generateClass: (args) => args.length === 0 ? ["shrink"] : [`shrink-${args[0]}`],
  },
  {
    methodName: "grow",
    generateClass: (args) => args.length === 0 ? ["grow"] : [`grow-${args[0]}`],
  },
  {
    methodName: "placeContent",
    generateClass: (args) => args.length === 1 ? [`place-content-${args[0]}`] : [],
  },
  {
    methodName: "placeItems",
    generateClass: (args) => args.length === 1 ? [`place-items-${args[0]}`] : [],
  },
  {
    methodName: "placeSelf",
    generateClass: (args) => args.length === 1 ? [`place-self-${args[0]}`] : [],
  },

  // --- Grid ---
  { methodName: "grid", generateClass: () => ["grid"] },
  {
    methodName: "gridCols",
    generateClass: (args) => args.length === 1 ? [`grid-cols-${args[0]}`] : [],
  },
  {
    methodName: "gridRows",
    generateClass: (args) => args.length === 1 ? [`grid-rows-${args[0]}`] : [],
  },
  {
    methodName: "gridAutoFlow",
    generateClass: (args) => args.length === 1 ? [`grid-flow-${args[0]}`] : [],
  },
  {
    methodName: "gridAutoRows",
    generateClass: (args) => args.length === 1 ? [`auto-rows-${args[0]}`] : [],
  },
  {
    methodName: "gridAutoCols",
    generateClass: (args) => args.length === 1 ? [`auto-cols-${args[0]}`] : [],
  },
  {
    methodName: "colSpan",
    generateClass: (args) => args.length === 1 ? [`col-span-${args[0]}`] : [],
  },
  {
    methodName: "aspect",
    generateClass: (args) => args.length === 1 ? [`aspect-${args[0]}`] : [],
  },
  {
    methodName: "order",
    generateClass: (args) => args.length === 1 ? [`order-${args[0]}`] : [],
  },

  // --- Borders ---
  {
    methodName: "border",
    generateClass: (args) => {
      if (args.length === 0) return ["border"];
      if (args.length === 1) {
        const dir = dirMap[args[0]];
        return dir !== undefined ? [`border-${dir}`] : [`border-${args[0]}`];
      }
      if (args.length === 2) {
        const dir = dirMap[args[0]] || args[0];
        return [`border-${dir}-${args[1]}`];
      }
      return [];
    },
  },
  {
    methodName: "borderStyle",
    generateClass: (args) => args.length === 1 ? [`border-${args[0]}`] : [],
  },
  {
    methodName: "rounded",
    generateClass: (args) => {
      if (args.length === 0) return ["rounded"];
      if (args.length === 1) return [`rounded-${args[0]}`];
      if (args.length === 2) return [`rounded-${args[0]}-${args[1]}`];
      return [];
    },
  },
  {
    methodName: "divideX",
    generateClass: (args) => args.length === 0 ? ["divide-x"] : [`divide-x-${args[0]}`],
  },
  {
    methodName: "divideY",
    generateClass: (args) => args.length === 0 ? ["divide-y"] : [`divide-y-${args[0]}`],
  },
  {
    methodName: "outline",
    generateClass: (args) => args.length === 0 ? ["outline"] : [`outline-${args[0]}`],
  },

  // --- Effects ---
  {
    methodName: "shadow",
    generateClass: (args) => args.length === 0 ? ["shadow"] : [`shadow-${args[0]}`],
  },
  {
    methodName: "opacity",
    generateClass: (args) => args.length === 1 ? [`opacity-${args[0]}`] : [],
  },
  {
    methodName: "ring",
    generateClass: (args) => args.length === 0 ? ["ring"] : [`ring-${args[0]}`],
  },

  // --- Positioning ---
  {
    methodName: "position",
    generateClass: (args) => args.length === 1 ? [args[0]] : [],
  },
  { methodName: "inset", generateClass: (args) => arbitraryOrStandard("inset", args) },
  { methodName: "top", generateClass: (args) => arbitraryOrStandard("top", args) },
  { methodName: "right", generateClass: (args) => arbitraryOrStandard("right", args) },
  { methodName: "bottom", generateClass: (args) => arbitraryOrStandard("bottom", args) },
  { methodName: "left", generateClass: (args) => arbitraryOrStandard("left", args) },
  {
    methodName: "zIndex",
    generateClass: (args) => args.length === 1 ? [`z-${args[0]}`] : [],
  },

  // --- Overflow ---
  {
    methodName: "overflow",
    generateClass: (args) => {
      if (args.length === 1) return [`overflow-${args[0]}`];
      if (args.length === 2) return [`overflow-${args[0]}-${args[1]}`];
      return [];
    },
  },
  {
    methodName: "objectFit",
    generateClass: (args) => args.length === 1 ? [`object-${args[0]}`] : [],
  },

  // --- Transitions & Animation ---
  {
    methodName: "transition",
    generateClass: (args) => args.length === 0 ? ["transition"] : [`transition-${args[0]}`],
  },
  {
    methodName: "duration",
    generateClass: (args) => args.length === 1 ? [`duration-${args[0]}`] : [],
  },
  {
    methodName: "animate",
    generateClass: (args) => args.length === 1 ? [`animate-${args[0]}`] : [],
  },

  // --- Transforms ---
  {
    methodName: "scale",
    generateClass: (args) => args.length === 1 ? [`scale-${args[0]}`] : [],
  },
  {
    methodName: "rotate",
    generateClass: (args) => args.length === 1 ? [`rotate-${args[0]}`] : [],
  },
  {
    methodName: "translate",
    generateClass: (args) => args.length === 2 ? [`translate-${args[0]}-${args[1]}`] : [],
  },
  {
    methodName: "skewX",
    generateClass: (args) => args.length === 1 ? [`skew-x-${args[0]}`] : [],
  },
  {
    methodName: "skewY",
    generateClass: (args) => args.length === 1 ? [`skew-y-${args[0]}`] : [],
  },

  // --- Interactivity ---
  {
    methodName: "cursor",
    generateClass: (args) => args.length === 1 ? [`cursor-${args[0]}`] : [],
  },
  {
    methodName: "select",
    generateClass: (args) => args.length === 1 ? [`select-${args[0]}`] : [],
  },
  {
    methodName: "pointerEvents",
    generateClass: (args) => args.length === 1 ? [`pointer-events-${args[0]}`] : [],
  },

  // --- Accessibility ---
  { methodName: "srOnly", generateClass: () => ["sr-only"] },

  // --- Font Family ---
  {
    methodName: "fontFamily",
    generateClass: (args) => args.length === 1 ? [`font-${args[0]}`] : [],
  },

  // --- Gradients ---
  {
    methodName: "gradientTo",
    generateClass: (args) => args.length === 1 ? [`bg-gradient-${args[0]}`] : [],
  },
  {
    methodName: "from",
    generateClass: (args) => args.length === 1 ? [`from-${args[0]}`] : [],
  },
  {
    methodName: "via",
    generateClass: (args) => args.length === 1 ? [`via-${args[0]}`] : [],
  },
  {
    methodName: "to",
    generateClass: (args) => args.length === 1 ? [`to-${args[0]}`] : [],
  },

  // --- Shadow Color ---
  {
    methodName: "shadowColor",
    generateClass: (args) => args.length === 1 ? [`shadow-${args[0]}`] : [],
  },

  // --- Blur & Backdrop Blur ---
  {
    methodName: "blur",
    generateClass: (args) => args.length === 0 ? ["blur"] : [`blur-${args[0]}`],
  },
  {
    methodName: "backdropBlur",
    generateClass: (args) => args.length === 0 ? ["backdrop-blur"] : [`backdrop-blur-${args[0]}`],
  },

  // --- Line Clamp ---
  {
    methodName: "lineClamp",
    generateClass: (args) => args.length === 1 ? [`line-clamp-${args[0]}`] : [],
  },

  // --- Typography Extras ---
  { methodName: "antialiased", generateClass: () => ["antialiased"] },
  { methodName: "tabularNums", generateClass: () => ["tabular-nums"] },
  {
    methodName: "underlineOffset",
    generateClass: (args) => args.length === 1 ? [`underline-offset-${args[0]}`] : [],
  },
  { methodName: "breakAll", generateClass: () => ["break-all"] },

  // --- Timing Function ---
  {
    methodName: "ease",
    generateClass: (args) => args.length === 1 ? [`ease-${args[0]}`] : [],
  },

  // --- Resize ---
  {
    methodName: "resize",
    generateClass: (args) => args.length === 0 ? ["resize"] : [`resize-${args[0]}`],
  },

  // --- Group / Peer ---
  {
    methodName: "group",
    generateClass: (args) => args.length === 0 ? ["group"] : [`group/${args[0]}`],
  },
  {
    methodName: "peer",
    generateClass: (args) => args.length === 0 ? ["peer"] : [`peer/${args[0]}`],
  },

  // --- Filters ---
  {
    methodName: "brightness",
    generateClass: (args) => args.length === 1 ? [`brightness-${args[0]}`] : [],
  },
  {
    methodName: "backdropBrightness",
    generateClass: (args) => args.length === 1 ? [`backdrop-brightness-${args[0]}`] : [],
  },
  {
    methodName: "contrast",
    generateClass: (args) => args.length === 1 ? [`contrast-${args[0]}`] : [],
  },
  {
    methodName: "backdropContrast",
    generateClass: (args) => args.length === 1 ? [`backdrop-contrast-${args[0]}`] : [],
  },
  {
    methodName: "grayscale",
    generateClass: (args) => args.length === 0 ? ["grayscale"] : [`grayscale-${args[0]}`],
  },
  {
    methodName: "backdropGrayscale",
    generateClass: (args) => args.length === 0 ? ["backdrop-grayscale"] : [`backdrop-grayscale-${args[0]}`],
  },
  {
    methodName: "hueRotate",
    generateClass: (args) => args.length === 1 ? [`hue-rotate-${args[0]}`] : [],
  },
  {
    methodName: "backdropHueRotate",
    generateClass: (args) => args.length === 1 ? [`backdrop-hue-rotate-${args[0]}`] : [],
  },
  {
    methodName: "invert",
    generateClass: (args) => args.length === 0 ? ["invert"] : [`invert-${args[0]}`],
  },
  {
    methodName: "backdropInvert",
    generateClass: (args) => args.length === 0 ? ["backdrop-invert"] : [`backdrop-invert-${args[0]}`],
  },
  {
    methodName: "saturate",
    generateClass: (args) => args.length === 1 ? [`saturate-${args[0]}`] : [],
  },
  {
    methodName: "backdropSaturate",
    generateClass: (args) => args.length === 1 ? [`backdrop-saturate-${args[0]}`] : [],
  },
  {
    methodName: "sepia",
    generateClass: (args) => args.length === 0 ? ["sepia"] : [`sepia-${args[0]}`],
  },
  {
    methodName: "backdropSepia",
    generateClass: (args) => args.length === 0 ? ["backdrop-sepia"] : [`backdrop-sepia-${args[0]}`],
  },

  // --- Will Change / Overscroll ---
  {
    methodName: "willChange",
    generateClass: (args) => args.length === 1 ? [`will-change-${args[0]}`] : [],
  },
  {
    methodName: "overscroll",
    generateClass: (args) => {
      if (args.length === 1) return [`overscroll-${args[0]}`];
      if (args.length === 2) return [`overscroll-${args[0]}-${args[1]}`];
      return [];
    },
  },

  // --- List Style ---
  {
    methodName: "listStyleType",
    generateClass: (args) => args.length === 1 ? [`list-${args[0]}`] : [],
  },
  {
    methodName: "listStylePosition",
    generateClass: (args) => args.length === 1 ? [`list-${args[0]}`] : [],
  },
];

/**
 * Extract arguments from a method call.
 * e.g., .flex() -> []
 * e.g., .background("red-500") -> ["red-500"]
 * e.g., .padding("x", "4") -> ["x", "4"]
 * e.g., .w("px", 180) -> ["px", "180"]  (numeric second arg)
 */
function extractMethodArgs(content: string, methodName: string): string[][] {
  const regex = new RegExp(
    `\\.${methodName}\\s*\\(\\s*` +
    `(?:` +
      `(?:` +
        `"([^"]*)"` +
        `|` +
        `'([^']*)'` +
      `)` +
      `(?:\\s*,\\s*` +
        `(?:"([^"]*)"|'([^']*)'|(\\d+(?:\\.\\d+)?))` +
      `)?` +
    `)?` +
    `\\s*\\)`,
    "g"
  );

  const results: string[][] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const args: string[] = [];
    if (match[1] !== undefined) args.push(match[1]);
    else if (match[2] !== undefined) args.push(match[2]);

    if (match[3] !== undefined) args.push(match[3]);
    else if (match[4] !== undefined) args.push(match[4]);
    else if (match[5] !== undefined) args.push(match[5]);

    results.push(args);
  }

  return results;
}

/**
 * Extract classes from .setClass() and .addClass() calls.
 */
function extractDirectClasses(content: string): string[] {
  const classes: string[] = [];
  const regex = /\.(setClass|addClass)\s*\(\s*["']([^"']+)["']\s*\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const splitClasses = match[2].split(/\s+/).filter(Boolean);
    classes.push(...splitClasses);
  }

  return classes;
}

/**
 * Find the matching closing parenthesis for an opening paren at `startIndex`.
 */
function findMatchingParen(content: string, startIndex: number): number {
  let depth = 1;
  for (let i = startIndex + 1; i < content.length; i++) {
    const ch = content[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
    // Skip string literals
    else if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === "\\") i++;
        i++;
      }
    }
    // Skip template literals
    else if (ch === "`") {
      i++;
      while (i < content.length && content[i] !== "`") {
        if (content[i] === "\\") i++;
        i++;
      }
    }
  }
  return -1;
}

/**
 * Extract variant-prefixed classes from .on() and .at() calls.
 * Handles nesting: .on("dark", t => t.on("hover", ...)) => dark:hover:...
 */
function extractVariantClasses(content: string, outerPrefix: string = ""): string[] {
  const classes: string[] = [];
  // Match .on("variant", or .at("breakpoint",
  const regex = /\.(on|at)\s*\(\s*["']([^"']+)["']\s*,/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variant = match[2];
    const prefix = outerPrefix ? `${outerPrefix}:${variant}` : variant;

    // Find the opening paren of the .on(/.at( call
    const parenStart = content.indexOf("(", match.index);
    if (parenStart === -1) continue;

    const parenEnd = findMatchingParen(content, parenStart);
    if (parenEnd === -1) continue;

    // Extract the callback body between the parens
    const callbackBody = content.slice(parenStart + 1, parenEnd);

    // Extract fluent method classes from the callback body
    for (const pattern of METHOD_PATTERNS) {
      const argsArray = extractMethodArgs(callbackBody, pattern.methodName);
      for (const args of argsArray) {
        const generated = pattern.generateClass(args);
        for (const cls of generated) {
          classes.push(`${prefix}:${cls}`);
        }
      }
    }

    // Extract direct addClass/setClass calls inside callback
    const directClasses = extractDirectClasses(callbackBody);
    for (const cls of directClasses) {
      classes.push(`${prefix}:${cls}`);
    }

    // Recurse for nested .on()/.at() calls
    const nested = extractVariantClasses(callbackBody, prefix);
    classes.push(...nested);
  }

  return classes;
}

/**
 * Extract default Tailwind class candidates from content.
 * This mirrors Tailwind's built-in default extractor so that our custom
 * extractor can fully replace it without losing standard class detection
 * (e.g., classes in HTML class="..." attributes or template literals).
 */
function extractDefaultClasses(content: string): string[] {
  const matches = content.match(/[:\w\-/.@#[\]]+(?:\([^)]*\))?/g);
  return matches || [];
}

/**
 * Main extractor function for Tailwind CSS.
 * Includes default class candidate extraction so it can fully replace
 * Tailwind's built-in extractor without losing standard class detection.
 */
export function fluentHtmlExtractor(content: string, options?: ExtractorOptions): string[] {
  const classes = new Set<string>();
  const warn = options?.onWarning;

  // Strip TypeScript `as` casts so they don't break method-call regex matching
  const stripped = stripTypeCasts(content);

  // Extract default Tailwind class candidates (replaces built-in extractor)
  for (const cls of extractDefaultClasses(stripped)) {
    classes.add(cls);
  }

  // Extract classes from direct setClass/addClass calls
  for (const cls of extractDirectClasses(stripped)) {
    classes.add(cls);
  }

  // Extract classes from fluent method calls
  for (const pattern of METHOD_PATTERNS) {
    const argsArray = extractMethodArgs(stripped, pattern.methodName);
    for (const args of argsArray) {
      const generated = pattern.generateClass(args);
      for (const cls of generated) {
        classes.add(cls);
      }
    }
  }

  // Warn about unresolved fluent method calls
  if (warn) {
    for (const pattern of METHOD_PATTERNS) {
      // Count how many .method( calls exist in the stripped content
      const callRegex = new RegExp(`\\.${pattern.methodName}\\s*\\(`, "g");
      const callMatches = [...stripped.matchAll(callRegex)];
      const extracted = extractMethodArgs(stripped, pattern.methodName);
      if (callMatches.length > extracted.length) {
        const unresolved = callMatches.length - extracted.length;
        warn(`${unresolved} unresolved .${pattern.methodName}() call(s) — arguments may use variables or expressions`);
      }
    }
  }

  // Extract variant-prefixed classes from .on() and .at() calls
  for (const cls of extractVariantClasses(stripped)) {
    classes.add(cls);
  }

  return Array.from(classes);
}

// Default export for CommonJS
module.exports = fluentHtmlExtractor;
module.exports.fluentHtmlExtractor = fluentHtmlExtractor;
module.exports.ExtractorOptions = undefined; // type-only, exported for TS consumers
