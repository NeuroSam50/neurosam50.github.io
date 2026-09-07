export function readAudioDuration(file: File): Promise<string> {
	return new Promise((resolve) => {
		const audio = document.createElement("audio");
		audio.preload = "metadata";

		audio.onloadedmetadata = () => {
			URL.revokeObjectURL(audio.src);
			const totalSeconds = Math.round(audio.duration) || 0;
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			resolve(`${minutes}:${seconds.toString().padStart(2, "0")}`);
		};

		audio.onerror = () => {
			URL.revokeObjectURL(audio.src);
			resolve("");
		};

		audio.src = URL.createObjectURL(file);
	});
}
