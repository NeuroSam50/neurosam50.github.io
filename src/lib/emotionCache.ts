import createCache from "@emotion/cache";

export function createEmotionCache() {
	const insertionPoint =
		document.querySelector<HTMLElement>(
			'meta[name="emotion-insertion-point"]',
		) ?? undefined;

	return createCache({ key: "css", insertionPoint });
}
