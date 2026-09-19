import { useRef } from "react";
import { supabase } from "../../lib/supabase";
import { notify } from "../../lib/uiStore";
import { describeError } from "../../lib/errors";
import type { Track } from "../../types/music";

type Params = {
	authUserId: string;
	myVotes: Record<string, boolean>;
	setMyVotes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	setTrackRecords: React.Dispatch<React.SetStateAction<Track[]>>;
};

export function useTrackVotes({
	authUserId,
	myVotes,
	setMyVotes,
	setTrackRecords,
}: Params) {
	const pending = useRef(new Set<string>());

	async function toggleTrackLike(trackId: string) {
		if (!supabase || pending.current.has(trackId)) {
			return;
		}

		pending.current.add(trackId);

		try {
			if (!authUserId) {
				const { data: liked, error } = await supabase.rpc(
					"toggle_track_like_anon",
					{ p_track_id: trackId },
				);

				if (error) {
					notify(
						describeError(error, "Не удалось поставить лайк."),
						"error",
					);
					return;
				}

				setMyVotes((current) => {
					const next = { ...current };
					if (liked) {
						next[trackId] = true;
					} else {
						delete next[trackId];
					}
					return next;
				});
				setTrackRecords((current) =>
					current.map((track) =>
						track.id === trackId
							? {
									...track,
									up: Math.max(
										0,
										track.up + (liked ? 1 : -1),
									),
								}
							: track,
					),
				);
				return;
			}

			const isLiked = Boolean(myVotes[trackId]);

			if (isLiked) {
				const { error } = await supabase
					.from("track_votes")
					.delete()
					.eq("user_id", authUserId)
					.eq("track_id", trackId);

				if (error) {
					notify(
						describeError(error, "Не удалось убрать лайк."),
						"error",
					);
					return;
				}

				setMyVotes((current) => {
					const next = { ...current };
					delete next[trackId];
					return next;
				});
				setTrackRecords((current) =>
					current.map((track) =>
						track.id === trackId
							? { ...track, up: Math.max(0, track.up - 1) }
							: track,
					),
				);
				return;
			}

			const { error } = await supabase.from("track_votes").insert({
				user_id: authUserId,
				track_id: trackId,
			});

			if (error && error.code !== "23505") {
				notify(
					describeError(error, "Не удалось поставить лайк."),
					"error",
				);
				return;
			}

			setMyVotes((current) => ({ ...current, [trackId]: true }));

			if (!error) {
				setTrackRecords((current) =>
					current.map((track) =>
						track.id === trackId
							? { ...track, up: track.up + 1 }
							: track,
					),
				);
			}
		} finally {
			pending.current.delete(trackId);
		}
	}

	return { toggleTrackLike };
}
