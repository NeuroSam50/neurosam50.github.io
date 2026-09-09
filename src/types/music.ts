export type Album = {
	id: string;
	title: string;
	description: string;
};

export type Track = {
	id: string;
	title: string;
	artist: string;
	album: string;
	year: number;
	duration: string;
	mood: string;
	cover: string;
	src: string;
	download: string;
	up: number;
	commentCount: number;
	lyrics: string;
	position: number;
	albumPosition: number;
};

export type Comment = {
	id: string;
	trackId: string;
	userId: string;
	body: string;
	createdAt: string;
	nickname: string;
	avatarUrl: string;
	isAdmin: boolean;
	upCount: number;
	downCount: number;
	isPinned: boolean;
};
