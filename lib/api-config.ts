/**
 * Base URL of the PHP API. Locally that is the built-in PHP server started by
 * `npm run api`, which serves http://127.0.0.1:8080/api.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so editing .env.local only
 * takes effect after the Next dev server restarts.
 *
 * The raw value is normalised because it is typed by hand: a stray newline or
 * trailing slash would otherwise be carried into every request URL built from
 * it. All whitespace is stripped rather than trimmed — a URL can never legally
 * contain any, and a pasted newline does not always land where `trim()` would
 * reach it.
 */
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
const FALLBACK_API_URL = 'http://127.0.0.1:8080/api';

export const API_URL = (RAW_API_URL || FALLBACK_API_URL).replace(/\s+/g, '').replace(/\/+$/, '');

/** Host portion of API_URL, for error messages that name the unreachable server. */
export const API_HOST = (() => {
    try {
        return new URL(API_URL).host;
    } catch {
        return API_URL;
    }
})();

if (!RAW_API_URL) {
    console.warn('NEXT_PUBLIC_API_URL is not defined in environment variables. Falling back to default: ' + API_URL);
}
