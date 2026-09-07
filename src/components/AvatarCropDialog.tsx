import { useEffect, useRef, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Slider,
	Stack,
	Typography,
} from "@mui/material";
import { FiCamera, FiCheck } from "react-icons/fi";

const PREVIEW_SIZE = 280;
const OUTPUT_SIZE = 512;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

type Props = {
	open: boolean;
	onClose: () => void;
	onSave: (blob: Blob) => Promise<void> | void;
};

type ImageInfo = {
	element: HTMLImageElement;
	width: number;
	height: number;
	coverScale: number;
};

export default function AvatarCropDialog({ open, onClose, onSave }: Props) {
	const [image, setImage] = useState<ImageInfo | null>(null);
	const [scale, setScale] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const dragRef = useRef<{
		startX: number;
		startY: number;
		originX: number;
		originY: number;
	} | null>(null);
	const objectUrlRef = useRef("");

	useEffect(() => releaseObjectUrl, []);

	function clampOffset(
		nextOffset: { x: number; y: number },
		nextScale: number,
		info: ImageInfo,
	) {
		const renderWidth = info.width * info.coverScale * nextScale;
		const renderHeight = info.height * info.coverScale * nextScale;
		const maxX = Math.max(0, (renderWidth - PREVIEW_SIZE) / 2);
		const maxY = Math.max(0, (renderHeight - PREVIEW_SIZE) / 2);

		return {
			x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
			y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
		};
	}

	function releaseObjectUrl() {
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = "";
		}
	}

	function handleFileSelect(file: File | null) {
		setError("");

		if (!file) {
			return;
		}

		if (file.size > MAX_AVATAR_BYTES) {
			setError(
				`Файл больше ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} МБ. Выберите изображение меньшего размера.`,
			);
			return;
		}

		if (file.type && !file.type.startsWith("image/")) {
			setError("Выберите файл изображения.");
			return;
		}

		releaseObjectUrl();

		const objectUrl = URL.createObjectURL(file);
		objectUrlRef.current = objectUrl;
		const img = new Image();

		img.onload = () => {
			const coverScale =
				PREVIEW_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
			setImage({
				element: img,
				width: img.naturalWidth,
				height: img.naturalHeight,
				coverScale,
			});
			setScale(1);
			setOffset({ x: 0, y: 0 });
		};

		img.onerror = () => {
			setError("Не удалось открыть изображение.");
		};

		img.src = objectUrl;
	}

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		if (!image) {
			return;
		}

		(event.target as HTMLElement).setPointerCapture(event.pointerId);
		dragRef.current = {
			startX: event.clientX,
			startY: event.clientY,
			originX: offset.x,
			originY: offset.y,
		};
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		if (!image || !dragRef.current) {
			return;
		}

		const dx = event.clientX - dragRef.current.startX;
		const dy = event.clientY - dragRef.current.startY;

		setOffset(
			clampOffset(
				{
					x: dragRef.current.originX + dx,
					y: dragRef.current.originY + dy,
				},
				scale,
				image,
			),
		);
	}

	function handlePointerUp() {
		dragRef.current = null;
	}

	function handleScaleChange(nextScale: number) {
		if (!image) {
			return;
		}

		setScale(nextScale);
		setOffset((current) => clampOffset(current, nextScale, image));
	}

	async function handleConfirm() {
		if (!image) {
			return;
		}

		setSaving(true);
		setError("");

		try {
			const canvas = document.createElement("canvas");
			canvas.width = OUTPUT_SIZE;
			canvas.height = OUTPUT_SIZE;

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				throw new Error("Canvas недоступен в этом браузере.");
			}

			const k = OUTPUT_SIZE / PREVIEW_SIZE;
			const renderWidth = image.width * image.coverScale * scale;
			const renderHeight = image.height * image.coverScale * scale;
			const posX = PREVIEW_SIZE / 2 - renderWidth / 2 + offset.x;
			const posY = PREVIEW_SIZE / 2 - renderHeight / 2 + offset.y;

			ctx.drawImage(
				image.element,
				posX * k,
				posY * k,
				renderWidth * k,
				renderHeight * k,
			);

			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob(resolve, "image/webp", 0.92);
			});

			if (!blob || blob.type !== "image/webp") {
				throw new Error("Браузер не поддерживает конвертацию в WebP.");
			}

			await onSave(blob);
			handleClose();
		} catch (saveError) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Не удалось сохранить аватар.",
			);
		} finally {
			setSaving(false);
		}
	}

	function handleClose() {
		releaseObjectUrl();
		setImage(null);
		setScale(1);
		setOffset({ x: 0, y: 0 });
		setError("");
		onClose();
	}

	const renderWidth = image ? image.width * image.coverScale * scale : 0;
	const renderHeight = image ? image.height * image.coverScale * scale : 0;
	const posX = image ? PREVIEW_SIZE / 2 - renderWidth / 2 + offset.x : 0;
	const posY = image ? PREVIEW_SIZE / 2 - renderHeight / 2 + offset.y : 0;

	return (
		<Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
			<DialogTitle>Новый аватар</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ pt: 1, alignItems: "center" }}>
					{!image ? (
						<Button
							variant="outlined"
							component="label"
							startIcon={<FiCamera />}
						>
							Выбрать изображение
							<input
								hidden
								type="file"
								accept="image/*"
								onChange={(event) =>
									handleFileSelect(
										event.target.files?.[0] || null,
									)
								}
							/>
						</Button>
					) : (
						<>
							<Box
								onPointerDown={handlePointerDown}
								onPointerMove={handlePointerMove}
								onPointerUp={handlePointerUp}
								sx={{
									width: PREVIEW_SIZE,
									height: PREVIEW_SIZE,
									borderRadius: "50%",
									overflow: "hidden",
									position: "relative",
									bgcolor: "common.black",
									cursor: "grab",
									touchAction: "none",
									border: "1px solid",
									borderColor: "divider",
								}}
							>
								<img
									src={image.element.src}
									alt="Предпросмотр аватара"
									draggable={false}
									style={{
										position: "absolute",
										left: posX,
										top: posY,
										width: renderWidth,
										height: renderHeight,
										userSelect: "none",
										pointerEvents: "none",
									}}
								/>
							</Box>
							<Stack
								direction="row"
								spacing={2}
								sx={{ width: "100%", alignItems: "center" }}
							>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									Масштаб
								</Typography>
								<Slider
									value={scale}
									min={1}
									max={4}
									step={0.01}
									onChange={(_event, value) =>
										handleScaleChange(value as number)
									}
									size="small"
								/>
							</Stack>
							<Button size="small" component="label">
								Выбрать другое изображение
								<input
									hidden
									type="file"
									accept="image/*"
									onChange={(event) =>
										handleFileSelect(
											event.target.files?.[0] || null,
										)
									}
								/>
							</Button>
						</>
					)}
					{error && (
						<Alert severity="error" sx={{ width: "100%" }}>
							{error}
						</Alert>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Отмена</Button>
				<Button
					variant="contained"
					startIcon={<FiCheck />}
					onClick={handleConfirm}
					disabled={!image || saving}
				>
					{saving ? "Сохранение..." : "Сохранить"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
