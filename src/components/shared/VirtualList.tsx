import { useRef, type ReactNode } from "react";
import { Box } from "@mui/material";
import { useVirtualizer, useWindowVirtualizer } from "@tanstack/react-virtual";

type Props<T> = {
	items: T[];
	getKey: (item: T) => string;
	renderItem: (item: T, index: number) => ReactNode;
	estimateSize?: number;
	maxHeight?: number;
	windowScroll?: boolean;
};

export default function VirtualList<T>({
	items,
	getKey,
	renderItem,
	estimateSize = 72,
	maxHeight = 520,
	windowScroll = false,
}: Props<T>) {
	const parentRef = useRef<HTMLDivElement | null>(null);

	const containerVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => estimateSize,
		overscan: 8,
		enabled: !windowScroll,
	});

	const windowVirtualizer = useWindowVirtualizer({
		count: items.length,
		estimateSize: () => estimateSize,
		overscan: 8,
		scrollMargin: parentRef.current?.offsetTop ?? 0,
		enabled: windowScroll,
	});

	if (windowScroll) {
		const virtualizer = windowVirtualizer;
		const scrollMargin = virtualizer.options.scrollMargin;
		return (
			<Box
				ref={parentRef}
				sx={{
					position: "relative",
					width: "100%",
					height: virtualizer.getTotalSize(),
				}}
			>
				{virtualizer.getVirtualItems().map((virtualRow) => {
					const item = items[virtualRow.index];
					return (
						<Box
							key={getKey(item)}
							data-index={virtualRow.index}
							ref={virtualizer.measureElement}
							sx={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								transform: `translateY(${
									virtualRow.start - scrollMargin
								}px)`,
							}}
						>
							{renderItem(item, virtualRow.index)}
						</Box>
					);
				})}
			</Box>
		);
	}

	const virtualizer = containerVirtualizer;

	return (
		<Box ref={parentRef} sx={{ maxHeight, overflowY: "auto" }}>
			<Box
				sx={{
					position: "relative",
					width: "100%",
					height: virtualizer.getTotalSize(),
				}}
			>
				{virtualizer.getVirtualItems().map((virtualRow) => {
					const item = items[virtualRow.index];
					return (
						<Box
							key={getKey(item)}
							data-index={virtualRow.index}
							ref={virtualizer.measureElement}
							sx={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							{renderItem(item, virtualRow.index)}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}
