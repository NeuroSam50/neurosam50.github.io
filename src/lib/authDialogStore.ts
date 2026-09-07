import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

type AuthMode = "login" | "signup";

type AuthDialogState = {
	loginOpen: boolean;
	authMode: AuthMode;
	login: string;
	password: string;
	authNotice: string;
	authError: string;
	authSubmitting: boolean;
};

let state: AuthDialogState = {
	loginOpen: false,
	authMode: "login",
	login: "",
	password: "",
	authNotice: "",
	authError: "",
	authSubmitting: false,
};

const listeners = new Set<() => void>();

function patch(partial: Partial<AuthDialogState>) {
	state = { ...state, ...partial };
	listeners.forEach((listener) => listener());
}

export function setLoginOpen(open: boolean) {
	patch({ loginOpen: open });
}

export function setLogin(value: string) {
	patch({ login: value });
}

export function setPassword(value: string) {
	patch({ password: value });
}

export function openLoginDialog() {
	patch({
		authMode: "login",
		authError: "",
		authNotice: "",
		loginOpen: true,
	});
}

export function toggleAuthMode() {
	patch({
		authMode: state.authMode === "login" ? "signup" : "login",
		authError: "",
		authNotice: "",
	});
}

export function requireAuth(authUserId: string) {
	if (authUserId) {
		return true;
	}
	openLoginDialog();
	return false;
}

export async function handleAuthSubmit() {
	if (state.authSubmitting) {
		return;
	}

	patch({ authError: "", authNotice: "" });

	if (!supabase) {
		patch({ authError: "Вход временно недоступен. Попробуйте позже." });
		return;
	}

	const email = state.login.trim();
	const password = state.password;

	if (!email || !password) {
		patch({ authError: "Укажите почту и пароль." });
		return;
	}

	patch({ authSubmitting: true });

	try {
		if (state.authMode === "signup") {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			});

			if (error) {
				patch({
					authError: error.message.toLowerCase().includes("password")
						? "Пароль слишком короткий - минимум 6 символов."
						: "Не удалось зарегистрироваться. Проверьте адрес почты.",
				});
				return;
			}

			if (!data.session) {
				patch({
					authNotice:
						"Проверьте почту и подтвердите регистрацию, затем войдите.",
					authMode: "login",
					password: "",
				});
				return;
			}
		} else {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				patch({
					authError: "Не удалось войти. Проверьте почту и пароль.",
				});
				return;
			}
		}

		patch({ password: "", loginOpen: false });
	} finally {
		patch({ authSubmitting: false });
	}
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getState() {
	return state;
}

export function useAuthDialogState() {
	return useSyncExternalStore(subscribe, getState, getState);
}
