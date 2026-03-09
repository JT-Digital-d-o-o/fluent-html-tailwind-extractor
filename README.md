# fluent-html-tailwind-extractor

Tailwind CSS content extractor for fluent-html's fluent-styling methods. This extractor tells Tailwind which classes to generate based on your fluent-html code.

## The Problem

When you use fluent-html's fluent-styling API, Tailwind doesn't automatically know which classes to generate:

```typescript
// Tailwind can't detect that this generates "bg-red-500 p-4"
Div()
  .background("red-500")
  .padding("4")
```

This extractor solves that by teaching Tailwind how to read fluent-html method calls. It also includes default class candidate extraction, so it fully replaces Tailwind's built-in extractor — no need to combine extractors manually.

## Installation

```bash
npm install --save-dev fluent-html-tailwind-extractor
```

## Usage

Update your `tailwind.config.js`:

```javascript
const fluentHtmlExtractor = require('fluent-html-tailwind-extractor');

module.exports = {
  content: {
    files: [
      './src/**/*.{ts,tsx,js,jsx}',
      './views/**/*.{ts,tsx,js,jsx}',
    ],
    extract: {
      ts: fluentHtmlExtractor,
      tsx: fluentHtmlExtractor,
      js: fluentHtmlExtractor,
      jsx: fluentHtmlExtractor,
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### ESM / TypeScript Config

```typescript
import type { Config } from 'tailwindcss';
import fluentHtmlExtractor from 'fluent-html-tailwind-extractor';

const config: Config = {
  content: {
    files: [
      './src/**/*.{ts,tsx}',
      './views/**/*.{ts,tsx}',
    ],
    extract: {
      ts: fluentHtmlExtractor,
      tsx: fluentHtmlExtractor,
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

> **Note:** The extractor includes built-in default class detection (for standard `class="..."` attributes, template literals, etc.), so you don't need to combine it with Tailwind's default extractor.

## What It Extracts

The extractor recognizes all fluent-html fluent-styling methods:

### Fluent Method Calls

```typescript
.background("red-500")          → bg-red-500
.padding("4")                   → p-4
.padding("x", "4")              → px-4
.margin("top", "8")             → mt-8
.textColor("blue-500")          → text-blue-500
.textSize("xl")                 → text-xl
.textAlign("center")            → text-center
.fontWeight("bold")             → font-bold
.w("full")                      → w-full
.h("screen")                    → h-screen
.flex()                         → flex
.flexDirection("col")           → flex-col
.justifyContent("center")       → justify-center
.alignItems("center")           → items-center
.gap("4")                       → gap-4
.grid()                         → grid
.gridCols("3")                  → grid-cols-3
.border()                       → border
.rounded("lg")                  → rounded-lg
.shadow("md")                   → shadow-md
.position("relative")           → relative
.zIndex("10")                   → z-10
.opacity("50")                  → opacity-50
.cursor("pointer")              → cursor-pointer
.overflow("hidden")             → overflow-hidden
```

### Direct Class Methods

```typescript
.setClass("bg-white p-4")       → bg-white, p-4
.addClass("hover:bg-blue-600")  → hover:bg-blue-600
```

### Standard Classes

The extractor also detects standard Tailwind class usage — `class="..."` attributes, template literals, and any other class-like tokens in your files. This means it fully replaces Tailwind's built-in extractor with no gaps.

## Complete Example

### Your fluent-html Code

```typescript
// src/components/card.ts
import { Div, H2, P, Button } from "fluent-html";

export const Card = () =>
  Div(
    H2("Card Title")
      .textSize("2xl")
      .fontWeight("bold")
      .margin("bottom", "4"),

    P("Card content")
      .textColor("gray-600")
      .margin("bottom", "6"),

    Button("Click me")
      .padding("x", "6")
      .padding("y", "3")
      .background("blue-500")
      .textColor("white")
      .rounded("lg")
      .cursor("pointer")
      .addClass("hover:bg-blue-600 transition-colors"),
  )
    .background("white")
    .padding("6")
    .rounded("xl")
    .shadow("lg")
    .border()
    .borderColor("gray-200")
    .w("full")
    .maxW("md");
```

### Extracted Classes

The extractor will find:
```
text-2xl, font-bold, mb-4, text-gray-600, mb-6, px-6, py-3, bg-blue-500,
text-white, rounded-lg, cursor-pointer, hover:bg-blue-600, transition-colors,
bg-white, p-6, rounded-xl, shadow-lg, border, border-gray-200, w-full, max-w-md
```

Tailwind will generate CSS for all these classes.

## PostCSS Setup

Make sure you have PostCSS configured to process Tailwind:

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

And import Tailwind in your CSS:

```css
/* styles.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Advanced Configuration

### Custom File Extensions

If you use custom file extensions:

```javascript
module.exports = {
  content: {
    files: ['./src/**/*.custom-ext'],
    extract: {
      'custom-ext': fluentHtmlExtractor,
    },
  },
};
```

### Safelist for Dynamic Classes

If you generate class names dynamically, add them to the safelist:

```javascript
module.exports = {
  content: {
    files: ['./src/**/*.ts'],
    extract: {
      ts: fluentHtmlExtractor,
    },
  },
  safelist: [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    {
      pattern: /bg-(red|blue|green)-(100|200|300|400|500)/,
    },
  ],
};
```

## Troubleshooting

### Classes Not Being Generated

1. **Check file paths**: Make sure your `content.files` includes all files using fluent-html
2. **Check extractor assignment**: Ensure the extractor is assigned to the right file extensions
3. **Rebuild**: Run your build command to regenerate Tailwind CSS
4. **Check syntax**: The extractor uses regex, so unusual syntax might not be detected

### Viewing Extracted Classes

Add this to see what's being extracted:

```javascript
const fluentHtmlExtractor = require('fluent-html-tailwind-extractor');
const fs = require('fs');

const content = fs.readFileSync('./src/components/card.ts', 'utf-8');
const classes = fluentHtmlExtractor(content);
console.log('Extracted classes:', classes);
```

### Dynamic Class Names

The extractor works with string literals. For dynamic classes, use safelist:

```typescript
// ❌ Won't be extracted (dynamic)
const color = getColor();
Div().background(color);

// ✅ Will be extracted (literal)
Div().background("red-500");

// ✅ Solution: Use safelist in tailwind.config.js
```

## How It Works

The extractor:

1. Extracts standard class candidates from the file (like Tailwind's default extractor)
2. Finds fluent-html method calls using regex (e.g., `.background("red-500")`)
3. Converts them to Tailwind classes (e.g., `bg-red-500`)
4. Extracts classes from `.setClass()` and `.addClass()` calls
5. Returns the combined list to Tailwind for CSS generation

## Requirements

- Tailwind CSS 3.0 or higher
- fluent-html 4.0 or higher

## License

ISC
