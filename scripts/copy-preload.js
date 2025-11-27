#!/usr/bin/env node
/**
 * Cross-platform script to copy preload script to dist folder
 * Works on Windows, macOS, and Linux
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'preload-floating-button.js');
const dest = path.join(__dirname, '..', 'dist', 'preload-floating-button.js');

try {
  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`✓ Copied preload script to dist/`);
} catch (error) {
  console.error(`✗ Failed to copy preload script: ${error.message}`);
  process.exit(1);
}
