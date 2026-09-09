import { useMemo } from "react";
import { CacheProvider } from "@emotion/react";
import {
	AppBar,
	Box,
	Button,
	CssBaseline,
	IconButton,
	Skeleton,
	Stack,
	ThemeProvider,
	Toolbar,
	Typography,
} from "@mui/material";
import {
	FiArrowLeft,
	FiCamera,
	FiEdit2,
	FiLogOut,
	FiMail,
	FiMenu,
	FiMoon,
	FiMonitor,
	FiSun,
} from "react-icons/fi";
import {
	createAppTheme,
	useColorMode,
	type ThemePreference,
} from "../../lib/theme";
import { createEmotionCache } from "../../lib/emotionCache";
import {
	useAuthState,
	logout,
	setAvatarUrl,
	setNickname,
} from "../../lib/authStore";
import {
	useAuthDialogState,
	setLoginOpen,
	setLogin,
	setPassword,
	openLoginDialog,
	toggleAuthMode,
	handleAuthSubmit,
} from "../../lib/authDialogStore";
import { useProfileEditing } from "../../hooks/music/useProfileEditing";
import { usePageTitle } from "../../lib/pageTitleStore";
import { openMobileNav } from "../../lib/mobileNavStore";
import AccountCard from "./AccountCard";
import LoginDialog from "../music/LoginDialog";
import NicknameDialog from "../music/NicknameDialog";
import AvatarCropDialog from "../AvatarCropDialog";

const themeLabels: Record<ThemePreference, string> = {
	system: "Системная",
	light: "Светлая",
	dark: "Тёмная",
};

function ThemeIcon({ preference }: { preference: ThemePreference }) {
	if (preference === "light") return <FiSun size={20} />;
	if (preference === "dark") return <FiMoon size={20} />;
	return <FiMonitor size={20} />;
}

type Props = {
	title: string;
	backHref?: string;
};

export default function PageHeader({ title, backHref }: Props) {
	const { preference, effectiveMode, setMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const emotionCache = useMemo(() => createEmotionCache(), []);

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

	const authDialog = useAuthDialogState();
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

	const headerTitle = usePageTitle(title);

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<AppBar
					position="sticky"
					color="inherit"
					elevation={0}
					sx={{ borderBottom: 1, borderColor: "divider" }}
				>
					<Toolbar sx={{ gap: 1.5 }}>
						{!backHref && (
							<IconButton
								aria-label="Открыть меню"
								edge="start"
								onClick={openMobileNav}
								sx={{
									display: { xs: "inline-flex", md: "none" },
								}}
							>
								<FiMenu size={22} />
							</IconButton>
						)}
						{backHref && (
							<IconButton
								aria-label="Назад"
								href={backHref}
								edge="start"
							>
								<FiArrowLeft size={20} />
							</IconButton>
						)}
						<Typography
							variant="subtitle1"
							sx={{ fontWeight: 800, flex: 1 }}
							noWrap
						>
							{headerTitle}
						</Typography>

						{authLoading ? (
							<Stack
								direction="row"
								spacing={1.25}
								sx={{ alignItems: "center" }}
							>
								<Skeleton
									variant="circular"
									width={32}
									height={32}
								/>
								<Skeleton
									variant="text"
									width={100}
									height={20}
								/>
							</Stack>
						) : isSignedIn ? (
							<Box sx={{ maxWidth: 260 }}>
								<AccountCard
									avatarUrl={avatarUrl}
									nickname={nickname || authEmail || "Гость"}
									fallbackText={nickname || authEmail || "?"}
									roleLabel={
										isAdmin ? "Администратор" : undefined
									}
									error={profileEditing.avatarError}
									onAvatarClick={() =>
										profileEditing.setAvatarModalOpen(true)
									}
									onNameClick={
										profileEditing.openNicknameEditor
									}
									menuItems={[
										{
											key: "avatar",
											icon: <FiCamera size={20} />,
											label: "Сменить аватар",
											onClick: () =>
												profileEditing.setAvatarModalOpen(
													true,
												),
										},
										{
											key: "nickname",
											icon: <FiEdit2 size={20} />,
											label: "Сменить никнейм",
											onClick:
												profileEditing.openNicknameEditor,
										},
										{
											key: "theme",
											icon: (
												<ThemeIcon
													preference={preference}
												/>
											),
											label: `Тема: ${themeLabels[preference]}`,
											onClick: cycleThemeMode,
											dividerBefore: true,
										},
										{
											key: "logout",
											icon: <FiLogOut size={20} />,
											label: "Выйти",
											onClick: () => {
												logout();
											},
											dividerBefore: true,
										},
									]}
								/>
							</Box>
						) : (
							<Stack
								direction="row"
								spacing={0.5}
								sx={{ alignItems: "center" }}
							>
								<Button
									variant="text"
									size="small"
									onClick={openLoginDialog}
									startIcon={<FiMail size={20} />}
									sx={{
										color: "text.secondary",
										px: 0.5,
										fontWeight: 500,
									}}
								>
									Войти по почте
								</Button>
								<IconButton
									size="small"
									onClick={cycleThemeMode}
									aria-label={`Тема: ${themeLabels[preference]}. Переключить`}
									sx={{ color: "text.secondary" }}
								>
									<ThemeIcon preference={preference} />
								</IconButton>
							</Stack>
						)}
					</Toolbar>
				</AppBar>

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

				<AvatarCropDialog
					open={profileEditing.avatarModalOpen}
					onClose={() => profileEditing.setAvatarModalOpen(false)}
					onSave={profileEditing.saveAvatarBlob}
				/>
			</ThemeProvider>
		</CacheProvider>
	);
}
