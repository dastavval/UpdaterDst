const fs = require('fs');

const appPath = 'src/App.tsx';
const replacementPath = '/tmp/replacement.txt';

if (!fs.existsSync(appPath)) {
  console.error(`File not found: ${appPath}`);
  process.exit(1);
}

if (!fs.existsSync(replacementPath)) {
  console.error(`Replacement file not found: ${replacementPath}`);
  process.exit(1);
}

const appContent = fs.readFileSync(appPath, 'utf8');
const replacement = fs.readFileSync(replacementPath, 'utf8');

const lines = appContent.split(/\r?\n/);

let startIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('GitHub Hot-Reload & Cache-Buster Live Notification Bar')) {
    startIndex = i;
    break;
  }
}

let endIndex = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  // We want the exact clean comment line
  if (lines[i].trim() === '{/* Ordering Panel Grid */}') {
    endIndex = i;
    break;
  }
}

if (startIndex === -1) {
  console.error('Could not find start index in App.tsx');
  process.exit(1);
}

if (endIndex === -1) {
  console.error('Could not find end index in App.tsx');
  process.exit(1);
}

console.log(`Replacing from line ${startIndex + 1} to line ${endIndex + 1}...`);

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex);

const newContent = [...before, replacement, ...after].join('\n');
fs.writeFileSync(appPath, newContent, 'utf8');

console.log('App.tsx has been successfully reconstructed!');
