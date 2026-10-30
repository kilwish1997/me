const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARBALL_DIR = path.resolve(ROOT_DIR, 'tarballs');

if (!fs.existsSync(TARBALL_DIR)) {
  fs.mkdirSync(TARBALL_DIR, { recursive: true });
}

console.log('Building packages...');
execSync('npm run build --workspace @kilwish1997/plotwise-core', { cwd: ROOT_DIR, stdio: 'inherit' });
execSync('npm run build --workspace @kilwish1997/plotwise-react', { cwd: ROOT_DIR, stdio: 'inherit' });

console.log('Packing @kilwish1997/plotwise-core...');
const corePackOut = execSync(`npm pack --workspace @kilwish1997/plotwise-core --pack-destination "${TARBALL_DIR}"`, {
  cwd: ROOT_DIR,
  encoding: 'utf-8',
}).trim();
console.log('Core pack output:\n' + corePackOut);

console.log('\nPacking @kilwish1997/plotwise-react...');
const reactPackOut = execSync(`npm pack --workspace @kilwish1997/plotwise-react --pack-destination "${TARBALL_DIR}"`, {
  cwd: ROOT_DIR,
  encoding: 'utf-8',
}).trim();
console.log('React pack output:\n' + reactPackOut);

console.log('\nTarballs created successfully in:', TARBALL_DIR);
const files = fs.readdirSync(TARBALL_DIR);
console.log('Generated Tarballs:', files);
