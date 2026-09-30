import { describe, it, expect } from '@jest/globals';
import { resolveOrgEvidenceKey } from '../../../utils/evidenceKey';

const ORG = 'org-123';
const BUCKET = 'complyeasy-evidence';

describe('resolveOrgEvidenceKey', () => {
  it('extracts the key from a virtual-hosted S3 URL', () => {
    expect(
      resolveOrgEvidenceKey(
        `https://${BUCKET}.s3.us-east-1.amazonaws.com/${ORG}/frameworks/f1/controls/c1/a.pdf`,
        ORG,
        BUCKET
      )
    ).toBe(`${ORG}/frameworks/f1/controls/c1/a.pdf`);
  });

  it('drops the bucket segment of a path-style S3 URL', () => {
    expect(
      resolveOrgEvidenceKey(`https://s3.us-east-1.amazonaws.com/${BUCKET}/${ORG}/uploads/a.pdf?x=1`, ORG, BUCKET)
    ).toBe(`${ORG}/uploads/a.pdf`);
  });

  it('accepts a bare key inside the organization prefix', () => {
    expect(resolveOrgEvidenceKey(`${ORG}/uploads/a.pdf`, ORG, BUCKET)).toBe(`${ORG}/uploads/a.pdf`);
  });

  it.each([
    ['another tenant bare key', 'org-999/uploads/a.pdf'],
    ['another tenant URL', `https://${BUCKET}.s3.amazonaws.com/org-999/uploads/a.pdf`],
    ['look-alike host with a foreign key', 'https://amazonaws.com.evil.io/org-999/a.pdf'],
    ['dot segments', `${ORG}/../org-999/a.pdf`],
    ['encoded dot segments', `https://${BUCKET}.s3.amazonaws.com/${ORG}/%2e%2e/org-999/a.pdf`],
    ['prefix without separator', `${ORG}-other/a.pdf`],
    ['non-http scheme', `ftp://${BUCKET}.s3.amazonaws.com/${ORG}/a.pdf`],
    ['free text', 'see the shared drive'],
    ['empty', '   '],
  ])('rejects %s', (_label, evidence) => {
    expect(resolveOrgEvidenceKey(evidence, ORG, BUCKET)).toBeNull();
  });
});
