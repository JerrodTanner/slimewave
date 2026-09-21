import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// The Go server listens here in development. `npm run dev` proxies the API
// and media paths to it so the SPA talks to the same URLs it will in prod.
const API_ORIGIN = process.env.SLIMEWAVE_API_ORIGIN ?? 'http://localhost:8001';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// A single-page app, not a prerendered site: the Babylon canvas
			// lives in the root layout and must never be torn down by a full
			// page load. `fallback` makes the Go server's SPA handler able to
			// answer any deep link with the same shell.
			adapter: adapter({ fallback: 'index.html', strict: false })
		})
	],
	server: {
		proxy: {
			'/api': { target: API_ORIGIN, changeOrigin: false },
			'/media': { target: API_ORIGIN, changeOrigin: false }
		}
	},
	build: {
		// Babylon is large and splits poorly by default; a slightly higher
		// warning threshold keeps the build output readable.
		chunkSizeWarningLimit: 1500
	}
});
