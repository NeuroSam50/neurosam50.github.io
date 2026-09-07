import { Box, CircularProgress, Typography } from "@mui/material";

type Props = {
	value: number;
	size: number;
};

export default function UploadProgressRing({ value, size }: Props) {
	return (
		<Box
			sx={{
				position: "relative",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: size,
				height: size,
				flexShrink: 0,
			}}
		>
			<CircularProgress
				variant="determinate"
				value={value}
				size={size}
				thickness={4}
			/>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Typography
					variant="caption"
					sx={{ fontSize: size >= 40 ? 11 : 9, fontWeight: 700 }}
				>
					{value}%
				</Typography>
			</Box>
		</Box>
	);
}
