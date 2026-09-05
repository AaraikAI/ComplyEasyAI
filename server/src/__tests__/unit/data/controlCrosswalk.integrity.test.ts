import { describe, it, expect } from '@jest/globals';
import { CONTROL_CROSSWALK } from '../../../data/frameworks/controlCrosswalk';
import frameworkTemplateService from '../../../services/frameworkTemplateService';

/**
 * Every crosswalk row must point at control ids that actually exist in the
 * registered templates, or the "Also Satisfies" links it produces are dead.
 * Strict for the frameworks added with this test; the pre-existing backlog of
 * dangling references is pinned so it can only shrink.
 */
const STRICT = new Set(['AIUC-1', 'India DPDPA']);

function idsFor(framework: string): Set<string> | null {
  const controls = frameworkTemplateService.getTemplatesForFramework(framework);
  return controls.length ? new Set(controls.map(c => c.controlId)) : null;
}

describe('control crosswalk integrity', () => {
  const cache = new Map<string, Set<string> | null>();
  const lookup = (fw: string) => {
    if (!cache.has(fw)) cache.set(fw, idsFor(fw));
    return cache.get(fw)!;
  };

  const dangling = CONTROL_CROSSWALK.flatMap((m, index) => {
    const problems: string[] = [];
    const src = lookup(m.sourceFramework);
    const tgt = lookup(m.targetFramework);
    if (src && !src.has(m.sourceControlId)) problems.push(`row ${index}: ${m.sourceFramework} ${m.sourceControlId} does not exist`);
    if (tgt && !tgt.has(m.targetControlId)) problems.push(`row ${index}: ${m.targetFramework} ${m.targetControlId} does not exist`);
    return problems.map(p => ({ p, strict: STRICT.has(m.sourceFramework) || STRICT.has(m.targetFramework) }));
  });

  it('has no dangling control references for AIUC-1 or India DPDPA', () => {
    expect(dangling.filter(d => d.strict).map(d => d.p)).toEqual([]);
  });

  it('has crosswalk coverage for both new frameworks', () => {
    const count = (fw: string) => CONTROL_CROSSWALK.filter(m => m.sourceFramework === fw || m.targetFramework === fw).length;
    expect(count('AIUC-1')).toBeGreaterThanOrEqual(40);
    expect(count('India DPDPA')).toBeGreaterThanOrEqual(40);
  });

  it('does not grow the pre-existing set of dangling references', () => {
    const preexisting = dangling.filter(d => !d.strict).map(d => d.p);
    // Pinned at the count measured when this test was introduced; lower it as they are fixed.
    expect(preexisting.length).toBeLessThanOrEqual(PREEXISTING_DANGLING_BUDGET);
  });
});

// 25 dangling references existed when this test was introduced, all in pre-existing
// frameworks (listed in the PR that added it). Lower the budget as they are fixed.
const PREEXISTING_DANGLING_BUDGET = 25;
