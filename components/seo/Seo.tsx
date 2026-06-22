import React from 'react';

const SITE_ORIGIN = 'https://complyeasyai.com';
const SITE_NAME = 'ComplyEasy AI';
const DEFAULT_OG_IMAGE = '/og/default-og.svg';

export interface SeoProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  keywords?: string;
}

/** Resolve a possibly-relative asset path to an absolute URL on the site origin. */
function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE_ORIGIN + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

/**
 * Per-page document metadata. React 19 hoists rendered <title>/<meta>/<link>
 * into <head>, so no metadata library is required. Inner pages render this to
 * override the site-wide defaults set in App.tsx and the static fallbacks in
 * index.html.
 */
const Seo: React.FC<SeoProps> = ({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = 'website',
  noindex = false,
  keywords,
}) => {
  const canonicalUrl =
    SITE_ORIGIN + (canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath);
  const imageUrl = toAbsoluteUrl(ogImage ?? DEFAULT_OG_IMAGE);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonicalUrl} />
      {noindex ? <meta name="robots" content="noindex,follow" /> : null}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
};

export default Seo;
export { Seo };
