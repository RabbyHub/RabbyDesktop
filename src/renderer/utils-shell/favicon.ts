export async function getImageBuffer(url: string) {
  return fetch(url)
    .then(response => response.arrayBuffer())
}

export function getFavicons(allUrls: string[]) {
  // if (!allUrls || !allUrls.length) {
  //   const links = Array.from(document.head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'));
  //   const metas = Array.from(document.head.querySelectorAll('meta[property="og:image"]'));

  //   allUrls = links
  //     .map(link => link.href)
  //     .concat(metas.map(meta => meta.content))
  //     .filter(url => url);
  // }

  // return Promise.all(allUrls.map(url => getImageBuffer(url)));
}
