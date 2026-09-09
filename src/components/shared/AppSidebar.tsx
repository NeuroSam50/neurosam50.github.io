import { useState } from "react";
import {
	Box,
	Button,
	Divider,
	IconButton,
	List,
	ListItemButton,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	Toolbar,
	Typography,
} from "@mui/material";
import {
	FiEdit2,
	FiFolderPlus,
	FiInfo,
	FiMoreVertical,
	FiMusic,
	FiTrash2,
	FiX,
} from "react-icons/fi";

export type AlbumItem = {
	id: string;
	title: string;
	description: string;
	href?: string;
};

type Props = {
	albumItems: AlbumItem[];
	activeAlbum?: string;
	onSelectAlbum?: (albumId: string) => void;
	isAdmin: boolean;
	onDeleteAlbum?: (albumId: string) => void;
	onEditAlbum?: (albumId: string) => void;
	onCreateAlbum?: () => void;
	onOpenAlbumsNote?: () => void;
	onClose?: () => void;
};

export default function AppSidebar({
	albumItems,
	activeAlbum,
	onSelectAlbum,
	isAdmin,
	onDeleteAlbum,
	onEditAlbum,
	onCreateAlbum,
	onOpenAlbumsNote,
	onClose,
}: Props) {
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [menuAlbumId, setMenuAlbumId] = useState<string | null>(null);

	function closeMenu() {
		setMenuAnchor(null);
		setMenuAlbumId(null);
	}

	return (
		<Box
			sx={{
				height: "100%",
				bgcolor: "background.paper",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Toolbar sx={{ gap: 1.5, px: 2.5 }}>
				<FiMusic size={20} />
				<Box sx={{ flex: 1 }}>
					<Typography
						variant="subtitle1"
						sx={{ fontWeight: 800, lineHeight: 1.1 }}
					>
						НейроСэм
					</Typography>
				</Box>
				{onClose && (
					<IconButton aria-label="Закрыть меню" onClick={onClose}>
						<FiX size={20} />
					</IconButton>
				)}
			</Toolbar>
			<Divider />
			<Box sx={{ p: 2, flex: 1, overflowY: "auto" }}>
				<Stack spacing={1}>
					{onOpenAlbumsNote && (
						<Button
							variant="outlined"
							startIcon={<FiInfo />}
							fullWidth
							onClick={onOpenAlbumsNote}
						>
							Коротко
						</Button>
					)}
					<Typography
						variant="h6"
						align="center"
						sx={{ fontWeight: 800, textDecoration: "underline" }}
					>
						Подборки
					</Typography>
				</Stack>
				<List disablePadding sx={{ mt: 1 }}>
					{albumItems.map((album, index) => (
						<Box key={album.id}>
							{index > 0 && <Divider sx={{ my: 0.5 }} />}
							<Stack
								direction="row"
								sx={{ alignItems: "flex-start" }}
							>
								<ListItemButton
									{...(album.href
										? { component: "a", href: album.href }
										: {
												onClick: () =>
													onSelectAlbum?.(album.id),
											})}
									selected={activeAlbum === album.id}
									sx={{
										borderRadius: 1,
										alignItems: "flex-start",
										flex: 1,
										minWidth: 0,
									}}
								>
									<ListItemText
										primary={album.title}
										secondary={album.description}
										slotProps={{
											primary: {
												sx: { fontWeight: 700 },
											},
										}}
									/>
								</ListItemButton>
								{isAdmin && album.id !== "all" && (
									<IconButton
										size="small"
										aria-label={`Меню подборки «${album.title}»`}
										onClick={(event) => {
											setMenuAnchor(event.currentTarget);
											setMenuAlbumId(album.id);
										}}
										sx={{ mt: 1, flexShrink: 0 }}
									>
										<FiMoreVertical size={20} />
									</IconButton>
								)}
							</Stack>
						</Box>
					))}
				</List>
				{isAdmin && onCreateAlbum && (
					<Button
						variant="outlined"
						startIcon={<FiFolderPlus />}
						fullWidth
						onClick={onCreateAlbum}
						sx={{ mt: 1.5 }}
					>
						Новый альбом
					</Button>
				)}
			</Box>
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={closeMenu}
			>
				<MenuItem
					onClick={() => {
						const albumId = menuAlbumId;
						closeMenu();
						if (albumId) {
							onEditAlbum?.(albumId);
						}
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", mr: 1.25 }}
					>
						<FiEdit2 size={20} />
					</Box>
					Изменить
				</MenuItem>
				<MenuItem
					onClick={() => {
						const albumId = menuAlbumId;
						closeMenu();
						if (albumId) {
							onDeleteAlbum?.(albumId);
						}
					}}
				>
					<Box
						sx={{ display: "flex", alignItems: "center", mr: 1.25 }}
					>
						<FiTrash2 size={20} />
					</Box>
					Удалить
				</MenuItem>
			</Menu>
		</Box>
	);
}
