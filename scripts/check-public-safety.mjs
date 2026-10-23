import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0');
const violations = [];
for (const file of files) {
  if (!file || !existsSync(file) || !statSync(file).isFile()) continue;
  if (/^(qa|verification-screens)\//.test(file) || /import-invoices|kathleen-gonzales/.test(file)) {
    violations.push(`${file}: private deployment artifact`);
  }
  if (statSync(file).size > 3_000_000) continue;
  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;
  const content = buffer.toString('utf8');
  const rules = [
    ['literal Google API key', /AIza[0-9A-Za-z_-]{30,}/],
    ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['hardcoded login password', /FIREBASE_PASSWORD\s*=\s*['"][^'"\r\n]+['"]/],
    ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/],
  ];
  for (const [label, pattern] of rules) {
    if (pattern.test(content)) violations.push(`${file}: ${label}`);
  }
}
if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log('Public source safety checks passed. This pattern scan does not replace credential revocation or a history audit.');
