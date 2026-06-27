/**
 * Normalize active KONU card slug to adhere to strict rules:
 * - Only lowercase letters, digits, and hyphens allowed.
 * - Spaces / special chars replaced by single hyphen.
 * - Umlaute replaced: ä -> ae, ö -> oe, ü -> ue, ß -> ss.
 * - Multiple hyphens collapsed into one.
 * - Hyphens at start and end removed.
 */
export function normalizeSlug(input: string): string {
  if (!input) return '';
  
  // Convert to lowercase
  let s = input.toLowerCase();

  // Replace German Umlaute
  s = s.replace(/ä/g, 'ae');
  s = s.replace(/ö/g, 'oe');
  s = s.replace(/ü/g, 'ue');
  s = s.replace(/ß/g, 'ss');

  // Replace all other invalid characters (not a-z, 0-9, or hyphens) with a hyphen
  s = s.replace(/[^a-z0-9-]/g, '-');

  // Collapse multiple consecutive hyphens into a single hyphen
  s = s.replace(/-+/g, '-');

  // Trim hyphens from the start and end of the string
  s = s.replace(/^-+|-+$/g, '');

  return s;
}

/**
 * Validate card slug eligibility.
 * Returns 'empty', 'invalid', or 'valid'.
 */
export function validateSlug(input: string): 'empty' | 'invalid' | 'valid' {
  if (!input || !input.trim()) {
    return 'empty';
  }
  
  const normalized = normalizeSlug(input);
  if (!normalized) {
    return 'invalid';
  }
  
  // A valid slug after normalization must match the same characters
  // or be non-empty and safe. If the user tried to enter only invalid characters,
  // normalized might be empty.
  return 'valid';
}
