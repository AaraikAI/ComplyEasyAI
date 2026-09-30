import React from 'react';
import { SITE_ORIGIN } from './siteOrigin';
import { BRAND_NAME, DEFAULT_OG_IMAGE } from './brand';

export interface SeoProps {
  title: string;
  description: string;
  canonicalPath: string;
  /** Share image path or URL. Defaults to the 1200x630 PNG social card. */
  ogImage?: string;
  /** Pixel size of a custom ogImage; emitted as og:image:width/height when given. */
  ogImageWidth?: number;
  ogImageHeight?: number;
  /** Alt text for a custom ogImage. */
  ogImageAlt?: string;
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
  ogImageWidth,
  ogImageHeight,
  ogImageAlt,
  ogType = 'website',
  noindex = false,
  keywords,
}) => {
  const canonicalUrl =
    SITE_ORIGIN + (canonicalPath.startsWith('/') ? canonicalPath : '/' + canonicalPath);
  const usesDefaultImage = ogImage === undefined;
  const imageUrl = usesDefaultImage ? DEFAULT_OG_IMAGE.url : toAbsoluteUrl(ogImage);
  const imageWidth = usesDefaultImage ? DEFAULT_OG_IMAGE.width : ogImageWidth;
  const imageHeight = usesDefaultImage ? DEFAULT_OG_IMAGE.height : ogImageHeight;
  const imageAlt = usesDefaultImage ? DEFAULT_OG_IMAGE.alt : ogImageAlt;

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
      {usesDefaultImage ? <meta property="og:image:type" content={DEFAULT_OG_IMAGE.type} /> : null}
      {imageWidth ? <meta property="og:image:width" content={String(imageWidth)} /> : null}
      {imageHeight ? <meta property="og:image:height" content={String(imageHeight)} /> : null}
      {imageAlt ? <meta property="og:image:alt" content={imageAlt} /> : null}
      <meta property="og:site_name" content={BRAND_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {imageAlt ? <meta name="twitter:image:alt" content={imageAlt} /> : null}
    </>
  );
};

export default Seo;
export { Seo };
