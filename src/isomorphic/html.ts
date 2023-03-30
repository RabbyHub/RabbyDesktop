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
