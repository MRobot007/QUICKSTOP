import { API_HOST, API_URL } from './api-config';

/**
 * Why a request failed.
 *
 * A bare `fetch()` rejects with an opaque TypeError for every pre-response
 * failure — DNS, TLS, a blocked CORS preflight, a device with no connectivity —
 * so callers that catch it can only report a generic "network error". That is
 * what made a backend which had been deleted from its host look like a bug in
 * this app: the host's edge answered the CORS preflight with a 404 carrying no
 * `Access-Control-Allow-Origin`, the browser discarded it, and the real status
 * never reached our code.
 */
export type ApiErrorKind =
    | 'offline'      // the browser reports no connectivity
    | 'timeout'      // aborted before any response arrived
    | 'unreachable'  // no response at all: host down, DNS/TLS failure, or CORS block
    | 'http';        // the server answered, with a non-2xx status

export class ApiError extends Error {
    readonly kind: ApiErrorKind;
    readonly url: string;
    readonly status?: number;

    constructor(kind: ApiErrorKind, message: string, url: string, status?: number, cause?: unknown) {
        super(message, { cause });
        this.name = 'ApiError';
        this.kind = kind;
        this.url = url;
        this.status = status;
    }
}

/**
 * How long the reachability probe waits before calling the backend down.
 *
 * Six seconds was right when the API sat on the same machine. A backend on a
 * free hosting tier sleeps when idle and takes the better part of a minute to
 * wake, so the first visitor of the day was told the server was unreachable
 * while it was in fact starting up. Signing in still worked — only the banner
 * was wrong — but a demo that opens on "can't reach the server" is a bad demo.
 *
 * Set NEXT_PUBLIC_HEALTH_TIMEOUT_MS lower for an always-on backend, where a
 * genuinely dead server should be reported quickly.
 */
const HEALTH_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_HEALTH_TIMEOUT_MS) || 45000;

function buildUrl(path: string): string {
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function isAbort(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * `fetch` against the API that fails with an {@link ApiError} explaining what
 * actually went wrong, and resolves to the parsed JSON body on success.
 *
 * `Content-Type` is set only when there is a body: a cross-origin GET without
 * custom headers stays a "simple request", so it reaches the server even when
 * preflight handling is what's broken.
 */
export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const url = buildUrl(path);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new ApiError('offline', 'You appear to be offline. Check your connection and try again.', url);
    }

    let response: Response;
    try {
        response = await fetch(url, {
            credentials: 'include',
            cache: 'no-store',
            ...init,
            headers: {
                ...(init.body ? { 'Content-Type': 'application/json' } : {}),
                ...init.headers,
            },
        });
    } catch (cause) {
        if (isAbort(cause)) {
            throw new ApiError('timeout', `The server at ${API_HOST} did not respond in time.`, url, undefined, cause);
        }
        throw new ApiError(
            'unreachable',
            `Can't reach the server at ${API_HOST}. It may be offline, or it isn't accepting requests from this site.`,
            url,
            undefined,
            cause,
        );
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
        const message = (body as { error?: string } | null)?.error || `Server error: ${response.status}`;
        throw new ApiError('http', message, url, response.status);
    }

    return body as T;
}

/**
 * Sign out everywhere, not just in this tab.
 *
 * Clearing localStorage alone left the token valid for the rest of its TTL, so
 * a copy lifted from a shared till kept working after the cashier "logged out".
 * The server call revokes it; the local clear still happens if that call fails,
 * because a staff member pressing Log Out has to end up signed out regardless.
 */
export async function logout(): Promise<void> {
    const token = localStorage.getItem('token')
    try {
        if (token) {
            await apiFetch('/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
        }
    } catch {
        // Server unreachable — nothing more we can do from here.
    } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
}

export type ApiHealth =
    | { ok: true }
    | { ok: false; kind: ApiErrorKind; message: string };

/**
 * One-shot reachability probe against `GET /health`, used to tell a user that
 * the backend is down *before* they blame their password. Never throws.
 */
export async function pingApi(): Promise<ApiHealth> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
        await apiFetch('/health', { method: 'GET', credentials: 'omit', signal: controller.signal });
        return { ok: true };
    } catch (error) {
        if (error instanceof ApiError) {
            return { ok: false, kind: error.kind, message: error.message };
        }
        return { ok: false, kind: 'unreachable', message: `Can't reach the server at ${API_HOST}.` };
    } finally {
        clearTimeout(timer);
    }
}
