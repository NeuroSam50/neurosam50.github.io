import { useEffect, useRef, useState } from "react";
import { readAudioDuration } from "../../lib/audio";
import { readId3Tags } from "../../lib/id3";
import { slugify } from "../../lib/slugify";
import {
	hasSupabaseConfig,
	supabase,
	uploadFileWithProgress,
} from "../../lib/supabase";
import { describeError } from "../../lib/errors";
import { refreshCatalog } from "../../lib/catalogStore";
import type { AdminTrackRow } from "../../types/admin";

const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const AUDIO_MIME = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];
const COVER_MIME = ["image/jpeg", "image/png", "image/webp"];

function formatMegabytes(bytes: number) {
	return `${Math.round(bytes / (1024 * 1024))} МБ`;
}

type Params = {
	onSaved: () => Promise<void> | void;
};

export function useTrackUpload({ onSaved }: Params) {
	const [trackForm, setTrackForm] = useState({
		title: "",
		artist: "NeuroSam",
		album: "",
		lyrics: "",
	});
	const [trackYear, setTrackYear] = useState(new Date().getFullYear());
	const [trackFile, setTrackFile] = useState<File | null>(null);
	const [trackDuration, setTrackDuration] = useState("");
	const [trackDurationLoading, setTrackDurationLoading] = useState(false);
	const [trackCoverBlob, setTrackCoverBlob] = useState<Blob | null>(null);
	const [trackCoverPreview, setTrackCoverPreviewState] = useState("");
	const [uploadError, setUploadError] = useState("");
	const [uploadMessage, setUploadMessage] = useState("");
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);
	const [editingTrackId, setEditingTrackId] = useState("");
	const isEditing = Boolean(editingTrackId);

	const objectUrlRef = useRef("");

	function setTrackCoverPreview(next: string, ownsObjectUrl = false) {
		if (objectUrlRef.current && objectUrlRef.current !== next) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = "";
		}
		if (ownsObjectUrl) {
			objectUrlRef.current = next;
		}
		setTrackCoverPreviewState(next);
	}

	useEffect(() => {
		return () => {
			if (objectUrlRef.current) {
				URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = "";
			}
		};
	}, []);

	function ensureDefaultAlbum(albumId: string) {
		setTrackForm((current) =>
			current.album ? current : { ...current, album: albumId },
		);
	}

	function updateTrackForm(field: keyof typeof trackForm, value: string) {
		setTrackForm((current) => ({ ...current, [field]: value }));
	}

	async function handleTrackFileChange(file: File | null) {
		setUploadError("");
		setTrackDuration("");

		if (!file) {
			setTrackFile(null);
			return;
		}

		if (file.size > MAX_AUDIO_BYTES) {
			setTrackFile(null);
			setUploadError(
				`Файл больше ${formatMegabytes(MAX_AUDIO_BYTES)}. Выберите файл меньшего размера.`,
			);
			return;
		}

		if (file.type && !AUDIO_MIME.includes(file.type)) {
			setTrackFile(null);
			setUploadError("Поддерживаются только MP3, WAV, OGG и M4A.");
			return;
		}

		setTrackFile(file);
		setTrackDurationLoading(true);

		try {
			const [duration, tags] = await Promise.all([
				readAudioDuration(file).catch(() => ""),
				readId3Tags(file).catch(
					() => ({}) as Awaited<ReturnType<typeof readId3Tags>>,
				),
			]);

			setTrackDuration(duration);
			setTrackForm((current) => ({
				...current,
				title: tags.title || current.title,
				artist: tags.artist || current.artist,
			}));

			const parsedYear = Number(tags.year);
			if (
				Number.isInteger(parsedYear) &&
				parsedYear >= 1900 &&
				parsedYear <= 2200
			) {
				setTrackYear(parsedYear);
			}

			if (tags.coverBlob) {
				setTrackCoverBlob(tags.coverBlob);
				setTrackCoverPreview(URL.createObjectURL(tags.coverBlob), true);
			}
		} finally {
			setTrackDurationLoading(false);
		}
	}

	function handleCoverFileChange(file: File | null) {
		if (!file) {
			return;
		}

		if (file.size > MAX_COVER_BYTES) {
			setUploadError(
				`Обложка больше ${formatMegabytes(MAX_COVER_BYTES)}. Выберите изображение меньшего размера.`,
			);
			return;
		}

		if (file.type && !COVER_MIME.includes(file.type)) {
			setUploadError("Обложка должна быть в формате JPEG, PNG или WebP.");
			return;
		}

		setUploadError("");
		setTrackCoverBlob(file);
		setTrackCoverPreview(URL.createObjectURL(file), true);
	}

	function handleEditTrack(track: AdminTrackRow) {
		setEditingTrackId(track.id);
		setTrackForm({
			title: track.title,
			artist: track.artist,
			album: track.album_id || "",
			lyrics: track.lyrics || "",
		});
		setTrackYear(track.year);
		setTrackDuration(track.duration);
		setTrackFile(null);
		setTrackCoverBlob(null);
		setTrackCoverPreview(track.cover_path || "");
		setUploadError("");
		setUploadMessage("");
	}

	function handleCancelEdit() {
		setEditingTrackId("");
		setTrackForm((current) => ({
			title: "",
			artist: "NeuroSam",
			album: current.album,
			lyrics: "",
		}));
		setTrackYear(new Date().getFullYear());
		setTrackDuration("");
		setTrackFile(null);
		setTrackCoverBlob(null);
		setTrackCoverPreview("");
		setUploadError("");
		setUploadMessage("");
	}

	async function handleSaveTrack(albumOverride?: string) {
		setUploadError("");
		setUploadMessage("");

		if (!supabase || saving) {
			if (!supabase) {
				setUploadError("Supabase не настроен.");
			}
			return;
		}

		const albumId =
			albumOverride !== undefined ? albumOverride : trackForm.album;

		if (!trackForm.title.trim()) {
			setUploadError("Укажите название трека.");
			return;
		}

		if (!isEditing && !trackFile) {
			setUploadError("Выберите аудиофайл.");
			return;
		}

		if (albumOverride !== undefined) {
			setTrackForm((current) => ({ ...current, album: albumOverride }));
		}

		setSaving(true);

		try {
			const trackId = isEditing
				? editingTrackId
				: slugify(trackForm.title, "track");

			let audioPublicUrl = "";
			if (trackFile) {
				const fileExt = trackFile.name.split(".").pop() || "mp3";
				const storagePath = `${trackId}.${fileExt}`;

				setUploadProgress(0);
				try {
					await uploadFileWithProgress(
						"tracks",
						storagePath,
						trackFile,
						setUploadProgress,
					);
				} catch (error) {
					setUploadError(
						error instanceof Error
							? error.message
							: "Ошибка загрузки файла",
					);
					return;
				} finally {
					setUploadProgress(null);
				}

				audioPublicUrl = supabase.storage
					.from("tracks")
					.getPublicUrl(storagePath).data.publicUrl;
			}

			let coverPublicUrl = "";
			if (trackCoverBlob) {
				const coverExt = trackCoverBlob.type.split("/").pop() || "jpg";
				const coverPath = `${trackId}.${coverExt}`;
				const { error: coverError } = await supabase.storage
					.from("covers")
					.upload(coverPath, trackCoverBlob, {
						cacheControl: "3600",
						upsert: true,
					});

				if (coverError) {
					setUploadError(
						describeError(
							coverError,
							"Не удалось загрузить обложку.",
						),
					);
					return;
				}

				coverPublicUrl = supabase.storage
					.from("covers")
					.getPublicUrl(coverPath).data.publicUrl;
			}

			if (isEditing) {
				const updatePayload: Record<string, unknown> = {
					title: trackForm.title.trim(),
					artist: trackForm.artist.trim() || "NeuroSam",
					album_id: albumId || null,
					year: trackYear,
					lyrics: trackForm.lyrics.trim(),
				};

				if (audioPublicUrl) {
					updatePayload.audio_path = audioPublicUrl;
					updatePayload.download_path = audioPublicUrl;
					updatePayload.duration = trackDuration;
				}

				if (coverPublicUrl) {
					updatePayload.cover_path = coverPublicUrl;
				} else if (!trackCoverPreview) {
					updatePayload.cover_path = null;
				}

				const { error: updateError } = await supabase
					.from("tracks")
					.update(updatePayload)
					.eq("id", trackId);

				if (updateError) {
					setUploadError(
						describeError(
							updateError,
							"Не удалось сохранить изменения.",
						),
					);
					return;
				}

				setUploadMessage("Изменения сохранены.");
				await Promise.all([onSaved(), refreshCatalog()]);
				return;
			}

			const { count } = await supabase
				.from("tracks")
				.select("id", { count: "exact", head: true });

			let albumCount = 0;
			if (albumId) {
				const { count: albumTrackCount } = await supabase
					.from("tracks")
					.select("id", { count: "exact", head: true })
					.eq("album_id", albumId);
				albumCount = albumTrackCount || 0;
			}

			const { error: insertError } = await supabase
				.from("tracks")
				.insert({
					id: trackId,
					title: trackForm.title.trim(),
					artist: trackForm.artist.trim() || "NeuroSam",
					album_id: albumId || null,
					year: trackYear,
					duration: trackDuration,
					audio_path: audioPublicUrl,
					download_path: audioPublicUrl,
					cover_path: coverPublicUrl || null,
					published: true,
					position: (count || 0) + 10,
					album_position: albumId ? albumCount * 10 + 10 : 0,
					up_count: 0,
					lyrics: trackForm.lyrics.trim(),
				});

			if (insertError) {
				setUploadError(
					describeError(insertError, "Не удалось добавить трек."),
				);
				return;
			}

			setTrackForm((current) => ({
				title: "",
				artist: "NeuroSam",
				album: current.album,
				lyrics: "",
			}));
			setTrackYear(new Date().getFullYear());
			setTrackDuration("");
			setTrackFile(null);
			setTrackCoverBlob(null);
			setTrackCoverPreview("");
			setUploadMessage("Трек загружен и добавлен в базу.");
			await Promise.all([onSaved(), refreshCatalog()]);
		} finally {
			setSaving(false);
		}
	}

	return {
		hasSupabaseConfig,
		trackForm,
		updateTrackForm,
		ensureDefaultAlbum,
		trackYear,
		setTrackYear,
		trackFile,
		trackDuration,
		trackDurationLoading,
		trackCoverPreview,
		setTrackCoverBlob,
		setTrackCoverPreview,
		uploadError,
		uploadMessage,
		uploadProgress,
		saving,
		editingTrackId,
		isEditing,
		handleTrackFileChange,
		handleCoverFileChange,
		handleEditTrack,
		handleCancelEdit,
		handleSaveTrack,
	};
}
