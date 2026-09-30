/**
 * Match an organization framework name to its pre-built control template.
 *
 * The order mirrors the server's resolveFrameworkKey (exact template key, then alias, then
 * case-insensitive alias and key), so the Apply button applies the template the server would
 * pick for the same name. Display names are checked next. Only then does a substring fallback
 * run for free-text names, and it prefers the longest template key contained in the name:
 * first-match substring matching let "ISO 27017:2026" pick the withdrawn "ISO 27017" template
 * and "AICPA SOC 3" pick "CPA".
 */
export interface FrameworkTemplateRef {
  frameworkType: string;
  displayName: string;
  aliases?: string[];
}

export function findTemplateForFramework<T extends FrameworkTemplateRef>(
  templates: T[],
  frameworkName: string
): T | undefined {
  const name = frameworkName.trim();
  if (!name) return undefined;
  const lower = name.toLowerCase();

  const byKey = templates.find(t => t.frameworkType === name);
  if (byKey) return byKey;

  const byAlias = templates.find(t => t.aliases?.includes(name));
  if (byAlias) return byAlias;

  const byAliasInsensitive = templates.find(t => t.aliases?.some(a => a.toLowerCase() === lower));
  if (byAliasInsensitive) return byAliasInsensitive;

  const byKeyInsensitive = templates.find(t => t.frameworkType.toLowerCase() === lower);
  if (byKeyInsensitive) return byKeyInsensitive;

  const byDisplayName = templates.find(t => t.displayName.toLowerCase() === lower);
  if (byDisplayName) return byDisplayName;

  let best: T | undefined;
  for (const t of templates) {
    if (name.includes(t.frameworkType) && (!best || t.frameworkType.length > best.frameworkType.length)) {
      best = t;
    }
  }
  if (best) return best;

  // Last resort: a shorter name inside a template key ("21 CFR Part 11" -> "FDA 21 CFR Part 11").
  return templates.find(t => t.frameworkType.includes(name));
}
