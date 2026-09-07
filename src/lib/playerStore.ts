import { useSyncExternalStore } from "react";

export type PlayerTrack = {
	id: string;
	title: string;
	artist: string;
	cover: string;
	src: string;
};

type PlayerState = {
	track: PlayerTrack | null;
	isPlaying: boolean;
	queue: PlayerTrack[];
};

let state: PlayerState = { track: null, isPlaying: false, queue: [] };
const listeners = new Set<() => void>();

function setState(next: PlayerState) {
	state = next;
	listeners.forEach((listener) => listener());
}

function getState() {
	return state;
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function usePlayerState() {
	return useSyncExternalStore(subscribe, getState, getState);
}

export function setQueue(queue: PlayerTrack[]) {
	setState({ ...state, queue });
}

export function playTrack(track: PlayerTrack, queue?: PlayerTrack[]) {
	const nextQueue = queue ?? state.queue;

	if (state.track?.id === track.id) {
		setState({ ...state, queue: nextQueue, isPlaying: !state.isPlaying });
	} else {
		setState({ track, isPlaying: true, queue: nextQueue });
	}
}

function currentIndex() {
	return state.queue.findIndex((item) => item.id === state.track?.id);
}

function step(offset: number) {
	const index = currentIndex();
	if (index === -1) {
		return;
	}

	const next = state.queue[index + offset];
	if (next) {
		setState({ ...state, track: next, isPlaying: true });
	} else {
		setState({ ...state, isPlaying: false });
	}
}

export function playNext() {
	step(1);
}

export function playPrevious() {
	step(-1);
}

export function hasNext() {
	const index = currentIndex();
	return index !== -1 && index + 1 < state.queue.length;
}

export function hasPrevious() {
	return currentIndex() > 0;
}

export function togglePlay() {
	setState({ ...state, isPlaying: !state.isPlaying });
}

export function closePlayer() {
	setState({ track: null, isPlaying: false, queue: [] });
}
