import { useState, type ReactNode } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import {
	FiDownload,
	FiFileText,
	FiHeart,
	FiMessageCircle,
	FiMusic,
	FiPause,
	FiPlay,
	FiTrash2,
} from "react-icons/fi";
import { notify } from "../../lib/uiStore";
import { pluralize } from "../../lib/plural";
import type { Track } from "../../types/music";

const LIKE_COLOR = "#e0245e";
const AUTHORS_MARKER = "\n\n---AUTHORS---\n";

function splitLyrics(raw: string) {
	const index = raw.indexOf(AUTHORS_MARKER);
	if (index === -1) {
		return { text: raw, authors: "" };
	}
	return {
		text: raw.slice(0, index),
		authors: raw.slice(index + AUTHORS_MARKER.length),
	};
}

function joinLyrics(text: string, authors: string) {
	return authors.trim() ? `${text}${AUTHORS_MARKER}${authors.trim()}` : text;
}

type Props = {
	track: Track;
	isAdmin: boolean;
	isLiked: boolean;
	isCurrent: boolean;
	isPlaying: boolean;
	onPlay: () => void;
	onToggleLike: () => void;
	onDelete: () => void;
	onOpenComments?: () => void;
	onSaveLyrics?: (lyrics: string) => Promise<boolean> | void;
	dragHandle?: ReactNode;
};

export default function TrackCard({
	track,
	isAdmin,
	isLiked,
	isCurrent,
	isPlaying,
	onPlay,
	onToggleLike,
	onDelete,
	onOpenComments,
	onSaveLyrics,
	dragHandle,
}: Props) {
	const isCurrentlyPlaying = isCurrent && isPlaying;
	const [isDownloading, setIsDownloading] = useState(false);
	const [lyricsOpen, setLyricsOpen] = useState(false);
	const [lyricsDraft, setLyricsDraft] = useState("");
	const [authorsDraft, setAuthorsDraft] = useState("");
	const [savingLyrics, setSavingLyrics] = useState(false);

	const hasLyrics = Boolean(track.lyrics);
	const showLyricsButton = isAdmin || hasLyrics;
	const { text: lyricsText, authors: lyricsAuthors } = splitLyrics(
		track.lyrics,
	);

	const handleDownload = async () => {
		if (isDownloading) return;
		setIsDownloading(true);
		try {
			const response = await fetch(track.download);
			if (!response.ok) throw new Error("Download failed");
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `${track.artist} - ${track.title}`.trim();
			document.body.appendChild(link);
			link.click();
			link.remove();
			setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
		} catch {
			notify(
				"Не удалось скачать файл. Откройте ссылку вручную.",
				"error",
			);
		} finally {
			setIsDownloading(false);
		}
	};

	const openLyrics = () => {
		setLyricsDraft(lyricsText);
		setAuthorsDraft(lyricsAuthors);
		setLyricsOpen(true);
	};

	const handleSaveLyrics = async () => {
		if (!onSaveLyrics) return;
		setSavingLyrics(true);
		try {
			const saved = await onSaveLyrics(
				joinLyrics(lyricsDraft.trim(), authorsDraft),
			);
			if (saved !== false) {
				setLyricsOpen(false);
			}
		} finally {
			setSavingLyrics(false);
		}
	};

	return (
		<>
			<Card>
				<CardContent>
					<Stack spacing={2}>
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={2}
							sx={{
								justifyContent: "space-between",
								alignItems: { xs: "flex-start", sm: "center" },
							}}
						>
							<Stack
								direction="row"
								spacing={1.5}
								sx={{ minWidth: 0, alignItems: "center" }}
							>
								{dragHandle}
								<Avatar
									src={track.cover || undefined}
									alt=""
									slotProps={{
										img: {
											loading: "lazy",
											width: 56,
											height: 56,
										},
									}}
									sx={{
										width: 56,
										height: 56,
										flexShrink: 0,
										borderRadius: 0.5,
									}}
								>
									<FiMusic size={20} />
								</Avatar>
								<Box sx={{ minWidth: 0 }}>
									<Typography component="h2" variant="h2">
										{track.title}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										noWrap
										sx={{ mt: 0.5 }}
									>
										{[
											track.artist,
											track.year,
											track.duration,
											track.mood,
										]
											.filter((part) => Boolean(part))
											.join(" · ")}
									</Typography>
								</Box>
							</Stack>
							<Stack
								direction="row"
								spacing={1}
								sx={{
									justifyContent: {
										xs: "flex-end",
										sm: "flex-start",
									},
									width: { xs: "100%", sm: "auto" },
								}}
							>
								{showLyricsButton && (
									<IconButton
										aria-label={
											isAdmin && !hasLyrics
												? "Добавить текст песни"
												: "Текст песни"
										}
										onClick={openLyrics}
										sx={{
											color:
												isAdmin && !hasLyrics
													? "warning.main"
													: "text.primary",
										}}
									>
										<FiFileText size={20} />
									</IconButton>
								)}
								<IconButton
									aria-label={`${
										isLiked
											? "Убрать лайк"
											: "Поставить лайк"
									}, ${pluralize(track.up, "лайк", "лайка", "лайков")}`}
									aria-pressed={isLiked}
									onClick={onToggleLike}
									sx={{
										color: isLiked ? LIKE_COLOR : "default",
									}}
								>
									<FiHeart
										size={20}
										fill={isLiked ? LIKE_COLOR : "none"}
									/>
									<Typography
										variant="caption"
										aria-hidden="true"
										sx={{ ml: 0.5 }}
									>
										{track.up}
									</Typography>
								</IconButton>
								{onOpenComments && (
									<IconButton
										aria-label={pluralize(
											track.commentCount,
											"комментарий",
											"комментария",
											"комментариев",
										)}
										onClick={onOpenComments}
									>
										<FiMessageCircle size={20} />
										<Typography
											variant="caption"
											aria-hidden="true"
											sx={{ ml: 0.5 }}
										>
											{track.commentCount}
										</Typography>
									</IconButton>
								)}
								<IconButton
									aria-label="Скачать трек"
									onClick={handleDownload}
									disabled={isDownloading}
								>
									{isDownloading ? (
										<CircularProgress size={20} />
									) : (
										<FiDownload size={20} />
									)}
								</IconButton>
								<IconButton
									aria-label={
										isCurrentlyPlaying ? "Пауза" : "Слушать"
									}
									onClick={onPlay}
									sx={{
										bgcolor: isCurrentlyPlaying
											? "secondary.main"
											: "action.selected",
										color: isCurrentlyPlaying
											? "secondary.contrastText"
											: "text.primary",
										borderRadius: "50%",
										"&:hover": {
											bgcolor: isCurrentlyPlaying
												? "secondary.dark"
												: "action.hover",
										},
									}}
								>
									{isCurrentlyPlaying ? (
										<FiPause size={20} />
									) : (
										<FiPlay size={20} />
									)}
								</IconButton>
								{isAdmin && (
									<IconButton
										aria-label="Удалить трек"
										color="error"
										onClick={onDelete}
									>
										<FiTrash2 size={20} />
									</IconButton>
								)}
							</Stack>
						</Stack>
					</Stack>
				</CardContent>
			</Card>
			{showLyricsButton && (
				<Dialog
					open={lyricsOpen}
					onClose={() => setLyricsOpen(false)}
					fullWidth
					maxWidth="sm"
				>
					<DialogTitle>{track.title} - текст песни</DialogTitle>
					<DialogContent>
						{isAdmin ? (
							<Stack spacing={2} sx={{ mt: 1 }}>
								<TextField
									value={lyricsDraft}
									onChange={(event) =>
										setLyricsDraft(event.target.value)
									}
									fullWidth
									multiline
									minRows={6}
									maxRows={20}
									autoFocus
									placeholder="Введите текст песни"
								/>
								<TextField
									value={authorsDraft}
									onChange={(event) =>
										setAuthorsDraft(event.target.value)
									}
									fullWidth
									placeholder="Авторы текста песни"
									label="Авторы текста"
								/>
							</Stack>
						) : (
							<Stack spacing={2}>
								<Typography
									variant="body2"
									sx={{ whiteSpace: "pre-wrap" }}
								>
									{lyricsText}
								</Typography>
								{lyricsAuthors && (
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{lyricsAuthors}
									</Typography>
								)}
							</Stack>
						)}
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setLyricsOpen(false)}>
							{isAdmin ? "Отмена" : "Закрыть"}
						</Button>
						{isAdmin && (
							<Button
								variant="contained"
								onClick={handleSaveLyrics}
								disabled={savingLyrics}
							>
								{savingLyrics ? "Сохранение…" : "Сохранить"}
							</Button>
						)}
					</DialogActions>
				</Dialog>
			)}
		</>
	);
}
