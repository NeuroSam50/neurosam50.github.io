import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

type AuthMode = "login" | "signup" | "forgot";

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

export function openForgotPassword() {
	patch({
		authMode: "forgot",
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

	if (!email) {
		patch({ authError: "Укажите почту." });
		return;
	}

	if (state.authMode !== "forgot" && !password) {
		patch({ authError: "Укажите пароль." });
		return;
	}

	patch({ authSubmitting: true });

	try {
		if (state.authMode === "forgot") {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/reset-password`,
			});

			if (error) {
				patch({ authError: "Не удалось отправить письмо. Проверьте адрес почты." });
				return;
			}

			patch({
				authNotice: "Письмо со ссылкой для смены пароля отправлено на почту.",
				authMode: "login",
			});
			return;
		}

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
