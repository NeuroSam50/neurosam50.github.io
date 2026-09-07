import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
	? createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				persistSession: true,
				autoRefreshToken: true,
			},
		})
	: null;

export function uploadFileWithProgress(
	bucket: string,
	path: string,
	file: File | Blob,
	onProgress: (percent: number) => void,
): Promise<void> {
	return new Promise(async (resolve, reject) => {
		const accessToken = (await supabase?.auth.getSession())?.data.session
			?.access_token;

		if (!accessToken) {
			reject(new Error("Сессия истекла. Войдите заново."));
			return;
		}

		const xhr = new XMLHttpRequest();
		xhr.open("POST", `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);
		xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
		xhr.setRequestHeader("apikey", supabaseAnonKey);
		xhr.setRequestHeader("x-upsert", "true");
		xhr.setRequestHeader(
			"Content-Type",
			file.type || "application/octet-stream",
		);

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress(100);
				resolve();
				return;
			}

			if (xhr.status === 401 || xhr.status === 403) {
				reject(new Error("Недостаточно прав. Войдите заново."));
			} else if (xhr.status === 413) {
				reject(new Error("Файл слишком большой для загрузки."));
			} else {
				reject(
					new Error("Не удалось загрузить файл. Попробуйте ещё раз."),
				);
			}
		};

		xhr.onerror = () => reject(new Error("Ошибка сети при загрузке файла"));

		xhr.send(file);
	});
}
