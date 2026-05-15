#!/usr/bin/env -S npx tsx
import React from 'react';
import { render } from 'ink';
import App from './App.js';

process.on('unhandledRejection', () => { /* handled inside React components */ });

render(React.createElement(App));
