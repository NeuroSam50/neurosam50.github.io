import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	CssBaseline,
	Tab,
	Tabs,
	ThemeProvider,
	Typography,
} from "@mui/material";
import { CacheProvider } from "@emotion/react";
import { createAppTheme, useColorMode } from "../lib/theme";
import { createEmotionCache } from "../lib/emotionCache";
import { useAuthState } from "../lib/authStore";
import { useUserRecords } from "../hooks/admin/useUserRecords";
import { useAdminComments } from "../hooks/admin/useAdminComments";
import UserRecordsCard from "./admin/UserRecordsCard";
import CommentRecordsCard from "./admin/CommentRecordsCard";

export default function AdminPanel() {
	const { effectiveMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const emotionCache = useMemo(() => createEmotionCache(), []);

	const { authLoading, authUserId, isAdminUser } = useAuthState();
	const isAdmin = Boolean(authUserId) && isAdminUser;

	const [tab, setTab] = useState(0);
	const [messagesFilterUserId, setMessagesFilterUserId] = useState<
		string | null
	>(null);
	const { userRecords, loadUsers, setUserBanned } = useUserRecords();
	const {
		commentRecords,
		loadComments,
		deleteComment,
		deleteAllCommentsByUser,
	} = useAdminComments();

	useEffect(() => {
		if (!isAdmin) {
			return;
		}
		loadUsers();
		loadComments();
	}, [isAdmin]);

	async function handleDeleteAllComments(userId: string) {
		await deleteAllCommentsByUser(userId);
	}

	function handleViewMessages(userId: string) {
		setMessagesFilterUserId(userId);
		setTab(1);
	}

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
					<Box
						sx={{
							maxWidth: 1000,
							mx: "auto",
							px: { xs: 2, sm: 3 },
							py: { xs: 3, md: 5 },
						}}
					>
						{authLoading ? (
							<Typography color="text.secondary">
								Проверка доступа...
							</Typography>
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
							<>
								<Tabs
									value={tab}
									onChange={(_event, value) => setTab(value)}
									sx={{ mb: 2 }}
								>
									<Tab label="Пользователи" />
									<Tab label="Сообщения" />
								</Tabs>
								{tab === 0 && (
									<UserRecordsCard
										userRecords={userRecords.filter(
											(user) =>
												user.user_id !== authUserId,
										)}
										onSetUserBanned={setUserBanned}
										onDeleteAllComments={
											handleDeleteAllComments
										}
										onViewMessages={handleViewMessages}
									/>
								)}
								{tab === 1 && (
									<CommentRecordsCard
										commentRecords={commentRecords}
										onDeleteComment={deleteComment}
										filterUserId={messagesFilterUserId}
										onClearFilter={() =>
											setMessagesFilterUserId(null)
										}
									/>
								)}
							</>
						)}
					</Box>
				</Box>
			</ThemeProvider>
		</CacheProvider>
	);
}
