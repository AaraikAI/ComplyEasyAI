import { describe, it, expect } from '@jest/globals';
import { CONTROL_CROSSWALK, getMappingsBetweenFrameworks } from '../../../data/frameworks/controlCrosswalk';
import { ISO27001_CONTROLS } from '../../../data/frameworks/iso27001Controls';
import frameworkTemplateService from '../../../services/frameworkTemplateService';

/**
 * Every crosswalk row must point at control ids that actually exist in the
 * registered templates, or the "Also Satisfies" links it produces are dead.
 * Strict for the frameworks added with this test; the pre-existing backlog of
 * dangling references is pinned so it can only shrink.
 */
const STRICT = new Set(['AIUC-1', 'India DPDPA', 'ISO 27017:2026']);

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

  it('has no dangling control references for AIUC-1, India DPDPA or ISO 27017:2026', () => {
    expect(dangling.filter(d => d.strict).map(d => d.p)).toEqual([]);
  });

  it('has crosswalk coverage for the strictly checked frameworks', () => {
    const count = (fw: string) => CONTROL_CROSSWALK.filter(m => m.sourceFramework === fw || m.targetFramework === fw).length;
    expect(count('AIUC-1')).toBeGreaterThanOrEqual(40);
    expect(count('India DPDPA')).toBeGreaterThanOrEqual(40);
    expect(count('ISO 27017:2026')).toBeGreaterThanOrEqual(130);
  });

  describe('ISO 27017:2026', () => {
    const CLOUD_SPECIFIC = new Set(['ISO27017-2026-5.38', 'ISO27017-2026-5.39', 'ISO27017-2026-8.35', 'ISO27017-2026-8.36']);
    const controls2026 = frameworkTemplateService.getTemplatesForFramework('ISO 27017:2026');
    const rows2026 = CONTROL_CROSSWALK.filter(m => m.sourceFramework === 'ISO 27017:2026' || m.targetFramework === 'ISO 27017:2026');

    it('names each of the 93 sections after the ISO 27001:2022 Annex A control with the same number', () => {
      const annexA = new Map(ISO27001_CONTROLS.map(c => [c.controlId, c.name]));
      const shared = controls2026.filter(c => !CLOUD_SPECIFIC.has(c.controlId));
      expect(shared).toHaveLength(93);
      for (const c of shared) {
        expect(`${c.controlId} ${c.name}`).toBe(`${c.controlId} ${annexA.get(c.controlId.replace('ISO27017-2026-', 'A.'))}`);
      }
    });

    it('maps every non-cloud-specific control to the same-numbered ISO 27001 Annex A control', () => {
      for (const c of controls2026.filter(x => !CLOUD_SPECIFIC.has(x.controlId))) {
        const row = rows2026.find(m => m.sourceControlId === c.controlId && m.targetFramework === 'ISO 27001');
        expect(row && [row.targetControlId, row.mappingType]).toEqual([c.controlId.replace('ISO27017-2026-', 'A.'), 'equivalent']);
      }
    });

    it('maps each cloud-specific control to ISO 27001, SOC 2, NIST 800-53 and FedRAMP, never as equivalent', () => {
      for (const id of CLOUD_SPECIFIC) {
        const rows = rows2026.filter(m => m.sourceControlId === id);
        expect(new Set(rows.map(m => m.targetFramework))).toEqual(new Set(['ISO 27001', 'SOC 2 Type II', 'NIST 800-53', 'FedRAMP']));
        expect(rows.every(m => m.mappingType !== 'equivalent')).toBe(true);
      }
    });

    it('has no duplicate rows and uses base control ids only', () => {
      const keys = rows2026.map(m => `${m.sourceFramework}|${m.sourceControlId}|${m.targetFramework}|${m.targetControlId}`);
      expect(new Set(keys).size).toBe(keys.length);
      expect(rows2026.filter(m => /[():]/.test(m.sourceControlId + m.targetControlId))).toEqual([]);
    });

    it('resolves 2026 spellings to the 2026 rows and keeps the 2015 rows separate', () => {
      const to27001 = rows2026.filter(m => m.targetFramework === 'ISO 27001').length;
      expect(getMappingsBetweenFrameworks('ISO/IEC 27017:2026', 'ISO 27001')).toHaveLength(to27001);
      expect(getMappingsBetweenFrameworks('iso 27017 2026', 'ISO 27001:2022')).toHaveLength(to27001);
      // The 2015 edition keeps exactly its own seven ISO 27001 rows under every 2015 spelling.
      for (const legacy of ['ISO 27017', 'ISO/IEC 27017', 'ISO 27017:2015']) {
        const rows = getMappingsBetweenFrameworks(legacy, 'ISO 27001');
        expect(rows).toHaveLength(7);
        expect(rows.every(m => m.sourceControlId.startsWith('ISO27017-') && !m.sourceControlId.startsWith('ISO27017-2026-'))).toBe(true);
      }
    });

    it('links every 2015 control to a 2026 control for organizations holding both editions', () => {
      const legacyIds = frameworkTemplateService.getTemplatesForFramework('ISO 27017').map(c => c.controlId);
      const transition = getMappingsBetweenFrameworks('ISO 27017', 'ISO 27017:2026');
      expect(new Set(transition.map(m => m.sourceControlId))).toEqual(new Set(legacyIds));
      expect(transition.every(m => m.sourceFramework === 'ISO 27017' && m.targetControlId.startsWith('ISO27017-2026-'))).toBe(true);
    });
  });

  it('does not grow the pre-existing set of dangling references', () => {
    const preexisting = dangling.filter(d => !d.strict).map(d => d.p);
    // Rows past the budget are listed verbatim on failure. The budget is 0: every row must resolve.
    expect(preexisting.slice(PREEXISTING_DANGLING_BUDGET)).toEqual([]);
  });
});

// 25 dangling references existed when this test was introduced, all ISO 27017 rows labelled
// "ISO27017-CLD.x.y" (ids no template defines). They were re-pointed at real template ids, so
// the budget is 0 and must stay there: this test can only get stricter.
const PREEXISTING_DANGLING_BUDGET = 0;
