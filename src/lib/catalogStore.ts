import { useSyncExternalStore } from "react";
import { hasSupabaseConfig, supabase } from "./supabase";
import { slugify } from "./slugify";
import { confirmAction, notify } from "./uiStore";
import { describeError } from "./errors";
import type { Album, Track } from "../types/music";

type Updater<T> = T | ((current: T) => T);

type CatalogState = {
	albumRecords: Album[];
	trackRecords: Track[];
	loading: boolean;
	loadError: string;
};

const NOT_CONFIGURED =
	"Supabase не настроен. Добавьте переменные из .env.example.";

let state: CatalogState = {
	albumRecords: [],
	trackRecords: [],
	loading: true,
	loadError: "",
};
const listeners = new Set<() => void>();
let initialized = false;

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
	return typeof updater === "function"
		? (updater as (current: T) => T)(current)
		: updater;
}

function patch(partial: Partial<CatalogState>) {
	state = { ...state, ...partial };
	listeners.forEach((listener) => listener());
}

export function setTrackRecords(value: Updater<Track[]>) {
	patch({ trackRecords: resolveUpdater(value, state.trackRecords) });
}

async function loadRemoteData() {
	if (!supabase) {
		patch({ loading: false, loadError: NOT_CONFIGURED });
		return;
	}

	patch({ loading: true });

	const [
		{ data: remoteAlbums, error: albumsError },
		{ data: remoteTracks, error: tracksError },
	] = await Promise.all([
		supabase
			.from("albums")
			.select("id,title,description")
			.order("position", { ascending: true }),
		supabase
			.from("tracks")
			.select(
				"id,title,artist,album_id,year,duration,mood,cover_path,audio_path,download_path,up_count,comment_count,lyrics,position,album_position",
			)
			.eq("published", true)
			.order("position", { ascending: false }),
	]);

	if (albumsError || tracksError) {
		patch({
			loading: false,
			loadError: describeError(
				albumsError || tracksError,
				"Не удалось загрузить данные из Supabase.",
			),
		});
		return;
	}

	patch({
		loading: false,
		loadError: "",
		albumRecords: remoteAlbums || [],
		trackRecords: (remoteTracks || []).map((track) => ({
			id: track.id,
			title: track.title,
			artist: track.artist,
			album: track.album_id || "",
			year: track.year,
			duration: track.duration,
			mood: track.mood,
			cover: track.cover_path || "",
			src: track.audio_path,
			download: track.download_path,
			up: track.up_count,
			commentCount: track.comment_count,
			lyrics: track.lyrics || "",
			position: track.position,
			albumPosition: track.album_position,
		})),
	});
}

export function refreshCatalog() {
	if (!supabase) {
		return Promise.resolve();
	}
	return loadRemoteData();
}

function ensureInitialized() {
	if (initialized) {
		return;
	}
	initialized = true;

	if (!supabase) {
		patch({ loading: false, loadError: NOT_CONFIGURED });
		return;
	}

	loadRemoteData();
}

export async function deleteTrack(trackId: string) {
	if (!supabase) {
		return false;
	}

	const accepted = await confirmAction({
		title: "Удалить трек?",
		body: "Трек и все его комментарии будут удалены безвозвратно.",
	});

	if (!accepted) {
		return false;
	}

	const { error } = await supabase.from("tracks").delete().eq("id", trackId);

	if (error) {
		notify(describeError(error, "Не удалось удалить трек."), "error");
		return false;
	}

	setTrackRecords((current) =>
		current.filter((track) => track.id !== trackId),
	);
	notify("Трек удалён.", "success");
	return true;
}

export async function deleteAlbum(albumId: string) {
	if (!supabase) {
		return false;
	}

	const accepted = await confirmAction({
		title: "Удалить подборку?",
	});

	if (!accepted) {
		return false;
	}

	const { error: unlinkError } = await supabase
		.from("tracks")
		.update({ album_id: null })
		.eq("album_id", albumId);

	if (unlinkError) {
		notify(
			describeError(unlinkError, "Не удалось удалить подборку."),
			"error",
		);
		return false;
	}

	const { error } = await supabase.from("albums").delete().eq("id", albumId);

	if (error) {
		notify(describeError(error, "Не удалось удалить подборку."), "error");
		return false;
	}

	setTrackRecords((current) =>
		current.map((track) =>
			track.album === albumId ? { ...track, album: "" } : track,
		),
	);
	patch({
		albumRecords: state.albumRecords.filter(
			(album) => album.id !== albumId,
		),
	});
	notify("Подборка удалена.", "success");
	return true;
}

export async function updateAlbum(
	albumId: string,
	updates: { title: string; description: string },
) {
	if (!supabase) {
		return false;
	}

	const { error } = await supabase
		.from("albums")
		.update(updates)
		.eq("id", albumId);

	if (error) {
		notify(describeError(error, "Не удалось сохранить подборку."), "error");
		return false;
	}

	patch({
		albumRecords: state.albumRecords.map((album) =>
			album.id === albumId ? { ...album, ...updates } : album,
		),
	});
	notify("Подборка сохранена.", "success");
	return true;
}

export async function updateTrackLyrics(trackId: string, lyrics: string) {
	if (!supabase) {
		return false;
	}

	const { error } = await supabase
		.from("tracks")
		.update({ lyrics })
		.eq("id", trackId);

	if (error) {
		notify(describeError(error, "Не удалось сохранить текст."), "error");
		return false;
	}

	setTrackRecords((current) =>
		current.map((track) =>
			track.id === trackId ? { ...track, lyrics } : track,
		),
	);
	notify("Текст сохранён.", "success");
	return true;
}

export async function createAlbum(form: {
	title: string;
	description: string;
}) {
	if (!supabase) {
		return { albumId: null as string | null, error: "" };
	}

	if (!form.title.trim()) {
		return {
			albumId: null as string | null,
			error: "Укажите название альбома.",
		};
	}

	const albumId = slugify(form.title, "album");

	const { error } = await supabase.from("albums").insert({
		id: albumId,
		title: form.title.trim(),
		description: form.description.trim(),
		position: state.albumRecords.length * 10 + 10,
	});

	if (error) {
		return {
			albumId: null as string | null,
			error: describeError(error, "Не удалось создать подборку."),
		};
	}

	patch({
		albumRecords: [
			...state.albumRecords,
			{
				id: albumId,
				title: form.title.trim(),
				description: form.description.trim(),
			},
		],
	});
	return { albumId, error: "" };
}

export async function reorderTracks(
	updates: { id: string; position: number }[],
	column: "position" | "album_position" = "position",
) {
	if (!supabase) {
		return false;
	}

	const client = supabase;
	const results = await Promise.all(
		updates.map(({ id, position }) =>
			client
				.from("tracks")
				.update({ [column]: position })
				.eq("id", id),
		),
	);

	const failed = results.find((result) => result.error);

	if (failed) {
		notify(
			describeError(failed.error, "Не удалось сохранить порядок треков."),
			"error",
		);
		return false;
	}

	refreshCatalog();
	return true;
}

export async function reorderAlbums(
	updates: { id: string; position: number }[],
) {
	if (!supabase) {
		return false;
	}

	const order = new Map(updates.map(({ id, position }) => [id, position]));
	patch({
		albumRecords: [...state.albumRecords].sort(
			(a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
		),
	});

	const client = supabase;
	const results = await Promise.all(
		updates.map(({ id, position }) =>
			client.from("albums").update({ position }).eq("id", id),
		),
	);

	const failed = results.find((result) => result.error);

	if (failed) {
		notify(
			describeError(
				failed.error,
				"Не удалось сохранить порядок подборок.",
			),
			"error",
		);
		return false;
	}

	return true;
}

function subscribe(listener: () => void) {
	ensureInitialized();
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getState() {
	return state;
}

export { hasSupabaseConfig };

export function useCatalogState() {
	return useSyncExternalStore(subscribe, getState, getState);
}
