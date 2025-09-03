#!/usr/bin/env node

import { startConsoleGame } from './console.ts';

async function main() {
  console.log('Starting Space Trader Console Game...');
  console.log('Use Ctrl+C to quit at any time.');
  console.log('');

  await startConsoleGame();
}

main().catch(console.error);
