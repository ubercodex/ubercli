#!/usr/bin/env -S npx tsx
import React from 'react';
import { render } from 'ink';
import App from './App.js';

process.on('unhandledRejection', () => { /* handled inside React components */ });

// Clear terminal to prevent double rendering artifacts
process.stdout.write('\x1Bc');

// Parse command-line arguments
const args = process.argv.slice(2);
const command = args.join(' ');

// Check if it's a direct command (e.g., zal /plugins install name)
let initialCommand: string | undefined;
if (
	command.startsWith('/plugins install ') || 
	command.startsWith('/profiles install ') || 
	command.startsWith('/profiles install-default ') ||
	command.startsWith('/settings') || 
	command.startsWith('/memory')
) {
	initialCommand = command;
}

render(<App initialCommand={initialCommand} />);
