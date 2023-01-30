export async function copyText(text: string | number = '') {
  return window.navigator.clipboard.writeText(`${text}`);
}
