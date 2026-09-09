import { useSyncExternalStore } from "react";

let mobileNavOpen = false;
const listeners = new Set<() => void>();

function commit() {
	listeners.forEach((listener) => listener());
}

export function openMobileNav() {
	mobileNavOpen = true;
	commit();
}

export function closeMobileNav() {
	mobileNavOpen = false;
	commit();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot() {
	return mobileNavOpen;
}

export function useMobileNavOpen() {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
