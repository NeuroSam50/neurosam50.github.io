import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	InputAdornment,
	Stack,
	TextField,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { FiMenu, FiSearch, FiSettings } from "react-icons/fi";
import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createAppTheme, useColorMode } from "../lib/theme";
import { createEmotionCache } from "../lib/emotionCache";
import { setPageTitle } from "../lib/pageTitleStore";
import { useAuthState, setMyVotes } from "../lib/authStore";
import {
	useCatalogState,
	setTrackRecords,
	deleteTrack,
	updateTrackLyrics,
	reorderTracks,
	hasSupabaseConfig,
} from "../lib/catalogStore";
import { requireAuth as requireAuthDialog } from "../lib/authDialogStore";
import { useTrackVotes } from "../hooks/music/useTrackVotes";
import { useActiveAlbum } from "../lib/albumStore";
import { pluralize } from "../lib/plural";
import TrackCard from "./music/TrackCard";
import TrackPage from "./TrackPage";
import {
	playTrack as playStoreTrack,
	usePlayerState,
} from "../lib/playerStore";
import type { Track } from "../types/music";

function getTrackIdFromUrl() {
	if (typeof window === "undefined") {
		return "";
	}
	return new URLSearchParams(window.location.search).get("t") || "";
}

type SortableTrackCardProps = {
	track: Track;
	dragEnabled: boolean;
	children: (dragHandle: ReactNode) => ReactNode;
};

function SortableTrackCard({
	track,
	dragEnabled,
	children,
}: SortableTrackCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: track.id, disabled: !dragEnabled });

	const dragHandle = dragEnabled ? (
		<Box
			{...attributes}
			{...listeners}
			sx={{
				display: "flex",
				alignItems: "center",
				flexShrink: 0,
				cursor: "grab",
				touchAction: "none",
				color: "text.secondary",
			}}
			aria-label="Изменить порядок"
		>
			<FiMenu size={20} />
		</Box>
	) : null;

	return (
		<Box
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.5 : 1,
			}}
		>
			{children(dragHandle)}
		</Box>
	);
}

function toPlayerTrack(track: Track) {
	return {
		id: track.id,
		title: track.title,
		artist: track.artist,
		cover: track.cover,
		src: track.src,
	};
}

export default function MusicApp() {
	const { effectiveMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const emotionCache = useMemo(() => createEmotionCache(), []);

	const { albumRecords, trackRecords, loading, loadError } =
		useCatalogState();

	const { authEmail, authUserId, isAdminUser, myVotes } = useAuthState();
	const isAdmin = Boolean(authEmail) && isAdminUser;
	const requireAuth = () => requireAuthDialog(authUserId);

	const activeAlbum = useActiveAlbum();
	const [query, setQuery] = useState("");
	const [openTrackId, setOpenTrackId] = useState(getTrackIdFromUrl);

	useEffect(() => {
		const onPopState = () => setOpenTrackId(getTrackIdFromUrl());
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	function openTrack(id: string) {
		const url = new URL(window.location.href);
		url.searchParams.set("t", id);
		window.history.pushState({}, "", url);
		setOpenTrackId(id);
	}

	function closeTrack() {
		const url = new URL(window.location.href);
		url.searchParams.delete("t");
		window.history.pushState({}, "", url);
		setOpenTrackId("");
	}
	const { track: currentPlayerTrack, isPlaying: isPlayerPlaying } =
		usePlayerState();
	const currentTrackId = currentPlayerTrack?.id ?? "";

	const { toggleTrackLike } = useTrackVotes({
		authUserId,
		requireAuth,
		myVotes,
		setMyVotes,
		setTrackRecords,
	});

	const isAlbumView = activeAlbum !== "all";
	const positionField = isAlbumView ? "albumPosition" : "position";
	const positionColumn = isAlbumView ? "album_position" : "position";

	const visibleTracks = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return trackRecords
			.filter((track) => {
				const matchesAlbum =
					activeAlbum === "all" || track.album === activeAlbum;
				const haystack =
					`${track.title} ${track.artist} ${track.mood}`.toLowerCase();
				return matchesAlbum && haystack.includes(needle);
			})
			.sort((a, b) => b[positionField] - a[positionField]);
	}, [activeAlbum, positionField, query, trackRecords]);

	const dragEnabled = isAdmin && query.trim() === "";

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	);

	async function reorderVisibleTracks(orderedIds: string[]) {
		const positions = orderedIds
			.map(
				(id) =>
					trackRecords.find((track) => track.id === id)?.[
						positionField
					],
			)
			.filter(
				(position): position is number => typeof position === "number",
			)
			.sort((a, b) => b - a);

		const updates = orderedIds.map((id, index) => ({
			id,
			position: positions[index],
		}));

		setTrackRecords((current) => {
			const positionById = new Map(
				updates.map((u) => [u.id, u.position]),
			);
			return current.map((track) =>
				positionById.has(track.id)
					? { ...track, [positionField]: positionById.get(track.id)! }
					: track,
			);
		});

		await reorderTracks(updates, positionColumn);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			return;
		}

		const ids = visibleTracks.map((track) => track.id);
		const oldIndex = ids.indexOf(String(active.id));
		const newIndex = ids.indexOf(String(over.id));

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		reorderVisibleTracks(arrayMove(ids, oldIndex, newIndex));
	}

	const currentViewTitle =
		activeAlbum === "all"
			? "Все песни"
			: albumRecords.find((album) => album.id === activeAlbum)?.title ||
				"Треки";

	useEffect(() => {
		if (openTrackId) {
			return;
		}
		document.title =
			activeAlbum === "all"
				? "НейроСэм"
				: `${currentViewTitle} - НейроСэм`;
		setPageTitle(currentViewTitle);
		return () => setPageTitle("");
	}, [activeAlbum, currentViewTitle, openTrackId]);

	function renderCatalog() {
		if (loading) {
			return (
				<Stack sx={{ alignItems: "center", py: 6 }}>
					<CircularProgress aria-label="Загрузка каталога" />
				</Stack>
			);
		}

		if (visibleTracks.length === 0) {
			const isFiltered = query.trim() !== "" || activeAlbum !== "all";
			return (
				<Card>
					<CardContent>
						<Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
							<Typography color="text.secondary">
								{isFiltered
									? "Ничего не найдено по вашему запросу."
									: "Треки пока не добавлены."}
							</Typography>
							{isFiltered && query.trim() !== "" && (
								<Button
									size="small"
									onClick={() => setQuery("")}
								>
									Сбросить поиск
								</Button>
							)}
						</Stack>
					</CardContent>
				</Card>
			);
		}

		const cards = visibleTracks.map((track) => (
			<SortableTrackCard
				key={track.id}
				track={track}
				dragEnabled={dragEnabled}
			>
				{(dragHandle) => (
					<TrackCard
						track={track}
						isAdmin={isAdmin}
						isLiked={Boolean(myVotes[track.id])}
						isCurrent={currentTrackId === track.id}
						isPlaying={isPlayerPlaying}
						onPlay={() =>
							playStoreTrack(
								toPlayerTrack(track),
								visibleTracks.map(toPlayerTrack),
							)
						}
						onToggleLike={() => toggleTrackLike(track.id)}
						onDelete={() => deleteTrack(track.id)}
						onSaveLyrics={(lyrics) =>
							updateTrackLyrics(track.id, lyrics)
						}
						onOpenComments={() => openTrack(track.id)}
						dragHandle={dragHandle}
					/>
				)}
			</SortableTrackCard>
		));

		if (!dragEnabled) {
			return cards;
		}

		return (
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={visibleTracks.map((track) => track.id)}
					strategy={verticalListSortingStrategy}
				>
					{cards}
				</SortableContext>
			</DndContext>
		);
	}

	if (openTrackId) {
		return <TrackPage trackId={openTrackId} onBack={closeTrack} />;
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
						<Box sx={{ maxWidth: 1120, mx: "auto" }}>
							{loadError && (
								<Alert
									severity={
										hasSupabaseConfig ? "error" : "info"
									}
									sx={{ mb: 2 }}
								>
									{loadError}
								</Alert>
							)}

							<Stack
								direction={{ xs: "column", sm: "row" }}
								spacing={2}
								sx={{
									mb: 2,
									alignItems: { xs: "stretch", sm: "center" },
									justifyContent: "space-between",
								}}
							>
								<TextField
									value={query}
									onChange={(event) =>
										setQuery(event.target.value)
									}
									placeholder="Поиск по песням"
									aria-label="Поиск по песням"
									size="small"
									sx={{ width: { xs: "100%", sm: 360 } }}
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position="start">
													<FiSearch size={20} />
												</InputAdornment>
											),
										},
									}}
								/>
								{isAdmin && (
									<Button
										href="/control"
										variant="outlined"
										startIcon={<FiSettings />}
									>
										Управление треками
									</Button>
								)}
								<Typography color="text.secondary">
									{visibleTracks.length} из{" "}
									{pluralize(
										trackRecords.length,
										"трека",
										"треков",
										"треков",
									)}
								</Typography>
							</Stack>

							<Stack spacing={2}>{renderCatalog()}</Stack>
						</Box>
					</Box>
				</Box>
			</ThemeProvider>
		</CacheProvider>
	);
}
