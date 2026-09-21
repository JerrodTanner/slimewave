/**
 * Client-rendered, single page. Both flags matter:
 *
 * - `ssr = false` because the root layout owns a live WebGL context; there is
 *   no server-side equivalent to hydrate into.
 * - `prerender = false` because every route is served by the Go binary's SPA
 *   fallback, which hands back the same shell for any path.
 */
export const ssr = false;
export const prerender = false;
export const trailingSlash = 'never';
