import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { deleteTrack as deleteTrackFromCatalog } from "../../lib/catalogStore";
import { notify } from "../../lib/uiStore";
import { describeError } from "../../lib/errors";
import type { AdminTrackRow } from "../../types/admin";

export function useTrackRecords() {
	const [trackRecords, setTrackRecords] = useState<AdminTrackRow[]>([]);
	const [loading, setLoading] = useState(false);

	async function loadTracks() {
		if (!supabase) {
			return;
		}

		setLoading(true);
		const { data, error } = await supabase
			.from("tracks")
			.select("id,title,artist,album_id,year,duration,cover_path,lyrics")
			.order("position", { ascending: true });
		setLoading(false);

		if (error) {
			notify(
				describeError(error, "Не удалось загрузить треки."),
				"error",
			);
			return;
		}

		setTrackRecords(data || []);
	}

	async function deleteTrack(trackId: string) {
		const deleted = await deleteTrackFromCatalog(trackId);

		if (deleted) {
			setTrackRecords((current) =>
				current.filter((track) => track.id !== trackId),
			);
		}

		return deleted;
	}

	return { trackRecords, loading, loadTracks, deleteTrack };
}
