import { useEffect, useMemo } from "react";
import { CacheProvider } from "@emotion/react";
import {
	Box,
	Card,
	CardContent,
	CircularProgress,
	Stack,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { createAppTheme, useColorMode } from "../lib/theme";
import { createEmotionCache } from "../lib/emotionCache";
import { setPageTitle } from "../lib/pageTitleStore";
import { setPageBack } from "../lib/pageBackStore";
import { useAuthState, setMyCommentVotes, setMyVotes } from "../lib/authStore";
import {
	useCatalogState,
	setTrackRecords,
	deleteTrack,
	updateTrackLyrics,
	hasSupabaseConfig,
} from "../lib/catalogStore";
import { requireAuth as requireAuthDialog } from "../lib/authDialogStore";
import { useComments } from "../hooks/music/useComments";
import { useTrackVotes } from "../hooks/music/useTrackVotes";
import { pluralize } from "../lib/plural";
import CommentThread from "./music/CommentThread";
import TrackCard from "./music/TrackCard";
import {
	playTrack as playStoreTrack,
	usePlayerState,
} from "../lib/playerStore";

type Props = {
	trackId: string;
	onBack: () => void;
};

export default function TrackPage({ trackId, onBack }: Props) {
	const { effectiveMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const emotionCache = useMemo(() => createEmotionCache(), []);

	const { track: currentPlayerTrack, isPlaying } = usePlayerState();

	const { trackRecords, loading, loadError } = useCatalogState();

	const { authEmail, authUserId, isAdminUser, myVotes, myCommentVotes } =
		useAuthState();
	const isSignedIn = Boolean(authEmail);
	const isAdmin = isSignedIn && isAdminUser;
	const requireAuth = () => requireAuthDialog(authUserId);

	const { toggleTrackLike } = useTrackVotes({
		authUserId,
		requireAuth,
		myVotes,
		setMyVotes,
		setTrackRecords,
	});

	const comments = useComments({
		authUserId,
		requireAuth,
		myCommentVotes,
		setMyCommentVotes,
		setTrackRecords,
	});

	const track = trackRecords.find((item) => item.id === trackId) ?? null;

	const { loadComments, watchTrack } = comments;

	useEffect(() => {
		if (!trackId) {
			return;
		}
		loadComments(trackId);
		watchTrack(trackId);
		return () => watchTrack("");
	}, [trackId]);

	useEffect(() => {
		setPageBack(() => onBack());
		return () => setPageBack(null);
	}, [onBack]);

	useEffect(() => {
		if (!track) {
			return;
		}
		setPageTitle(track.title);
		return () => setPageTitle("");
	}, [track]);

	async function handleDeleteTrack() {
		if (!track) {
			return;
		}
		const deleted = await deleteTrack(track.id);
		if (deleted) {
			onBack();
		}
	}

	function renderBody() {
		if (!hasSupabaseConfig) {
			return (
				<Typography color="text.secondary">
					Supabase не настроен. Добавьте переменные из .env.example.
				</Typography>
			);
		}

		if (loading) {
			return (
				<Stack sx={{ alignItems: "center", py: 6 }}>
					<CircularProgress aria-label="Загрузка трека" />
				</Stack>
			);
		}

		if (loadError) {
			return <Typography color="error">{loadError}</Typography>;
		}

		if (!track) {
			return (
				<Typography color="text.secondary">Трек не найден.</Typography>
			);
		}

		return (
			<>
				<TrackCard
					track={track}
					isAdmin={isAdmin}
					isLiked={Boolean(myVotes[track.id])}
					isCurrent={currentPlayerTrack?.id === track.id}
					isPlaying={currentPlayerTrack?.id === track.id && isPlaying}
					onPlay={() =>
						playStoreTrack({
							id: track.id,
							title: track.title,
							artist: track.artist,
							cover: track.cover,
							src: track.src,
						})
					}
					onToggleLike={() => toggleTrackLike(track.id)}
					onDelete={handleDeleteTrack}
					onSaveLyrics={(lyrics) =>
						updateTrackLyrics(track.id, lyrics)
					}
				/>

				<Card sx={{ mt: 2 }}>
					<CardContent>
						<Typography component="h2" variant="h2" sx={{ mb: 2 }}>
							{pluralize(
								track.commentCount,
								"комментарий",
								"комментария",
								"комментариев",
							)}
						</Typography>
						<CommentThread
							comments={comments.commentsByTrack[track.id] || []}
							loading={Boolean(comments.commentLoading[track.id])}
							isSignedIn={isSignedIn}
							isAdmin={isAdmin}
							authUserId={authUserId}
							myCommentVotes={myCommentVotes}
							draft={comments.commentDrafts[track.id] || ""}
							error={comments.commentErrors[track.id] || ""}
							submitting={Boolean(
								comments.commentSubmitting[track.id],
							)}
							onDraftChange={(value) =>
								comments.setCommentDrafts((current) => ({
									...current,
									[track.id]: value,
								}))
							}
							onSubmit={() => comments.submitComment(track.id)}
							onVote={(commentId, direction) =>
								comments.toggleCommentVote(
									track.id,
									commentId,
									direction,
								)
							}
							onDelete={(commentId) =>
								comments.deleteComment(track.id, commentId)
							}
							onTogglePin={(commentId) =>
								comments.togglePinComment(track.id, commentId)
							}
							onRequireAuth={requireAuth}
						/>
					</CardContent>
				</Card>
			</>
		);
	}

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<Box sx={{ bgcolor: "background.default" }}>
					<Box
						component="main"
						sx={{
							px: { xs: 2, sm: 3, lg: 5 },
							py: { xs: 3, md: 5 },
							pb: { xs: 12, md: 14 },
						}}
					>
						<Box sx={{ maxWidth: 840, mx: "auto" }}>
							{renderBody()}
						</Box>
					</Box>
				</Box>
			</ThemeProvider>
		</CacheProvider>
	);
}
