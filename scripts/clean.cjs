const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const pathsToClean = [
  path.join(ROOT_DIR, 'tarballs'),
  path.join(ROOT_DIR, 'packages/core/dist'),
  path.join(ROOT_DIR, 'packages/react/dist'),
  path.join(ROOT_DIR, 'apps/demo/dist'),
];

for (const target of pathsToClean) {
  if (fs.existsSync(target)) {
    console.log(`Cleaning ${path.relative(ROOT_DIR, target)}...`);
    fs.rmSync(target, { recursive: true, force: true });
  }
}

// Clean tsbuildinfo files
function cleanBuildInfo(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      cleanBuildInfo(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.tsbuildinfo')) {
      console.log(`Removing ${path.relative(ROOT_DIR, fullPath)}...`);
      fs.unlinkSync(fullPath);
    }
  }
}

cleanBuildInfo(ROOT_DIR);
console.log('Clean complete.');
