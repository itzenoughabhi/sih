const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const htmlPath = path.resolve(__dirname, '../src/shaders/brand-orbs/sources/brand-orbs-v2.html');
const tsxPath = path.resolve(__dirname, '../src/shaders/brand-orbs/BrandOrbs.tsx');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const tsxContent = fs.readFileSync(tsxPath, 'utf8');

const rawImport = 'import brandOrbsSource from "./sources/brand-orbs-v2.html?raw";';
const htmlLiteral = JSON.stringify(htmlContent);
const replacement = `const brandOrbsSource = ${htmlLiteral};`;

let code = tsxContent.replace(rawImport, replacement);

// Replace variant checking to support "naksha" mapping to "threads"
const oldVariantCheck = 'const safeVariant = BRAND_ORB_VARIANTS.includes(variant) ? variant : BRAND_ORBS_DEFAULTS.variant;';
const newVariantCheck = `const resolvedVariant = (variant === "naksha" ? "threads" : variant);
  const safeVariant = BRAND_ORB_VARIANTS.includes(resolvedVariant) ? resolvedVariant : BRAND_ORBS_DEFAULTS.variant;`;

code = code.replace(oldVariantCheck, newVariantCheck);

// Transpile with TypeScript to pure JavaScript (preserving React JSX or converting to React JSX)
const transpiled = ts.transpileModule(code, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
    removeComments: false
  }
});

const jsOutput = '"use client";\n' + transpiled.outputText;

const dtsContent = `import { CSSProperties, ReactElement } from "react";

export declare const BRAND_ORB_VARIANTS: readonly [
  "claude", "openai", "codex", "cursor", "gemini", "figma",
  "framer", "react", "swift", "designcode", "aura", "dreamcut",
  "ui", "ux", "css", "ios", "neuform", "github", "x",
  "instagram", "threads", "linkedin", "email"
];
export declare const BRAND_ORB_SIZES: readonly ["small", "medium"];
export type BrandOrbVariant = (typeof BRAND_ORB_VARIANTS)[number] | "naksha";
export type BrandOrbSize = (typeof BRAND_ORB_SIZES)[number];
export type BrandOrbMode = "auto" | "dark" | "light";

export interface BrandOrbsProps {
  variant?: BrandOrbVariant;
  size?: BrandOrbSize;
  mode?: BrandOrbMode;
  speed?: number;
  paused?: boolean;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
}

export declare const BRAND_ORBS_DEFAULTS: {
  readonly variant: "claude";
  readonly size: "medium";
  readonly mode: "dark";
  readonly speed: 1;
  readonly paused: false;
};

export declare function BrandOrbs(props: BrandOrbsProps): ReactElement;
`;

const targets = [
  path.resolve(__dirname, '../node_modules/@designcodeio/threeui'),
  path.resolve(__dirname, './node_modules/@designcodeio/threeui')
];

for (const pkgDir of targets) {
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(pkgDir, 'index.js'), jsOutput, 'utf8');
  fs.writeFileSync(path.join(pkgDir, 'index.d.ts'), dtsContent, 'utf8');
}

console.log('Successfully built and installed @designcodeio/threeui with pure JS + DTS!');
