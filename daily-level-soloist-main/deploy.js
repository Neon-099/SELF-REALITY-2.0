import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log the current directory and files
console.log('Current directory:', process.cwd());
console.log('Index.html path:', path.resolve(__dirname, 'index.html'));

// Run the build
async function runBuild() {
  try {
    await build({
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      logLevel: 'info'
    });
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild(); 