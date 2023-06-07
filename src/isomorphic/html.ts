import { coerceNumber } from './primitive';

export function parseFavIconSize(
  inputSizes: ISiteMetaData['favicons'][number]['sizes']
) {
  const sizes = inputSizes
    .split(' ')
    .filter(Boolean)
    .map((s) => {
      const parsed = s.toLowerCase().split('x');
      const x = coerceNumber(parsed[0], 0);
      const y = coerceNumber(parsed[1], 0);

      return { size: x, x, y };
    });

  return sizes;
}

const findLargestFavIcon = (icons: ISiteMetaData['favicons']) => {
  let largest = null as { href: string; size: number } | null;
  icons.forEach((icon) => {
    const sizes = parseFavIconSize(icon.sizes);
    /**
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
     * link 的 sizes 字段可以写多个长宽比，以空格拆分，且 100x100 和 100X100 都是合法的
     * 这里无脑认为 link 的图标都是 1:1 的，且取 x 之前的宽度来计算
     * */
    let maxSize = Math.max(...sizes.map((x) => x.size));
    const parts = icon.href.split('.');
    const ext = parts[parts.length - 1];
    if (ext && ext !== 'ico') {
      // 因为 .ico 文件不能转 base64，所以给非 ico 文件加权，确保同尺寸时取非 ico 文件做 favicon
      maxSize += 1;
    }
    if (!largest) {
      largest = {
        href: icon.href,
        size: maxSize,
      };
    } else if (maxSize > largest.size) {
      largest = {
        href: icon.href,
        size: maxSize,
      };
    }
  });

  return largest?.href;
};

const findSizeLessFavIcon = (icons: ISiteMetaData['linkRelIcons']) => {
  return icons.find((icon) => {
    return !icon.sizes;
  });
};

/**
 * @description in general, the icon without size is clear
 */
export function pickFavIconURLFromMeta(
  sitemeta: Pick<ISiteMetaData, 'linkRelIcons' | 'favicons'>
) {
  return (
    findSizeLessFavIcon(sitemeta.linkRelIcons)?.href ||
    findLargestFavIcon(sitemeta.favicons) ||
    ''
  );
}

export function extractCssTagsFromHtmlInBrowser(input: string) {
  const isBrowserEnvironment =
    typeof document !== 'undefined' && document.documentElement;

  if (!isBrowserEnvironment) {
    throw new Error(`This function is only available in browser environment.`);
  }

  if (!input) {
    input = document.documentElement.innerHTML;
  }

  const allCssTags = [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');

  // Extract <style> tags
  const styleTags = doc.getElementsByTagName('style');
  for (let i = 0; i < styleTags.length; i++) {
    allCssTags.push(styleTags[i].innerHTML);
  }

  // Extract <link rel="stylesheet"> tags
  const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
  for (let j = 0, linkTag: HTMLLinkElement; j < linkTags.length; j++) {
    linkTag = linkTags[j] as HTMLLinkElement;
    allCssTags.push(`/* ${linkTag.href} */`);
  }

  return allCssTags.join('\n');
}

const CSS_TAGS_PATTERN =
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>|<link\b[^>]*rel=["']?stylesheet["']?\b[^>]*>/gi;
const LINK_TAG_PATTERN = /<link\b[^>]*rel=["']?stylesheet["']?\b[^>]*>/i;
const STYLE_TAG_PATTERN = /<style\b[^>]*>([\s\S]*?)<\/style>/i;
export function extractCssTagsFromHtml(input: string) {
  if (!input) {
    throw new Error(
      'In a non-browser environment, the input parameter is required.'
    );
  }

  const matches = input.match(CSS_TAGS_PATTERN);
  const allCssFeatures: string[] = [];

  matches?.forEach((match) => {
    if (LINK_TAG_PATTERN.test(match)) {
      const hrefMatch = match.match(/href=(?:"([^"]+)"|'([^']+)')/i);
      if (hrefMatch) {
        const href = hrefMatch[1] || hrefMatch[2];
        if (href.trim() !== '') {
          allCssFeatures.push(href.trim());
        }
      }
    } else if (STYLE_TAG_PATTERN.test(match)) {
      const cssMatch = match.match(STYLE_TAG_PATTERN);
      if (cssMatch) {
        const cssContent = cssMatch[1];
        if (cssContent.trim() !== '') {
          allCssFeatures.push(cssContent.trim());
        }
      }
    }
  });

  return allCssFeatures.join('\n');
}
