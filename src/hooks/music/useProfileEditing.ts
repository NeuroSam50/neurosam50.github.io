import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { describeError } from "../../lib/errors";

type Params = {
	authUserId: string;
	nickname: string;
	setAvatarUrl: (url: string) => void;
	setNickname: (nickname: string) => void;
};

export function useProfileEditing({
	authUserId,
	nickname,
	setAvatarUrl,
	setNickname,
}: Params) {
	const [avatarModalOpen, setAvatarModalOpen] = useState(false);
	const [avatarError, setAvatarError] = useState("");
	const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
	const [nicknameInput, setNicknameInput] = useState("");
	const [nicknameError, setNicknameError] = useState("");

	function openNicknameEditor() {
		setNicknameInput(nickname);
		setNicknameError("");
		setNicknameModalOpen(true);
	}

	async function saveAvatarBlob(webpBlob: Blob) {
		setAvatarError("");

		if (!supabase || !authUserId) {
			return;
		}

		const storagePath = `${authUserId}.webp`;

		const { error: storageError } = await supabase.storage
			.from("avatars")
			.upload(storagePath, webpBlob, {
				cacheControl: "3600",
				upsert: true,
				contentType: "image/webp",
			});

		if (storageError) {
			const message = describeError(
				storageError,
				"Не удалось загрузить аватар.",
			);
			setAvatarError(message);
			throw new Error(message);
		}

		const { data: publicUrlData } = supabase.storage
			.from("avatars")
			.getPublicUrl(storagePath);
		const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

		const { error: updateError } = await supabase
			.from("profiles")
			.update({
				avatar_url: publicUrl,
				updated_at: new Date().toISOString(),
			})
			.eq("user_id", authUserId);

		if (updateError) {
			const message = describeError(
				updateError,
				"Не удалось сохранить аватар в профиле.",
			);
			setAvatarError(message);
			throw new Error(message);
		}

		setAvatarUrl(publicUrl);
	}

	async function handleNicknameSubmit() {
		setNicknameError("");

		const trimmed = nicknameInput.trim();

		if (!supabase || !authUserId) {
			return;
		}

		if (trimmed.length < 2 || trimmed.length > 32) {
			setNicknameError("Никнейм должен быть от 2 до 32 символов.");
			return;
		}

		const { error } = await supabase
			.from("profiles")
			.update({ nickname: trimmed, updated_at: new Date().toISOString() })
			.eq("user_id", authUserId);

		if (error) {
			setNicknameError(
				describeError(error, "Не удалось сохранить никнейм."),
			);
			return;
		}

		setNickname(trimmed);
		setNicknameModalOpen(false);
	}

	return {
		avatarModalOpen,
		setAvatarModalOpen,
		avatarError,
		nicknameModalOpen,
		setNicknameModalOpen,
		nicknameInput,
		setNicknameInput,
		nicknameError,
		openNicknameEditor,
		saveAvatarBlob,
		handleNicknameSubmit,
	};
}
