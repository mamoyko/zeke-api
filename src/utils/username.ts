/** Public handles: lowercase letters, digits, underscore. Allocated from the
 * display name at signup so a friend can find you without your email. */

export const USERNAME_MAX = 20;

export function slugFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, USERNAME_MAX);
  return slug.length >= 3 ? slug : "zeke";
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}
