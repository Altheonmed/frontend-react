import { BASE_URL } from '../../config';

/**
 * Resolve a media path returned by the API into a URL the browser can fetch.
 *
 * The API returns whatever the storage backend produces. With Cloudflare R2 that
 * is an absolute, signed https URL and nothing needs doing. With local/disk
 * storage it is a root-relative path like `/media/doctors/5/profile/avatar.webp`,
 * which the browser resolves against the *frontend* origin — and the frontend is
 * never the API (Vercel vs Render in production, :5177 vs :8077 in dev), so the
 * image 404s and every avatar silently falls back to initials.
 *
 * Prefixing the API origin makes both cases work.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
    if (typeof url !== 'string') return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    // Absolute (signed R2/S3), protocol-relative, or inline data — use as-is.
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
    return `${BASE_URL.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
}

export default resolveMediaUrl;
