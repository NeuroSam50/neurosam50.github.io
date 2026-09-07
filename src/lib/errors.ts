type SupabaseLikeError = {
	code?: string;
	message?: string;
} | null;

const MESSAGES: Record<string, string> = {
	"23503": "Нельзя удалить: на эту запись ссылаются другие данные.",
	"23505": "Такая запись уже существует.",
	"23514": "Данные не прошли проверку. Проверьте заполненные поля.",
	"42501": "Недостаточно прав для этого действия.",
	PGRST301: "Сессия истекла. Войдите заново.",
};

export function describeError(error: SupabaseLikeError, fallback: string) {
	if (!error) {
		return fallback;
	}

	if (error.code && MESSAGES[error.code]) {
		return MESSAGES[error.code];
	}

	if (error.code === "P0001" && error.message) {
		return error.message;
	}

	if (error.message?.toLowerCase().includes("failed to fetch")) {
		return "Нет связи с сервером. Проверьте подключение к интернету.";
	}

	if (error.message?.toLowerCase().includes("jwt")) {
		return "Сессия истекла. Войдите заново.";
	}

	return fallback;
}
