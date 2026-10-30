import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Demo Package Boundary Check', () => {
  it('ensures demo only imports from public package exports, never internal source paths', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const sourceFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

    for (const file of sourceFiles) {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        if (line.includes('from ') || line.includes('import ')) {
          // Check for internal path leaks into packages/*/src
          expect(line).not.toMatch(/packages\/(core|react)\/src/);
          expect(line).not.toMatch(/@kilwish1997\/plotwise-core\/src/);
          expect(line).not.toMatch(/@kilwish1997\/plotwise-react\/src/);
        }
      }
    }
  });
});
