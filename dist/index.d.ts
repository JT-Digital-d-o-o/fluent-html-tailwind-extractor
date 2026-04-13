/**
 * Tailwind CSS content extractor for fluent-html
 * Extracts Tailwind classes from fluent method calls
 */
export interface ExtractorOptions {
    /** Called when a fluent method call is detected but can't be resolved to a class. */
    onWarning?: (message: string) => void;
}
/**
 * Main extractor function for Tailwind CSS.
 * Includes default class candidate extraction so it can fully replace
 * Tailwind's built-in extractor without losing standard class detection.
 */
export declare function fluentHtmlExtractor(content: string, options?: ExtractorOptions): string[];
