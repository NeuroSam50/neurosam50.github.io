import { useSyncExternalStore } from "react";

export type NoticeSeverity = "success" | "info" | "warning" | "error";

export type Notice = {
	id: number;
	message: string;
	severity: NoticeSeverity;
};

export type ConfirmRequest = {
	title: string;
	body: string;
	confirmLabel: string;
	destructive: boolean;
	resolve: (accepted: boolean) => void;
};

type UiState = {
	notice: Notice | null;
	confirmRequest: ConfirmRequest | null;
};

let state: UiState = { notice: null, confirmRequest: null };
const listeners = new Set<() => void>();
let noticeId = 0;

function patch(partial: Partial<UiState>) {
	state = { ...state, ...partial };
	listeners.forEach((listener) => listener());
}

export function notify(message: string, severity: NoticeSeverity = "info") {
	noticeId += 1;
	patch({ notice: { id: noticeId, message, severity } });
}

export function dismissNotice() {
	patch({ notice: null });
}

export function confirmAction(options: {
	title: string;
	body?: string;
	confirmLabel?: string;
	destructive?: boolean;
}): Promise<boolean> {
	return new Promise((resolve) => {
		patch({
			confirmRequest: {
				title: options.title,
				body: options.body || "",
				confirmLabel: options.confirmLabel || "Удалить",
				destructive: options.destructive ?? true,
				resolve,
			},
		});
	});
}

export function resolveConfirm(accepted: boolean) {
	const request = state.confirmRequest;
	patch({ confirmRequest: null });
	request?.resolve(accepted);
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getState() {
	return state;
}

export function useUiState() {
	return useSyncExternalStore(subscribe, getState, getState);
}
