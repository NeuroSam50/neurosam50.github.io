import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const site = process.env.PUBLIC_SITE_URL || undefined;

export default defineConfig({
	site,
	output: "static",
	server: {
		port: 3000,
		host: true,
	},
	integrations: [react(), ...(site ? [sitemap()] : [])],
});
