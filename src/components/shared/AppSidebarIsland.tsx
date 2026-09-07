import { useEffect, useMemo, useState } from "react";
import { navigate } from "astro:transitions/client";
import { CacheProvider } from "@emotion/react";
import {
	AppBar,
	CssBaseline,
	Drawer,
	IconButton,
	ThemeProvider,
	Toolbar,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { FiFolderPlus, FiMenu } from "react-icons/fi";
import {
	createAppTheme,
	useColorMode,
	type ThemePreference,
} from "../../lib/theme";
import { createEmotionCache } from "../../lib/emotionCache";
import { useAuthState, logout } from "../../lib/authStore";
import {
	useCatalogState,
	createAlbum,
	deleteAlbum,
	updateAlbum,
} from "../../lib/catalogStore";
import {
	buildAlbumItems,
	setActiveAlbum,
	syncActiveAlbumFromUrl,
	useActiveAlbum,
} from "../../lib/albumStore";
import {
	useAuthDialogState,
	setLoginOpen,
	setLogin,
	setPassword,
	openLoginDialog,
	toggleAuthMode,
	handleAuthSubmit,
} from "../../lib/authDialogStore";
import { setAvatarUrl, setNickname } from "../../lib/authStore";
import { useAlbumsNote } from "../../hooks/music/useAlbumsNote";
import { useProfileEditing } from "../../hooks/music/useProfileEditing";
import AppSidebar from "./AppSidebar";
import LoginDialog from "../music/LoginDialog";
import NicknameDialog from "../music/NicknameDialog";
import AlbumFormDialog from "../music/AlbumFormDialog";
import AlbumsNoteDialog from "../music/AlbumsNoteDialog";
import AvatarCropDialog from "../AvatarCropDialog";

function readPathname() {
	return typeof window !== "undefined" ? window.location.pathname : "/";
}

export default function AppSidebarIsland() {
	const { preference, effectiveMode, setMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const isDesktop = useMediaQuery(theme.breakpoints.up("md"), {
		defaultMatches: true,
	});
	const [emotionCache, setEmotionCache] = useState(() =>
		createEmotionCache(),
	);
	const [pathname, setPathname] = useState(readPathname);
	const activeAlbum = useActiveAlbum();
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		function handleAfterSwap() {
			setEmotionCache(createEmotionCache());
			setPathname(readPathname());
			syncActiveAlbumFromUrl();
			setMobileOpen(false);
		}
		document.addEventListener("astro:after-swap", handleAfterSwap);
		return () =>
			document.removeEventListener("astro:after-swap", handleAfterSwap);
	}, []);

	const {
		authLoading,
		authEmail,
		authUserId,
		isAdminUser,
		avatarUrl,
		nickname,
	} = useAuthState();
	const isSignedIn = Boolean(authEmail);
	const isAdmin = isSignedIn && isAdminUser;

	const { albumRecords, trackRecords } = useCatalogState();
	const authDialog = useAuthDialogState();
	const { albumsNote, saveAlbumsNote } = useAlbumsNote();
	const [albumsNoteOpen, setAlbumsNoteOpen] = useState(false);
	const [editAlbumId, setEditAlbumId] = useState<string | null>(null);
	const [editAlbumTitle, setEditAlbumTitle] = useState("");
	const [editAlbumDescription, setEditAlbumDescription] = useState("");
	const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
	const [newAlbumTitle, setNewAlbumTitle] = useState("");
	const [newAlbumDescription, setNewAlbumDescription] = useState("");
	const [newAlbumError, setNewAlbumError] = useState("");

	const profileEditing = useProfileEditing({
		authUserId,
		nickname,
		setAvatarUrl,
		setNickname,
	});

	const themeOrder: ThemePreference[] = ["system", "light", "dark"];
	function cycleThemeMode() {
		const nextIndex =
			(themeOrder.indexOf(preference) + 1) % themeOrder.length;
		setMode(themeOrder[nextIndex]);
	}

	const isIndexPage = pathname === "/";

	function goToAlbum(albumId: string) {
		setMobileOpen(false);
		if (isIndexPage) {
			setActiveAlbum(albumId);
			const url = new URL(window.location.href);
			if (albumId === "all") {
				url.searchParams.delete("album");
			} else {
				url.searchParams.set("album", albumId);
			}
			window.history.replaceState({}, "", url);
		} else {
			navigate(albumId === "all" ? "/" : `/?album=${albumId}`);
		}
	}

	function handleEditAlbum(albumId: string) {
		const album = albumRecords.find((item) => item.id === albumId);
		if (!album) {
			return;
		}
		setEditAlbumId(albumId);
		setEditAlbumTitle(album.title);
		setEditAlbumDescription(album.description);
	}

	async function handleSaveAlbum() {
		if (!editAlbumId) {
			return;
		}
		const saved = await updateAlbum(editAlbumId, {
			title: editAlbumTitle,
			description: editAlbumDescription,
		});
		if (saved) {
			setEditAlbumId(null);
		}
	}

	function openCreateAlbum() {
		setMobileOpen(false);
		setNewAlbumTitle("");
		setNewAlbumDescription("");
		setNewAlbumError("");
		setCreateAlbumOpen(true);
	}

	async function handleCreateAlbum() {
		const { albumId, error } = await createAlbum({
			title: newAlbumTitle,
			description: newAlbumDescription,
		});
		if (error) {
			setNewAlbumError(error);
			return;
		}
		setCreateAlbumOpen(false);
		if (albumId && isIndexPage) {
			goToAlbum(albumId);
		}
	}

	async function handleDeleteAlbum(albumId: string) {
		const deleted = await deleteAlbum(albumId);
		if (deleted && activeAlbum === albumId) {
			goToAlbum("all");
		}
	}

	async function handleLogout() {
		await logout();
		if (pathname === "/upload") {
			navigate("/");
		}
	}

	const albumItems = buildAlbumItems(albumRecords, trackRecords.length).map(
		(album) => ({
			...album,
			...(isIndexPage
				? {}
				: {
						href: album.id === "all" ? "/" : `/?album=${album.id}`,
					}),
		}),
	);

	const sidebarProps = {
		albumItems,
		activeAlbum: isIndexPage ? activeAlbum : undefined,
		onSelectAlbum: goToAlbum,
		isAdmin,
		onDeleteAlbum: handleDeleteAlbum,
		onEditAlbum: handleEditAlbum,
		onCreateAlbum: openCreateAlbum,
		isSignedIn,
		authLoading,
		avatarUrl,
		avatarError: profileEditing.avatarError,
		nickname,
		authEmail,
		onOpenAvatarModal: () => profileEditing.setAvatarModalOpen(true),
		onOpenNicknameEditor: profileEditing.openNicknameEditor,
		onOpenLogin: openLoginDialog,
		onLogout: handleLogout,
		themePreference: preference,
		onCycleTheme: cycleThemeMode,
		onOpenAlbumsNote: () => setAlbumsNoteOpen(true),
	};

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{isDesktop ? (
					<AppSidebar {...sidebarProps} />
				) : (
					<>
						<AppBar
							position="sticky"
							color="default"
							elevation={0}
							sx={{ top: 0 }}
						>
							<Toolbar sx={{ gap: 1.5 }}>
								<IconButton
									edge="start"
									aria-label="Открыть меню"
									onClick={() => setMobileOpen(true)}
								>
									<FiMenu size={22} />
								</IconButton>
								<Typography sx={{ fontWeight: 800 }} noWrap>
									НейроСэм
								</Typography>
							</Toolbar>
						</AppBar>
						<Drawer
							anchor="left"
							open={mobileOpen}
							onClose={() => setMobileOpen(false)}
							ModalProps={{ keepMounted: true }}
							sx={{ zIndex: 1400 }}
							slotProps={{
								paper: { sx: { width: "100%" } },
							}}
						>
							<AppSidebar
								{...sidebarProps}
								onClose={() => setMobileOpen(false)}
							/>
						</Drawer>
					</>
				)}

				<LoginDialog
					open={authDialog.loginOpen}
					onClose={() => setLoginOpen(false)}
					authMode={authDialog.authMode}
					onToggleAuthMode={toggleAuthMode}
					login={authDialog.login}
					onLoginChange={setLogin}
					password={authDialog.password}
					onPasswordChange={setPassword}
					authNotice={authDialog.authNotice}
					authError={authDialog.authError}
					authSubmitting={authDialog.authSubmitting}
					onSubmit={handleAuthSubmit}
				/>

				<NicknameDialog
					open={profileEditing.nicknameModalOpen}
					onClose={() => profileEditing.setNicknameModalOpen(false)}
					nicknameInput={profileEditing.nicknameInput}
					onNicknameInputChange={profileEditing.setNicknameInput}
					nicknameError={profileEditing.nicknameError}
					onSubmit={profileEditing.handleNicknameSubmit}
				/>

				<AlbumFormDialog
					open={Boolean(editAlbumId)}
					onClose={() => setEditAlbumId(null)}
					title={editAlbumTitle}
					onTitleChange={setEditAlbumTitle}
					description={editAlbumDescription}
					onDescriptionChange={setEditAlbumDescription}
					onSubmit={handleSaveAlbum}
				/>

				<AlbumFormDialog
					open={createAlbumOpen}
					onClose={() => setCreateAlbumOpen(false)}
					heading="Новый альбом"
					submitLabel="Создать"
					submitIcon={<FiFolderPlus />}
					error={newAlbumError}
					title={newAlbumTitle}
					onTitleChange={setNewAlbumTitle}
					description={newAlbumDescription}
					onDescriptionChange={setNewAlbumDescription}
					onSubmit={handleCreateAlbum}
				/>

				<AvatarCropDialog
					open={profileEditing.avatarModalOpen}
					onClose={() => profileEditing.setAvatarModalOpen(false)}
					onSave={profileEditing.saveAvatarBlob}
				/>

				<AlbumsNoteDialog
					open={albumsNoteOpen}
					onClose={() => setAlbumsNoteOpen(false)}
					isAdmin={isAdmin}
					note={albumsNote}
					onSave={saveAlbumsNote}
				/>
			</ThemeProvider>
		</CacheProvider>
	);
}
