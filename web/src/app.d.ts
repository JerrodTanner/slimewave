// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Markdown documents are imported for their text: `lib/content` parses
// them at runtime rather than through a build plugin.
declare module '*.md?raw' {
	const source: string;
	export default source;
}

export {};
