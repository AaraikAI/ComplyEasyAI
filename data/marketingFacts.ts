import { FRAMEWORK_PILLARS } from './frameworkPillarContent';

/**
 * Facts repeated across the marketing pages, kept in one place so the copy
 * cannot drift from the product. Plan names follow the tier gating in
 * constants/tierFeatures.ts (mirrors server/src/config/tiers.ts).
 */

/** Joins items as "A, B and C". */
export function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Frameworks with a dedicated guide page, in catalogue order. */
export const FRAMEWORK_GUIDE_NAMES: string[] = Object.values(FRAMEWORK_PILLARS).map(
  (pillar) => pillar.name,
);

/** "SOC 2, ISO 27001, … and CSRD". */
export const FRAMEWORK_GUIDE_LIST = joinWithAnd(FRAMEWORK_GUIDE_NAMES);

/** Plans that include the full aCOS loop (tier feature `acosGoals`). */
export const ACOS_PLANS = 'Growth and Visionary';

/** Plan that includes the EU AI Act, DORA, DMA and DSA (tier features `euAiAct`, `dma`, `dsa`). */
export const EU_STACK_PLAN = 'Visionary';
