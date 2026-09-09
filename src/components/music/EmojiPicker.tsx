import { Box, ClickAwayListener, Grow, Paper, Popper } from "@mui/material";
import { useRef, useState } from "react";
import twemoji from "twemoji";
import { FiSmile } from "react-icons/fi";
import IconButton from "@mui/material/IconButton";

const EMOJIS = [
	"😀",
	"😂",
	"😅",
	"😉",
	"😍",
	"😘",
	"😎",
	"🤔",
	"😢",
	"😭",
	"😡",
	"😴",
	"😱",
	"🥳",
	"🤗",
	"🤩",
	"👍",
	"👎",
	"👏",
	"🙏",
	"💪",
	"🤝",
	"👋",
	"✌️",
	"❤️",
	"🔥",
	"🎉",
	"✨",
	"🎵",
	"🎶",
	"🎧",
	"⭐",
	"💯",
	"✅",
	"❌",
	"❓",
	"❗",
	"😏",
	"🙄",
	"😬",
];

function twemojiUrl(emoji: string) {
	let url = "";
	twemoji.parse(emoji, {
		callback: (icon) => {
			url = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/${icon}.png`;
			return url;
		},
	});
	return url;
}

type Props = {
	onSelect: (emoji: string) => void;
	disabled?: boolean;
};

export default function EmojiPicker({ onSelect, disabled }: Props) {
	const [open, setOpen] = useState(false);
	const anchorRef = useRef<HTMLButtonElement>(null);

	function handleSelect(emoji: string) {
		onSelect(emoji);
		setOpen(false);
	}

	return (
		<>
			<IconButton
				ref={anchorRef}
				aria-label="Выбрать эмодзи"
				disabled={disabled}
				onClick={() => setOpen((prev: boolean) => !prev)}
			>
				<FiSmile size={20} />
			</IconButton>
			<Popper
				open={open}
				anchorEl={anchorRef.current}
				placement="top-start"
				transition
				sx={{ zIndex: 1300 }}
			>
				{({ TransitionProps }) => (
					<Grow {...TransitionProps} timeout={150}>
						<Paper
							elevation={4}
							sx={{
								p: 1,
								mb: 1,
								display: "grid",
								gridTemplateColumns: "repeat(8, 1fr)",
								gap: 0.5,
								maxWidth: 320,
							}}
						>
							<ClickAwayListener
								onClickAway={() => setOpen(false)}
							>
								<Box
									sx={{
										display: "contents",
									}}
								>
									{EMOJIS.map((emoji) => (
										<IconButton
											key={emoji}
											size="small"
											onClick={() => handleSelect(emoji)}
											sx={{ p: 0.5 }}
										>
											<Box
												component="img"
												src={twemojiUrl(emoji)}
												alt={emoji}
												sx={{
													width: 20,
													height: 20,
													aspectRatio: "1 / 1",
													objectFit: "contain",
													display: "block",
												}}
											/>
										</IconButton>
									))}
								</Box>
							</ClickAwayListener>
						</Paper>
					</Grow>
				)}
			</Popper>
		</>
	);
}
