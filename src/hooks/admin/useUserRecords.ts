import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { notify } from "../../lib/uiStore";
import { describeError } from "../../lib/errors";
import type { AdminUserRow } from "../../types/admin";

export function useUserRecords() {
	const [userRecords, setUserRecords] = useState<AdminUserRow[]>([]);
	const [loading, setLoading] = useState(false);

	async function loadUsers() {
		if (!supabase) {
			return;
		}

		setLoading(true);
		const { data, error } = await supabase
			.from("profiles")
			.select("user_id,nickname,email,avatar_url,banned")
			.order("nickname", { ascending: true });
		setLoading(false);

		if (error) {
			notify(
				describeError(error, "Не удалось загрузить пользователей."),
				"error",
			);
			return;
		}

		setUserRecords(data || []);
	}

	async function setUserBanned(userId: string, banned: boolean) {
		if (!supabase) {
			return false;
		}

		const { error } = await supabase
			.from("profiles")
			.update({ banned })
			.eq("user_id", userId);

		if (error) {
			notify(
				describeError(
					error,
					"Не удалось изменить статус пользователя.",
				),
				"error",
			);
			return false;
		}

		setUserRecords((current) =>
			current.map((user) =>
				user.user_id === userId ? { ...user, banned } : user,
			),
		);
		notify(
			banned
				? "Пользователь заблокирован."
				: "Пользователь разблокирован.",
			"success",
		);
		return true;
	}

	return { userRecords, loading, loadUsers, setUserBanned };
}
