/**
 * Client-side security utilities for HTML escaping and URL protocol validation.
 */

export function escapeHtml(value: unknown): string {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validates that an external link uses a safe HTTP(S) or mailto protocol,
 * blocking javascript:, vbscript:, data:, and file: injection vectors.
 */
export function safeExternalUrl(rawUrl: string | undefined | null): string | undefined {
  if (!rawUrl || typeof rawUrl !== "string") return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("mailto:")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
  } catch {
    // Allow relative safe paths only if they don't contain protocol schemes
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      return trimmed;
    }
  }
  return undefined;
}

/**
 * Validates URLs used for user-uploaded images/videos in chats & support tickets.
 */
export function safeMediaUrl(rawUrl: string | undefined | null): string | undefined {
  if (!rawUrl || typeof rawUrl !== "string") return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  if (
    /^data:image\/(?:png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed) ||
    /^data:video\/(?:mp4|webm|ogg);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  ) {
    return trimmed;
  }

  return safeExternalUrl(trimmed);
}
