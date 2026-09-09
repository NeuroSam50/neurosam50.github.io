import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { confirmAction, notify } from "../../lib/uiStore";
import { describeError } from "../../lib/errors";
import type { Comment, Track } from "../../types/music";

function sortComments(comments: Comment[]) {
	return [...comments].sort(
		(a, b) =>
			Number(b.isPinned) - Number(a.isPinned) ||
			b.upCount - b.downCount - (a.upCount - a.downCount) ||
			(a.createdAt < b.createdAt ? -1 : 1),
	);
}

type Params = {
	authUserId: string;
	requireAuth: () => boolean;
	myCommentVotes: Record<string, "up" | "down">;
	setMyCommentVotes: React.Dispatch<
		React.SetStateAction<Record<string, "up" | "down">>
	>;
	setTrackRecords: React.Dispatch<React.SetStateAction<Track[]>>;
};

export function useComments({
	authUserId,
	requireAuth,
	myCommentVotes,
	setMyCommentVotes,
	setTrackRecords,
}: Params) {
	const [subscribedTrackId, setSubscribedTrackId] = useState("");
	const [commentsByTrack, setCommentsByTrack] = useState<
		Record<string, Comment[]>
	>({});
	const [commentLoading, setCommentLoading] = useState<
		Record<string, boolean>
	>({});
	const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
		{},
	);
	const [commentErrors, setCommentErrors] = useState<Record<string, string>>(
		{},
	);
	const [commentSubmitting, setCommentSubmitting] = useState<
		Record<string, boolean>
	>({});

	const pendingVotes = useRef(new Set<string>());
	const loadCommentsRef = useRef<(trackId: string) => Promise<void>>(
		async () => {},
	);

	async function loadComments(trackId: string) {
		if (!supabase) {
			return;
		}

		setCommentLoading((current) => ({ ...current, [trackId]: true }));

		const { data, error } = await supabase
			.from("comment_details")
			.select(
				"id,track_id,user_id,body,up_count,down_count,is_pinned,created_at,edited_at,nickname,avatar_url,is_admin",
			)
			.eq("track_id", trackId)
			.order("created_at", { ascending: true });

		if (error) {
			setCommentErrors((current) => ({
				...current,
				[trackId]: describeError(
					error,
					"Не удалось загрузить комментарии.",
				),
			}));
		} else {
			const rows = data || [];
			setCommentsByTrack((current) => ({
				...current,
				[trackId]: sortComments(
					rows.map((row) => ({
						id: row.id,
						trackId: row.track_id,
						userId: row.user_id,
						body: row.body,
						createdAt: row.created_at,
						editedAt: row.edited_at || "",
						nickname: row.nickname || "Гость",
						avatarUrl: row.avatar_url || "",
						isAdmin: Boolean(row.is_admin),
						upCount: row.up_count,
						downCount: row.down_count,
						isPinned: Boolean(row.is_pinned),
					})),
				),
			}));

			if (authUserId && rows.length > 0) {
				const { data: voteRows } = await supabase
					.from("comment_votes")
					.select("comment_id,vote_type")
					.eq("user_id", authUserId)
					.in(
						"comment_id",
						rows.map((row) => row.id),
					);

				setMyCommentVotes((current) => ({
					...current,
					...(voteRows || []).reduce<Record<string, "up" | "down">>(
						(acc, row) => {
							acc[row.comment_id] = row.vote_type;
							return acc;
						},
						{},
					),
				}));
			}
		}

		setCommentLoading((current) => ({ ...current, [trackId]: false }));
	}

	loadCommentsRef.current = loadComments;

	async function submitComment(trackId: string) {
		setCommentErrors((current) => ({ ...current, [trackId]: "" }));

		if (!supabase || !requireAuth() || commentSubmitting[trackId]) {
			return;
		}

		const body = (commentDrafts[trackId] || "").trim();

		if (!body) {
			return;
		}

		const existingComments = commentsByTrack[trackId] || [];
		const lastOwnComment = [...existingComments]
			.reverse()
			.find((comment) => comment.userId === authUserId);
		const isImmediateDuplicate =
			lastOwnComment &&
			lastOwnComment.body === body &&
			Date.now() - new Date(lastOwnComment.createdAt).getTime() < 15000;

		if (isImmediateDuplicate) {
			setCommentErrors((current) => ({
				...current,
				[trackId]: "Вы уже отправили такой комментарий.",
			}));
			return;
		}

		setCommentSubmitting((current) => ({ ...current, [trackId]: true }));

		try {
			const { error } = await supabase.from("comments").insert({
				track_id: trackId,
				user_id: authUserId,
				body,
			});

			if (error) {
				setCommentErrors((current) => ({
					...current,
					[trackId]: describeError(
						error,
						"Не удалось отправить комментарий.",
					),
				}));
				return;
			}

			setCommentDrafts((current) => ({ ...current, [trackId]: "" }));
			setTrackRecords((current) =>
				current.map((track) =>
					track.id === trackId
						? { ...track, commentCount: track.commentCount + 1 }
						: track,
				),
			);
			await loadComments(trackId);
		} finally {
			setCommentSubmitting((current) => ({
				...current,
				[trackId]: false,
			}));
		}
	}

	async function editComment(trackId: string, commentId: string, body: string) {
		if (!supabase) {
			return;
		}

		const trimmed = body.trim();

		if (!trimmed) {
			return;
		}

		const { error } = await supabase
			.from("comments")
			.update({ body: trimmed })
			.eq("id", commentId);

		if (error) {
			notify(
				describeError(error, "Не удалось изменить комментарий."),
				"error",
			);
			return;
		}

		await loadComments(trackId);
	}

	async function deleteComment(trackId: string, commentId: string) {
		if (!supabase) {
			return;
		}

		const accepted = await confirmAction({
			title: "Удалить комментарий?",
			body: "Восстановить его будет нельзя.",
		});

		if (!accepted) {
			return;
		}

		const { error } = await supabase
			.from("comments")
			.delete()
			.eq("id", commentId);

		if (error) {
			notify(
				describeError(error, "Не удалось удалить комментарий."),
				"error",
			);
			return;
		}

		removeCommentLocally(trackId, commentId);
	}

	function removeCommentLocally(trackId: string, commentId: string) {
		setCommentsByTrack((current) => ({
			...current,
			[trackId]: (current[trackId] || []).filter(
				(comment) => comment.id !== commentId,
			),
		}));
		setTrackRecords((current) =>
			current.map((track) =>
				track.id === trackId
					? {
							...track,
							commentCount: Math.max(0, track.commentCount - 1),
						}
					: track,
			),
		);
	}

	async function togglePinComment(trackId: string, commentId: string) {
		if (!supabase) {
			return;
		}

		const comment = (commentsByTrack[trackId] || []).find(
			(item) => item.id === commentId,
		);
		if (!comment) {
			return;
		}

		const nextPinned = !comment.isPinned;

		const { error } = await supabase
			.from("comments")
			.update({ is_pinned: nextPinned })
			.eq("id", commentId);

		if (error) {
			notify(
				describeError(error, "Не удалось закрепить комментарий."),
				"error",
			);
			return;
		}

		setCommentsByTrack((current) => ({
			...current,
			[trackId]: sortComments(
				(current[trackId] || []).map((item) =>
					item.id === commentId
						? { ...item, isPinned: nextPinned }
						: item,
				),
			),
		}));
	}

	async function toggleCommentVote(
		trackId: string,
		commentId: string,
		direction: "up" | "down",
	) {
		if (
			!supabase ||
			!requireAuth() ||
			pendingVotes.current.has(commentId)
		) {
			return;
		}

		pendingVotes.current.add(commentId);

		try {
			const currentVote = myCommentVotes[commentId];

			function applyLocalDelta(upDelta: number, downDelta: number) {
				let mayBeHidden = false;

				setCommentsByTrack((current) => ({
					...current,
					[trackId]: sortComments(
						(current[trackId] || []).map((comment) => {
							if (comment.id !== commentId) {
								return comment;
							}

							const downCount = Math.max(
								0,
								comment.downCount + downDelta,
							);
							if (downCount >= 10) {
								mayBeHidden = true;
							}

							return {
								...comment,
								upCount: Math.max(0, comment.upCount + upDelta),
								downCount,
							};
						}),
					),
				}));

				if (mayBeHidden) {
					loadComments(trackId);
				}
			}

			if (currentVote === direction) {
				const { error } = await supabase
					.from("comment_votes")
					.delete()
					.eq("user_id", authUserId)
					.eq("comment_id", commentId);

				if (error) {
					notify(
						describeError(error, "Не удалось убрать голос."),
						"error",
					);
					return;
				}

				setMyCommentVotes((current) => {
					const next = { ...current };
					delete next[commentId];
					return next;
				});
				applyLocalDelta(
					direction === "up" ? -1 : 0,
					direction === "down" ? -1 : 0,
				);
				return;
			}

			if (currentVote) {
				const { error: removeError } = await supabase
					.from("comment_votes")
					.delete()
					.eq("user_id", authUserId)
					.eq("comment_id", commentId);

				if (removeError) {
					notify(
						describeError(
							removeError,
							"Не удалось изменить голос.",
						),
						"error",
					);
					return;
				}
			}

			const { error } = await supabase.from("comment_votes").insert({
				user_id: authUserId,
				comment_id: commentId,
				vote_type: direction,
			});

			if (error) {
				notify(
					describeError(error, "Не удалось учесть голос."),
					"error",
				);
				setMyCommentVotes((current) => {
					const next = { ...current };
					delete next[commentId];
					return next;
				});
				await loadComments(trackId);
				return;
			}

			setMyCommentVotes((current) => ({
				...current,
				[commentId]: direction,
			}));
			applyLocalDelta(
				direction === "up" ? 1 : currentVote === "up" ? -1 : 0,
				direction === "down" ? 1 : currentVote === "down" ? -1 : 0,
			);
		} finally {
			pendingVotes.current.delete(commentId);
		}
	}

	useEffect(() => {
		if (!supabase || !subscribedTrackId) {
			return;
		}

		const channel = supabase
			.channel(`comments:${subscribedTrackId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "comments",
					filter: `track_id=eq.${subscribedTrackId}`,
				},
				() => {
					loadCommentsRef.current(subscribedTrackId);
				},
			)
			.subscribe();

		return () => {
			supabase?.removeChannel(channel);
		};
	}, [subscribedTrackId]);

	return {
		commentsByTrack,
		commentLoading,
		commentDrafts,
		setCommentDrafts,
		commentErrors,
		commentSubmitting,
		loadComments,
		watchTrack: setSubscribedTrackId,
		submitComment,
		editComment,
		deleteComment,
		toggleCommentVote,
		togglePinComment,
	};
}
