import { useMemo, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	Chip,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import {
	FiMessageSquare,
	FiMoreVertical,
	FiSearch,
	FiShield,
	FiUserCheck,
} from "react-icons/fi";
import type { AdminUserRow } from "../../types/admin";
import VirtualList from "../shared/VirtualList";

type Props = {
	userRecords: AdminUserRow[];
	onSetUserBanned: (userId: string, banned: boolean) => void;
	onDeleteAllComments: (userId: string) => void;
};

type UserRowProps = {
	user: AdminUserRow;
	onSetUserBanned: (userId: string, banned: boolean) => void;
	onDeleteAllComments: (userId: string) => void;
};

function UserRow({ user, onSetUserBanned, onDeleteAllComments }: UserRowProps) {
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const closeMenu = () => setMenuAnchor(null);

	return (
		<Stack
			direction="row"
			spacing={1.5}
			sx={{
				alignItems: "center",
				py: 0.75,
				borderBottom: "1px solid",
				borderColor: "divider",
			}}
		>
			<Avatar
				src={user.avatar_url || undefined}
				sx={{
					width: 40,
					height: 40,
					flexShrink: 0,
				}}
			>
				{user.nickname.charAt(0).toUpperCase()}
			</Avatar>
			<Box sx={{ minWidth: 0, flex: 1 }}>
				<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
					{user.nickname}
				</Typography>
				<Typography variant="caption" color="text.secondary" noWrap>
					{user.email || "Почта неизвестна"}
				</Typography>
			</Box>
			{user.banned && (
				<Chip
					size="small"
					color="error"
					label="Заблокирован"
					sx={{ flexShrink: 0 }}
				/>
			)}
			<IconButton
				aria-label={`Действия с пользователем «${user.nickname}»`}
				onClick={(event) => setMenuAnchor(event.currentTarget)}
				sx={{ flexShrink: 0 }}
			>
				<FiMoreVertical size={20} />
			</IconButton>
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={closeMenu}
			>
				<MenuItem
					onClick={() => {
						closeMenu();
						onDeleteAllComments(user.user_id);
					}}
				>
					<ListItemIcon>
						<FiMessageSquare size={18} />
					</ListItemIcon>
					<ListItemText>Удалить сообщения</ListItemText>
				</MenuItem>
				<MenuItem
					onClick={() => {
						closeMenu();
						onSetUserBanned(user.user_id, !user.banned);
					}}
				>
					<ListItemIcon>
						{user.banned ? (
							<FiUserCheck size={18} />
						) : (
							<FiShield size={18} />
						)}
					</ListItemIcon>
					<ListItemText>
						{user.banned ? "Разблокировать" : "Заблокировать"}
					</ListItemText>
				</MenuItem>
			</Menu>
		</Stack>
	);
}

export default function UserRecordsCard({
	userRecords,
	onSetUserBanned,
	onDeleteAllComments,
}: Props) {
	const [search, setSearch] = useState("");

	const filteredUsers = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) {
			return userRecords;
		}
		return userRecords.filter((user) =>
			`${user.nickname} ${user.email || ""}`
				.toLowerCase()
				.includes(query),
		);
	}, [userRecords, search]);

	return (
		<Card>
			<CardContent>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						Пользователи
					</Typography>
					<TextField
						size="small"
						fullWidth
						placeholder="Поиск по нику или почте..."
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						slotProps={{
							input: {
								startAdornment: (
									<FiSearch
										size={18}
										style={{
											marginRight: 8,
											flexShrink: 0,
											opacity: 0.6,
										}}
									/>
								),
							},
						}}
					/>
					{filteredUsers.length === 0 ? (
						<Typography color="text.secondary" variant="body2">
							Ничего не найдено
						</Typography>
					) : (
						<VirtualList
							items={filteredUsers}
							getKey={(user) => user.user_id}
							estimateSize={64}
							renderItem={(user) => (
								<UserRow
									user={user}
									onSetUserBanned={onSetUserBanned}
									onDeleteAllComments={onDeleteAllComments}
								/>
							)}
						/>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
}
