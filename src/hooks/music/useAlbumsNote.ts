import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { notify } from "../../lib/uiStore";
import { describeError } from "../../lib/errors";

const NOTE_KEY = "albums_note";

export function useAlbumsNote() {
	const [albumsNote, setAlbumsNote] = useState("");

	useEffect(() => {
		if (!supabase) {
			return;
		}

		supabase
			.from("site_notes")
			.select("body")
			.eq("key", NOTE_KEY)
			.maybeSingle()
			.then(({ data }) => {
				setAlbumsNote(data?.body || "");
			});
	}, []);

	async function saveAlbumsNote(body: string) {
		if (!supabase) {
			return false;
		}

		const { error } = await supabase
			.from("site_notes")
			.upsert({ key: NOTE_KEY, body });

		if (error) {
			notify(
				describeError(error, "Не удалось сохранить заметку."),
				"error",
			);
			return false;
		}

		setAlbumsNote(body);
		return true;
	}

	return { albumsNote, saveAlbumsNote };
}
