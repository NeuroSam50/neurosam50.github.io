import { useMemo, useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	List,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { FiSearch, FiShield, FiUserCheck } from "react-icons/fi";
import type { AdminUserRow } from "../../types/admin";

type Props = {
	userRecords: AdminUserRow[];
	onSetUserBanned: (userId: string, banned: boolean) => void;
};

export default function UserRecordsCard({
	userRecords,
	onSetUserBanned,
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
						<List disablePadding>
							{filteredUsers.map((user) => (
								<Stack
									key={user.user_id}
									direction="row"
									spacing={1.5}
									sx={{
										alignItems: "center",
										py: 0.75,
										borderBottom: "1px solid",
										borderColor: "divider",
										"&:last-of-type": { borderBottom: 0 },
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
										<Typography
											variant="body2"
											sx={{ fontWeight: 700 }}
											noWrap
										>
											{user.nickname}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
											noWrap
										>
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
									<Button
										size="small"
										color={
											user.banned ? "success" : "error"
										}
										variant="outlined"
										startIcon={
											user.banned ? (
												<FiUserCheck size={18} />
											) : (
												<FiShield size={18} />
											)
										}
										onClick={() =>
											onSetUserBanned(
												user.user_id,
												!user.banned,
											)
										}
										sx={{ flexShrink: 0 }}
									>
										{user.banned
											? "Разблокировать"
											: "Заблокировать"}
									</Button>
								</Stack>
							))}
						</List>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
}
