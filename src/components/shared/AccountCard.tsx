import { useState, type ReactNode } from "react";
import {
	Box,
	Divider,
	IconButton,
	Menu,
	MenuItem,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { FiMoreVertical, FiShield } from "react-icons/fi";

export type AccountCardMenuItem = {
	key: string;
	icon: ReactNode;
	label: ReactNode;
	onClick: () => void;
	dividerBefore?: boolean;
};

type Props = {
	avatarUrl: string;
	nickname: string;
	fallbackText: string;
	roleLabel?: string;
	error?: string;
	onAvatarClick?: () => void;
	onNameClick?: () => void;
	menuItems?: AccountCardMenuItem[];
};

export default function AccountCard({
	avatarUrl,
	nickname,
	fallbackText,
	roleLabel,
	error,
	onAvatarClick,
	onNameClick,
	menuItems = [],
}: Props) {
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

	return (
		<Stack spacing={1}>
			<Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
				<Box
					component={onAvatarClick ? "button" : "div"}
					onClick={onAvatarClick}
					sx={{
						p: 0,
						border: 0,
						bgcolor: "transparent",
						cursor: onAvatarClick ? "pointer" : "default",
						lineHeight: 0,
					}}
					aria-label={onAvatarClick ? "Сменить аватар" : undefined}
				>
					<Avatar
						src={avatarUrl || undefined}
						sx={{ width: 40, height: 40 }}
					>
						{fallbackText.charAt(0).toUpperCase()}
					</Avatar>
				</Box>
				<Box
					{...(onNameClick
						? {
								component: "button" as const,
								type: "button" as const,
								onClick: onNameClick,
								"aria-label": `Сменить никнейм: ${nickname}`,
							}
						: {})}
					sx={{
						minWidth: 0,
						flex: 1,
						textAlign: "left",
						border: 0,
						p: 0,
						bgcolor: "transparent",
						color: "inherit",
						cursor: onNameClick ? "pointer" : "default",
					}}
				>
					<Stack
						direction="row"
						spacing={0.5}
						sx={{ alignItems: "center" }}
					>
						<Typography
							variant="body2"
							sx={{ fontWeight: 700 }}
							noWrap
						>
							{nickname}
						</Typography>
						{roleLabel && (
							<Tooltip title={roleLabel}>
								<Box
									component={FiShield}
									sx={{ fontSize: 16, color: "primary.main" }}
								/>
							</Tooltip>
						)}
					</Stack>
				</Box>
				{menuItems.length > 0 && (
					<IconButton
						size="small"
						aria-label="Меню профиля"
						onClick={(event) => setMenuAnchor(event.currentTarget)}
					>
						<FiMoreVertical size={20} />
					</IconButton>
				)}
			</Stack>
			{error && (
				<Typography variant="caption" color="error">
					{error}
				</Typography>
			)}
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={() => setMenuAnchor(null)}
			>
				{menuItems.map((item) => [
					...(item.dividerBefore
						? [<Divider key={`${item.key}-divider`} />]
						: []),
					<MenuItem
						key={item.key}
						onClick={() => {
							setMenuAnchor(null);
							item.onClick();
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								mr: 1.25,
							}}
						>
							{item.icon}
						</Box>
						{item.label}
					</MenuItem>,
				])}
			</Menu>
		</Stack>
	);
}
