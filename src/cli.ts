#!/usr/bin/env node

import { greet } from './index.js';

/**
 * Display usage information
 */
function showUsage() {
  console.log(greet('Research Gangsta'));
  console.log('\nUsage:');
  console.log('  npx research-gangsta --ingest <file.pdf>  Ingest a research paper');
  console.log('  npx research-gangsta --gchat              Chat with "The G"');
  console.log('\nExamples:');
  console.log('  npx research-gangsta --ingest ./paper.pdf');
  console.log('  npx research-gangsta --gchat');
}

/**
 * Handle paper ingestion
 */
function handleIngest(filePath: string) {
  console.log(greet('Research Gangsta'));
  console.log(`\nIngesting paper: ${filePath}`);
  console.log('\nPaper ingestion functionality coming soon!');
  console.log('This will analyze and extract key information from your research paper.');
}

/**
 * Handle G-Chat
 */
function handleGChat() {
  console.log(greet('The G'));
  console.log('\nWelcome to G-Chat! Chat with "The G" to upgrade your knowledge.');
  console.log('\nG-Chat functionality coming soon!');
  console.log('This will provide an interactive chat interface to discuss ingested papers.');
}

/**
 * CLI entry point for research-gangsta
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(0);
  }

  const command = args[0];

  if (command === '--ingest') {
    if (args.length < 2) {
      console.error('Error: --ingest requires a file path');
      console.log('\nExample: npx research-gangsta --ingest ./paper.pdf');
      process.exit(1);
    }
    handleIngest(args[1]);
  } else if (command === '--gchat') {
    handleGChat();
  } else {
    console.error(`Error: Unknown command "${command}"`);
    console.log('');
    showUsage();
    process.exit(1);
  }
}

main();
