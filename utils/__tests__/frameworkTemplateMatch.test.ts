import { describe, it, expect } from 'vitest';
import { findTemplateForFramework } from '../frameworkTemplateMatch';

// Registry order matters for the first-match behaviour this replaces: 'ISO 27017' precedes
// 'ISO 27017:2026', 'PCI DSS' precedes 'PCI DSS v4.0', and 'CPA' (Colorado) precedes 'SOC 3'.
const templates = [
  { frameworkType: 'PCI DSS', displayName: 'PCI DSS v4.0', aliases: ['PCI-DSS', 'pci dss'] },
  { frameworkType: 'ISO 27017', displayName: 'ISO 27017:2015 (withdrawn)', aliases: ['ISO27017', 'ISO 27017:2015', 'ISO/IEC 27017'] },
  { frameworkType: 'ISO 27017:2026', displayName: 'ISO 27017:2026', aliases: ['ISO/IEC 27017:2026', 'ISO 27017 2026'] },
  { frameworkType: 'CPA', displayName: 'Colorado Privacy Act', aliases: ['Colorado Privacy'] },
  { frameworkType: 'SOC 3', displayName: 'SOC 3', aliases: ['AICPA SOC 3'] },
  { frameworkType: 'PCI DSS v4.0', displayName: 'PCI DSS v4.0.1', aliases: ['PCI v4'] },
  { frameworkType: 'FDA 21 CFR Part 11', displayName: 'FDA 21 CFR Part 11', aliases: [] },
  { frameworkType: 'SOC 2 Type II', displayName: 'SOC 2 Type II' },
];

const match = (name: string) => findTemplateForFramework(templates, name)?.frameworkType;

describe('findTemplateForFramework', () => {
  it('keeps the bare ISO 27017 name on the 2015 template', () => {
    expect(match('ISO 27017')).toBe('ISO 27017');
  });

  it('matches ISO 27017:2026 to the 2026 template, not the withdrawn 2015 one', () => {
    expect(match('ISO 27017:2026')).toBe('ISO 27017:2026');
    expect(match('ISO/IEC 27017:2026')).toBe('ISO 27017:2026');
    expect(match('iso 27017 2026')).toBe('ISO 27017:2026');
  });

  it('resolves aliases before display names, like the server resolver', () => {
    expect(match('ISO/IEC 27017')).toBe('ISO 27017');
    expect(match('AICPA SOC 3')).toBe('SOC 3');
    expect(match('PCI DSS v4.0')).toBe('PCI DSS v4.0');
  });

  it('matches display names case-insensitively', () => {
    expect(match('iso 27017:2015 (withdrawn)')).toBe('ISO 27017');
    expect(match('colorado privacy act')).toBe('CPA');
  });

  it('prefers the longest template key contained in a free-text name', () => {
    expect(match('ISO 27017:2026 cloud programme')).toBe('ISO 27017:2026');
    expect(match('PCI DSS v4.0 scope A')).toBe('PCI DSS v4.0');
  });

  it('falls back to a template key that contains a shorter name', () => {
    expect(match('21 CFR Part 11')).toBe('FDA 21 CFR Part 11');
  });

  it('returns undefined for an empty or unknown name', () => {
    expect(match('')).toBeUndefined();
    expect(match('Totally Unknown Standard')).toBeUndefined();
  });

  it('works when templates carry no alias list', () => {
    expect(match('SOC 2 Type II')).toBe('SOC 2 Type II');
  });
});
