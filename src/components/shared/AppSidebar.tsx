import { useState, type ReactNode } from "react";
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
	FiMenu,
	FiMoreVertical,
	FiMusic,
	FiShield,
	FiTrash2,
	FiX,
} from "react-icons/fi";
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
import {
	restrictToParentElement,
	restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

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
	onReorderAlbums?: (albumIds: string[]) => void;
};

type SortableAlbumRowProps = {
	albumId: string;
	dragEnabled: boolean;
	children: (dragHandle: ReactNode) => ReactNode;
};

function SortableAlbumRow({
	albumId,
	dragEnabled,
	children,
}: SortableAlbumRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: albumId, disabled: !dragEnabled });

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
				mt: 1,
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
	onReorderAlbums,
}: Props) {
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [menuAlbumId, setMenuAlbumId] = useState<string | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	);
	const dragEnabled = isAdmin && Boolean(onReorderAlbums);
	const sortableIds = albumItems
		.filter((album) => album.id !== "all")
		.map((album) => album.id);

	function closeMenu() {
		setMenuAnchor(null);
		setMenuAlbumId(null);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			return;
		}
		const oldIndex = sortableIds.indexOf(String(active.id));
		const newIndex = sortableIds.indexOf(String(over.id));
		if (oldIndex === -1 || newIndex === -1) {
			return;
		}
		onReorderAlbums?.(arrayMove(sortableIds, oldIndex, newIndex));
	}

	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Toolbar
				sx={{
					gap: 1.5,
					px: 2.5,
					background: "url(/assets/multicam.webp)",
					backgroundSize: "cover",
					backgroundPosition: "center",
					color: "#fff",
				}}
			>
				<FiMusic size={20} />
				<Box
					component="a"
					href="/"
					sx={{
						flex: 1,
						color: "inherit",
						textDecoration: "none",
						cursor: "pointer",
					}}
				>
					<Typography
						variant="subtitle1"
						sx={{ fontWeight: 800, lineHeight: 1.1, color: "#fff" }}
					>
						НейроСэм
					</Typography>
				</Box>
				{onClose && (
					<IconButton
						aria-label="Закрыть меню"
						onClick={onClose}
						sx={{ color: "#fff" }}
					>
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
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					modifiers={[
						restrictToVerticalAxis,
						restrictToParentElement,
					]}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={sortableIds}
						strategy={verticalListSortingStrategy}
					>
						<List disablePadding sx={{ mt: 1 }}>
							{albumItems.map((album, index) => {
								const row = (dragHandle: ReactNode) => (
									<Box key={album.id}>
										{index > 0 && (
											<Divider sx={{ my: 0.5 }} />
										)}
										<Stack
											direction="row"
											sx={{ alignItems: "flex-start" }}
										>
											{dragHandle}
											<ListItemButton
												{...(album.href
													? {
															component: "a",
															href: album.href,
															onClick: onClose,
														}
													: {
															onClick: () =>
																onSelectAlbum?.(
																	album.id,
																),
														})}
												selected={
													activeAlbum === album.id
												}
												sx={{
													borderRadius: 1,
													alignItems: "flex-start",
													flex: 1,
													minWidth: 0,
												}}
											>
												<ListItemText
													primary={album.title}
													secondary={
														album.description
													}
													slotProps={{
														primary: {
															sx: {
																fontWeight: 700,
															},
														},
													}}
												/>
											</ListItemButton>
											{isAdmin && album.id !== "all" && (
												<IconButton
													size="small"
													aria-label={`Меню подборки «${album.title}»`}
													onClick={(event) => {
														setMenuAnchor(
															event.currentTarget,
														);
														setMenuAlbumId(
															album.id,
														);
													}}
													sx={{
														mt: 1,
														flexShrink: 0,
													}}
												>
													<FiMoreVertical size={20} />
												</IconButton>
											)}
										</Stack>
									</Box>
								);

								return album.id === "all" ? (
									row(null)
								) : (
									<SortableAlbumRow
										key={album.id}
										albumId={album.id}
										dragEnabled={dragEnabled}
									>
										{row}
									</SortableAlbumRow>
								);
							})}
						</List>
					</SortableContext>
				</DndContext>
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
			{isAdmin && (
				<>
					<Divider />
					<Box sx={{ p: 1 }}>
						<Button
							component="a"
							href="/admin/panel"
							onClick={onClose}
							variant="outlined"
							startIcon={<FiShield size={20} />}
							fullWidth
						>
							Админ-панель
						</Button>
					</Box>
				</>
			)}
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
