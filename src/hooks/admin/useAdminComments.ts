import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { confirmAction, notify } from "../../lib/uiStore";
import { describeError } from "../../lib/errors";
import type { AdminCommentRow } from "../../types/admin";

export function useAdminComments() {
	const [commentRecords, setCommentRecords] = useState<AdminCommentRow[]>([]);
	const [loading, setLoading] = useState(false);

	async function loadComments() {
		if (!supabase) {
			return;
		}

		setLoading(true);
		const [{ data: comments, error: commentsError }, { data: tracks }] =
			await Promise.all([
				supabase
					.from("comment_details")
					.select(
						"id,track_id,user_id,body,created_at,nickname,avatar_url",
					)
					.order("created_at", { ascending: false }),
				supabase.from("tracks").select("id,title"),
			]);
		setLoading(false);

		if (commentsError) {
			notify(
				describeError(commentsError, "Не удалось загрузить сообщения."),
				"error",
			);
			return;
		}

		const titleById = new Map(
			(tracks || []).map((track) => [track.id, track.title]),
		);

		setCommentRecords(
			(comments || []).map((comment) => ({
				...comment,
				track_title: titleById.get(comment.track_id) || "Без названия",
			})),
		);
	}

	async function deleteComment(commentId: string) {
		if (!supabase) {
			return false;
		}

		const accepted = await confirmAction({
			title: "Удалить сообщение?",
			body: "Восстановить его будет нельзя.",
		});

		if (!accepted) {
			return false;
		}

		const { error } = await supabase
			.from("comments")
			.delete()
			.eq("id", commentId);

		if (error) {
			notify(
				describeError(error, "Не удалось удалить сообщение."),
				"error",
			);
			return false;
		}

		setCommentRecords((current) =>
			current.filter((comment) => comment.id !== commentId),
		);
		notify("Сообщение удалено.", "success");
		return true;
	}

	async function deleteAllCommentsByUser(userId: string) {
		if (!supabase) {
			return false;
		}

		const accepted = await confirmAction({
			title: "Удалить все сообщения пользователя?",
			body: "Все его комментарии ко всем трекам будут удалены без возможности восстановления.",
		});

		if (!accepted) {
			return false;
		}

		const { error } = await supabase
			.from("comments")
			.delete()
			.eq("user_id", userId);

		if (error) {
			notify(
				describeError(
					error,
					"Не удалось удалить сообщения пользователя.",
				),
				"error",
			);
			return false;
		}

		setCommentRecords((current) =>
			current.filter((comment) => comment.user_id !== userId),
		);
		notify("Сообщения пользователя удалены.", "success");
		return true;
	}

	return {
		commentRecords,
		loading,
		loadComments,
		deleteComment,
		deleteAllCommentsByUser,
	};
}
