import { useEffect, useMemo, useState } from "react";
import { CacheProvider } from "@emotion/react";
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Snackbar,
	ThemeProvider,
} from "@mui/material";
import { createAppTheme, useColorMode } from "../../lib/theme";
import { createEmotionCache } from "../../lib/emotionCache";
import { dismissNotice, resolveConfirm, useUiState } from "../../lib/uiStore";

export default function UiFeedback() {
	const { effectiveMode } = useColorMode();
	const theme = useMemo(() => createAppTheme(effectiveMode), [effectiveMode]);
	const [emotionCache, setEmotionCache] = useState(() =>
		createEmotionCache(),
	);
	const { notice, confirmRequest } = useUiState();

	useEffect(() => {
		function handleAfterSwap() {
			setEmotionCache(createEmotionCache());
		}
		document.addEventListener("astro:after-swap", handleAfterSwap);
		return () =>
			document.removeEventListener("astro:after-swap", handleAfterSwap);
	}, []);

	return (
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<Snackbar
					key={notice?.id}
					open={Boolean(notice)}
					autoHideDuration={5000}
					onClose={dismissNotice}
					anchorOrigin={{ vertical: "top", horizontal: "center" }}
					sx={{ zIndex: 2200 }}
				>
					<Alert
						severity={notice?.severity || "info"}
						variant="filled"
						onClose={dismissNotice}
						sx={{ width: "100%" }}
					>
						{notice?.message}
					</Alert>
				</Snackbar>

				<Dialog
					open={Boolean(confirmRequest)}
					onClose={() => resolveConfirm(false)}
					maxWidth="xs"
					fullWidth
				>
					<DialogTitle>{confirmRequest?.title}</DialogTitle>
					{confirmRequest?.body && (
						<DialogContent>
							<DialogContentText>
								{confirmRequest.body}
							</DialogContentText>
						</DialogContent>
					)}
					<DialogActions>
						<Button onClick={() => resolveConfirm(false)}>
							Отмена
						</Button>
						<Button
							onClick={() => resolveConfirm(true)}
							color={
								confirmRequest?.destructive
									? "error"
									: "primary"
							}
							variant="contained"
							autoFocus
						>
							{confirmRequest?.confirmLabel}
						</Button>
					</DialogActions>
				</Dialog>
			</ThemeProvider>
		</CacheProvider>
	);
}
