import { createClient } from "@supabase/supabase-js";

export type StaticTrack = {
	id: string;
	title: string;
	artist: string;
	year: number;
	duration: string;
	lyrics: string;
	coverPath: string | null;
	albumTitle: string;
};

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const client = url && anonKey ? createClient(url, anonKey) : null;

export async function fetchPublishedTracks(): Promise<StaticTrack[]> {
	if (!client) {
		return [];
	}

	const { data, error } = await client
		.from("tracks")
		.select("id,title,artist,year,duration,lyrics,cover_path,albums(title)")
		.eq("published", true)
		.order("position", { ascending: true });

	if (error || !data) {
		return [];
	}

	return data.map((row) => ({
		id: row.id,
		title: row.title,
		artist: row.artist,
		year: row.year,
		duration: row.duration || "",
		lyrics: row.lyrics || "",
		coverPath: row.cover_path,
		albumTitle:
			((row.albums as { title: string } | { title: string }[] | null) &&
				(Array.isArray(row.albums)
					? row.albums[0]?.title
					: (row.albums as { title: string }).title)) ||
			"",
	}));
}
