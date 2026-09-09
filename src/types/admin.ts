import type { Album } from "./music";

export type AdminAlbum = Album;

export type AdminTrackRow = {
	id: string;
	title: string;
	artist: string;
	album_id: string | null;
	year: number;
	duration: string;
	cover_path: string | null;
	lyrics: string;
};
