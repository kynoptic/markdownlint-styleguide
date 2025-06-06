import fs from 'fs';

export function parseFixture(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce(
      (acc, line, index) => {
        if (line.includes('<!-- ✅ -->')) {
          acc.passingLines.push(index + 1);
        } else if (line.includes('<!-- ❌ -->')) {
          acc.failingLines.push(index + 1);
        }
        return acc;
      },
      { passingLines: [], failingLines: [] }
    );
}
