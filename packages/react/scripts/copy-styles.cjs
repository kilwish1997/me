const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/styles/plotwise.css');
const destDir = path.resolve(__dirname, '../dist');
const dest = path.resolve(destDir, 'styles.css');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Copied plotwise.css to dist/styles.css');
