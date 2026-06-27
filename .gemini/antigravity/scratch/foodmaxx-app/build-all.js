import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

try {
  console.log('Building Client App...');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('Installing Admin Dashboard dependencies...');
  execSync('npm install --prefix admin-dashboard', { stdio: 'inherit' });

  console.log('Building Admin Dashboard...');
  execSync('npm run --prefix admin-dashboard build', { stdio: 'inherit' });

  console.log('Copying Admin Dashboard to dist/admin...');
  const srcDir = path.join('admin-dashboard', 'dist');
  const destDir = path.join('dist', 'admin');

  // Ensure destDir exists
  fs.mkdirSync(destDir, { recursive: true });

  // Recursive copy helper
  const copyRecursiveSync = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = stats && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };

  copyRecursiveSync(srcDir, destDir);
  console.log('All builds completed and merged successfully!');
} catch (error) {
  console.error('Build process failed:', error);
  process.exit(1);
}
