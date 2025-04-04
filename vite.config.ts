import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		allowedHosts: ["nikitalokhmachev-ai.github.io"],
	},
	base: "/side-stacker-frontend",
});
