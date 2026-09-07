import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from "@mui/material";
import { FiLogIn, FiUserCheck } from "react-icons/fi";
import { hasSupabaseConfig } from "../../lib/supabase";

type Props = {
	open: boolean;
	onClose: () => void;
	authMode: "login" | "signup";
	onToggleAuthMode: () => void;
	login: string;
	onLoginChange: (value: string) => void;
	password: string;
	onPasswordChange: (value: string) => void;
	authNotice: string;
	authError: string;
	authSubmitting: boolean;
	onSubmit: () => void;
};

export default function LoginDialog({
	open,
	onClose,
	authMode,
	onToggleAuthMode,
	login,
	onLoginChange,
	password,
	onPasswordChange,
	authNotice,
	authError,
	authSubmitting,
	onSubmit,
}: Props) {
	const canSubmit =
		hasSupabaseConfig &&
		!authSubmitting &&
		login.trim() !== "" &&
		password !== "";

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					if (canSubmit) {
						onSubmit();
					}
				}}
			>
				<DialogTitle>
					{authMode === "login" ? "Вход по почте" : "Регистрация"}
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 1 }}>
						{!hasSupabaseConfig && (
							<Alert severity="warning">
								Вход временно недоступен. Попробуйте позже.
							</Alert>
						)}
						<TextField
							label="Почта"
							type="email"
							value={login}
							onChange={(event) =>
								onLoginChange(event.target.value)
							}
							autoComplete="username"
							disabled={authSubmitting}
							fullWidth
						/>
						<TextField
							label="Пароль"
							type="password"
							value={password}
							onChange={(event) =>
								onPasswordChange(event.target.value)
							}
							autoComplete={
								authMode === "login"
									? "current-password"
									: "new-password"
							}
							disabled={authSubmitting}
							fullWidth
						/>
						{authNotice && (
							<Alert severity="success">{authNotice}</Alert>
						)}
						{authError && (
							<Alert severity="error">{authError}</Alert>
						)}
						<Button
							variant="text"
							size="small"
							type="button"
							sx={{ alignSelf: "flex-start" }}
							onClick={onToggleAuthMode}
							disabled={authSubmitting}
						>
							{authMode === "login"
								? "Нет аккаунта? Зарегистрироваться"
								: "Уже есть аккаунт? Войти"}
						</Button>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						type="button"
						onClick={onClose}
						disabled={authSubmitting}
					>
						Отмена
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={!canSubmit}
						startIcon={
							authSubmitting ? (
								<CircularProgress
									size={16}
									sx={{ color: "inherit" }}
								/>
							) : authMode === "login" ? (
								<FiLogIn />
							) : (
								<FiUserCheck />
							)
						}
					>
						{authMode === "login" ? "Войти" : "Зарегистрироваться"}
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
}
