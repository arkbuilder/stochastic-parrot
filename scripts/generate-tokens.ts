import fs from 'node:fs';
import path from 'node:path';

const aestheticPath = path.resolve(process.cwd(), 'Design', 'Aesthetic.md');
const outputPath = path.resolve(process.cwd(), 'src', 'rendering', 'tokens.ts');

const fallback = {
  colorBackground: '#0a0a0a',
  colorPanel: '#171717',
  colorCyan400: '#22d3ee',
  colorRed400: '#f87171',
  colorYellow400: '#facc15',
  colorGreen400: '#4ade80',
  colorText: '#e5e7eb',
  spacingUnit: 4,
  fontSmall: '8px monospace',
  fontMedium: '12px monospace',
  fontLarge: '16px monospace',
};

function toConstKey(cssVar: string): string {
  return cssVar
    .replace(/^--/, '')
    .split('-')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

function parseAesthetic(markdown: string): Record<string, string | number> {
  const tokenRegex = /(--[a-z0-9-]+)\s*:\s*([^;\n]+)/gi;
  const parsed: Record<string, string | number> = {};
  let match = tokenRegex.exec(markdown);

  while (match) {
    const cssVar = match[1] ?? '--fallback-token';
    const rawCaptured = match[2] ?? '';
    const key = toConstKey(cssVar);
    const rawValue = rawCaptured.trim();

    if (/^\d+$/.test(rawValue)) {
      parsed[key] = Number(rawValue);
    } else {
      parsed[key] = rawValue.replace(/"/g, '\\"');
    }

    match = tokenRegex.exec(markdown);
  }

  return parsed;
}

function writeTokensFile(tokens: Record<string, string | number>): void {
  const entries = Object.entries(tokens)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      if (typeof value === 'number') {
        return `  ${key}: ${value},`;
      }
      return `  ${key}: '${value}',`;
    })
    .join('\n');

  const content = `export const TOKENS = {\n${entries}\n} as const;\n`;
  fs.writeFileSync(outputPath, content, 'utf8');
}

const markdown = fs.existsSync(aestheticPath) ? fs.readFileSync(aestheticPath, 'utf8') : '';
const parsed = markdown.length > 0 ? parseAesthetic(markdown) : {};
const tokens = Object.keys(parsed).length > 0 ? { ...fallback, ...parsed } : fallback;

writeTokensFile(tokens);
console.info(`Generated tokens at ${outputPath}`);
