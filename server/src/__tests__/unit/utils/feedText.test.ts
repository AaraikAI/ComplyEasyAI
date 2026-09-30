import { describe, it, expect } from '@jest/globals';
import { decodeXmlEntities, feedTextContent } from '../../../utils/feedText';

describe('feedText', () => {
  describe('decodeXmlEntities', () => {
    it('decodes named, decimal and hex references', () => {
      expect(decodeXmlEntities('a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos; &#65;&#x42;&#X43;')).toBe(
        'a & b <c> "d" \'e\' ABC'
      );
    });

    it('decodes each reference exactly once', () => {
      expect(decodeXmlEntities('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;');
    });

    it('leaves invalid code points untouched', () => {
      expect(decodeXmlEntities('&#xD800; &#9999999;')).toBe('&#xD800; &#9999999;');
    });
  });

  describe('feedTextContent', () => {
    it('unwraps CDATA and strips markup', () => {
      expect(feedTextContent('<![CDATA[<p>New <b>rule</b> published</p>]]>')).toBe('New rule published');
    });

    it('strips entity-encoded markup', () => {
      expect(feedTextContent('&lt;p&gt;Guidance update&lt;/p&gt;')).toBe('Guidance update');
    });

    it('keeps double-encoded text as literal text rather than markup', () => {
      expect(feedTextContent('&amp;lt;script&amp;gt;alert(1)')).toBe('&lt;script&gt;alert(1)');
    });

    it.each([
      ['<scr<x>ipt>alert(1)</script>'],
      ['&lt;scr&lt;x&gt;ipt&gt;alert(1)'],
      ['<<script>script>alert(1)'],
      ['<img src=x onerror=alert(1)'],
    ])('never returns markup for %s', (raw) => {
      expect(feedTextContent(raw)).not.toContain('<');
    });

    it('keeps the text around an unterminated bracket', () => {
      expect(feedTextContent('Thresholds &lt; 10,000 apply')).toBe('Thresholds  10,000 apply');
    });

    it.each([
      ['a run of open brackets', '<'.repeat(100000)],
      ['open brackets closed once at the end', '<'.repeat(100000) + '>'],
      ['alternating brackets', '<a>'.repeat(50000)],
    ])('runs in linear time on %s', (_label, input) => {
      const start = process.hrtime.bigint();
      feedTextContent(input);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      expect(elapsedMs).toBeLessThan(500);
    });
  });
});
