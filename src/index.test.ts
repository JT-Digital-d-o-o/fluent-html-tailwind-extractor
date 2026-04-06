import { describe, it, expect, vi } from "vitest";
import { fluentHtmlExtractor } from "./index";

describe("fluentHtmlExtractor", () => {
  // --- Basic method extraction ---

  it("extracts single-arg methods", () => {
    const classes = fluentHtmlExtractor('.background("red-500")');
    expect(classes).toContain("bg-red-500");
  });

  it("extracts two-arg methods", () => {
    const classes = fluentHtmlExtractor('.padding("x", "4")');
    expect(classes).toContain("px-4");
  });

  it("extracts zero-arg methods", () => {
    const classes = fluentHtmlExtractor(".flex()");
    expect(classes).toContain("flex");
  });

  it("extracts multiple method calls", () => {
    const classes = fluentHtmlExtractor(
      '.padding("4").background("blue-500").textColor("white").rounded()'
    );
    expect(classes).toContain("p-4");
    expect(classes).toContain("bg-blue-500");
    expect(classes).toContain("text-white");
    expect(classes).toContain("rounded");
  });

  // --- TypeScript `as` cast stripping ---

  it("handles `as const` on single arg", () => {
    const classes = fluentHtmlExtractor('.animate("float" as const)');
    expect(classes).toContain("animate-float");
  });

  it("handles `as CustomType` on single arg", () => {
    const classes = fluentHtmlExtractor('.animate("float" as TailwindAnimate)');
    expect(classes).toContain("animate-float");
  });

  it("handles `as Type<Generic>` on single arg", () => {
    const classes = fluentHtmlExtractor('.animate("float" as Custom<Animate>)');
    expect(classes).toContain("animate-float");
  });

  it("handles `as` cast on first arg of two-arg method", () => {
    const classes = fluentHtmlExtractor('.padding("x" as const, "4")');
    expect(classes).toContain("px-4");
  });

  it("handles `as` cast on second arg of two-arg method", () => {
    const classes = fluentHtmlExtractor('.padding("x", "4" as const)');
    expect(classes).toContain("px-4");
  });

  it("handles `as` cast on both args", () => {
    const classes = fluentHtmlExtractor(
      '.padding("x" as Direction, "4" as Size)'
    );
    expect(classes).toContain("px-4");
  });

  it("handles `as` cast with string literal type", () => {
    const classes = fluentHtmlExtractor('.background("red-500" as "red-500")');
    expect(classes).toContain("bg-red-500");
  });

  // --- Direct class extraction ---

  it("extracts setClass classes", () => {
    const classes = fluentHtmlExtractor('.setClass("flex items-center gap-2")');
    expect(classes).toContain("flex");
    expect(classes).toContain("items-center");
    expect(classes).toContain("gap-2");
  });

  it("extracts addClass classes", () => {
    const classes = fluentHtmlExtractor('.addClass("mt-4 text-sm")');
    expect(classes).toContain("mt-4");
    expect(classes).toContain("text-sm");
  });

  // --- Variant extraction ---

  it("extracts .on() variant classes", () => {
    const classes = fluentHtmlExtractor(
      '.on("hover", t => t.background("blue-600"))'
    );
    expect(classes).toContain("hover:bg-blue-600");
  });

  it("extracts .at() breakpoint classes", () => {
    const classes = fluentHtmlExtractor(
      '.at("md", t => t.padding("x", "8"))'
    );
    expect(classes).toContain("md:px-8");
  });

  it("extracts nested variants", () => {
    const classes = fluentHtmlExtractor(
      '.on("dark", t => t.on("hover", t => t.background("red-500")))'
    );
    expect(classes).toContain("dark:hover:bg-red-500");
  });

  // --- Direction mapping ---

  it("maps semantic directions for padding", () => {
    const cases = [
      ['.padding("top", "2")', "pt-2"],
      ['.padding("bottom", "2")', "pb-2"],
      ['.padding("left", "2")', "pl-2"],
      ['.padding("right", "2")', "pr-2"],
      ['.padding("x", "2")', "px-2"],
      ['.padding("y", "2")', "py-2"],
    ] as const;
    for (const [input, expected] of cases) {
      expect(fluentHtmlExtractor(input)).toContain(expected);
    }
  });

  it("maps semantic directions for margin", () => {
    const classes = fluentHtmlExtractor('.margin("top", "4")');
    expect(classes).toContain("mt-4");
  });

  // --- Spacing methods ---

  it("extracts gap", () => {
    expect(fluentHtmlExtractor('.gap("4")')).toContain("gap-4");
    expect(fluentHtmlExtractor('.gap("x", "4")')).toContain("gap-x-4");
  });

  it("extracts spaceX/spaceY", () => {
    expect(fluentHtmlExtractor('.spaceX("4")')).toContain("space-x-4");
    expect(fluentHtmlExtractor('.spaceY("2")')).toContain("space-y-2");
  });

  // --- Sizing methods ---

  it("extracts sizing methods", () => {
    expect(fluentHtmlExtractor('.w("full")')).toContain("w-full");
    expect(fluentHtmlExtractor('.h("screen")')).toContain("h-screen");
    expect(fluentHtmlExtractor('.maxW("lg")')).toContain("max-w-lg");
    expect(fluentHtmlExtractor('.minH("0")')).toContain("min-h-0");
  });

  // --- Border methods ---

  it("extracts border with direction", () => {
    expect(fluentHtmlExtractor('.border("top", "2")')).toContain("border-t-2");
  });

  it("extracts border without args", () => {
    expect(fluentHtmlExtractor(".border()")).toContain("border");
  });

  // --- Animation/transition ---

  it("extracts transition and duration", () => {
    expect(fluentHtmlExtractor('.transition("colors")')).toContain(
      "transition-colors"
    );
    expect(fluentHtmlExtractor('.duration("300")')).toContain("duration-300");
  });

  // --- New methods ---

  it("extracts fontFamily", () => {
    expect(fluentHtmlExtractor('.fontFamily("mono")')).toContain("font-mono");
  });

  it("extracts gradient methods", () => {
    expect(fluentHtmlExtractor('.gradientTo("to-br")')).toContain("bg-gradient-to-br");
    expect(fluentHtmlExtractor('.from("coral")')).toContain("from-coral");
    expect(fluentHtmlExtractor('.via("white")')).toContain("via-white");
    expect(fluentHtmlExtractor('.to("coral-orange")')).toContain("to-coral-orange");
  });

  it("extracts shadowColor", () => {
    expect(fluentHtmlExtractor('.shadowColor("coral/30")')).toContain("shadow-coral/30");
  });

  it("extracts blur and backdropBlur", () => {
    expect(fluentHtmlExtractor('.blur("3xl")')).toContain("blur-3xl");
    expect(fluentHtmlExtractor(".blur()")).toContain("blur");
    expect(fluentHtmlExtractor('.backdropBlur("sm")')).toContain("backdrop-blur-sm");
  });

  it("extracts lineClamp", () => {
    expect(fluentHtmlExtractor('.lineClamp("2")')).toContain("line-clamp-2");
  });

  it("extracts typography extras", () => {
    expect(fluentHtmlExtractor(".antialiased()")).toContain("antialiased");
    expect(fluentHtmlExtractor(".tabularNums()")).toContain("tabular-nums");
    expect(fluentHtmlExtractor('.underlineOffset("2")')).toContain("underline-offset-2");
    expect(fluentHtmlExtractor(".breakAll()")).toContain("break-all");
  });

  it("extracts ease", () => {
    expect(fluentHtmlExtractor('.ease("out")')).toContain("ease-out");
  });

  it("extracts resize", () => {
    expect(fluentHtmlExtractor('.resize("y")')).toContain("resize-y");
    expect(fluentHtmlExtractor(".resize()")).toContain("resize");
  });

  // --- Warnings ---

  it("warns about unresolved method calls with variable args", () => {
    const warnings: string[] = [];
    fluentHtmlExtractor(".background(myVar)", {
      onWarning: (msg) => warnings.push(msg),
    });
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain(".background()");
  });

  it("does not warn when all calls are resolved", () => {
    const warnings: string[] = [];
    fluentHtmlExtractor('.background("red-500").padding("4")', {
      onWarning: (msg) => warnings.push(msg),
    });
    expect(warnings.length).toBe(0);
  });

  it("does not warn when no onWarning callback is provided", () => {
    // Should not throw
    expect(() => fluentHtmlExtractor(".background(myVar)")).not.toThrow();
  });
});
