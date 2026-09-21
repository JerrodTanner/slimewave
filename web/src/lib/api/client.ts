/**
 * Thin client for the Go API. Every call goes to a same-origin path, so the
 * session cookie rides along without any CORS or token plumbing.
 */

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

type Json = Record<string, unknown> | unknown[] | null;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(path, {
		credentials: 'same-origin',
		...init,
		headers: {
			...(init.body ? { 'Content-Type': 'application/json' } : {}),
			...init.headers
		}
	});

	if (res.status === 204) return undefined as T;

	const text = await res.text();
	let parsed: unknown = null;
	if (text) {
		try {
			parsed = JSON.parse(text);
		} catch {
			// A non-JSON body from an API path means something upstream is
			// broken; surface it rather than pretending we got data.
			throw new ApiError(res.status, `unexpected response from ${path}`);
		}
	}

	if (!res.ok) {
		const message =
			(parsed as { error?: string } | null)?.error ?? `request failed (${res.status})`;
		throw new ApiError(res.status, message);
	}
	return parsed as T;
}

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, body?: Json) =>
		request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
	put: <T>(path: string, body: Json) =>
		request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
	del: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};

// --- response shapes ---

export interface SessionUser {
	id: number;
	email: string;
	displayName: string;
	role: string;
	isOwner: boolean;
}

export interface DocumentSummary {
	id: number;
	slug: string;
	title: string;
	summary: string;
	body: string;
	kind: string;
	published: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Track {
	title: string;
	artist: string;
	album: string;
	file: string;
	streamUrl: string;
	size: number;
}

export interface Album {
	name: string;
	artist: string;
	coverUrl: string;
	tracks: Track[];
}

export interface Artist {
	name: string;
	albums: Album[];
}

export interface ArtistSummary {
	name: string;
	albumCount: number;
	trackCount: number;
	coverUrl: string;
}

export const endpoints = {
	me: () => api.get<{ user: SessionUser | null; registrationOpen: boolean }>('/api/auth/me'),
	login: (email: string, password: string) =>
		api.post<{ user: SessionUser }>('/api/auth/login', { email, password }),
	logout: () => api.post<{ user: null }>('/api/auth/logout'),

	preferences: () =>
		api.get<{ preferences: { theme: string; data: Record<string, unknown> } }>('/api/preferences'),
	savePreferences: (theme: string, data: Record<string, unknown>) =>
		api.put<{ preferences: { theme: string } }>('/api/preferences', { theme, data }),

	documents: (opts: { drafts?: boolean; kind?: string; full?: boolean } = {}) => {
		const params = new URLSearchParams();
		if (opts.drafts) params.set('drafts', 'true');
		if (opts.kind) params.set('kind', opts.kind);
		// Bodies are omitted from the index by default; ask when you need them.
		if (opts.full) params.set('full', 'true');
		const qs = params.toString();
		return api.get<{ documents: DocumentSummary[] }>(`/api/documents${qs ? `?${qs}` : ''}`);
	},
	document: (slug: string) => api.get<{ document: DocumentSummary }>(`/api/documents/${slug}`),
	createDocument: (doc: Partial<DocumentSummary>) =>
		api.post<{ document: DocumentSummary }>('/api/documents', doc as Json),
	updateDocument: (slug: string, doc: Partial<DocumentSummary>) =>
		api.put<{ document: DocumentSummary }>(`/api/documents/${slug}`, doc as Json),
	deleteDocument: (slug: string) => api.del<void>(`/api/documents/${slug}`),

	artists: () => api.get<{ artists: ArtistSummary[] }>('/api/music/artists'),
	artist: (name: string) =>
		api.get<{ artist: Artist }>(`/api/music/artists/${encodeURIComponent(name)}`),
	album: (artist: string, album: string) =>
		api.get<{ album: Album }>(
			`/api/music/artists/${encodeURIComponent(artist)}/albums/${encodeURIComponent(album)}`
		)
};
