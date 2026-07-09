/**
 * Clears conflicting Google Translate cookies and sets a single clean googtrans cookie.
 */
export function setLanguageCookie(langCode: string) {
  const cookieValue = `/en/${langCode}`;
  const host = window.location.hostname;
  
  // Clear conflicting cookies on the exact host
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=None`;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host}; Secure; SameSite=None`;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host}; Secure; SameSite=None`;

  // Set the fresh cookie on root path (without explicit domain so it defaults to exact host)
  document.cookie = `googtrans=${cookieValue}; path=/; Secure; SameSite=None`;
  
  // Also set with exact host domain to ensure it's picked up
  document.cookie = `googtrans=${cookieValue}; path=/; domain=${host}; Secure; SameSite=None`;
}

export function clearLanguageCookie() {
  const host = window.location.hostname;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=None`;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host}; Secure; SameSite=None`;
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host}; Secure; SameSite=None`;
}
