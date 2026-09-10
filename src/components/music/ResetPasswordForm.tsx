import { useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Container,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { FiCheck } from "react-icons/fi";
import { supabase, hasSupabaseConfig } from "../../lib/supabase";

export default function ResetPasswordForm() {
	const [ready, setReady] = useState(false);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [done, setDone] = useState(false);
	const [linkInvalid, setLinkInvalid] = useState(false);

	useEffect(() => {
		if (!supabase) {
			return;
		}

		supabase.auth.getSession().then(({ data }) => {
			if (data.session) {
				setReady(true);
			}
		});

		const { data: subscription } = supabase.auth.onAuthStateChange(
			(event) => {
				if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
					setReady(true);
				}
			},
		);

		const timeout = setTimeout(() => {
			setReady((current) => {
				if (!current) {
					setLinkInvalid(true);
				}
				return current;
			});
		}, 6000);

		return () => {
			subscription.subscription.unsubscribe();
			clearTimeout(timeout);
		};
	}, []);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError("");

		if (!supabase) {
			setError("Смена пароля временно недоступна. Попробуйте позже.");
			return;
		}

		if (password.length < 6) {
			setError("Пароль слишком короткий - минимум 6 символов.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Пароли не совпадают.");
			return;
		}

		setSubmitting(true);
		try {
			const { error: updateError } = await supabase.auth.updateUser({
				password,
			});

			if (updateError) {
				setError("Не удалось сменить пароль. Ссылка могла устареть.");
				return;
			}

			setDone(true);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Container maxWidth="xs" sx={{ py: 6 }}>
			<Paper sx={{ p: 3 }} elevation={0} variant="outlined">
				<Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
					Смена пароля
				</Typography>

				{!hasSupabaseConfig ? (
					<Alert severity="warning">
						Смена пароля временно недоступна. Попробуйте позже.
					</Alert>
				) : done ? (
					<Alert severity="success" icon={<FiCheck />}>
						Пароль успешно изменён. Теперь вы можете войти с новым
						паролем.
					</Alert>
				) : linkInvalid ? (
					<Alert severity="error">
						Ссылка недействительна или устарела. Запросите новое
						письмо для смены пароля.
					</Alert>
				) : !ready ? (
					<Stack sx={{ alignItems: "center", py: 2 }}>
						<CircularProgress size={24} />
						<Typography
							variant="body2"
							sx={{ mt: 2, opacity: 0.7 }}
						>
							Проверяем ссылку из письма...
						</Typography>
					</Stack>
				) : (
					<Box component="form" onSubmit={handleSubmit}>
						<Stack spacing={2}>
							<TextField
								label="Новый пароль"
								type="password"
								value={password}
								onChange={(event) =>
									setPassword(event.target.value)
								}
								autoComplete="new-password"
								disabled={submitting}
								fullWidth
							/>
							<TextField
								label="Повторите пароль"
								type="password"
								value={confirmPassword}
								onChange={(event) =>
									setConfirmPassword(event.target.value)
								}
								autoComplete="new-password"
								disabled={submitting}
								fullWidth
							/>
							{error && <Alert severity="error">{error}</Alert>}
							<Button
								type="submit"
								variant="contained"
								disabled={
									submitting ||
									!password ||
									!confirmPassword
								}
								startIcon={
									submitting ? (
										<CircularProgress
											size={16}
											sx={{ color: "inherit" }}
										/>
									) : undefined
								}
							>
								Сохранить пароль
							</Button>
						</Stack>
					</Box>
				)}
			</Paper>
		</Container>
	);
}
