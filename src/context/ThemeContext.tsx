import React, { createContext, useContext } from 'react';
import { type Theme, THEMES } from '../types/settings.js';

export const ThemeContext = createContext<Theme>(THEMES.blue);

export function useTheme(): Theme {
	return useContext(ThemeContext);
}
