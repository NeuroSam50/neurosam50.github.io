import { useSyncExternalStore } from "react";

let currentTitle = "";
const listeners = new Set<() => void>();

export function setPageTitle(title: string) {
	currentTitle = title;
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot() {
	return currentTitle;
}

export function usePageTitle(fallback: string) {
	const title = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	return title || fallback;
}
