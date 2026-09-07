const ADJECTIVES = [
	"Тихий",
	"Быстрый",
	"Смелый",
	"Ясный",
	"Лунный",
	"Солнечный",
	"Дикий",
	"Яркий",
	"Северный",
	"Ночной",
];

const NOUNS = [
	"Волк",
	"Сокол",
	"Ветер",
	"Ритм",
	"Бас",
	"Синтез",
	"Аккорд",
	"Дым",
	"Свет",
	"Звук",
];

export function generateRandomNickname(): string {
	const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
	const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
	const number = Math.floor(Math.random() * 9000) + 100;

	return `${adjective}${noun}${number}`;
}
