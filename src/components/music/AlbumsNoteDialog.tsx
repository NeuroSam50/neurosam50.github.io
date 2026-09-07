import { useEffect, useState } from "react";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Typography,
} from "@mui/material";
import { FiSave } from "react-icons/fi";

type Props = {
	open: boolean;
	onClose: () => void;
	isAdmin: boolean;
	note: string;
	onSave: (body: string) => Promise<boolean> | boolean;
};

export default function AlbumsNoteDialog({
	open,
	onClose,
	isAdmin,
	note,
	onSave,
}: Props) {
	const [draft, setDraft] = useState(note);

	useEffect(() => {
		if (open) {
			setDraft(note);
		}
	}, [open, note]);

	async function handleSave() {
		const saved = await onSave(draft);
		if (saved) {
			onClose();
		}
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle>Коротко</DialogTitle>
			<DialogContent>
				{isAdmin ? (
					<TextField
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						fullWidth
						multiline
						minRows={4}
						autoFocus
						sx={{ mt: 1 }}
					/>
				) : (
					<Typography
						color={note ? "text.primary" : "text.secondary"}
						sx={{ whiteSpace: "pre-wrap", mt: 1 }}
					>
						{note || "Пока ничего не написано."}
					</Typography>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Закрыть</Button>
				{isAdmin && (
					<Button
						variant="contained"
						startIcon={<FiSave />}
						onClick={handleSave}
					>
						Сохранить
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
