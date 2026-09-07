import { useSyncExternalStore } from "react";
import { pluralize } from "./plural";
import type { Album } from "../types/music";

function readFromUrl() {
	if (typeof window === "undefined") {
		return "all";
	}
	return new URLSearchParams(window.location.search).get("album") || "all";
}

let activeAlbum = readFromUrl();
const listeners = new Set<() => void>();

function commit(next: string) {
	if (activeAlbum === next) {
		return;
	}
	activeAlbum = next;
	listeners.forEach((listener) => listener());
}

export function setActiveAlbum(albumId: string) {
	commit(albumId);
}

export function syncActiveAlbumFromUrl() {
	commit(readFromUrl());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getState() {
	return activeAlbum;
}

export function useActiveAlbum() {
	return useSyncExternalStore(subscribe, getState, getState);
}

export function buildAlbumItems(albums: Album[], trackCount: number): Album[] {
	return [
		{
			id: "all",
			title: "Все песни",
			description: `${pluralize(trackCount, "трек", "трека", "треков")} в каталоге`,
		},
		...albums,
	];
}
