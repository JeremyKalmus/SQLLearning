#!/usr/bin/env node

/**
 * Script to split monolithic index.css into modular structure
 * Reads the CSS file and splits it based on comment markers
 */

const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, '../src/styles/index.css');
const outputDir = path.join(__dirname, '../src/styles');

// Read the original CSS file
const css = fs.readFileSync(cssFile, 'utf-8');
const lines = css.split('\n');

// Define the sections and their line ranges (approximately)
const sections = {
  'base/reset.css': { start: 1, end: 6, desc: 'CSS Reset' },
  'base/variables.css': { start: 7, end: 43, desc: 'CSS Custom Properties' },
  'base/typography.css': { start: 44, end: 54, desc: 'Typography' },
  'layout/container.css': { start: 55, end: 72, desc: 'Container and Layout' },
  'layout/footer.css': { start: 73, end: 79, desc: 'Footer' },
  'components/icons.css': { start: 80, end: 118, desc: 'Icon Styles' },
  'components/header.css': { start: 119, end: 319, desc: 'Header Component' },
  'components/buttons.css': { start: 320, end: 460, desc: 'Button Components' },
  'components/cards.css': { start: 461, end: 835, desc: 'Card Components' },
  'pages/home.css': { start: 836, end: 1040, desc: 'Home Page' },
  'pages/flashcards.css': { start: 1041, end: 1374, desc: 'Flashcards Page' },
  'pages/problems.css': { start: 1375, end: 2836, desc: 'Problems Page' },
  'components/tables.css': { start: 2837, end: 3065, desc: 'Table Components' },
  'components/modals.css': { start: 3066, end: 3150, desc: 'Modal Components' },
  'components/loading.css': { start: 3151, end: 3207, desc: 'Loading Overlay' },
  'pages/auth.css': { start: 3208, end: 3327, desc: 'Auth Pages' },
  'pages/settings.css': { start: 3328, end: 3452, desc: 'Settings Page' },
  'responsive/mobile.css': { start: 3453, end: 3553, desc: 'Responsive Design (First)' },
  'components/codemirror.css': { start: 3554, end: 3590, desc: 'CodeMirror Autocomplete' },
  'components/cheatsheet.css': { start: 3591, end: 3785, desc: 'Cheat Sheet Slider' },
  'components/progress.css': { start: 3786, end: 3868, desc: 'Progress Overlay' },
  'pages/assessment.css': { start: 3869, end: 4524, desc: 'Assessment Pages' },
  'pages/topics.css': { start: 4538, end: 4674, desc: 'Topic Filtering' },
};

console.log('Starting CSS split...\n');

// Create directories
const dirs = ['base', 'layout', 'components', 'pages', 'responsive'];
dirs.forEach(dir => {
  const dirPath = path.join(outputDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}/`);
  }
});

// Extract and write each section
Object.entries(sections).forEach(([filename, config]) => {
  const { start, end, desc } = config;
  const sectionLines = lines.slice(start - 1, end);
  const content = `/* ${desc} */\n${sectionLines.join('\n')}\n`;

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, content);
  console.log(`✓ Created ${filename} (${end - start + 1} lines)`);
});

// Create new index.css that imports all modules
const newIndex = `/* SQL Learning Game - Modular CSS */
/* This file imports all CSS modules in the correct order */

/* Base Styles */
@import './base/reset.css';
@import './base/variables.css';
@import './base/typography.css';

/* Layout */
@import './layout/container.css';
@import './layout/footer.css';

/* Components */
@import './components/icons.css';
@import './components/header.css';
@import './components/buttons.css';
@import './components/cards.css';
@import './components/tables.css';
@import './components/modals.css';
@import './components/loading.css';
@import './components/codemirror.css';
@import './components/cheatsheet.css';
@import './components/progress.css';

/* Pages */
@import './pages/home.css';
@import './pages/flashcards.css';
@import './pages/problems.css';
@import './pages/auth.css';
@import './pages/settings.css';
@import './pages/assessment.css';
@import './pages/topics.css';

/* Responsive Styles (load last to override) */
@import './responsive/mobile.css';
`;

// Backup original file
const backupPath = path.join(outputDir, 'index.css.backup');
fs.copyFileSync(cssFile, backupPath);
console.log(`\n✓ Backed up original to index.css.backup`);

// Write new index.css
fs.writeFileSync(cssFile, newIndex);
console.log('✓ Created new modular index.css\n');

console.log('CSS split complete!');
console.log(`Total files created: ${Object.keys(sections).length}`);
console.log('\nOriginal: 4,674 lines → Split into ~22 modular files');
