import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { generateRandomNickname } from "./nickname";

type Updater<T> = T | ((current: T) => T);

type AuthState = {
	authLoading: boolean;
	authEmail: string;
	authUserId: string;
	isAdminUser: boolean;
	avatarUrl: string;
	nickname: string;
	myVotes: Record<string, boolean>;
	myCommentVotes: Record<string, "up" | "down">;
};

let state: AuthState = {
	authLoading: true,
	authEmail: "",
	authUserId: "",
	isAdminUser: false,
	avatarUrl: "",
	nickname: "",
	myVotes: {},
	myCommentVotes: {},
};

const listeners = new Set<() => void>();
let initialized = false;

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
	return typeof updater === "function"
		? (updater as (current: T) => T)(current)
		: updater;
}

function patch(partial: Partial<AuthState>) {
	state = { ...state, ...partial };
	listeners.forEach((listener) => listener());
}

export function setAvatarUrl(value: Updater<string>) {
	patch({ avatarUrl: resolveUpdater(value, state.avatarUrl) });
}

export function setNickname(value: Updater<string>) {
	patch({ nickname: resolveUpdater(value, state.nickname) });
}

export function setMyVotes(value: Updater<Record<string, boolean>>) {
	patch({ myVotes: resolveUpdater(value, state.myVotes) });
}

export function setMyCommentVotes(
	value: Updater<Record<string, "up" | "down">>,
) {
	patch({ myCommentVotes: resolveUpdater(value, state.myCommentVotes) });
}

async function loadProfile(userId: string) {
	if (!supabase) {
		return;
	}

	const [{ data: adminRow }, { data: profileRow }] = await Promise.all([
		supabase
			.from("admin_profiles")
			.select("user_id")
			.eq("user_id", userId)
			.maybeSingle(),
		supabase
			.from("profiles")
			.select("avatar_url,nickname")
			.eq("user_id", userId)
			.maybeSingle(),
	]);

	let nickname = profileRow?.nickname || "";
	if (!nickname) {
		const generated = generateRandomNickname();
		const { error } = await supabase
			.from("profiles")
			.upsert(
				{ user_id: userId, nickname: generated },
				{ onConflict: "user_id" },
			);

		if (!error) {
			nickname = generated;
		}
	}

	const { data: voteRows } = await supabase
		.from("track_votes")
		.select("track_id")
		.eq("user_id", userId);

	patch({
		isAdminUser: Boolean(adminRow),
		avatarUrl: profileRow?.avatar_url || "",
		nickname,
		myVotes: (voteRows || []).reduce<Record<string, boolean>>(
			(acc, row) => {
				acc[row.track_id] = true;
				return acc;
			},
			{},
		),
	});
}

function clearAuthState() {
	patch({
		authEmail: "",
		authUserId: "",
		isAdminUser: false,
		avatarUrl: "",
		nickname: "",
		myVotes: {},
		myCommentVotes: {},
	});
}

function ensureInitialized() {
	if (initialized) {
		return;
	}
	initialized = true;

	if (!supabase) {
		patch({ authLoading: false });
		return;
	}

	supabase.auth.getSession().then(({ data }) => {
		const user = data.session?.user;
		if (user) {
			patch({ authEmail: user.email || "", authUserId: user.id });
			loadProfile(user.id);
		}
		patch({ authLoading: false });
	});

	supabase.auth.onAuthStateChange((_event, session) => {
		const user = session?.user;
		if (user) {
			patch({ authEmail: user.email || "", authUserId: user.id });
			loadProfile(user.id);
		} else {
			clearAuthState();
		}
	});
}

export async function logout() {
	if (!supabase) {
		return;
	}
	await supabase.auth.signOut();
}

function subscribe(listener: () => void) {
	ensureInitialized();
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getState() {
	return state;
}

export function useAuthState() {
	return useSyncExternalStore(subscribe, getState, getState);
}
