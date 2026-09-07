import { useSyncExternalStore } from "react";
import { createTheme } from "@mui/material";

export const drawerWidth = 304;

export type ThemePreference = "system" | "light" | "dark";
export type EffectiveThemeMode = "light" | "dark";

const STORAGE_KEY = "neurosam-theme-mode";

export function createAppTheme(mode: EffectiveThemeMode) {
	const isDark = mode === "dark";
	const dividerColor = isDark ? "#2a2a2a" : "#e5e7eb";

	return createTheme({
		palette: {
			mode,
			background: {
				default: isDark ? "#0a0a0a" : "#f6f7f9",
				paper: isDark ? "#141414" : "#ffffff",
			},
			primary: {
				main: isDark ? "#f9fafb" : "#111827",
			},
			secondary: {
				main: isDark ? "#a1a1aa" : "#2563eb",
			},
			text: {
				primary: isDark ? "#f3f4f6" : "#111827",
				secondary: isDark ? "#9a9a9a" : "#667085",
			},
			divider: dividerColor,
		},
		shape: {
			borderRadius: 16,
		},
		zIndex: {
			drawer: 1400,
			modal: 2000,
			tooltip: 2100,
		},
		typography: {
			fontFamily:
				'"Nunito Variable", Nunito, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			h1: {
				fontSize: "2.25rem",
				lineHeight: 1.1,
				fontWeight: 700,
				letterSpacing: 0,
			},
			h2: {
				fontSize: "1.15rem",
				fontWeight: 700,
				letterSpacing: 0,
			},
			button: {
				textTransform: "none",
				fontWeight: 700,
			},
		},
		components: {
			MuiCard: {
				styleOverrides: {
					root: {
						border: `1px solid ${dividerColor}`,
						boxShadow: "none",
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					root: {
						boxShadow: "none",
						borderRadius: 12,
					},
				},
			},
			MuiIconButton: {
				styleOverrides: {
					root: {
						borderRadius: 12,
					},
				},
			},
			MuiChip: {
				styleOverrides: {
					root: {
						borderRadius: 999,
					},
				},
			},
			MuiCardContent: {
				styleOverrides: {
					root: {
						"&:last-child": {
							paddingBottom: 16,
						},
					},
				},
			},
		},
	});
}

function readStoredPreference(): ThemePreference {
	if (typeof window === "undefined") {
		return "system";
	}

	const stored = window.localStorage.getItem(STORAGE_KEY);
	return stored === "light" || stored === "dark" || stored === "system"
		? stored
		: "system";
}

function readSystemPrefersDark(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) {
		return false;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function computeEffectiveMode(
	preference: ThemePreference,
	systemPrefersDark: boolean,
): EffectiveThemeMode {
	return preference === "system"
		? systemPrefersDark
			? "dark"
			: "light"
		: preference;
}

let preference = readStoredPreference();
let systemPrefersDark = readSystemPrefersDark();
let state = {
	preference,
	effectiveMode: computeEffectiveMode(preference, systemPrefersDark),
};

const listeners = new Set<() => void>();

function applyDomTheme(mode: EffectiveThemeMode) {
	if (typeof document !== "undefined") {
		document.documentElement.setAttribute("data-theme", mode);
	}
}

function commit() {
	state = {
		preference,
		effectiveMode: computeEffectiveMode(preference, systemPrefersDark),
	};
	applyDomTheme(state.effectiveMode);
	listeners.forEach((listener) => listener());
}

let mediaListenerAttached = false;
function ensureMediaListener() {
	if (
		mediaListenerAttached ||
		typeof window === "undefined" ||
		!window.matchMedia
	) {
		return;
	}
	mediaListenerAttached = true;

	const media = window.matchMedia("(prefers-color-scheme: dark)");
	media.addEventListener("change", (event) => {
		systemPrefersDark = event.matches;
		commit();
	});
}

export function setThemePreference(next: ThemePreference) {
	preference = next;
	if (typeof window !== "undefined") {
		window.localStorage.setItem(STORAGE_KEY, next);
	}
	commit();
}

function subscribe(listener: () => void) {
	ensureMediaListener();
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getState() {
	return state;
}

export function useColorMode() {
	const current = useSyncExternalStore(subscribe, getState, getState);
	return {
		preference: current.preference,
		effectiveMode: current.effectiveMode,
		setMode: setThemePreference,
	};
}
