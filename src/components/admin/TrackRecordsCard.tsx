import { useMemo, useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	IconButton,
	List,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { FiEdit2, FiMusic, FiSearch, FiTrash2 } from "react-icons/fi";
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
	const [search, setSearch] = useState("");

	const filteredTracks = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) {
			return trackRecords;
		}
		return trackRecords.filter((track) =>
			`${track.title} ${track.artist}`.toLowerCase().includes(query),
		);
	}, [trackRecords, search]);

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
					<TextField
						size="small"
						fullWidth
						placeholder="Поиск по трекам..."
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
					{filteredTracks.length === 0 ? (
						<Typography color="text.secondary" variant="body2">
							Ничего не найдено
						</Typography>
					) : (
						<List disablePadding>
							{filteredTracks.map((track) => (
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
					)}
				</Stack>
			</CardContent>
		</Card>
	);
}
