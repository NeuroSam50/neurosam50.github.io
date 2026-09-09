import {
	Alert,
	Box,
	Button,
	IconButton,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { useState } from "react";
import {
	FiCheck,
	FiEdit2,
	FiLogIn,
	FiSend,
	FiShield,
	FiThumbsDown,
	FiThumbsUp,
	FiTrash2,
	FiX,
} from "react-icons/fi";
import { TbPin, TbPinFilled } from "react-icons/tb";
import type { Comment } from "../../types/music";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatCommentDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

type Props = {
	comments: Comment[];
	loading: boolean;
	isSignedIn: boolean;
	isAdmin: boolean;
	authUserId: string;
	myCommentVotes: Record<string, "up" | "down">;
	draft: string;
	error: string;
	submitting: boolean;
	onDraftChange: (value: string) => void;
	onSubmit: () => void;
	onVote: (commentId: string, direction: "up" | "down") => void;
	onEdit: (commentId: string, body: string) => void;
	onDelete: (commentId: string) => void;
	onTogglePin: (commentId: string) => void;
	onRequireAuth: () => void;
};

export default function CommentThread({
	comments,
	loading,
	isSignedIn,
	isAdmin,
	authUserId,
	myCommentVotes,
	draft,
	error,
	submitting,
	onDraftChange,
	onSubmit,
	onVote,
	onEdit,
	onDelete,
	onTogglePin,
	onRequireAuth,
}: Props) {
	const [editingId, setEditingId] = useState("");
	const [editDraft, setEditDraft] = useState("");

	function startEditing(commentId: string, body: string) {
		setEditingId(commentId);
		setEditDraft(body);
	}

	function cancelEditing() {
		setEditingId("");
		setEditDraft("");
	}

	function confirmEditing(commentId: string) {
		if (editDraft.trim()) {
			onEdit(commentId, editDraft.trim());
		}
		cancelEditing();
	}

	return (
		<Stack spacing={1.5} sx={{ minWidth: 0, height: "100%" }}>
			{loading ? (
				<Typography variant="body2" color="text.secondary">
					Загрузка комментариев...
				</Typography>
			) : (
				<Stack
					spacing={1.5}
					sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}
				>
					{comments.length === 0 && (
						<Typography variant="body2" color="text.secondary">
							Комментариев пока нет.
						</Typography>
					)}
					{comments.map((comment) => (
						<Stack key={comment.id} direction="row" spacing={1.5}>
							<Avatar
								src={comment.avatarUrl || undefined}
								sx={{ width: 32, height: 32, flexShrink: 0 }}
							>
								{comment.nickname.charAt(0).toUpperCase()}
							</Avatar>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Stack
									direction="row"
									spacing={0.5}
									sx={{
										alignItems: "center",
										flexWrap: "wrap",
									}}
								>
									<Typography
										variant="body2"
										sx={{ fontWeight: 700 }}
									>
										{comment.nickname}
									</Typography>
									{comment.isPinned && (
										<Tooltip title="Закреплено">
											<Box
												component={TbPinFilled}
												sx={{
													fontSize: 16,
													color: "primary.main",
												}}
											/>
										</Tooltip>
									)}
									{comment.isAdmin && (
										<Tooltip title="Администратор">
											<Box
												component={FiShield}
												sx={{
													fontSize: 16,
													color: "primary.main",
												}}
											/>
										</Tooltip>
									)}
									<Typography
										variant="caption"
										color="text.secondary"
										component="time"
										dateTime={comment.createdAt}
									>
										{formatCommentDate(comment.createdAt)}
									</Typography>
									{comment.editedAt && (
										<Typography
											variant="caption"
											color="text.secondary"
										>
											(изменено)
										</Typography>
									)}
								</Stack>
								{editingId === comment.id ? (
									<Stack
										direction="row"
										spacing={1}
										sx={{ alignItems: "flex-start", mt: 0.5 }}
									>
										<TextField
											value={editDraft}
											onChange={(event) =>
												setEditDraft(event.target.value)
											}
											onKeyDown={(event) => {
												if (
													event.key === "Enter" &&
													!event.shiftKey
												) {
													event.preventDefault();
													confirmEditing(comment.id);
												}
												if (event.key === "Escape") {
													cancelEditing();
												}
											}}
											size="small"
											fullWidth
											multiline
											maxRows={4}
											autoFocus
										/>
										<IconButton
											size="small"
											aria-label="Сохранить изменения"
											color="primary"
											disabled={!editDraft.trim()}
											onClick={() =>
												confirmEditing(comment.id)
											}
										>
											<FiCheck size={15} />
										</IconButton>
										<IconButton
											size="small"
											aria-label="Отменить редактирование"
											onClick={cancelEditing}
										>
											<FiX size={15} />
										</IconButton>
									</Stack>
								) : (
									<Typography
										variant="body2"
										sx={{
											whiteSpace: "pre-wrap",
											overflowWrap: "anywhere",
											wordBreak: "break-word",
											color: "text.primary",
										}}
									>
										{comment.body}
									</Typography>
								)}
								<Stack
									direction="row"
									spacing={0.5}
									sx={{ alignItems: "center", mt: 0.5 }}
								>
									<IconButton
										size="small"
										aria-label="Лайк комментария"
										color={
											myCommentVotes[comment.id] === "up"
												? "primary"
												: "default"
										}
										onClick={() => onVote(comment.id, "up")}
									>
										<FiThumbsUp size={15} />
									</IconButton>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										{comment.upCount}
									</Typography>
									<IconButton
										size="small"
										aria-label="Дизлайк комментария"
										color={
											myCommentVotes[comment.id] ===
											"down"
												? "error"
												: "default"
										}
										onClick={() =>
											onVote(comment.id, "down")
										}
									>
										<FiThumbsDown size={15} />
									</IconButton>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										{comment.downCount}
									</Typography>
									{isAdmin && (
										<Tooltip
											title={
												comment.isPinned
													? "Открепить"
													: "Закрепить"
											}
										>
											<IconButton
												size="small"
												aria-label="Закрепить комментарий"
												color={
													comment.isPinned
														? "primary"
														: "default"
												}
												onClick={() =>
													onTogglePin(comment.id)
												}
											>
												{comment.isPinned ? (
													<TbPinFilled size={15} />
												) : (
													<TbPin size={15} />
												)}
											</IconButton>
										</Tooltip>
									)}
									{comment.userId === authUserId &&
										editingId !== comment.id && (
											<IconButton
												size="small"
												aria-label="Редактировать комментарий"
												onClick={() =>
													startEditing(
														comment.id,
														comment.body,
													)
												}
											>
												<FiEdit2 size={15} />
											</IconButton>
										)}
									{(isAdmin ||
										comment.userId === authUserId) && (
										<IconButton
											size="small"
											aria-label="Удалить комментарий"
											onClick={() => onDelete(comment.id)}
										>
											<FiTrash2 size={15} />
										</IconButton>
									)}
								</Stack>
							</Box>
						</Stack>
					))}
				</Stack>
			)}

			{isSignedIn ? (
				<Stack
					direction="row"
					spacing={1}
					sx={{ alignItems: "flex-start" }}
				>
					<TextField
						value={draft}
						onChange={(event) => onDraftChange(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								onSubmit();
							}
						}}
						placeholder="Написать комментарий..."
						size="small"
						fullWidth
						multiline
						maxRows={4}
						disabled={submitting}
					/>
					<IconButton
						color="primary"
						aria-label="Отправить комментарий"
						disabled={submitting || !draft.trim()}
						onClick={onSubmit}
					>
						<FiSend size={20} />
					</IconButton>
				</Stack>
			) : (
				<Button
					variant="text"
					size="small"
					startIcon={<FiLogIn size={20} />}
					onClick={onRequireAuth}
					sx={{ alignSelf: "flex-start" }}
				>
					Войдите, чтобы оставить комментарий
				</Button>
			)}
			{error && <Alert severity="error">{error}</Alert>}
		</Stack>
	);
}
