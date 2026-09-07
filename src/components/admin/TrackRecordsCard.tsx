import {
	Box,
	Button,
	Card,
	CardContent,
	IconButton,
	List,
	Stack,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { FiEdit2, FiMusic, FiTrash2 } from "react-icons/fi";
import type { AdminTrackRow } from "../../types/admin";

type Props = {
	trackRecords: AdminTrackRow[];
	editingTrackId: string;
	onEditTrack: (track: AdminTrackRow) => void;
	onDeleteTrack: (trackId: string) => void;
};

export default function TrackRecordsCard({
	trackRecords,
	editingTrackId,
	onEditTrack,
	onDeleteTrack,
}: Props) {
	if (trackRecords.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardContent>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						Загруженные треки
					</Typography>
					<List disablePadding>
						{trackRecords.map((track) => (
							<Stack
								key={track.id}
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
									variant="rounded"
									src={track.cover_path || undefined}
									alt=""
									slotProps={{
										img: {
											loading: "lazy",
											width: 44,
											height: 44,
										},
									}}
									sx={{
										width: 44,
										height: 44,
										flexShrink: 0,
										borderRadius: 0.5,
									}}
								>
									<FiMusic size={20} />
								</Avatar>
								<Box sx={{ minWidth: 0, flex: 1 }}>
									<Typography
										variant="body2"
										sx={{ fontWeight: 700 }}
										noWrap
									>
										{track.title}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										noWrap
									>
										{track.artist}
									</Typography>
								</Box>
								<Button
									size="small"
									startIcon={<FiEdit2 size={20} />}
									variant={
										editingTrackId === track.id
											? "contained"
											: "outlined"
									}
									onClick={() => onEditTrack(track)}
									sx={{ flexShrink: 0 }}
								>
									Редактировать
								</Button>
								<IconButton
									size="small"
									aria-label="Удалить трек"
									onClick={() => onDeleteTrack(track.id)}
									sx={{ flexShrink: 0 }}
								>
									<FiTrash2 size={20} />
								</IconButton>
							</Stack>
						))}
					</List>
				</Stack>
			</CardContent>
		</Card>
	);
}
