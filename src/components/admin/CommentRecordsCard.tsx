import { useMemo, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	IconButton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { FiExternalLink, FiSearch, FiTrash2 } from "react-icons/fi";
import type { AdminCommentRow } from "../../types/admin";
import VirtualList from "../shared/VirtualList";

type Props = {
	commentRecords: AdminCommentRow[];
	onDeleteComment: (commentId: string) => void;
};

export default function CommentRecordsCard({
	commentRecords,
	onDeleteComment,
}: Props) {
	const [search, setSearch] = useState("");

	const filteredComments = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) {
			return commentRecords;
		}
		return commentRecords.filter((comment) =>
			`${comment.nickname} ${comment.body} ${comment.track_title}`
				.toLowerCase()
				.includes(query),
		);
	}, [commentRecords, search]);

	return (
		<Card>
			<CardContent>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						Все сообщения ({commentRecords.length})
					</Typography>
					<TextField
						size="small"
						fullWidth
						placeholder="Поиск по нику, тексту или треку..."
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
					{filteredComments.length === 0 ? (
						<Typography color="text.secondary" variant="body2">
							Ничего не найдено
						</Typography>
					) : (
						<VirtualList
							items={filteredComments}
							getKey={(comment) => comment.id}
							estimateSize={110}
							renderItem={(comment) => (
								<Stack
									direction="row"
									spacing={1.5}
									sx={{
										alignItems: "flex-start",
										py: 1,
										borderBottom: "1px solid",
										borderColor: "divider",
									}}
								>
									<Avatar
										src={comment.avatar_url || undefined}
										sx={{
											width: 36,
											height: 36,
											flexShrink: 0,
										}}
									>
										{comment.nickname
											.charAt(0)
											.toUpperCase()}
									</Avatar>
									<Box sx={{ minWidth: 0, flex: 1 }}>
										<Stack
											direction="row"
											spacing={1}
											sx={{ alignItems: "baseline" }}
										>
											<Typography
												variant="body2"
												sx={{ fontWeight: 700 }}
												noWrap
											>
												{comment.nickname}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
												noWrap
											>
												{comment.track_title}
											</Typography>
										</Stack>
										<Typography
											variant="body2"
											sx={{ whiteSpace: "pre-wrap" }}
										>
											{comment.body}
										</Typography>
										<Typography
											variant="caption"
											color="text.secondary"
										>
											{new Date(
												comment.created_at,
											).toLocaleString("ru-RU")}
										</Typography>
									</Box>
									<Stack
										direction="row"
										spacing={0.5}
										sx={{ flexShrink: 0 }}
									>
										<IconButton
											aria-label="Перейти к сообщению"
											component="a"
											href={`/?t=${encodeURIComponent(
												comment.track_id,
											)}&c=${encodeURIComponent(comment.id)}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<FiExternalLink size={18} />
										</IconButton>
										<IconButton
											aria-label="Удалить сообщение"
											color="error"
											onClick={() =>
												onDeleteComment(comment.id)
											}
										>
											<FiTrash2 size={18} />
										</IconButton>
									</Stack>
								</Stack>
							)}
						/>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
}
