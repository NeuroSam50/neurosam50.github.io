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
import { FiSave } from "react-icons/fi";

type Props = {
	open: boolean;
	onClose: () => void;
	heading?: string;
	submitLabel?: string;
	submitIcon?: React.ReactNode;
	error?: string;
	title: string;
	onTitleChange: (value: string) => void;
	description: string;
	onDescriptionChange: (value: string) => void;
	onSubmit: () => void;
};

export default function AlbumFormDialog({
	open,
	onClose,
	heading = "Изменить подборку",
	submitLabel = "Сохранить",
	submitIcon = <FiSave />,
	error,
	title,
	onTitleChange,
	description,
	onDescriptionChange,
	onSubmit,
}: Props) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>{heading}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ pt: 1 }}>
					{error && <Alert severity="error">{error}</Alert>}
					<TextField
						label="Название"
						value={title}
						onChange={(event) => onTitleChange(event.target.value)}
						fullWidth
						autoFocus
					/>
					<TextField
						label="Описание"
						value={description}
						onChange={(event) =>
							onDescriptionChange(event.target.value)
						}
						fullWidth
						multiline
						minRows={2}
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Отмена</Button>
				<Button
					variant="contained"
					startIcon={submitIcon}
					onClick={onSubmit}
				>
					{submitLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
