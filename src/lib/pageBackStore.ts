import { useSyncExternalStore } from "react";

let currentHandler: (() => void) | null = null;
const listeners = new Set<() => void>();

export function setPageBack(handler: (() => void) | null) {
	currentHandler = handler;
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot() {
	return currentHandler;
}

export function usePageBack() {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
