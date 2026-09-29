/**
 * Resolve the S3 object key behind a control's stored evidence reference.
 *
 * `FrameworkControl.evidence` holds either the object URL recorded at upload
 * time (`https://<bucket>.s3.<region>.amazonaws.com/<key>` or the path-style
 * `https://s3.<region>.amazonaws.com/<bucket>/<key>`) or a bare object key.
 *
 * Uploads are always stored under `<organizationId>/...` (s3Service.uploadFile).
 * The evidence field is also writable through the control update API, so the
 * resolved key must stay inside the caller's organization prefix; otherwise a
 * presigned URL could be issued for another tenant's object in the shared bucket.
 */

function isPathStyleS3Host(hostname: string): boolean {
  if (hostname === 's3.amazonaws.com') {
    return true;
  }
  return (hostname.startsWith('s3.') || hostname.startsWith('s3-')) && hostname.endsWith('.amazonaws.com');
}

/**
 * Returns the object key when `evidence` points at an object under
 * `<organizationId>/`, otherwise `null`.
 */
export function resolveOrgEvidenceKey(
  evidence: string,
  organizationId: string,
  bucket?: string
): string | null {
  const reference = evidence.trim();
  if (!reference || !organizationId) {
    return null;
  }

  let key: string;
  let parsed: URL | null = null;
  try {
    parsed = new URL(reference);
  } catch {
    parsed = null;
  }

  if (parsed) {
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    let path = parsed.pathname;
    while (path.startsWith('/')) {
      path = path.slice(1);
    }
    if (bucket && isPathStyleS3Host(parsed.hostname.toLowerCase()) && path.startsWith(`${bucket}/`)) {
      path = path.slice(bucket.length + 1);
    }
    try {
      key = decodeURIComponent(path);
    } catch {
      return null;
    }
  } else {
    key = reference.split('?')[0];
  }

  if (!key.startsWith(`${organizationId}/`)) {
    return null;
  }
  // S3 keys are literal, but clients normalise dot segments in URL paths.
  if (key.split('/').some((segment) => segment === '..' || segment === '.')) {
    return null;
  }
  return key;
}
