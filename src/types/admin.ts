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

export type AdminUserRow = {
	user_id: string;
	nickname: string;
	email: string | null;
	avatar_url: string | null;
	banned: boolean;
};
