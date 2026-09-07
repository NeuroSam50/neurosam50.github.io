import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from "@mui/material";
import { FiEdit2 } from "react-icons/fi";

type Props = {
	open: boolean;
	onClose: () => void;
	nicknameInput: string;
	onNicknameInputChange: (value: string) => void;
	nicknameError: string;
	onSubmit: () => void;
};

export default function NicknameDialog({
	open,
	onClose,
	nicknameInput,
	onNicknameInputChange,
	nicknameError,
	onSubmit,
}: Props) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>Смена никнейма</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ pt: 1 }}>
					<TextField
						label="Никнейм"
						value={nicknameInput}
						onChange={(event) =>
							onNicknameInputChange(event.target.value)
						}
						fullWidth
						autoFocus
					/>
					{nicknameError && (
						<Alert severity="error">{nicknameError}</Alert>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Отмена</Button>
				<Button
					variant="contained"
					startIcon={<FiEdit2 />}
					onClick={onSubmit}
				>
					Сохранить
				</Button>
			</DialogActions>
		</Dialog>
	);
}
