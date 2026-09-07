import type { MouseEvent } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	IconButton,
	Menu,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import {
	FiCamera,
	FiCheck,
	FiClock,
	FiEdit2,
	FiHeadphones,
	FiUpload,
	FiUploadCloud,
	FiX,
} from "react-icons/fi";
import type { AdminAlbum } from "../../types/admin";
import UploadProgressRing from "./UploadProgressRing";

type TrackForm = {
	title: string;
	artist: string;
	album: string;
	lyrics: string;
};

type Props = {
	albumRecords: AdminAlbum[];
	isEditing: boolean;
	onCancelEdit: () => void;
	trackForm: TrackForm;
	onUpdateTrackForm: (field: keyof TrackForm, value: string) => void;
	trackFile: File | null;
	trackDuration: string;
	trackDurationLoading: boolean;
	trackCoverPreview: string;
	trackYear: number;
	onTrackYearChange: (year: number) => void;
	uploadProgress: number | null;
	saving: boolean;
	uploadError: string;
	uploadMessage: string;
	albumMenuAnchor: HTMLElement | null;
	onOpenAlbumMenu: (anchor: HTMLElement) => void;
	onCloseAlbumMenu: () => void;
	onTrackFileChange: (file: File | null) => void;
	onCoverFileChange: (file: File | null) => void;
	onClearCover: () => void;
	onSaveTrack: (albumOverride?: string) => void;
};

export default function TrackFormCard({
	albumRecords,
	isEditing,
	onCancelEdit,
	trackForm,
	onUpdateTrackForm,
	trackFile,
	trackDuration,
	trackDurationLoading,
	trackCoverPreview,
	trackYear,
	onTrackYearChange,
	uploadProgress,
	saving,
	uploadError,
	uploadMessage,
	albumMenuAnchor,
	onOpenAlbumMenu,
	onCloseAlbumMenu,
	onTrackFileChange,
	onCoverFileChange,
	onClearCover,
	onSaveTrack,
}: Props) {
	const coverThumb = (
		<Box sx={{ position: "relative", flexShrink: 0 }}>
			<Box
				component="label"
				sx={{
					position: "relative",
					display: "block",
					width: 88,
					height: 88,
					borderRadius: 1.5,
					overflow: "hidden",
					cursor: "pointer",
					border: "1px solid",
					borderColor: trackCoverPreview ? "primary.main" : "divider",
					bgcolor: trackCoverPreview
						? "transparent"
						: "action.selected",
				}}
			>
				<input
					hidden
					type="file"
					accept="image/png,image/jpeg,image/webp"
					onChange={(event) =>
						onCoverFileChange(event.target.files?.[0] || null)
					}
				/>
				{trackCoverPreview ? (
					<Box
						component="img"
						src={trackCoverPreview}
						alt="Обложка трека"
						width={88}
						height={88}
						sx={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							display: "block",
						}}
					/>
				) : (
					<Box
						sx={{
							width: "100%",
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "text.secondary",
						}}
					>
						<FiCamera size={20} />
					</Box>
				)}
			</Box>
			{trackCoverPreview && (
				<IconButton
					size="small"
					aria-label="Убрать обложку"
					onClick={onClearCover}
					sx={{
						position: "absolute",
						top: -6,
						right: -6,
						width: 22,
						height: 22,
						bgcolor: "background.paper",
						border: "1px solid",
						borderColor: "divider",
						"&:hover": { bgcolor: "background.paper" },
					}}
				>
					<FiX size={12} />
				</IconButton>
			)}
		</Box>
	);

	const selectedAlbum = albumRecords.find(
		(album) => album.id === trackForm.album,
	);
	const canSave =
		Boolean(trackForm.title.trim()) &&
		albumRecords.length > 0 &&
		(isEditing || Boolean(trackFile)) &&
		!trackDurationLoading &&
		!saving;

	function handleUploadClick(event: MouseEvent<HTMLElement>) {
		if (albumRecords.length > 1) {
			onOpenAlbumMenu(event.currentTarget);
			return;
		}
		onSaveTrack(selectedAlbum?.id ?? albumRecords[0]?.id);
	}

	function handlePickAlbum(albumId: string) {
		onCloseAlbumMenu();
		onUpdateTrackForm("album", albumId);
		onSaveTrack(albumId);
	}

	return (
		<Card>
			<CardContent>
				<Stack spacing={2}>
					<Stack
						direction="row"
						spacing={1}
						sx={{
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Typography variant="h6" sx={{ fontWeight: 800 }}>
							{isEditing
								? "Редактирование трека"
								: "Загрузка трека"}
						</Typography>
						{isEditing && (
							<Button size="small" onClick={onCancelEdit}>
								Отмена
							</Button>
						)}
					</Stack>
					{albumRecords.length === 0 && (
						<Alert severity="info">
							Сначала создайте альбом выше.
						</Alert>
					)}

					<Stack
						direction="row"
						spacing={2}
						sx={{ alignItems: "flex-start" }}
					>
						{coverThumb}
						<Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
							<TextField
								label="Название"
								value={trackForm.title}
								onChange={(event) =>
									onUpdateTrackForm(
										"title",
										event.target.value,
									)
								}
								fullWidth
								size="small"
							/>
							<Stack direction="row" spacing={2}>
								<TextField
									label="Артист"
									value={trackForm.artist}
									onChange={(event) =>
										onUpdateTrackForm(
											"artist",
											event.target.value,
										)
									}
									fullWidth
									size="small"
								/>
								<TextField
									label="Год"
									type="number"
									value={trackYear}
									onChange={(event) =>
										onTrackYearChange(
											Number(event.target.value),
										)
									}
									size="small"
									sx={{ width: 110, flexShrink: 0 }}
									slotProps={{
										htmlInput: { min: 1900, max: 2200 },
									}}
								/>
							</Stack>
						</Stack>
					</Stack>
					<TextField
						label="Текст песни"
						value={trackForm.lyrics}
						onChange={(event) =>
							onUpdateTrackForm("lyrics", event.target.value)
						}
						fullWidth
						multiline
						minRows={3}
						maxRows={12}
						size="small"
					/>
					<Box
						component="label"
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							border: "1px solid",
							borderColor: trackFile ? "primary.main" : "divider",
							borderRadius: 1,
							bgcolor: trackFile ? "action.hover" : "transparent",
							px: 2,
							py: 1.5,
							cursor: "pointer",
							transition:
								"border-color 0.15s, background-color 0.15s",
							"&:hover": {
								borderColor: "primary.main",
								bgcolor: "action.hover",
							},
						}}
					>
						<input
							hidden
							type="file"
							accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4"
							onChange={(event) =>
								onTrackFileChange(
									event.target.files?.[0] || null,
								)
							}
						/>
						{uploadProgress !== null ? (
							<UploadProgressRing
								value={uploadProgress}
								size={44}
							/>
						) : (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 44,
									height: 44,
									borderRadius: "50%",
									bgcolor: trackFile
										? "primary.main"
										: "action.selected",
									color: trackFile
										? "primary.contrastText"
										: "text.secondary",
									flexShrink: 0,
								}}
							>
								{trackFile ? (
									<FiHeadphones size={20} />
								) : (
									<FiUpload size={20} />
								)}
							</Box>
						)}
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<Typography
								variant="body2"
								sx={{ fontWeight: 700 }}
								noWrap
							>
								{trackFile?.name ||
									(isEditing
										? "Заменить аудиофайл (необязательно)"
										: "Выберите аудиофайл")}
							</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								{trackFile
									? "MP3, WAV, OGG, M4A"
									: isEditing
										? "Файл останется прежним, если не выбрать новый"
										: "Нажмите, чтобы выбрать файл"}
							</Typography>
						</Box>
						{trackFile &&
							(trackDurationLoading ? (
								<CircularProgress
									size={16}
									sx={{ flexShrink: 0 }}
								/>
							) : (
								trackDuration && (
									<Chip
										icon={<FiClock />}
										label={trackDuration}
										size="small"
										sx={{ flexShrink: 0 }}
									/>
								)
							))}
						{trackFile && (
							<IconButton
								size="small"
								aria-label="Убрать файл"
								disabled={uploadProgress !== null}
								onClick={(event) => {
									event.preventDefault();
									onTrackFileChange(null);
								}}
								sx={{ flexShrink: 0 }}
							>
								<FiX size={20} />
							</IconButton>
						)}
					</Box>
					<Stack
						direction="row"
						sx={{
							alignItems: "center",
							justifyContent: "flex-end",
						}}
					>
						<Button
							variant="contained"
							startIcon={
								uploadProgress !== null ? (
									<CircularProgress
										variant="determinate"
										value={uploadProgress}
										size={16}
										thickness={5}
										sx={{ color: "inherit" }}
									/>
								) : isEditing ? (
									<FiEdit2 />
								) : (
									<FiUploadCloud />
								)
							}
							onClick={handleUploadClick}
							disabled={!canSave}
							sx={{ flexShrink: 0 }}
						>
							{uploadProgress !== null
								? `Загрузка ${uploadProgress}%`
								: isEditing
									? "Сохранить изменения"
									: "Загрузить трек"}
						</Button>
					</Stack>
					<Menu
						anchorEl={albumMenuAnchor}
						open={Boolean(albumMenuAnchor)}
						onClose={onCloseAlbumMenu}
						anchorOrigin={{ vertical: "top", horizontal: "right" }}
						transformOrigin={{
							vertical: "bottom",
							horizontal: "right",
						}}
					>
						{albumRecords.map((album) => (
							<MenuItem
								key={album.id}
								selected={album.id === trackForm.album}
								onClick={() => handlePickAlbum(album.id)}
							>
								{album.id === trackForm.album && (
									<FiCheck
										size={16}
										style={{ marginRight: 8 }}
									/>
								)}
								{album.title}
							</MenuItem>
						))}
					</Menu>
					{uploadError && (
						<Alert severity="error">{uploadError}</Alert>
					)}
					{uploadMessage && (
						<Alert severity="success">{uploadMessage}</Alert>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
}
