import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	CssBaseline,
	Stack,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { CacheProvider } from "@emotion/react";
import { createAppTheme, useColorMode } from "../lib/theme";
import { createEmotionCache } from "../lib/emotionCache";
import { useAuthState } from "../lib/authStore";
import { useCatalogState } from "../lib/catalogStore";
import { useTrackRecords } from "../hooks/admin/useTrackRecords";
import { useTrackUpload } from "../hooks/admin/useTrackUpload";
import TrackFormCard from "./admin/TrackFormCard";
import TrackRecordsCard from "./admin/TrackRecordsCard";

export default function AdminUpload() {
	const { effectiveMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const emotionCache = useMemo(() => createEmotionCache(), []);

	const { authLoading, authUserId, isAdminUser } = useAuthState();
	const isAdmin = Boolean(authUserId) && isAdminUser;

	const { albumRecords } = useCatalogState();
	const { trackRecords, loadTracks, deleteTrack } = useTrackRecords();
	const [albumMenuAnchor, setAlbumMenuAnchor] = useState<HTMLElement | null>(
		null,
	);

	const trackUpload = useTrackUpload({
		onSaved: loadTracks,
	});

	useEffect(() => {
		if (!isAdmin) {
			return;
		}
		loadTracks();
	}, [isAdmin]);

	useEffect(() => {
		if (isAdmin && albumRecords[0]) {
			trackUpload.ensureDefaultAlbum(albumRecords[0].id);
		}
	}, [isAdmin, albumRecords]);

	async function handleDeleteTrack(trackId: string) {
		const deleted = await deleteTrack(trackId);
		if (deleted && trackUpload.editingTrackId === trackId) {
			trackUpload.handleCancelEdit();
		}
	}

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
					<Box
						sx={{
							maxWidth: 1600,
							mx: "auto",
							px: { xs: 2, sm: 3 },
							py: { xs: 3, md: 5 },
						}}
					>
						{authLoading ? (
							<Typography color="text.secondary">
								Проверка доступа...
							</Typography>
						) : !trackUpload.hasSupabaseConfig ? (
							<Alert severity="info">
								Supabase не настроен. Добавьте переменные из
								.env.example.
							</Alert>
						) : !authUserId ? (
							<Alert severity="warning">
								Войдите в аккаунт на главной странице, затем
								вернитесь на эту вкладку.
							</Alert>
						) : !isAdmin ? (
							<Alert severity="error">
								Эта страница доступна только администраторам.
							</Alert>
						) : (
							<Stack
								direction={{ xs: "column", lg: "row" }}
								spacing={2}
								sx={{ alignItems: "flex-start" }}
							>
								<Box
									sx={{ flex: 1, minWidth: 0, width: "100%" }}
								>
									<TrackFormCard
										albumRecords={albumRecords}
										isEditing={trackUpload.isEditing}
										onCancelEdit={
											trackUpload.handleCancelEdit
										}
										trackForm={trackUpload.trackForm}
										onUpdateTrackForm={
											trackUpload.updateTrackForm
										}
										trackFile={trackUpload.trackFile}
										trackDuration={
											trackUpload.trackDuration
										}
										trackDurationLoading={
											trackUpload.trackDurationLoading
										}
										trackCoverPreview={
											trackUpload.trackCoverPreview
										}
										trackYear={trackUpload.trackYear}
										onTrackYearChange={
											trackUpload.setTrackYear
										}
										uploadProgress={
											trackUpload.uploadProgress
										}
										saving={trackUpload.saving}
										uploadError={trackUpload.uploadError}
										uploadMessage={
											trackUpload.uploadMessage
										}
										albumMenuAnchor={albumMenuAnchor}
										onOpenAlbumMenu={setAlbumMenuAnchor}
										onCloseAlbumMenu={() =>
											setAlbumMenuAnchor(null)
										}
										onTrackFileChange={
											trackUpload.handleTrackFileChange
										}
										onCoverFileChange={
											trackUpload.handleCoverFileChange
										}
										onClearCover={() => {
											trackUpload.setTrackCoverBlob(null);
											trackUpload.setTrackCoverPreview(
												"",
											);
										}}
										onSaveTrack={
											trackUpload.handleSaveTrack
										}
									/>
								</Box>

								<Box
									sx={{ flex: 1, minWidth: 0, width: "100%" }}
								>
									<TrackRecordsCard
										trackRecords={trackRecords}
										editingTrackId={
											trackUpload.editingTrackId
										}
										onEditTrack={
											trackUpload.handleEditTrack
										}
										onDeleteTrack={handleDeleteTrack}
									/>
								</Box>
							</Stack>
						)}
					</Box>
				</Box>
			</ThemeProvider>
		</CacheProvider>
	);
}
