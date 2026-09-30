/**
 * Plain-text extraction for RSS/Atom element content.
 *
 * Feed titles and descriptions are often HTML that has itself been entity
 * encoded (`&lt;p&gt;Rule update&lt;/p&gt;`). The steps below run in a fixed
 * order and each runs once:
 *
 * 1. unwrap a CDATA section;
 * 2. decode XML/HTML entities in a single pass, so `&amp;lt;` becomes the
 *    literal text `&lt;` and is never decoded a second time into `<`;
 * 3. strip markup with a single left-to-right scan: everything from a `<` to
 *    the next `>` is dropped, and a `<` without a closing `>` is dropped on its
 *    own. No `<` is ever copied to the output, so nested input such as
 *    `<scr<x>ipt>` cannot reassemble a tag, and the scan is linear.
 */

const CDATA_SECTION = /^<!\[CDATA\[([\s\S]*?)\]\]>$/;
const ENTITY = /&(?:(amp|lt|gt|quot|apos)|#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6}));/g;

function namedEntity(name: string): string {
  switch (name) {
    case 'amp':
      return '&';
    case 'lt':
      return '<';
    case 'gt':
      return '>';
    case 'quot':
      return '"';
    default:
      return "'";
  }
}

/** Decode the five XML entities plus decimal and hex character references. */
export function decodeXmlEntities(text: string): string {
  return text.replace(ENTITY, (match: string, named?: string, decimal?: string, hex?: string) => {
    if (named) {
      return namedEntity(named);
    }
    const codePoint = decimal !== undefined ? parseInt(decimal, 10) : parseInt(hex ?? '', 16);
    const isScalarValue =
      Number.isInteger(codePoint) &&
      codePoint >= 0 &&
      codePoint <= 0x10ffff &&
      !(codePoint >= 0xd800 && codePoint <= 0xdfff);
    return isScalarValue ? String.fromCodePoint(codePoint) : match;
  });
}

/** Remove markup; the result never contains `<` (see step 3 above). */
export function stripMarkup(text: string): string {
  let out = '';
  let index = 0;
  while (index < text.length) {
    const open = text.indexOf('<', index);
    if (open === -1) {
      out += text.slice(index);
      break;
    }
    out += text.slice(index, open);
    const close = text.indexOf('>', open + 1);
    if (close === -1) {
      // No `>` follows, so every remaining `<` is unterminated: keep the text
      // and drop only the brackets (in one pass, keeping the scan linear).
      out += text.slice(open + 1).split('<').join('');
      break;
    }
    index = close + 1;
  }
  return out;
}

/** Plain text of one feed element's inner content (see module comment). */
export function feedTextContent(raw: string): string {
  let content = raw.trim();
  const cdata = CDATA_SECTION.exec(content);
  if (cdata) {
    content = cdata[1];
  }
  return stripMarkup(decodeXmlEntities(content)).trim();
}
