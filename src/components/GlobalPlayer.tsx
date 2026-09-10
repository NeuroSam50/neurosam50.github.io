import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	IconButton,
	Slider,
	Stack,
	ThemeProvider,
	Typography,
	alpha,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { CacheProvider } from "@emotion/react";
import {
	FiMusic,
	FiPause,
	FiPlay,
	FiVolume2,
	FiVolumeX,
} from "react-icons/fi";
import { createAppTheme, drawerWidth, useColorMode } from "../lib/theme";
import { createEmotionCache } from "../lib/emotionCache";
import {
	hasNext,
	playNext,
	togglePlay,
	usePlayerState,
} from "../lib/playerStore";

const VOLUME_STORAGE_KEY = "neurosam-player-volume-v2";

function readStoredVolume() {
	if (typeof window === "undefined") {
		return 100;
	}
	const stored = Number(window.localStorage.getItem(VOLUME_STORAGE_KEY));
	return Number.isFinite(stored) && stored >= 0 && stored <= 100
		? stored
		: 100;
}

function formatTime(seconds: number) {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return "0:00";
	}
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function GlobalPlayer() {
	const { effectiveMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const [emotionCache, setEmotionCache] = useState(() =>
		createEmotionCache(),
	);

	useEffect(() => {
		function handleAfterSwap() {
			setEmotionCache(createEmotionCache());
		}
		document.addEventListener("astro:after-swap", handleAfterSwap);
		return () =>
			document.removeEventListener("astro:after-swap", handleAfterSwap);
	}, []);

	const { track, isPlaying } = usePlayerState();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(100);
	const [mutedVolume, setMutedVolume] = useState<number | null>(null);

	const canGoNext = hasNext();

	const attachAudio = useCallback(
		(element: HTMLAudioElement | null) => {
			audioRef.current = element;
			if (element) {
				element.volume = volume / 100;
			}
		},
		[volume],
	);

	useEffect(() => {
		if (!audioRef.current) {
			return;
		}
		if (isPlaying) {
			audioRef.current.play().catch(() => {});
		} else {
			audioRef.current.pause();
		}
	}, [isPlaying, track?.id]);

	useEffect(() => {
		setCurrentTime(0);
		setDuration(0);
	}, [track?.id]);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume / 100;
		}
		window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
	}, [volume, track?.id]);

	const toggleMute = () => {
		if (mutedVolume !== null) {
			setVolume(mutedVolume);
			setMutedVolume(null);
		} else {
			setMutedVolume(volume);
			setVolume(0);
		}
	};

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<Box
					sx={{
						position: "fixed",
						bottom: { xs: 12, sm: 20 },
						left: { xs: 12, sm: 20, md: drawerWidth + 20 },
						right: { xs: 12, sm: 20 },
						zIndex: 1300,
						bgcolor: "background.paper",
						color: "text.primary",
						border: "1px solid",
						borderColor: "divider",
						borderRadius: 1,
						px: { xs: 1.5, sm: 3 },
						py: 1.25,
						boxShadow: "none",
					}}
				>
					{track && (
						<audio
							ref={attachAudio}
							src={track.src}
							preload="metadata"
							onTimeUpdate={(event) =>
								setCurrentTime(event.currentTarget.currentTime)
							}
							onLoadedMetadata={(event) =>
								setDuration(event.currentTarget.duration)
							}
							onEnded={() =>
								canGoNext ? playNext() : togglePlay()
							}
							autoPlay={isPlaying}
						/>
					)}
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={{ xs: 1, sm: 1.25 }}
						sx={{ alignItems: { xs: "stretch", sm: "center" }, opacity: track ? 1 : 0.5 }}
					>
						<Stack
							direction="row"
							spacing={{ xs: 0.75, sm: 1.25 }}
							sx={{ alignItems: "center", minWidth: 0, flexShrink: 0 }}
						>
							<IconButton
								onClick={togglePlay}
								disabled={!track}
								aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
								sx={{
									position: "relative",
									width: 40,
									height: 40,
									flexShrink: 0,
									borderRadius: 0.5,
									padding: 0,
									overflow: "hidden",
									"&:hover .cover-play-overlay": { opacity: 1 },
								}}
							>
								<Avatar
									variant="rounded"
									src={track?.cover || undefined}
									alt=""
									sx={{
										width: "100%",
										height: "100%",
										bgcolor: "action.selected",
										color: "text.secondary",
										borderRadius: 0.5,
									}}
								>
									<FiMusic size={20} />
								</Avatar>
								{track && (
									<Box
										className="cover-play-overlay"
										sx={{
											position: "absolute",
											inset: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(
												theme.palette.common.black,
												0.45,
											),
											color: theme.palette.common.white,
											opacity: isPlaying ? 0 : 1,
											transition: "opacity 0.15s",
										}}
									>
										{isPlaying ? (
											<FiPause size={20} />
										) : (
											<FiPlay size={20} />
										)}
									</Box>
								)}
							</IconButton>

							<Box
								sx={{
									minWidth: 0,
									flex: 1,
									height: 40,
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									textAlign: track ? "left" : "center",
								}}
							>
								<Typography
									noWrap
									variant="subtitle2"
									sx={{ fontWeight: 700 }}
								>
									{track ? track.title : "Ничего не играет"}
								</Typography>
								{track && (
									<Typography
										noWrap
										variant="caption"
										sx={{ opacity: 0.65 }}
									>
										{track.artist}
									</Typography>
								)}
							</Box>
						</Stack>

						<Stack
							direction="row"
							spacing={{ xs: 0.75, sm: 1.25 }}
							sx={{ alignItems: "center", minWidth: 0, flex: 1 }}
						>
							<Typography
								variant="caption"
								sx={{
									opacity: 0.65,
									minWidth: 34,
									textAlign: "right",
									flexShrink: 0,
								}}
							>
								{formatTime(currentTime)}
							</Typography>

							<Slider
								size="small"
								aria-label="Позиция воспроизведения"
								getAriaValueText={(value) => formatTime(value)}
								value={Math.min(currentTime, duration || 0)}
								max={duration || 0}
								disabled={!track}
								onChange={(_, value) => {
									const next = Array.isArray(value)
										? value[0]
										: value;
									setCurrentTime(next);
									if (audioRef.current) {
										audioRef.current.currentTime = next;
									}
								}}
								sx={{
									color: "secondary.main",
									flex: 1,
									"& .MuiSlider-thumb": {
										width: 12,
										height: 12,
										transition: "box-shadow 0.15s",
										"&:hover, &.Mui-focusVisible": {
											boxShadow: `0 0 0 8px ${alpha(
												theme.palette.secondary.main,
												0.16,
											)}`,
										},
									},
									"& .MuiSlider-rail": { opacity: 0.25 },
								}}
							/>

							<Typography
								variant="caption"
								sx={{ opacity: 0.65, minWidth: 34, flexShrink: 0 }}
							>
								{formatTime(duration)}
							</Typography>
						</Stack>

						<Stack
							direction="row"
							spacing={1}
							sx={{
								alignItems: "center",
								display: { xs: "none", sm: "flex" },
								width: 120,
								flexShrink: 0,
							}}
						>
							<IconButton
								size="small"
								onClick={toggleMute}
								aria-label={
									volume === 0
										? "Включить звук"
										: "Выключить звук"
								}
								sx={{ color: "text.primary" }}
							>
								{volume === 0 ? (
									<FiVolumeX size={20} />
								) : (
									<FiVolume2 size={20} />
								)}
							</IconButton>
							<Slider
								size="small"
								aria-label="Громкость"
								value={volume}
								onChange={(_, value) => {
									const next = Array.isArray(value)
										? value[0]
										: value;
									setVolume(next);
									setMutedVolume(null);
								}}
								sx={{ color: "text.primary" }}
							/>
						</Stack>

					</Stack>
				</Box>
			</ThemeProvider>
		</CacheProvider>
	);
}
