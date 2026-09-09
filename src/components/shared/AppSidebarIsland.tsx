import { useEffect, useMemo, useState } from "react";
import { navigate } from "astro:transitions/client";
import { CacheProvider } from "@emotion/react";
import {
	CssBaseline,
	Drawer,
	ThemeProvider,
	useMediaQuery,
} from "@mui/material";
import { FiFolderPlus } from "react-icons/fi";
import { createAppTheme, useColorMode } from "../../lib/theme";
import { createEmotionCache } from "../../lib/emotionCache";
import { useAuthState } from "../../lib/authStore";
import { closeMobileNav, useMobileNavOpen } from "../../lib/mobileNavStore";
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
import { useAlbumsNote } from "../../hooks/music/useAlbumsNote";
import AppSidebar from "./AppSidebar";
import AlbumFormDialog from "../music/AlbumFormDialog";
import AlbumsNoteDialog from "../music/AlbumsNoteDialog";

function readPathname() {
	return typeof window !== "undefined" ? window.location.pathname : "/";
}

export default function AppSidebarIsland() {
	const { effectiveMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const isDesktop = useMediaQuery(theme.breakpoints.up("md"), {
		defaultMatches: true,
	});
	const [emotionCache, setEmotionCache] = useState(() =>
		createEmotionCache(),
	);
	const [pathname, setPathname] = useState(readPathname);
	const activeAlbum = useActiveAlbum();
	const mobileOpen = useMobileNavOpen();

	useEffect(() => {
		function handleAfterSwap() {
			setEmotionCache(createEmotionCache());
			setPathname(readPathname());
			syncActiveAlbumFromUrl();
			closeMobileNav();
		}
		document.addEventListener("astro:after-swap", handleAfterSwap);
		return () =>
			document.removeEventListener("astro:after-swap", handleAfterSwap);
	}, []);

	const { authEmail, isAdminUser } = useAuthState();
	const isSignedIn = Boolean(authEmail);
	const isAdmin = isSignedIn && isAdminUser;

	const { albumRecords, trackRecords } = useCatalogState();
	const { albumsNote, saveAlbumsNote } = useAlbumsNote();
	const [albumsNoteOpen, setAlbumsNoteOpen] = useState(false);
	const [editAlbumId, setEditAlbumId] = useState<string | null>(null);
	const [editAlbumTitle, setEditAlbumTitle] = useState("");
	const [editAlbumDescription, setEditAlbumDescription] = useState("");
	const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
	const [newAlbumTitle, setNewAlbumTitle] = useState("");
	const [newAlbumDescription, setNewAlbumDescription] = useState("");
	const [newAlbumError, setNewAlbumError] = useState("");

	const isIndexPage = pathname === "/";

	function goToAlbum(albumId: string) {
		closeMobileNav();
		if (isIndexPage) {
			setActiveAlbum(albumId);
			const url = new URL(window.location.href);
			if (albumId === "all") {
				url.searchParams.delete("album");
			} else {
				url.searchParams.set("album", albumId);
			}
			url.searchParams.delete("t");
			window.history.replaceState({}, "", url);
			window.dispatchEvent(new PopStateEvent("popstate"));
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
		closeMobileNav();
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
		onOpenAlbumsNote: () => setAlbumsNoteOpen(true),
	};

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{isDesktop ? (
					<AppSidebar {...sidebarProps} />
				) : (
					<Drawer
						anchor="left"
						open={mobileOpen}
						onClose={() => closeMobileNav()}
						ModalProps={{ keepMounted: true }}
						sx={{ zIndex: 1400 }}
						slotProps={{
							paper: { sx: { width: "100%" } },
						}}
					>
						<AppSidebar
							{...sidebarProps}
							onClose={() => closeMobileNav()}
						/>
					</Drawer>
				)}

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
