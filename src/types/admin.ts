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

export type AdminCommentRow = {
	id: string;
	track_id: string;
	user_id: string;
	body: string;
	created_at: string;
	nickname: string;
	avatar_url: string | null;
	track_title: string;
};
